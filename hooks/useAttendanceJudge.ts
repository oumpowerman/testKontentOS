import { supabase } from '../lib/supabase';
import { format, subDays, isBefore, startOfDay } from 'date-fns';
import th from 'date-fns/locale/th';
import { User, AnnualHoliday, AttendanceLog, LeaveRequest } from '../types';
import { isWorkingDay, isUserOnLeave } from '../utils/judgeUtils';
import { toValidUuid } from '../utils/gamificationUtils';
import { mergeAttendanceNotes } from '../lib/attendanceUtils';

export const useAttendanceJudge = (
    currentUser: User | null,
    isProcessingRef: React.MutableRefObject<Set<string>>,
    processAction: any,
    config: any,
    gameLogs: any[],
    notifications: any[],
    isLoading: boolean
) => {
    // Helper to check if a penalty already exists (Check local memory first, then DB for robustness)
    const hasPenaltyInLogs = async (actionType: string, relatedId?: string, descriptionMatch?: string) => {
        if (isLoading || !currentUser) return true; // Assume exists while loading or if no user
        const targetId = toValidUuid(relatedId || null);

        // 1. Check local context logs first (Fast)
        const localMatch = gameLogs.some(log => {
            // Check if log belongs to current user (Crucial for Admins)
            const matchUser = log.user_id === currentUser.id;
            if (!matchUser) return false;
            
            const matchType = log.action_type === actionType;
            // Robust check: Log might store targetId as string or UUID depending on DB state
            const logRelatedId = typeof log.related_id === 'string' ? log.related_id : JSON.stringify(log.related_id);
            const matchId = !targetId || logRelatedId === targetId;
            const matchDesc = !descriptionMatch || (log.description && log.description.includes(descriptionMatch));
            return matchType && matchId && matchDesc;
        });

        if (localMatch) return true;

        // 2. If not in local logs (e.g. pushed out of last 100), check DB directly (Robust)
        if (targetId) {
            try {
                const { data, error } = await supabase
                    .from('game_logs')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('related_id', targetId) // DB column is UUID, targetId from toValidUuid is UUID
                    .maybeSingle();
                
                if (data) return true;
                if (error) console.error("[AttendanceJudge] DB Penalty Check Error:", error);
            } catch (err) {
                console.error("[AttendanceJudge] DB sync error for penalty:", err);
            }
        }

        return false;
    };

    const hasNotification = (type: string, messageMatch: string) => {
        if (isLoading) return true; // Assume exists while loading to be safe
        return notifications.some(n => n.type === type && n.message && n.message.includes(messageMatch));
    };

    const runAttendanceChecks = async (
        today: Date,
        todayStr: string,
        holidays: AnnualHoliday[],
        exceptions: any[],
        userLeaves: any[],
        attendanceLogs: any[]
    ) => {
        if (!currentUser) return;

        // =========================================================
        // SECTION C: ABSENT (เช็คการขาดงานย้อนหลัง)
        // =========================================================
        const absentLookbackDays = 7;
        for (let i = 1; i <= absentLookbackDays; i++) {
            const checkDate = subDays(today, i);
            const checkDateStr = format(checkDate, 'yyyy-MM-dd');

            // 1. เช็คว่าเป็นวันทำงานไหม? (อัปเกรดให้เช็ควันหยุดบริษัทและข้อยกเว้นด้วย)
            if (!isWorkingDay(checkDate, holidays, exceptions, currentUser)) continue;

            // 1.1 เช็คว่าก่อนวันเริ่มงานไหม? (กันหักคะแนนย้อนหลังสำหรับสมาชิกใหม่)
            // หากไม่มี startDate ให้ใช้ createdAt แทน (กันกรณีเพิ่งสมัครแล้วโดนหักคะแนนย้อนหลัง)
            const effectiveStartDate = currentUser.startDate || (currentUser.createdAt ? new Date(currentUser.createdAt) : today);
            if (isBefore(startOfDay(checkDate), startOfDay(effectiveStartDate))) {
                continue;
            }

            // 2. เช็คว่าลาไหม? (APPROVED หรือ PENDING)
            const leaveCheck = isUserOnLeave(checkDateStr, userLeaves);
            if (leaveCheck.onLeave) {
                if (leaveCheck.status === 'PENDING') {
                    // ถ้ายังรออนุมัติ ให้แจ้งเตือนว่าระบบรอก่อน (กันหักซ้ำซ้อน)
                    const alreadyNotified = hasNotification('INFO', checkDateStr);
                    if (!alreadyNotified) {
                        const lockKey = `PENDING-LEAVE-${checkDateStr}`;
                        if (!isProcessingRef.current.has(lockKey)) {
                            isProcessingRef.current.add(lockKey);
                            try {
                                const checkDateThai = format(checkDate, 'd MMM Locale', { locale: th }).replace('Locale', '');
                                await supabase.from('notifications').insert({
                                    user_id: currentUser.id,
                                    type: 'INFO',
                                    title: '⏳ รอดำเนินการ: ใบลาค้างตรวจสอบ',
                                    message: `วันที่ ${checkDateThai} ระบบตรวจพบว่าคุณขาดงาน แต่มีการส่งใบลาค้างไว้ ระบบจะระงับการหักคะแนนชั่วคราว เนื่องจากคุณมีใบลาที่รอการอนุมัติ หากใบลาถูกปฏิเสธ ระบบจะดำเนินการหักคะแนนตามปกติ`,
                                    is_read: false,
                                    link_path: 'LEAVE'
                                });
                            } catch (err) {
                                console.error("[AttendanceJudge] Failed to insert pending leave notification:", err);
                                isProcessingRef.current.delete(lockKey);
                            }
                        }
                    }
                }
                continue;
            }

            // 3. ดูว่ามีการลงเวลาไหม? (ใช้ข้อมูลจาก Context แทนการ fetch)
            const attendance = attendanceLogs.find(log => log.date === checkDateStr);

            // 4. ถ้าไม่มี Log เลย หรือมี Log แต่สถานะไม่ใช่การทำงาน/ลา
            // 🔒 [STRICT GUARD] ป้องกันการเขียนทับสถานะที่ถูกต้องอยู่แล้ว (เช่น WORKING, COMPLETED, PENDING_VERIFY)
            // หากมี checkInTime อยู่แล้ว ห้ามระบุว่าเป็น ABSENT เด็ดขาด
            const isPossiblyAbsent = !attendance || (attendance.status?.toUpperCase() === 'ABSENT' && !attendance.checkInTime);
            
            // หากมี Log อยู่ในเครื่องแล้วและมีเวลาเข้างาน หรือสถานะไม่ใช่ ABSENT ห้ามทำอะไรทั้งสิ้น
            const hasValidWorkStatus = attendance && (
                attendance.checkInTime || 
                !['ABSENT'].includes(attendance.status?.toUpperCase())
            );

            if (isPossiblyAbsent && !hasValidWorkStatus) {
                 // เช็คว่าเคยโดนหักคะแนน Absent ของวันนี้ไปหรือยัง (กันหักซ้ำ)
                 const absentLockKey = `ABSENT-${checkDateStr}`;

                 if (!isProcessingRef.current.has(absentLockKey)) {
                     // ตรวจสอบจาก game_logs ใน Context ว่าเคยโดนหักคะแนน Absent หรือยัง
                     const alreadyPenalized = await hasPenaltyInLogs('ATTENDANCE_ABSENT', `ABSENT:${checkDateStr}`);

                     if (alreadyPenalized) {
                         // ถ้ามี Penalty ใน Log แล้ว ห้ามเขียนทับข้อมูลมั่วซั่ว
                         continue;
                     }

                     isProcessingRef.current.add(absentLockKey);

                     try {
                         // 🔥 [FINAL GUARD] ตรวจสอบอีกครั้งใน DB ว่าไม่มีเช็คอินจริงๆ ใช่ไหม และสถานะไม่ใช่สถานะปกป้อง ก่อนจะเขียนทับเป็น ABSENT
                         const { data: dbCheck, error: dbError } = await supabase
                            .from('attendance_logs')
                            .select('id, check_in_time, status')
                            .eq('user_id', currentUser.id)
                            .eq('date', checkDateStr)
                            .maybeSingle();
                         
                         // ถ้ามี Error หรือพบข้อมูลที่ไม่ควรทับ ให้ยกเลิกการหักคะแนน
                         if (dbError) {
                            console.error(`[AutoJudge] DB Error checking ${checkDateStr}:`, dbError);
                            isProcessingRef.current.delete(absentLockKey);
                            continue;
                         }

                         const dbStatus = dbCheck?.status?.toUpperCase() || '';
                         const hasTimeInDB = !!dbCheck?.check_in_time;
                         const isValidStatusInDB = dbCheck && !['ABSENT'].includes(dbStatus);

                         if (dbCheck && (hasTimeInDB || isValidStatusInDB)) {
                             console.log(`[AutoJudge] ABORT: Valid record found in DB for ${checkDateStr} (Status: ${dbStatus}, HasTime: ${hasTimeInDB})`);
                             continue;
                         }

                         // Insert/Upsert Absent Log and get the ID
                         const { data: newLog, error: insertError } = await supabase.from('attendance_logs').upsert({
                             user_id: currentUser.id,
                             date: checkDateStr,
                             status: 'ABSENT',
                             work_type: 'OFFICE',
                             note: '[SYSTEM] Auto-marked as Absent by Judge (Lookback Catch-up)'
                         }, { onConflict: 'user_id, date' }).select('id').maybeSingle();
                         
                         if (!insertError && newLog) {
                             // หักคะแนนขาดงาน
                             await processAction(currentUser.id, 'ATTENDANCE_ABSENT', { 
                                 date: checkDateStr,
                                 id: `ABSENT:${checkDateStr}`, // Use as idempotency key
                                 reason: `ABSENT_DATE:${checkDateStr}`,
                                 description: `ขาดงานในวันที่ ${format(checkDate, 'd MMM Locale', { locale: th }).replace('Locale', '')} (ไม่พบข้อมูลการลงเวลาทำงาน)`
                             });
                             
                             console.log(`[AutoJudge] ${currentUser.name} marked ABSENT for ${checkDateStr} (Lookback)`);
                         } else {
                             console.error("[AutoJudge] Failed to insert absent log:", insertError);
                         }
                     } catch (err) {
                         console.error("[AutoJudge] Error in absent processing:", err);
                         isProcessingRef.current.delete(absentLockKey);
                     }
                 }
            }
        }

        // =========================================================
        // SECTION D: AUTO-CLEANUP OLD CORRECTION REQUESTS
        // =========================================================
        const sevenDaysAgoStr = format(subDays(today, 7), 'yyyy-MM-dd');
        const oldRequests = userLeaves.filter(req => 
            req.status === 'PENDING' && 
            ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'].includes(req.type) &&
            req.createdAt && format(req.createdAt, 'yyyy-MM-dd') < sevenDaysAgoStr
        );

        if (oldRequests && oldRequests.length > 0) {
            for (const req of oldRequests) {
                if (isProcessingRef.current.has(`cleanup-${req.id}`)) continue;
                isProcessingRef.current.add(`cleanup-${req.id}`);

                try {
                    await supabase.from('leave_requests').update({
                        status: 'REJECTED',
                        rejection_reason: 'ระบบยกเลิกอัตโนมัติ (เกินกำหนดเวลาตรวจสอบ 7 วัน)'
                    }).eq('id', req.id);

                    await supabase.from('notifications').insert({
                        user_id: req.userId,
                        type: 'INFO',
                        title: '❌ คำขอถูกยกเลิกอัตโนมัติ',
                        message: `รายการ: ${req.type}\nเหตุผล: เกินกำหนดเวลาตรวจสอบ 7 วัน`,
                        is_read: false,
                        link_path: 'ATTENDANCE'
                    });

                    console.log(`[AutoJudge] Auto-rejected old request ${req.id}`);
                } finally {
                    isProcessingRef.current.delete(`cleanup-${req.id}`);
                }
            }
        }

        // =========================================================
        // SECTION E: FORGOTTEN CHECKOUT PENALTY (ลืมตอกบัตรออกข้ามวัน)
        // =========================================================
        const forgotCheckoutLogs = attendanceLogs.filter(log => 
            log.status === 'WORKING' && 
            !log.checkOutTime && 
            log.date < todayStr
        );

        if (forgotCheckoutLogs && forgotCheckoutLogs.length > 0) {
            for (const log of forgotCheckoutLogs) {
                const lockKey = `FORGOT-OUT-${log.id}`;
                if (isProcessingRef.current.has(lockKey)) continue;

                // 1. เช็คว่ามีคำขอแก้เวลา (Correction Request) ที่รออนุมัติของวันนี้หรือไม่
                const correctionCheck = isUserOnLeave(log.date, userLeaves);
                if (correctionCheck.onLeave && correctionCheck.status === 'PENDING') {
                    console.log(`[AutoJudge] Deferring forgot checkout penalty for ${log.date} because correction is PENDING.`);
                    continue;
                }
                
                // 2. ตรวจสอบจาก game_logs ใน Context (Robust Check)
                const alreadyPenalized = await hasPenaltyInLogs('ATTENDANCE_FORGOT_CHECKOUT', `FORGOT_OUT:${log.date}`);

                if (alreadyPenalized) {
                    // Recovery: ถ้าเคยหักแล้วแต่สถานะยังเป็น WORKING ให้แก้เป็น ACTION_REQUIRED เพื่อหยุด Loop
                    // FETCH FRESH NOTE TO PREVENT OVERWRITE
                    const { data: freshLog } = await supabase.from('attendance_logs').select('note').eq('id', log.id).maybeSingle();

                    await supabase.from('attendance_logs').update({
                        status: 'ACTION_REQUIRED',
                        note: mergeAttendanceNotes(freshLog?.note || log.note, `[SYSTEM] Status recovered (Penalized)`)
                    }).eq('id', log.id);
                    continue;
                }

                // 3. เช็คว่าเคยมี Notification ของวันนี้ส่งไปหรือยัง ใน Context
                const alreadyNotified = hasNotification('SYSTEM_LOCK_PENALTY', log.date);

                if (!alreadyNotified) {
                    isProcessingRef.current.add(lockKey);

                    try {
                        // FETCH FRESH NOTE TO PREVENT OVERWRITE
                        const { data: freshLog } = await supabase.from('attendance_logs').select('note').eq('id', log.id).maybeSingle();

                        // Update status to ACTION_REQUIRED
                        await supabase.from('attendance_logs').update({
                            status: 'ACTION_REQUIRED',
                            note: mergeAttendanceNotes(freshLog?.note || log.note, `[SYSTEM] Penalized for forgotten checkout`)
                        }).eq('id', log.id);
                        
                        // Penalty: Deduct HP
                        await processAction(currentUser.id, 'ATTENDANCE_FORGOT_CHECKOUT', {
                            date: log.date,
                            id: `FORGOT_OUT:${log.date}`, // Use as idempotency key
                            reason: `FORGOT_OUT_DATE:${log.date}`,
                            description: `ลืมตอกบัตรออกของวันที่ ${format(new Date(log.date), 'd MMM Locale', { locale: th }).replace('Locale', '')} ระบบได้ทำการหักคะแนนอัตโนมัติ`
                        });

                        const forgotCheckoutPenalty = config?.ATTENDANCE_RULES?.FORGOT_CHECKOUT?.hp ?? -10;

  //                      await supabase.from('notifications').insert({
  //                          user_id: currentUser.id,
  //                          type: 'SYSTEM_LOCK_PENALTY',
  //                          title: '⚠️ หักคะแนน: ลืมตอกบัตรออก',
  //                          message: `คุณลืมตอกบัตรออกของวันที่ ${log.date} ระบบได้ทำการหักคะแนน กรุณาส่งคำขอแจ้งเวลาออกย้อนหลังเพื่อขอคืนคะแนน`,
  //                          is_read: false,
  //                          link_path: 'ATTENDANCE',
  //                          metadata: { hp: forgotCheckoutPenalty, logId: log.id }
  //                      });

                        console.log(`[AutoJudge] Penalized forgotten checkout for ${log.date}`);
                    } catch (err) {
                        console.error("[AutoJudge] Error in forgot checkout processing:", err);
                        isProcessingRef.current.delete(lockKey);
                    }
                    // We don't delete from isProcessingRef to keep it locked in this session
                }
            }
        }
    };

    return { runAttendanceChecks };
};

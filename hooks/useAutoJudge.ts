
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useGamification } from './useGamification';
import { useGameConfig } from '../context/GameConfigContext';
import { useNotificationContext } from '../context/NotificationContext';
import { addDays, format, differenceInCalendarDays, isSameDay } from 'date-fns';
import { isTaskCompleted } from '../constants';
import { useAttendanceJudge } from './useAttendanceJudge';
import { useDutyJudge } from './useDutyJudge';
import { useTaskJudge } from './useTaskJudge';
import { isUserOnLeave, isHolidayOrException, countWorkingDaysBetween } from '../utils/judgeUtils';
import { toValidUuid } from '../utils/gamificationUtils';
import { useMasterData } from './useMasterData';
import { useUserSession } from '../context/UserSessionContext';

export const useAutoJudge = (currentUser: User | null) => {
    const { processAction } = useGamification(currentUser);
    const { config } = useGameConfig();
    const { gameLogs, notifications, isLoading } = useNotificationContext();
    const { annualHolidays, calendarExceptions } = useMasterData();
    const { leaveRequests, attendanceLogs } = useUserSession();
    
    const isProcessingRef = useRef<Set<string>>(new Set());

    const { runAttendanceChecks } = useAttendanceJudge(
        currentUser,
        isProcessingRef,
        processAction,
        config,
        gameLogs,
        notifications,
        isLoading
    );

    const { runDutyChecks } = useDutyJudge(
        currentUser,
        isProcessingRef,
        processAction,
        config,
        gameLogs,
        isLoading
    );

    const { runTaskChecks } = useTaskJudge(
        currentUser,
        isProcessingRef,
        processAction,
        config,
        gameLogs,
        isLoading
    );

    // Helper to check if a penalty already exists in memory
    const hasPenaltyInLogs = (actionType: string, relatedId?: string, descriptionMatch?: string) => {
        if (isLoading) return true; // Assume exists while loading to be safe
        const targetId = toValidUuid(relatedId || null);
        return gameLogs.some(log => {
            if (!currentUser) return false;
            // Check if log belongs to current user (Crucial for Admins)
            const matchUser = log.user_id === currentUser.id;
            if (!matchUser) return false;

            const matchType = log.action_type === actionType;
            // If relatedId is provided, it must match exactly.
            // This is our de-facto idempotency key.
            const matchId = !targetId || log.related_id === targetId;
            const matchDesc = !descriptionMatch || (log.description && log.description.includes(descriptionMatch));
            return matchType && matchId && matchDesc;
        });
    };

    const hasNotification = (type: string, messageMatch: string) => {
        if (isLoading) return true; // Assume exists while loading to be safe
        // Check ALL notifications in context. 
        // We should ensure NotificationContext maintains a reasonable history or check DB.
        // For now, we check if ANY notification (read or unread) exists with this message.
        return notifications.some(n => n.type === type && n.message && n.message.includes(messageMatch));
    };

    const checkAndPunish = useCallback(async () => {
        if (!currentUser || isLoading || !currentUser.isApproved) return;
        
        // Allow check if user is active OR if the user is in DEATH status (to catch resurrection)
        if (!currentUser.isActive && currentUser.status !== 'DEATH') return;
        
        try {
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');

            // Skip penalties if in DEATH status (unless we are checking for resurrection)
            const isDead = currentUser.status === 'DEATH';
            const isResurrecting = currentUser.hp > 0 && (currentUser.hpDepletedAt || isDead);

            console.log(`[AutoJudge] Service Tick: ${today.toLocaleTimeString()} - Checking logs for ${currentUser.name} (Status: ${currentUser.status})`);

            // --- CONFIG VALUES ---
            const negligencePenalty = config?.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20;
            const lookbackDays = config?.AUTO_JUDGE_CONFIG?.lookback_days_check || 60;

            // =========================================================
            // SECTION F: DEATH & RESURRECTION SYSTEM
            // =========================================================
            if (isResurrecting) {
                // Pre-check: Avoid duplicate notifications and redundant updates
                const alreadyNotified = hasNotification('RESURRECTION', 'หัวใจของคุณกลับมาเต้นอีกครั้ง');
                
                if (!alreadyNotified) {
                    console.log(`[AutoJudge] 🌟 RESURRECTION DETECTED: Restoring status for ${currentUser.name}`);
                    const { error: profileError } = await supabase.from('profiles').update({ 
                        hp_depleted_at: null,
                        status: 'ACTIVE',
                        is_active: true
                    }).eq('id', currentUser.id);
                    
                    if (profileError) {
                        console.error("[AutoJudge] Resurrection Profile Update Error:", profileError);
                        return;
                    }

                    // Create Resurrection Notification
                    const { error: notifError } = await supabase.from('notifications').insert({
                        user_id: currentUser.id,
                        type: 'RESURRECTION',
                        title: '🌟 ปาฏิหาริย์! คุณฟื้นคืนชีพแล้ว',
                        message: 'หัวใจของคุณกลับมาเต้นอีกครั้ง! พลังชีวิตได้รับการฟื้นฟูแล้ว ขอให้วันนี้เป็นการเริ่มต้นใหม่ที่ยอดเยี่ยมนะ!',
                        is_read: false
                    });

                    if (notifError) {
                        console.error("[AutoJudge] Resurrection Notification Error:", notifError);
                    } else {
                        console.log("[AutoJudge] 🌟 Resurrection Notification Created Successfully");
                    }
                }
                
                return; // Stop further checks for this tick after resurrection
            }

            if (isDead) return; // If still dead and not resurrecting, skip all other checks

            // =========================================================
            // SECTION: NORMAL PENALTY CHECKS (Duties, Tasks, Attendance)
            // =========================================================
            
            // 1.1 วันหยุดและข้อยกเว้นปฏิทิน (จาก Context)
            const holidays = annualHolidays.map((h:any) => ({
                id: h.id, name: h.name, day: h.day, month: h.month, typeKey: h.type_key, isActive: h.is_active
            }));
            const exceptions = calendarExceptions;

            // 1.2 ข้อมูลการลาของผู้ใช้ (จาก Context)
            // IMPORTANT: Admin sees all leaves in context, so we must filter by currentUser.id
            const userLeaves = leaveRequests.filter(req => 
                req.userId === currentUser.id &&
                ['APPROVED', 'PENDING'].includes(req.status) &&
                format(req.endDate, 'yyyy-MM-dd') >= format(addDays(today, -lookbackDays), 'yyyy-MM-dd')
            );

            // 1.3 ข้อมูลการลงเวลาของผู้ใช้ (จาก Context)
            // IMPORTANT: Admin sees all attendance logs, so we must filter by currentUser.id
            const userAttendanceLogs = attendanceLogs.filter(log => log.userId === currentUser.id);

            // =========================================================
            // SECTION A: DUTIES (Moved to useDutyJudge)
            // =========================================================
            await runDutyChecks(
                today,
                todayStr,
                holidays,
                exceptions,
                userLeaves
            );

            // =========================================================
            // SECTION B: TASKS (งานที่ได้รับมอบหมาย) - Progressive Penalty
            // =========================================================
            await runTaskChecks(
                today,
                todayStr,
                holidays,
                exceptions,
                userLeaves
            );

            // =========================================================
            // SECTION C, D, E: ATTENDANCE CHECKS (Moved to useAttendanceJudge)
            // =========================================================
            await runAttendanceChecks(
                today,
                todayStr,
                holidays,
                exceptions,
                userLeaves,
                userAttendanceLogs
            );

            // =========================================================
            // SECTION F: DEATH SYSTEM (ระบบมีเวลาฟื้นฟู HP 7 วันทำงาน)
            // =========================================================
            if (currentUser.hp <= 0 && !currentUser.hpDepletedAt) {
                console.log(`[AutoJudge] HP Depleted! Setting start of death timer for ${currentUser.name}`);
                await supabase.from('profiles').update({ hp_depleted_at: new Date().toISOString() }).eq('id', currentUser.id);
            }

            if (currentUser.hpDepletedAt && currentUser.status !== 'DEATH') {
                const depletedDate = new Date(currentUser.hpDepletedAt);
                const workingDaysPassed = countWorkingDaysBetween(
                    depletedDate, 
                    today, 
                    annualHolidays, 
                    calendarExceptions, 
                    currentUser
                );

                console.log(`[AutoJudge] Death Timer: ${workingDaysPassed}/7 working days passed for ${currentUser.name}`);

                if (workingDaysPassed >= 7) {
                    console.log(`[AutoJudge] 💀 FATALITY: ${currentUser.name} has been HP<=0 for 7 working days. Setting status to DEATH.`);
                    await supabase.from('profiles').update({ status: 'DEATH', is_active: false }).eq('id', currentUser.id);
                    
                    // Create game log for burial
                    await processAction(currentUser.id, 'SYSTEM_BURIAL', {
                        hpChange: 0,
                        xpChange: -100,
                        pointsChange: 0,
                        description: `เสียชีวิตอย่างเป็นทางการเนื่องจาก HP ไม่ได้รับการฟื้นฟูภายใน 7 วันทำการ`,
                        relatedId: currentUser.id
                    });
                } else {
                    // Send Warnings using Notifications (similar to Negligence but for Death)
                    const daysRemaining = 7 - workingDaysPassed;
                    
                    if (daysRemaining <= 3 && !hasNotification('DEATH_WARNING', `${daysRemaining} วันสุดท้าย`)) {
                        await supabase.from('notifications').insert({
                            user_id: currentUser.id,
                            type: 'DEATH_WARNING',
                            title: '💀 คำเตือน: วิญญาณกำลังจะแตกสลาย',
                            message: `HP ของคุณเป็น 0 มาแล้ว ${workingDaysPassed} วันทำการ หากไม่ฟื้นฟูภายใน ${daysRemaining} วันสุดท้าย คุณจะเข้าสู่สถานะ DEATH (พ้นสภาพพนักงาน)`,
                            metadata: { daysRemaining, depletedAt: currentUser.hpDepletedAt },
                            is_read: false
                        });
                    }
                }
            }

        } catch (err) {
            console.error("Auto Judge Error:", err);
        }
    }, [currentUser, config, gameLogs, notifications, isLoading, processAction, annualHolidays, calendarExceptions, leaveRequests, attendanceLogs]);

    const initialCheckDoneRef = useRef(false);

    useEffect(() => {
        if (!isLoading && currentUser && !initialCheckDoneRef.current) {
            initialCheckDoneRef.current = true;
            checkAndPunish();
        }
    }, [isLoading, currentUser?.id, checkAndPunish]);

    const checkAndPunishRef = useRef(checkAndPunish);
    useEffect(() => {
        checkAndPunishRef.current = checkAndPunish;
    }, [checkAndPunish]);

    // ตั้งเวลาให้ทำงานวนทุก 10 นาที
    // เพิ่ม config เป็น dependency เพื่อให้ logic อัปเดตถ้ามีการปรับเปลี่ยนค่ากลาง
    useEffect(() => {
        const interval = setInterval(() => { checkAndPunishRef.current(); }, 10 * 60 * 1000); 
        return () => { clearInterval(interval); };
    }, [currentUser?.id, config]); 
};

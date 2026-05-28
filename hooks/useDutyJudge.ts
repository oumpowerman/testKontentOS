import { supabase } from '../lib/supabase';
import { isSameDay, subDays } from 'date-fns';
import { User, AnnualHoliday } from '../types';
import { isHolidayOrException, countWorkingDaysLate, isUserOnLeave } from '../utils/judgeUtils';
import { toValidUuid } from '../utils/gamificationUtils';

export const useDutyJudge = (
    currentUser: User | null,
    isProcessingRef: React.MutableRefObject<Set<string>>,
    processAction: any,
    config: any,
    gameLogs: any[],
    isLoading: boolean
) => {
    // Helper to check if a penalty already exists (Check local memory first, then DB for robustness)
    const hasPenaltyInLogs = async (actionType: string, relatedId?: string, descriptionMatch?: string) => {
        if (!currentUser) return false;
        if (isLoading) return true; // Assume exists while loading to be safe
        const targetId = toValidUuid(relatedId || null);

        // 1. Check local context logs first (Fast)
        const localMatch = gameLogs.some(log => {
            // Check if log belongs to specific user (Crucial for Admins who see all logs)
            const matchUser = log.user_id === currentUser.id;
            if (!matchUser) return false;

            const matchType = log.action_type === actionType;
            const matchId = !targetId || log.related_id === targetId;
            const matchDesc = !descriptionMatch || (log.description && log.description.includes(descriptionMatch));
            return matchType && matchId && matchDesc;
        });

        if (localMatch) return true;

        // 2. If not in local logs (e.g. pushed out of last 100), check DB directly (Robust)
        if (targetId) {
            try {
                const { data } = await supabase
                    .from('game_logs')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('related_id', targetId)
                    .maybeSingle();
                
                if (data) return true;
            } catch (err) {
                console.error("[DutyJudge] DB Penalty Check Error:", err);
            }
        }

        return false;
    };

    const runDutyChecks = async (
        today: Date,
        todayStr: string,
        holidays: AnnualHoliday[],
        exceptions: any[],
        userLeaves: any[]
    ) => {
        if (!currentUser) return;

        // --- CONFIG VALUES ---
        const negligencePenalty = config?.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20;
        const negligenceThreshold = config?.AUTO_JUDGE_CONFIG?.negligence_threshold_days || 1;
        
        // GRACE PERIOD CHECK: 
        // Only judge yesterday's duty if current time is past the grace hour (e.g., 10:00 AM)
        const graceHour = config?.AUTO_JUDGE_CONFIG?.duty_grace_hour || 10;
        const currentHour = today.getHours();
        
        const { data: missedDuties, error: dutyError } = await supabase
            .from('duties')
            .select('*')
            .eq('assignee_id', currentUser.id)
            .lt('date', todayStr) // เวรที่ผ่านมาแล้ว
            .eq('is_done', false) // ยังไม่เสร็จ
            .eq('cleared_by_system', false) // ✅ ป้องกันการดึงเวรที่ระบบเคลียร์ไปแล้วมาประมวลผลซ้ำ
            .neq('penalty_status', 'ACCEPTED_FAULT')
            .neq('penalty_status', 'LATE_COMPLETED')
            .neq('penalty_status', 'EXCUSED');

        if (!dutyError && missedDuties && missedDuties.length > 0) {
            // Check if user has a NEW duty today (to trigger Negligence Protocol)
            const { data: todayDutyData } = await supabase
                .from('duties')
                .select('id')
                .eq('assignee_id', currentUser.id)
                .eq('date', todayStr)
                .limit(1);
            
            const hasNewDutyToday = todayDutyData && todayDutyData.length > 0;

            for (const duty of missedDuties) {
                if (isProcessingRef.current.has(duty.id)) continue;

                const dutyDateStr = duty.date; 
                const dutyDate = new Date(dutyDateStr);
                
                // 1. GRACE PERIOD: If duty was yesterday and it's before grace hour, skip judging
                const isYesterday = isSameDay(dutyDate, subDays(today, 1));
                if (isYesterday && currentHour < graceHour) {
                    console.log(`[AutoJudge] Skipping duty ${duty.id} (Yesterday) - Waiting for grace period until ${graceHour}:00`);
                    continue;
                }

                // --- NEGLIGENCE PROTOCOL: CLEAR ABANDONED DUTIES ---
                // If user has an ABANDONED duty that hasn't been cleared, AND a new duty arrives today
                if (duty.penalty_status === 'ABANDONED' && !duty.cleared_by_system) {
                     if (hasNewDutyToday) {
                         const lockKey = `negligence-${duty.id}`;
                         if (isProcessingRef.current.has(lockKey)) continue;
                         
                         // ✅ ตรวจสอบจาก game_logs ใน Context ว่าเคยโดน Negligence Penalty หรือยัง
                         const alreadyPenalized = await hasPenaltyInLogs('DUTY_MISSED', `NEGLIGENCE:${duty.id}`);

                         if (!alreadyPenalized) {
                             isProcessingRef.current.add(lockKey);
                             console.log(`[AutoJudge] Negligence Protocol triggered for duty ${duty.id}`);
                             
                             try {
                                 // 1. Penalize (Heavy) - Use Config Value
                                 const result = await processAction(currentUser.id, 'DUTY_MISSED', { 
                                     ...duty, 
                                     id: `NEGLIGENCE:${duty.id}`, // Use as idempotency key
                                     reason: 'NEGLIGENCE_PROTOCOL', 
                                     customPenalty: negligencePenalty,
                                     description: 'เพิกเฉยต่อหน้าที่จนเวรรอบใหม่มาถึง (System Cleared)'
                                 });

                                 // 2. Clear Duty (Only if action processed)
                                 if (result) {
                                 await supabase.from('duties').update({ cleared_by_system: true }).eq('id', duty.id);
                                 }

                                 // 3. Trigger Lock Screen (via Notification)
                                 //await supabase.from('notifications').insert({
                                 //    user_id: currentUser.id,
                                 //    type: 'SYSTEM_LOCK_PENALTY', // Special Type
                                 //    title: '⚠️ คุณถูกหักคะแนนฐานเพิกเฉย!',
                                 //    message: 'เนื่องจากคุณปล่อยเวรเก่าทิ้งไว้จนเวรรอบใหม่มาถึง ระบบได้ทำการหักคะแนนเพิ่มและเคลียร์เวรเก่าออก',
                                 //    is_read: false,
                                 //    link_path: 'DUTY',
                                 //   metadata: { hp: -negligencePenalty }
                                 //});
                             } finally {
                                 isProcessingRef.current.delete(lockKey);
                             }
                         } else {
                             // ถ้ามี Log แล้วแต่ยังไม่ถูกเคลียร์ ให้เคลียร์ซ้ำเพื่อความชัวร์
                             await supabase.from('duties').update({ cleared_by_system: true }).eq('id', duty.id);
                         }
                     }
                     continue; // Skip standard processing for abandoned duties
                }

                // --- STANDARD PROCESSING (If not yet abandoned) ---
                if (duty.penalty_status === 'ABANDONED') continue; // Already processed as abandoned (but not cleared yet)

                // ถ้าวันที่ต้องทำเวร เป็นวันหยุด -> ยกประโยชน์ให้ (Excused)
                if (isHolidayOrException(dutyDate, holidays, exceptions)) {
                    console.log(`[AutoJudge] Excusing duty ${duty.id} because it was a holiday.`);
                    await supabase.from('duties').update({ penalty_status: 'EXCUSED' }).eq('id', duty.id);
                    continue;
                }

                // ถ้าวันที่ต้องทำเวร "ลาป่วย/ลากิจ" -> ยกประโยชน์ให้ (Excused)
                const leaveCheck = isUserOnLeave(dutyDateStr, userLeaves);
                if (leaveCheck.onLeave) {
                    if (leaveCheck.status === 'APPROVED') {
                        console.log(`[AutoJudge] Excusing duty ${duty.id} because user was on leave.`);
                        await supabase.from('duties').update({ penalty_status: 'EXCUSED', is_done: true }).eq('id', duty.id);
                    } else {
                        console.log(`[AutoJudge] Deferring duty ${duty.id} penalty because leave is PENDING.`);
                    }
                    continue;
                }
                
                // นับจำนวนวันทำการที่เลยกำหนด
                const workingDaysLate = countWorkingDaysLate(dutyDate, today, holidays, exceptions, currentUser);

                if (workingDaysLate === 0) {
                    // เลยกำหนดมานิดหน่อย (เช่น เสาร์อาทิตย์) ยังไม่นับ
                    if (duty.penalty_status === 'NONE') {
                        await supabase.from('duties').update({ penalty_status: 'AWAITING_TRIBUNAL' }).eq('id', duty.id);
                    }
                } 
                else if (workingDaysLate >= negligenceThreshold) {
                    // เลยกำหนดเกิน Threshold (ตาม Config) -> ตัดสินว่า "ละเลยหน้าที่" (ABANDONED)
                    if (duty.penalty_status !== 'ABANDONED') {
                         const alreadyPenalized = await hasPenaltyInLogs('DUTY_MISSED', `ABANDONED:${duty.id}`);
                         if (alreadyPenalized) {
                             console.log(`[AutoJudge] Duty ${duty.id} already has abandoned log. Finalizing DB status.`);
                             await supabase.from('duties').update({ 
                                 is_penalized: true, 
                                 penalty_status: 'ABANDONED',
                                 abandoned_at: duty.abandoned_at || new Date().toISOString() 
                             }).eq('id', duty.id);
                             continue;
                         }

                         isProcessingRef.current.add(duty.id);
                         try {
                            const result = await processAction(currentUser.id, 'DUTY_MISSED', { 
                                ...duty, 
                                id: `ABANDONED:${duty.id}`, // Use as idempotency key
                                reason: 'ABANDONED_DUTY',
                                description: `เพิกเฉยต่อหน้าที่ (ปล่อยเวรทิ้งไว้จนเลยกำหนด วันที่ ${duty.date})`
                            });

                            if (result) {
                                 await supabase.from('duties').update({ 
                                     is_penalized: true, 
                                     penalty_status: 'ABANDONED',
                                     abandoned_at: new Date().toISOString() 
                                 }).eq('id', duty.id);
                            }
                         } finally {
                             isProcessingRef.current.delete(duty.id);
                         }
                    }
                }
            }
        }
    };

    return { runDutyChecks };
};

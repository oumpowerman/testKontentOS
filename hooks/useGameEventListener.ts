import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { User } from '../types';
import { useNotificationContext } from '../context/NotificationContext';

/**
 * 👂 useGameEventListener (The Watcher)
 * หน้าที่: เฝ้าดูตาราง `game_logs` ใน Database แบบ Real-time
 * 
 * 💡 ทำไมโค้ดถึงสั้นลง?
 * เมื่อก่อน: เราต้องเขียน switch-case ดักทุก action เพื่อกำหนดข้อความ (Hardcoded)
 * ตอนนี้: เราอ่าน field `description` จาก Database โดยตรง ซึ่งถูกสร้างโดย Engine (`useGamification`)
 * ทำให้เราไม่ต้องแก้ไฟล์นี้ทุกครั้งที่มีเควสใหม่ หรือเงื่อนไขใหม่
 */
export const useGameEventListener = (currentUser: User | null, onEvent?: () => void) => {
    const { showToast } = useToast();
    const { gameLogs } = useNotificationContext();
    
    // Buffer: ใช้เก็บ Log ที่เด้งมาพร้อมกันหลายๆ อัน เพื่อแสดงรวบยอด (ลด Spam)
    const processedLogsRef = useRef<Set<string>>(new Set());
    const bufferRef = useRef<Map<string, any[]>>(new Map());
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const nameCacheRef = useRef<Map<string, string>>(new Map());
    const prevHpRef = useRef<number | null>(null);

    // --- HP DEATH TRACKER ---
    useEffect(() => {
        if (!currentUser) return;
        
        const currentHp = currentUser.hp;
        const prevHp = prevHpRef.current;
        
        // Detect transition to 0 HP
        if (prevHp !== null && prevHp > 0 && currentHp === 0) {
            showToast('💀 HP ของคุณหมดลงแล้ว! ระบบได้บันทึกประวัติความผิดพลาดไว้แล้ว', 'penalty');
        }    
        prevHpRef.current = currentHp;
    }, [currentUser?.hp, currentUser?.id]);

    // 1. Request Notification Permission (Browser)
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const processBuffer = async () => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'ADMIN';

        // 1. Copy and Clear immediately to prevent losing logs during async processing
        const logsToProcess = Array.from(bufferRef.current.entries());
        bufferRef.current.clear();
        timerRef.current = null;

        const fetchName = async (userId: string) => {
            if (nameCacheRef.current.has(userId)) return nameCacheRef.current.get(userId);
            const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
            const name = data?.full_name || 'Unknown';
            nameCacheRef.current.set(userId, name);
            return name;
        };

        for (const [groupKey, logs] of logsToProcess) {
            if (logs.length === 0) continue;

            // Filter out unauthorized check-in logs with 0 hp change to prevent showing unnecessary warning toasts
            const filteredLogs = logs.filter(l => {
                if ((l.action_type === 'ATTENDANCE_UNAUTHORIZED_WFH' || l.action_type === 'ATTENDANCE_UNAUTHORIZED_ONSITE') && Number(l.hp_change || 0) === 0) {
                    return false;
                }
                return true;
            });
            if (filteredLogs.length === 0) continue;

            const firstLog = filteredLogs[0];
            const count = filteredLogs.length;
            const actionType = firstLog.action_type;
            // ✅ KEY LOGIC: ใช้ข้อความจาก Database เลย ไม่ต้อง Hardcode ใน Frontend
            const message = firstLog.description || 'มีการอัปเดตข้อมูล';

            // Determine Toast Type based on Action and Values (Logic for Styling only)
            let toastType: 'success' | 'error' | 'info' | 'warning' | 'penalty' | 'reward' = 'info';

            if (actionType === 'LEVEL_UP') {
                toastType = 'reward';
            }
            else if (firstLog.hp_change < 0 || (firstLog.jp_change < 0 && actionType !== 'SHOP_PURCHASE')) {
                toastType = 'penalty';
            }
            else if (firstLog.xp_change > 0) {
                toastType = 'success';
            }
            else if (['ATTENDANCE_LATE', 'ATTENDANCE_EARLY_LEAVE'].includes(actionType)) {
                toastType = 'warning';
            }
            else if (['ATTENDANCE_ABSENT', 'ATTENDANCE_NO_SHOW', 'DUTY_MISSED'].includes(actionType)) {
                toastType = 'penalty';
            }

            // --- ADMIN GROUPING LOGIC ---
            if (isAdmin && count > 1) {
                if (actionType === 'TASK_COMPLETE') showToast(`🎉 ปิดงานสำเร็จ ${count} งาน`, 'success');
                else if (actionType === 'TASK_LATE') showToast(`📉 มีงานส่งล่าช้า ${count} รายการ`, 'penalty');
                else if (actionType === 'ATTENDANCE_CHECK_IN') showToast(`🕒 มีพนักงานลงเวลาเข้างาน`, 'info');
                else if (actionType === 'ATTENDANCE_CHECK_OUT') showToast(`🕒 มีพนักงานลงเวลาออกงาน`, 'info');
                else if (actionType === 'ATTENDANCE_EARLY_LEAVE') showToast(`🕒 มีพนักงานกลับก่อนเวลา ${count} คน`, 'warning');
                else showToast(`${message}`, toastType);
            } else {
                // Individual User: แสดงข้อความตรงๆ
                // กรองเฉพาะของตัวเอง หรือถ้าเป็น Admin ก็ให้เห็นของทุกคน (แบบทีละรายการถ้าไม่เยอะ)
                const myLogs = filteredLogs.filter(l => {
                    if (l.user_id === currentUser.id) return true;
                    if (isAdmin) {
                        // For Admin: Only show "Important" events for other users to reduce spam
                        const importantActions = [
                            'ATTENDANCE_CHECK_IN',
                            'ATTENDANCE_CHECK_OUT',  
                            'ATTENDANCE_ABSENT', 
                            'ATTENDANCE_LATE', 
                            'ATTENDANCE_EARLY_LEAVE',
                            'ATTENDANCE_FORGOT_CHECKOUT',
                            'ATTENDANCE_NO_SHOW',
                            'DUTY_MISSED', 
                            'TASK_LATE', 
                            'LEVEL_UP',
                            'SYSTEM_LOCK_PENALTY'
                        ];
                        // Also show if there's a significant HP loss
                        return importantActions.includes(l.action_type) || l.hp_change < -5;
                    }
                    return false;
                });
                
                for (const log of myLogs) {
                    // Recalculate type per log to be safe for mixed batch
                    let localType = toastType;
                    if (log.hp_change < 0) localType = 'penalty';
                    if (log.action_type === 'LEVEL_UP') localType = 'reward';
                    
                    let finalMessage = log.description;
                    
                    // If Admin is seeing someone else's log, prefix with their name
                    if (isAdmin && log.user_id !== currentUser.id) {
                        const userName = await fetchName(log.user_id);
                        finalMessage = `👤 ${userName}: ${log.description}`;
                    }

                    // ✨ THE MAGIC LINE: Display whatever the Engine sent
                    showToast(finalMessage, localType);
                }
            }
        }
    };

    const sessionStartRef = useRef<string>(new Date(Date.now() - 60000).toISOString()); // Allow logs from 1 minute before session start
    const isFirstLoadRef = useRef(true);

    // Listen to gameLogs from NotificationContext
    useEffect(() => {
        if (!currentUser || gameLogs.length === 0) return;

        // Find logs that haven't been processed yet
        const newLogs = gameLogs.filter(log => {
            const isNew = !processedLogsRef.current.has(log.id);
            const isAfterSessionStart = log.created_at >= sessionStartRef.current;
            return isNew && isAfterSessionStart;
        });
        
        // Mark all current logs as processed on first load to be safe, 
        // but the created_at check is the primary guard.
        if (isFirstLoadRef.current) {
            gameLogs.forEach(log => processedLogsRef.current.add(log.id));
            isFirstLoadRef.current = false;
        }
        
        if (newLogs.length > 0) {
            if (onEvent) onEvent();

            newLogs.forEach(log => {
                processedLogsRef.current.add(log.id);

                let groupKey = `single_${log.id}`;
                if (log.action_type.startsWith('TASK_')) groupKey = `TASK_BATCH_${log.action_type}`;
                else if (log.action_type.startsWith('ATTENDANCE_')) groupKey = `ATTENDANCE_BATCH_${log.action_type}`;
                else if (log.action_type.startsWith('DUTY_')) groupKey = `DUTY_BATCH_${log.action_type}`;

                if (!bufferRef.current.has(groupKey)) bufferRef.current.set(groupKey, []);
                bufferRef.current.get(groupKey)?.push(log);
            });

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(processBuffer, 300);
        }

        // Memory management for processedLogsRef (Keep last 200 IDs)
        if (processedLogsRef.current.size > 200) {
            const ids = Array.from(processedLogsRef.current);
            processedLogsRef.current = new Set(ids.slice(-100));
        }
    }, [gameLogs, currentUser?.id]);

    return null;
};

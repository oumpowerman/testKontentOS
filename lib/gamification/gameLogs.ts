import { supabase } from '../supabase';
import { GameActionType, GameConfig } from '../../types';
import { evaluateAction } from '../gameLogic';

/**
 * 📜 useGameLogs (The Historian)
 * หน้าที่: จัดการเรื่องประวัติการทำรายการ (History)
 */
import { toValidUuid } from '../../utils/gamificationUtils';

/**
 * 📜 useGameLogs (The Historian)
 * หน้าที่: จัดการเรื่องประวัติการทำรายการ (History)
 */
export const logGameAction = async (
    userId: string,
    action: GameActionType,
    result: any,
    context: any = {},
    bonusCoins: number = 0
) => {
    try {
        // 1. 📝 Log: บันทึกประวัติการทำรายการ (สำคัญมาก! ตัวนี้จะไปกระตุ้น Toast ให้เด้ง)
        // แสดงคำอธิบายที่สวยงามเป็นธรรมชาติ ไม่โชว์รหัสเทคนิคหรือวงเล็บเหลี่ยมดิบๆ ที่รบกวนสายตา
        let baseMsg = context.description || result.message;

        const cleanReason = (reason: string): string => {
            if (!reason) return '';
            const r = reason.trim();
            // ถ้าเป็นรหัสระบบคีย์ภาษาอังกฤษพิมพ์ใหญ่ หรือข้อมูลที่ระบุวันที่ดิบ ให้ซ่อนไว้เพื่อความสวยงาม
            if (r.startsWith('ABSENT_DATE:') || r.startsWith('FORGOT_OUT_DATE:') || r === 'NEGLIGENCE_PROTOCOL' || r === 'ABANDONED_DUTY') {
                return '';
            }
            if (/^[A-Z0-9_/:-]+$/.test(r)) {
                return '';
            }
            return r;
        };

        const reasonSuffix = context.reason ? cleanReason(context.reason) : '';
        const description = reasonSuffix ? `${baseMsg} (${reasonSuffix})` : baseMsg;

        const { error: logError } = await supabase.from('game_logs').insert({
            user_id: userId,
            action_type: action,
            xp_change: result.xp,
            hp_change: result.hp,
            jp_change: result.coins + bonusCoins,
            description: description,
            related_id: toValidUuid(context.id || null)
        });

        if (logError) {
            // Handle duplicate key error gracefully (idempotency)
            if (logError.code === '23505') {
                console.warn(`[Idempotency] Game log for ${action} with related_id ${context.id} already exists. Skipping.`);
                return; // Stop here, no need to send notification again either
            }
            console.error("❌ Failed to insert game log:", logError);
        }

        // 2. 🔔 Notification: บันทึกลงตาราง notifications เพื่อให้ขึ้นที่กระดิ่ง
        // เราจะบันทึกเฉพาะรายการที่เป็นโทษ (Penalty) หรือรางวัลใหญ่ (Level Up/Reward)
        const isPenalty = result.hp < 0 || (result.coins < 0 && action !== 'SHOP_PURCHASE');
        const isSignificantReward = result.isLevelUp || result.xp > 100 || action === 'KPI_REWARD';
        const isAdminAdjust = action === 'MANUAL_ADJUST';

        if (isPenalty || isSignificantReward || isAdminAdjust) {
            // Contextual titles for better notifications/LINE messages
            let title = isPenalty ? '📉 โดนหักคะแนน!' : '🎉 ได้รับรางวัล!';
            
            // Special cases for better UX
            if (isAdminAdjust) title = result.xp >= 0 && result.hp >= 0 && (result.coins + bonusCoins) >= 0 ? '🎁 GM มอบรางวัลให้!' : '📉 GM ปรับลดสถานะ!';
            if (action === 'ATTENDANCE_FORGOT_CHECKOUT') title = '⚠️ ลืมตอกบัตรออก';
            if (action === 'ATTENDANCE_ABSENT') title = '❌ ขาดงาน';
            if (action === 'TASK_LATE') title = '⏰ ส่งงานล่าช้า';
            if (action === 'ATTENDANCE_EARLY_LEAVE') title = '🕒 กลับก่อนเวลา';
            if (action === 'DUTY_MISSED') title = '🚫 เพิกเฉยเวร';
            if (action === 'DUTY_LATE_SUBMIT') title = '⏰ ส่งเวรล่าช้า';

            // Build a rich message with score info
            const scoreParts = [];
            if (result.hp !== 0) scoreParts.push(`${result.hp > 0 ? '+' : ''}${result.hp} HP`);
            if (result.xp !== 0) scoreParts.push(`${result.xp > 0 ? '+' : ''}${result.xp} XP`);
            const totalCoins = result.coins + bonusCoins;
            if (totalCoins !== 0) scoreParts.push(`${totalCoins > 0 ? '+' : ''}${totalCoins} JP`);
            
            const richMessage = scoreParts.length > 0 
                ? `${description} (${scoreParts.join(', ')})`
                : description;

            await supabase.from('notifications').insert({
                user_id: userId,
                type: isPenalty ? 'GAME_PENALTY' : 'GAME_REWARD',
                title: title,
                message: richMessage,
                is_read: false,
                link_path: 'DASHBOARD'
            });
        }

        // 3. 🎉 Explicit Level Up Event: ถ้าเลเวลอัป ให้สร้าง Log แยกอีกบรรทัดเพื่อความอลังการ
        if (result.isLevelUp) {
            await supabase.from('game_logs').insert({
                user_id: userId,
                action_type: 'LEVEL_UP',
                xp_change: 0,
                hp_change: 0,
                jp_change: bonusCoins, 
                description: `🎉 LEVEL UP! เลื่อนเป็น Lv.${result.newLevel} (รับโบนัส +${bonusCoins} JP)`
            });
        }
    } catch (err) {
        console.error("Game Log Error:", err);
    }
};

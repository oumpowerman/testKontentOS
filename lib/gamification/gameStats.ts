import { supabase } from '../supabase';
import { calculateLevel } from '../gameLogic';
import { GameActionType, GameConfig } from '../../types';
import { evaluateAction } from '../gameLogic';

/**
 * 📊 useGameStats (The Core Stats Manager)
 * หน้าที่: จัดการเรื่อง XP, HP, Level และการอัปเดต Profile พื้นฐาน
 */
export const updateGameStats = async (
    userId: string, 
    action: GameActionType, 
    context: any = {},
    config: GameConfig
) => {
    try {
        // Fetch master options dynamically from database if not already provided
        if (!context.masterOptions && (action === 'ATTENDANCE_CHECK_IN' || action === 'ATTENDANCE_LATE')) {
            const { data: options } = await supabase
                .from('master_options')
                .select('*')
                .eq('type', 'WORK_CONFIG');
            if (options) {
                context.masterOptions = options;
            }
        }

        // 1. 📐 Rule Engine: คำนวณหาค่า XP/HP ที่ควรได้
        const result = evaluateAction(action, context, config);
        
        // ถ้าไม่มีการเปลี่ยนแปลงค่าใดๆ เลย ให้จบการทำงาน
        if (result.xp === 0 && result.hp === 0 && result.coins === 0 && !result.message) return result;

        // 2. 📥 Fetch: ดึงค่าปัจจุบันของผู้ใช้
        const { data: user, error: fetchError } = await supabase
            .from('profiles')
            .select('xp, hp, available_points, level, max_hp, death_count')
            .eq('id', userId)
            .single();

        if (fetchError || !user) throw new Error('User not found for gamification update');

        // 3. 🧮 Calculate: คำนวณค่าใหม่
        const newXp = Math.max(0, user.xp + result.xp);
        const newHp = Math.min(user.max_hp || 100, user.hp + result.hp); // HP ห้ามเกิน Max แต่ติดลบได้
        
        // 4. 🆙 Check Level Up: ตรวจสอบว่าเลเวลอัปไหม
        const newLevel = calculateLevel(newXp, config);
        const isLevelUp = newLevel > user.level;
        
        // Check for Death (HP transition to <= 0 from positive)
        const isDeath = user.hp > 0 && newHp <= 0;

        // ให้โบนัสพิเศษเมื่อเลเวลอัป
        const levelUpBonus = config.LEVELING_SYSTEM?.level_up_bonus_coins ?? 500;
        const bonusCoins = isLevelUp ? levelUpBonus : 0;

        const newCoins = Math.max(0, user.available_points + result.coins + bonusCoins);

        // 5. 💾 Update DB: บันทึกค่าใหม่ลง Profile
        const profileUpdates: any = { 
            xp: newXp, 
            hp: newHp, 
            available_points: newCoins,
            level: newLevel
        };

        // If death occurred, increment death_count here
        if (isDeath) {
            profileUpdates.death_count = (user.death_count || 0) + 1;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId);

        if (updateError) throw updateError;

        return {
            ...result,
            isLevelUp,
            isDeath,
            newLevel,
            newXp,
            newHp,
            newCoins,
            bonusCoins,
            deathCount: profileUpdates.death_count || user.death_count
        };

    } catch (err) {
        console.error("Game Stats Update Error:", err);
        throw err;
    }
};

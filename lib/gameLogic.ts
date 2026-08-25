
import { GameActionType, GameActionResult, Difficulty, GameConfig } from '../types';
import { differenceInDays, isBefore, format } from 'date-fns';
import th from 'date-fns/locale/th/index.js';
import { BRAND_CONFIG } from '../config/brand';

// --- DEFAULT FALLBACK CONFIGURATION ---
// Used when DB is offline or loading
export const DEFAULT_GAME_CONFIG = {
    GLOBAL_MULTIPLIERS: {
        XP_PER_HOUR: 20,
        COIN_BONUS_EARLY: 20,
        COIN_DUTY: 5,
        COIN_ATTENDANCE: 5,
        COIN_TASK: 10,
        BASE_XP_PER_LEVEL: 1000,
        // New Flexible Keys
        XP_BONUS_EARLY: 50,
        XP_DUTY_COMPLETE: 20,
        XP_ATTENDANCE: 10,
        XP_TASK_COMPLETE: 200,
        XP_DUTY_LATE_SUBMIT: 5,
        XP_DUTY_ASSIST: 10,
        OT_JP_RATE_PER_HOUR: 10,
    },

    // XP Calculation
    DIFFICULTY_XP: {
        EASY: 100,
        MEDIUM: 200,
        HARD: 300
    },

    // Penalty Rates
    PENALTY_RATES: {
        HP_PENALTY_LATE: 5,           // Base damage per day
        HP_PENALTY_LATE_MULTIPLIER: 2, // Progressive multiplier (Compound damage)
        HP_PENALTY_MISSED_DUTY: 20,    // Updated from 10 to 20 for consistency
        COIN_PENALTY_LATE_PER_DAY: 5,
        // New Stepped Duty Penalty Keys
        HP_REFUND_DUTY_REDEEM: 10,
        HP_PENALTY_DUTY_LATE_SUBMIT: 5, 
        HP_PENALTY_EARLY_LEAVE_RATE: 1, 
        HP_PENALTY_EARLY_LEAVE_INTERVAL: 10, 
        HP_PENALTY_UNAUTHORIZED_WFH: 5,
        LATE_MODE_DYNAMIC: 0,
        EARLY_LEAVE_MODE_DYNAMIC: 1,
        HP_PENALTY_LATE_INTERVAL: 10,
        HP_PENALTY_LATE_RATE: 1
    },

    // Attendance Rules
    ATTENDANCE_RULES: {
        ON_TIME: { xp: 15, hp: 0, coins: 5 },
        LATE: { xp: 0, hp: -5, coins: 0 },
        APPEAL: { xp: 0, hp: 0, coins: 0 }, // New: Pending Appeal (Neutral)
        ABSENT: { xp: 0, hp: -20, coins: -50 },
        NO_SHOW: { xp: 0, hp: -100, coins: -100 },
        LEAVE: { xp: 0, hp: 0, coins: 0 },
        WFH: { xp: 10, hp: 0, coins: 0 },
        SITE: { xp: 20, hp: 0, coins: 10 },
        FORGOT_CHECKOUT: { xp: 0, hp: -10, coins: 0 },
        CORRECTION_REFUND: { xp: 0, hp: 5, coins: 0 },
        ABSENT_REFUND: { xp: 0, hp: 15, coins: 0 } // Partial refund for absence correction (15/20)
    },

    // KPI Rewards (New Section)
    KPI_REWARDS: {
        A: { xp: 1000, coins: 500 },
        B: { xp: 500, coins: 200 },
        C: { xp: 200, coins: 50 },
        D: { xp: 0, coins: 0 }
    },

    // New Dynamic Configs
    LEVELING_SYSTEM: {
        formula: "LINEAR",
        base_xp_per_level: 1000,
        max_level: 100,
        level_up_bonus_coins: 500
    },
    ITEM_MECHANICS: {
        time_warp_refund_cap_hp: 20,
        time_warp_refund_percent: 100,
        shop_tax_rate: 0
    },
    AUTO_JUDGE_CONFIG: {
        negligence_penalty_hp: 20,
        lookback_days_check: 60,
        allow_holiday_penalty: false,
        negligence_threshold_days: 1,
        duty_grace_hour: 10
    },
    SYSTEM_MAINTENANCE: {
        duty_cleanup_days: 180,
        logs_cleanup_days: 365,
        notification_cleanup_days: 30
    },
    REVIEW_JUDGE_CONFIG: {
        expiry_days: 3,
        auto_revert_status: 'TODO',
        enabled: true,
        last_run_at: null
    },
    ATTENDANCE_GRADING_RULES: [
        { grade: "A+", max_late: 0, color: "bg-green-100 text-green-700", label: "Excellent" },
        { grade: "A", max_late: 1, color: "bg-emerald-100 text-emerald-700", label: "Good" },
        { grade: "B", max_late: 2, color: "bg-blue-100 text-blue-700", label: "Fair" },
        { grade: "C", max_late: 4, color: "bg-yellow-100 text-yellow-700", label: "Warning" },
        { grade: "F", max_late: 999, color: "bg-red-100 text-red-700", label: "Critical" }
    ],
    TRIBUNAL_CONFIG: {
        enabled: true,
        reward_hp: 10,
        reward_points: 50,
        penalty_hp: 20,
        false_report_penalty_hp: 15,
        categories: [
            { id: "toilet", label: "🚽 สุขา", severity: "LOW" },
            { id: "kitchen", label: "🍽️ ห้องครัว", severity: "MEDIUM" },
            { id: "behavior", label: "🗣️ พฤติกรรม", severity: "HIGH" },
            { id: "property", label: "🔨 ของพัง", severity: "CRITICAL" },
            { id: "other", label: "📝 อื่นๆ", severity: "LOW" }
        ]
    }
};

// --- CONFIG MERGE HELPERS ---
const getConfigSection = (config: any, section: string, fallback: any) => {
    const userSection = config?.[section];
    if (!userSection) return fallback;
    // Simple shallow merge for the section
    return { ...fallback, ...userSection };
};

export const calculateLevel = (xp: number, config: any = DEFAULT_GAME_CONFIG): number => {
    const levelling = getConfigSection(config, 'LEVELING_SYSTEM', DEFAULT_GAME_CONFIG.LEVELING_SYSTEM);
    const globals = getConfigSection(config, 'GLOBAL_MULTIPLIERS', DEFAULT_GAME_CONFIG.GLOBAL_MULTIPLIERS);
    
    // Prefer LEVELING_SYSTEM, fallback to GLOBAL_MULTIPLIERS, then default
    const base = levelling?.base_xp_per_level || globals?.BASE_XP_PER_LEVEL || 1000;
    return Math.floor(xp / base) + 1;
};

// Helper for date formatting
const formatDate = (date: Date | string) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'd MMM', { locale: th });
    } catch (e) {
        return '';
    }
};

export interface TaskXPBreakdown {
    base: number;
    hourly: number;
    early: number;
    total: number;
}

export const calculateTaskXP = (task: any, completionDate?: Date, config: any = DEFAULT_GAME_CONFIG): TaskXPBreakdown => {
    const diffXP = getConfigSection(config, 'DIFFICULTY_XP', DEFAULT_GAME_CONFIG.DIFFICULTY_XP);
    const globals = getConfigSection(config, 'GLOBAL_MULTIPLIERS', DEFAULT_GAME_CONFIG.GLOBAL_MULTIPLIERS);

    const difficulty = (task.difficulty || 'MEDIUM') as Difficulty;
    const estimatedHours = task.estimatedHours || 0;
    const endDate = task.endDate;

    // 1. Base XP
    const base = diffXP[difficulty] || globals.XP_TASK_COMPLETE || 200;

    // 2. Hourly Bonus
    let hourly = 0;
    if (estimatedHours > 0) {
        hourly = Math.floor(estimatedHours * (globals.XP_PER_HOUR || 20));
    }

    // 3. Early Bonus
    let early = 0;
    if (endDate) {
        const finalSubmitDate = completionDate ? new Date(completionDate) : new Date();
        const isEarly = differenceInDays(new Date(endDate), finalSubmitDate) >= 1;
        if (isEarly) {
            early = globals.XP_BONUS_EARLY || 50;
        }
    }

    return {
        base,
        hourly,
        early,
        total: base + hourly + early
    };
};

export const evaluateAction = (action: GameActionType, context: any, config: any = DEFAULT_GAME_CONFIG): GameActionResult => {
    const cfg = config || DEFAULT_GAME_CONFIG;
    const diffXP = getConfigSection(cfg, 'DIFFICULTY_XP', DEFAULT_GAME_CONFIG.DIFFICULTY_XP);
    const penalties = getConfigSection(cfg, 'PENALTY_RATES', DEFAULT_GAME_CONFIG.PENALTY_RATES);
    const attendanceRules = getConfigSection(cfg, 'ATTENDANCE_RULES', DEFAULT_GAME_CONFIG.ATTENDANCE_RULES);
    const globals = getConfigSection(cfg, 'GLOBAL_MULTIPLIERS', DEFAULT_GAME_CONFIG.GLOBAL_MULTIPLIERS);
    const kpiRewards = getConfigSection(cfg, 'KPI_REWARDS', DEFAULT_GAME_CONFIG.KPI_REWARDS);

    switch (action) {
        case 'TASK_COMPLETE': {
            const { title, manualBonus } = context;
            const taskName = title || 'งาน';
            
            const breakdown = calculateTaskXP(context, context.completionDate, cfg);
            const baseXP = breakdown.total;
            const adjustment = Number(manualBonus || 0);
            const xp = Math.max(0, baseXP + adjustment);

            const isEarly = breakdown.early > 0;
            let coins = globals.COIN_TASK || 10;
            if (isEarly) {
                coins += globals.COIN_BONUS_EARLY || 20;
            }

            return {
                xp,
                hp: 0,
                coins,
                message: isEarly ? `🚀 ส่งงานไวสุดยอด!: ${taskName}` : `✅ ปิดงานสำเร็จ: ${taskName}`,
                details: `+${xp} XP (${baseXP}${adjustment >= 0 ? '+' : ''}${adjustment}), +${coins} JP`
            };
        }

        case 'TASK_LATE': {
            // UPDATED: Support Progressive Penalty passed via context
            // If customPenalty is provided (from AutoJudge), use it. Otherwise use default base.
            const basePenalty = penalties.HP_PENALTY_LATE || 5;
            const hpPenalty = context.customPenalty ? Math.abs(context.customPenalty) : basePenalty;
            const daysLate = context.daysLate || 1;
            const daysLateText = daysLate > 0 ? ` (ช้า ${daysLate} วัน)` : '';
            const taskTitle = context.title ? `"${context.title}"` : 'งาน';

            return {
                xp: 0,
                hp: -hpPenalty,
                coins: -(penalties.COIN_PENALTY_LATE_PER_DAY || 5),
                message: `โดนหักคะแนน! ${taskTitle} ล่าช้า${daysLateText}`,
                details: `-${hpPenalty} HP`
            };
        }

        case 'DUTY_COMPLETE': {
            const xpReward = globals.XP_DUTY_COMPLETE || 20;
            const coinReward = globals.COIN_DUTY || 5;
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            
            return {
                xp: xpReward, 
                hp: 0,
                coins: coinReward,
                message: `ทำเวรเสร็จสิ้น${dateStr} เยี่ยมมาก!`,
                details: `+${xpReward} XP, +${coinReward} JP`
            };
        }
        
        case 'DUTY_ASSIST': {
            const xpReward = globals.XP_DUTY_ASSIST || 30; // More XP for kindness
            const coinReward = globals.COIN_DUTY || 5;
            const targetName = context.targetName || 'เพื่อน';
            return {
                xp: xpReward,
                hp: 0,
                coins: coinReward,
                message: `สุดยอด! ช่วยทำเวรแทน ${targetName}`,
                details: `Hero Bonus: +${xpReward} XP`
            };
        }

        case 'DUTY_MISSED': {
            // Update: Show Date in Message
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            
            // FIX: Prioritize customPenalty (from AutoJudge Negligence Protocol)
            const penalty = context.customPenalty ? Math.abs(context.customPenalty) : (penalties.HP_PENALTY_MISSED_DUTY || 10);
            
            // FIX: Use custom description if provided (e.g. "เพิกเฉยต่อหน้าที่")
            const message = context.description || `ลืมทำเวร!${dateStr} ระวังหลังเดาะนะ`;

            return {
                xp: 0,
                hp: -penalty,
                coins: 0,
                message: message,
                details: `-${penalty} HP`
            };
        }

        case 'DUTY_LATE_SUBMIT': {
            const lateXp = globals.XP_DUTY_LATE_SUBMIT || 5;
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            
            // DYNAMIC STEPPED PENALTY LOGIC:
            const isAbandoned = context.penaltyStatus === 'ABANDONED' || context.penalty_status === 'ABANDONED';
            
            // Use config values if available
            const refundValue = penalties.HP_REFUND_DUTY_REDEEM || 10;
            const latePenaltyValue = penalties.HP_PENALTY_DUTY_LATE_SUBMIT || 5;
            
            const hpChange = isAbandoned ? refundValue : -latePenaltyValue;
            const message = isAbandoned 
                ? `กู้คืนสถานะเวรที่ทอดทิ้ง!${dateStr}` 
                : `ส่งเวรล่าช้า (ช่วงผ่อนผัน)${dateStr}`;

            return {
                xp: lateXp, 
                hp: hpChange, 
                coins: 0,
                message: message,
                details: `${hpChange > 0 ? '+' : ''}${hpChange} HP, +${lateXp} XP`
            };
        }

        case 'ATTENDANCE_CHECK_IN': {
            const status = context.status; // 'ON_TIME' | 'LATE' | 'APPEAL'
            let rule = { ...(attendanceRules[status] || attendanceRules.ON_TIME) };
            
            // Override with global attendance rewards if on time
            if (status === 'ON_TIME') {
                if (globals.XP_ATTENDANCE !== undefined) rule.xp = globals.XP_ATTENDANCE;
                if (globals.COIN_ATTENDANCE !== undefined) rule.coins = globals.COIN_ATTENDANCE;
            }
            
            let hpChange = rule.hp;
            let detailsStr = `${rule.xp > 0 ? `+${rule.xp} XP` : ''} ${rule.hp < 0 ? `${rule.hp} HP` : ''}`.trim();
            
            if (status === 'LATE') {
                if (BRAND_CONFIG.enableFourStageLateRules && (BRAND_CONFIG as any).fourStageLateConfig) {
                    const cfg4 = (BRAND_CONFIG as any).fourStageLateConfig;
                    const lateMinutes = context.lateMinutes || 0;
                    const rate = penalties.HP_PENALTY_LATE_RATE || cfg4.hpPerMinuteRate || 1;

                    if (lateMinutes <= (cfg4.stage1MaxMins || 5)) {
                        // Stage 1 (1 - 5 mins): No HP penalty
                        hpChange = 0;
                        detailsStr = `0 HP (สาย ${lateMinutes} นาที - ช่วงอนุโลมพิเศษ) ${rule.xp > 0 ? `+${rule.xp} XP` : ''}`.trim();
                    } else if (lateMinutes <= (cfg4.stage2MaxMins || 30)) {
                        // Stage 2 (6 - 30 mins): rate * lateMinutes
                        const penalty = lateMinutes * rate;
                        hpChange = -penalty;
                        detailsStr = `-${penalty} HP (สาย ${lateMinutes} นาที) ${rule.xp > 0 ? `+${rule.xp} XP` : ''}`.trim();
                    } else if (lateMinutes <= (cfg4.stage3MaxMins || 60)) {
                        // Stage 3 (31 - 60 mins): rate * lateMinutes
                        const penalty = lateMinutes * rate;
                        hpChange = -penalty;
                        detailsStr = `-${penalty} HP (สาย ${lateMinutes} นาที) ${rule.xp > 0 ? `+${rule.xp} XP` : ''}`.trim();
                    } else {
                        // Stage 4 (61+ mins): baseHp + lateMinutes * rate
                        const basePenalty = cfg4.stage4BaseHp || 300;
                        const penalty = basePenalty + (lateMinutes * rate);
                        hpChange = -penalty;
                        detailsStr = `-${penalty} HP (สาย ${lateMinutes} นาที - ปรับหนัก ${basePenalty} + ${lateMinutes * rate}) ${rule.xp > 0 ? `+${rule.xp} XP` : ''}`.trim();
                    }
                } else {
                    const lateModeDynamic = penalties.LATE_MODE_DYNAMIC !== undefined ? penalties.LATE_MODE_DYNAMIC : 0;
                    if (lateModeDynamic === 1) {
                        const lateMinutes = context.lateMinutes || 0;
                        const interval = penalties.HP_PENALTY_LATE_INTERVAL || 10;
                        const rate = penalties.HP_PENALTY_LATE_RATE || 1;
                        const penalty = Math.ceil(lateMinutes / interval) * rate;
                        hpChange = -penalty;
                        detailsStr = `-${penalty} HP (สาย ${lateMinutes} นาที) ${rule.xp > 0 ? `+${rule.xp} XP` : ''}`.trim();
                    }
                }
            }
            
            const timeStr = context.time ? ` @ ${context.time}` : '';
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            
            let msg = '';
            if (status === 'LATE') {
                const lateMinutes = context.lateMinutes || 0;
                if (BRAND_CONFIG.enableFourStageLateRules && (BRAND_CONFIG as any).fourStageLateConfig && lateMinutes <= ((BRAND_CONFIG as any).fourStageLateConfig.stage1MaxMins || 5)) {
                    msg = `เข้างานสาย${timeStr}${lateMinutes > 0 ? ` (สาย ${lateMinutes} นาที - ช่วงอนุโลมพิเศษ)` : ''}${dateStr}`;
                } else {
                    msg = `เข้างานสาย${timeStr}${lateMinutes > 0 ? ` (สาย ${lateMinutes} นาที)` : ''}${dateStr}`;
                }
            } else if (status === 'APPEAL') {
                if (context.isLate) {
                    msg = `เข้างาน (รออนุมัติสาย)${timeStr}`;
                } else {
                    msg = `เข้างาน (รออนุมัติ Onsite)${timeStr}`;
                }
            } else {
                msg = `เข้างานตรงเวลา${timeStr}`;
            }
            
            return {
                xp: rule.xp,
                hp: hpChange,
                coins: rule.coins,
                message: msg,
                details: detailsStr
            };
        }

        case 'ATTENDANCE_CHECK_OUT': {
            const xpReward = globals.XP_ATTENDANCE || 10; 
            const coinReward = globals.COIN_ATTENDANCE || 5;
            const timeStr = context.time ? ` @ ${context.time}` : '';
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            
            return {
                xp: xpReward,
                hp: 0,
                coins: coinReward,
                message: `ลงเวลาออกงานเรียบร้อย${timeStr}${dateStr}`,
                details: `+${xpReward} XP, +${coinReward} JP`
            };
        }

        case 'ATTENDANCE_ABSENT': {
            const rule = attendanceRules.ABSENT;
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            return {
                xp: rule.xp,
                hp: rule.hp,
                coins: rule.coins,
                message: `ขาดงาน!${dateStr}`,
                details: `${rule.hp} HP`
            };
        }
        
        case 'ATTENDANCE_LATE': {
            // Explicit penalty call (e.g. from rejection)
            const rule = attendanceRules.LATE;
            let hpChange = rule.hp;
            let detailsStr = `${rule.hp} HP`;
            
            if (BRAND_CONFIG.enableFourStageLateRules && (BRAND_CONFIG as any).fourStageLateConfig) {
                const cfg4 = (BRAND_CONFIG as any).fourStageLateConfig;
                const lateMinutes = context.lateMinutes || 0;
                const rate = penalties.HP_PENALTY_LATE_RATE || cfg4.hpPerMinuteRate || 1;

                if (lateMinutes <= (cfg4.stage1MaxMins || 5)) {
                    hpChange = 0;
                    detailsStr = `0 HP (สาย ${lateMinutes} นาที - ช่วงอนุโลมพิเศษ)`;
                } else if (lateMinutes <= (cfg4.stage2MaxMins || 30)) {
                    const penalty = lateMinutes * rate;
                    hpChange = -penalty;
                    detailsStr = `-${penalty} HP (สาย ${lateMinutes} นาที)`;
                } else if (lateMinutes <= (cfg4.stage3MaxMins || 60)) {
                    const penalty = lateMinutes * rate;
                    hpChange = -penalty;
                    detailsStr = `-${penalty} HP (สาย ${lateMinutes} นาที)`;
                } else {
                    const basePenalty = cfg4.stage4BaseHp || 300;
                    const penalty = basePenalty + (lateMinutes * rate);
                    hpChange = -penalty;
                    detailsStr = `-${penalty} HP (สาย ${lateMinutes} นาที - ปรับหนัก ${basePenalty} + ${lateMinutes * rate})`;
                }
            } else {
                const lateModeDynamic = penalties.LATE_MODE_DYNAMIC !== undefined ? penalties.LATE_MODE_DYNAMIC : 0;
                if (lateModeDynamic === 1) {
                    const lateMinutes = context.lateMinutes || 0;
                    const interval = penalties.HP_PENALTY_LATE_INTERVAL || 10;
                    const rate = penalties.HP_PENALTY_LATE_RATE || 1;
                    const penalty = Math.ceil(lateMinutes / interval) * rate;
                    hpChange = -penalty;
                    detailsStr = `-${penalty} HP (สาย ${lateMinutes} นาที)`;
                }
            }

            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            return {
                xp: rule.xp,
                hp: hpChange,
                coins: rule.coins,
                message: `มาสาย (คำขอถูกปฏิเสธ)${dateStr}`,
                details: detailsStr
            };
        }

        case 'ATTENDANCE_NO_SHOW': {
             const rule = attendanceRules.NO_SHOW;
             const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
             return {
                 xp: rule.xp,
                 hp: rule.hp,
                 coins: rule.coins,
                 message: `หายตัวไปเลย (No Show)${dateStr}`,
                 details: 'CRITICAL PENALTY'
             };
        }

        case 'ATTENDANCE_FORGOT_CHECKOUT': {
            const rule = attendanceRules.FORGOT_CHECKOUT || { xp: 0, hp: -10, coins: 0 };
            const dateStr = context.date ? ` (${formatDate(context.date)})` : '';
            return {
                xp: rule.xp,
                hp: rule.hp,
                coins: rule.coins,
                message: `ลืมตอกบัตรออกข้ามวัน!${dateStr}`,
                details: `${rule.hp} HP`
            };
        }

        case 'ATTENDANCE_CORRECTION_REFUND': {
            const rule = attendanceRules.CORRECTION_REFUND || { xp: 0, hp: 5, coins: 0 };
            return {
                xp: rule.xp,
                hp: rule.hp,
                coins: rule.coins,
                message: context.originalDescription || `คืนค่า HP จากการแก้เวลาออกงาน`,
                details: `+${rule.hp} HP`
            };
        }

        case 'ATTENDANCE_ABSENT_REFUND': {
            const rule = attendanceRules.ABSENT_REFUND || { xp: 0, hp: 15, coins: 0 };
            return {
                xp: rule.xp,
                hp: rule.hp,
                coins: rule.coins,
                message: context.originalDescription || `คืนค่า HP จากการแก้สถานะขาดงาน`,
                details: `+${rule.hp} HP`
            };
        }
        
        case 'ATTENDANCE_EARLY_LEAVE': {
             const earlyLeaveModeDynamic = penalties.EARLY_LEAVE_MODE_DYNAMIC !== undefined ? penalties.EARLY_LEAVE_MODE_DYNAMIC : 1;
             let hpChange = 0;
             let detailsStr = '';
             
             if (earlyLeaveModeDynamic === 1) {
                 const interval = penalties.HP_PENALTY_EARLY_LEAVE_INTERVAL || 10;
                 const rate = penalties.HP_PENALTY_EARLY_LEAVE_RATE || 1;
                 const penalty = Math.ceil((context.missingMinutes || 0) / interval) * rate;
                 hpChange = -penalty;
                 detailsStr = `-${penalty} HP`;
             } else {
                 hpChange = attendanceRules.EARLY_LEAVE?.hp || 0;
                 detailsStr = `${hpChange} HP`;
             }
             
             const missingStr = context.missingMinutes ? ` (ขาด ${context.missingMinutes} นาที)` : '';

             return {
                 xp: 0,
                 hp: hpChange,
                 coins: 0,
                 message: `กลับก่อนเวลา${missingStr}`,
                 details: detailsStr
             };
        }

        case 'ATTENDANCE_LEAVE': {
             // context: { type: string (e.g. 'SICK', 'VACATION') }
             const leaveTypeMap: Record<string, string> = {
                 'SICK': 'ลาป่วย',
                 'VACATION': 'ลาพักร้อน',
                 'PERSONAL': 'ลากิจ',
                 'EMERGENCY': 'เหตุฉุกเฉิน',
                 'LATE_ENTRY': 'ขอเข้าสาย',
                 'OVERTIME': 'ขอ OT',
                 'FORGOT_CHECKIN': 'ลืมเช็คอิน',
                 'FORGOT_CHECKOUT': 'ลืมเช็คออก',
                 'WFH': 'Work From Home'
             };
             const typeLabel = leaveTypeMap[context.type] || context.type;
             
             // Dynamic scoring for leaves
             const rule = attendanceRules[context.type] || { xp: 0, hp: 0, coins: 0 };
             
             return {
                 xp: rule.xp || 0,
                 hp: rule.hp || 0,
                 coins: rule.coins || 0,
                 message: `ใช้วันลา: ${typeLabel}`,
                 details: `${rule.xp > 0 ? `+${rule.xp} XP ` : ''}${rule.hp < 0 ? `${rule.hp} HP` : ''}`.trim()
             };
        }

        case 'ATTENDANCE_UNAUTHORIZED_WFH':
        case 'ATTENDANCE_UNAUTHORIZED_ONSITE': {
            const penalty = (penalties.HP_PENALTY_UNAUTHORIZED_WFH !== undefined && penalties.HP_PENALTY_UNAUTHORIZED_WFH !== null)
                ? Number(penalties.HP_PENALTY_UNAUTHORIZED_WFH)
                : 5;
            const isSite = action === 'ATTENDANCE_UNAUTHORIZED_ONSITE' || context?.workType === 'SITE' || context?.type === 'ONSITE' || context?.workType === 'ONSITE';
            const workTypeLabel = isSite ? 'On-site (ปฏิบัติงานนอกสถานที่)' : 'WFH';
            
            const isNoPenalty = penalty === 0;
            const message = isNoPenalty 
                ? `บันทึกพิกัด! เช็คอิน ${workTypeLabel} นอกพื้นที่สำนักงาน`
                : `หักคะแนน! เช็คอิน ${workTypeLabel} โดยไม่ได้ขออนุญาตล่วงหน้า`;
            
            const details = isNoPenalty
                ? `0 HP (ไม่มีโทษหักคะแนน)`
                : `-${penalty} HP`;

            return {
                xp: 0,
                hp: -penalty,
                coins: 0,
                message: message,
                details: details
            };
        }

        case 'SHOP_PURCHASE':
            return {
                xp: 0,
                hp: 0,
                coins: context.cost ? -context.cost : 0,
                message: `ซื้อไอเทม: ${context.itemName || 'สินค้า'}`,
                details: `-${context.cost} JP`
            };
            
        case 'ITEM_USE': {
            let effectDesc = '';
            if (context.effectValue) {
                if (context.effectType === 'HEAL_HP') effectDesc = ` (HP +${context.effectValue})`;
                // Add other effect types if needed
            }
            return {
                xp: 0,
                hp: 0, 
                coins: 0,
                message: `ใช้ไอเทม: ${context.itemName}${effectDesc}`,
                details: ''
            };
        }
            
        case 'MANUAL_ADJUST':
            return {
                xp: context.xp || 0,
                hp: context.hp || 0,
                coins: context.coins || 0,
                message: `👑 GM ${context.adminName || 'Admin'} ปรับค่า: ${context.reason || 'No Reason'}`,
                details: 'Manual Adjustment'
            };
            
        case 'TIME_WARP_REFUND':
             return {
                 xp: 0,
                 hp: context.hp || 0,
                 coins: context.coins || 0,
                 message: `⏰ Time Warp: ย้อนเวลาล้างโทษ "${context.originalDescription || 'Unknown'}"`,
                 details: 'Refunded'
             };

        // --- NEW: KPI REWARDS ---
        case 'KPI_REWARD': {
            const grade = context.grade || 'D';
            // Use Dynamic Rewards
            const r = kpiRewards[grade] || kpiRewards['D'] || { xp: 0, coins: 0 };
            
            return {
                xp: r.xp,
                hp: 0,
                coins: r.coins,
                message: `KPI Reward: Grade ${grade}`,
                details: `+${r.xp} XP, +${r.coins} JP`
            };
        }

        case 'TRIBUNAL_REWARD': {
            const { category, reason } = context;
            const tribunalCfg = cfg.TRIBUNAL_CONFIG || DEFAULT_GAME_CONFIG.TRIBUNAL_CONFIG;
            const xp = 0; // No XP for reporting yet
            const hp = tribunalCfg.reward_hp || 10;
            const coins = tribunalCfg.reward_points || 50;
            
            return {
                xp,
                hp,
                coins,
                message: `⚖️ รางวัลแจ้งเหตุ: ${category}`,
                details: `+${hp} HP, +${coins} JP`
            };
        }

        case 'TRIBUNAL_PENALTY': {
            const { category, reason, isFalseReport } = context;
            const tribunalCfg = cfg.TRIBUNAL_CONFIG || DEFAULT_GAME_CONFIG.TRIBUNAL_CONFIG;
            const hpPenalty = isFalseReport 
                ? (tribunalCfg.false_report_penalty_hp || 15)
                : (tribunalCfg.penalty_hp || 20);
            
            return {
                xp: 0,
                hp: -hpPenalty,
                coins: 0,
                message: isFalseReport ? `⚖️ กฎแห่งกรรม! แจ้งเหตุเท็จ: ${category}` : `⚖️ บทลงโทษ: ${category}`,
                details: `-${hpPenalty} HP`
            };
        }

        case 'SYSTEM_BURIAL':
            return {
                xp: context.xpChange || -100,
                hp: context.hpChange || 0,
                coins: context.pointsChange || 0,
                message: `💀 Permanent Burial: ${context.description || 'พ้นสภาพพนักงาน'}`,
                details: 'Game Over'
            };

        case 'ATTENDANCE_OVERTIME': {
            const hours = context.hours || 0;
            const rate = globals.OT_JP_RATE_PER_HOUR !== undefined ? globals.OT_JP_RATE_PER_HOUR : 10;
            const coins = Math.round(hours * rate);
            const xp = Math.round(hours * rate);
            return {
                xp,
                hp: 0,
                coins,
                message: `🎉 ได้รับโบนัสการทำงานล่วงเวลา +${coins} JP (${hours} ชั่วโมง)`,
                details: `+${xp} XP, +${coins} JP`
            };
        }

        default:
            return { xp: 0, hp: 0, coins: 0, message: '', details: '' };
    }
};

import { Clock, ClipboardCheck, Target, TrendingUp, ShieldAlert, Gavel } from 'lucide-react';

export const PRETTY_LABELS: Record<string, string> = {
    // GLOBAL_MULTIPLIERS
    XP_TASK_COMPLETE: "XP เมื่อจบงาน (Task)",
    COIN_TASK: "Coins เมื่อจบงาน (Task)",
    XP_DUTY_COMPLETE: "XP เมื่อทำเวรเสร็จ",
    XP_DUTY_ASSIST: "XP เมื่อช่วยเพื่อนทำเวร",
    XP_ATTENDANCE: "XP พื้นฐานการเข้างาน",
    COIN_ATTENDANCE: "Coins พื้นฐานการเข้างาน",
    XP_BONUS_EARLY: "XP โบนัสส่งงานไว (ก่อนกำหนด)",
    COIN_BONUS_EARLY: "Coins โบนัสส่งงานไว (ก่อนกำหนด)",
    XP_PER_HOUR: "XP ตามชั่วโมงประเมินของงาน",
    BASE_XP_PER_LEVEL: "XP พื้นฐานต่อเลเวล (Global)",
    XP_DUTY_LATE_SUBMIT: "XP เมื่อส่งเวรสาย",
    COIN_DUTY: "Coins จากการทำเวร",

    // PENALTY_RATES
    HP_PENALTY_LATE: "โทษหัก HP มาสาย (Base)",
    HP_PENALTY_MISSED_DUTY: "โทษหัก HP ไม่ทำเวร",
    HP_PENALTY_LATE_MULTIPLIER: "ตัวคูณหัก HP มาสายรายวัน",
    HP_PENALTY_DUTY_LATE_SUBMIT: "โทษหัก HP ส่งเวรสาย",
    HP_REFUND_DUTY_REDEEM: "รางวัล HP เมื่อแก้ตัวที่ศาล (Redeem)",
    HP_PENALTY_EARLY_LEAVE_RATE: "อัตราหัก HP กลับก่อนเวลา",
    HP_PENALTY_UNAUTHORIZED_WFH: "โทษหัก HP ไม่ได้รับอนุญาต",
    HP_PENALTY_EARLY_LEAVE_INTERVAL: "ช่วงเวลาหัก HP กลับก่อน (นาที)",
    COIN_PENALTY_LATE_PER_DAY: "โทษหัก Coins มาสายรายวัน",
    LATE_MODE_DYNAMIC: "ระบบหักแต้มสาย Dynamic (0=Flat, 1=Dynamic)",
    EARLY_LEAVE_MODE_DYNAMIC: "ระบบหักแต้มกลับก่อน Dynamic (0=Flat, 1=Dynamic)",
    HP_PENALTY_LATE_INTERVAL: "ช่วงเวลาหัก HP มาสาย (นาที)",
    HP_PENALTY_LATE_RATE: "อัตราหัก HP มาสายต่อรอบ",

    // AUTO_JUDGE_CONFIG
    duty_grace_hour: "ชั่วโมงผ่อนปรนการส่งเวร (ชั่วโมง)",
    lookback_days_check: "จำนวนวันตรวจสอบย้อนหลัง (AI)",
    negligence_penalty_hp: "โทษหัก HP ความเพิกเฉย (AI)",
    negligence_threshold_days: "เกณฑ์วันตัดสินความเพิกเฉย",

    // DIFFICULTY_XP
    EASY: "รางวัล XP ระดับง่าย (Easy)",
    MEDIUM: "รางวัล XP ระดับกลาง (Medium)",
    HARD: "รางวัล XP ระดับยาก (Hard)",

    // LEVELING_SYSTEM
    base_xp_per_level: "XP พื้นฐานสำหรับ Level Up",
    level_up_bonus_coins: "โบนัส Coins เมื่อเลเวลอัป",
    max_level: "เลเวลสูงสุด",

    // ITEM_MECHANICS
    shop_tax_rate: "ภาษีร้านค้า (%)",
    time_warp_refund_cap_hp: "ขีดจำกัดการคืน HP (Time Warp)",
    time_warp_refund_percent: "เปอร์เซ็นต์การคืน HP (Time Warp)",

    // TRIBUNAL
    reward_hp: "รางวัล HP ผู้แจ้งเหตุ",
    penalty_hp: "โทษหัก HP ผู้ถูกแจ้ง",
    false_report_penalty_hp: "โทษหัก HP แจ้งเหตุเท็จ",
    reward_points: "รางวัลแต้มผู้แจ้งเหตุ"
};

// --- FEATURE BASED GROUPING DEFINITION ---
export const FEATURE_GROUPS = [
    {
        id: 'ATTENDANCE',
        title: 'ระบบเข้างาน & วันลา',
        description: 'การเข้างาน การมาทำงานตรงเวลา และการกลับก่อนเวลาแบบอัจฉริยะ',
        icon: Clock,
        color: 'indigo',
        keys: [
            'XP_ATTENDANCE', 'COIN_ATTENDANCE', 'HP_PENALTY_EARLY_LEAVE_RATE', 'HP_PENALTY_EARLY_LEAVE_INTERVAL', 
            'HP_PENALTY_UNAUTHORIZED_WFH',
            'LATE_MODE_DYNAMIC', 'EARLY_LEAVE_MODE_DYNAMIC', 'HP_PENALTY_LATE_INTERVAL', 'HP_PENALTY_LATE_RATE'
        ]
    },
    {
        id: 'DUTY',
        title: 'ระบบเวรทำความสะอาด',
        description: 'การจัดการความรับผิดชอบ รางวัลการทำเวร และบทลงโทษสำหรับการละเลยเวร',
        icon: ClipboardCheck,
        color: 'orange',
        keys: [
            'XP_DUTY_COMPLETE', 'COIN_DUTY', 'XP_DUTY_ASSIST', 'HP_PENALTY_MISSED_DUTY', 
            'HP_PENALTY_DUTY_LATE_SUBMIT', 'HP_REFUND_DUTY_REDEEM', 'XP_DUTY_LATE_SUBMIT', 'duty_grace_hour'
        ]
    },
    {
        id: 'TASK',
        title: 'ระบบภารกิจและผลงาน',
        description: 'ค่าตอบแทนเมื่อส่งงานสำเร็จ โบนัสตามชั่วโมงประเมิน โบนัสส่งงานก่อนกำหนด และบทปรับเมื่อส่งงานล่าช้า',
        icon: Target,
        color: 'rose',
        keys: [
            'XP_TASK_COMPLETE', 'COIN_TASK', 'XP_BONUS_EARLY', 'COIN_BONUS_EARLY', 
            'XP_PER_HOUR', 'HP_PENALTY_LATE', 'HP_PENALTY_LATE_MULTIPLIER', 'COIN_PENALTY_LATE_PER_DAY'
        ]
    },
    {
        id: 'GROWTH',
        title: 'ระบบเลเวลและระดับความยาก',
        description: 'เกณฑ์คะแนนประสบการณ์ในการเลเวลอัป และรางวัลจำแนกตามความยากของงาน',
        icon: TrendingUp,
        color: 'emerald',
        keys: [
            'BASE_XP_PER_LEVEL', 'base_xp_per_level', 'level_up_bonus_coins', 'max_level',
            'EASY', 'MEDIUM', 'HARD'
        ]
    },
    {
        id: 'SYSTEM',
        title: 'ระบบ AI และกลไกอัตโนมัติ',
        description: 'ระบบตัดสินความเพิกเฉยของ AI ภาษีการค้า และอัตรากู้พลังชีวิตของไอเทม',
        icon: ShieldAlert,
        color: 'slate',
        keys: [
            'lookback_days_check', 'negligence_penalty_hp', 'negligence_threshold_days',
            'shop_tax_rate', 'time_warp_refund_cap_hp', 'time_warp_refund_percent'
        ]
    },
    {
        id: 'TRIBUNAL',
        title: 'ระบบศาลและไต่สวน',
        description: 'กลไกการแจ้งเหตุรักษาวินัยของสมาชิก โทษหักกรณีผิดกฎ และรางวัล HP สำหรับผู้พิทักษ์',
        icon: Gavel,
        color: 'amber',
        keys: [
            'reward_hp', 'penalty_hp', 'false_report_penalty_hp', 'reward_points'
        ]
    }
];

export interface SeverityInfo {
    sumPenalties: number;
    status: string;
    color: string;
    warning: string;
    severityValue: number;
}

export const calculateSeverity = (localConfig: any): SeverityInfo => {
    const hpLate = localConfig.PENALTY_RATES?.HP_PENALTY_LATE ?? 5;
    const hpMissedDuty = localConfig.PENALTY_RATES?.HP_PENALTY_MISSED_DUTY ?? 15;
    const hpDutyLate = localConfig.PENALTY_RATES?.HP_PENALTY_DUTY_LATE_SUBMIT ?? 5;
    const hpUnauthWfh = localConfig.PENALTY_RATES?.HP_PENALTY_UNAUTHORIZED_WFH ?? 15;
    const hpNegligence = localConfig.AUTO_JUDGE_CONFIG?.negligence_penalty_hp ?? 20;
    const hpTribunal = localConfig.TRIBUNAL_CONFIG?.penalty_hp ?? 10;
    const hpFalseReport = localConfig.TRIBUNAL_CONFIG?.false_report_penalty_hp ?? 10;

    const sumPenalties = hpLate + hpMissedDuty + hpDutyLate + hpUnauthWfh + hpNegligence + hpTribunal + hpFalseReport;

    let status = 'สมดุลดีเยี่ยม';
    let color = 'from-emerald-500 to-green-500 text-emerald-600 bg-emerald-50 border-emerald-100';
    let warning = 'ระบบมีความเสถียรและยุติธรรมสูง พนักงานได้รับแรงจูงใจที่สมเหตุสมผลและไม่ตึงเครียดจนเกินไป';
    let severityValue = 50; // default gauge midpoint

    if (sumPenalties < 35) {
        status = 'ระดับผ่อนคลายเกินไป (Easy Mode)';
        color = 'from-blue-500 to-teal-500 text-blue-600 bg-blue-50 border-blue-100';
        warning = 'บทลงโทษเบาเกินไป สมาชิกอาจไม่มีความกระตือรือร้นในการรักษาเวลา แนะนำให้เพิ่มอัตราหัก HP หรือ Coins เล็กน้อย';
        severityValue = Math.max(15, (sumPenalties / 35) * 40);
    } else if (sumPenalties >= 35 && sumPenalties <= 65) {
        status = 'ระดับสมดุลที่สมบูรณ์แบบ (Balanced)';
        color = 'from-emerald-500 to-green-500 text-emerald-600 bg-emerald-50 border-emerald-100';
        warning = 'กฎระเบียบมีความศักดิ์สิทธิ์และสมเหตุสมผลมาก เป็นระดับมาตรฐานที่เหมาะสำหรับการประคับประคองทีมในระยะยาว';
        severityValue = 40 + ((sumPenalties - 35) / 30) * 20;
    } else if (sumPenalties > 65 && sumPenalties <= 95) {
        status = 'ระดับตึงเครียดวินัยเข้มข้น (Challenging)';
        color = 'from-orange-500 to-amber-500 text-orange-600 bg-orange-50 border-orange-100';
        warning = 'กฎค่อนข้างเข้มงวดและมีบทลงโทษรุนแรง พนักงานจำเป็นต้องใช้ความรอบคอบและช่วยกันทำเวรเพื่อไม่ให้ HP หมดหลอด';
        severityValue = 60 + ((sumPenalties - 65) / 30) * 20;
    } else {
        status = 'ระดับอันตรายโหดร้ายสุดขั้ว (Hardcore)';
        color = 'from-rose-500 to-red-500 text-rose-600 bg-rose-50 border-rose-100';
        warning = 'บทลงโทษหักล้างรุนแรงเกินไป! พนักงานเสี่ยงต่อการโดนหัก HP ตายเรียบอย่างรวดเร็ว แนะนำให้ปรับลดโทษลงเพื่อลดความกดดัน';
        severityValue = Math.min(100, 80 + ((sumPenalties - 95) / 50) * 20);
    }

    return { sumPenalties, status, color, warning, severityValue };
};

export const ATTENDANCE_RULE_LABELS: Record<string, string> = {
    ON_TIME: "มาตรงเวลา (On Time)",
    LATE: "มาสาย (Late)",
    APPEAL: "รออนุมัติสาย (Appeal)",
    ABSENT: "ขาดงาน (Absent)",
    NO_SHOW: "หายเงียบ (No Show)",
    LEAVE: "การลา (ทั่วไป)",
    WFH: "ทำงานจากบ้าน (WFH)",
    SITE: "ปฏิบัติงานนอกสถานที่ (Site)",
    FORGOT_CHECKOUT: "ลืมเช็คเอาต์",
    CORRECTION_REFUND: "คืนค่า HP จากการแก้เวลาออกงาน",
    ABSENT_REFUND: "คืนค่า HP จากการแก้สถานะขาดงาน",
    EARLY_LEAVE: "กลับก่อนเวลา (Early Leave)",
    SICK: "ลาป่วย",
    VACATION: "ลาพักร้อน",
    PERSONAL: "ลากิจ",
    EMERGENCY: "ลาฉุกเฉิน",
    LATE_ENTRY: "แจ้งเข้าสาย",
    OVERTIME: "ขอทำ OT",
    FORGOT_CHECKIN: "ลืมเช็คอิน",
    UNPAID: "ลากิจไม่รับค่าจ้าง (Unpaid)"
};


export interface SyncedPlayer {
    id: string;
    name: string;
    level: number;
    color?: string;
    x: number; // normalized flat X (0..1)
    y: number; // normalized flat Y (0..1)
    idle: boolean;
    hp?: number;
    maxHp?: number;
    feeling?: string;
    focusTask?: string;
}

// Fixed 3D flat space grid coordinates layout for furniture (space [-1.35..1.35] for wide room)
export const FURNITURE_MAP = {
    BOOKSHELF:         { fx: -0.95, fy: -0.95, label: '📚 ชั้นหนังสือเสกวิชา (สถิติเลเวล)' },
    DESK:              { fx: 0.75,  fy: -0.80, label: '💻 โต๊ะทำงานส่วนตัว (กระดานงาน)' },
    SOFA:              { fx: -0.10, fy: 0.85,  label: '🛋️ โซฟาผ่อนคลาย (ชั่วโมงโฟกัส)' },
    PLANT_1:           { fx: -1.25, fy: 0.80,  label: '🌱 กระถางนำโชคพฤกษา' },
    PLANT_2:           { fx: 1.25,  fy: 0.80,  label: '🌱 มุมใบไม้พริ้วเวทมนตร์' },
    QUEST_BOARD:       { fx: -0.90, fy: 0.15,  label: '📜 ป้ายภารกิจกิลด์รายสัปดาห์' },
    DUTY_SIGN:         { fx: 0.90,  fy: -0.35, label: '🚦 เสาสัญญาณเวรหน้าที่ปฏิบัติการ' },
    GOAL_BEACON:       { fx: -0.40, fy: -0.55, label: '🔮 เสาคริสตัลเจตจำนงเป้าหมาย' },
    LEADERBOARD_ALTAR: { fx: 0.85,  fy: 0.25,  label: '🏆 แท่นหินเกียรติยศ Hall of Fame' },
    VAULT_BOX:         { fx: 0.40,  fy: 1.20,  label: '🪙 หีบมหาสมบัติร้านค้าแลกพอยท์' },
    CHAT_BALL:         { fx: -0.65, fy: 1.15,  label: '🔮 ลูกแก้วพยากรณ์สื่อสารปาร์ตี้' },
    WIKI_PORTAL:       { fx: -1.20, fy: -0.45, label: '🚪 ซุ้มวิกิมิติความรู้โบราณ' },
    
    // NEW DECORATIVE FURNITURE
    CAULDRON:          { fx: -1.20, fy: 0.15,  label: '🧪 หม้อปรุงยาเวทมนตร์เดือดปุดๆ' },
    CAT_BED:           { fx: 0.35,  fy: -1.20, label: '🐈 เบาะนอนแมวดำผู้พิทักษ์' },
    STELLAR_GLOBE:     { fx: -0.30, fy: -1.20, label: '🌌 ลูกโลกจำลองวิถีดวงดาวดาราศาสตร์' },
    MAGIC_WELL:        { fx: 1.20,  fy: -0.30, label: '💎 บ่อคริสตัลอธิษฐานจิตสมาธิ' },
    
    // HOUSEHOLD COZY HOME FURNITURE
    BED:               { fx: 0.10,  fy: -0.85, label: '🛏️ เตียงนอนขนนกนุ่มสลวย' },
    TELEVISION:        { fx: -0.60, fy: 0.65,  label: '📺 โทรทัศน์สมาร์ทเรโทรโบราณ' },
    DINING_TABLE:      { fx: 0.20,  fy: -0.20, label: '☕ โต๊ะทานอาหารสองที่นั่งอบอุ่น' },
    WARDROBE:          { fx: 0.95,  fy: -1.15, label: '🚪 ตู้เสื้อผ้าไม้โอ๊คแสนอบอุ่น' }
};

// Isometric bounds
export const MIN_BOUND = -1.35;
export const MAX_BOUND = 1.35;

/**
 * Maps flat coordinates (fx, fy) [-1..1] into 3D isometric screen coordinates (x, y) with viewport pan and zoom.
 */
export const getIsometricPos = (
    fx: number, 
    fy: number, 
    width: number, 
    height: number, 
    panX: number = 0, 
    panY: number = 0, 
    zoom: number = 1.0
) => {
    const centerX = width / 2 + panX;
    const centerY = height * 0.55 + panY; // Slightly lower midpoint to offset floating HUD
    const scaleX = Math.min(width * 0.44, 480) * zoom;
    const scaleY = scaleX * 0.52; // Classic 2:1 isometric ratio

    return {
        x: centerX + (fx - fy) * scaleX,
        y: centerY + (fx + fy) * scaleY
    };
};

/**
 * Projects screen coordinates (clientX, clientY) back to 3D isometric flat coordinates (fx, fy).
 */
export const getFlatPosFromScreen = (
    clientX: number,
    clientY: number,
    width: number,
    height: number,
    panX: number = 0,
    panY: number = 0,
    zoom: number = 1.0
) => {
    const centerX = width / 2 + panX;
    const centerY = height * 0.55 + panY;
    const scaleX = Math.min(width * 0.44, 480) * zoom;
    const scaleY = scaleX * 0.52;

    const screenXOffset = clientX - centerX;
    const screenYOffset = clientY - centerY;

    const fx = (screenXOffset / scaleX + screenYOffset / scaleY) / 2;
    const fy = (screenYOffset / scaleY - screenXOffset / scaleX) / 2;

    // Enforce safe boundaries
    return {
        fx: Math.max(MIN_BOUND, Math.min(MAX_BOUND, fx)),
        fy: Math.max(MIN_BOUND, Math.min(MAX_BOUND, fy))
    };
};

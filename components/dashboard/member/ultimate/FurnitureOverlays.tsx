import React from 'react';
import { FURNITURE_MAP, getIsometricPos } from './utils/isometric';
import { EdgeAwareTooltip } from './EdgeAwareTooltip';

interface FurnitureOverlaysProps {
    windowSize: { width: number; height: number };
    viewport: { zoom: number; pan: { x: number; y: number } };
    onFurnitureClick: (key: string) => void;
}

export const FurnitureOverlays: React.FC<FurnitureOverlaysProps> = React.memo(({
    windowSize,
    viewport,
    onFurnitureClick,
}) => {
    // Return custom interactive descriptors for exquisite tooltip display
    const getFurnitureMetadata = (key: string) => {
        switch (key) {
            case 'BOOKSHELF':
                return {
                    icon: '📚',
                    name: 'สมุดวิเคราะห์วิญญาณ Bento Stats',
                    desc: 'ตรวจสอบระดับพลังกาย พลังจิตวิชา และสถิติความละเอียดของเควสงานที่ปราบสำเร็จ',
                };
            case 'DESK':
                return {
                    icon: '💻',
                    name: 'โต๊ะมนตราส่วนตัว (My Work Board)',
                    desc: 'กระดานจัดระเบียบงานอัจฉริยะ ลากวาง ปรับระดับงาน และพ่นพลังฟิตสมาธิ',
                };
            case 'SOFA':
                return {
                    icon: '🛋️',
                    name: 'เครื่องดนตรีสมมาตร Focus Shield',
                    desc: 'ปรับจูนคลื่นเสียงสังเคราะห์สะกดจิต คุมนาฬิกาโพโมโดโร่พิทักษ์ความวอกแวก',
                };
            case 'QUEST_BOARD':
                return {
                    icon: '📜',
                    name: 'กระดานเควสกิลด์รายสัปดาห์',
                    desc: 'เช็คลิสต์ภารกิจและงานเป้าหมายระดับทีมร่วมกัน เพิ่มพูนผลสัมฤทธิ์แสนชื่นมื่น',
                };
            case 'DUTY_BROOM':
                return {
                    icon: '🧹',
                    name: 'ไม้กวาดมนตราเวรเกียรติยศ (Duty)',
                    desc: 'ปัดกวาดเช็ดถูมลทิน เฝ้าเวรกองบัญชาการ และตราตารางจัดการเวรงานของชาวกิลด์',
                };
            case 'GOAL_BEACON':
                return {
                    icon: '🎯',
                    name: 'คริสตัลเป้าหมาย (Goal Beacon)',
                    desc: 'จุดเนตรส่งสาส์นเป้าหมายสมาคมประจำไตรมาส ปักธงแห่งชัยชนะร่วมกัน',
                };
            case 'LEADERBOARD_ALTAR':
                return {
                    icon: '🏆',
                    name: 'แท่นหินอารยธรรมเกียรติยศ Hall of Fame',
                    desc: 'เชิดชูผู้ครองคะแนนเกียรติประวัติสูงสุดสัปดาห์นี้และอันดับมหาจอมเวทสะสม XP',
                };
            case 'VAULT_BOX':
                return {
                    icon: '🪙',
                    name: 'หีบขุมทรัพย์วิญญาณสมาคม (Item Shop)',
                    desc: 'นำคะแนนเกียรติยศกิลด์ แลกคูปอง รางวัล หรือพรเศษส่วนตัวสุดปัง',
                };
            case 'CHAT_BALL':
                return {
                    icon: '🔮',
                    name: 'ลูกแก้วทำนายพยากรณ์ข่าวสาร (Chat)',
                    desc: 'ร่ายกระแสจิตส่งข้อความ กระซิบแชทคุยความเคลื่อนไหวภายในปาร์ตี้เรียลไทม์',
                };
            case 'WIKI_PORTAL':
                return {
                    icon: '🚪',
                    name: 'ซุ้มหนังสือมิติความรู้โบราณ (Wiki)',
                    desc: 'ไขดัมภ์คัมภีร์วิถีการปฏิบัติงาน ขั้นตอนเทมเพลต และกลเม็ดเคลียร์เควสอย่างว่องไว',
                };
            case 'WHITEBOARD':
                return {
                    icon: '📋',
                    name: 'กระดานวางแผนเวทมนตร์ (Calendar)',
                    desc: 'กระดานวาดปฏิทินงาน จัดเรียงกำหนดการณ์แผนงานของสมาคมและไทม์ไลน์รายปี',
                };
            case 'MEETING_TABLE':
                return {
                    icon: '🤝',
                    name: 'โต๊ะมนตราสภาคองเกรส (Team Area)',
                    desc: 'ล้อมวงเข้าประชุมปรึกษาหารือ ร่ายสมาสพลังรังสรรค์ของกองบัญชาการปาร์ตี้กิลด์',
                };
            default:
                return {
                    icon: '✨',
                    name: 'เครื่องเรือนเวทมนตร์',
                    desc: 'เปิดสมาธิเพื่อสำรวจมิติการทำงานล้ำยุค',
                };
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-10 select-none">
            {Object.entries(FURNITURE_MAP).map(([key, f]) => {
                const isInteractable = [
                    'BOOKSHELF',
                    'DESK',
                    'SOFA',
                    'QUEST_BOARD',
                    'DUTY_BROOM',
                    'GOAL_BEACON',
                    'LEADERBOARD_ALTAR',
                    'VAULT_BOX',
                    'CHAT_BALL',
                    'WIKI_PORTAL',
                    'WHITEBOARD',
                    'MEETING_TABLE',
                ].includes(key);
                if (!isInteractable) return null;

                const pos = getIsometricPos(
                    f.fx,
                    f.fy,
                    windowSize.width,
                    windowSize.height,
                    viewport.pan.x,
                    viewport.pan.y,
                    viewport.zoom
                );

                const getOffset = (k: string) => {
                    switch (k) {
                        case 'BOOKSHELF':
                            return 42;
                        case 'WIKI_PORTAL':
                            return 52;
                        case 'WHITEBOARD':
                            return 42;
                        case 'DUTY_BROOM':
                            return 36;
                        case 'DESK':
                            return 16;
                        case 'SOFA':
                            return 10;
                        case 'MEETING_TABLE':
                            return 15;
                        default:
                            return 20;
                    }
                };

                const labelShort = f.label.replace(/\(.*?\)/g, '').trim();
                const meta = getFurnitureMetadata(key);

                // Tooltip Content JSX
                const tooltipContent = (
                    <div className="flex flex-col gap-1 p-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                            <span className="text-sm select-none">{meta.icon}</span>
                            <span className="text-xs tracking-tight">{meta.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal max-w-[210px]">
                            {meta.desc}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[7.5px] font-mono font-black text-pink-400 uppercase tracking-widest border-t border-indigo-500/10 pt-1">
                            <span>🔮 CLICK TO ACTIVATE</span>
                            <span>TAP ➔</span>
                        </div>
                    </div>
                );

                return (
                    <EdgeAwareTooltip
                        key={key}
                        content={tooltipContent}
                        placement="top"
                        delay={80}
                    >
                        <div
                            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer flex flex-col items-center justify-center p-5 md:p-3 bg-transparent"
                            style={{
                                left: `${pos.x}px`,
                                top: `${pos.y - getOffset(key) * viewport.zoom}px`,
                                transform: `translate(-50%, -50%) scale(${Math.max(
                                    0.65,
                                    Math.min(1.35, viewport.zoom)
                                )})`,
                            }}
                            onClick={() => onFurnitureClick(key)}
                        >
                            {/* Pulsating magic ring of light */}
                            <div className="w-8 h-8 md:w-5 md:h-5 rounded-full border border-pink-500/50 bg-pink-500/10 flex items-center justify-center animate-bounce shadow-[0_0_12px_rgba(236,72,153,0.3)] mb-1.5 md:group-hover:scale-125 transition-all duration-300">
                                <span className="w-3 h-3 md:w-2 md:h-2 rounded-full bg-pink-400 animate-ping" />
                            </div>

                            {/* Sparkling cursor help ring */}
                            <div className="absolute inset-x-[0px] inset-y-[0px] md:inset-x-[-12px] md:inset-y-[-6px] rounded-2xl border border-dashed border-pink-500/0 md:group-hover:border-pink-500/35 md:group-hover:bg-pink-500/5 transition-all duration-300 scale-95 group-hover:scale-105" />

                            {/* Floating pill badge always visible and glowing on hover */}
                            <span className="px-3 py-1.5 md:px-2 md:py-0.5 bg-[#111221]/92 border border-slate-700 group-hover:border-pink-500/60 text-white rounded-xl md:rounded-lg text-[11px] md:text-[9px] font-extrabold shadow-md transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 md:gap-1">
                                <span className="w-2 h-2 md:w-1.5 md:h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {labelShort}
                            </span>
                        </div>
                    </EdgeAwareTooltip>
                );
            })}
        </div>
    );
});

export default FurnitureOverlays;

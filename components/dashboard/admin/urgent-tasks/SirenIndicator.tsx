import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Siren, X, Shield, Activity, RefreshCw } from 'lucide-react';

export interface SirenLevel {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    title: string;
    statusText: string;
    colorClass: string;
    badgeColorClass: string;
    description: string;
    iconColor: string;
    animateClass: string;
    glowClass: string;
    bgPanelClass: string;
    dotColorClass: string;
}

export const getSirenLevel = (overdue: number, today: number): SirenLevel => {
    if (overdue === 0 && today === 0) {
        return {
            level: 1,
            title: "🟢 Level 1: All Clear",
            statusText: "สถานการณ์ปกติสมบูรณ์",
            colorClass: "bg-emerald-50 text-emerald-500 border-emerald-100 hover:bg-emerald-100/70",
            badgeColorClass: "bg-emerald-100 text-emerald-800",
            description: "มีงานค้างส่งเป็น 0 และไม่มีงานด่วนเข้าวันนี้ (ทีมงานฉลุย 100% ไร้ความกังวล)",
            iconColor: "text-emerald-500",
            animateClass: "",
            glowClass: "shadow-emerald-100",
            bgPanelClass: "bg-emerald-50/95 border-emerald-100",
            dotColorClass: "bg-emerald-500"
        };
    }
    if (overdue === 0 && today >= 1 && today <= 2) {
        return {
            level: 2,
            title: "🔵 Level 2: Active Guard",
            statusText: "งานใหม่ขับเคลื่อนปกติ",
            colorClass: "bg-blue-50 text-blue-500 border-blue-100 hover:bg-blue-100/70",
            badgeColorClass: "bg-blue-100 text-blue-800",
            description: "มีงานด่วนเข้ามาวันนี้ 1-2 งาน แต่ไม่มีงานค้าง (แผนงานสบายตัว คล่องตัวสูง)",
            iconColor: "text-blue-500",
            animateClass: "animate-pulse",
            glowClass: "shadow-blue-100",
            bgPanelClass: "bg-blue-50/95 border-blue-100",
            dotColorClass: "bg-blue-500"
        };
    }
    if (overdue === 0 && today >= 3) {
        return {
            level: 3,
            title: "🟣 Level 3: Steady Content",
            statusText: "ผลิตคอนเทนต์คึกคัก",
            colorClass: "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/70",
            badgeColorClass: "bg-purple-100 text-purple-800",
            description: "มีงานหมุนเวียนเยอะ 3+ งานขึ้นไป แต่ไม่มีงานค้าง (ทีมสร้างสรรค์งานอย่างมีจังหวะ)",
            iconColor: "text-purple-600",
            animateClass: "animate-pulse",
            glowClass: "shadow-purple-100",
            bgPanelClass: "bg-purple-50/95 border-purple-100",
            dotColorClass: "bg-purple-500"
        };
    }
    if (overdue >= 1 && overdue <= 2) {
        return {
            level: 4,
            title: "🟡 Level 4: Warm Backlog",
            statusText: "เฝ้าระวังล่าช้าเบา ๆ",
            colorClass: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100/70",
            badgeColorClass: "bg-amber-100 text-amber-800",
            description: "เริ่มมีงานช้ากว่ากำหนดค้างอยู่ 1-2 งาน (เริ่มส่งสัญญาณแจ้งเตือนเบา ๆ)",
            iconColor: "text-amber-500",
            animateClass: "animate-bounce",
            glowClass: "shadow-amber-100",
            bgPanelClass: "bg-amber-50/95 border-amber-200",
            dotColorClass: "bg-amber-500"
        };
    }
    if (overdue >= 3 && overdue <= 5) {
        return {
            level: 5,
            title: "🟠 Level 5: Severe Backlog",
            statusText: "งานเริ่มสะสมสูงสะดุด",
            colorClass: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100/70",
            badgeColorClass: "bg-orange-100 text-orange-800",
            description: "มีงานล่าช้าสะสม 3-5 งาน (ต้องการการช่วยเหลือ จัดแจงทรัพยากรเพิ่มความเร็ว)",
            iconColor: "text-orange-500",
            animateClass: "animate-pulse",
            glowClass: "shadow-orange-100",
            bgPanelClass: "bg-orange-50/95 border-orange-200",
            dotColorClass: "bg-orange-500"
        };
    }
    return {
        level: 6,
        title: "🔴 Level 6: Critical Overload",
        statusText: "วิกฤตระดับสูงสุด",
        colorClass: "bg-red-50 text-red-600 border-red-300 hover:bg-red-100/70 shadow-md",
        badgeColorClass: "bg-red-100 text-red-800",
        description: "มีงานตกค้างรุนแรงตั้งแต่ 6 งานขึ้นไป (สถานะเฝ้าระวังสูงสุด ทีมต้องการแกนหลักเข้าไปแทรกแซงช่วยเหลือด่วน)",
        iconColor: "text-red-600",
        animateClass: "animate-pulse scale-105",
        glowClass: "shadow-red-200 animate-pulse",
        bgPanelClass: "bg-red-50/95 border-red-200",
        dotColorClass: "bg-red-500"
    };
};

const ALL_LEVELS_DEFINITION: { level: 1 | 2 | 3 | 4 | 5 | 6; title: string; color: string; desc: string }[] = [
    { level: 1, title: "🟢 Level 1: All Clear", color: "text-emerald-500 bg-emerald-50 border-emerald-100", desc: "มีงานค้างส่งเป็น 0 และไม่มีงานด่วนเข้าวันนี้ (ทีมงานฉลุย 100% ไร้ความกังวล)" },
    { level: 2, title: "🔵 Level 2: Active Guard", color: "text-blue-500 bg-blue-50 border-blue-100", desc: "มีงานด่วนเข้ามาวันนี้ 1-2 งาน แต่ไม่มีงานค้าง (แผนงานสบายตัว คล่องตัวสูง)" },
    { level: 3, title: "🟣 Level 3: Steady Content", color: "text-purple-600 bg-purple-50 border-purple-100", desc: "มีงานหมุนเวียนเยอะ 3+ งานขึ้นไป แต่ไม่มีงานค้าง (ทีมสร้างสรรค์งานอย่างมีจังหวะ)" },
    { level: 4, title: "🟡 Level 4: Warm Backlog", color: "text-amber-600 bg-amber-50 border-amber-100", desc: "เริ่มมีงานช้ากว่ากำหนดค้างอยู่ 1-2 งาน (เริ่มส่งสัญญาณแจ้งเตือนเบา ๆ)" },
    { level: 5, title: "🟠 Level 5: Severe Backlog", color: "text-orange-600 bg-orange-50 border-orange-100", desc: "มีงานล่าช้าสะสม 3-5 งาน (ต้องการการช่วยเหลือ จัดแจงทรัพยากรเพิ่มความเร็ว)" },
    { level: 6, title: "🔴 Level 6: Critical Overload", color: "text-red-600 bg-red-50 border-red-200", desc: "มีงานตกค้างรุนแรงตั้งแต่ 6 งานขึ้นไป (สถานะเฝ้าระวังสูงสุด ทีมต้องการแกนหลักช่วยเหลือด่วน)" }
];

interface SirenIndicatorProps {
    overdueCount: number;
    todayCount: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export const SirenIndicator: React.FC<SirenIndicatorProps> = ({
    overdueCount,
    todayCount,
    isOpen,
    setIsOpen
}) => {
    const currentLevel = getSirenLevel(overdueCount, todayCount);

    return (
        <div className="relative z-45">
            <motion.button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                animate={currentLevel.level >= 4 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`p-3.5 rounded-2xl shadow-sm border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-center ${currentLevel.colorClass}`}
                id="siren-indicator-button"
            >
                <Siren className={`w-7 h-7 ${currentLevel.animateClass}`} />
            </motion.button>
        </div>
    );
};

interface SirenInsetOverlayProps {
    overdueCount: number;
    todayCount: number;
    isOpen: boolean;
    onClose: () => void;
}

export const SirenInsetOverlay: React.FC<SirenInsetOverlayProps> = ({
    overdueCount,
    todayCount,
    isOpen,
    onClose
}) => {
    const currentLevel = getSirenLevel(overdueCount, todayCount);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 180 }}
                    className="absolute top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-2xl p-6 rounded-t-[2.5rem] select-none text-slate-800 max-h-[85%] overflow-y-auto scrollbar-thin"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className={`p-2 bg-indigo-50 text-indigo-600 rounded-2xl`}>
                                <Siren className="w-5 h-5 animate-pulse" />
                            </span>
                            <div>
                                <h4 id="siren-panel-title" className="font-extrabold text-base text-slate-800">
                                    ระบบไซเรนแจ้งเตือน 6 ระดับ (Siren Level Calibration)
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                    ตรวจจับความพร้อมและตารางงานเรียลไทม์
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Active State Banner */}
                    <div className={`mb-5 p-4 rounded-3xl border ${currentLevel.bgPanelClass} shadow-sm transition-all`}>
                        <div className="flex items-start gap-3">
                            <span className="relative flex h-3 w-3 mt-1.5 shrink-0">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentLevel.dotColorClass} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${currentLevel.dotColorClass}`}></span>
                            </span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-sm text-slate-800 uppercase tracking-tight">
                                        สถานะปัจจุบันของคุณ:
                                    </span>
                                    <span className={`px-2.5 py-0.5 text-[11px] font-black rounded-lg ${currentLevel.badgeColorClass}`}>
                                        {currentLevel.title}
                                    </span>
                                </div>
                                <p className="text-[12px] font-black text-slate-600 mt-1.5 leading-relaxed">
                                    {currentLevel.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Levels Explanation List */}
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3 pl-1">
                        คู่มือวิเคราะห์สถานการณ์ และเฉดไฟไซเรน
                    </span>
                    <div className="space-y-2">
                        {ALL_LEVELS_DEFINITION.map((def) => {
                            const isActive = currentLevel.level === def.level;
                            return (
                                <div 
                                    key={def.level}
                                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                                        isActive 
                                            ? `${def.color} ring-2 ring-indigo-500/20 scale-[1.01] font-bold shadow-sm` 
                                            : 'bg-slate-50/50 border-slate-100/80 opacity-60 hover:opacity-85'
                                    }`}
                                >
                                    <span className="text-xs font-black w-5 h-5 flex items-center justify-center shrink-0 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-500">
                                        {def.level}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-xs font-extrabold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                                                {def.title}
                                            </p>
                                            {isActive && (
                                                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-90">
                                                    Active Current
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                                            {def.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                        <span className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-indigo-400" />
                            ความถี่: ตรวจสอบเรียลไทม์
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            สถานะสีไฟสัญญาณตรงเงื่อนไข SLA
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

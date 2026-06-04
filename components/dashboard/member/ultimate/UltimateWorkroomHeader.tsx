import React from 'react';
import { Sparkles, Sliders, Layout, DoorOpen } from 'lucide-react';
import { User } from '../../../../types';

interface UltimateWorkroomHeaderProps {
    currentUser: User;
    isDefaultFirstUrl: boolean;
    activeDrawer: 'DESK' | 'SOFA' | 'BOOKSHELF' | null;
    onToggleDefaultLanding: () => void;
    onCloseAllDrawers: () => void;
    onNavigateBack: () => void;
}

export const UltimateWorkroomHeader: React.FC<UltimateWorkroomHeaderProps> = ({
    currentUser,
    isDefaultFirstUrl,
    activeDrawer,
    onToggleDefaultLanding,
    onCloseAllDrawers,
    onNavigateBack
}) => {
    return (
        <header id="ultimate-workroom-header" className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-white/5 pb-4 mb-4 w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 rounded-2xl shadow-lg border border-white/10 flex items-center justify-center animate-shine">
                    <Sparkles className="w-6.5 h-6.5 text-white animate-pulse" />
                </div>
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-black tracking-widest uppercase text-pink-400 bg-pink-950/60 border border-pink-700/40 px-2.5 py-0.5 rounded-full">
                            🌌 JUIJUI COCKPIT V2
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                            🧑‍💻 {currentUser.position}
                        </span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
                        Cozy Interactive Workroom
                    </h1>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        ห้องจำลองดวงดาวเงียบสงบ 📡 คลิกโต๊ะทำงาน 💻, โซฟา 🛋️, หรือชั้นหนังสือ 📚 เพื่อปลุกพลังเวทมนตร์สะกดสมาธิ
                    </p>
                </div>
            </div>

            {/* CONTROL BUTTONS BAR */}
            <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto relative z-20">
                {/* AUTO LAND SWITCH */}
                <button
                    type="button"
                    onClick={onToggleDefaultLanding}
                    className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-full transition-all duration-300 pointer-events-auto text-[11px] font-bold leading-none cursor-pointer ${
                        isDefaultFirstUrl
                            ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/60'
                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900/60'
                    }`}
                    title="หากเปิดไว้ หลังจากล็อกอินระบบจะส่งคุณมาที่หน้านี้เป็นที่แรกแทนระบบเดิมโดยอัตโนมัติ"
                >
                    <Sliders className="w-3 h-3" />
                    <span>เปิดเป็นหน้าแรก:</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isDefaultFirstUrl ? 'bg-indigo-500/30 text-white font-extrabold' : 'bg-slate-800 text-slate-500'}`}>
                        {isDefaultFirstUrl ? 'เปิดใช้งาน ✅' : 'ปิดการใช้งาน'}
                    </span>
                </button>

                {/* MINIMIZE DASHBOARD TOGGLE */}
                {activeDrawer && (
                    <button
                        type="button"
                        onClick={onCloseAllDrawers}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-white/10 rounded-2xl shadow-md text-[11px] font-extrabold text-[#fda4af] transition-all cursor-pointer"
                    >
                        <Layout className="w-3.5 h-3.5" />
                        <span>ปิดทุกหน้าต่าง 🛖</span>
                    </button>
                )}

                {/* GLASS EXIT DOOR */}
                <button
                    type="button"
                    onClick={onNavigateBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 backdrop-blur-md rounded-2xl shadow-md text-[11px] font-extrabold text-white transition-all cursor-pointer"
                >
                    <DoorOpen className="w-3.5 h-3.5 text-rose-400" />
                    <span>กลับบอร์ดสถิติ</span>
                </button>
            </div>
        </header>
    );
};

export default UltimateWorkroomHeader;

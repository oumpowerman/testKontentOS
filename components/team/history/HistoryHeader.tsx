import React from 'react';
import { History as HistoryIcon, X, Share2, FileDown, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { User } from '../../../types';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface HistoryHeaderProps {
    user: User;
    totalCount: number;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const HistoryHeader: React.FC<HistoryHeaderProps> = ({ 
    user, 
    totalCount, 
    onClose, 
    isCollapsed, 
    onToggleCollapse 
}) => {
    return (
        <div className={cn(
            "bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 relative overflow-hidden border-b border-white rounded-none sm:rounded-t-[3rem] shrink-0 transition-all duration-500",
            isCollapsed ? "p-3 sm:p-4 px-4 sm:px-8" : "p-4 sm:p-10"
        )}>
            {/* Playful background element */}
            <div className={cn(
                "absolute top-0 right-0 p-10 opacity-10 transform transition-all duration-700",
                isCollapsed ? "translate-x-1/2 -translate-y-1/2 scale-50" : "translate-x-1/4 -translate-y-1/4"
            )}>
                <HistoryIcon className="w-80 h-80 text-indigo-400" />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 font-bold">
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-indigo-400 uppercase tracking-[0.2em] text-[8px] sm:text-[10px] font-bold mb-2 sm:mb-4 bg-white/50 w-fit px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-indigo-100/50 backdrop-blur-sm">
                                <HistoryIcon className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
                                ประวัติการทำงานและไทม์ไลน์
                            </div>
                            <h2 className="text-xl sm:text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-2 sm:gap-4 flex-wrap">
                                {user.name}
                                <span className="text-xs sm:text-xl font-bold text-slate-400 bg-white/40 px-2 sm:px-4 py-0.5 sm:py-1 rounded-lg sm:rounded-2xl border border-white/50 shadow-sm">ประวัติงาน</span>
                            </h2>
                            <p className="text-slate-500 mt-2 sm:mt-4 text-xs sm:text-sm max-w-lg leading-relaxed font-semibold">
                                บันทึกทุกผลงานและความมุ่งมั่นของคุณไว้ที่นี่... สู้ต่อไปนะ! ✨
                            </p>
                        </div>
                    )}
                    
                    {isCollapsed && (
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2.5 sm:p-3 bg-indigo-600 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <HistoryIcon className="w-5 h-5 sm:w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">
                                    ประวัติของ {user.name}
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 ml-2 sm:ml-3 bg-white/40 px-2 sm:px-3 py-0.5 rounded-lg border border-white/50">ประวัติงาน</span>
                                </h2>
                                <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">สรุปผลงานและไทม์ไลน์</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 w-full sm:w-auto">
                    {/* Feature Placeholders */}
                    {!isCollapsed && (
                        <div className="hidden md:flex items-center gap-1.5 p-1.5 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 mr-2 sm:mr-4">
                            {[
                                { id: 'share', icon: <Share2 className="w-4 h-4" />, label: 'Share', tooltip: 'Coming Soon' },
                                { id: 'export', icon: <FileDown className="w-4 h-4" />, label: 'Export PDF', tooltip: 'Coming Soon' },
                                { id: 'achievements', icon: <Trophy className="w-4 h-4" />, label: 'Portfolio', tooltip: 'Coming Soon' },
                            ].map((btn) => (
                                <div key={btn.id} className="relative group">
                                    <button className="p-3 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-[1.25rem] transition-all border border-slate-100 shadow-sm opacity-50 cursor-not-allowed">
                                        {btn.icon}
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                                        {btn.tooltip}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={cn(
                        "flex flex-col bg-white/60 backdrop-blur-md rounded-xl sm:rounded-[2rem] border border-white shadow-sm transition-all",
                        isCollapsed ? "px-2.5 sm:px-4 py-1 sm:py-2 items-center" : "px-3 sm:px-5 py-1.5 sm:py-3 items-end"
                    )}>
                        <span className="text-[7px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                            จำนวนงานทั้งหมด
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className={cn(
                                "font-bold text-indigo-600 leading-none",
                                isCollapsed ? "text-sm sm:text-xl" : "text-base sm:text-3xl"
                            )}>
                                {totalCount.toLocaleString()}
                            </span>
                            <span className="text-[8px] sm:text-xs font-semibold text-slate-400">งาน</span>
                        </div>
                    </div>

                    <div className="hidden sm:block h-10 w-px bg-indigo-200/30 mx-1 sm:mx-2" />
                    
                    <button 
                        onClick={onToggleCollapse}
                        className="p-1.5 sm:p-3 bg-white/80 hover:bg-white text-indigo-400 hover:text-indigo-600 rounded-lg sm:rounded-2xl transition-all border border-slate-100 shadow-sm active:scale-95 group"
                        title={isCollapsed ? "ขยายส่วนหัว" : "ย่อส่วนหัว"}
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4 sm:w-5 h-5" /> : <ChevronUp className="w-4 h-4 sm:w-5 h-5" />}
                    </button>

                    <button 
                        onClick={onClose}
                        className={cn(
                            "bg-white/80 hover:bg-rose-500 hover:text-white rounded-full transition-all border border-slate-100 shadow-sm active:scale-95",
                            isCollapsed ? "p-1.5 sm:p-2.5" : "p-2 sm:p-4"
                        )}
                    >
                        <X className={isCollapsed ? "w-3.5 h-3.5 sm:w-5 h-5" : "w-4 h-4 sm:w-6 h-6"} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryHeader;

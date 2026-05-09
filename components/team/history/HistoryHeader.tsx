import React from 'react';
import { History as HistoryIcon, X, Share2, FileDown, Trophy } from 'lucide-react';
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
            "bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 relative overflow-hidden border-b border-white rounded-t-[3rem] shrink-0 transition-all duration-500",
            isCollapsed ? "p-4 px-8" : "p-10"
        )}>
            {/* Playful background element */}
            <div className={cn(
                "absolute top-0 right-0 p-10 opacity-10 transform transition-all duration-700",
                isCollapsed ? "translate-x-1/2 -translate-y-1/2 scale-50" : "translate-x-1/4 -translate-y-1/4"
            )}>
                <HistoryIcon className="w-80 h-80 text-indigo-400" />
            </div>

            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-6">
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-indigo-400 uppercase tracking-[0.2em] text-[10px] font-bold mb-4 bg-white/50 w-fit px-4 py-1.5 rounded-full border border-indigo-100/50 backdrop-blur-sm">
                                <HistoryIcon className="w-3 h-3" />
                                Work History & Timeline
                            </div>
                            <h2 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-4 flex-wrap">
                                {user.name}
                                <span className="text-xl font-bold text-slate-400 bg-white/40 px-4 py-1 rounded-2xl border border-white/50 shadow-sm">ประวัติงาน</span>
                            </h2>
                            <p className="text-slate-500 mt-4 text-sm max-w-lg leading-relaxed font-semibold">
                                รวบรวมทุกผลงานและความตั้งใจของคุณไว้ที่นี่... พัฒนาต่อไปนะ! ✨
                            </p>
                        </div>
                    )}
                    
                    {isCollapsed && (
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <HistoryIcon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                    {user.name}'s History
                                    <span className="text-xs font-bold text-slate-400 ml-3 bg-white/40 px-3 py-0.5 rounded-lg border border-white/50">ประวัติงาน</span>
                                </h2>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">Timeline & Performance Insights</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Feature Placeholders */}
                    {!isCollapsed && (
                        <div className="flex items-center gap-1.5 p-1.5 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 mr-4">
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
                        "flex flex-col bg-white/60 backdrop-blur-md rounded-[2rem] border border-white shadow-sm transition-all",
                        isCollapsed ? "px-4 py-2 items-center" : "px-5 py-3 items-end"
                    )}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                            {isCollapsed ? 'Total' : 'Lifetime Productivity'}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className={cn(
                                "font-bold text-indigo-600 leading-none",
                                isCollapsed ? "text-xl" : "text-3xl"
                            )}>
                                {totalCount.toLocaleString()}
                            </span>
                            {!isCollapsed && <span className="text-xs font-semibold text-slate-400 uppercase">Tasks</span>}
                        </div>
                    </div>

                    <div className="h-10 w-px bg-indigo-200/30 mx-2" />
                    
                    <button 
                        onClick={onToggleCollapse}
                        className="p-3 bg-white/80 hover:bg-white text-indigo-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100 shadow-sm active:scale-95 group"
                        title={isCollapsed ? "Expand Header" : "Collapse Header"}
                    >
                        {isCollapsed ? <Trophy className="w-5 h-5" /> : <Share2 className="w-5 h-5 rotate-90" />}
                    </button>

                    <button 
                        onClick={onClose}
                        className={cn(
                            "bg-white/80 hover:bg-rose-500 hover:text-white rounded-full transition-all border border-slate-100 shadow-sm active:scale-95",
                            isCollapsed ? "p-2.5" : "p-4"
                        )}
                    >
                        <X className={isCollapsed ? "w-5 h-5" : "w-6 h-6"} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryHeader;

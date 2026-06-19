import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RacetrackActiveUser } from './types';
import { Trophy, Clock, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

interface RaceTrackPodiumProps {
    checkedInRacers: RacetrackActiveUser[];
    allRacersCount?: number;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const RaceTrackPodium: React.FC<RaceTrackPodiumProps> = ({ 
    checkedInRacers, 
    allRacersCount,
    isCollapsed = false,
    onToggleCollapse
}) => {
    // Translate status nicely to Thai
    const getStatusLabel = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ontime':
                return { text: 'ตรงเวลา', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
            case 'late':
                return { text: 'สาย', color: 'text-orange-600 bg-orange-50 border-orange-200' };
            case 'halfday':
                return { text: 'ครึ่งวัน', color: 'text-blue-600 bg-blue-50 border-blue-200' };
            case 'leave':
                return { text: 'ลา', color: 'text-slate-500 bg-slate-100 border-slate-200' };
            default:
                return { text: status, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
        }
    };

    if (isCollapsed) {
        return (
            <div className="w-full flex items-center justify-between border-2 border-slate-900 bg-slate-100/95 px-3 py-1.5 rounded-2xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] font-sans transition-all duration-300">
                <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-300 shrink-0" />
                    <span className="text-[10px] font-black font-sans tracking-wide text-slate-800">
                        🏁 บอร์ด Finish ย่ออยู่
                    </span>
                    {allRacersCount !== undefined && (
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-extrabold border border-slate-300/60">
                            {checkedInRacers.length}/{allRacersCount}
                        </span>
                    )}
                </div>
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="px-2.5 py-0.5 bg-white text-slate-900 text-[9px] font-black rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer hover:bg-slate-50 font-sans"
                    >
                        แสดงบอร์ด 🏆
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col border-2 border-slate-900 bg-white p-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] font-sans transition-all duration-300 h-full min-h-[230px]">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2.5 mb-3">
                <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-300" />
                    <span className="text-xs font-black font-mono tracking-tight text-slate-900 uppercase">
                        🏁 FINISHERS
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {allRacersCount !== undefined && (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            {checkedInRacers.length}/{allRacersCount} สำเร็จ
                        </span>
                    )}
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="ย่อส่วน"
                        >
                            <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto max-h-[175px] pr-1 space-y-1.5 scrollbar-thin">
                    <AnimatePresence initial={false}>
                        {checkedInRacers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-6">
                                <span className="text-2xl mb-1.5 filter drop-shadow-sm leading-none animate-pulse">💤</span>
                                <span className="text-[10px] text-slate-500 font-bold">ยังไม่มีคนเช็คอินเข้าเส้นชัย</span>
                                <span className="text-[8px] text-slate-400 font-medium mt-1">ใครจะเป็นผู้ชนะคนแรกวันนี้? ⚡</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {checkedInRacers.map((racer, index) => {
                                    const isWinner = index === 0;
                                    const isRunnerUp = index === 1;
                                    const isThird = index === 2;

                                    let borderClass = "border-slate-200 bg-slate-50/40";
                                    let bgRank = "bg-slate-200 text-slate-700";
                                    let medalEmoji = "";

                                    if (isWinner) {
                                        borderClass = "border-amber-300 bg-amber-50/50 shadow-[0_1px_2px_rgba(245,158,11,0.1)]";
                                        bgRank = "bg-amber-500 text-white font-black";
                                        medalEmoji = "👑";
                                    } else if (isRunnerUp) {
                                        borderClass = "border-slate-300 bg-slate-100/30";
                                        bgRank = "bg-slate-400 text-white font-black";
                                        medalEmoji = "🥈";
                                    } else if (isThird) {
                                        borderClass = "border-amber-600/10 bg-amber-50/10";
                                        bgRank = "bg-amber-600/70 text-white font-black";
                                        medalEmoji = "🥉";
                                    }

                                    const badge = getStatusLabel(racer.status);

                                    return (
                                        <motion.div
                                            key={racer.user.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className={`flex items-center justify-between border ${borderClass} p-2 rounded-xl transition-all hover:bg-slate-50 duration-200`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {/* Rank Indicator */}
                                                <div className="relative">
                                                    <div className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-mono leading-none ${bgRank}`}>
                                                        {index + 1}
                                                    </div>
                                                    {medalEmoji && !isWinner && (
                                                        <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none select-none">
                                                            {medalEmoji}
                                                        </span>
                                                    )}
                                                    {isWinner && (
                                                        <span className="absolute -top-2 -right-1.5 text-xs animate-bounce select-none">
                                                            👑
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Emoji Avatar */}
                                                <span className="text-xl leading-none filter drop-shadow-sm select-none">
                                                    {racer.user.emoji || '👤'}
                                                </span>

                                                {/* Name and Status */}
                                                <div className="flex flex-col">
                                                    <span className="text-slate-800 font-bold text-[11px] leading-tight truncate max-w-[90px]">
                                                        {racer.user.name}
                                                    </span>
                                                    <span className={`text-[7.5px] px-1 py-0.2 mt-0.5 rounded-sm border inline-block w-fit font-bold ${badge.color}`}>
                                                        {badge.text}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Check-in Time & Finish Marker */}
                                            <div className="flex flex-col items-end shrink-0">
                                                <div className="flex items-center gap-0.5 text-slate-900 font-mono font-black text-[10.5px]">
                                                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                                                    <span>{racer.checkInTime}</span>
                                                </div>
                                                <span className="text-[7.5px] font-extrabold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                                                    <span>FINISH</span>
                                                    <Sparkles className="w-2 h-2 text-amber-400 fill-amber-300" />
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
        </div>
    );
};

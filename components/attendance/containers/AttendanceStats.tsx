
import React, { useState } from 'react';
import { useAttendanceStats } from '../../../hooks/attendance/useAttendanceStats';
import { AttendanceStats as StatsType } from '../../../types/attendance';
import { TrendingUp, Clock, Calendar, AlertCircle, ChevronDown, ChevronUp, Hourglass, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceDetailCards from './AttendanceDetailCards';

interface AttendanceStatsProps {
    userId: string;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ userId }) => {
    const { stats, isStatsLoading } = useAttendanceStats(userId);
    const [activeDetail, setActiveDetail] = useState<'LATE' | 'ON_TIME' | 'STREAK' | 'HOURS' | null>(null);

    if (isStatsLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>)}
    </div>;

    const statItems = [
        { key: 'STREAK', label: 'Streak', value: `${stats.currentStreak} วัน`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
        { key: 'HOURS', label: 'ชั่วโมงงาน', value: `${stats.totalHours} ชม.`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
        { key: 'LATE', label: 'มาสาย', value: `${stats.lateDays} ครั้ง`, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
        { key: 'ON_TIME', label: 'มาตรงเวลา', value: `${stats.onTimeDays} วัน`, icon: Calendar, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    const toggleDetail = (key: string) => {
        if (activeDetail === key) {
            setActiveDetail(null);
        } else {
            setActiveDetail(key as any);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statItems.map((item, idx) => {
                    if (item.key === 'STREAK') {
                        const streak = stats.currentStreak || 0;
                        let streakLevel = 0;
                        if (streak > 0) {
                            if (streak <= 6) streakLevel = 1;
                            else if (streak <= 13) streakLevel = 2;
                            else if (streak <= 20) streakLevel = 3;
                            else streakLevel = 4;
                        }

                        const isMilestone = streak > 0 && (streak === 7 || streak === 14 || streak === 21 || streak >= 28);
                        
                        // Select styling based on level
                        let borderClass = 'border-gray-100';
                        let bgClass = 'bg-white/60';
                        let glowClass = 'shadow-sm';
                        let textColorClass = 'text-slate-800';
                        let iconBgClass = 'bg-orange-50';
                        let iconColorClass = 'text-orange-500';
                        let gradientBorder = false;
                        let gradientBorderClass = '';
                        let innerBgClass = 'bg-white';
                        
                        if (streakLevel === 1) {
                            borderClass = 'border-orange-200/60';
                            bgClass = 'bg-orange-50/20';
                            glowClass = 'animate-glow-pulse-1';
                            textColorClass = 'text-orange-950';
                            iconBgClass = 'bg-orange-100/70';
                            iconColorClass = 'text-orange-500 animate-flame-flicker animate-flame-shake';
                        } else if (streakLevel === 2) {
                            gradientBorder = true;
                            gradientBorderClass = 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 bg-[length:200%_auto] animate-gradient-border';
                            innerBgClass = 'bg-gradient-to-br from-white via-amber-50/10 to-orange-50/20';
                            glowClass = 'shadow-[0_0_22px_rgba(245,158,11,0.22)]';
                            textColorClass = 'text-orange-900 drop-shadow-[0_1.5px_2px_rgba(245,158,11,0.35)]';
                            iconBgClass = 'bg-amber-100/80';
                            iconColorClass = 'text-amber-500 animate-flame-flicker animate-flame-shake';
                        } else if (streakLevel === 3) {
                            gradientBorder = true;
                            gradientBorderClass = 'bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 bg-[length:200%_auto] animate-gradient-border';
                            innerBgClass = 'bg-gradient-to-br from-orange-50/10 via-amber-50/10 to-red-50/10';
                            glowClass = 'shadow-[0_0_30px_rgba(239,68,68,0.35)]';
                            textColorClass = 'text-orange-700 font-extrabold drop-shadow-[0_2px_4px_rgba(239,68,68,0.4)]';
                            iconBgClass = 'bg-orange-500/10';
                            iconColorClass = 'text-orange-600 animate-double-flicker scale-110 animate-flame-shake';
                        } else if (streakLevel === 4) {
                            gradientBorder = true;
                            gradientBorderClass = 'bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 bg-[length:200%_auto] animate-gradient-border';
                            innerBgClass = 'bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-orange-50/40 bg-[length:200%_200%] animate-aurora';
                            glowClass = 'animate-glow-heartbeat';
                            textColorClass = 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-orange-600 font-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]';
                            iconBgClass = 'bg-purple-500/10';
                            iconColorClass = 'text-purple-600 animate-double-flicker scale-120 animate-flame-shake';
                        }

                        const FlameIcon = streakLevel > 0 ? Flame : TrendingUp;

                        return (
                            <div key={idx} className="relative w-full h-full">
                                <style dangerouslySetInnerHTML={{ __html: `
                                    @keyframes float-drift-1 {
                                        0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
                                        30% { opacity: 0.85; transform: translateY(-12px) translateX(5px) scale(0.8); }
                                        65% { transform: translateY(-28px) translateX(-4px) scale(0.6); opacity: 0.6; }
                                        100% { transform: translateY(-45px) translateX(2px) scale(0.3); opacity: 0; }
                                    }
                                    @keyframes float-drift-2 {
                                        0% { transform: translateY(0) translateX(0) scale(0.4); opacity: 0; }
                                        25% { opacity: 0.9; transform: translateY(-15px) translateX(-6px) scale(0.7); }
                                        60% { transform: translateY(-32px) translateX(5px) scale(0.5); opacity: 0.5; }
                                        100% { transform: translateY(-50px) translateX(-3px) scale(0.2); opacity: 0; }
                                    }
                                    @keyframes float-drift-3 {
                                        0% { transform: translateY(0) translateX(0) scale(0.6); opacity: 0; }
                                        35% { opacity: 0.95; transform: translateY(-18px) translateX(7px) scale(0.9); }
                                        70% { transform: translateY(-35px) translateX(-7px) scale(0.7); opacity: 0.7; }
                                        100% { transform: translateY(-55px) translateX(4px) scale(0.4); opacity: 0; }
                                    }
                                    @keyframes float-drift-4 {
                                        0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
                                        30% { opacity: 0.85; transform: translateY(-14px) translateX(-5px) scale(0.8); }
                                        65% { transform: translateY(-30px) translateX(6px) scale(0.6); opacity: 0.6; }
                                        100% { transform: translateY(-48px) translateX(-2px) scale(0.3); opacity: 0; }
                                    }
                                    @keyframes glow-pulse-1 {
                                        0%, 100% { box-shadow: 0 0 12px rgba(249, 115, 22, 0.12); }
                                        50% { box-shadow: 0 0 22px rgba(249, 115, 22, 0.28); }
                                    }
                                    @keyframes glow-heartbeat {
                                        0%, 100% { box-shadow: 0 0 25px rgba(139, 92, 246, 0.35); transform: scale(1); }
                                        14% { transform: scale(1.015); box-shadow: 0 0 35px rgba(139, 92, 246, 0.55), 0 0 10px rgba(249, 115, 22, 0.3); }
                                        28% { transform: scale(1); box-shadow: 0 0 28px rgba(139, 92, 246, 0.4); }
                                        42% { transform: scale(1.01); box-shadow: 0 0 32px rgba(139, 92, 246, 0.5), 0 0 12px rgba(249, 115, 22, 0.25); }
                                        70% { transform: scale(1); box-shadow: 0 0 25px rgba(139, 92, 246, 0.35); }
                                    }
                                    @keyframes gradient-border-flow {
                                        0% { background-position: 0% 50%; }
                                        50% { background-position: 100% 50%; }
                                        100% { background-position: 0% 50%; }
                                    }
                                    @keyframes double-flicker {
                                        0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
                                        20% { transform: scale(1.12) rotate(-5deg); filter: brightness(1.3); }
                                        40% { transform: scale(0.95) rotate(3deg); filter: brightness(0.9); }
                                        60% { transform: scale(1.18) rotate(-3deg); filter: brightness(1.4); }
                                        80% { transform: scale(1.05) rotate(2deg); filter: brightness(1.1); }
                                    }
                                    @keyframes flame-shake {
                                        0%, 100% { transform: rotate(0deg); }
                                        15% { transform: rotate(-12deg) scale(1.15); }
                                        30% { transform: rotate(10deg) scale(1.15); }
                                        45% { transform: rotate(-8deg) scale(1.15); }
                                        60% { transform: rotate(6deg) scale(1.15); }
                                        75% { transform: rotate(-4deg) scale(1.15); }
                                        90% { transform: rotate(2deg) scale(1.15); }
                                    }
                                    @keyframes aurora-wave {
                                        0% { background-position: 0% 50%; }
                                        50% { background-position: 100% 50%; }
                                        100% { background-position: 0% 50%; }
                                    }
                                    @keyframes twinkle {
                                        0%, 100% { opacity: 0.2; transform: scale(0.7); }
                                        50% { opacity: 1; transform: scale(1.2); }
                                    }
                                    @keyframes shockwave-ring {
                                        0% { transform: scale(0.98); opacity: 0.55; box-shadow: 0 0 0 0px rgba(249, 115, 22, 0.45); }
                                        100% { transform: scale(1.08); opacity: 0; box-shadow: 0 0 0 16px rgba(249, 115, 22, 0); }
                                    }
                                    @keyframes shockwave-ring-purple {
                                        0% { transform: scale(0.98); opacity: 0.6; box-shadow: 0 0 0 0px rgba(139, 92, 246, 0.5); }
                                        100% { transform: scale(1.1); opacity: 0; box-shadow: 0 0 0 18px rgba(139, 92, 246, 0); }
                                    }
                                    @keyframes flame-flicker {
                                        0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
                                        50% { transform: scale(1.08) rotate(-3deg); filter: brightness(1.2); }
                                    }
                                    @keyframes pulse-wave {
                                        0% { transform: scale(0.96); opacity: 0.8; }
                                        100% { transform: scale(1.12); opacity: 0; }
                                    }

                                    .animate-float-drift-1 {
                                        animation: float-drift-1 2.8s infinite ease-out;
                                    }
                                    .animate-float-drift-2 {
                                        animation: float-drift-2 3.2s infinite ease-out 0.6s;
                                    }
                                    .animate-float-drift-3 {
                                        animation: float-drift-3 2.5s infinite ease-out 1.2s;
                                    }
                                    .animate-float-drift-4 {
                                        animation: float-drift-4 3s infinite ease-out 1.8s;
                                    }
                                    .animate-glow-pulse-1 {
                                        animation: glow-pulse-1 3s infinite ease-in-out;
                                    }
                                    .animate-glow-heartbeat {
                                        animation: glow-heartbeat 2s infinite ease-in-out;
                                    }
                                    .animate-gradient-border {
                                        background-size: 200% 200%;
                                        animation: gradient-border-flow 4s linear infinite;
                                    }
                                    .animate-double-flicker {
                                        animation: double-flicker 1.5s infinite ease-in-out;
                                    }
                                    .group:hover .animate-flame-shake {
                                        animation: flame-shake 0.8s ease-in-out infinite;
                                    }
                                    .animate-aurora {
                                        background-size: 200% 200%;
                                        animation: aurora-wave 6s ease infinite;
                                    }
                                    .animate-twinkle {
                                        animation: twinkle 1.8s infinite ease-in-out;
                                    }
                                    .animate-shockwave-orange {
                                        animation: shockwave-ring 4s infinite cubic-bezier(0.16, 1, 0.3, 1);
                                    }
                                    .animate-shockwave-purple {
                                        animation: shockwave-ring-purple 3.5s infinite cubic-bezier(0.16, 1, 0.3, 1);
                                    }
                                    .animate-flame-flicker {
                                        animation: flame-flicker 1.4s infinite ease-in-out;
                                    }
                                    .animate-pulse-wave {
                                        animation: pulse-wave 2.2s infinite cubic-bezier(0.4, 0, 0.6, 1);
                                    }
                                `}} />

                                {isMilestone && (
                                    <>
                                        <div className="absolute inset-0 rounded-[2rem] bg-orange-500/25 blur-lg animate-pulse-wave" />
                                        <div className="absolute inset-0 rounded-[2rem] bg-amber-500/15 blur-xl animate-pulse-wave" style={{ animationDelay: '1s' }} />
                                    </>
                                )}
                                {streakLevel === 3 && (
                                    <div className="absolute inset-0 rounded-[2rem] animate-shockwave-orange pointer-events-none" />
                                )}
                                {streakLevel === 4 && (
                                    <div className="absolute inset-0 rounded-[2rem] animate-shockwave-purple pointer-events-none" />
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleDetail(item.key)}
                                    className={`
                                        w-full h-full rounded-[2rem] transition-all flex relative text-left overflow-hidden group
                                        ${gradientBorder ? gradientBorderClass + ' p-[2px]' : 'border ' + borderClass + ' p-0'}
                                        ${activeDetail === item.key ? 'ring-4 ring-orange-50/80 shadow-lg' : ''}
                                        ${glowClass}
                                    `}
                                >
                                    <div className={`
                                        w-full h-full rounded-[1.9rem] p-4 flex items-center gap-4 relative overflow-hidden
                                        ${gradientBorder ? innerBgClass : bgClass + ' backdrop-blur-md'}
                                        hover:bg-white/95 transition-colors
                                    `}>
                                        {/* Particle Spark System based on Level */}
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                            {streakLevel === 1 && (
                                                <>
                                                    <span className="absolute bottom-2 left-1/3 w-1 h-1 rounded-full bg-orange-400/80 opacity-0 animate-float-drift-1" />
                                                    <span className="absolute bottom-3 left-2/3 w-1.2 h-1.2 rounded-full bg-amber-500/80 opacity-0 animate-float-drift-2" />
                                                </>
                                            )}
                                            {streakLevel === 2 && (
                                                <>
                                                    <span className="absolute bottom-1 left-[20%] w-1.5 h-1.5 rounded-full bg-orange-400/90 opacity-0 animate-float-drift-1" />
                                                    <span className="absolute bottom-3 left-[45%] w-1 h-1 rounded-full bg-amber-400 opacity-0 animate-float-drift-2" />
                                                    <span className="absolute bottom-1.5 left-[70%] w-1.5 h-1.5 rounded-full bg-orange-500/90 opacity-0 animate-float-drift-3" />
                                                </>
                                            )}
                                            {streakLevel === 3 && (
                                                <>
                                                    <span className="absolute bottom-1 left-[15%] w-2.5 h-2.5 rounded-full bg-red-500/70 blur-[1px] opacity-0 animate-float-drift-1" />
                                                    <span className="absolute bottom-3 left-[50%] w-2 h-2 rounded-full bg-orange-400/80 blur-[0.5px] opacity-0 animate-float-drift-2" />
                                                    <span className="absolute bottom-2 left-[35%] w-1.2 h-1.2 rounded-full bg-amber-400 opacity-0 animate-float-drift-3" />
                                                    <span className="absolute bottom-0.5 left-[75%] w-1.5 h-1.5 rounded-full bg-red-400 opacity-0 animate-float-drift-4" />
                                                </>
                                            )}
                                            {streakLevel === 4 && (
                                                <>
                                                    <span className="absolute top-[25%] left-[25%] w-1 h-1 rounded-full bg-amber-400 animate-twinkle opacity-80" style={{ animationDelay: '0.2s' }} />
                                                    <span className="absolute top-[65%] left-[75%] w-1.2 h-1.2 rounded-full bg-indigo-400 animate-twinkle opacity-90" style={{ animationDelay: '1.1s' }} />
                                                    <span className="absolute top-[40%] left-[80%] w-0.8 h-0.8 rounded-full bg-white animate-twinkle opacity-75" style={{ animationDelay: '0.6s' }} />
                                                    
                                                    <span className="absolute bottom-1 left-[20%] w-1.5 h-1.5 rounded-full bg-indigo-400 blur-[0.5px] opacity-0 animate-float-drift-1" />
                                                    <span className="absolute bottom-3 left-[40%] w-2 h-2 rounded-full bg-purple-400 blur-[1px] opacity-0 animate-float-drift-2" />
                                                    <span className="absolute bottom-2 left-[60%] w-1.2 h-1.2 rounded-full bg-orange-400 opacity-0 animate-float-drift-3" />
                                                    <span className="absolute bottom-0.5 left-[80%] w-1.5 h-1.5 rounded-full bg-white opacity-0 animate-float-drift-4" />
                                                </>
                                            )}
                                        </div>

                                        <div className={`p-3 rounded-2xl ${iconBgClass} shadow-sm group-hover:scale-110 transition-transform z-10 shrink-0`}>
                                            <FlameIcon className={`w-5 h-5 ${iconColorClass}`} />
                                        </div>

                                        <div className="flex-1 min-w-0 z-10">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{item.label}</p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className={`text-xl font-black tracking-tight ${textColorClass}`}>{item.value}</p>
                                                {stats.hasPendingStreakRequest && (
                                                    <div 
                                                        className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200/60 px-1.5 py-0.5 rounded-full text-[9px] font-bold animate-pulse"
                                                        title="อยู่ระหว่างรอพิจารณาคำร้องเพื่อรักษา Streak"
                                                    >
                                                        <Hourglass className="w-2.5 h-2.5 shrink-0" />
                                                        <span>Pending</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`absolute top-4 right-4 transition-transform duration-300 ${activeDetail === item.key ? 'rotate-180' : ''} z-10`}>
                                            <ChevronDown className={`w-4 h-4 ${activeDetail === item.key ? 'text-orange-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
                                        </div>
                                    </div>
                                </motion.button>
                            </div>
                        );
                    }

                    return (
                        <motion.button 
                            key={idx} 
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleDetail(item.key)}
                            className={`
                                p-4 rounded-[2rem] border transition-all flex items-center gap-4 relative group text-left
                                ${activeDetail === item.key 
                                    ? `bg-white ${item.border} shadow-xl ring-4 ring-indigo-50/50` 
                                    : 'bg-white/60 backdrop-blur-md border-gray-100 shadow-sm hover:bg-white hover:shadow-md'
                                }
                            `}
                        >
                            <div className={`p-3 rounded-2xl ${item.bg} shadow-sm group-hover:scale-110 transition-transform`}>
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{item.label}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xl font-black text-slate-800 tracking-tight">{item.value}</p>
                                    {item.key === 'STREAK' && stats.hasPendingStreakRequest && (
                                        <div 
                                            className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200/60 px-1.5 py-0.5 rounded-full text-[9px] font-bold animate-pulse"
                                            title="อยู่ระหว่างรอพิจารณาคำร้องเพื่อรักษา Streak"
                                        >
                                            <Hourglass className="w-2.5 h-2.5 shrink-0" />
                                            <span>Pending</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`absolute top-4 right-4 transition-transform duration-300 ${activeDetail === item.key ? 'rotate-180' : ''}`}>
                                <ChevronDown className={`w-4 h-4 ${activeDetail === item.key ? 'text-indigo-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence>
                {activeDetail && (
                    <AttendanceDetailCards 
                        logs={stats.monthlyLogs || []} 
                        type={activeDetail} 
                        onClose={() => setActiveDetail(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttendanceStats;

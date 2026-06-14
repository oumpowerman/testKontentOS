import React, { useMemo } from 'react';
import { User, Task } from '../../types';
import { Crown, Heart, Skull, CheckSquare, AlertTriangle, Calendar, Clock8 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isStockTerminalStatus } from '../../config/status';

interface MemberProfileTooltipProps {
    user: User;
    tasks: Task[];
    isHovered: boolean;
    weeklyHours: number;
    statusInfo: {
        text: string;
        color: string;
        icon: React.ReactNode;
    };
    statusColorClass: string;
}

const MemberProfileTooltip: React.FC<MemberProfileTooltipProps> = ({
    user,
    tasks,
    isHovered,
    weeklyHours,
    statusInfo,
    statusColorClass,
}) => {
    const taskMetrics = useMemo(() => {
        const total = tasks.length;
        const unscheduled = tasks.filter(t => t.isUnscheduled).length;
        const active = tasks.filter(t => !t.isUnscheduled && !isStockTerminalStatus(t.status)).length;
        const done = tasks.filter(t => isStockTerminalStatus(t.status)).length;
        const urgentOrHigh = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
        
        return { total, unscheduled, active, done, urgentOrHigh };
    }, [tasks]);

    const levelProgress = ((user.xp % 1000) / 1000) * 100;

    // Formatter for Hours -> HH hr MM min
    const formatWorkload = (hours: number) => {
        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        
        if (h === 0 && m === 0) return '0 hr';
        const parts = [];
        if (h > 0) parts.push(`${h} hr`);
        if (m > 0) parts.push(`${m} min`);
        return parts.join(' ');
    };

    return (
        <AnimatePresence>
            {isHovered && (
                <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-[102%] top-2 w-72 bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-4 text-left pointer-events-none z-[9999] space-y-4"
                >
                    {/* Header / Identity */}
                    <div className="flex items-start gap-2.5">
                        <div className="relative shrink-0">
                            <img 
                                src={user.avatarUrl} 
                                className="w-11 h-11 rounded-full object-cover border-2 border-slate-700 shadow-lg"
                                alt={user.name} 
                            />
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${statusColorClass}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-white text-sm truncate">{user.name}</span>
                                {user.role === 'ADMIN' && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold">{user.position || 'Member'}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="bg-slate-800 border border-slate-700/55 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider shrink-0">
                                    LV.{user.level}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium truncate">
                                    XP: {user.xp % 1000} / 1000
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-800/60" />

                    {/* HP Bar Section */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                            <span className="flex items-center gap-1">
                                {user.hp <= 0 ? (
                                    <Skull className="w-3.5 h-3.5 text-red-500" />
                                ) : (
                                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                                )}
                                <span>พลังชีวิต (Health)</span>
                            </span>
                            <span className={`font-mono ${user.hp <= 0 ? 'text-red-500' : 'text-slate-200'}`}>
                                {user.hp <= 0 ? 'DEATH' : `${user.hp}/${user.maxHp || 100}`}
                            </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, Math.min(100, (user.hp / (user.maxHp || 100)) * 100))}%` }}
                                transition={{ duration: 0.3 }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                    user.hp <= 0 
                                        ? 'from-slate-700 to-slate-600' 
                                        : (user.hp / (user.maxHp || 100)) < 0.25 
                                            ? 'from-red-600 to-rose-500 animate-pulse' 
                                            : (user.hp / (user.maxHp || 100)) < 0.5 
                                                ? 'from-amber-500 to-orange-400' 
                                                : 'from-emerald-500 to-green-400'
                                }`}
                            />
                        </div>
                        {user.hp <= 0 && (
                            <p className="text-[9px] font-bold text-red-400 text-center animate-pulse">
                                ⚠️ ตัวละครเสียชีวิตแล้ว รอรับฟื้นคืนชีพ ☠️
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-800/60" />

                    {/* Tasks Section */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800/40 flex flex-col justify-between">
                            <span className="text-slate-400 font-semibold mb-1 flex items-center gap-1 leading-none">
                                <Calendar className="w-3 h-3 text-indigo-400 shrink-0" /> งานสัปดาห์นี้
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-base font-black text-slate-100">{taskMetrics.active}</span>
                                <span className="text-[9px] text-slate-400">งาน</span>
                            </div>
                        </div>

                        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800/40 flex flex-col justify-between">
                            <span className="text-slate-400 font-semibold mb-1 flex items-center gap-1 leading-none">
                                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 animate-[bounce_1.5s_infinite]" /> งานด่วน/สำคัญ
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className={`text-base font-black ${taskMetrics.urgentOrHigh > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-100'}`}>
                                    {taskMetrics.urgentOrHigh}
                                </span>
                                <span className="text-[9px] text-slate-400">งาน</span>
                            </div>
                        </div>

                        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800/40 flex flex-col justify-between">
                            <span className="text-slate-400 font-semibold mb-1 flex items-center gap-1 leading-none">
                                <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0" /> สำเร็จแล้ว
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-base font-black text-emerald-400">{taskMetrics.done}</span>
                                <span className="text-[9px] text-slate-400">/ {taskMetrics.total}</span>
                            </div>
                        </div>

                        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800/40 flex flex-col justify-between">
                            <span className="text-slate-400 font-semibold mb-1 flex items-center gap-1 leading-none text-slate-400/90 text-[10px]">
                                📦 งานฝากกองกลาง
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-base font-black text-slate-300">{taskMetrics.unscheduled}</span>
                                <span className="text-[9px] text-slate-400">งาน</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom/Workload Status */}
                    <div className="text-[10px] text-slate-400 bg-slate-950/80 border border-slate-800/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1 font-bold">
                            <Clock8 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>ภาระงานเฉลี่ย:</span>
                        </span>
                        <span className={`font-black ${statusInfo.color.includes('text-red') ? 'text-red-400' : statusInfo.color.includes('text-orange') ? 'text-orange-400' : 'text-indigo-400'}`}>
                            {formatWorkload(weeklyHours)} ({statusInfo.text.split(' ')[0]})
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default React.memo(MemberProfileTooltip);

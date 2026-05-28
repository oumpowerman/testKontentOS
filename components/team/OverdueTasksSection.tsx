import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, User as UserIcon, ArrowUpRight } from 'lucide-react';
import { Task, User, Channel } from '../../types';
import { differenceInCalendarDays, format } from 'date-fns';
import { th } from 'date-fns/locale';

interface OverdueTasksSectionProps {
    overdueTasks: Task[];
    users: User[];
    channels: Channel[];
    onEditTask: (task: Task) => void;
}

export const OverdueTasksSection: React.FC<OverdueTasksSectionProps> = ({
    overdueTasks,
    users,
    channels,
    onEditTask
}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    if (overdueTasks.length === 0) return null;

    // Helper to get assignee users
    const getAssignees = (assigneeIds: string[] = []) => {
        return assigneeIds
            .map(id => users.find(u => u.id === id))
            .filter((u): u is User => !!u);
    };

    // Helper to get channel info
    const getChannel = (channelId?: string) => {
        return channels.find(c => c.id === channelId);
    };

    return (
        <div 
            className="w-full bg-rose-50/70 backdrop-blur-xl border border-rose-100/80 rounded-[2rem] p-6 shadow-xl shadow-rose-950/5 overflow-hidden animate-in fade-in-50 slide-in-from-top-6 duration-500"
            id="overdue-tasks-section"
        >
            {/* Title / Header Area */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="flex items-center justify-center w-12 h-12 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 shrink-0">
                        <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg md:text-xl font-bold text-rose-950 tracking-tight" id="overdue-title">
                                งานค้างส่ง & เกินกำหนดเวลา
                            </h2>
                            <span className="bg-rose-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-full px-3 shadow-sm shadow-rose-500/10 shrink-0 animate-bounce">
                                {overdueTasks.length} งาน
                            </span>
                        </div>
                        <p className="text-xs md:text-sm text-rose-700/80 font-medium mt-0.5">
                            แสดงงานที่ยังไม่สำเร็จเสร็จสิ้นซึ่งกำหนดส่งผ่านมาแล้วก่อนสัปดาห์ปัจจุบัน
                        </p>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-100/50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200/50 transition-colors shrink-0"
                    id="overdue-collapse-btn"
                >
                    {isCollapsed ? (
                        <>
                            แสดงงานค้างส่ง <ChevronDown className="w-4 h-4 ml-0.5" />
                        </>
                    ) : (
                        <>
                            ย่อลง <ChevronUp className="w-4 h-4 ml-0.5" />
                        </>
                    )}
                </motion.button>
            </div>

            {/* List of Overdue Tasks with smooth Collapse/Expand Animation */}
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="overflow-hidden"
                        id="overdue-list-container"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-1 max-h-[80vh] overflow-y-auto no-scrollbar pb-6 pr-1.5 pl-1">
                            {overdueTasks.map((task) => {
                                const assignees = getAssignees(task.assigneeIds);
                                const channel = getChannel(task.channelId);
                                const daysOverdue = differenceInCalendarDays(new Date(), new Date(task.endDate));
                                
                                // Get Severity level styling configuration
                                let severity = 1;
                                if (daysOverdue >= 21) {
                                    severity = 3;
                                } else if (daysOverdue >= 8) {
                                    severity = 2;
                                }

                                const getSeverityConfig = (level: number) => {
                                    switch (level) {
                                        case 3: // Overdue 3+ Weeks (Severe Backlog)
                                            return {
                                                cardClass: "bg-gradient-to-br from-white via-rose-50/50 to-rose-100/30 border-rose-200 shadow-[0_4px_24px_rgba(244,63,94,0.03)] hover:border-rose-350 hover:shadow-[0_12px_32px_rgba(244,63,94,0.12)]",
                                                badgeClass: "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold shadow-[0_2px_8px_rgba(244,63,94,0.3)] animate-pulse",
                                                textAccent: "text-rose-600 bg-rose-50/60 border border-rose-100 px-2 py-0.5 rounded-full select-none",
                                                levelLabel: "🔥 วิกฤต (3+ สัปดาห์)",
                                                dotClass: "bg-rose-500 animate-ping",
                                                glowRing: "ring-1 ring-rose-400/20"
                                            };
                                        case 2: // Overdue 1-3 Weeks (Medium Backlog)
                                            return {
                                                cardClass: "bg-gradient-to-br from-white via-amber-50/40 to-amber-100/20 border-amber-200 shadow-[0_4px_24px_rgba(245,158,11,0.02)] hover:border-amber-300 hover:shadow-[0_12px_32px_rgba(245,158,11,0.08)]",
                                                badgeClass: "bg-gradient-to-r from-orange-450 to-amber-500 text-white font-extrabold shadow-[0_2px_8px_rgba(245,158,11,0.2)]",
                                                textAccent: "text-amber-700 bg-amber-50/60 border border-amber-100 px-2 py-0.5 rounded-full select-none",
                                                levelLabel: "⚡ ล่าช้า (1-3 สัปดาห์)",
                                                dotClass: "bg-amber-500 animate-pulse",
                                                glowRing: "ring-1 ring-amber-400/10"
                                            };
                                        default: // Overdue up to 1 Week (Mild Backlog)
                                            return {
                                                cardClass: "bg-gradient-to-br from-white via-slate-50/50 to-blue-50/10 border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(59,130,246,0.06)]",
                                                badgeClass: "bg-slate-100 text-slate-700 border border-slate-200/60 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.01)]",
                                                textAccent: "text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full select-none",
                                                levelLabel: "⏳ เกินกำหนดส่ง (ไม่เกิน 7 วัน)",
                                                dotClass: "bg-slate-400",
                                                glowRing: ""
                                            };
                                    }
                                };

                                const config = getSeverityConfig(severity);

                                // Beautiful time text helper
                                let overdueLabel = `เกินกำหนด ${daysOverdue} วัน`;
                                if (daysOverdue >= 30) {
                                    const months = Math.floor(daysOverdue / 30);
                                    overdueLabel = `เกินกำหนดเกือบ ${months} เดือน`;
                                } else if (daysOverdue >= 7) {
                                    const weeks = Math.floor(daysOverdue / 7);
                                    overdueLabel = `เกินกำหนด ${weeks} สัปดาห์`;
                                }

                                return (
                                    <motion.div 
                                        key={task.id}
                                        layoutId={`overdue-card-${task.id}`}
                                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ 
                                            y: -6,
                                            scale: 1.018,
                                            borderColor: "rgba(244, 63, 94, 0.3)"
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                                        className={`relative group border backdrop-blur-md rounded-[1.75rem] p-5.5 transition-all duration-300 ease-out flex flex-col justify-between gap-4.5 text-left min-h-[170px] ${config.cardClass} ${config.glowRing}`}
                                        id={`overdue-card-${task.id}`}
                                    >
                                        <div className="flex flex-col gap-3">
                                            {/* Channel Indicator / Overdue badge */}
                                            <div className="flex flex-wrap justify-between items-center gap-1.5">
                                                {channel ? (
                                                    <span 
                                                        className="text-[10px] font-bold px-3 py-0.5 rounded-full uppercase border shadow-[0_1px_2px_rgba(0,0,0,0.01)] tracking-wide shrink-0"
                                                        style={{ 
                                                            backgroundColor: `${channel.color}12`, 
                                                            borderColor: `${channel.color}25`,
                                                            color: channel.color 
                                                        }}
                                                    >
                                                        🎨 {channel.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-3 py-0.5 rounded-full uppercase bg-slate-100 text-slate-600 border border-slate-200/40 tracking-wide shrink-0">
                                                        💼 งานทั่วไป
                                                    </span>
                                                )}

                                                <span className={`inline-flex items-center gap-1.5 text-[10px] px-3 py-0.5 rounded-full border border-white/50 ${config.badgeClass} shrink-0`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                                                    {overdueLabel}
                                                </span>
                                            </div>

                                            {/* Severity Indicators small text */}
                                            <span className={`text-[9.5px] font-bold tracking-wider uppercase mt-1 self-start ${config.textAccent}`}>
                                                {config.levelLabel}
                                            </span>

                                            {/* Task Title */}
                                            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug tracking-tight line-clamp-2 group-hover:text-rose-950 transition-colors pt-0.5">
                                                {task.title}
                                            </h3>

                                            {/* Deadline Date */}
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full self-start shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                                                <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                                <span>📅 กำหนดส่ง: {format(new Date(task.endDate), 'd MMM yyyy', { locale: th })}</span>
                                            </div>
                                        </div>

                                        {/* Row at bottom with assignees & action button */}
                                        <div className="flex items-center justify-between gap-4 pt-3.5 border-t border-slate-100 mt-1">
                                            {/* Assignees list */}
                                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                                                {assignees.length > 0 ? (
                                                    assignees.map((user) => (
                                                        <div 
                                                            key={user.id} 
                                                            className="w-7 h-7 rounded-full border border-white bg-slate-50 flex items-center justify-center shrink-0 ring-1 ring-slate-150 overflow-hidden relative group-hover:scale-105 transition-transform shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                                                            title={user.name}
                                                        >
                                                            {user.avatarUrl ? (
                                                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-550">{user.name.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full border border-white bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 ring-1 ring-slate-100">
                                                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                                    </div>
                                                )}
                                                {assignees.length > 3 && (
                                                    <span className="text-[10px] font-bold text-slate-500 pl-2 shrink-0">
                                                        +{assignees.length - 3}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Edit/Resolve Action Button */}
                                            <motion.button
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => onEditTask(task)}
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-rose-600 hover:text-white text-white text-[10px] font-extrabold rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(244,63,94,0.25)] transition-all cursor-pointer border border-zinc-800/20"
                                                id={`overdue-edit-btn-${task.id}`}
                                            >
                                                <span>จัดการงาน</span>
                                                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-white" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
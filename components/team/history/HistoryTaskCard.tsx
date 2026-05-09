import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Inbox, AlertCircle, ArrowUpRight, Zap, Paperclip, ImageIcon, Layout } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Task, Channel } from '../../../types';
import { calculateTaskXP } from '../../../lib/gameLogic';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface HistoryTaskCardProps {
    task: Task;
    channels: Channel[];
    onClick: () => void;
    isLean?: boolean;
}

const HistoryTaskCard: React.FC<HistoryTaskCardProps> = ({ task, channels, onClick, isLean }) => {
    const getChannelInfo = (channelId: string) => {
        return channels.find(c => c.id === channelId);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'DONE': 
                return { 
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, 
                    bg: 'bg-emerald-50/50', 
                    text: 'text-emerald-700',
                    border: 'border-emerald-100',
                    label: 'เสร็จครบถ้วน' 
                };
            case 'DOING': 
            case 'IN_PROGRESS':
                return { 
                    icon: <Clock className="w-4 h-4 text-blue-500" />, 
                    bg: 'bg-blue-50/50', 
                    text: 'text-blue-700',
                    border: 'border-blue-100',
                    label: 'กำลังดำเนินการ' 
                };
            case 'TODO': 
                return { 
                    icon: <Inbox className="w-4 h-4 text-rose-500" />, 
                    bg: 'bg-rose-50/50', 
                    text: 'text-rose-700',
                    border: 'border-rose-100',
                    label: 'รอดำเนินการ' 
                };
            default: 
                return { 
                    icon: <AlertCircle className="w-4 h-4 text-slate-400" />, 
                    bg: 'bg-slate-50/50', 
                    text: 'text-slate-600',
                    border: 'border-slate-200',
                    label: status || 'สถานะอื่นๆ' 
                };
        }
    };

    const channel = getChannelInfo(task.channelId || '');
    const status = getStatusConfig(task.status);
    const xpBreakdown = calculateTaskXP(task);
    const hasAssets = task.assets && task.assets.length > 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={onClick}
            className={cn(
                "group rounded-[2.5rem] border backdrop-blur-sm shadow-sm hover:shadow-xl transition-all cursor-pointer flex items-center justify-between gap-6",
                isLean ? "p-3 px-6 rounded-[1.5rem]" : "p-6",
                status.border,
                status.bg,
                "hover:bg-white"
            )}
        >
            <div className={cn("flex items-center flex-1 min-w-0", isLean ? "gap-4" : "gap-6")}>
                {/* Channel Indicator */}
                <div 
                    className={cn(
                        "rounded-full shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
                        isLean ? "w-1.5 h-10" : "w-2 h-16"
                    )} 
                    style={{ backgroundColor: channel?.color || '#CBD5E1' }}
                />

                <div className="flex-1 min-w-0">
                    <div className={cn("flex flex-wrap items-center gap-3", isLean ? "mb-1" : "mb-2.5")}>
                        <div className={cn(
                            "flex items-center gap-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white shadow-sm border transition-shadow group-hover:shadow-md",
                            isLean ? "px-2.5 py-1" : "px-3.5 py-1.5",
                            status.text,
                            status.border
                        )}>
                            {status.icon}
                            {!isLean && status.label}
                        </div>
                        
                        {task.status === 'DONE' && (
                            <div className={cn(
                                "flex items-center gap-1.5 bg-amber-50 rounded-full border border-amber-100 text-amber-600 shadow-sm transition-transform hover:scale-105",
                                isLean ? "px-2.5 py-1" : "px-3 py-1.5"
                            )}>
                                <Zap className={isLean ? "w-3 h-3" : "w-3.5 h-3.5"} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {isLean ? `+${xpBreakdown.total} XP` : `+${xpBreakdown.total} XP Earned`}
                                </span>
                            </div>
                        )}

                        <span className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest tabular-nums ml-auto">
                            {task.createdAt ? format(new Date(task.createdAt), isLean ? 'd MMM' : 'd MMM yyyy • HH:mm', { locale: th }) : 'No Date'}
                        </span>
                    </div>

                    <h4 className={cn(
                        "font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors tracking-tight",
                        isLean ? "text-base mb-1" : "text-xl mb-2"
                    )}>
                        {task.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3">
                        {channel && (
                            <div className="flex items-center gap-2 bg-white/40 px-2 py-0.5 rounded-xl border border-white shadow-sm">
                                <div className="w-2 h-2 rounded-full ring-2 ring-white" style={{ backgroundColor: channel.color }} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{channel.name}</span>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-white/60 rounded-xl border border-slate-100 shadow-sm">
                            <div className={cn(
                                "w-2 h-2 rounded-full ring-2 ring-white",
                                task.difficulty === 'HARD' ? 'bg-rose-500' : task.difficulty === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                            )} />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">{task.difficulty}</span>
                        </div>

                        {/* Quick View Indicators */}
                        <div className="flex items-center gap-1.5">
                            {hasAssets && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-400 rounded-lg border border-indigo-100" title="Has Assets">
                                    <Paperclip className="w-2.5 h-2.5" />
                                    <span className="text-[8px] font-bold">{task.assets?.length}</span>
                                </div>
                            )}
                        </div>

                        {task.category && !isLean && (
                            <span className="text-[11px] font-bold text-indigo-400/80 bg-indigo-50/50 px-3 py-1 rounded-xl border border-indigo-100/50 ml-auto">
                                # {task.category}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className={cn("flex items-center shrink-0", isLean ? "gap-2" : "gap-4")}>
                {!isLean && (
                    <span className="hidden sm:block text-[10px] font-bold text-indigo-500 bg-indigo-50 px-5 py-2.5 rounded-[1.25rem] border border-indigo-100 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 uppercase tracking-[0.2em] shadow-md shadow-indigo-500/5">
                        Open Insights
                    </span>
                )}
                <div className={cn(
                    "rounded-[1.75rem] bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-400 group-hover:rotate-45 group-hover:scale-110 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]",
                    isLean ? "w-10 h-10 rounded-[1rem]" : "w-14 h-14"
                )}>
                    <ArrowUpRight className={isLean ? "w-5 h-5" : "w-7 h-7"} />
                </div>
            </div>
        </motion.div>
    );
};

export default HistoryTaskCard;

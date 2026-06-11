import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, LayoutTemplate, CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import { format, differenceInCalendarDays, isBefore } from 'date-fns';
import { Task, Channel, User, MasterOption, Status } from '../../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../../constants';

interface UrgentTaskItemProps {
    task: Task;
    idx: number;
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
}

export const UrgentTaskItem: React.FC<UrgentTaskItemProps> = ({
    task,
    idx,
    channels,
    users,
    masterOptions,
    onEditTask,
}) => {
    const isContent = task.type === 'CONTENT';
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const taskEnd = new Date(task.endDate); 
    taskEnd.setHours(0, 0, 0, 0);
    const daysOverdue = differenceInCalendarDays(today, taskEnd);

    const lookupType = task.type === 'CONTENT' ? 'STATUS' : 'TASK_STATUS';
    const statusOption = masterOptions.find(o => o.type === lookupType && o.key === task.status);

    const statusLabel = statusOption ? statusOption.label : (STATUS_LABELS[task.status as Status] || task.status);
    const statusColor = statusOption ? statusOption.color : (STATUS_COLORS[task.status as Status] || 'bg-gray-100 text-gray-600 border-gray-200');

    let containerClass = "bg-white/40 border-white/60 hover:border-indigo-300 hover:bg-white/80";
    let stripClass = "bg-slate-200";

    if (daysOverdue > 0) {
        if (daysOverdue > 7) {
            containerClass = "bg-red-50/60 border-red-200 hover:border-red-400 hover:bg-red-50 shadow-sm shadow-red-100/50";
            stripClass = "bg-red-500 animate-pulse";
        } else if (daysOverdue > 3) {
            containerClass = "bg-red-50/40 border-red-100 hover:border-red-300 hover:bg-red-50/60";
            stripClass = "bg-red-400";
        } else {
            containerClass = "bg-red-50/20 border-red-100/50 hover:border-red-200 hover:bg-red-50/40";
            stripClass = "bg-red-300";
        }
    } else if (daysOverdue === 0) {
        containerClass = "bg-orange-50/30 border-orange-100 hover:border-orange-300 hover:bg-orange-50/50";
        stripClass = "bg-orange-400";
    }

    const getDelayBadge = (date: Date) => {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);

        const diff = differenceInCalendarDays(target, todayDate);

        if (diff < 0) {
            const daysLate = Math.abs(diff);
            let badgeClass = "bg-red-100 text-red-600 border-transparent";
            if (daysLate > 7) badgeClass = "bg-red-200 text-red-800 border-red-300";
            else if (daysLate > 3) badgeClass = "bg-red-100 text-red-700";

            return (
                <div className={`flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border shrink-0 ${badgeClass}`}>
                    <AlertTriangle className="w-3 h-3" />
                    สาย {daysLate} วัน
                </div>
            );
        }
        if (diff === 0) {
            return (
                <div className="flex items-center gap-1 text-[10px] font-black text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200 shrink-0">
                    <Clock className="w-3 h-3" />
                    วันนี้!
                </div>
            );
        }
        if (diff === 1) {
            return <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded select-none shrink-0 border border-indigo-100">พรุ่งนี้</span>;
        }
        return <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded select-none shrink-0 border border-gray-200">{format(date, 'd MMM')}</span>;
    };

    // Calculate involved users for content items (owners, editors, and assignees)
    const involvedUsers = useMemo(() => {
        const ids = new Set<string>();
        task.assigneeIds?.forEach(id => id && ids.add(id));
        task.ideaOwnerIds?.forEach(id => id && ids.add(id));
        task.editorIds?.forEach(id => id && ids.add(id));
        
        return Array.from(ids)
            .map(id => users.find(u => u.id === id))
            .filter(Boolean) as User[];
    }, [task, users]);

    const channel = channels.find(c => c.id === task.channelId);

    return (
        <motion.div 
            id={`urgent-task-item-${task.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            whileHover={{ scale: 1.015, x: 2 }}
            onClick={() => onEditTask(task)}
            className={`
                relative flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border backdrop-blur-sm transition-all cursor-pointer group hover:shadow-xl select-none
                ${containerClass}
            `}
        >
            {/* Left Strip Indicator */}
            <div className={`absolute left-0 top-3 bottom-0 w-1 rounded-r-full sm:w-1.5 sm:top-4 sm:bottom-4 ${stripClass}`}></div>

            {/* Leading Icon Container (Swapped based on type) */}
            <div className="pl-1 sm:pl-2 shrink-0 relative">
                {isContent ? (
                    /* --- CONTENT TYPE Layout: Channel Logo is Main, Stack of Assignees is overlapping --- */
                    <div className="relative">
                        <div className="w-10 h-10 rounded-2xl border border-slate-200/80 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {channel ? (
                                channel.logoUrl ? (
                                    <img 
                                        src={channel.logoUrl} 
                                        alt={channel.name} 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div 
                                        className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                                        style={{ backgroundColor: channel.color || '#a855f7' }}
                                    >
                                        {channel.name.slice(0, 1).toUpperCase()}
                                    </div>
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-600">
                                    <LayoutTemplate className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        {/* Overlapping Assignees Mini-Stack */}
                        <div className="absolute -bottom-1 -right-2 flex -space-x-1.5 bg-white/95 backdrop-blur-sm px-1 py-0.5 rounded-full border border-slate-100 shadow-sm max-w-[64px] overflow-hidden">
                            {involvedUsers.slice(0, 2).map((user) => (
                                <img 
                                    key={user.id}
                                    src={user.avatarUrl} 
                                    className="w-4 h-4 rounded-full border border-white object-cover shrink-0" 
                                    title={user.name} 
                                    alt={user.name}
                                    referrerPolicy="no-referrer"
                                />
                            ))}
                            {involvedUsers.length > 2 && (
                                <div className="w-4 h-4 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[7px] text-slate-700 font-extrabold shrink-0 select-none">
                                    +{involvedUsers.length - 2}
                                </div>
                            )}
                            {involvedUsers.length === 0 && (
                                <div className="w-4 h-4 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                                    ?
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* --- TASK TYPE Layout: Assignee Avatar is Main, Channel Badge is overlapping --- */
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full border border-slate-200/80 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {task.assigneeIds?.[0] ? (
                                (() => {
                                    const user = users.find(u => u.id === task.assigneeIds[0]);
                                    return user ? (
                                        <img 
                                            src={user.avatarUrl} 
                                            className="w-full h-full object-cover" 
                                            alt={user.name}
                                            title={user.name}
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold">
                                            ?
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="w-full h-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold">
                                    ?
                                </div>
                            )}
                        </div>

                        {/* Overlapping Channel/Brand Badge */}
                        {channel && (
                            <div 
                                className="absolute -bottom-1 -right-1.5 w-[18px] h-[18px] rounded-full border-2 border-white flex items-center justify-center overflow-hidden shadow-md select-none bg-slate-300"
                                title={`ช่องทาง: ${channel.name}`}
                            >
                                {channel.logoUrl ? (
                                    <img 
                                        src={channel.logoUrl} 
                                        alt={channel.name} 
                                        className="w-full h-full object-cover animate-fade-in" 
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div 
                                        className="w-full h-full flex items-center justify-center text-[8px] font-black text-white leading-none"
                                        style={{ backgroundColor: channel.color || '#3b82f6' }}
                                    >
                                        {channel.name.slice(0, 1).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Mid Section: Details & Labels */}
            <div className="flex-1 min-w-0 pr-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <div className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase select-none ${isContent ? 'text-purple-600 bg-purple-50 border-purple-100' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                        {isContent ? <LayoutTemplate className="w-3 h-3"/> : <CheckSquare className="w-3 h-3"/>}
                        {isContent ? 'CONTENT' : 'TASK'}
                    </div>
                    {getDelayBadge(new Date(task.endDate))}
                </div>

                <h4 className="font-black text-sm sm:text-base text-slate-800 line-clamp-2 sm:truncate group-hover:text-indigo-600 transition-colors tracking-tight">
                    {task.title}
                </h4>

                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-black px-2 mt-0.5 py-0.5 sm:py-1 rounded-full border truncate max-w-[140px] sm:max-w-[200px] shadow-sm select-none ${statusColor}`}>
                        {statusLabel}
                    </span>
                    
                    {/* Extra context for Content: multiple writers/editors/creatives count */}
                    {isContent && involvedUsers.length > 1 && (
                        <span className="text-[9.5px] font-bold text-slate-400 select-none">
                            โดยทีม {involvedUsers.length} คน
                        </span>
                    )}
                </div>
            </div>

            {/* Visual Indicator of Clickability: Chevron with good touch visibility */}
            <div className="shrink-0 opacity-40 group-hover:opacity-100 transition-all sm:-translate-x-2 group-hover:translate-x-0">
                <div className="p-1.5 sm:p-2 bg-white rounded-xl sm:rounded-2xl text-slate-400 group-hover:text-indigo-500 shadow-sm border border-slate-100">
                    <ChevronRight className="w-4 h-4 sm:w-5 h-5" />
                </div>
            </div>
        </motion.div>
    );
};

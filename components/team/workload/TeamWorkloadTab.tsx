import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, ChevronDown, ArrowRight, Briefcase } from 'lucide-react';
import { User as UserType, Task, Channel } from '../../../types';
import { format, addWeeks, startOfDay, endOfDay, differenceInCalendarDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { formatWorkload, getMyRole } from './workloadConstants';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamWorkloadTabProps {
    workloadData: Array<{
        user: UserType;
        hours: number;
        level: { max: number; color: string; text: string; label: string };
    }>;
    weekStart: Date;
    weekEnd: Date;
    tasks: Task[];
    channels: Channel[];
    onOpenTask: (task: Task) => void;
}

// Helper to calculate tasks and their exact overlap contribution in the selected week
const getTasksWithContributions = (taskList: Task[], userId: string, weekStart: Date, weekEnd: Date) => {
    return taskList.reduce((acc, t) => {
        if (t.isUnscheduled || !t.startDate || !t.endDate || !t.estimatedHours) return acc;

        // Check if user is owner/editor/assignee
        const isParticipant = t.assigneeIds.includes(userId) || 
                              t.ideaOwnerIds?.includes(userId) || 
                              t.editorIds?.includes(userId);
        if (!isParticipant) return acc;

        const taskStart = startOfDay(new Date(t.startDate));
        const taskEnd = endOfDay(new Date(t.endDate));

        // Calculate overlap with current week [weekStart, weekEnd]
        const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart.getTime()));
        const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd.getTime()));

        if (overlapStart > overlapEnd) return acc;

        const totalDurationDays = Math.max(1, differenceInCalendarDays(taskEnd, taskStart) + 1);
        const hoursPerDay = t.estimatedHours / totalDurationDays;
        const overlapDays = differenceInCalendarDays(overlapEnd, overlapStart) + 1;
        const contributedHours = hoursPerDay * overlapDays;

        acc.push({
            task: t,
            contributedHours,
            totalHours: t.estimatedHours,
            overlapDays
        });
        return acc;
    }, [] as Array<{ task: Task; contributedHours: number; totalHours: number; overlapDays: number }>);
};

const TeamWorkloadTab: React.FC<TeamWorkloadTabProps> = ({
    workloadData,
    weekStart,
    weekEnd,
    tasks,
    channels,
    onOpenTask
}) => {
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    // Group workload data by position and sort members by hours descending
    const groupedByPosition = useMemo(() => {
        const groups: Record<string, typeof workloadData> = {};
        
        workloadData.forEach(item => {
            const pos = item.user.position?.trim() || 'ทั่วไป / อื่นๆ';
            if (!groups[pos]) {
                groups[pos] = [];
            }
            groups[pos].push(item);
        });

        // Sort members within each group by hours descending
        Object.keys(groups).forEach(pos => {
            groups[pos].sort((a, b) => b.hours - a.hours);
        });

        // Convert to array and sort groups by total workload hours descending
        return Object.entries(groups)
            .map(([position, members]) => {
                const totalHours = members.reduce((sum, m) => sum + m.hours, 0);
                return { position, members, totalHours };
            })
            .sort((a, b) => b.totalHours - a.totalHours);
    }, [workloadData]);

    return (
        <div className="space-y-6">
            {/* Position Sections with layout animation */}
            <motion.div layout className="space-y-6">
                {groupedByPosition.map(({ position, members, totalHours }) => (
                    <motion.div 
                        layout 
                        key={position} 
                        className="space-y-3"
                    >
                        {/* Section Header */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-500" />
                                <h4 className="font-kanit font-bold text-gray-800 text-sm">
                                    {position} 
                                    <span className="text-xs font-normal text-gray-400 ml-2">
                                        ({members.length} คน)
                                    </span>
                                </h4>
                            </div>
                            <div className="text-[11px] font-bold font-kanit text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-lg border border-indigo-100">
                                ภาระงานรวม: {formatWorkload(totalHours)}
                            </div>
                        </div>

                        {/* Member List in this group */}
                        <div className="space-y-3">
                            {members.map((data) => {
                                const isExpanded = expandedUserId === data.user.id;
                                const memberTasks = getTasksWithContributions(tasks, data.user.id, weekStart, weekEnd);

                                return (
                                    <motion.div 
                                        layout
                                        key={data.user.id} 
                                        className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300"
                                    >
                                        {/* Header (Clickable row to expand) */}
                                        <div 
                                            onClick={() => setExpandedUserId(isExpanded ? null : data.user.id)}
                                            className="p-3 md:p-4 flex items-center gap-3 md:gap-4 cursor-pointer select-none group/row"
                                        >
                                            <div className="relative shrink-0">
                                                <img src={data.user.avatarUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                                {data.hours > 45 && (
                                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full border border-white animate-bounce">
                                                        <AlertTriangle className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-end mb-1.5 md:mb-2">
                                                    <div>
                                                        <h4 className="font-bold font-kanit text-gray-800 text-sm md:text-base group-hover/row:text-indigo-600 transition-colors">{data.user.name}</h4>
                                                        <span className={`text-[10px] md:text-[12px] font-kanit font-medium px-1.5 py-0.5 rounded ${data.level.text} bg-opacity-10`}>
                                                            {data.level.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                        <span className="text-[16px] md:text-[20px] font-kanit font-bold text-gray-700">
                                                            {formatWorkload(data.hours)}
                                                        </span>
                                                        <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                                                    </div>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="h-2 md:h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${data.level.color}`} 
                                                        style={{ width: `${Math.min((data.hours / 60) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accordion List of Tasks */}
                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                    className="border-t border-gray-100 bg-slate-50/50"
                                                >
                                                    <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                                                        <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                            รายการงานในสัปดาห์นี้ ({memberTasks.length} รายการ)
                                                        </div>
                                                        {memberTasks.length === 0 ? (
                                                            <div className="text-[10px] md:text-xs text-gray-400 py-3 italic text-center bg-white rounded-xl border border-dashed border-gray-200">
                                                                ไม่มีภาระงานที่คิดเป็นชั่วโมงงานในสัปดาห์นี้
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {memberTasks.map(({ task, contributedHours, totalHours }) => {
                                                                    const channel = channels.find(c => c.id === task.channelId);
                                                                    const roleText = getMyRole(task, data.user.id);
                                                                    return (
                                                                        <div 
                                                                            key={task.id}
                                                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 md:p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group/task"
                                                                        >
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                                                    {channel && (
                                                                                        <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded border ${channel.color}`}>
                                                                                            {channel.name}
                                                                                        </span>
                                                                                    )}
                                                                                    <span className="text-[8px] md:text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                                                        {roleText}
                                                                                    </span>
                                                                                </div>
                                                                                <h5 className="font-bold text-gray-700 text-xs md:text-sm truncate group-hover/task:text-indigo-600 transition-colors">
                                                                                    {task.title}
                                                                                </h5>
                                                                            </div>
                                                                            
                                                                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto border-t sm:border-0 border-gray-50 pt-2 sm:pt-0">
                                                                                <div className="text-left">
                                                                                    <div className="text-xs font-bold text-indigo-600">
                                                                                        {formatWorkload(contributedHours)}
                                                                                    </div>
                                                                                    {Math.abs(totalHours - contributedHours) > 0.05 && (
                                                                                        <div className="text-[9px] md:text-[10px] text-gray-400">
                                                                                            จากทั้งหมด {totalHours} ชม.
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        onOpenTask(task);
                                                                                    }}
                                                                                    className="p-1.5 bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                                                    title="เปิดรายละเอียดงาน"
                                                                                >
                                                                                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default TeamWorkloadTab;

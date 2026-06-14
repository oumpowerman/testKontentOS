
import React, { memo, useMemo, useState } from 'react';
import { User, Task, Status, Priority, Channel, MasterOption } from '../../types';
import { Crown, BatteryFull, BatteryCharging, Battery, BatteryWarning, Users, Briefcase as JobIcon, Sparkles, AlertCircle, Clock8, Zap } from 'lucide-react';
import { STATUS_COLORS, WORK_STATUS_CONFIG, PRIORITY_COLORS } from '../../constants';
import { isToday, differenceInCalendarDays, format, isWithinInterval, startOfDay, endOfDay, differenceInDays, isBefore, startOfToday } from 'date-fns';
import { ColorLensMode } from '../TeamView';
import FeelingBubble, { BUBBLE_THEMES } from '../common/FeelingBubble';
import UserAvatarWithHP from '../common/UserAvatarWithHP';
import { motion, AnimatePresence } from 'framer-motion';
import { isStockTerminalStatus } from '../../config/status';
import MemberProfileTooltip from './MemberProfileTooltip';

// DnD Wrappers
import DraggableTask from './dnd/DraggableTask';
import DroppableCell from './dnd/DroppableCell';

interface TeamMemberRowProps {
    user: User;
    tasks: Task[]; // Pre-filtered tasks for this user
    weekDays: Date[];
    currentUser: User | null;
    onEditTask: (task: Task) => void;
    onSelectUser: (user: User) => void;
    isTaskOnDay: (task: Task, day: Date) => boolean;
    // DnD Props
    onDragStart: (e: React.DragEvent, taskId: string, clickDate?: Date) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, userId: string, date: Date) => void;
    // Visual Props
    colorLens?: ColorLensMode;
    isFocused?: boolean;
    channels?: Channel[];
    masterOptions?: MasterOption[];
}

// 7-Level Color Scale for Workload (Matching Modal)
const WORKLOAD_LEVELS = [
    { max: 5, color: 'bg-slate-200', text: 'text-slate-400', label: 'Idle' },
    { max: 15, color: 'bg-emerald-300', text: 'text-emerald-600', label: 'Light' },
    { max: 25, color: 'bg-sky-400', text: 'text-sky-600', label: 'Comfy' },
    { max: 35, color: 'bg-indigo-500', text: 'text-indigo-600', label: 'Good' },
    { max: 45, color: 'bg-orange-400', text: 'text-orange-600', label: 'Busy' },
    { max: 55, color: 'bg-red-500', text: 'text-red-600', label: 'Heavy' },
    { max: 999, color: 'bg-rose-800', text: 'text-rose-800', label: 'Max!' }
];

// Glassy 3D Themes for Tasks
const GLASS_THEMES = [
    { bg: 'bg-blue-400/20', border: 'border-blue-400/40', text: 'text-blue-900', accent: 'bg-blue-400', shadow: 'shadow-blue-500/10' },
    { bg: 'bg-indigo-400/20', border: 'border-indigo-400/40', text: 'text-indigo-900', accent: 'bg-indigo-400', shadow: 'shadow-indigo-500/10' },
    { bg: 'bg-purple-400/20', border: 'border-purple-400/40', text: 'text-purple-900', accent: 'bg-purple-400', shadow: 'shadow-purple-500/10' },
    { bg: 'bg-rose-400/20', border: 'border-rose-400/40', text: 'text-rose-900', accent: 'bg-rose-400', shadow: 'shadow-rose-500/10' },
    { bg: 'bg-amber-400/20', border: 'border-amber-400/40', text: 'text-amber-900', accent: 'bg-amber-400', shadow: 'shadow-amber-500/10' },
    { bg: 'bg-emerald-400/20', border: 'border-emerald-400/40', text: 'text-emerald-900', accent: 'bg-emerald-400', shadow: 'shadow-emerald-500/10' },
    { bg: 'bg-cyan-400/20', border: 'border-cyan-400/40', text: 'text-cyan-900', accent: 'bg-cyan-400', shadow: 'shadow-cyan-500/10' },
    { bg: 'bg-violet-400/20', border: 'border-violet-400/40', text: 'text-violet-900', accent: 'bg-violet-400', shadow: 'shadow-violet-500/10' },
    { bg: 'bg-fuchsia-400/20', border: 'border-fuchsia-400/40', text: 'text-fuchsia-900', accent: 'bg-fuchsia-400', shadow: 'shadow-fuchsia-500/10' },
];

// Helper for Priority Colors (Full classes)
const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
        case 'URGENT': return 'bg-red-100 text-red-700 border-red-200 ring-1 ring-red-100';
        case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'LOW': return 'bg-slate-50 text-slate-600 border-slate-200';
        default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
};

const getTaskTypeStyle = (task: Task) => {
    if (task.type === 'CONTENT') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-50 text-slate-700 border-slate-200'; // General Task
};

import TeamTaskPill from './TeamTaskPill';

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ 
    user, 
    tasks, 
    weekDays, 
    currentUser, 
    onEditTask, 
    onSelectUser,
    onDragStart,
    onDragOver,
    onDrop,
    colorLens = 'STATUS',
    isFocused = false,
    channels,
    masterOptions
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // 1. Calculate Slots for Timeline View (Tetris Logic)
    const { slots, maxRows } = useMemo(() => {
        const weekStart = weekDays[0];
        // Create 7 columns (days), each containing an array of tasks (rows)
        // null means empty slot
        const grid: (Task | null)[][] = Array.from({ length: 7 }, () => []);
        
        // Filter out unscheduled and sort by start date + duration (Longest first to fill better)
        const sorted = [...tasks]
            .filter(t => !t.isUnscheduled)
            .sort((a, b) => {
                const dateA = new Date(a.startDate).getTime();
                const dateB = new Date(b.startDate).getTime();
                if (dateA !== dateB) return dateA - dateB;
                
                const durA = new Date(a.endDate).getTime() - dateA;
                const durB = new Date(b.endDate).getTime() - dateB;
                return durB - durA; 
            });

        sorted.forEach(task => {
            const tStart = new Date(task.startDate);
            tStart.setHours(0,0,0,0);
            const tEnd = new Date(task.endDate);
            tEnd.setHours(23,59,59,999);

            // Find start and end index relative to this week [0...6]
            const startDayIndex = differenceInCalendarDays(tStart, weekStart);
            const endDayIndex = differenceInCalendarDays(tEnd, weekStart);
            
            // Clamp to visible week [0, 6]
            const effectiveStart = Math.max(0, startDayIndex);
            const effectiveEnd = Math.min(6, endDayIndex);

            if (effectiveStart > 6 || effectiveEnd < 0) return; // Out of view

            // Find first available row index across ALL days of this task
            let rowIndex = 0;
            while (true) {
                let isRowFree = true;
                for (let d = effectiveStart; d <= effectiveEnd; d++) {
                    if (grid[d][rowIndex] !== undefined) { // Slot occupied
                        isRowFree = false;
                        break;
                    }
                }
                if (isRowFree) break;
                rowIndex++;
            }

            // Fill slots
            for (let d = effectiveStart; d <= effectiveEnd; d++) {
                grid[d][rowIndex] = task;
            }
        });

        // Calculate max rows needed to render spacing correctly
        let max = 0;
        grid.forEach(col => max = Math.max(max, col.length));
        
        return { slots: grid, maxRows: max };
    }, [tasks, weekDays]);

    // --- Workload Calculation (Distributed by days) ---
    const weeklyHours = useMemo(() => {
        const weekStart = startOfDay(weekDays[0]);
        const weekEnd = endOfDay(weekDays[weekDays.length - 1]);
        
        return tasks.reduce((sum, t) => {
            if (t.isUnscheduled || !t.startDate || !t.endDate || !t.estimatedHours) return sum;

            const taskStart = startOfDay(new Date(t.startDate));
            const taskEnd = endOfDay(new Date(t.endDate));

            // 1. Calculate Total duration of the task in days (min 1 day)
            const totalDurationDays = Math.max(1, differenceInCalendarDays(taskEnd, taskStart) + 1);
            const hoursPerDay = t.estimatedHours / totalDurationDays;

            // 2. Calculate overlap with current week
            const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart.getTime()));
            const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd.getTime()));

            if (overlapStart > overlapEnd) return sum; // No overlap

            const overlapDays = differenceInCalendarDays(overlapEnd, overlapStart) + 1;
            
            return sum + (hoursPerDay * overlapDays);
        }, 0);
    }, [tasks, weekDays]);

    const workloadLevel = WORKLOAD_LEVELS.find(l => weeklyHours <= l.max) || WORKLOAD_LEVELS[WORKLOAD_LEVELS.length - 1];

    // --- Visual Helpers ---
    const getJuijuiScore = (hours: number) => {
        if (hours === 0) return { text: 'ว่างจัด (Free)', color: 'text-green-600 bg-green-100', icon: <BatteryFull className="w-4 h-4" /> };
        if (hours <= 15) return { text: 'ชิวๆ (Chill)', color: 'text-blue-600 bg-blue-100', icon: <BatteryCharging className="w-4 h-4" /> };
        if (hours <= 35) return { text: 'ตึงมือ (Busy)', color: 'text-orange-600 bg-orange-100', icon: <Battery className="w-4 h-4" /> };
        return { text: 'งานเดือด! (On Fire)', color: 'text-red-600 bg-red-100 animate-pulse', icon: <BatteryWarning className="w-4 h-4" /> };
    };

    const bubbleTheme = useMemo(() => {
        if (!user.id) return BUBBLE_THEMES[0];
        const todayStr = new Date().toDateString(); 
        const seedString = user.id + todayStr; 
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % BUBBLE_THEMES.length;
        return BUBBLE_THEMES[index];
    }, [user.id]);

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

    const statusInfo = getJuijuiScore(weeklyHours);
    const levelProgress = ((user.xp % 1000) / 1000) * 100;
    const isMe = user.id === currentUser?.id;

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'ONLINE': return 'bg-green-500 ring-green-200';
            case 'BUSY': return 'bg-red-500 ring-red-200';
            case 'SICK': return 'bg-orange-500 ring-orange-200';
            case 'VACATION': return 'bg-blue-500 ring-blue-200';
            case 'MEETING': return 'bg-purple-500 ring-purple-200';
            default: return 'bg-gray-400 ring-gray-200';
        }
    };
    const statusColorClass = getStatusColor(user.workStatus || 'ONLINE');
    
    const getTaskStyle = (task: Task) => {
        const isUrgent = task.priority === 'URGENT';
        const isHigh = task.priority === 'HIGH';

        let theme = GLASS_THEMES[0];

        if (colorLens === 'PRIORITY') {
            switch (task.priority) {
                case 'URGENT':
                    theme = { bg: 'bg-red-400/20', border: 'border-red-400/40', text: 'text-red-950 font-bold', accent: 'bg-red-500', shadow: 'shadow-red-500/10' };
                    break;
                case 'HIGH':
                    theme = { bg: 'bg-orange-400/20', border: 'border-orange-400/40', text: 'text-orange-950 font-bold', accent: 'bg-orange-500', shadow: 'shadow-orange-500/10' };
                    break;
                case 'MEDIUM':
                    theme = { bg: 'bg-blue-400/20', border: 'border-blue-400/40', text: 'text-blue-950', accent: 'bg-blue-500', shadow: 'shadow-blue-500/10' };
                    break;
                case 'LOW':
                default:
                    theme = { bg: 'bg-slate-400/10', border: 'border-slate-400/30', text: 'text-slate-800', accent: 'bg-slate-400', shadow: 'shadow-slate-500/5' };
                    break;
            }
        } else if (colorLens === 'TYPE') {
            if (task.type === 'CONTENT') {
                theme = { bg: 'bg-purple-400/20', border: 'border-purple-400/40', text: 'text-purple-950 font-semibold', accent: 'bg-purple-500', shadow: 'shadow-purple-550/10' };
            } else {
                theme = { bg: 'bg-slate-400/15', border: 'border-slate-400/35', text: 'text-slate-800', accent: 'bg-slate-500', shadow: 'shadow-slate-500/5' };
            }
        } else {
            // Default Status/Glassy Theme
            const id = task.id || 'default';
            let hash = 0;
            for (let i = 0; i < id.length; i++) {
                hash = id.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % GLASS_THEMES.length;
            theme = GLASS_THEMES[index];
        }

        return {
            theme,
            isUrgent,
            isHigh,
            className: `
                backdrop-blur-md border-t border-white/50 border-b border-black/10
                ${theme.bg} ${theme.border} ${theme.text} ${theme.shadow}
                ${isUrgent ? 'ring-2 ring-red-500/50 ring-inset animate-pulse' : ''}
                ${isHigh ? 'shadow-lg' : 'shadow-sm'}
                hover:scale-[1.02] hover:z-30 hover:brightness-110
            `
        };
    };

    // Height classes based on Focus Mode
    const rowHeightClass = isFocused ? 'h-11 mb-1.5' : 'h-8 mb-1';
    const spacerClass = isFocused ? 'h-11 mb-1.5' : 'h-8 mb-1';

    return (
        <div className={`grid grid-cols-8 group transition-all duration-500 relative z-60 hover:z-[170] ${isMe ? 'bg-indigo-50/10' : 'hover:bg-gray-50/30'}`}>
            {/* Vertical Status Rail (Mood & Workload Gain) */}
            <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col z-30 border-r border-gray-100/50">
                {/* Workload Gain Meter (Segmented) */}
                <div className="flex-1 w-full flex flex-col-reverse gap-[1px] p-[1px] bg-gray-50">
                    {[...Array(12)].map((_, i) => {
                        const threshold = (i + 1) * (40 / 12); // 40h is standard max
                        const isActive = weeklyHours >= threshold;
                        return (
                            <div 
                                key={i} 
                                className={`flex-1 w-full rounded-[1px] transition-all duration-700 ${
                                    isActive ? workloadLevel.color : 'bg-gray-200/30'
                                } ${isActive && weeklyHours > 45 ? 'animate-pulse' : ''}`}
                            />
                        );
                    })}
                </div>
                {/* Feeling Base Indicator */}
                <div 
                    className={`h-4 w-full bg-gradient-to-t ${bubbleTheme.bg} border-t ${bubbleTheme.border} relative group/mood`}
                >
                    {user.feeling && (
                        <div className="absolute left-full pl-2 top-1/2 -translate-y-1/2 hidden group-hover/mood:block z-50">
                            <div className={`whitespace-nowrap bg-white border-2 ${bubbleTheme.border} ${bubbleTheme.text} px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-bold italic animate-in fade-in zoom-in-95`}>
                                "{user.feeling}"
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Member Profile Column */}
            <div 
                className={`col-span-1 pl-5 pr-3 py-3 flex flex-col items-center text-center border-r border-gray-100 bg-white relative cursor-pointer hover:bg-gray-50 transition-all pt-4 ${isFocused ? 'border-r-indigo-100' : ''}`}
                onClick={() => onSelectUser(user)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Avatar & Status */}
                <div className="relative mb-2">
                    <FeelingBubble 
                        userId={user.id} 
                        feeling={user.feeling} 
                        className="-top-8 left-1/2 -translate-x-1/2 z-[120]" 
                    />
                    <UserAvatarWithHP 
                        user={user} 
                        isFocused={isFocused}
                    />
                </div>
                
                <p className={`text-xs font-bold truncate w-full mb-0.5 ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>{(user.name || 'Unknown').split(' ')[0]}</p>
                <p className="text-[9px] text-gray-400 font-medium mb-1">{user.position || 'Member'}</p>
                
                {/* Mood Subtitle */}
                {user.feeling && (
                    <div className={`mb-2 px-2 py-0.5 rounded-md text-[8px] font-bold italic border ${bubbleTheme.border} ${bubbleTheme.text} bg-white/50 max-w-full truncate flex items-center gap-1`}>
                        <Sparkles className="w-2 h-2 shrink-0" />
                        <span>{user.feeling}</span>
                    </div>
                )}

                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden mb-2"><div className="bg-indigo-500 h-full rounded-full" style={{ width: `${levelProgress}%` }}></div></div>
                <div className={`text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center justify-center gap-1 w-full border ${statusInfo.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')} bg-white text-gray-600`}>{statusInfo.icon} {formatWorkload(weeklyHours)}</div>

                {/* Elegant Gamified Tooltip */}
                <MemberProfileTooltip
                    user={user}
                    tasks={tasks}
                    isHovered={isHovered}
                    weeklyHours={weeklyHours}
                    statusInfo={statusInfo}
                    statusColorClass={statusColorClass}
                />
            </div>

            {/* Timeline Grid */}
            {weekDays.map((day, dayIndex) => {
                // Get pre-calculated items for this day column (up to maxRows)
                const itemsToRender = [];
                for (let r = 0; r < maxRows; r++) {
                    itemsToRender.push(slots[dayIndex][r]);
                }

                return (
                    <DroppableCell 
                        key={day.toString()} 
                        userId={user.id} 
                        date={day}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        className={`col-span-1 border-l border-gray-100 p-0 py-1.5 flex flex-col hover:z-[20] ${isToday(day) ? 'bg-indigo-50/20' : ''}`}
                    >
                        {itemsToRender.map((task, rowIndex) => {
                            // 1. SPACER (Empty Slot)
                            if (!task) return <div key={`spacer-${rowIndex}`} className={spacerClass}></div>;

                            // 2. TASK BAR
                            const tStart = new Date(task.startDate); tStart.setHours(0,0,0,0);
                            const tEnd = new Date(task.endDate); tEnd.setHours(23,59,59,999);
                            const currentDay = new Date(day); currentDay.setHours(0,0,0,0);
                            
                            const isStartOfTask = differenceInCalendarDays(currentDay, tStart) === 0;
                            const isEndOfTask = differenceInCalendarDays(currentDay, tEnd) === 0;
                            const isFirstCol = dayIndex === 0;
                            const isLastCol = dayIndex === 6;

                            // Shape Logic
                            let shapeClass = '';
                            let marginClass = 'mx-0'; // Default connected
                            let borderClass = 'border-x-0'; // Default connected

                            // Left Side
                            if (isStartOfTask) {
                                shapeClass += ' rounded-l-lg ml-1.5 border-l ';
                            } else if (isFirstCol) {
                                // Continued from previous week
                                shapeClass += ' rounded-l-none -ml-px border-l-0 '; 
                                // Clip effect? Or arrow? For now just flat.
                            } else {
                                // Middle of task within week
                                shapeClass += ' rounded-l-none -ml-[2px] border-l-0 ';
                            }

                            // Right Side
                            if (isEndOfTask) {
                                shapeClass += ' rounded-r-lg mr-1.5 border-r ';
                            } else if (isLastCol) {
                                // Continues to next week
                                shapeClass += ' rounded-r-none -mr-px border-r-0 ';
                            } else {
                                // Middle
                                shapeClass += ' rounded-r-none -mr-[2px] border-r-0 ';
                            }
                            
                            // Content Visibility: Show if Start, or First Col (if continued)
                            // In Focus Mode, maybe show on every block if space allows? No, cleaner to show once.
                            const showContent = isStartOfTask || isFirstCol;

                            return (
                                <DraggableTask
                                    key={`${task.id}-${dayIndex}`}
                                    taskId={task.id}
                                    onDragStart={(e, taskId) => onDragStart(e, taskId, day)}
                                    onDragEnd={() => {}}
                                >
                                    <TeamTaskPill
                                        task={task}
                                        day={day}
                                        dayIndex={dayIndex}
                                        showContent={showContent}
                                        rowHeightClass={rowHeightClass}
                                        shapeClass={shapeClass}
                                        taskStyle={getTaskStyle(task)}
                                        isTodayDay={isToday(day)}
                                        onEditTask={onEditTask}
                                        channels={channels}
                                        masterOptions={masterOptions}
                                        isFocused={isFocused}
                                    />
                                </DraggableTask>
                            );
                        })}
                    </DroppableCell>
                );
            })}
        </div>
    );
};

export default memo(TeamMemberRow);

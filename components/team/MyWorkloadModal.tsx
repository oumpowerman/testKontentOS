
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Users, User, Battery, BatteryCharging, BatteryFull, BatteryWarning, AlertTriangle, CalendarClock, Calendar, Layers, UserCircle, CheckCircle2, ArrowRight, LayoutGrid, List, Timer, History as HistoryIcon } from 'lucide-react';
import { Task, User as UserType, Channel } from '../../types';
import { startOfWeek, endOfWeek, addWeeks, format, isWithinInterval, startOfDay, endOfDay, isPast, isToday, isTomorrow, isSameWeek, differenceInCalendarDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { isTaskCompleted } from '../../constants';
import { Clock } from 'lucide-react';

interface MyWorkloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    users: UserType[];
    currentUser: UserType;
    channels: Channel[];
    onOpenTask: (task: Task) => void;
    onOpenHistory?: () => void;
}

type GroupMode = 'DATE' | 'CHANNEL' | 'ROLE';
type ViewMode = 'GRID' | 'LIST';

// 7-Level Color Scale
const WORKLOAD_LEVELS = [
    { max: 5, color: 'bg-slate-200', text: 'text-slate-500', label: 'Idle (ว่าง)' }, // 0-5h
    { max: 15, color: 'bg-emerald-300', text: 'text-emerald-700', label: 'Light (เบาๆ)' }, // 6-15h
    { max: 25, color: 'bg-sky-400', text: 'text-sky-700', label: 'Comfort (กำลังดี)' }, // 16-25h
    { max: 35, color: 'bg-indigo-500', text: 'text-white', label: 'Productive (ขยัน)' }, // 26-35h
    { max: 45, color: 'bg-orange-400', text: 'text-white', label: 'Busy (งานชุก)' }, // 36-45h
    { max: 55, color: 'bg-red-500', text: 'text-white', label: 'Heavy (หนัก)' }, // 46-55h
    { max: 999, color: 'bg-rose-800 animate-pulse', text: 'text-white', label: 'Overload (ไม่ไหวแล้ว)' } // 56+
];

const MyWorkloadModal: React.FC<MyWorkloadModalProps> = ({ 
    isOpen, onClose, tasks, users, currentUser, channels, onOpenTask, onOpenHistory 
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [groupMode, setGroupMode] = useState<GroupMode>('DATE');
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    // Default view to 'ME' to see tasks immediately, or keep logic same but focus on task list visibility
    const [tabMode, setTabMode] = useState<'TEAM' | 'ME'>('ME');

    // Date Logic
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    // 1. Filter: Get only MY active tasks
    const myActiveTasks = useMemo(() => {
        return tasks.filter(t => {
            // Must be involved
            const isMe = t.assigneeIds.includes(currentUser.id) || 
                         t.ideaOwnerIds?.includes(currentUser.id) || 
                         t.editorIds?.includes(currentUser.id);
            
            // Must not be done
            const isDone = isTaskCompleted(t.status as string);
            
            return isMe && !isDone;
        }).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }, [tasks, currentUser]);

    // Calculate Total Hours for Display
    const totalHours = useMemo(() => {
        return myActiveTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    }, [myActiveTasks]);

    // 2. Helper: Get my role in this task
    const getMyRole = (t: Task) => {
        const roles = [];
        if (t.ideaOwnerIds?.includes(currentUser.id)) roles.push('Owner 💡');
        if (t.editorIds?.includes(currentUser.id)) roles.push('Editor ✂️');
        if (t.assigneeIds.includes(currentUser.id)) roles.push('Support 🤝');
        return roles.join(' & ') || 'Member';
    };

    // 3. Grouping Logic
    const groupedTasks = useMemo(() => {
        const groups: Record<string, Task[]> = {};
        
        myActiveTasks.forEach(task => {
            let key = 'Other';
            
            if (groupMode === 'DATE') {
                const due = new Date(task.endDate);
                if (task.isUnscheduled) key = '📦 Unscheduled (Stock)';
                else if (isPast(due) && !isToday(due)) key = '🔥 Overdue (งานค้าง)';
                else if (isToday(due)) key = '📅 Today (วันนี้)';
                else if (isTomorrow(due)) key = '⏳ Tomorrow (พรุ่งนี้)';
                else if (isSameWeek(due, new Date(), { weekStartsOn: 1 })) key = '🗓️ This Week (สัปดาห์นี้)';
                else key = '🔮 Upcoming (ล่วงหน้า)';
            } 
            else if (groupMode === 'CHANNEL') {
                const ch = channels.find(c => c.id === task.channelId);
                key = ch ? ch.name : '🌐 General / Other';
            } 
            else if (groupMode === 'ROLE') {
                key = getMyRole(task);
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        // Custom Sort Keys for Date Mode
        if (groupMode === 'DATE') {
            const order = ['🔥 Overdue (งานค้าง)', '📅 Today (วันนี้)', '⏳ Tomorrow (พรุ่งนี้)', '🗓️ This Week (สัปดาห์นี้)', '🔮 Upcoming (ล่วงหน้า)', '📦 Unscheduled (Stock)'];
            // Reconstruct object with sorted keys
            const sortedGroups: Record<string, Task[]> = {};
            order.forEach(k => {
                if (groups[k]) sortedGroups[k] = groups[k];
            });
            return sortedGroups;
        }

        return groups;
    }, [myActiveTasks, groupMode, channels]);

    // Distributed Calculation Logic (Matches TeamView)
    const calculateHours = (taskList: Task[], userId: string) => {
        return taskList.reduce((sum, t) => {
            if (t.isUnscheduled || !t.startDate || !t.endDate || !t.estimatedHours) return sum;

            // Check ownership
            const isOwner = t.assigneeIds.includes(userId) || t.ideaOwnerIds?.includes(userId) || t.editorIds?.includes(userId);
            if (!isOwner) return sum;

            const taskStart = startOfDay(new Date(t.startDate));
            const taskEnd = endOfDay(new Date(t.endDate));

            // Calculate overlap with current week [weekStart, weekEnd]
            const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart.getTime()));
            const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd.getTime()));

            if (overlapStart > overlapEnd) return sum;

            const totalDurationDays = Math.max(1, differenceInCalendarDays(taskEnd, taskStart) + 1);
            const hoursPerDay = t.estimatedHours / totalDurationDays;
            const overlapDays = differenceInCalendarDays(overlapEnd, overlapStart) + 1;

            return sum + (hoursPerDay * overlapDays);
        }, 0);
    };

    const getTasksForUser = (userId: string) => {
        return tasks.filter(t => {
            if (t.isUnscheduled || !t.startDate || !t.endDate) return false;
            
            const taskStart = startOfDay(new Date(t.startDate));
            const taskEnd = endOfDay(new Date(t.endDate));
            
            // Check overlap
            const hasOverlap = taskStart <= weekEnd && taskEnd >= weekStart;
            const isOwner = t.assigneeIds.includes(userId) || t.ideaOwnerIds?.includes(userId) || t.editorIds?.includes(userId);
            
            return hasOverlap && isOwner;
        }).sort((a,b) => (b.estimatedHours || 0) - (a.estimatedHours || 0));
    };

    const workloadData = useMemo(() => {
        const activeUsers = users.filter(u => u.isActive);
        return activeUsers.map(u => {
            const hours = calculateHours(tasks, u.id);
            const level = WORKLOAD_LEVELS.find(l => hours <= l.max) || WORKLOAD_LEVELS[WORKLOAD_LEVELS.length - 1];
            return { user: u, hours, level };
        }).sort((a, b) => b.hours - a.hours); // Sort most busy first
    }, [tasks, users, weekStart, weekEnd]);

    const myData = workloadData.find(d => d.user.id === currentUser.id);
    const myTasksList = getTasksForUser(currentUser.id);

    // Formatter for Hours -> HH hr MM min
    const formatWorkload = (hours: number) => {
        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        
        if (h === 0 && m === 0) return '0 ชั่วโมง';
        const parts = [];
        if (h > 0) parts.push(`${h} ชั่วโมง`);
        if (m > 0) parts.push(`${m} นาที`);
        return parts.join(' ');
    };

    // Stats
    const overdueCount = myActiveTasks.filter(t => !t.isUnscheduled && isPast(t.endDate) && !isToday(t.endDate)).length;
    const todayCount = myActiveTasks.filter(t => !t.isUnscheduled && isToday(t.endDate)).length;

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 font-sans">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Main Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col z-10 border-4 border-indigo-50"
                >
            
            {/* Header */}
            <div className="px-8 py-6 bg-indigo-600 text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="w-40 h-40" /></div>
                
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-1 bg-white/20 rounded-full border-2 border-white/30">
                            <img src={currentUser.avatarUrl} className="w-16 h-16 rounded-full object-cover bg-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">สวัสดี, {currentUser.name.split(' ')[0]}! 👋</h2>
                            <p className="text-indigo-100 text-base font-medium mt-1">นี่คือรายการงานที่ค้างอยู่ของคุณ</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {onOpenHistory && (
                            <button 
                                onClick={onOpenHistory}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white group"
                                title="ดูประวัติการทำงาน"
                            >
                                <HistoryIcon className="w-6 h-6 group-hover:rotate-[-45deg] transition-transform" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex gap-4 mt-6 overflow-x-auto scrollbar-hide pb-2">
                     {/* Total Hours Badge (NEW) */}
                    <div className="flex items-center gap-2 bg-indigo-500/80 px-4 py-2 rounded-xl border border-indigo-400 backdrop-blur-md text-white whitespace-nowrap">
                        <Timer className="w-4 h-4 text-yellow-300" />
                        <span className="text-sm font-kanit font-bold">Total Load: {formatWorkload(totalHours)}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
                        <span className="text-sm font-kanit font-bold">{myActiveTasks.length} Active Tasks</span>
                    </div>
                    {overdueCount > 0 && (
                        <div className="flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-xl border border-red-400 backdrop-blur-md text-white whitespace-nowrap">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-kanit font-bold">{overdueCount} งานล่าช้า</span>
                        </div>
                    )}
                    {todayCount > 0 && (
                        <div className="flex items-center gap-2 bg-orange-500/80 px-4 py-2 rounded-xl border border-orange-400 backdrop-blur-md text-white whitespace-nowrap">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-bold">{todayCount} ส่งวันนี้</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4">
                
                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setTabMode('TEAM')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tabMode === 'TEAM' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Users className="w-4 h-4" /> ภาพรวมทีม
                    </button>
                    <button 
                        onClick={() => setTabMode('ME')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${tabMode === 'ME' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <User className="w-4 h-4" /> ของฉัน (My Focus)
                    </button>
                </div>

                {/* Group Controls (Only for TEAM mode actually used by list below) */}
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:block whitespace-nowrap">Group By:</span>
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex-1 md:flex-none">
                        <button 
                            onClick={() => setGroupMode('DATE')} 
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${groupMode === 'DATE' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Calendar className="w-4 h-4" /> วันส่ง
                        </button>
                        <button 
                            onClick={() => setGroupMode('CHANNEL')} 
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${groupMode === 'CHANNEL' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Layers className="w-4 h-4" /> ช่องรายการ
                        </button>
                        <button 
                            onClick={() => setGroupMode('ROLE')} 
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${groupMode === 'ROLE' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <UserCircle className="w-4 h-4" /> หน้าที่
                        </button>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setViewMode('GRID')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode('LIST')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        title="List View"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
                
                {tabMode === 'TEAM' ? (
                    <div className="space-y-4">
                        {/* Team Workload Summary (Visual) */}
                         <div className="flex items-center gap-3 bg-white/10 p-1 rounded-xl border border-white/10 md:hidden mb-4">
                            <button onClick={() => setCurrentDate(addWeeks(currentDate, -1))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
                            <span className="text-sm font-bold min-w-[140px] text-center text-gray-600">
                                {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM', { locale: th })}
                            </span>
                            <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
                        </div>

                        {workloadData.map((data) => (
                            <div key={data.user.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                                <div className="relative shrink-0">
                                    <img src={data.user.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                    {data.hours > 45 && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full border-2 border-white animate-bounce">
                                            <AlertTriangle className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <h4 className="font-medium font-kanit text-gray-800 text-md">{data.user.name}</h4>
                                            <span className={`text-[12px] font-kanit font-medium px-1.5 py-0.5 rounded ${data.level.text} bg-opacity-10`}>
                                                {data.level.label}
                                            </span>
                                        </div>
                                        <span className="text-[20px] font-kanit font-bold text-gray-700">
                                            {formatWorkload(data.hours)}
                                        </span>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${data.level.color}`} 
                                            style={{ width: `${Math.min((data.hours / 60) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // ME Mode: Task Breakdown
                    <>
                        {Object.keys(groupedTasks).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <CheckCircle2 className="w-20 h-20 text-emerald-300 mb-6" />
                                <h3 className="text-2xl font-bold text-gray-600">สุดยอด! เคลียร์งานหมดแล้ว</h3>
                                <p className="text-base mt-2">พักผ่อนได้เลย หรือไปช่วยเพื่อนทำก็ได้นะ</p>
                            </div>
                        ) : (
                            Object.entries(groupedTasks).map(([groupTitle, items]) => {
                                const tasksInGroup = items as Task[]; // Cast to Task[] to fix unknown error
                                return (
                                    <div key={groupTitle} className="animate-in slide-in-from-bottom-2 duration-500">
                                        <h3 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                                            <span className="w-3 h-3 rounded-full bg-indigo-400 mr-3"></span>
                                            {groupTitle} 
                                            <span className="ml-3 bg-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full">{tasksInGroup.length}</span>
                                        </h3>
                                        
                                        <div className={`grid gap-4 ${viewMode === 'GRID' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                            {tasksInGroup.map(task => {
                                                const channel = channels.find(c => c.id === task.channelId);
                                                const isOverdue = !task.isUnscheduled && isPast(task.endDate) && !isToday(task.endDate);
                                                
                                                // LIST VIEW RENDER
                                                if (viewMode === 'LIST') {
                                                    return (
                                                        <div 
                                                            key={task.id}
                                                            onClick={() => onOpenTask(task)}
                                                            className={`
                                                                bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden
                                                                ${isOverdue ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-indigo-400'}
                                                            `}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {channel && (
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${channel.color}`}>
                                                                            {channel.name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                                        {getMyRole(task)}
                                                                    </span>
                                                                    {isOverdue && (
                                                                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded animate-pulse">
                                                                            Late!
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-bold text-gray-800 text-base truncate group-hover:text-indigo-600 transition-colors">
                                                                    {task.title}
                                                                </h4>
                                                            </div>

                                                            <div className="flex items-center gap-4 text-right shrink-0">
                                                                {/* Hours Badge (LIST VIEW) */}
                                                                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg whitespace-nowrap border border-indigo-100">
                                                                    {task.estimatedHours}h
                                                                </div>

                                                                <div className={`text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                                                    {task.isUnscheduled ? 'Stock' : format(task.endDate, 'd MMM')}
                                                                </div>
                                                                <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                    <ArrowRight className="w-5 h-5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // GRID VIEW RENDER
                                                return (
                                                    <div 
                                                        key={task.id} 
                                                        onClick={() => onOpenTask(task)}
                                                        className={`
                                                            bg-white p-5 rounded-3xl border-2 transition-all cursor-pointer group hover:shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]
                                                            ${isOverdue ? 'border-red-100 hover:border-red-300' : 'border-gray-100 hover:border-indigo-300'}
                                                        `}
                                                    >
                                                        {/* Left Accent */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${channel?.color.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-300'}`}></div>
                                                        
                                                        {/* Hours Badge (GRID VIEW) */}
                                                        <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                                            {task.estimatedHours}h
                                                        </div>

                                                        <div className="pl-4">
                                                            <div className="flex justify-between items-start mb-3 mr-8">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {channel && (
                                                                        <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg border border-gray-100">
                                                                            {channel.name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                                        {getMyRole(task)}
                                                                    </span>
                                                                </div>
                                                                {isOverdue && (
                                                                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg animate-pulse shadow-sm">
                                                                        LATE
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h4 className="font-bold text-gray-800 text-lg line-clamp-2 group-hover:text-indigo-600 transition-colors mb-4 leading-tight">
                                                                {task.title}
                                                            </h4>
                                                            
                                                            <div className="flex justify-between items-end mt-auto border-t border-gray-50 pt-3">
                                                                <div className={`flex items-center text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                                                    <Calendar className="w-4 h-4 mr-1.5" />
                                                                    {task.isUnscheduled ? 'No Date' : format(task.endDate, 'd MMM')}
                                                                </div>
                                                                <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}

            </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);

};

export default MyWorkloadModal;

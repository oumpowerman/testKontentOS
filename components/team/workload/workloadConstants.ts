import { Task } from '../../../types';
import { startOfDay, endOfDay, differenceInCalendarDays } from 'date-fns';

// 7-Level Color Scale
export const WORKLOAD_LEVELS = [
    { max: 5, color: 'bg-slate-200', text: 'text-slate-500', label: 'Idle (ว่าง)' }, // 0-5h
    { max: 15, color: 'bg-emerald-300', text: 'text-emerald-700', label: 'Light (เบาๆ)' }, // 6-15h
    { max: 25, color: 'bg-sky-400', text: 'text-sky-700', label: 'Comfort (กำลังดี)' }, // 16-25h
    { max: 35, color: 'bg-indigo-500', text: 'text-white', label: 'Productive (ขยัน)' }, // 26-35h
    { max: 45, color: 'bg-orange-400', text: 'text-white', label: 'Busy (งานชุก)' }, // 36-45h
    { max: 55, color: 'bg-red-500', text: 'text-white', label: 'Heavy (หนัก)' }, // 46-55h
    { max: 999, color: 'bg-rose-800 animate-pulse', text: 'text-white', label: 'Overload (ไม่ไหวแล้ว)' } // 56+
];

// Formatter for Hours -> HH hr MM min
export const formatWorkload = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (h === 0 && m === 0) return '0 ชั่วโมง';
    const parts = [];
    if (h > 0) parts.push(`${h} ชั่วโมง`);
    if (m > 0) parts.push(`${m} นาที`);
    return parts.join(' ');
};

// Distributed Calculation Logic (Matches TeamView)
export const calculateHours = (taskList: Task[], userId: string, weekStart: Date, weekEnd: Date): number => {
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

export const getMyRole = (task: Task, userId: string): string => {
    const roles = [];
    if (task.ideaOwnerIds?.includes(userId)) roles.push('Owner 💡');
    if (task.editorIds?.includes(userId)) roles.push('Editor ✂️');
    if (task.assigneeIds.includes(userId)) roles.push('Support 🤝');
    return roles.join(' & ') || 'Member';
};

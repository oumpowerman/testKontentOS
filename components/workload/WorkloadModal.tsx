
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Users, User, Battery, BatteryCharging, BatteryFull, BatteryWarning, AlertTriangle, CalendarClock } from 'lucide-react';
import { Task, User as UserType } from '../../types';
import { startOfWeek, endOfWeek, addWeeks, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { th } from 'date-fns/locale';

interface WorkloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    users: UserType[];
    currentUser: UserType;
}

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

const WorkloadModal: React.FC<WorkloadModalProps> = ({ isOpen, onClose, tasks, users, currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'TEAM' | 'ME'>('TEAM');

    // Date Logic
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    // Calculation Logic
    const calculateHours = (taskList: Task[], userId: string) => {
        return taskList
            .filter(t => {
                if (t.isUnscheduled || !t.endDate) return false;
                const taskEnd = startOfDay(new Date(t.endDate));
                // Check if task falls within this week
                const inWeek = isWithinInterval(taskEnd, { start: weekStart, end: weekEnd });
                // Check ownership
                const isOwner = t.assigneeIds.includes(userId) || t.ideaOwnerIds?.includes(userId) || t.editorIds?.includes(userId);
                // Exclude DONE tasks? No, include them to see performance history
                return inWeek && isOwner;
            })
            .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    };

    const getTasksForUser = (userId: string) => {
        return tasks.filter(t => {
            if (t.isUnscheduled || !t.endDate) return false;
            const taskEnd = startOfDay(new Date(t.endDate));
            const inWeek = isWithinInterval(taskEnd, { start: weekStart, end: weekEnd });
            const isOwner = t.assigneeIds.includes(userId) || t.ideaOwnerIds?.includes(userId) || t.editorIds?.includes(userId);
            return inWeek && isOwner;
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

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white ring-1 ring-gray-200">
                
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                            <BatteryCharging className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Workload Monitor</h2>
                            <p className="text-slate-400 text-xs font-medium">เช็คปริมาณงานและสุขภาพทีม</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, -1))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-sm font-bold min-w-[140px] text-center">
                            {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM', { locale: th })}
                        </span>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>

                    <button onClick={onClose} className="absolute top-4 right-4 md:static p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex gap-2">
                    <button 
                        onClick={() => setViewMode('TEAM')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'TEAM' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        <Users className="w-4 h-4" /> ภาพรวมทีม (Team)
                    </button>
                    <button 
                        onClick={() => setViewMode('ME')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'ME' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        <User className="w-4 h-4" /> ของฉัน (My Focus)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    
                    {viewMode === 'TEAM' ? (
                        <div className="space-y-4">
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
                                                <h4 className="font-bold text-gray-800 text-sm">{data.user.name}</h4>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${data.level.text} bg-opacity-10`}>
                                                    {data.level.label}
                                                </span>
                                            </div>
                                            <span className="text-xl font-black text-gray-700">
                                                {data.hours} <span className="text-xs text-gray-400 font-medium">hrs</span>
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
                        <div className="space-y-6 h-full flex flex-col">
                            {/* My Big Summary */}
                            <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm text-center relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-2 ${myData?.level.color}`}></div>
                                <h3 className="text-lg font-bold text-gray-600 mb-2">ภาระงานสัปดาห์นี้</h3>
                                <div className="text-6xl font-black text-slate-800 tracking-tighter mb-2">
                                    {myData?.hours || 0}
                                    <span className="text-xl text-gray-400 ml-2 font-bold">Hours</span>
                                </div>
                                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${myData?.level.color} ${myData?.level.text}`}>
                                    Status: {myData?.level.label}
                                </span>
                            </div>

                            {/* Task Breakdown */}
                            <div className="flex-1 overflow-y-auto">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">รายการที่นับชั่วโมง (Tasks Breakdown)</h4>
                                {myTasksList.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                                        <BatteryFull className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>สัปดาห์นี้ยังไม่มีงานจ้า</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {myTasksList.map(task => (
                                            <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 transition-all">
                                                <div className="min-w-0 flex-1 pr-4">
                                                    <h5 className="font-bold text-gray-700 text-sm truncate">{task.title}</h5>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center">
                                                            <CalendarClock className="w-3 h-3 mr-1" />
                                                            {task.endDate ? format(new Date(task.endDate), 'd MMM') : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-lg font-black text-indigo-600">{task.estimatedHours}</span>
                                                    <span className="text-[10px] text-gray-400 block font-bold">HRS</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
};

export default WorkloadModal;

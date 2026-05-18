
import React, { useState, useEffect } from 'react';
import { format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isToday as isDateToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, MapPin, CheckCircle2, AlertCircle, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Task, Channel, MasterOption, ChipConfig } from '../../types';
import { TaskDisplayMode } from '../CalendarView';
import { th } from 'date-fns/locale';

interface WeeklyViewProps {
    currentDate: Date;
    viewMode: 'CONTENT' | 'TASK';
    taskDisplayMode: TaskDisplayMode;
    getTasksForDay: (day: Date) => Task[];
    filterTasks: (tasks: Task[]) => Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
    onSelectDate: (date: Date, type?: any) => void;
    isLandscape?: boolean;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({
    currentDate,
    viewMode,
    taskDisplayMode,
    getTasksForDay,
    filterTasks,
    channels,
    masterOptions,
    onTaskClick,
    onSelectDate,
    isLandscape = false
}) => {
    const [selectedDay, setSelectedDay] = useState<Date>(currentDate);

    useEffect(() => {
        // Sync selectedDay with currentDate when week changes from header
        setSelectedDay(currentDate);
    }, [currentDate]);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Ensure selectedDay is valid for the current week slice
    const visibleSelectedDay = days.find(d => isSameDay(d, selectedDay)) || days[0];

    // Helper to sort tasks by time
    const sortTasksByTime = (tasks: Task[]) => {
        return [...tasks].sort((a, b) => {
            const timeA = a.scheduledTime || '23:59';
            const timeB = b.scheduledTime || '23:59';
            return timeA.localeCompare(timeB);
        });
    };

    const renderTaskCard = (task: Task) => {
        const channel = channels.find(c => c.id === task.channelId);
        const statusOption = masterOptions.find(o => o.key === task.status);
        const statusColor = statusOption?.color || '#94a3b8';

        return (
            <motion.div
                key={task.id}
                layoutId={task.id}
                onClick={() => onTaskClick(task)}
                className="group/card relative bg-white rounded-3xl p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-200 cursor-pointer transition-all active:scale-[0.98]"
            >
                {/* Card Header: Time + Status Strip */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-black">
                        <Clock className="w-3.5 h-3.5" />
                        {task.scheduledTime || '--:--'}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">
                            {statusOption?.label || 'Unknown'}
                        </span>
                        <div 
                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: statusColor }}
                        />
                    </div>
                </div>

                {/* Channel & Title */}
                <div className="space-y-2">
                    {channel && (
                        <div className="flex items-center gap-2">
                            {channel.logoUrl ? (
                                <img src={channel.logoUrl} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                    <CalendarIcon className="w-3 h-3 text-slate-400" />
                                </div>
                            )}
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] truncate">
                                {channel.name}
                            </span>
                        </div>
                    )}
                    <h4 className="text-sm font-black text-slate-800 leading-snug group-hover/card:text-indigo-600 transition-colors">
                        {task.title}
                    </h4>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-50">
                    {task.shootLocation && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <MapPin className="w-3 h-3 text-indigo-400" />
                            <span className="truncate max-w-[120px]">{task.shootLocation}</span>
                        </div>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        {task.priority === 'HIGH' && (
                            <div className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest border border-rose-100 flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5 fill-rose-50" /> HIGH
                            </div>
                        )}
                        {task.status === 'DONE' && (
                            <div className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest border border-emerald-100 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> DONE
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full lg:bg-white/40 lg:backdrop-blur-md lg:rounded-[2.5rem] lg:border lg:border-white/60 lg:shadow-xl overflow-hidden">
            
            {/* --- MOBILE VIEW: Date Strip + Focused Day --- */}
            <div className={`${isLandscape ? 'hidden' : 'lg:hidden'} flex flex-col gap-4`}>
                {/* Date Strip */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-3 border border-white/60 shadow-sm flex justify-around items-center">
                    {days.map((day) => {
                        const isSelected = isSameDay(day, visibleSelectedDay);
                        const isToday = isDateToday(day);
                        const tasksCount = filterTasks(getTasksForDay(day)).length;
                        
                        return (
                            <button
                                key={day.toString()}
                                onClick={() => setSelectedDay(day)}
                                className={`flex flex-col items-center gap-1 transition-all relative ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                            >
                                <span className={`text-[10px] font-black tracking-tighter ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {format(day, 'EEE')}
                                </span>
                                <div className={`
                                    w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all
                                    ${isSelected 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                        : isToday 
                                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                                            : 'bg-slate-50 text-slate-500'}
                                `}>
                                    {format(day, 'd')}
                                </div>
                                {tasksCount > 0 && !isSelected && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                                        {tasksCount}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Task List for Selected Day */}
                <div className="p-1 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                {format(visibleSelectedDay, 'EEEE, d MMMM', { locale: th })}
                            </span>
                            <h3 className="text-lg font-black text-slate-800">งานที่คุณวางแผนไว้</h3>
                        </div>
                        <button 
                            onClick={() => onSelectDate(visibleSelectedDay, viewMode)}
                            className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 min-h-[300px]">
                        <AnimatePresence mode="popLayout">
                            {sortTasksByTime(filterTasks(getTasksForDay(visibleSelectedDay))).length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-12 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 gap-3"
                                >
                                    <Clock className="w-10 h-10 opacity-20" />
                                    <p className="text-xs font-bold text-slate-400 italic">ไม่มีงานที่วางแผนไว้สำหรับวันนี้</p>
                                    <button 
                                        onClick={() => onSelectDate(visibleSelectedDay, viewMode)}
                                        className="mt-2 text-[10px] font-black text-indigo-500 bg-indigo-50 px-4 py-2 rounded-xl"
                                    >
                                        เพิ่มงานแรก
                                    </button>
                                </motion.div>
                            ) : (
                                sortTasksByTime(filterTasks(getTasksForDay(visibleSelectedDay))).map((task) => renderTaskCard(task))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP VIEW: Multi-Column --- */}
            <div className={`${isLandscape ? 'flex' : 'hidden lg:flex'} flex-col h-full`}>
                {/* Week Header */}
                <div className="flex border-b border-gray-100 bg-white/80 sticky top-0 z-20">
                    {days.map((day) => {
                        const isToday = isDateToday(day);
                        return (
                            <div key={day.toString()} className="flex-1 min-w-[140px] p-4 text-center border-r border-gray-50 last:border-r-0">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {format(day, 'EEE')}
                                </span>
                                <div className={`mt-1 text-2xl font-black ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Week Content */}
                <div className="flex flex-1 overflow-x-auto scrollbar-hide divide-x divide-gray-100">
                    {days.map((day) => {
                        const dayTasks = filterTasks(getTasksForDay(day));
                        const sortedTasks = sortTasksByTime(dayTasks);
                        const isToday = isDateToday(day);

                        return (
                            <div 
                                key={day.toString()} 
                                className={`flex-1 min-w-[280px] p-4 flex flex-col gap-4 group transition-colors ${isToday ? 'bg-indigo-50/20' : 'hover:bg-white/40'}`}
                            >
                                {/* Actions */}
                                <button 
                                    onClick={() => onSelectDate(day, viewMode)}
                                    className="w-full py-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-all opacity-0 group-hover:opacity-100 mb-2 shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">เพิ่มงาน</span>
                                </button>

                                {/* Task List */}
                                <div className="flex flex-col gap-3">
                                    {sortedTasks.length === 0 ? (
                                        <div className="py-10 flex flex-col items-center justify-center text-slate-300 gap-2">
                                            <Clock className="w-8 h-8 opacity-20" />
                                            <span className="text-[10px] font-medium italic">ไม่มีงานที่วางแผนไว้</span>
                                        </div>
                                    ) : (
                                        sortedTasks.map((task) => renderTaskCard(task))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyView;

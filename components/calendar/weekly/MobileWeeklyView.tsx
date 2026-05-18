
import React from 'react';
import { format, isSameDay, isToday as isDateToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus } from 'lucide-react';
import { th } from 'date-fns/locale';
import { Task, Channel, MasterOption } from '../../../types';
import { WeeklyTaskCard } from './WeeklyTaskCard';

interface MobileWeeklyViewProps {
    days: Date[];
    selectedDay: Date;
    setSelectedDay: (day: Date) => void;
    tasksForSelectedDay: Task[];
    getTasksCountForDay: (day: Date) => number;
    onSelectDate: (date: Date, type?: any) => void;
    viewMode: 'CONTENT' | 'TASK';
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
    isLandscape?: boolean;
}

export const MobileWeeklyView: React.FC<MobileWeeklyViewProps> = ({
    days,
    selectedDay,
    setSelectedDay,
    tasksForSelectedDay,
    getTasksCountForDay,
    onSelectDate,
    viewMode,
    channels,
    masterOptions,
    onTaskClick,
    isLandscape = false
}) => {
    return (
        <div className={`${isLandscape ? 'hidden' : 'lg:hidden'} flex flex-col gap-4`}>
            {/* Date Strip */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-3 border border-white/60 shadow-sm flex justify-around items-center">
                {days.map((day) => {
                    const isSelected = isSameDay(day, selectedDay);
                    const isToday = isDateToday(day);
                    const tasksCount = getTasksCountForDay(day);
                    
                    return (
                        <button
                            key={day.toString()}
                            onClick={() => setSelectedDay(day)}
                            className={`flex flex-col items-center gap-1 transition-all relative ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                        >
                            <span className={`text-[14px] font-bold tracking-tighter ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {format(day, 'EEE')}
                            </span>
                            <div className={`
                                w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all
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
                        <span className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest">
                            {format(selectedDay, 'EEEE, d MMMM', { locale: th })}
                        </span>
                        <h3 className="text-lg font-bold text-slate-800">งานที่คุณวางแผนไว้</h3>
                    </div>
                    <button 
                        onClick={() => onSelectDate(selectedDay, viewMode)}
                        className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-3 min-h-[300px]">
                    <AnimatePresence mode="popLayout">
                        {tasksForSelectedDay.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-12 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 gap-3"
                            >
                                <Clock className="w-10 h-10 opacity-20" />
                                <p className="text-xs font-bold text-slate-400 italic">ไม่มีงานที่วางแผนไว้สำหรับวันนี้</p>
                                <button 
                                    onClick={() => onSelectDate(selectedDay, viewMode)}
                                    className="mt-2 text-[10px] font-black text-indigo-500 bg-indigo-50 px-4 py-2 rounded-xl"
                                >
                                    เพิ่มงานแรก
                                </button>
                            </motion.div>
                        ) : (
                            tasksForSelectedDay.map((task) => (
                                <WeeklyTaskCard 
                                    key={task.id}
                                    task={task}
                                    channels={channels}
                                    masterOptions={masterOptions}
                                    onTaskClick={onTaskClick}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

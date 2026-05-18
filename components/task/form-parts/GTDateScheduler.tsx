
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles, Info, Lock, Clock } from 'lucide-react';
import { format, parseISO, isSameMonth, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isValid, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';
import TimePickerModal from '../../ui/TimePickerModal';

interface GTDateSchedulerProps {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    scheduledTime?: string;
    setScheduledTime?: (val: string) => void;
    isEndDateLocked?: boolean;
    onRequestExtension?: () => void;
}

const GTDateScheduler: React.FC<GTDateSchedulerProps> = ({ 
    startDate, setStartDate, endDate, setEndDate, 
    scheduledTime, setScheduledTime,
    isEndDateLocked, onRequestExtension 
}) => {
    const [activePicker, setActivePicker] = useState<'START' | 'END' | null>(null);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);
    
    const { annualHolidays } = useAnnualHolidays();
    const { exceptions } = useCalendarExceptions();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setActivePicker(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);

    const getDayInfo = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // 1. Check Exceptions
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) {
            return {
                isHoliday: exception.type === 'HOLIDAY',
                isWorkDay: exception.type === 'WORK_DAY',
                label: exception.description
            };
        }

        // 2. Check Annual Holidays
        const holiday = annualHolidays.find(h => h.month === month && h.day === day && h.isActive);
        if (holiday) {
            return { isHoliday: true, label: holiday.name };
        }

        // 3. Check Weekend
        if (isWeekend(date)) {
            return { isHoliday: true, label: 'Weekend' };
        }

        return { isHoliday: false };
    };

    const handleDateSelect = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (activePicker === 'START') {
            setStartDate(dateStr);
            // If end date is before new start date, update end date too
            if (endDate && dateStr > endDate) {
                setEndDate(dateStr);
            }
        } else {
            setEndDate(dateStr);
            // If start date is after new end date, update start date too
            if (startDate && dateStr < startDate) {
                setStartDate(dateStr);
            }
        }
        setActivePicker(null);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return 'MM/DD/YYYY';
        const date = parseISO(dateStr);
        return isValid(date) ? format(date, 'MM/dd/yyyy') : 'MM/DD/YYYY';
    };

    return (
        <div className="relative pt-2 border-t border-gray-100" ref={containerRef}>
            <div className="grid grid-cols-2 gap-4">
                {/* Start Date Display */}
                <div className="space-y-2">
                    <label className="block text-[12px] font-bold text-gray-400 ml-1 uppercase tracking-widest">วันเริ่ม</label>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActivePicker('START');
                            if (startDate) setViewMonth(parseISO(startDate));
                        }}
                        className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left
                            ${activePicker === 'START' ? 'bg-white border-indigo-400 ring-4 ring-indigo-50 shadow-md' : 'bg-gray-50 border-gray-200 hover:border-indigo-200'}
                        `}
                    >
                        <CalendarIcon className={`w-5 h-5 ${activePicker === 'START' ? 'text-indigo-500' : 'text-gray-400'}`} />
                        <span className={`text-sm font-bold tracking-wide ${startDate ? 'text-slate-700' : 'text-gray-400'}`}>
                            {formatDateDisplay(startDate)}
                        </span>
                    </button>
                </div>

                {/* End Date Display */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-[12px] font-bold text-gray-400 ml-1 uppercase tracking-widest">วันครบกำหนด</label>
                        {isEndDateLocked && (
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); onRequestExtension?.(); }}
                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                            >
                                <Lock className="w-3 h-3" />
                                ขอเลื่อน
                            </button>
                        )}
                    </div>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isEndDateLocked) {
                                onRequestExtension?.();
                            } else {
                                setActivePicker('END');
                                if (endDate) setViewMonth(parseISO(endDate));
                            }
                        }}
                        className={`
                            w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all text-left
                            ${activePicker === 'END' ? 'bg-white border-rose-400 ring-4 ring-rose-50 shadow-md' : 'bg-rose-50/30 border-rose-100 hover:border-rose-200'}
                            ${isEndDateLocked ? 'opacity-80 cursor-pointer' : ''}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <CalendarIcon className={`w-5 h-5 ${activePicker === 'END' ? 'text-rose-500' : 'text-rose-300'}`} />
                            <span className={`text-sm font-bold tracking-wide ${endDate ? 'text-rose-700' : 'text-rose-300'}`}>
                                {formatDateDisplay(endDate)}
                            </span>
                        </div>
                        {isEndDateLocked && <Lock className="w-4 h-4 text-rose-300" />}
                    </button>
                </div>
            </div>

            {/* Scheduled Time Section */}
            <div className="mt-4 space-y-2">
                <label className="block text-[12px] font-bold text-gray-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                     เวลานัดหมาย
                </label>
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => setIsTimePickerOpen(true)}
                        className="w-full px-4 py-3 bg-indigo-50/20 border-2 border-indigo-100 rounded-2xl outline-none font-bold text-indigo-700 hover:border-indigo-400 transition-all cursor-pointer hover:bg-white flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            <span>{scheduledTime || '--:--'}</span>
                        </div>
                        <Sparkles className="w-4 h-4 text-indigo-300" />
                    </button>
                </div>
            </div>

            <TimePickerModal 
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={scheduledTime}
                onSelect={(time) => setScheduledTime?.(time)}
            />

            {/* Custom Pastel Calendar Popover */}
            <AnimatePresence>
                {activePicker && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing parent modal
                        className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-[2.5rem] shadow-2xl border border-indigo-50 p-6 z-[100] overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-xl ${activePicker === 'START' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        {activePicker === 'START' ? 'เลือกวันเริ่ม' : 'เลือกวันครบกำหนด'}
                                    </span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePicker(null);
                                    }} 
                                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mb-6 bg-gray-50/50 p-2 rounded-2xl">
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setViewMonth(prev => addMonths(prev, -1));
                                    }} 
                                    className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-gray-400 transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                                    {format(viewMonth, 'MMMM yyyy', { locale: th })}
                                </span>
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setViewMonth(prev => addMonths(prev, 1));
                                    }} 
                                    className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-gray-400 transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map(day => (
                                    <div key={day} className="text-[10px] font-black text-gray-300 text-center py-2 uppercase tracking-tighter">{day}</div>
                                ))}
                                {calendarDays.map((date, i) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const isCurrentMonth = isSameMonth(date, viewMonth);
                                    const isSelected = (activePicker === 'START' ? startDate : endDate) === dateStr;
                                    const isOtherSelected = (activePicker === 'START' ? endDate : startDate) === dateStr;
                                    const dayInfo = getDayInfo(date);
                                    
                                    // Highlight range
                                    const isInRange = startDate && endDate && dateStr >= startDate && dateStr <= endDate;

                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDateSelect(date);
                                            }}
                                            className={`
                                                relative h-10 w-full flex flex-col items-center justify-center rounded-xl transition-all group
                                                ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                                                ${isSelected 
                                                    ? (activePicker === 'START' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-rose-500 text-white shadow-lg shadow-rose-100') 
                                                    : isInRange 
                                                        ? 'bg-indigo-50/50 text-indigo-600' 
                                                        : 'hover:bg-gray-50 text-slate-600'}
                                                ${dayInfo.isHoliday && !isSelected ? 'text-rose-400' : ''}
                                            `}
                                        >
                                            <span className="text-xs font-bold z-10">{format(date, 'd')}</span>
                                            
                                            {/* Holiday Dot */}
                                            {dayInfo.isHoliday && (
                                                <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-300'}`}></div>
                                            )}

                                            {/* Tooltip for Holiday */}
                                            {dayInfo.label && isCurrentMonth && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 hidden group-hover:block z-[110]">
                                                    <div className="bg-slate-800 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">
                                                        {dayInfo.label}
                                                    </div>
                                                    <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-rose-300"></div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">วันหยุด / เสาร์-อาทิตย์</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">วันที่เลือก</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GTDateScheduler;

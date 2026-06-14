import React, { useRef, useEffect } from 'react';
import { format, isToday as isDateToday } from 'date-fns';
import { Task, Channel, MasterOption } from '../../../types';
import { ScheduleColumn } from './ScheduleColumn';
import { UnscheduledDayTray } from './UnscheduledDayTray';

const HOUR_HEIGHT = 80;

interface DesktopWeeklyScheduleViewProps {
    days: Date[];
    getSortedTasksForDay: (day: Date) => Task[];
    onSelectDate: (date: Date, type?: any) => void;
    viewMode: 'CONTENT' | 'TASK';
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
    isLandscape?: boolean;
    onDayClick?: (day: Date, dayTasks: Task[]) => void;
}

export const DesktopWeeklyScheduleView: React.FC<DesktopWeeklyScheduleViewProps> = ({
    days,
    getSortedTasksForDay,
    onSelectDate,
    viewMode,
    channels,
    masterOptions,
    onTaskClick,
    isLandscape = false,
    onDayClick
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll the view to standard active hours (e.g. 07:00 / 7 AM) on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            const startHourPosition = 7 * HOUR_HEIGHT; // scroll down to 7:00
            scrollContainerRef.current.scrollTop = startHourPosition;
        }
    }, []);

    // Hours list to render left time ruler
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className={`${isLandscape ? 'flex' : 'hidden lg:flex'} flex-col h-full overflow-hidden bg-white rounded-[2.5rem] relative`}>
            
            {/* sticky week header row */}
            <div 
                ref={headerScrollRef}
                className="flex bg-white border-b border-gray-100 z-30 shrink-0 select-none overflow-x-hidden scrollbar-hide"
            >
                {/* To ensure it matches the min-w-max structure of the grid below */}
                <div className="flex flex-col min-w-max w-full">
                    {/* Header Columns */}
                    <div className="flex">
                        {/* corner placeholder to align with Time Ruler */}
                        <div className="w-16 md:w-20 border-r border-gray-100 bg-white sticky left-0 z-40 shrink-0" />
                        
                        {/* day columns headers */}
                        {days.map((day) => {
                            const isToday = isDateToday(day);
                            return (
                                <button 
                                    key={day.toString()} 
                                    onClick={() => onDayClick?.(day, getSortedTasksForDay(day))}
                                    className="flex-1 min-w-[200px] md:min-w-[240px] xl:min-w-[280px] p-3 md:p-4 text-center border-r border-gray-50 last:border-r-0 cursor-pointer hover:bg-indigo-50/20 active:scale-95 transition-all group/hdr focus:outline-none"
                                    title="คลิกเพื่อเปิดบอร์ดรายงานช่องงานของวันนี้"
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest block transition-colors duration-200 ${isToday ? 'text-indigo-600 animate-pulse' : 'text-slate-400 group-hover/hdr:text-indigo-500'}`}>
                                        {format(day, 'EEE')}
                                    </span>
                                    <div className={`mt-1 text-2xl font-black flex items-center justify-center gap-1.5 transition-all duration-200 group-hover/hdr:scale-105 ${isToday ? 'text-indigo-600' : 'text-slate-700 group-hover/hdr:text-indigo-600'}`}>
                                        {format(day, 'd')}
                                        {isToday && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Unscheduled Tray Row */}
                    <div className="flex border-t border-gray-100 bg-slate-50/10">
                        {/* Side Label to match Time Ruler width */}
                        <button
                            onClick={() => {
                                // Dropdown lists of unscheduled tasks or simple label click action
                            }}
                            className="w-16 md:w-20 bg-white border-r border-gray-100 sticky left-0 z-40 shrink-0 flex flex-col items-center justify-center gap-1.5 p-2 select-none border-b"
                        >
                            <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase leading-none text-center">
                                งานที่ยัง
                            </span>
                            <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase leading-none text-center">
                                ไม่มีเวลา
                            </span>
                        </button>

                        {/* Unscheduled trays for each day */}
                        {days.map((day, idx) => {
                            const dayTasks = getSortedTasksForDay(day);
                            const unscheduled = dayTasks.filter(t => !t.shootTimeStart && !t.scheduledTime);
                            return (
                                <UnscheduledDayTray
                                    key={`unscheduled-${day.toString()}`}
                                    day={day}
                                    tasks={unscheduled}
                                    channels={channels}
                                    masterOptions={masterOptions}
                                    onTaskClick={onTaskClick}
                                    tooltipAlign={idx >= 4 ? 'left' : 'right'}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scrollable hour grid area */}
            <div 
                ref={scrollContainerRef}
                onScroll={(e) => {
                    if (headerScrollRef.current) {
                        headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                    }
                }}
                className="flex-1 overflow-auto scrollbar-hide border-b border-gray-100 bg-slate-50/20 min-h-0"
            >
                <div className="flex w-full min-w-max relative">
                    {/* Sticky Left-Hand Hour Ruler */}
                    <div className="w-16 md:w-20 bg-white/90 backdrop-blur-sm border-r border-gray-100 sticky left-0 z-20 shrink-0 select-none">
                        {hours.map((h) => {
                            const formattedHour = `${String(h).padStart(2, '0')}:00`;
                            return (
                                <div 
                                    key={h} 
                                    className="text-[11px] font-black text-slate-400 text-center flex items-start justify-center pt-2 relative border-t border-transparent"
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                >
                                    {formattedHour}
                                </div>
                            );
                        })}
                    </div>

                    {/* Day Content Canvas Columns */}
                    <div className="flex flex-1 divide-x divide-gray-100 relative">
                        {days.map((day, idx) => (
                            <ScheduleColumn
                                key={day.toString()}
                                day={day}
                                tasks={getSortedTasksForDay(day)}
                                onSelectDate={onSelectDate}
                                viewMode={viewMode}
                                channels={channels}
                                masterOptions={masterOptions}
                                onTaskClick={onTaskClick}
                                hourHeight={HOUR_HEIGHT}
                                tooltipAlign={idx >= 4 ? 'left' : 'right'}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

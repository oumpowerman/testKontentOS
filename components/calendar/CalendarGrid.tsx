
import React from 'react';
import { eachDayOfInterval, isSameDay } from 'date-fns';
import { Task, ChipConfig, CalendarHighlight, MasterOption, Channel } from '../../types';
import CalendarDayCell from './CalendarDayCell';
import { TaskDisplayMode } from '../CalendarView';

interface CalendarGridProps {
    startDate: Date;
    endDate: Date;
    currentDate: Date;
    isExpanded: boolean;
    dragOverDate: Date | null;
    viewMode: 'CONTENT' | 'TASK';
    taskDisplayMode: TaskDisplayMode; // Added
    activeChipIds: string[];
    customChips: ChipConfig[];
    
    // New Props for Highlights
    highlights: CalendarHighlight[];
    masterOptions: MasterOption[];
    channels: Channel[];
    
    // Functions passed down
    getTasksForDay: (day: Date) => Task[];
    filterTasks: (tasks: Task[]) => Task[];
    
    // Event Handlers
    onDayClick: (day: Date, tasks: Task[]) => void;
    onDayContextMenu: (day: Date) => void;
    onDragOver: (e: React.DragEvent, day: Date) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, day: Date) => void;
    onTaskDragStart: (e: React.DragEvent, taskId: string) => void;
    onTaskClick: (task: Task) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
    startDate,
    endDate,
    currentDate,
    isExpanded,
    dragOverDate,
    viewMode,
    taskDisplayMode,
    activeChipIds,
    customChips,
    highlights,
    masterOptions,
    channels,
    getTasksForDay,
    filterTasks,
    onDayClick,
    onDayContextMenu,
    onDragOver,
    onDragLeave,
    onDrop,
    onTaskDragStart,
    onTaskClick
}) => {
    const gridDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    return (
        <div 
            key="calendar-view"
            className={`
                bg-white rounded-[1.5rem] shadow-sm border border-gray-200 
                ${isExpanded ? 'min-h-[85vh] shadow-2xl border-gray-300' : 'ring-4 ring-gray-50/50'} 
                animate-slide-in-left
            `}
        >
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
                {weekDays.map((day, index) => (
                    <div key={day} className={`py-3 text-center font-black uppercase tracking-widest ${isExpanded ? 'text-sm py-4' : 'text-[10px] md:text-xs'} ${index === 0 || index === 6 ? 'text-red-400 bg-red-50/30' : 'text-gray-400 bg-gray-50/50'}`}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className={`
                grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-200 
                ${isExpanded ? 'auto-rows-[minmax(140px,1fr)] md:auto-rows-[minmax(180px,1fr)]' : 'auto-rows-[minmax(70px,1fr)] lg:auto-rows-[minmax(120px,1fr)]'}
            `}>
                {gridDays.map((day) => {
                    const dayTasks = getTasksForDay(day);
                    const filteredDayTasks = filterTasks(dayTasks);
                    const dayHighlight = highlights.find(h => isSameDay(h.date, day));

                    return (
                        <CalendarDayCell 
                            key={day.toString()}
                            day={day}
                            currentDate={currentDate}
                            tasks={filteredDayTasks}
                            isExpanded={isExpanded}
                            dragOverDate={dragOverDate}
                            viewMode={viewMode}
                            taskDisplayMode={taskDisplayMode}
                            activeChipIds={activeChipIds}
                            customChips={customChips}
                            highlight={dayHighlight}
                            masterOptions={masterOptions}
                            channels={channels}
                            onDayClick={onDayClick}
                            onContextMenu={onDayContextMenu}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onTaskDragStart={onTaskDragStart}
                            onTaskClick={onTaskClick}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarGrid;

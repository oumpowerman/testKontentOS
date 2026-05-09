
import React, { memo } from 'react';
import { format, isSameMonth, isToday, isSameDay, isSameWeek } from 'date-fns';
import { Task, ChipConfig, CalendarHighlight, MasterOption, Channel } from '../../types';
import CalendarTaskPill from './CalendarTaskPill';
import { TaskDisplayMode } from '../CalendarView';

interface CalendarDayCellProps {
    day: Date;
    currentDate: Date;
    tasks: Task[];
    isExpanded: boolean;
    dragOverDate: Date | null;
    viewMode: 'CONTENT' | 'TASK';
    taskDisplayMode: TaskDisplayMode;
    activeChipIds: string[];
    customChips: ChipConfig[];
    
    // Highlights
    highlight?: CalendarHighlight;
    masterOptions?: MasterOption[];
    channels: Channel[];
    
    onDayClick: (day: Date, tasks: Task[]) => void;
    onContextMenu: (day: Date) => void;
    onDragOver: (e: React.DragEvent, day: Date) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, day: Date) => void;
    onTaskDragStart: (e: React.DragEvent, taskId: string) => void;
    onTaskClick: (task: Task) => void;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
    day,
    currentDate,
    tasks,
    isExpanded,
    dragOverDate,
    viewMode,
    taskDisplayMode,
    activeChipIds,
    customChips,
    highlight,
    masterOptions,
    channels,
    onDayClick,
    onContextMenu,
    onDragOver,
    onDragLeave,
    onDrop,
    onTaskDragStart,
    onTaskClick
}) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isTodayDate = isToday(day);
    const isDragOver = dragOverDate && isSameDay(day, dragOverDate);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6; // Sunday or Saturday

    const maxVisible = isExpanded ? 8 : 3;
    const count = tasks.length;
    
    const containerSpacing = isExpanded ? 'space-y-1.5' : 'space-y-1';
    const containerPadding = isExpanded ? 'px-1.5' : 'px-1';

    // Resolve Highlight Color
    let highlightStyle = '';
    let highlightLabel = '';
    if (highlight && masterOptions) {
        const typeOption = masterOptions.find(o => o.type === 'EVENT_TYPE' && o.key === highlight.typeKey);
        if (typeOption) {
            // Use background color from master data, ensure it's not too dark for text
            const baseColor = typeOption.color || 'bg-gray-100 border-gray-200';
            highlightStyle = baseColor.replace('text-', 'text-opacity-80 text-'); // Tweak text opacity
            highlightLabel = typeOption.label;
        }
    }

    // Dynamic classes based on state
    // Added: Weekend Grey Background logic
    const bgClass = isDragOver 
        ? 'bg-indigo-100 ring-inset ring-2 ring-indigo-400 scale-[0.98] rounded-lg z-10 shadow-lg' 
        : highlightStyle 
            ? `${highlightStyle} bg-opacity-30 border-opacity-40` // Applied Highlight
            : isTodayDate 
                ? 'bg-indigo-50/20 shadow-inner' // Today
                : !isCurrentMonth 
                    ? 'bg-gray-50/80 text-gray-300' // Out of Month
                    : isWeekend
                        ? 'bg-slate-50/60 hover:bg-white' // Weekend (Greyish)
                        : 'bg-white hover:bg-indigo-50/10'; // Default (Weekday)

    // Dynamic Text Coloring (Time-Travel Theme)
    const now = new Date();
    let dayTextClass = '';
    
    if (isTodayDate) {
        dayTextClass = 'text-white bg-indigo-600 shadow-md shadow-indigo-200';
    } else if (isSameWeek(day, now)) {
        // Active Week: Bright Green
        dayTextClass = 'text-emerald-500 font-bold drop-shadow-sm'; 
    } else if (day < now) {
        // Past Weeks: Greyish
        // Note: isSameWeek catches the current week, so day < now covers strictly past weeks here
        dayTextClass = 'text-slate-400 font-medium'; 
    } else {
        // Future Weeks: Pastel Pink/Red
        dayTextClass = 'text-rose-400 font-bold'; 
    }

    return (
        <div 
            onClick={() => onDayClick(day, tasks)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(day); }}
            onDragOver={(e) => onDragOver(e, day)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, day)}
            className={`
                relative flex flex-col group transition-all cursor-pointer select-none hover:z-30
                ${isExpanded ? 'p-1.5 md:p-3' : 'p-1 md:p-2'}
                ${bgClass}
            `}
        >
            <div className={`flex justify-center md:justify-between items-start mb-1 pointer-events-none relative z-10 ${isExpanded ? 'justify-between w-full' : ''}`}>
                <span className={`
                    flex items-center justify-center transition-all
                    ${isExpanded 
                        ? 'text-lg w-8 h-8 rounded-xl' 
                        : 'text-[10px] md:text-sm w-5 h-5 md:w-6 md:h-6 rounded-full md:rounded-lg'
                    }
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${dayTextClass}
                `}>
                    {format(day, 'd')}
                </span>
                
                {isExpanded && count > 0 && (
                    <span className="hidden md:inline-block text-xs font-bold text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        {count}
                    </span>
                )}

                {/* Mobile Highlight Dot */}
                {highlight && !isExpanded && (
                    <div className={`md:hidden absolute top-0 right-0 w-2 h-2 rounded-full ${highlightStyle.split(' ')[0].replace('/30','')}`} />
                )}
            </div>
            
            {/* Highlight Label (Desktop/Expanded) */}
            {highlightLabel && (
                <div className="hidden md:block text-[9px] font-bold opacity-60 truncate mb-1 px-1">
                    {highlightLabel}
                </div>
            )}

            <div className="flex-1 flex flex-col justify-start w-full">
                <div className={`${isExpanded ? 'flex' : 'hidden md:flex'} flex-col items-center mt-1 w-full ${containerPadding} ${containerSpacing} h-full`}>
                    {count > 0 && tasks.slice(0, maxVisible).map((task, index) => (
                        <CalendarTaskPill 
                            key={`${task.id}-${viewMode}`}
                            task={task}
                            index={index}
                            viewMode={viewMode}
                            displayMode={taskDisplayMode}
                            isExpanded={isExpanded}
                            activeChipIds={activeChipIds}
                            customChips={customChips}
                            masterOptions={masterOptions}
                            channels={channels}
                            onDragStart={onTaskDragStart}
                            onClick={onTaskClick}
                        />
                    ))}
                    
                    {tasks.length > maxVisible && (
                        <span 
                            className={`
                                ${isExpanded ? 'text-xs mt-1' : 'text-[9px]'} 
                                text-gray-400 font-bold animate-spring text-center block
                            `}
                            style={{ animationDelay: `${maxVisible * 50}ms`, animationFillMode: 'both' }}
                        >
                            +{tasks.length - maxVisible} more
                        </span>
                    )}
                </div>

                {!isExpanded && (
                    <div className="flex md:hidden flex-wrap content-end justify-center gap-1 p-1 w-full h-full pb-2">
                        {tasks.slice(0, 5).map((task, index) => (
                            <CalendarTaskPill 
                                key={`${task.id}-dot`}
                                task={task}
                                index={index}
                                viewMode={viewMode}
                                displayMode={taskDisplayMode}
                                isExpanded={false}
                                activeChipIds={activeChipIds}
                                customChips={customChips}
                                masterOptions={masterOptions}
                                channels={channels}
                                onDragStart={onTaskDragStart}
                                onClick={onTaskClick}
                            />
                        ))}
                        {tasks.length > 5 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex items-center justify-center text-[5px]">
                                +
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(CalendarDayCell);

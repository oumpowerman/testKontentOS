import React, { useMemo } from 'react';
import { format, isToday as isDateToday } from 'date-fns';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { Task, Channel, MasterOption } from '../../../types';
import { SortableTaskCard } from './SortableTaskCard';

export interface ScheduleColumnProps {
    day: Date;
    tasks: Task[];
    onSelectDate: (date: Date, type?: any) => void;
    viewMode: 'CONTENT' | 'TASK';
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
    hourHeight: number;
    tooltipAlign?: 'left' | 'right';
}

interface HourSlotProps {
    columnId: string;
    hour: number;
    hourHeight: number;
}

const HourSlot: React.FC<HourSlotProps> = ({ columnId, hour, hourHeight }) => {
    const slotId = `${columnId}_${String(hour).padStart(2, '0')}`;
    const { setNodeRef, isOver } = useDroppable({
        id: slotId,
    });

    return (
        <div 
            ref={setNodeRef}
            className={`absolute left-0 right-0 border-t border-slate-100 transition-colors duration-200 flex items-start px-2 py-1 select-none group/slot ${isOver ? 'bg-indigo-50/70 z-20 border-indigo-300' : 'hover:bg-slate-50/40'}`}
            style={{ 
                top: `${hour * hourHeight}px`, 
                height: `${hourHeight}px` 
            }}
        >
            {/* Subtle hour tracker hint */}
            <span className={`text-[9px] font-black tracking-wider transition-opacity duration-200 ${isOver ? 'text-indigo-600 opacity-100' : 'text-slate-300 opacity-0 group-hover/slot:opacity-100'}`}>
                {String(hour).padStart(2, '0')}:00
            </span>
        </div>
    );
};

export const ScheduleColumn: React.FC<ScheduleColumnProps> = ({
    day,
    tasks,
    onSelectDate,
    viewMode,
    channels,
    masterOptions,
    onTaskClick,
    hourHeight,
    tooltipAlign = 'right'
}) => {
    const isToday = isDateToday(day);
    const columnId = format(day, 'yyyy-MM-dd');
    
    // Wire up column droppable for generic drops
    const { setNodeRef: setColumnRef, isOver: isColumnOver } = useDroppable({
        id: columnId,
    });

    // Keep only scheduled tasks for positioning
    const scheduledTasks = useMemo(() => {
        return tasks.filter(t => t.shootTimeStart || t.scheduledTime);
    }, [tasks]);

    // Parse 'HH:mm' string to hours and minutes for positioned tasks
    const parseTime = (timeStr?: string): { hours: number; minutes: number } => {
        if (!timeStr) return { hours: 9, minutes: 0 };
        const parts = timeStr.trim().split(':');
        if (parts.length < 2) return { hours: 9, minutes: 0 };
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return { hours: 9, minutes: 0 };
        return { hours: h, minutes: m };
    };

    // Prepare positions and sizing for scheduled tasks
    const positionedTasks = useMemo(() => {
        return scheduledTasks.map(t => {
            const start = t.shootTimeStart ? parseTime(t.shootTimeStart) : parseTime(t.scheduledTime);
            const end = t.shootTimeEnd ? parseTime(t.shootTimeEnd) : { hours: start.hours + 1, minutes: start.minutes };

            let startMin = start.hours * 60 + start.minutes;
            let endMin = end.hours * 60 + end.minutes;

            if (endMin <= startMin) {
                endMin = startMin + 60; // minimum block duration
            }

            const top = (startMin / 60) * hourHeight;
            const height = Math.max(((endMin - startMin) / 60) * hourHeight, 45); // ensure card is readable (at least 45px)

            return {
                task: t,
                top,
                height,
                startTimeMinutes: startMin,
                endTimeMinutes: endMin,
            };
        });
    }, [scheduledTasks, hourHeight]);

    // Perform Conflict / Overlap Resolution Algorithm for rendering overlapping lanes
    const layoutTasks = useMemo(() => {
        // Sort items by start time & longest duration first
        const sorted = [...positionedTasks].sort((a, b) => {
            if (a.startTimeMinutes !== b.startTimeMinutes) {
                return a.startTimeMinutes - b.startTimeMinutes;
            }
            return (b.endTimeMinutes - b.startTimeMinutes) - (a.endTimeMinutes - a.startTimeMinutes);
        });

        const groups: (typeof positionedTasks)[] = [];
        
        // Group overlapping tasks
        for (const pt of sorted) {
            let placed = false;
            for (const group of groups) {
                const hasOverlap = group.some(item => 
                    pt.startTimeMinutes < item.endTimeMinutes && pt.endTimeMinutes > item.startTimeMinutes
                );
                if (hasOverlap) {
                    group.push(pt);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                groups.push([pt]);
            }
        }

        // Assign columns / lanes in each overlap group
        const renderingSpecs = [];
        for (const group of groups) {
            const lanes: { endTime: number }[] = [];
            
            // Sort tasks within group by start time
            const groupSorted = [...group].sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
            const taskLaneMap = new Map<string, number>();

            for (const pt of groupSorted) {
                let laneIndex = -1;
                for (let i = 0; i < lanes.length; i++) {
                    if (pt.startTimeMinutes >= lanes[i].endTime) {
                        laneIndex = i;
                        lanes[i].endTime = pt.endTimeMinutes;
                        break;
                    }
                }
                if (laneIndex === -1) {
                    laneIndex = lanes.length;
                    lanes.push({ endTime: pt.endTimeMinutes });
                }
                taskLaneMap.set(pt.task.id, laneIndex);
            }

            const totalLanes = lanes.length;
            for (const pt of group) {
                const lane = taskLaneMap.get(pt.task.id) || 0;
                renderingSpecs.push({
                    ...pt,
                    widthPercent: 100 / totalLanes,
                    leftPercent: lane * (100 / totalLanes),
                });
            }
        }

        return renderingSpecs;
    }, [positionedTasks]);

    // Current time cursor (only for today)
    const currentTimeMarkerY = useMemo(() => {
        if (!isToday) return null;
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        return (mins / 60) * hourHeight;
    }, [isToday, hourHeight]);

    return (
        <div 
            ref={setColumnRef}
            className={`flex-1 min-w-[200px] md:min-w-[240px] xl:min-w-[280px] relative transition-all duration-300 flex flex-col ${isToday ? 'bg-indigo-50/10' : ''} ${isColumnOver ? 'bg-indigo-100/10' : ''}`}
        >
            {/* Hourly Canvas (strictly non-sticky, scrolls with hours) */}
            <div className="relative flex-1" style={{ height: `${24 * hourHeight}px` }}>
                {/* Render HourSlot dropzones for each of the 24 hours */}
                {Array.from({ length: 24 }).map((_, h) => (
                    <HourSlot 
                        key={h} 
                        columnId={columnId} 
                        hour={h} 
                        hourHeight={hourHeight} 
                    />
                ))}

                {/* Overdrag glow */}
                {isColumnOver && (
                    <div className="absolute inset-x-2 rounded-2xl bg-indigo-500/5 ring-2 ring-indigo-300 ring-inset pointer-events-none z-10 animate-pulse" style={{ top: '4px', bottom: '4px' }} />
                )}

                {/* Current Time Line Tracker */}
                {currentTimeMarkerY !== null && (
                    <div 
                        className="absolute left-0 right-0 flex items-center pointer-events-none z-30" 
                        style={{ top: `${currentTimeMarkerY}px` }}
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm -ml-1.5" />
                        <div className="h-[2px] flex-1 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    </div>
                )}

                {/* Hover to Add Task Marker */}
                <div className="absolute inset-0 group/col pointer-events-none">
                    <button
                        onClick={() => onSelectDate(day, viewMode)}
                        className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all pointer-events-auto opacity-0 group-hover/col:opacity-100 z-35"
                        title="สร้างงานบอร์ดนี้"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Task Card Canvas */}
                <div className="absolute inset-0 pointer-events-auto">
                    {layoutTasks.map((item) => (
                        <div
                            key={item.task.id}
                            className="absolute p-1 transition-all duration-150 hover:z-[45]"
                            style={{
                                top: `${item.top}px`,
                                height: `${item.height}px`,
                                width: `${item.widthPercent}%`,
                                left: `${item.leftPercent}%`,
                                zIndex: 30, // underneath modal tooltips (which are 99999) but above background lines
                            }}
                        >
                            <SortableTaskCard 
                                task={item.task}
                                channels={channels}
                                masterOptions={masterOptions}
                                onTaskClick={onTaskClick}
                                style={{ height: '100%', overflow: 'visible' }}
                                isCompact={true}
                                cardHeight={item.height}
                                tooltipAlign={tooltipAlign}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


import React, { useState, useEffect } from 'react';
import { isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, setHours, setMinutes, format } from 'date-fns';
import { Task, Channel, MasterOption } from '../../types';
import { TaskDisplayMode } from '../CalendarView';
import { MobileWeeklyView } from './weekly/MobileWeeklyView';
import { DesktopWeeklyView } from './weekly/DesktopWeeklyView';
import { DesktopWeeklyScheduleView } from './weekly/DesktopWeeklyScheduleView';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter, DragOverlay, DragStartEvent, defaultDropAnimationSideEffects, pointerWithin } from '@dnd-kit/core';
import { restrictToWindowEdges, snapCenterToCursor } from '@dnd-kit/modifiers';
import { WeeklyTaskCard } from './weekly/WeeklyTaskCard';

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
    allTasks: Task[];
    onMoveTask: (task: Task) => void;
    onDayClick?: (day: Date, dayTasks: Task[]) => void;
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
    isLandscape = false,
    allTasks,
    onMoveTask,
    onDayClick
}) => {
    const [selectedDay, setSelectedDay] = useState<Date>(currentDate);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [weeklyLayout, setWeeklyLayout] = useState<'LIST' | 'SCHEDULE'>(() => {
        return (localStorage.getItem('weeklyLayout') || 'LIST') as 'LIST' | 'SCHEDULE';
    });

    const handleLayoutToggle = (layout: 'LIST' | 'SCHEDULE') => {
        setWeeklyLayout(layout);
        localStorage.setItem('weeklyLayout', layout);
    };
    
    // Setup DnD sensors: Mouse on desktop (requires movement to prevent blocking clicks), Touch on mobile (requires long press to prevent blocking scroll)
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    useEffect(() => {
        // Sync selectedDay with currentDate when week changes from header
        setSelectedDay(currentDate);
    }, [currentDate]);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Ensure selectedDay is valid for the current week slice
    const visibleSelectedDay = days.find(d => isSameDay(d, selectedDay)) || days[0];

    const getTasksCountForDay = (day: Date) => {
        return filterTasks(getTasksForDay(day)).length;
    };

    // Helper to sort tasks by time
    const getSortedTasksForDay = (day: Date) => {
        const tasks = filterTasks(getTasksForDay(day));
        return [...tasks].sort((a, b) => {
            const timeA = a.scheduledTime || '23:59';
            const timeB = b.scheduledTime || '23:59';
            return timeA.localeCompare(timeB);
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveTaskId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTaskId(null);
        
        if (over && active.id !== over.id) {
            const taskId = active.id as string;
            const dropId = over.id as string; // Format: yyyy-MM-dd or yyyy-MM-dd_HH or yyyy-MM-dd_unscheduled
            
            const task = allTasks.find(t => t.id === taskId);
            if (!task) return;

            let targetDateStr = dropId;
            let hourValue = 9;
            let minuteValue = 0;
            let isHourlyDrop = false;
            let isClearTimeDrop = false;

            // Resolve target task if dropped onto another task instead of raw column/slot
            const targetTask = allTasks.find(t => t.id === dropId);
            if (targetTask) {
                const targetDateObj = targetTask.startDate ? new Date(targetTask.startDate) : new Date();
                targetDateStr = format(targetDateObj, 'yyyy-MM-dd');
                
                if (targetTask.scheduledTime) {
                    const [h, m] = targetTask.scheduledTime.split(':').map(Number);
                    if (!isNaN(h)) {
                        hourValue = h;
                        minuteValue = isNaN(m) ? 0 : m;
                    }
                } else if (targetTask.shootTimeStart) {
                    const [h, m] = targetTask.shootTimeStart.split(':').map(Number);
                    if (!isNaN(h)) {
                        hourValue = h;
                        minuteValue = isNaN(m) ? 0 : m;
                    }
                } else {
                    isClearTimeDrop = true;
                }
            } else if (dropId.includes('_')) {
                const parts = dropId.split('_');
                targetDateStr = parts[0];
                if (parts[1] === 'unscheduled') {
                    isClearTimeDrop = true;
                } else {
                    hourValue = parseInt(parts[1], 10);
                    isHourlyDrop = true;
                }
            } else if (task.scheduledTime) {
                const [h, m] = task.scheduledTime.split(':').map(Number);
                if (!isNaN(h)) {
                    hourValue = h;
                    minuteValue = isNaN(m) ? 0 : m;
                }
            }

            const targetDate = parseISO(targetDateStr);
            const newDate = setMinutes(setHours(targetDate, hourValue), minuteValue);

            // Update task with new date and potentially new times
            const updatedTask: Task = {
                ...task,
                startDate: newDate,
                endDate: newDate,
                shootDate: newDate, // Keep shootDate synced for content
            };

            if (isHourlyDrop) {
                const hhStr = String(hourValue).padStart(2, '0');
                const nextHhStr = String((hourValue + 1) % 24).padStart(2, '0');
                
                updatedTask.scheduledTime = `${hhStr}:00`;
                updatedTask.shootTimeStart = `${hhStr}:00`;
                updatedTask.shootTimeEnd = `${nextHhStr}:00`;
            } else if (isClearTimeDrop) {
                // Clear any scheduled times on this task
                updatedTask.scheduledTime = '';
                updatedTask.shootTimeStart = '';
                updatedTask.shootTimeEnd = '';
            }

            onMoveTask(updatedTask);
        }
    };

    const activeTask = activeTaskId ? allTasks.find(t => t.id === activeTaskId) : null;

    const dropAnimationConfig = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.4',
                },
            },
        }),
    };

    return (
        <div className="flex flex-col h-full lg:bg-white/40 lg:backdrop-blur-md lg:rounded-[2.5rem] lg:border lg:border-white/60 lg:shadow-xl overflow-hidden">
            {/* Top Toolbar Selector for Desktop Weekly Layout Modes */}
            <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/50 select-none shrink-0 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest font-sans">โหมดการแสดงผลสัปดาห์</span>
                </div>
                <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl gap-1 border border-slate-200/50">
                    <button
                        onClick={() => handleLayoutToggle('LIST')}
                        className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${weeklyLayout === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        รายการการ์ด
                    </button>
                    <button
                        onClick={() => handleLayoutToggle('SCHEDULE')}
                        className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${weeklyLayout === 'SCHEDULE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        ตารางเวลา 24 ช.ม.
                    </button>
                </div>
            </div>

            <DndContext 
                sensors={sensors}
                collisionDetection={pointerWithin}
                modifiers={[restrictToWindowEdges, snapCenterToCursor]}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <MobileWeeklyView 
                    days={days}
                    selectedDay={visibleSelectedDay}
                    setSelectedDay={setSelectedDay}
                    tasksForSelectedDay={getSortedTasksForDay(visibleSelectedDay)}
                    getTasksCountForDay={getTasksCountForDay}
                    onSelectDate={onSelectDate}
                    viewMode={viewMode}
                    channels={channels}
                    masterOptions={masterOptions}
                    onTaskClick={onTaskClick}
                    isLandscape={isLandscape}
                    onDayClick={onDayClick}
                />

                {weeklyLayout === 'LIST' ? (
                    <DesktopWeeklyView 
                        days={days}
                        getSortedTasksForDay={getSortedTasksForDay}
                        onSelectDate={onSelectDate}
                        viewMode={viewMode}
                        channels={channels}
                        masterOptions={masterOptions}
                        onTaskClick={onTaskClick}
                        isLandscape={isLandscape}
                        onDayClick={onDayClick}
                    />
                ) : (
                    <DesktopWeeklyScheduleView
                        days={days}
                        getSortedTasksForDay={getSortedTasksForDay}
                        onSelectDate={onSelectDate}
                        viewMode={viewMode}
                        channels={channels}
                        masterOptions={masterOptions}
                        onTaskClick={onTaskClick}
                        isLandscape={isLandscape}
                        onDayClick={onDayClick}
                    />
                )}

                <DragOverlay 
                    adjustScale={false} 
                    dropAnimation={dropAnimationConfig}
                >
                    {activeTask ? (
                        <div className="w-[280px] pointer-events-none origin-center">
                            <WeeklyTaskCard 
                                task={activeTask}
                                channels={channels}
                                masterOptions={masterOptions}
                                onTaskClick={() => {}}
                                isDragging={true}
                                isOverlay={true}
                                isCompact={weeklyLayout === 'SCHEDULE' && !!(activeTask.scheduledTime || activeTask.shootTimeStart)}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default WeeklyView;


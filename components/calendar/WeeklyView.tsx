
import React, { useState, useEffect } from 'react';
import { isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, setHours, setMinutes } from 'date-fns';
import { Task, Channel, MasterOption } from '../../types';
import { TaskDisplayMode } from '../CalendarView';
import { MobileWeeklyView } from './weekly/MobileWeeklyView';
import { DesktopWeeklyView } from './weekly/DesktopWeeklyView';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay, DragStartEvent, defaultDropAnimationSideEffects } from '@dnd-kit/core';
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
    onMoveTask
}) => {
    const [selectedDay, setSelectedDay] = useState<Date>(currentDate);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    
    // Setup DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
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
            const targetDateStr = over.id as string; // Format: yyyy-MM-dd
            
            const task = allTasks.find(t => t.id === taskId);
            if (!task) return;

            const targetDate = parseISO(targetDateStr);
            
            // Link existing time if available
            const scheduledTime = task.scheduledTime || "09:00";
            const [hours, minutes] = scheduledTime.split(':').map(Number);
            
            const newDate = setMinutes(setHours(targetDate, hours), minutes);

            // Update task with new date
            const updatedTask: Task = {
                ...task,
                startDate: newDate,
                endDate: newDate,
                shootDate: newDate, // Keep shootDate synced for content
            };

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
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
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
                />

                <DesktopWeeklyView 
                    days={days}
                    getSortedTasksForDay={getSortedTasksForDay}
                    onSelectDate={onSelectDate}
                    viewMode={viewMode}
                    channels={channels}
                    masterOptions={masterOptions}
                    onTaskClick={onTaskClick}
                    isLandscape={isLandscape}
                />

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
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default WeeklyView;


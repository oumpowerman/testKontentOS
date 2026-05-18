
import React from 'react';
import { format, isToday as isDateToday } from 'date-fns';
import { Plus, Clock } from 'lucide-react';
import { Task, Channel, MasterOption } from '../../../types';
import { WeeklyTaskCard } from './WeeklyTaskCard';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTaskCardProps {
    task: Task;
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.task.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <WeeklyTaskCard
            {...props}
            attributes={attributes}
            listeners={listeners}
            setNodeRef={setNodeRef}
            style={style}
            isDragging={isDragging}
        />
    );
};

interface WeeklyColumnProps {
    day: Date;
    tasks: Task[];
    onSelectDate: (date: Date, type?: any) => void;
    viewMode: 'CONTENT' | 'TASK';
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
}

const WeeklyColumn: React.FC<WeeklyColumnProps> = ({
    day,
    tasks,
    onSelectDate,
    viewMode,
    channels,
    masterOptions,
    onTaskClick
}) => {
    const isToday = isDateToday(day);
    const columnId = format(day, 'yyyy-MM-dd');
    const { setNodeRef, isOver } = useDroppable({
        id: columnId,
    });

    return (
        <div 
            ref={setNodeRef}
            className={`w-[280px] p-4 flex flex-col gap-4 group transition-all relative duration-300 ${isToday ? 'bg-indigo-50/40' : 'hover:bg-white/60'} ${isOver ? 'bg-indigo-100/50 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] ring-2 ring-indigo-300 ring-inset' : ''}`}
        >
            {/* Column Header Highlight when dragging over */}
            {isOver && (
                <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none rounded-3xl animate-pulse" />
            )}

            {/* Actions */}
            <button 
                onClick={() => onSelectDate(day, viewMode)}
                className="w-full py-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-all opacity-0 group-hover:opacity-100 mb-2 shadow-sm relative z-10"
            >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">เพิ่มงาน</span>
            </button>

            {/* Task List */}
            <div className="flex flex-col gap-3 relative z-10">
                {tasks.length === 0 ? (
                    <div className={`py-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all ${isOver ? 'border-indigo-300 bg-white/50' : 'border-slate-100 text-slate-300 opacity-20'}`}>
                        <div className={`p-3 rounded-full mb-2 ${isOver ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-50'}`}>
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isOver ? 'วางที่นี่' : 'ว่างเปล่า'}
                        </span>
                    </div>
                ) : (
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <SortableTaskCard 
                                key={task.id}
                                task={task}
                                channels={channels}
                                masterOptions={masterOptions}
                                onTaskClick={onTaskClick}
                            />
                        ))}
                    </SortableContext>
                )}
            </div>
        </div>
    );
};

interface DesktopWeeklyViewProps {
    days: Date[];
    getSortedTasksForDay: (day: Date) => Task[];
    onSelectDate: (date: Date, type?: any) => void;
    viewMode: 'CONTENT' | 'TASK';
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
    isLandscape?: boolean;
}

export const DesktopWeeklyView: React.FC<DesktopWeeklyViewProps> = ({
    days,
    getSortedTasksForDay,
    onSelectDate,
    viewMode,
    channels,
    masterOptions,
    onTaskClick,
    isLandscape = false
}) => {
    return (
        <div className={`${isLandscape ? 'flex' : 'hidden lg:flex'} flex-col h-full overflow-hidden`}>
            {/* Horizontal & Vertical Scroll Container */}
            <div className="flex-1 overflow-auto scrollbar-hide">
                <div className="min-w-max flex flex-col min-h-full">
                    {/* Week Header - Sticky horizontally within the parent and vertically at the top */}
                    <div className="flex bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
                        {days.map((day) => {
                            const isToday = isDateToday(day);
                            return (
                                <div key={day.toString()} className="w-[280px] p-4 text-center border-r border-gray-50 last:border-r-0">
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
                    <div className="flex flex-1 divide-x divide-gray-100 bg-white/20">
                        {days.map((day) => (
                            <WeeklyColumn
                                key={day.toString()}
                                day={day}
                                tasks={getSortedTasksForDay(day)}
                                onSelectDate={onSelectDate}
                                viewMode={viewMode}
                                channels={channels}
                                masterOptions={masterOptions}
                                onTaskClick={onTaskClick}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { format } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { Task, Channel, MasterOption } from '../../../types';
import { SortableTaskCard } from './SortableTaskCard';

export interface UnscheduledDayTrayProps {
    day: Date;
    tasks: Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
    tooltipAlign?: 'left' | 'right';
}

export const UnscheduledDayTray: React.FC<UnscheduledDayTrayProps> = ({
    day,
    tasks,
    channels,
    masterOptions,
    onTaskClick,
    tooltipAlign = 'right'
}) => {
    const columnId = format(day, 'yyyy-MM-dd');
    const unscheduledId = `${columnId}_unscheduled`;

    // Hook up droppable zone for unscheduled drop
    const { setNodeRef, isOver } = useDroppable({
        id: unscheduledId,
    });

    return (
        <div 
            ref={setNodeRef}
            className={`flex-1 min-w-[200px] md:min-w-[240px] xl:min-w-[280px] p-2.5 transition-all duration-300 flex flex-col gap-1.5 ${
                tasks.length > 0 
                    ? 'bg-rose-50/50 hover:bg-rose-50/80 border-b border-rose-100/40' 
                    : 'bg-slate-50/10 hover:bg-slate-50/40 border-b border-slate-100'
            } ${isOver ? 'bg-rose-100/80 ring-2 ring-rose-200/60 ring-inset' : ''}`}
            style={{ minHeight: '96px', maxHeight: '160px' }}
        >
            {tasks.length > 0 ? (
                <div className="flex flex-col gap-1.5 h-full">
                    <div className="flex items-center gap-1 px-1 font-black text-[9px] text-rose-500 uppercase tracking-widest leading-none select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        ไม่ได้ลงเวลา ({tasks.length})
                    </div>
                    
                    <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide py-0.5 flex-1 max-h-[120px]">
                        {tasks.map((t) => (
                            <div key={t.id} className="relative z-10">
                                <SortableTaskCard 
                                    task={t}
                                    channels={channels}
                                    masterOptions={masterOptions}
                                    onTaskClick={onTaskClick}
                                    isCompact={true}
                                    tooltipAlign={tooltipAlign}
                                    tooltipDirection="down"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-center select-none py-4">
                    <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-200 ${isOver ? 'text-rose-600' : 'text-slate-300'}`}>
                        {isOver ? 'ปล่อยเพื่อดึงเวลาออก ✓' : 'ลากมาวางเพื่อลบเวลา'}
                    </span>
                </div>
            )}
        </div>
    );
};

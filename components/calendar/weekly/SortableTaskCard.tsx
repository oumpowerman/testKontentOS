import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Channel, MasterOption } from '../../../types';
import { WeeklyTaskCard } from './WeeklyTaskCard';

export interface SortableTaskCardProps {
    task: Task;
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
    style?: React.CSSProperties;
    className?: string;
    isCompact?: boolean;
    cardHeight?: number;
    tooltipAlign?: 'left' | 'right';
    tooltipDirection?: 'up' | 'down';
}

export const SortableTaskCard: React.FC<SortableTaskCardProps> = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.task.id });

    const style = {
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
        transition,
        ...props.style
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

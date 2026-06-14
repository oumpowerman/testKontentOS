
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    hFull?: boolean;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, className, hFull = true }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`relative group/widget ${hFull ? 'h-full' : 'h-auto'} flex flex-col ${className}`}
        >
            {/* Drag Handle */}
            <div 
                {...attributes} 
                {...listeners}
                className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 opacity-0 group-hover/widget:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm hover:bg-white"
            >
                <GripVertical className="w-4 h-4 text-slate-400" />
            </div>
            
            {children}
        </div>
    );
};

export default SortableWidget;

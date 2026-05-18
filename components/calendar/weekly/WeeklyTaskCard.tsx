
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, AlertCircle, CheckCircle2, Calendar as CalendarIcon, GripVertical } from 'lucide-react';
import { Task, Channel, MasterOption } from '../../../types';

interface WeeklyTaskCardProps {
    task: Task;
    channels: Channel[];
    masterOptions: MasterOption[];
    onTaskClick: (task: Task) => void;
    attributes?: any;
    listeners?: any;
    setNodeRef?: (node: HTMLElement | null) => void;
    style?: React.CSSProperties;
    isDragging?: boolean;
}

export const WeeklyTaskCard = React.forwardRef<HTMLDivElement, WeeklyTaskCardProps>(({
    task,
    channels,
    masterOptions,
    onTaskClick,
    attributes,
    listeners,
    setNodeRef,
    style,
    isDragging
}, ref) => {
    const channel = channels.find(c => c.id === task.channelId);
    const statusOption = masterOptions.find(o => o.key === task.status);
    
    // Status Color Handling (matching BoardView's badge style)
    const statusClasses = statusOption?.color || 'bg-slate-100 text-slate-600';
    
    // Channel Color Handling (Accent Strip)
    const rawChannelColor = channel?.color || '#e2e8f0';
    const isChannelHex = rawChannelColor.startsWith('#');
    const channelTailwindBg = !isChannelHex ? (rawChannelColor.startsWith('bg-') ? rawChannelColor.split(' ')[0] : `bg-${rawChannelColor}`) : '';
    const channelTailwindBorder = !isChannelHex ? (rawChannelColor.startsWith('border-') ? rawChannelColor.split(' ')[0] : `border-${rawChannelColor}`) : '';

    return (
        <motion.div
            ref={(node) => {
                // Merge dnd-kit's setNodeRef with the forwarded ref from framer-motion/AnimatePresence
                if (setNodeRef) setNodeRef(node);
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    (ref as React.MutableRefObject<HTMLElement | null>).current = node;
                }
            }}
            style={{
                ...style,
                borderLeftColor: isChannelHex ? rawChannelColor : undefined,
                backgroundColor: isDragging ? 'white' : undefined
            }}
            {...attributes}
            layoutId={isDragging ? undefined : task.id}
            onClick={() => onTaskClick(task)}
            className={`
                group/card relative bg-white rounded-3xl p-4 shadow-sm border transition-all active:scale-[0.98] 
                ${isDragging ? 'opacity-95 ring-4 ring-indigo-500/30 z-50 cursor-grabbing shadow-2xl scale-[1.02]' : 'border-slate-100 hover:shadow-xl hover:border-indigo-200 cursor-pointer'}
                ${!isChannelHex && channelTailwindBorder ? `border-l-4 ${channelTailwindBorder}` : (isChannelHex ? 'border-l-4' : '')}
                ${!isDragging && !isChannelHex && channelTailwindBg ? `${channelTailwindBg}/50` : 'bg-white'}
            `}
        >
            {/* Drag Handle Indicator */}
            <div 
                {...listeners}
                className="absolute right-3 top-3 p-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-all cursor-grab active:cursor-grabbing z-20"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Channel Color Accent Strip */}
            <div 
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-12 w-1.5 rounded-r-full opacity-40 group-hover/card:opacity-100 transition-opacity ${channelTailwindBg}`} 
                style={{ backgroundColor: isChannelHex ? rawChannelColor : undefined }}
            />

            {/* Card Header: Time + Status Badge */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-black">
                    <Clock className="w-3.5 h-3.5" />
                    {task.scheduledTime || '--:--'}
                </div>
                
                {statusOption && (
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wider uppercase ${statusClasses}`}>
                        {statusOption.label}
                    </span>
                )}
            </div>

            {/* Channel & Title */}
            <div className="space-y-2">
                {channel && (
                    <div className="flex items-center gap-2">
                        {channel.logoUrl ? (
                            <img src={channel.logoUrl} className="w-5 h-5 rounded-full object-cover border border-slate-100" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                <CalendarIcon className="w-3 h-3 text-slate-400" />
                            </div>
                        )}
                        <span className="text-[12px] font-kanit font-medium text-slate-600 uppercase tracking-[0.1em] truncate">
                            {channel.name}
                        </span>
                    </div>
                )}
                <h4 className="text-[16px] font-kanit font-medium text-slate-800 leading-snug group-hover/card:text-indigo-600 transition-colors">
                    {task.title}
                </h4>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-50">
                {task.shootLocation && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span className="truncate max-w-[120px]">{task.shootLocation}</span>
                    </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                    {task.priority === 'HIGH' && (
                        <div className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest border border-rose-100 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 fill-rose-50" /> HIGH
                        </div>
                    )}
                    {task.status === 'DONE' && (
                        <div className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest border border-emerald-100 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> DONE
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

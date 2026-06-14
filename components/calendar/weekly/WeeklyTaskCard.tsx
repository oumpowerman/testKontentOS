
import React from 'react';
import { createPortal } from 'react-dom';
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
    isOverlay?: boolean;
    isCompact?: boolean;
    cardHeight?: number;
    tooltipAlign?: 'left' | 'right';
    tooltipDirection?: 'up' | 'down';
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
    isDragging,
    isOverlay = false,
    isCompact = false,
    cardHeight = 80,
    tooltipAlign = 'right',
    tooltipDirection = 'up'
}, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [rect, setRect] = React.useState<DOMRect | null>(null);

    const handleSetRef = (node: HTMLDivElement | null) => {
        if (setNodeRef) setNodeRef(node);
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
    };

    const channel = channels.find(c => c.id === task.channelId);
    const statusOption = masterOptions.find(o => o.key === task.status);
    
    // Status Color Handling (matching BoardView's badge style)
    const statusClasses = statusOption?.color || 'bg-slate-100 text-slate-600';
    
    // Channel Color Handling (Accent Strip)
    const rawChannelColor = channel?.color || '#e2e8f0';
    const isChannelHex = rawChannelColor.startsWith('#');
    const channelTailwindBg = !isChannelHex ? (rawChannelColor.startsWith('bg-') ? rawChannelColor.split(' ')[0] : `bg-${rawChannelColor}`) : '';
    const channelTailwindBorder = !isChannelHex ? (rawChannelColor.startsWith('border-') ? rawChannelColor.split(' ')[0] : `border-${rawChannelColor}`) : '';

    if (isCompact) {
        const isExtremelyShort = cardHeight < 60; // Less than an hour
        
        return (
            <motion.div
                ref={handleSetRef}
                style={{
                    ...style,
                    borderLeftColor: isChannelHex ? rawChannelColor : undefined,
                    backgroundColor: isDragging ? 'white' : undefined
                }}
                {...attributes}
                {...listeners}
                layoutId={isDragging ? undefined : task.id}
                onClick={() => onTaskClick(task)}
                onMouseEnter={(e) => {
                    setIsHovered(true);
                    setRect(e.currentTarget.getBoundingClientRect());
                }}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    group/card relative rounded-[1rem] shadow-sm border transition-all active:scale-[0.98] h-full flex flex-col justify-start select-none p-1.5 md:p-2 gap-1
                    cursor-grab active:cursor-grabbing
                    ${isOverlay ? 'opacity-95 ring-4 ring-indigo-500/30 z-[100] cursor-grabbing shadow-2xl scale-[1.02]' : (isDragging ? 'opacity-25 shadow-none scale-100 border-dashed border-slate-300 pointer-events-none' : 'border-slate-100/90 hover:shadow-lg hover:border-indigo-200')}
                    ${!isChannelHex && channelTailwindBorder ? `border-l-[4px] ${channelTailwindBorder}` : (isChannelHex ? 'border-l-[4px]' : 'border-l-[4px] border-l-slate-200')}
                    ${!isDragging && !isChannelHex && channelTailwindBg ? `${channelTailwindBg}/10` : 'bg-white'}
                `}
            >
                {/* Drag Handle Indicator */}
                <div 
                    className="absolute right-1 top-1 p-0.5 rounded opacity-0 group-hover/card:opacity-100 text-slate-300 pointer-events-none transition-all z-20"
                >
                    <GripVertical className="w-3 h-3" />
                </div>

                {/* Main Card Content */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 min-h-0 justify-start overflow-hidden">
                    {/* Time & Channel row (only show if height is enough to prevent clutter) */}
                    {!isExtremelyShort && (
                        <div className="flex items-center justify-between gap-1 shrink-0 text-[9px] font-black text-indigo-600 mb-0.5">
                            <span className="bg-indigo-50 px-1 py-0.2 rounded">
                                {task.scheduledTime || '--:--'}
                            </span>
                            
                            {channel && (
                                <div className="flex items-center gap-0.5 shrink-0" title={channel.name}>
                                    {channel.logoUrl ? (
                                        <img src={channel.logoUrl} className="w-3.5 h-3.5 rounded-full object-cover border border-slate-100" referrerPolicy="no-referrer" />
                                    ) : (
                                        <span className="text-[8px] font-medium text-slate-400 capitalize max-w-[50px] truncate">
                                            {channel.name}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                        {isExtremelyShort ? (
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="text-[8.5px] font-extrabold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded shrink-0 leading-none">
                                    {task.scheduledTime || '--:--'}
                                </span>
                                <h4 className="text-[10.5px] font-kanit font-semibold text-slate-800 truncate flex-1 leading-normal">
                                    {task.title}
                                </h4>
                            </div>
                        ) : (
                            <h4 className="font-kanit font-semibold text-slate-800 leading-snug group-hover/card:text-indigo-600 transition-colors text-[11px] md:text-[11.5px] line-clamp-2">
                                {task.title}
                            </h4>
                        )}
                    </div>
                </div>

                {/* Detailed Hover Tooltip (rendered outer via portal to avoid overflow clipping) */}
                {isHovered && rect && createPortal(
                    <div 
                        style={{
                            position: 'fixed',
                            ...(tooltipDirection === 'down' 
                                ? { top: `${rect.bottom + 8}px` } 
                                : { bottom: `${window.innerHeight - rect.top + 8}px` }
                            ),
                            left: tooltipAlign === 'left' ? `${rect.right - 352}px` : `${rect.left}px`,
                            zIndex: 99999,
                        }}
                        className={`
                            pointer-events-none w-[22rem] bg-white border border-slate-200/80 text-slate-800 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex flex-col p-4 gap-3 text-left
                            ${tooltipAlign === 'left' 
                                ? `${tooltipDirection === 'down' ? 'origin-top-right' : 'origin-bottom-right'}` 
                                : `${tooltipDirection === 'down' ? 'origin-top-left' : 'origin-bottom-left'}`
                            }
                        `}
                    >
                        {/* Header in Tooltip */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            {channel ? (
                                <div className="flex items-center gap-2 min-w-0">
                                    {channel.logoUrl ? (
                                        <img src={channel.logoUrl} className="w-6 h-6 rounded-full object-cover border border-slate-100" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                    )}
                                    <span className="text-[11px] font-kanit font-black text-slate-700 uppercase tracking-widest truncate">
                                        {channel.name}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    รายละเอียดรายการ
                                </span>
                            )}

                            {statusOption && (
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${statusClasses}`}>
                                    {statusOption.label}
                                </span>
                            )}
                        </div>

                        {/* Title and description */}
                        <div className="space-y-1.5">
                            <h5 className="text-[14px] font-kanit font-medium text-slate-900 leading-snug">
                                {task.title}
                            </h5>
                            {task.description && (
                                <p className="text-[11px] font-kanit text-slate-500 leading-relaxed font-light line-clamp-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    {task.description}
                                </p>
                            )}
                        </div>

                        {/* Detailed Metadata Grid */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                            {/* Time details */}
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="font-medium text-slate-500">
                                    เวลาถ่ายทำ: <span className="text-slate-800 font-bold">{task.shootTimeStart ? `${task.shootTimeStart} - ${task.shootTimeEnd || ''}` : `${task.scheduledTime || '--:--'} (เวลาออกอากาศ)`}</span>
                                </span>
                            </div>

                            {/* Location details */}
                            {task.shootLocation && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="font-medium whitespace-pre-wrap break-words text-slate-500">
                                        สถานที่: <span className="text-slate-800 font-bold">{task.shootLocation}</span>
                                    </span>
                                </div>
                            )}

                            {/* Badges footer */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {task.priority === 'HIGH' && (
                                    <span className="text-[9px] font-black tracking-wider bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-100">
                                        ความสำคัญสูง (HIGH)
                                    </span>
                                )}
                                {task.contentFormats && task.contentFormats.length > 0 && (
                                    <span className="text-[9px] font-black tracking-wider bg-violet-50 text-violet-600 px-2.5 py-0.5 rounded-full border border-violet-100">
                                        รูปแบบ: {task.contentFormats.join(', ')}
                                    </span>
                                )}
                                {task.assigneeIds && task.assigneeIds.length > 0 && (
                                    <span className="text-[9px] font-black tracking-wider bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-100">
                                        ผู้รับผิดชอบ: {task.assigneeIds.length} คน
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </motion.div>
        );
    }

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
            {...listeners}
            layoutId={isDragging ? undefined : task.id}
            onClick={() => onTaskClick(task)}
            className={`
                group/card relative bg-white rounded-3xl p-3 md:p-4 shadow-sm border transition-all active:scale-[0.98] 
                cursor-grab active:cursor-grabbing
                ${isOverlay ? 'opacity-95 ring-4 ring-indigo-500/30 z-[100] cursor-grabbing shadow-2xl scale-[1.02]' : (isDragging ? 'opacity-25 shadow-none scale-100 border-dashed border-slate-300 pointer-events-none' : 'border-slate-100 hover:shadow-xl hover:border-indigo-200')}
                ${!isChannelHex && channelTailwindBorder ? `border-l-4 ${channelTailwindBorder}` : (isChannelHex ? 'border-l-4' : '')}
                ${!isDragging && !isChannelHex && channelTailwindBg ? `${channelTailwindBg}/50` : 'bg-white'}
            `}
        >
            {/* Drag Handle Indicator */}
            <div 
                className="absolute right-3 top-3 p-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 text-slate-300 pointer-events-none transition-all z-20"
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
            <div className="flex items-center gap-2 mt-3 md:mt-4 pt-3 border-t border-slate-50">
                {task.shootLocation && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 min-w-0">
                        <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[55px] xs:max-w-[70px] sm:max-w-[90px] md:max-w-[110px] lg:max-w-[120px]">{task.shootLocation}</span>
                    </div>
                )}
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
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

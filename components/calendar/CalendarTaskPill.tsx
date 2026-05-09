
import React, { memo, useMemo } from 'react';
import { Task, ChipConfig, MasterOption, Channel } from '../../types';
import { COLOR_THEMES } from '../../constants';
import { TaskDisplayMode } from '../CalendarView';
import { isBefore, startOfToday } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalendarTaskPillProps {
    task: Task;
    index: number;
    viewMode: 'CONTENT' | 'TASK';
    displayMode: TaskDisplayMode; // Added
    isExpanded: boolean;
    activeChipIds: string[];
    customChips: ChipConfig[];
    masterOptions?: MasterOption[];
    channels: Channel[];
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: (task: Task) => void;
}

const CalendarTaskPill: React.FC<CalendarTaskPillProps> = ({
    task,
    index,
    viewMode,
    displayMode,
    isExpanded,
    activeChipIds,
    customChips,
    masterOptions,
    channels,
    onDragStart,
    onClick
}) => {

    // Overdue Logic: Not in "DONE" groups and endDate < today
    const isOverdue = useMemo(() => {
        if (!task.endDate) return false;
        
        // keywords for finished group (LIKE check)
        const finishedKeywords = ['DONE', 'PUBLISH', 'FINISH', 'COMPLETE', 'APPROVE', 'SUCCESS', 'ARCHIVE'];
        const currentStatus = (task.status || '').toUpperCase();
        
        const isFinished = finishedKeywords.some(keyword => currentStatus.includes(keyword));
        if (isFinished) return false;

        // Check if endDate is before today
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return isBefore(endDateObj, startOfToday());
    }, [task.status, task.endDate]);

    // Helper to get styling for the main card container
    const getTaskStyle = (t: Task) => {
        // Default Clean Style: White bg with colored left border indicator
        // Update: Respect Minimal mode by removing heavy backgrounds
        let styleClass = viewMode === 'CONTENT' 
            ? 'bg-white border-l-4 border-l-indigo-500 border-y border-r border-gray-100 text-gray-700 hover:shadow-md' 
            : 'bg-white border-l-4 border-l-emerald-500 border-y border-r border-gray-100 text-gray-700 hover:shadow-md';

        // Add Overdue visual style
        if (isOverdue) {
            styleClass = 'bg-red-50 border-l-4 border-l-red-500 border-y border-r border-red-100 text-red-900 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
        }

        // Override if a channel color exists (Only if not overdue, or we can mix, but let's keep overdue prominent)
        if (t.channelId && channels && !isOverdue) {
            const channel = channels.find(c => c.id === t.channelId);
            if (channel && channel.color) {
                // If it's a tailwind class (e.g. "indigo-500"), we need to construct border-l-class
                // If it's a hex, we'll handle it via inline style later (or assume it's a tailwind color name)
                if (!channel.color.startsWith('#')) {
                    const borderColorClass = channel.color.startsWith('border-l-') ? channel.color : `border-l-${channel.color}`;
                    styleClass = styleClass.replace(/border-l-[a-z0-9-]+/, borderColorClass);
                }
            }
        }

        // Override if a Smart Filter (Chip) matches
        if (activeChipIds.length > 0 && Array.isArray(customChips)) {
            const matchingChipId = activeChipIds.find(chipId => {
                const chip = customChips.find(c => c.id === chipId);
                if (!chip) return false;
                
                switch (chip.type) {
                    case 'CHANNEL': return t.channelId === chip.value;
                    case 'FORMAT': return t.contentFormat === chip.value;
                    case 'STATUS': return t.status === chip.value;
                    case 'PILLAR': return t.pillar === chip.value;
                    default: return false;
                }
            });

            if (matchingChipId) {
                const chip = customChips.find(c => c.id === matchingChipId);
                if (chip) {
                    const theme = COLOR_THEMES.find(th => th.id === chip.colorTheme) || COLOR_THEMES[0];
                    // Apply theme background but ensure text is readable
                    styleClass = `${theme.bg} ${theme.text} ${theme.border} hover:opacity-90 font-medium border-l-4 border-l-current`;
                }
            }
        }
        return styleClass;
    };

    const getTaskDotClass = (t: Task) => {
        if (t.status === 'DONE' || t.status === 'APPROVE') return 'bg-green-500';
        if (t.status === 'TODO' || t.status === 'IDEA') return 'bg-gray-400';
        if (t.status === 'BLOCKED') return 'bg-red-500';
        return 'bg-indigo-500'; 
    };

    // Calculate layout classes based on expanded state
    const taskBaseClass = isExpanded 
        ? "w-full text-xs px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing transition-all shadow-sm leading-snug flex items-center justify-between gap-2 mb-1.5 hover:scale-110 hover:shadow-2xl hover:z-50 relative"
        : "w-full text-[12px] px-1.5 py-1 rounded-md border truncate cursor-grab active:cursor-grabbing hover:scale-125 hover:z-50 hover:shadow-xl transition-all shadow-sm flex items-center gap-1 mb-0.5 relative";

    // Resolve Status Label & Color from Master Data
    let statusLabel = '';
    let statusColor = 'bg-gray-100 text-gray-600 border-gray-200'; // Default Fallback
    let statusEmoji = '';

    if (masterOptions) {
        const statusOpt = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === task.status);
        if (statusOpt) {
            // Remove numbering (e.g. "01 Idea" -> "Idea") for cleaner look
            const cleanLabel = statusOpt.label.replace(/^\d+\s*/, '');
            statusLabel = cleanLabel;
            
            // Extract Emoji for Emoji Mode
            const emojiMatch = statusOpt.label.match(/[\p{Emoji}\u200d]+/u);
            statusEmoji = emojiMatch ? emojiMatch[0] : '';

            // Truncate if too long
            if (statusLabel.length > 12) statusLabel = statusLabel.substring(0, 10) + '..';
            
            if (statusOpt.color) {
                statusColor = statusOpt.color;
            }
        } else {
            statusLabel = task.status;
        }
    }

    // --- RENDER LOGIC BASED ON DISPLAY MODE ---
    const renderContent = () => {
        const overdueIndicator = isOverdue && (
            <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="shrink-0"
            >
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            </motion.div>
        );

        switch (displayMode) {
            case 'MINIMAL':
                return (
                    <div className="flex items-center gap-1 overflow-hidden w-full">
                        {overdueIndicator}
                        <span className="truncate flex-1 font-bold">{task.title}</span>
                    </div>
                );
            case 'DOT':
                return (
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                         {isOverdue ? overdueIndicator : <div className={`w-2 h-2 rounded-full shrink-0 ${getTaskDotClass(task)}`}></div>}
                         <span className="truncate flex-1 font-bold">{task.title}</span>
                    </div>
                );
            case 'EMOJI':
                return (
                     <div className="flex items-center gap-1.5 overflow-hidden w-full">
                         {isOverdue ? overdueIndicator : (statusEmoji && <span className="text-[12px] shrink-0">{statusEmoji}</span>)}
                         <span className="truncate flex-1 font-bold">{task.title}</span>
                    </div>
                );
            case 'FULL':
            default:
                // Default Expanded View with Badge
                return (
                    <>
                        {overdueIndicator}
                        <span className="truncate flex-1 font-bold">{task.title}</span>
                        {statusLabel && (
                            <span className={`
                                text-[9px] font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-md border
                                ${isOverdue ? 'bg-red-500 text-white border-red-400' : statusColor}
                                ${!isExpanded ? 'hidden lg:inline-block' : ''}
                                shadow-sm
                            `}>
                                {isOverdue ? 'OVERDUE' : statusLabel}
                            </span>
                        )}
                    </>
                );
        }
    };

    return (
        <>
            <motion.div 
                draggable
                onDragStart={(e: any) => onDragStart(e, task.id)}
                onClick={(e) => {
                    e.stopPropagation(); 
                    onClick(task);
                }}
                animate={isOverdue ? { 
                    x: [0, -1, 1, -1, 1, 0],
                } : {}}
                transition={isOverdue ? {
                    repeat: Infinity,
                    duration: 4,
                    repeatDelay: 5
                } : {}}
                style={{ 
                    animationDelay: `${index * 50}ms`, 
                    animationFillMode: 'both',
                    borderLeftColor: !isOverdue && (task.channelId && channels?.find(c => c.id === task.channelId)?.color?.startsWith('#')) 
                        ? channels.find(c => c.id === task.channelId)?.color 
                        : undefined
                }}
                className={`
                    animate-spring group
                    ${isExpanded ? 'block' : 'hidden md:flex'}
                    ${taskBaseClass}
                    ${getTaskStyle(task)}
                    ${isOverdue ? 'ring-1 ring-red-400/50' : ''}
                `}
                title={`${task.title} (${isOverdue ? 'งานตกค้าง!' : statusLabel})`}
            >
                {renderContent()}
            </motion.div>

            {/* Mobile / Collapsed Dot View (Always Dots on Mobile for space) */}
            {!isExpanded && (
                <div 
                    className={`
                        md:hidden w-1.5 h-1.5 rounded-full ${(!task.channelId || !channels?.find(c => c.id === task.channelId)?.color) ? getTaskDotClass(task) : ''}
                        animate-spring
                    `}
                    style={{ 
                        animationDelay: `${index * 30}ms`, 
                        animationFillMode: 'both',
                        backgroundColor: (task.channelId && channels?.find(c => c.id === task.channelId)?.color) 
                            ? (channels.find(c => c.id === task.channelId)?.color?.startsWith('#') 
                                ? channels.find(c => c.id === task.channelId)?.color 
                                : undefined // Tailwind class will handle it if we find a way, but let's stick to hex for inline or fallback to dot class
                            ) 
                            : undefined
                    }}
                />
            )}
        </>
    );
};

export default memo(CalendarTaskPill);

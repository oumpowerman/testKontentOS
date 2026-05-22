
import React, { memo, useMemo, useState } from 'react';
import { Task, ChipConfig, MasterOption, Channel } from '../../types';
import { COLOR_THEMES } from '../../constants';
import { TaskDisplayMode } from '../CalendarView';
import { isBefore, startOfToday, differenceInDays, format } from 'date-fns';
import { AlertCircle, Ghost, Clock8, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isStockTerminalStatus } from '../../config/status';

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
    dayOfWeek?: number; // Added to prevent border clipping during scale
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
    dayOfWeek,
    onDragStart,
    onClick
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Get end date object safely
    const endDateObj = useMemo(() => {
        if (!task.endDate) return null;
        return task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    }, [task.endDate]);

    const overdueDays = useMemo(() => {
        if (!endDateObj) return 0;
        return differenceInDays(startOfToday(), endDateObj);
    }, [endDateObj]);

    // Overdue Logic: Not in "DONE" groups and endDate < today
    const isOverdue = useMemo(() => {
        if (!task.endDate) return false;
        
        // keywords for finished group (LIKE check)
        const finishedKeywords = ['DONE', 'PUBLISH', 'FINISH', 'COMPLETE', 'APPROVE', 'SUCCESS', 'ARCHIVE', 'POSTED'];
        const currentStatus = (task.status || '').toUpperCase();
        
        const isFinished = finishedKeywords.some(keyword => currentStatus.includes(keyword));
        if (isFinished) return false;

        // Check if endDate is before today
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return isBefore(endDateObj, startOfToday());
    }, [task.status, task.endDate]);

    const isCriticalOverdue = useMemo(() => {
        if (!isOverdue || !task.endDate) return false;
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return differenceInDays(startOfToday(), endDateObj) >= 7;
    }, [isOverdue, task.endDate]);

    // Added: Insight Overdue Logic (Posted but no analytics entered after 7 days)
    const isInsightOverdue = useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
        
        // Only show overdue if it's content, terminal, has no analytics yet, and > 7 days since end date
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.hasAnalytics) return false;
        
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return differenceInDays(startOfToday(), endDateObj) >= 7;
    }, [task.type, task.status, task.endDate, task.isUnscheduled, task.hasAnalytics]);

    // Helper to get styling for the main card container
    const getTaskStyle = (t: Task) => {
        // Default Clean Style: White bg with colored left border indicator
        // Update: Respect Minimal mode by removing heavy backgrounds
        let styleClass = viewMode === 'CONTENT' 
            ? 'bg-white border-l-4 border-l-indigo-500 border-y border-r border-gray-100 text-gray-700 hover:shadow-md' 
            : 'bg-white border-l-4 border-l-emerald-500 border-y border-r border-gray-100 text-gray-700 hover:shadow-md';

        // Add Overdue visual style
        if (isOverdue) {
            styleClass = isCriticalOverdue 
                ? 'bg-slate-50 border-l-4 border-l-slate-400 border-y border-r border-slate-200 text-slate-400 opacity-60 grayscale hover:grayscale-0 transition-all'
                : 'bg-red-50 border-l-4 border-l-red-500 border-y border-r border-red-100 text-red-900 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
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
                    case 'FORMAT': return t.contentFormats && t.contentFormats.includes(chip.value);
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

    // Adaptive origin to prevent layout clip on the first/last column boundaries of the calendar
    const originClass = useMemo(() => {
        if (dayOfWeek === 0) return 'origin-left';
        if (dayOfWeek === 6) return 'origin-right';
        return 'origin-center';
    }, [dayOfWeek]);

    // Calculate layout classes based on expanded state
    const taskBaseClass = isExpanded 
        ? `w-full text-xs px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing transition-all shadow-sm leading-snug flex items-center justify-between gap-2 mb-1.5 hover:scale-110 hover:shadow-2xl hover:z-50 relative ${originClass}`
        : `w-full text-[12px] px-1.5 py-1 rounded-md border truncate cursor-grab active:cursor-grabbing hover:scale-125 hover:z-50 hover:shadow-xl transition-all shadow-sm flex items-center gap-1 mb-0.5 relative ${originClass}`;

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
        const analyticsStatus = task.analyticsStatus || (task.hasAnalytics ? 'COMPLETE' : 'NONE');

        const hasAnalyticsIndicator = (analyticsStatus === 'COMPLETE' || analyticsStatus === 'PARTIAL') && (
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.25, rotate: analyticsStatus === 'COMPLETE' ? 15 : -10 }}
                className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-full border shadow-sm ${
                    analyticsStatus === 'COMPLETE'
                        ? 'bg-purple-100 border-purple-200 text-purple-600'
                        : 'bg-amber-50 border-amber-200 border-dashed text-amber-500 animate-pulse'
                }`}
                title={
                    analyticsStatus === 'COMPLETE'
                        ? "Performance Data Entry Complete ✨"
                        : "Performance Data Entry Partially Complete (Some channels missing) ⚡"
                }
            >
                <Zap className={`w-2.5 h-2.5 ${analyticsStatus === 'COMPLETE' ? 'text-purple-600 fill-purple-600' : 'text-amber-500 fill-amber-500 opacity-80'}`} />
            </motion.div>
        );

        const overdueIndicator = isOverdue && (
            <motion.div 
                animate={isCriticalOverdue ? { 
                    opacity: [0.4, 1, 0.4],
                } : { 
                    scale: [1, 1.2, 1], 
                    opacity: [1, 0.6, 1] 
                }}
                transition={{ repeat: Infinity, duration: isCriticalOverdue ? 3 : 1.5 }}
                className="shrink-0"
            >
                {isCriticalOverdue ? (
                    <Clock8 className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                )}
            </motion.div>
        );

        switch (displayMode) {
            case 'MINIMAL':
                return (
                    <div className="flex items-center gap-1 overflow-hidden w-full">
                        {overdueIndicator}
                        {isInsightOverdue && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                        {hasAnalyticsIndicator}
                        <span className="truncate flex-1 font-bold">{task.title}</span>
                    </div>
                );
            case 'DOT':
                return (
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                         {isOverdue ? overdueIndicator : <div className={`w-2 h-2 rounded-full shrink-0 ${getTaskDotClass(task)}`}></div>}
                         {isInsightOverdue && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                         {hasAnalyticsIndicator}
                         <span className="truncate flex-1 font-bold">{task.title}</span>
                    </div>
                );
            case 'EMOJI':
                return (
                     <div className="flex items-center gap-1.5 overflow-hidden w-full">
                         {isOverdue ? overdueIndicator : (statusEmoji && <span className="text-[12px] shrink-0">{statusEmoji}</span>)}
                         {isInsightOverdue && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                         {hasAnalyticsIndicator}
                         <span className="truncate flex-1 font-bold">{task.title}</span>
                    </div>
                );
            case 'FULL':
            default:
                // Default Expanded View with Badge
                return (
                    <>
                        {overdueIndicator}
                        {isInsightOverdue && (
                            <div className="shrink-0 flex items-center justify-center w-5 h-5 bg-rose-100 rounded-full" title="Missing Analytics Insight">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                            </div>
                        )}
                        <span className="truncate flex-1 font-bold">{task.title}</span>
                        {hasAnalyticsIndicator}
                        {statusLabel && (
                            <span className={`
                                text-[9px] font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-md border
                                ${isOverdue ? (isCriticalOverdue ? 'bg-slate-400 text-white border-slate-300' : 'bg-red-500 text-white border-red-400') : statusColor}
                                ${!isExpanded ? 'hidden lg:inline-block' : ''}
                                shadow-sm
                            `}>
                                {isOverdue ? (isCriticalOverdue ? 'STUCK' : 'OVERDUE') : statusLabel}
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
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
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
            >
                {renderContent()}
            </motion.div>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10, x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.95, y: 6, x: '-50%' }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-2.5 origin-bottom"
                    >
                        {/* Warning Header */}
                        {isOverdue && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-[11px] leading-tight shadow-[0_2px_8px_rgba(239,68,68,0.06)] animate-pulse">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <span>งานตกค้างเกินกำหนด! ({overdueDays} วัน)</span>
                            </div>
                        )}

                        {isInsightOverdue && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-[11px] leading-tight shadow-[0_2px_8px_rgba(244,63,94,0.06)] animate-pulse">
                                <Clock8 className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>ค้างสรุปรายงานสถิติ!</span>
                            </div>
                        )}

                        {/* Task Title */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-wider text-slate-450 uppercase select-none">
                                {viewMode === 'CONTENT' ? 'CONTENT PLAN' : 'SUB TASK'}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                                {task.title}
                            </h4>
                        </div>

                        {/* Mid Divider */}
                        <div className="h-px bg-slate-100" />

                        {/* Status, Channel & Date info */}
                        <div className="space-y-1.5 text-[11px] text-slate-600">
                            {/* Target Channel */}
                            {task.channelId && channels && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">ช่องทาง:</span>
                                    {(() => {
                                        const ch = channels.find(c => c.id === task.channelId);
                                        return ch ? (
                                            <span 
                                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                                                style={{ 
                                                    backgroundColor: ch.color?.startsWith('#') ? `${ch.color}15` : undefined,
                                                    borderColor: ch.color?.startsWith('#') ? `${ch.color}40` : undefined,
                                                    color: ch.color?.startsWith('#') ? ch.color : undefined
                                                }}
                                            >
                                                {ch.name}
                                            </span>
                                        ) : <span className="text-slate-500">-</span>;
                                    })()}
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">สถานะหลัก:</span>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusColor}`}>
                                    {isOverdue ? (isCriticalOverdue ? 'STUCK' : 'OVERDUE') : statusLabel}
                                </span>
                            </div>

                            {/* Due Date */}
                            {endDateObj && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">กำหนดส่ง:</span>
                                    <span className={`font-mono font-medium ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                        {format(endDateObj, 'dd/MM/yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Aesthetic Footer Decor Tip */}
                        <div className="text-[9px] text-slate-400 italic text-center border-t border-slate-50 pt-2 shrink-0">
                            ✨ คลิกเพื่อเปิดดูรายละเอียดงานและสถิติ
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile / Collapsed Dot View (Always Dots on Mobile for space) */}
            {!isExpanded && (
                <div 
                    className={`
                        md:hidden w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ring-1 ring-white/30
                        animate-spring
                        ${(() => {
                            const color = task.channelId && channels?.find(c => c.id === task.channelId)?.color;
                            if (!color) return getTaskDotClass(task);
                            if (color.startsWith('#')) return '';
                            // Convert text-indigo-500 or border-indigo-500 to bg-indigo-500
                            const base = color.replace('bg-', '').replace('text-', '').replace('border-', '').replace('border-l-', '');
                            return `bg-${base}`;
                        })()}
                    `}
                    style={{ 
                        animationDelay: `${index * 30}ms`, 
                        animationFillMode: 'both',
                        backgroundColor: (task.channelId && channels?.find(c => c.id === task.channelId)?.color?.startsWith('#')) 
                            ? channels.find(c => c.id === task.channelId)?.color 
                            : undefined
                    }}
                />
            )}
        </>
    );
};

export default memo(CalendarTaskPill);

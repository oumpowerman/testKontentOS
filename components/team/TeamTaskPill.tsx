import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Task, Channel, MasterOption } from '../../types';
import { 
    Users, 
    Briefcase as JobIcon, 
    AlertCircle, 
    Clock8, 
    Calendar, 
    MapPin, 
    Award, 
    ShieldAlert, 
    Sparkles, 
    Coins, 
    HelpCircle,
    CheckCircle2
} from 'lucide-react';
import { differenceInCalendarDays, isBefore, startOfToday, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { isStockTerminalStatus } from '../../config/status';

interface TeamTaskPillProps {
    task: Task;
    day: Date;
    dayIndex: number;
    showContent: boolean;
    rowHeightClass: string;
    shapeClass: string;
    taskStyle: { className: string; theme?: any; isUrgent?: boolean; isHigh?: boolean };
    isTodayDay: boolean;
    onEditTask: (task: Task) => void;
    channels?: Channel[];
    masterOptions?: MasterOption[];
    isFocused?: boolean;
}

const TeamTaskPill: React.FC<TeamTaskPillProps> = ({
    task,
    day,
    dayIndex,
    showContent,
    rowHeightClass,
    shapeClass,
    taskStyle,
    isTodayDay,
    onEditTask,
    channels,
    masterOptions,
    isFocused
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showBelow, setShowBelow] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isHovered && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            if (rect.top < 350) {
                setShowBelow(true);
            } else {
                setShowBelow(false);
            }
        }
    }, [isHovered]);

    // Get end date object safely
    const endDateObj = useMemo(() => {
        if (!task.endDate) return null;
        return task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    }, [task.endDate]);

    // Get start date object safely
    const startDateObj = useMemo(() => {
        if (!task.startDate) return null;
        return task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    }, [task.startDate]);

    const overdueDays = useMemo(() => {
        if (!endDateObj) return 0;
        return differenceInCalendarDays(startOfToday(), endDateObj);
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
        return differenceInCalendarDays(startOfToday(), endDateObj) >= 7;
    }, [isOverdue, task.endDate]);

    // Insight Overdue Logic (Posted but no analytics entered after 7 days)
    const isInsightOverdue = useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
        
        // Only show overdue if it's content, terminal, has no analytics yet, and > 7 days since end date
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.hasAnalytics) return false;
        
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return differenceInCalendarDays(startOfToday(), endDateObj) >= 7;
    }, [task.type, task.status, task.endDate, task.isUnscheduled, task.hasAnalytics]);

    // Resolve Status Label & Color from Master Data
    let statusLabel = '';
    let statusColor = 'bg-slate-100 text-slate-600 border-slate-200'; // Default Fallback
    
    if (masterOptions) {
        const statusOpt = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === task.status);
        if (statusOpt) {
            statusLabel = statusOpt.label.replace(/^\d+\s*/, '');
            if (statusLabel.length > 12) statusLabel = statusLabel.substring(0, 10) + '..';
            if (statusOpt.color) {
                statusColor = statusOpt.color;
            }
        } else {
            statusLabel = task.status;
        }
    } else {
        statusLabel = task.status;
    }

    const popoverPositionClass = useMemo(() => {
        if (showBelow) {
            if (dayIndex === 0) {
                return "absolute top-[calc(100%+8px)] left-0 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-3.5 origin-top-left";
            }
            if (dayIndex === 6) {
                return "absolute top-[calc(100%+8px)] right-0 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-3.5 origin-top-right";
            }
            return "absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-3.5 origin-top";
        } else {
            if (dayIndex === 0) {
                return "absolute bottom-[calc(100%+8px)] left-0 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-3.5 origin-bottom-left";
            }
            if (dayIndex === 6) {
                return "absolute bottom-[calc(100%+8px)] right-0 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-3.5 origin-bottom-right";
            }
            return "absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-3.5 origin-bottom";
        }
    }, [dayIndex, showBelow]);

    const motionYInitial = showBelow ? -10 : 10;
    const motionYExit = showBelow ? -6 : 6;

    return (
        <div 
            ref={containerRef}
            className={`relative w-full ${isHovered ? 'z-50' : 'z-auto'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                role="button"
                tabIndex={0}
                aria-label={`งาน: ${task.title}. ${isOverdue ? `เกินกว่ากำหนด ${overdueDays} วัน.` : ''} สถานะ: ${statusLabel}`}
                onClick={() => onEditTask(task)} 
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEditTask(task);
                    }
                }}
                className={`
                    relative flex items-center overflow-hidden cursor-pointer w-full select-none
                    transition-all duration-300 ease-out
                    hover:scale-[1.015] hover:-translate-y-[1px]
                    active:scale-[0.985] active:translate-y-0
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:z-20
                    ${rowHeightClass}
                    ${shapeClass}
                    ${taskStyle.className}
                    ${isTodayDay ? 'saturate-[1.8] brightness-[1.01] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] ring-1 ring-black/5 ring-inset' : ''}
                    ${isHovered ? 'shadow-md shadow-slate-200/50' : ''}
                `}
            >
                {/* 3D Glossy Layer */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                
                {/* Side Accent Line */}
                {taskStyle.theme && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${taskStyle.theme?.accent} opacity-60`} />
                )}

                {/* Urgent Pattern */}
                {task.priority === 'URGENT' && (
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none animate-[pulse_3s_infinite_ease-in-out]" 
                         style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)' }} />
                )}

                {showContent && (
                    <div className="relative z-10 flex items-center px-2 min-w-0 w-full justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                            {task.assigneeType === 'TEAM' ? (
                                <Users className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-550" />
                            ) : (
                                <JobIcon className="w-3.5 h-3.5 mr-1.5 opacity-60 shrink-0 text-slate-550" />
                            )}
                            <span className={`font-bold truncate text-slate-800 ${isFocused ? 'text-xs whitespace-normal line-clamp-2 leading-tight' : 'text-[10px] whitespace-nowrap'}`}>
                                {task.title}
                            </span>
                        </div>
                        
                        {/* Little Indicators */}
                        <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
                            {task.is_penalized && (
                                <ShieldAlert className="w-3 h-3 text-red-650 shrink-0 animate-[pulse_1s_infinite]" />
                            )}
                            {isOverdue && (
                                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                            )}
                            {isInsightOverdue && (
                                <Clock8 className="w-3 h-3 text-rose-500 shrink-0" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: motionYInitial }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: motionYExit }}
                        transition={{ type: 'spring', damping: 18, stiffness: 350 }}
                        className={popoverPositionClass}
                    >
                        {/* Urgent / Overdue & SLA Warnings Header */}
                        <div className="flex flex-col gap-1.5">
                            {isOverdue && (
                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-[11px] leading-tight shadow-[0_2px_8px_rgba(239,68,68,0.06)]">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    <span>งานตกค้างเกินกำหนด! ({overdueDays} วัน)</span>
                                </div>
                            )}

                            {isInsightOverdue && (
                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-[11px] leading-tight shadow-[0_2px_8px_rgba(244,63,94,0.06)]">
                                    <Clock8 className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span>ค้างสรุปรายงานสถิติ! (เกิน 7 วัน)</span>
                                </div>
                            )}

                            {task.is_penalized && (
                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px] leading-tight shadow-[0_2px_8px_rgba(245,158,11,0.06)] animate-pulse">
                                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>แจ้งเตือน: ตรวจพบการลงโทษด้านวินัย SLA</span>
                                </div>
                            )}
                        </div>

                        {/* Task Title Area */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-extrabold tracking-widest text-indigo-500 uppercase select-none">
                                    {task.type === 'CONTENT' ? '🔮 CONTENT PLAN' : '⚙️ SUB TASK'}
                                </span>
                                
                                {task.sponsorship?.isSponsored && (
                                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[9px] font-black tracking-wider animate-[pulse_1.5s_infinite]">
                                        <Coins className="w-2.5 h-2.5 text-amber-500" /> SPONSORED
                                    </span>
                                )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-3 leading-relaxed">
                                {task.title}
                            </h4>
                        </div>

                        {/* Mid Divider */}
                        <div className="h-px bg-slate-100" />

                        {/* Bento Dashboard Attribute Matrix */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            {/* Status */}
                            <div className="bg-slate-50/70 border border-slate-100 p-2 rounded-xl flex flex-col justify-between gap-1">
                                <span className="text-slate-400 text-[10px] font-medium">สถานะ</span>
                                <span className={`self-start px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusColor}`}>
                                    {isOverdue ? (isCriticalOverdue ? 'STUCK' : 'OVERDUE') : statusLabel}
                                </span>
                            </div>

                            {/* Priority */}
                            <div className="bg-slate-50/70 border border-slate-100 p-2 rounded-xl flex flex-col justify-between gap-1">
                                <span className="text-slate-400 text-[10px] font-medium">ความสำคัญ</span>
                                <span className={`self-start px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                    task.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-200 shadow-[0_1px_4px_rgba(239,68,68,0.1)]' :
                                    task.priority === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                    task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                    {task.priority || 'NORMAL'}
                                </span>
                            </div>

                            {/* Target Channel */}
                            <div className="bg-slate-50/70 border border-slate-100 p-2 rounded-xl flex flex-col justify-between gap-1">
                                <span className="text-slate-400 text-[10px] font-medium">ช่องทางเผยแพร่</span>
                                {task.channelId && channels ? (
                                    (() => {
                                        const ch = channels.find(c => c.id === task.channelId);
                                        return ch ? (
                                            <span 
                                                className="self-start px-2 py-0.5 rounded-lg text-[10px] font-bold border truncate max-w-full"
                                                style={{ 
                                                    backgroundColor: ch.color?.startsWith('#') ? `${ch.color}15` : undefined,
                                                    borderColor: ch.color?.startsWith('#') ? `${ch.color}40` : undefined,
                                                    color: ch.color?.startsWith('#') ? ch.color : undefined
                                                }}
                                            >
                                                {ch.name}
                                            </span>
                                        ) : <span className="text-slate-400 font-bold">-</span>;
                                    })()
                                ) : (
                                    <span className="text-slate-400 font-bold">-</span>
                                )}
                            </div>

                            {/* Assignees Info */}
                            <div className="bg-slate-50/70 border border-slate-100 p-2 rounded-xl flex flex-col justify-between gap-1">
                                <span className="text-slate-400 text-[10px] font-medium">ผู้ทำงานรับผิดชอบ</span>
                                <span className="flex items-center gap-1 font-bold text-slate-700">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                        <span>{task.assigneeIds.length} คน</span>
                                    ) : (
                                        <span className="text-slate-400 font-normal">-</span>
                                    )}
                                </span>
                            </div>

                            {/* Estimated Hours */}
                            <div className="bg-slate-50/70 border border-slate-100 p-2 rounded-xl flex flex-col justify-between gap-1">
                                <span className="text-slate-400 text-[10px] font-medium">ระยะเวลาประเมิน</span>
                                {task.estimatedHours !== undefined ? (
                                    <span className="font-mono text-slate-700 font-bold text-[10.5px]">
                                        ⏱️ {task.estimatedHours} ชม.
                                    </span>
                                ) : (
                                    <span className="text-slate-400 font-normal">-</span>
                                )}
                            </div>

                            {/* Difficulty */}
                            <div className="bg-slate-50/70 border border-slate-100 p-2 rounded-xl flex flex-col justify-between gap-1">
                                <span className="text-slate-400 text-[10px] font-medium">ความยากความซับซ้อน</span>
                                <span className={`self-start px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                    task.difficulty === 'HARD' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                    task.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                                }`}>
                                    {task.difficulty || 'EASY'}
                                </span>
                            </div>
                        </div>

                        {/* Extended Enterprise Metrics Room (SLA Rework, Sponsorship Details, Shoot Area) */}
                        {((task.sla_revert_count && task.sla_revert_count > 0) || 
                          (task.sponsorship?.isSponsored) ||
                          (task.type === 'CONTENT' && (task.shootLocation || task.shootNotes))) && (
                            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-indigo-50/30 border border-indigo-50/60 text-[11px] text-slate-700">
                                {/* SLA Rework */}
                                {task.sla_revert_count !== undefined && task.sla_revert_count > 0 && (
                                    <div className="flex items-center justify-between text-indigo-500 font-semibold">
                                        <span className="flex items-center gap-1">
                                            <Award className="w-3.5 h-3.5 text-indigo-500" />
                                            รีเวิร์คสะสม:
                                        </span>
                                        <span className="font-mono text-red-600 font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                                            {task.sla_revert_count} รอบ
                                        </span>
                                    </div>
                                )}

                                {/* Sponsor Details */}
                                {task.sponsorship?.isSponsored && (
                                    <div className="flex items-center justify-between font-semibold">
                                        <span className="flex items-center gap-1 text-amber-750">
                                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                                            พาร์ทเนอร์สปอนเซอร์:
                                        </span>
                                        <span className="text-amber-800 text-[10.5px] truncate max-w-[140px]" title={task.sponsorship?.client?.name}>
                                            {task.sponsorship?.client?.name || 'มีผู้สนับสนุน'}
                                        </span>
                                    </div>
                                )}

                                {/* Shoot Location / Info */}
                                {task.type === 'CONTENT' && (task.shootLocation || task.shootNotes) && (
                                    <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-100/50 mt-1">
                                        {task.shootLocation && (
                                            <div className="flex items-start gap-1 text-slate-600">
                                                <MapPin className="w-3.5 h-3.5 text-rose-450 shrink-0 mt-0.5" />
                                                <span className="truncate" title={task.shootLocation}>
                                                    <b>สถานที่ถ่ายทำ:</b> {task.shootLocation}
                                                </span>
                                            </div>
                                        )}
                                        {task.shootNotes && (
                                            <div className="flex items-start gap-1 text-[10px] text-slate-500 leading-normal pl-4 bg-slate-50 border border-slate-100/30 py-1 px-1.5 rounded-lg">
                                                <span>{task.shootNotes}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Review History Status */}
                        {task.reviews && task.reviews.length > 0 && (
                            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                                <span className="text-slate-500 flex items-center gap-1 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    การส่งตรวจงาน:
                                </span>
                                <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[10px]">
                                    ส่งแล้ว {task.reviews.length} รอบ
                                </span>
                            </div>
                        )}

                        {/* Date Intervals */}
                        {(startDateObj || endDateObj) && (
                            <div className="flex flex-col gap-1 pt-2 border-t border-dashed border-slate-100">
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    ระยะเวลากำหนดการปฏิบัติงาน:
                                </span>
                                <span className="font-mono font-medium text-slate-600 text-[10.5px] pl-4">
                                    {startDateObj ? format(startDateObj, 'dd/MM/yyyy') : '-'} — {endDateObj ? format(endDateObj, 'dd/MM/yyyy') : '-'}
                                </span>
                            </div>
                        )}

                        {/* Aesthetic Footer Decor Tip */}
                        <div className="text-[9.5px] text-slate-400 italic text-center border-t border-slate-100/50 pt-2 shrink-0 flex items-center justify-center gap-1 select-none">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>คลิกเพื่อเปิดดูแบบเต็มและจัดการสถิติ</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamTaskPill;

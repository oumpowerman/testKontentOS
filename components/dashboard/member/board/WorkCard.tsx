
import React from 'react';
import { motion } from 'framer-motion';
import { Task, User, Status, MasterOption } from '../../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../../constants';
import { Clock, ArrowRight, Zap, MonitorPlay, CheckSquare, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { format, addDays, isBefore, isWeekend, startOfDay } from 'date-fns';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { useMasterDataContext } from '../../../../context/MasterDataContext';
import { useGameConfig } from '../../../../context/GameConfigContext';
import { isHolidayOrException, isWorkingDay, getNextWorkingDay, countWorkingDaysBetween } from '../../../../utils/judgeUtils';

const getPremiumStatusStyle = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('IDEA')) return 'bg-slate-50 text-slate-600 border-slate-200/60';
    if (s.includes('SCRIPT')) return 'bg-amber-50/70 text-amber-750 border-amber-200/40';
    if (s.includes('SHOOTING')) return 'bg-orange-50/70 text-orange-755 border-orange-200/40';
    if (s.includes('EDIT_CLIP') || s.includes('CLIP')) return 'bg-cyan-50/80 text-cyan-750 border-cyan-200/40';
    if (s.includes('FEEDBACK')) return 'bg-rose-50/70 text-rose-650 border-rose-100/70';
    if (s === 'EDIT_DRAFT_1') return 'bg-indigo-50/70 text-indigo-650 border-indigo-100';
    if (s === 'FEEDBACK_1') return 'bg-purple-50/70 text-purple-650 border-purple-100';
    if (s === 'EDIT_DRAFT_2') return 'bg-violet-50/70 text-violet-650 border-violet-100';
    if (s.includes('APPROVE')) return 'bg-emerald-50 text-emerald-750 border-emerald-250/50 font-medium';
    if (s.includes('DONE')) return 'bg-green-50 text-green-750 border-green-250/50 font-medium';
    if (s.includes('TODO')) return 'bg-blue-50/70 text-blue-650 border-blue-200/40';
    if (s.includes('DOING')) return 'bg-indigo-50/80 text-indigo-750 border-indigo-200/50 shadow-sm shadow-indigo-100/30';
    if (s.includes('REVISE')) return 'bg-yellow-50/70 text-yellow-750 border-yellow-250/40';
    if (s.includes('BLOCKED')) return 'bg-red-50 text-red-750 border-red-250/40';
    
    return 'bg-slate-50 text-slate-700 border-slate-200/60';
};

const getPremiumPriorityStyle = (priority: string) => {
    const p = (priority || 'MEDIUM').toUpperCase();
    if (p === 'LOW') return 'bg-slate-50/60 text-slate-500 border-slate-200/40';
    if (p === 'MEDIUM') return 'bg-sky-50/60 text-sky-650 border-sky-200/40';
    if (p === 'HIGH') return 'bg-amber-50/80 text-amber-750 border-amber-200/40';
    if (p === 'URGENT') return 'bg-rose-55/90 text-rose-700 border-rose-200/60 animate-pulse font-bold';
    return 'bg-slate-50 text-slate-400 border-slate-100';
};

const getPriorityEmoji = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'LOW') return '🍹';
    if (p === 'MEDIUM') return '🙂';
    if (p === 'HIGH') return '⚡';
    if (p === 'URGENT') return '🔥';
    return '';
};

interface WorkCardProps {
    task: Task;
    users: User[];
    masterOptions: MasterOption[]; // Add Prop
    isDraggable: boolean;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    columnType: 'TODO' | 'DOING' | 'WAITING' | 'DONE';
    isUltimate?: boolean;
}

const WorkCard = React.memo(
    React.forwardRef<HTMLDivElement, WorkCardProps>(
        ({ 
            task, users, masterOptions, isDraggable, onDragStart, onClick, onDelete, columnType, isUltimate = false 
        }, ref) => {
            const { showConfirm } = useGlobalDialog();
            const assigneeId = task.assigneeIds?.[0] || task.ideaOwnerIds?.[0];
            const user = users.find(u => u.id === assigneeId);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onDelete) return;

        const confirmed = await showConfirm(
            `คุณแน่ใจหรือไม่ว่าต้องการลบงาน "${task.title}"?`,
            'ยืนยันการลบงาน 🗑️'
        );

        if (confirmed) {
            onDelete(task.id);
        }
    };

    // --- Type Config ---
    const isContent = task.type === 'CONTENT';
    const typeConfig = isContent ? {
        borderClass: 'border-l-[5px] border-l-purple-400',
        icon: <MonitorPlay className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />,
        badgeTheme: 'text-purple-600 bg-purple-50 border-purple-100'
    } : {
        borderClass: 'border-l-[5px] border-l-blue-400',
        icon: <CheckSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />,
        badgeTheme: 'text-blue-600 bg-blue-50 border-blue-100'
    };

    // --- Status Label Helper ---
    const getStatusLabel = (status: string) => {
        // 1. Try to find label from Master Options
        const masterStatus = masterOptions.find(opt => 
            (opt.type === 'CONTENT_STATUS' || opt.type === 'TASK_STATUS') && 
            opt.key === status
        );
        
        // 2. Fallback to STATUS_LABELS or raw status
        return masterStatus?.label || STATUS_LABELS[status as Status] || status;
    };

    const statusLabel = getStatusLabel(task.status);
    const { annualHolidays, calendarExceptions } = useMasterDataContext();
    const { config } = useGameConfig();

    // --- Deadline Warning Logic (Working Days Aware) ---
    const deadlineStatus = React.useMemo(() => {
        if (!task.endDate || columnType === 'DONE' || columnType === 'WAITING') {
            return { level: 0, label: '' };
        }

        const deadline = new Date(task.endDate);
        if (isNaN(deadline.getTime())) return { level: 0, label: '' };

        const now = new Date();
        const today = startOfDay(now);
        const targetDate = startOfDay(deadline);

        // 1. Check Today or Overdue
        if (today >= targetDate) {
            return { level: 2, label: today > targetDate ? 'เลยกำหนด!' : 'ส่งวันนี้!' };
        }

        // 2. Check "Next Working Day" (Traditional "Due Tomorrow" logic)
        const nextWorkingDay = getNextWorkingDay(today, annualHolidays, calendarExceptions || [], user || null);
        if (format(targetDate, 'yyyy-MM-dd') === format(nextWorkingDay, 'yyyy-MM-dd')) {
            return { level: 1, label: 'ส่งวันทำงานถัดไป!' };
        }

        // 3. Check "Working Days Remaining" (If close enough)
        const workingDaysLeft = countWorkingDaysBetween(today, targetDate, annualHolidays, calendarExceptions || [], user || null);
        if (workingDaysLeft <= 3 && workingDaysLeft > 0) {
            return { level: 1, label: `อีก ${workingDaysLeft} วันทำงาน` };
        }

        return { level: 0, label: '' };
    }, [task.endDate, columnType, annualHolidays, calendarExceptions, user]);

    // --- SLA Warning Logic (3-Tier Dynamic) ---
    const slaStatus = React.useMemo(() => {
        if (columnType !== 'WAITING' || !task.updatedAt || !annualHolidays || !config?.REVIEW_JUDGE_CONFIG) {
            return { level: 0, days: 0 };
        }
        
        const expiryDays = config.REVIEW_JUDGE_CONFIG.expiry_days || 3;
        const submissionDate = new Date(task.updatedAt);
        const now = new Date();
        
        let workingDaysPassed = 0;
        let current = addDays(submissionDate, 1);
        
        // Count working days passed since submission
        while (isBefore(current, now)) {
            if (isWorkingDay(current, annualHolidays, calendarExceptions || [], null)) {
                workingDaysPassed++;
            }
            current = addDays(current, 1);
        }
        
        // Level 3: Overdue / Critical (Scary Mode)
        if (workingDaysPassed >= expiryDays) return { level: 3, days: workingDaysPassed };
        // Level 2: 1 day before expiry
        if (workingDaysPassed === expiryDays - 1 && workingDaysPassed > 0) return { level: 2, days: workingDaysPassed };
        // Level 1: 2 days before expiry
        if (workingDaysPassed === expiryDays - 2 && workingDaysPassed > 0) return { level: 1, days: workingDaysPassed };
        
        return { level: 0, days: workingDaysPassed };
    }, [columnType, task.updatedAt, annualHolidays, config?.REVIEW_JUDGE_CONFIG]);

    // Visual styles based on column
    let cardStyle = isUltimate 
        ? 'bg-gradient-to-br from-slate-900 to-[#121424]/90 border border-slate-800 text-white shadow-md'
        : 'bg-gradient-to-br from-white to-slate-50/30 border-y border-r border-slate-200/70 shadow-sm'; 
    
    if (columnType === 'DOING') {
        cardStyle = isUltimate
            ? 'bg-gradient-to-br from-[#121424] to-[#1a1f38] border-2 border-indigo-500/35 shadow-lg shadow-indigo-950/40 text-white ring-1 ring-indigo-500/10'
            : 'bg-gradient-to-br from-white to-indigo-50/10 border-y-2 border-r-2 border-indigo-200/70 shadow-md ring-1 ring-indigo-100/40 shadow-indigo-100/60';
    } else if (columnType === 'WAITING') {
        // Scary Mode for Level 3
        if (slaStatus.level === 3) {
            cardStyle = isUltimate
                ? 'bg-gradient-to-br from-rose-950/40 to-rose-900/50 border-2 border-rose-500 shadow-lg shadow-rose-950/45 text-rose-250 font-bold'
                : 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-2 border-rose-400 shadow-lg shadow-rose-200';
        } else {
            cardStyle = isUltimate
                ? 'bg-gradient-to-br from-[#121424] to-[#1d1911] border border-amber-500/25 text-white shadow-md'
                : 'bg-gradient-to-br from-white to-amber-50/20 border border-amber-200/40 shadow-sm';
        }
    } else if (columnType === 'DONE') {
        cardStyle = isUltimate
            ? 'bg-gradient-to-br from-slate-950 to-[#0e101a]/70 border border-slate-800/60 opacity-60 grayscale-[0.1] shadow-none text-slate-400'
            : 'bg-gradient-to-br from-white to-slate-100/50 border border-slate-200/30 opacity-75 grayscale-[0.3] shadow-none';
    }

    const hoverStyle = isDraggable 
        ? 'cursor-grab active:cursor-grabbing' 
        : 'cursor-pointer';

    return (
        <motion.div 
            ref={ref}
            layoutId={task.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ 
                y: -4,
                scale: 1.015,
                boxShadow: "0 12px 20px -8px rgba(99, 102, 241, 0.12), 0 4px 6px -4px rgba(99, 102, 241, 0.08)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            draggable={isDraggable}
            onDragStart={(e: any) => onDragStart(e, task.id)}
            onClick={() => onClick(task)}
            className={`
                relative p-4 rounded-r-2xl rounded-l-md transition-all duration-200 flex flex-col gap-2 mb-3 group overflow-hidden
                ${cardStyle}
                ${hoverStyle}
                ${typeConfig.borderClass}
                ${isUltimate ? 'hover:border-indigo-500/40' : 'hover:border-indigo-200'}
            `}
        >
            <div className="flex flex-wrap justify-between items-center gap-1.5 mb-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border truncate max-w-[120px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${getPremiumStatusStyle(task.status)}`}>
                        {statusLabel}
                    </span>
                    {task.priority && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${getPremiumPriorityStyle(task.priority)}`}>
                            {getPriorityEmoji(task.priority)} {task.priority}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* SLA Revert Count Badge */}
                    {task.sla_revert_count !== undefined && task.sla_revert_count > 0 && (
                        <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${
                            task.sla_revert_count >= 3 
                                ? 'text-rose-650 bg-rose-50 border-rose-250 animate-pulse' 
                                : 'text-amber-655 bg-amber-50 border-amber-250'
                        }`} title={`งานนี้ถูกระบบดีดกลับอัตโนมัติมาแล้ว ${task.sla_revert_count} ครั้ง`}>
                            <RefreshCw className={`w-3 h-3 ${task.sla_revert_count >= 3 ? 'animate-spin-slow' : ''}`} />
                            <span className="font-extrabold">{task.sla_revert_count}</span>
                            {task.sla_revert_count >= 3 && <span className="text-[8px] tracking-tight font-black ml-0.5">NO XP</span>}
                        </div>
                    )}

                    {/* Deadline Warning Badge */}
                    {(columnType === 'TODO' || columnType === 'DOING') && deadlineStatus.level > 0 && (
                        <div className={`
                            flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.01)]
                            ${deadlineStatus.level === 1 ? 'text-amber-650 bg-amber-50 border-amber-250/60' : ''}
                            ${deadlineStatus.level === 2 ? 'text-rose-600 bg-rose-50 border-rose-250 animate-pulse' : ''}
                        `}>
                            {deadlineStatus.level === 1 ? <Clock className="w-3 h-3 text-amber-500" /> : <AlertCircle className="w-3 h-3 text-rose-500" />}
                            <span className="font-extrabold">{deadlineStatus.label}</span>
                        </div>
                    )}
                    
                    {/* Icons based on state */}
                    {columnType === 'DOING' && (
                         <div className="flex items-center gap-1 text-[9px] font-extrabold text-indigo-600 bg-indigo-50/80 border border-indigo-250 px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(99,102,241,0.04)] animate-pulse">
                            <Zap className="w-3 h-3 fill-indigo-550 text-indigo-550" /> Active
                         </div>
                    )}
                    {columnType === 'WAITING' && (
                        <div className="flex items-center gap-1.5">
                            {slaStatus.level > 0 && (
                                <div className={`
                                    flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.01)]
                                    ${slaStatus.level === 1 ? 'text-amber-655 bg-amber-50 border-amber-200/60' : ''}
                                    ${slaStatus.level === 2 ? 'text-orange-650 bg-orange-50 border-orange-200 animate-pulse font-bold' : ''}
                                    ${slaStatus.level === 3 ? 'text-rose-600 bg-rose-50 border-rose-200 animate-bounce shadow-sm font-black' : ''}
                                `}>
                                    <AlertCircle className="w-3 h-3 shrink-0" /> 
                                    <span>
                                        {slaStatus.level === 1 && "Admin เริ่มตรวจช้า"}
                                        {slaStatus.level === 2 && "พรุ่งนี้ดีดกลับ!"}
                                        {slaStatus.level === 3 && "SLA EXPIRED!"}
                                    </span>
                                </div>
                            )}
                            <Clock className={`w-3.5 h-3.5 ${slaStatus.level === 3 ? 'text-rose-500' : 'text-orange-400'}`} />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Title with Type Icon */}
            <div className="flex items-start gap-2.5 my-1">
                <div className={`p-1 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${isUltimate ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-100'}`}>
                    {typeConfig.icon}
                </div>
                <h4 className={`
                    font-bold text-sm line-clamp-2 leading-snug transition-colors pt-0.5
                    ${columnType === 'DOING' 
                        ? (isUltimate ? 'text-indigo-200 group-hover:text-indigo-100' : 'text-indigo-900 group-hover:text-indigo-600') 
                        : (isUltimate ? 'text-slate-200 group-hover:text-white' : 'text-slate-700')}
                    ${columnType === 'DONE' ? 'line-through decoration-slate-500 text-slate-500' : ''}
                `}>
                    {task.title}
                </h4>
            </div>
 
            <div className={`flex justify-between items-center pt-2.5 border-t mt-1 ${isUltimate ? 'border-slate-800/80' : 'border-slate-100/80'}`}>
                <div className="flex items-center gap-2">
                    {user ? (
                        <img src={user.avatarUrl} className={`w-5 h-5 rounded-full object-cover border shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${isUltimate ? 'border-indigo-500/30' : 'border-slate-200'}`} title={user.name} />
                    ) : (
                        <div className={`w-5 h-5 rounded-full ${isUltimate ? 'bg-slate-900' : 'bg-slate-100'}`}></div>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        isUltimate 
                            ? 'text-indigo-300 bg-indigo-950/40 border-indigo-500/20' 
                            : 'text-zinc-400 bg-zinc-50 border-zinc-100/50'
                    }`}>
                        📅 {task.endDate ? format(new Date(task.endDate), 'd MMM') : 'No Date'}
                    </span>
                </div>
 
                {/* Additional badge for Content Format if available */}
                {task.contentFormats && task.contentFormats.length > 0 && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold max-w-[85px] truncate shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${
                        isUltimate
                            ? 'text-purple-300 bg-purple-950/40 border-purple-800/30'
                            : typeConfig.badgeTheme
                    }`}>
                        {task.contentFormats[0]}
                    </span>
                )}
 
                <div className="flex items-center gap-1">
                    {onDelete && (
                        <button 
                            onClick={handleDelete}
                            className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                                isUltimate 
                                    ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/20' 
                                    : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                            }`}
                            title="ลบงาน"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
 
                    {columnType !== 'DONE' && columnType !== 'WAITING' && (!task.contentFormats || task.contentFormats.length === 0) && (
                        <div className={`p-1 rounded-full transition-colors ${
                            columnType === 'DOING' 
                                ? (isUltimate ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-550') 
                                : (isUltimate ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-300')
                        }`}>
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}));

export default WorkCard;

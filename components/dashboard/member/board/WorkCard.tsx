
import React from 'react';
import { Task, User, Status, MasterOption } from '../../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../../constants';
import { Clock, ArrowRight, Zap, MonitorPlay, CheckSquare, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { format, addDays, isBefore, isWeekend, startOfDay } from 'date-fns';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { useMasterDataContext } from '../../../../context/MasterDataContext';
import { useGameConfig } from '../../../../context/GameConfigContext';
import { isHolidayOrException, isWorkingDay, getNextWorkingDay, countWorkingDaysBetween } from '../../../../utils/judgeUtils';

interface WorkCardProps {
    task: Task;
    users: User[];
    masterOptions: MasterOption[]; // Add Prop
    isDraggable: boolean;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onClick: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    columnType: 'TODO' | 'DOING' | 'WAITING' | 'DONE';
}

const WorkCard: React.FC<WorkCardProps> = React.memo(({ task, users, masterOptions, isDraggable, onDragStart, onClick, onDelete, columnType }) => {
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
    let cardStyle = 'bg-white border-y border-r border-gray-200'; 
    
    if (columnType === 'DOING') {
        cardStyle = 'bg-white border-y-2 border-r-2 border-indigo-100 shadow-md ring-1 ring-indigo-50';
    } else if (columnType === 'WAITING') {
        // Scary Mode for Level 3
        if (slaStatus.level === 3) {
            cardStyle = 'bg-rose-50 border-2 border-rose-400 shadow-lg shadow-rose-200 animate-pulse';
        } else {
            cardStyle = 'bg-orange-50/50 border-y border-r border-orange-100';
        }
    } else if (columnType === 'DONE') {
        cardStyle = 'bg-white border-y border-r border-gray-100 opacity-80 grayscale-[0.3]';
    }

    const hoverStyle = isDraggable 
        ? 'hover:border-indigo-300 hover:shadow-lg cursor-grab active:cursor-grabbing hover:-translate-y-1' 
        : 'hover:border-gray-400 cursor-pointer';

    return (
        <div 
            draggable={isDraggable}
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={() => onClick(task)}
            className={`
                relative p-4 rounded-r-2xl rounded-l-md transition-all duration-200 flex flex-col gap-2 mb-3 group overflow-hidden
                ${cardStyle}
                ${hoverStyle}
                ${typeConfig.borderClass}
            `}
        >
            <div className="flex justify-between items-start">
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border truncate max-w-[120px] ${STATUS_COLORS[task.status as Status] || 'bg-gray-100'}`}>
                    {statusLabel}
                </span>

                {/* SLA Revert Count Badge */}
                {task.sla_revert_count !== undefined && task.sla_revert_count > 0 && (
                    <div className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                        task.sla_revert_count >= 3 
                            ? 'text-rose-600 bg-rose-50 border-rose-200' 
                            : 'text-amber-600 bg-amber-50 border-amber-200'
                    }`} title={`งานนี้ถูกระบบดีดกลับอัตโนมัติมาแล้ว ${task.sla_revert_count} ครั้ง`}>
                        <RefreshCw className={`w-3 h-3 ${task.sla_revert_count >= 3 ? 'animate-spin-slow' : ''}`} />
                        {task.sla_revert_count}
                        {task.sla_revert_count >= 3 && " (NO XP)"}
                    </div>
                )}

                {/* Deadline Warning Badge */}
                {(columnType === 'TODO' || columnType === 'DOING') && deadlineStatus.level > 0 && (
                    <div className={`
                        flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border transition-all duration-300
                        ${deadlineStatus.level === 1 ? 'text-amber-600 bg-amber-50 border-amber-200' : ''}
                        ${deadlineStatus.level === 2 ? 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse' : ''}
                    `}>
                        {deadlineStatus.level === 1 ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {deadlineStatus.label}
                    </div>
                )}
                
                {/* Icons based on state */}
                {columnType === 'DOING' && (
                     <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                        <Zap className="w-3 h-3" /> Active
                     </div>
                )}
                {columnType === 'WAITING' && (
                    <div className="flex items-center gap-1">
                        {slaStatus.level > 0 && (
                            <div className={`
                                flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border transition-all duration-300
                                ${slaStatus.level === 1 ? 'text-amber-600 bg-amber-50 border-amber-200' : ''}
                                ${slaStatus.level === 2 ? 'text-orange-600 bg-orange-100 border-orange-200 animate-pulse' : ''}
                                ${slaStatus.level === 3 ? 'text-rose-600 bg-rose-100 border-rose-300 animate-bounce shadow-sm' : ''}
                            `}>
                                <AlertCircle className="w-3 h-3" /> 
                                {slaStatus.level === 1 && "⚠️ Admin เริ่มตรวจช้า"}
                                {slaStatus.level === 2 && "🟠 พรุ่งนี้งานจะถูกดีดกลับ!"}
                                {slaStatus.level === 3 && "🚨 SLA EXPIRED: ตามด่วน!"}
                            </div>
                        )}
                        <Clock className={`w-3.5 h-3.5 ${slaStatus.level === 3 ? 'text-rose-500' : 'text-orange-400'}`} />
                    </div>
                )}
            </div>
            
            {/* Title with Type Icon */}
            <div className="flex items-start gap-2">
                {typeConfig.icon}
                <h4 className={`
                    font-bold text-sm line-clamp-2 leading-snug transition-colors
                    ${columnType === 'DOING' ? 'text-indigo-900 group-hover:text-indigo-600' : 'text-gray-700'}
                    ${columnType === 'DONE' ? 'line-through decoration-gray-400 text-gray-400' : ''}
                `}>
                    {task.title}
                </h4>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-50/50 mt-1">
                <div className="flex items-center gap-2">
                    {user ? (
                        <img src={user.avatarUrl} className="w-5 h-5 rounded-full object-cover border border-gray-200" title={user.name} />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100"></div>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium">
                        {task.endDate ? format(new Date(task.endDate), 'd MMM') : 'No Date'}
                    </span>
                </div>

                {/* Additional badge for Content Format if available */}
                {task.contentFormat && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold ${typeConfig.badgeTheme} max-w-[80px] truncate`}>
                        {task.contentFormat}
                    </span>
                )}

                <div className="flex items-center gap-1">
                    {onDelete && (
                        <button 
                            onClick={handleDelete}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="ลบงาน"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {columnType !== 'DONE' && columnType !== 'WAITING' && !task.contentFormat && (
                        <div className={`p-1 rounded-full transition-colors ${columnType === 'DOING' ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-50 text-gray-300'}`}>
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default WorkCard;

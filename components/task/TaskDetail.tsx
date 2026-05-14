
import React from 'react';
import { MessageSquare, Paperclip, AlertCircle, Flag } from 'lucide-react';
import { Task, User, MasterOption } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, Variants } from 'framer-motion';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import TaskDetailHeader from './detail/TaskDetailHeader';
import TaskInfoView from './detail/TaskInfoView';

interface TaskDetailProps {
    task: Task;
    users: User[];
    masterOptions: MasterOption[];
    onEdit: () => void;
    onDelete?: () => void;
    onClose: () => void;
    onOpenTask?: (task: Task, currentViewMode?: string) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ 
    task, users, masterOptions, onEdit, onDelete, onClose, onOpenTask 
}) => {
    const { showConfirm, showAlert } = useGlobalDialog();
    
    const getPriorityInfo = (priority?: string) => {
        if (!priority) return { label: 'ปกติ', color: 'slate', icon: Flag };
        switch (priority) {
            case 'URGENT': return { label: 'ด่วนที่สุด', color: 'rose', icon: AlertCircle };
            case 'HIGH': return { label: 'สำคัญมาก', color: 'orange', icon: Flag };
            case 'MEDIUM': return { label: 'ปกติ', color: 'indigo', icon: Flag };
            case 'LOW': return { label: 'ต่ำ', color: 'slate', icon: Flag };
            default: return { label: priority, color: 'slate', icon: Flag };
        }
    };

    const getDifficultyLevel = (difficulty?: string) => {
        switch (difficulty) {
            case 'EASY': return 1;
            case 'MEDIUM': return 3;
            case 'HARD': return 5;
            default: return 0;
        }
    };

    const priorityInfo = getPriorityInfo(task.priority);
    const difficultyLevel = getDifficultyLevel(task.difficulty);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const sectionVariants: Variants = {
        hidden: { opacity: 0, scale: 0.98, y: 15 },
        visible: { 
            opacity: 1, 
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 20, stiffness: 120 }
        }
    };

    const bouncyHover = {
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 12 }
    } as const;

    const handleDeleteClick = async () => {
        if (!onDelete) return;
        const confirm = await showConfirm(
            `คุณแน่ใจว่าต้องการลบรายการ "${task.title}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
            'ยืนยันการลบรายการ'
        );
        if (confirm) {
            onDelete();
        }
    };

    const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(false);

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col h-full bg-[#FCFDFE] text-slate-700"
        >
            <TaskDetailHeader 
                task={task}
                users={users}
                isExpanded={isHeaderExpanded}
                setIsExpanded={setIsHeaderExpanded}
                onEdit={onEdit}
                onDeleteClick={handleDeleteClick}
            />

            <TaskInfoView
                task={task}
                users={users}
                difficultyLevel={difficultyLevel}
                showAlert={showAlert}
                onOpenTask={onOpenTask}
                priorityInfo={priorityInfo}
                sectionVariants={sectionVariants}
                bouncyHover={bouncyHover}
            />

            {/* --- MINIMAL FOOTER --- */}
            <div className="px-4 sm:px-10 py-3 sm:py-6 bg-white border-t border-slate-50 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-center shrink-0">
                <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                    {task.createdAt && (
                        <div className="flex flex-col shrink-0">
                            <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Created At</span>
                            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tighter sm:tracking-normal">{format(new Date(task.createdAt), 'd MMM yy, HH:mm', { locale: th })}</span>
                        </div>
                    )}
                    <div className="w-px h-6 bg-slate-100 shrink-0" />
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
                            <MessageSquare className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider">0 Comments</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
                            <Paperclip className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider">{task.assets?.length || 0} Assets</span>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={onClose}
                    className="hidden sm:block px-8 py-3 bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                >
                    Close Window
                </button>
            </div>
        </motion.div>
    );
};

export default TaskDetail;

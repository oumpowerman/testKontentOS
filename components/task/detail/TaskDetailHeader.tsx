import React from 'react';
import { Zap, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import { Task, User } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDetailHeaderProps {
    task: Task;
    users: User[];
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    onEdit: () => void;
    onDeleteClick: () => void;
}

const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({
    task,
    users,
    isExpanded,
    setIsExpanded,
    onEdit,
    onDeleteClick
}) => {
    const getUserById = (id: string) => users.find(u => u.id === id);

    const bouncyHover = {
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 12 }
    } as const;

    return (
        <motion.div 
            layout
            animate={{ 
                height: isExpanded ? 'auto' : 46,
            }}
            transition={{
                height: { type: 'spring', damping: 25, stiffness: 120 }
            }}
            className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] overflow-hidden relative"
        >
            {/* Rainbow Rail Anchor */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 opacity-80" />

            <AnimatePresence initial={false}>
                {!isExpanded ? (
                    <motion.div 
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setIsExpanded(true)}
                        className="h-[44px] flex items-center justify-between px-6 cursor-pointer hover:bg-slate-50/50 transition-colors group absolute inset-0 z-10"
                    >
                        <div className="flex items-center gap-3">
                            <motion.div 
                                className={`w-7 h-7 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100/40`}
                            >
                                <Zap className="w-3.5 h-3.5" />
                            </motion.div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                MORE TASK INFORMATION
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 mr-2">
                                {task.assigneeIds?.slice(0, 3).map((id, index) => {
                                    const user = getUserById(id);
                                    return user ? (
                                        <img 
                                            key={id} 
                                            src={user.avatarUrl} 
                                            alt={user.name} 
                                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                                            style={{ zIndex: 3 - index }}
                                        />
                                    ) : null;
                                })}
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors uppercase tracking-tight">Tap to reveal info</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400" />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="px-4 sm:px-8 py-2.5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                        >
                            <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                                <motion.div 
                                    onClick={() => setIsExpanded(false)}
                                    whileHover={{ rotate: -8, scale: 1.15 }}
                                    className={`
                                        w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-[1.25rem] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)]
                                        bg-slate-50 text-slate-400 border border-slate-100 shrink-0 cursor-pointer
                                    `}
                                >
                                    <Zap className="w-5 h-5 sm:w-7 sm:h-7" />
                                </motion.div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <div className="flex -space-x-2">
                                            {task.assigneeIds?.slice(0, 3).map((id, index) => {
                                                const user = getUserById(id);
                                                return user ? (
                                                    <img 
                                                        key={id} 
                                                        src={user.avatarUrl} 
                                                        alt={user.name} 
                                                        className="w-7 h-7 rounded-full border-2 border-white shadow-sm" 
                                                        style={{ zIndex: 3 - index }}
                                                    />
                                                ) : null;
                                            })}
                                            {task.assigneeIds && task.assigneeIds.length > 3 && (
                                                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 z-0">
                                                    +{task.assigneeIds.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => setIsExpanded(false)}
                                            className="text-[12px] font-medium text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-tight px-2 py-0.5 bg-indigo-50/50 rounded-md"
                                        >
                                            Hide header
                                        </button>
                                    </div>
                                </div>
                            </div>
    
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                                {task.type && (
                                    <motion.button 
                                        whileHover={{ scale: 1.1, color: '#f43f5e' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onDeleteClick}
                                        className="p-1.5 sm:p-3 text-slate-300 hover:bg-rose-50 rounded-xl sm:rounded-2xl transition-all shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </motion.button>
                                )}
                                <motion.button 
                                    whileHover={bouncyHover}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onEdit}
                                    className="flex-1 sm:flex-none group flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-xl sm:rounded-[1.25rem] font-semibold text-[10px] sm:text-sm shadow-[0_4px_12px_-2px_rgba(79,70,229,0.1)] hover:bg-indigo-100 transition-all"
                                >
                                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                                    EDIT TASK
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TaskDetailHeader;

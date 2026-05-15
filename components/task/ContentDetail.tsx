
import React from 'react';
import { Task, User, Channel, MasterOption } from '../../types';
import { format, differenceInDays, startOfToday } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Activity, MessageSquare, Paperclip, Check } from 'lucide-react';
import SingleContentInsight from '../analytics/SingleContentInsight';
import ContentDetailHeader from './detail/ContentDetailHeader';
import ContentInfoView from './detail/ContentInfoView';
import ContentForm from './ContentForm';

interface ContentDetailProps {
    task: Task;
    users: User[];
    channels: Channel[];
    masterOptions?: MasterOption[];
    currentUser?: User;
    mode: 'VIEW' | 'EDIT';
    setMode: (mode: 'VIEW' | 'EDIT') => void;
    onSave: (task: Task) => void;
    onDelete?: () => void;
    onClose: () => void;
    initialTab?: 'CONTENT' | 'INSIGHT' | 'EDIT';
}

const ContentDetail: React.FC<ContentDetailProps> = ({ 
    task, users, channels, masterOptions = [], currentUser, mode, setMode, onSave, onDelete, onClose, initialTab = 'CONTENT'
}) => {
    const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(false);
    const [viewSubTab, setViewSubTab] = React.useState<'INFO' | 'INSIGHT'>(initialTab === 'INSIGHT' ? 'INSIGHT' : 'INFO');

    const isInsightOverdue = React.useMemo(() => {
        const currentStatus = (task.status || '').toUpperCase();
        const isTerminal = currentStatus.includes('DONE') || ['PUBLISHED', 'FINAL', 'POSTED'].includes(currentStatus);
        
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.hasAnalytics) return false;
        
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return differenceInDays(startOfToday(), endDateObj) >= 7;
    }, [task]);

    const isInsightCompleted = React.useMemo(() => {
        const currentStatus = (task.status || '').toUpperCase();
        const isTerminal = currentStatus.includes('DONE') || ['PUBLISHED', 'FINAL', 'POSTED'].includes(currentStatus);
        
        if (task.type !== 'CONTENT' || !isTerminal) return false;
        
        return !!task.hasAnalytics;
    }, [task]);

    const containerVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { 
            opacity: 1, 
            y: 0,
        },
        exit: { 
            opacity: 0,
            transition: { duration: 0.4, ease: "easeIn" as const }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
                duration: 0.5,
                ease: "easeOut",
                staggerChildren: 0.1 
            }}
            className="flex flex-col h-full bg-[#FCFDFE] text-slate-700"
        >
            {/* --- COMPRESSIBLE HEADER --- */}
            <motion.div variants={itemVariants}>
                <ContentDetailHeader 
                    task={task}
                    users={users}
                    channels={channels}
                    isExpanded={isHeaderExpanded}
                    onToggleExpand={setIsHeaderExpanded}
                    onEdit={() => setMode('EDIT')}
                    onDelete={onDelete}
                    activeTab={mode === 'EDIT' ? 'EDIT' : 'CONTENT'}
                    setActiveTab={(tab) => {
                        if (tab === 'EDIT') setMode('EDIT');
                        else setMode('VIEW');
                    }}
                />
            </motion.div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <AnimatePresence mode="wait">
                    {mode === 'EDIT' ? (
                        <motion.div
                            key="edit-mode"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            <ContentForm 
                                initialData={task}
                                channels={channels}
                                users={users}
                                masterOptions={masterOptions}
                                currentUser={currentUser}
                                onSave={(updatedTask) => {
                                    onSave(updatedTask);
                                    setMode('VIEW');
                                    setViewSubTab('INFO');
                                }}
                                onDelete={onDelete ? (id) => onDelete() : undefined}
                                onClose={() => setMode('VIEW')}
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="view-mode"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col h-full"
                        >
                            {/* --- INTERNAL VIEW TOGGLE --- */}
                            <div className="px-6 sm:px-10 pt-6 flex items-center justify-between">
                                <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/40">
                                    <button 
                                        onClick={() => setViewSubTab('INFO')}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewSubTab === 'INFO' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>ข้อมูลทั่วไป</span>
                                    </button>
                                    <button 
                                        onClick={() => setViewSubTab('INSIGHT')}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all relative ${viewSubTab === 'INSIGHT' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'} ${isInsightOverdue && viewSubTab !== 'INSIGHT' ? 'animate-pulse text-rose-500' : ''} ${isInsightCompleted ? 'text-emerald-600' : ''}`}
                                    >
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>สถิติ (INSIGHT)</span>
                                        {isInsightOverdue && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                                            </span>
                                        )}
                                        {isInsightCompleted && (
                                            <span className="absolute -top-1 -right-1 flex items-center justify-center p-0.5 bg-emerald-500 rounded-full border-2 border-white text-white">
                                                <Check strokeWidth={4} className="w-2 h-2" />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 sm:p-10 space-y-6 sm:space-y-10">
                                <AnimatePresence mode="wait">
                                    {viewSubTab === 'INFO' ? (
                                        <motion.div
                                            key="info-content"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <ContentInfoView task={task} users={users} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="insight-content"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <SingleContentInsight task={task} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- MINIMAL FOOTER (HIDDEN IN EDIT MODE) --- */}
            {mode === 'VIEW' && (
                <div className="px-5 sm:px-10 py-3 sm:py-6 bg-white border-t border-slate-50 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-center shrink-0">
                    <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                        {task.createdAt && (
                            <div className="flex flex-col shrink-0">
                                <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Created At</span>
                                <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tighter sm:tracking-normal">
                                    {format(new Date(task.createdAt), 'd MMM yy, HH:mm', { locale: th })}
                                </span>
                            </div>
                        )}
                        <div className="w-px h-6 bg-slate-100 shrink-0" />
                        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                            <div className="flex flex-col shrink-0">
                                <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Comments</span>
                                <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400">0 Messages</span>
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
            )}
        </motion.div>
    );
};

export default ContentDetail;

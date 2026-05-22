
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
import Skeleton from '../ui/Skeleton';
import { isStockTerminalStatus } from '../../config/status';

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
    const [localHasAnalytics, setLocalHasAnalytics] = React.useState<boolean>(!!task.hasAnalytics);
    const [localHasAllAnalytics, setLocalHasAllAnalytics] = React.useState<boolean>(false);

    // Tab Switching Transition and Lazy Request Optimization
    const [isTabTransitioning, setIsTabTransitioning] = React.useState(false);
    const prevTabRef = React.useRef<string>('');

    React.useEffect(() => {
        const currentTabKey = `${mode}-${viewSubTab}`;
        if (prevTabRef.current && prevTabRef.current !== currentTabKey) {
            setIsTabTransitioning(true);
            const timer = setTimeout(() => {
                setIsTabTransitioning(false);
            }, 300); // Super-snappy 300ms loading transition
            return () => clearTimeout(timer);
        }
        prevTabRef.current = currentTabKey;
    }, [mode, viewSubTab]);

    React.useEffect(() => {
        setLocalHasAnalytics(!!task.hasAnalytics);
    }, [task.hasAnalytics]);

    const handleAnalyticsUpdate = React.useCallback((hasSome: boolean, hasAll: boolean) => {
        setLocalHasAnalytics(hasSome);
        setLocalHasAllAnalytics(hasAll);
    }, []);

    const isInsightOverdue = React.useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
        
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || localHasAllAnalytics) return false;
        
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return differenceInDays(startOfToday(), endDateObj) >= 7;
    }, [task.type, task.status, task.isUnscheduled, task.endDate, localHasAllAnalytics]);

    const insightStatus = React.useMemo<'NONE' | 'PARTIAL' | 'COMPLETE'>(() => {
        const isTerminal = isStockTerminalStatus(task.status);
        
        if (task.type !== 'CONTENT' || !isTerminal) return 'NONE';
        
        if (localHasAllAnalytics) {
            return 'COMPLETE';
        } else if (localHasAnalytics) {
            return 'PARTIAL';
        } else {
            return 'NONE';
        }
    }, [task.type, task.status, localHasAnalytics, localHasAllAnalytics]);

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
                    viewSubTab={viewSubTab}
                    setViewSubTab={setViewSubTab}
                    isInsightOverdue={isInsightOverdue}
                    insightStatus={insightStatus}
                />
            </motion.div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <AnimatePresence mode="wait">
                    {isTabTransitioning ? (
                        <motion.div
                            key="skeleton-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-6 sm:p-10 space-y-6 sm:space-y-8 select-none"
                        >
                            {/* Smart Header Skeleton */}
                            <div className="space-y-3">
                                <Skeleton className="h-7 w-1/3 bg-slate-200/60" />
                                <Skeleton className="h-4 w-1/4 bg-slate-100" />
                            </div>

                            {/* Responsive Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                                <Skeleton className="h-28 rounded-2xl bg-slate-50 border border-slate-100" />
                                <Skeleton className="h-28 rounded-2xl bg-slate-50 border border-slate-100" />
                                <Skeleton className="h-28 rounded-2xl bg-slate-50 border border-slate-100" />
                            </div>

                            {/* Main Body Canvas Card */}
                            <Skeleton className="h-56 w-full rounded-3xl bg-slate-100/50" />

                            {/* Content Description Skeleton Lines */}
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full bg-slate-100/80" />
                                <Skeleton className="h-4 w-11/12 bg-slate-100/80" />
                                <Skeleton className="h-4 w-4/5 bg-slate-100/80" />
                            </div>
                        </motion.div>
                    ) : mode === 'EDIT' ? (
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
                            <div className="p-4 sm:p-10 space-y-6 sm:space-y-10 pt-0 sm:pt-6">
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
                                            <SingleContentInsight 
                                                task={task} 
                                                onAnalyticsUpdate={handleAnalyticsUpdate}
                                            />
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

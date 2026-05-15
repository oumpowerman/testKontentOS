
import React, { useState, useMemo } from 'react';
import { useReviews } from '../hooks/useReviews';
import { useQualityActions } from '../hooks/useQualityActions';
import { useReviewJudge } from '../hooks/useReviewJudge';
import { useMasterDataContext } from '../context/MasterDataContext';
import { isToday, isTomorrow, isPast, isFuture, differenceInCalendarDays, isSameDay } from 'date-fns';
import { Clock, Search, Filter, AlertTriangle, Info, CheckCircle2, ChevronDown, ChevronRight, LayoutList, Layers, Calendar, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Channel, Task, MasterOption, User } from '../types';
import ReviewCard from './quality-gate/ReviewCard';
import ReviewActionModal from './quality-gate/ReviewActionModal';
import QualityStatsWidget from './quality-gate/QualityStatsWidget';
import QualityCreatorFilter from './quality-gate/QualityCreatorFilter';
import InfoModal from './ui/InfoModal';
import QualityGuide from './quality-gate/QualityGuide';
import AppBackground from './common/AppBackground';

interface QualityGateViewProps {
    channels: Channel[];
    users: User[]; 
    masterOptions: MasterOption[]; 
    onOpenTask: (task: Task) => void;
    currentUser: User;
    tasks: Task[]; // Use global tasks as source of truth
}

type GroupType = 'CRITICAL' | 'REVISE' | 'TODAY' | 'UPCOMING' | 'EXPIRED';

const QualityGateView: React.FC<QualityGateViewProps> = ({ channels, users, masterOptions, onOpenTask, currentUser, tasks }) => {
    const { reviews, isLoading, updateReviewStatus } = useReviews();
    
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 30
            }
        }
    };

    const accordionVariants: Variants = {
        hidden: { 
            height: 0, 
            opacity: 0,
            overflow: "hidden"
        },
        visible: { 
            height: "auto", 
            opacity: 1,
            overflow: "visible",
            transition: {
                height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.3, delay: 0.1 }
            }
        }
    };
    const { handleConfirmAction, isProcessing } = useQualityActions();
    const { runReviewChecks } = useReviewJudge();
    const { annualHolidays, calendarExceptions } = useMasterDataContext();
    
    // --- UI State ---
    const [isChecking, setIsChecking] = useState(false);
    const [filterDateType, setFilterDateType] = useState<'ALL_PENDING' | 'TODAY' | 'OVERDUE'>('ALL_PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    
    // Accordion State
    const [collapsedGroups, setCollapsedGroups] = useState<Record<GroupType, boolean>>({
        'CRITICAL': false,
        'REVISE': false,
        'TODAY': false,
        'UPCOMING': true,
        'EXPIRED': true 
    });

    // Modal State
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, type: 'PASS' | 'REVISE' | null, reviewId: string, taskId: string, task?: Task, submissionDate?: Date }>({
        isOpen: false,
        type: null,
        reviewId: '',
        taskId: '',
        task: undefined,
        submissionDate: undefined
    });

    // --- Core Logic: Re-hydrating Review Sessions with Authoritative Task Data ---
    const enrichedReviews = useMemo(() => {
        return reviews.map(r => {
            // Find the most up-to-date version of this task from the global array
            const authoritativeTask = tasks.find(t => t.id === r.taskId);
            return {
                ...r,
                // Replace the potentially stale task info from useReviews fetch 
                // with the authoritative one from TaskContext
                task: authoritativeTask || r.task 
            };
        });
    }, [reviews, tasks]);

    // 1. DEDUPLICATION LOGIC: Group by Task ID and keep only the LATEST Round
    const uniqueReviews = useMemo(() => {
        const latestReviewsMap = new Map<string, typeof enrichedReviews[0]>();
        
        enrichedReviews.forEach(r => {
            if (!r.task) return;
            const existing = latestReviewsMap.get(r.taskId);
            if (!existing || r.round > existing.round) {
                latestReviewsMap.set(r.taskId, r);
            }
        });

        return Array.from(latestReviewsMap.values());
    }, [enrichedReviews]);

    // 2. Apply Filters
    const filteredReviews = useMemo(() => {
        const today = new Date();
        return uniqueReviews.filter(r => {
            if (selectedCreators.length > 0 && r.task?.assigneeIds) {
                const hasMatch = r.task.assigneeIds.some(id => selectedCreators.includes(id));
                if (!hasMatch) return false;
            }
            
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchTitle = r.task?.title.toLowerCase().includes(searchLower);
                if (!matchTitle) return false;
            }

            if (filterDateType === 'TODAY') {
                return isSameDay(r.scheduledAt, today) && r.status === 'PENDING';
            }
            if (filterDateType === 'OVERDUE') {
                return (isPast(r.scheduledAt) && !isSameDay(r.scheduledAt, today) && r.status === 'PENDING') || r.status === 'EXPIRED';
            }
            
            return r.status !== 'PASSED';
        });
    }, [uniqueReviews, selectedCreators, searchTerm, filterDateType]);

    // Grouping Logic
    const groups = useMemo(() => {
        const today = new Date();
        const result = {
            critical: [] as typeof filteredReviews,
            revise: [] as typeof filteredReviews,
            today: [] as typeof filteredReviews,
            upcoming: [] as typeof filteredReviews,
            expired: [] as typeof filteredReviews
        };

        filteredReviews.forEach(r => {
            const isOverdue = isPast(r.scheduledAt) && !isSameDay(r.scheduledAt, today);
            
            if (r.status === 'REVISE') {
                result.revise.push(r);
            } else if (r.status === 'EXPIRED') {
                result.expired.push(r); 
            } else if (r.status === 'PENDING') {
                if (isOverdue) {
                    result.critical.push(r);
                } else if (isSameDay(r.scheduledAt, today)) {
                    result.today.push(r);
                } else {
                    result.upcoming.push(r);
                }
            }
        });

        return result;
    }, [filteredReviews]);

    const toggleGroup = (group: GroupType) => {
        setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const getStatusInfo = (statusKey: string) => {
        const option = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === statusKey);
        if (option) {
            return { label: option.label, color: option.color || 'bg-gray-100 text-gray-500' };
        }
        return { label: statusKey, color: 'bg-gray-100 text-gray-500' };
    };

    const getChannelName = (id?: string) => channels.find(c => c.id === id)?.name || 'Unknown';

    const handleActionClick = (reviewId: string, action: 'PASS' | 'REVISE', taskId: string, task: Task, submissionDate?: Date) => {
        setModalConfig({ isOpen: true, type: action, reviewId, taskId, task, submissionDate });
    };

    const handleForceSLACheck = async () => {
        if (!annualHolidays) return;
        setIsChecking(true);
        try {
            await runReviewChecks(annualHolidays, calendarExceptions || [], true);
        } finally {
            setIsChecking(false);
        }
    };

    const onConfirmModal = async (feedback?: string, adjustment: number = 0, qualityScore?: number, categories?: string[]) => {
        const success = await handleConfirmAction(
            modalConfig.reviewId,
            modalConfig.type!,
            modalConfig.taskId,
            modalConfig.task,
            feedback,
            updateReviewStatus,
            currentUser.id,
            adjustment, // Pass the manual adjustment
            modalConfig.submissionDate, // Pass submission date for accurate bonus
            qualityScore,
            categories
        );
        if (success) setModalConfig({ ...modalConfig, isOpen: false });
    };

    const totalActiveTasks = groups.critical.length + groups.revise.length + groups.today.length;
    const canReview = currentUser.role === 'ADMIN' || ['Senior', 'Manager', 'Head'].some(role => (currentUser.position || '').includes(role));

    return (
        <AppBackground theme="inspector" pattern="grid" className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 p-4 md:p-8 min-h-screen">
            <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative z-10">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-3xl shadow-2xl border border-indigo-500/20 backdrop-blur-md">
                                <Layers className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white flex items-center tracking-tight italic uppercase">
                                    Inspector's Desk <span className="ml-3 text-indigo-500 not-italic">🔍</span>
                                </h1>
                                <p className="text-indigo-400/60 mt-1 font-black uppercase tracking-[0.3em] text-xs">
                                    Quality Gate Control Center
                                </p>
                            </div>
                            <button onClick={() => setIsInfoOpen(true)} className="p-2 text-indigo-400/40 hover:text-indigo-400 hover:bg-white/5 rounded-full transition-colors mt-1">
                                <Info className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <QualityStatsWidget reviews={uniqueReviews} users={users} />

                    {/* Holographic Controls */}
                    <div className="flex flex-col gap-4 top-4 z-30">
                        {/* Top Row: Search */}
                        <div className="bg-slate-900/80 backdrop-blur-2xl p-3 rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/5">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 transition-colors group-focus-within:text-indigo-400" />
                                <input 
                                    type="text" 
                                    placeholder="SCANNING FOR TASKS (TITLE, TAGS)..." 
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-black/60 border border-white/10 focus:border-indigo-500/50 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all text-sm font-black text-white placeholder:text-indigo-900/60 uppercase tracking-[0.2em]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                                    <span className="text-[10px] font-black text-indigo-500/40 tracking-widest uppercase">Active Scan</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Filters & Team */}
                        <div className="bg-slate-900/60 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col xl:flex-row items-center gap-6 ring-1 ring-white/5">
                            <div className="flex items-center gap-3 shrink-0">
                                {/* Force SLA Check Button */}
                                <button
                                    onClick={handleForceSLACheck}
                                    disabled={isChecking}
                                    className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                        isChecking 
                                        ? 'bg-black/20 text-indigo-900 border-white/5 cursor-not-allowed' 
                                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10'
                                    }`}
                                    title="ตรวจสอบและดีดกลับงานที่ค้างตรวจเกินกำหนด (SLA)"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                                    {isChecking ? 'Checking...' : 'Check SLA'}
                                </button>

                                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shrink-0 shadow-inner">
                                    <button onClick={() => setFilterDateType('ALL_PENDING')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterDateType === 'ALL_PENDING' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/50' : 'text-indigo-400/40 hover:text-indigo-400 hover:bg-white/5'}`}>
                                        Pending ({totalActiveTasks})
                                    </button>
                                    <button onClick={() => setFilterDateType('TODAY')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterDateType === 'TODAY' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/50' : 'text-indigo-400/40 hover:text-indigo-400 hover:bg-white/5'}`}>
                                        Today
                                    </button>
                                    <button onClick={() => setFilterDateType('OVERDUE')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterDateType === 'OVERDUE' ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/50' : 'text-indigo-400/40 hover:text-rose-400 hover:bg-white/5'}`}>
                                        Overdue ({groups.critical.length})
                                    </button>
                                </div>
                            </div>

                            <div className="w-px h-10 bg-white/10 mx-1 hidden xl:block"></div>

                            <div className="flex-1 min-w-0 w-full">
                                <QualityCreatorFilter 
                                    users={users}
                                    selectedIds={selectedCreators}
                                    onToggle={(id) => {
                                        if (selectedCreators.includes(id)) {
                                            setSelectedCreators(selectedCreators.filter(x => x !== id));
                                        } else {
                                            setSelectedCreators([...selectedCreators, id]);
                                        }
                                    }}
                                    onClear={() => setSelectedCreators([])}
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-20 text-center text-indigo-500/40 font-black uppercase tracking-[0.5em] animate-pulse">Initialising Scan...</div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-32 bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-white/5 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Desk Cleared! 🎉</h3>
                            <p className="text-indigo-400/40 font-black uppercase tracking-widest text-xs mt-2">All quality gates passed. No pending reviews.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {groups.critical.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500">
                                    <button onClick={() => toggleGroup('CRITICAL')} className="flex items-center justify-between w-full mb-6 group">
                                        <h3 className="text-xl font-black text-rose-500 flex items-center bg-rose-500/10 px-6 py-3 rounded-2xl border border-rose-500/20 shadow-xl backdrop-blur-md italic uppercase tracking-tight">
                                            <AlertTriangle className="w-6 h-6 mr-3 animate-pulse" /> 
                                            Critical / Overdue ({groups.critical.length})
                                        </h3>
                                        <div className="h-px bg-rose-500/10 flex-1 mx-6 group-hover:bg-rose-500/30 transition-colors"></div>
                                        {collapsedGroups['CRITICAL'] ? <ChevronRight className="text-rose-500/40" /> : <ChevronDown className="text-rose-500/40" />}
                                    </button>
                                    <AnimatePresence>
                                        {!collapsedGroups['CRITICAL'] && (
                                            <motion.div 
                                                variants={accordionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="overflow-hidden"
                                            >
                                                <motion.div 
                                                    variants={containerVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="grid grid-cols-1 gap-6 pb-8"
                                                >
                                                    {groups.critical.map(r => (
                                                        <motion.div key={r.id} variants={itemVariants}>
                                                            <ReviewCard 
                                                                review={r} users={users}
                                                                onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                                getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                                isOverdue={true}
                                                                currentUser={currentUser}
                                                                canReview={canReview}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            )}

                            {groups.revise.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500 delay-100">
                                    <button onClick={() => toggleGroup('REVISE')} className="flex items-center justify-between w-full mb-6 group">
                                        <h3 className="text-xl font-black text-amber-500 flex items-center bg-amber-500/10 px-6 py-3 rounded-2xl border border-amber-500/20 shadow-xl backdrop-blur-md italic uppercase tracking-tight">
                                            <LayoutList className="w-6 h-6 mr-3" /> 
                                            Revision Queue ({groups.revise.length})
                                        </h3>
                                        <div className="h-px bg-amber-500/10 flex-1 mx-6 group-hover:bg-amber-500/30 transition-colors"></div>
                                        {collapsedGroups['REVISE'] ? <ChevronRight className="text-amber-500/40" /> : <ChevronDown className="text-amber-500/40" />}
                                    </button>
                                    <AnimatePresence>
                                        {!collapsedGroups['REVISE'] && (
                                            <motion.div 
                                                variants={accordionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="overflow-hidden"
                                            >
                                                <motion.div 
                                                    variants={containerVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="grid grid-cols-1 gap-6 pb-8"
                                                >
                                                    {groups.revise.map(r => (
                                                        <motion.div key={r.id} variants={itemVariants}>
                                                            <ReviewCard 
                                                                review={r} users={users}
                                                                onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                                getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                                highlightRevise={true}
                                                                currentUser={currentUser}
                                                                canReview={canReview}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            )}

                            {groups.today.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500 delay-150">
                                    <button onClick={() => toggleGroup('TODAY')} className="flex items-center justify-between w-full mb-6 group">
                                        <h3 className="text-xl font-black text-indigo-400 flex items-center bg-indigo-500/10 px-6 py-3 rounded-2xl border border-indigo-500/20 shadow-xl backdrop-blur-md italic uppercase tracking-tight">
                                            <Clock className="w-6 h-6 mr-3" /> 
                                            Today's Inspection ({groups.today.length})
                                        </h3>
                                        <div className="h-px bg-indigo-500/10 flex-1 mx-6 group-hover:bg-indigo-500/30 transition-colors"></div>
                                        {collapsedGroups['TODAY'] ? <ChevronRight className="text-indigo-400/40" /> : <ChevronDown className="text-indigo-400/40" />}
                                    </button>
                                    <AnimatePresence>
                                        {!collapsedGroups['TODAY'] && (
                                            <motion.div 
                                                variants={accordionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="overflow-hidden"
                                            >
                                                <motion.div 
                                                    variants={containerVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="grid grid-cols-1 gap-6 pb-8"
                                                >
                                                    {groups.today.map(r => (
                                                        <motion.div key={r.id} variants={itemVariants}>
                                                            <ReviewCard 
                                                                review={r} users={users}
                                                                onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                                getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                                currentUser={currentUser}
                                                                canReview={canReview}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            )}

                            {groups.expired.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500 delay-200">
                                    <button onClick={() => toggleGroup('EXPIRED')} className="flex items-center justify-between w-full mb-6 group opacity-70 hover:opacity-100 transition-opacity">
                                        <h3 className="text-xl font-black text-slate-400 flex items-center bg-slate-500/10 px-6 py-3 rounded-2xl border border-slate-500/20 shadow-xl backdrop-blur-md italic uppercase tracking-tight">
                                            <AlertTriangle className="w-6 h-6 mr-3" /> 
                                            SLA Expired / System Reverted ({groups.expired.length})
                                        </h3>
                                        <div className="h-px bg-slate-500/10 flex-1 mx-6 group-hover:bg-slate-500/30 transition-colors"></div>
                                        {collapsedGroups['EXPIRED'] ? <ChevronRight className="text-slate-500/40" /> : <ChevronDown className="text-slate-500/40" />}
                                    </button>
                                    <AnimatePresence>
                                        {!collapsedGroups['EXPIRED'] && (
                                            <motion.div 
                                                variants={accordionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="overflow-hidden"
                                            >
                                                <motion.div 
                                                    variants={containerVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="grid grid-cols-1 gap-6 pb-8"
                                                >
                                                    {groups.expired.map(r => (
                                                        <motion.div key={r.id} variants={itemVariants}>
                                                            <ReviewCard 
                                                                review={r} users={users}
                                                                onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                                getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                                isExpired={true}
                                                                currentUser={currentUser}
                                                                canReview={canReview}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            )}

                            {groups.upcoming.length > 0 && (
                                <section className="animate-in slide-in-from-left-4 duration-500 delay-200">
                                    <button onClick={() => toggleGroup('UPCOMING')} className="flex items-center justify-between w-full mb-6 group opacity-50 hover:opacity-100 transition-opacity">
                                        <h3 className="text-md font-black text-indigo-400/60 flex items-center bg-white/5 px-6 py-3 rounded-2xl border border-white/5 italic uppercase tracking-widest">
                                            <Calendar className="w-5 h-5 mr-3" /> 
                                            Upcoming Queue ({groups.upcoming.length})
                                        </h3>
                                        <div className="h-px bg-white/5 flex-1 mx-6 border-dashed border-b border-white/10"></div>
                                        {collapsedGroups['UPCOMING'] ? <ChevronRight className="text-indigo-400/20" /> : <ChevronDown className="text-indigo-400/20" />}
                                    </button>
                                    <AnimatePresence>
                                        {!collapsedGroups['UPCOMING'] && (
                                            <motion.div 
                                                variants={accordionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="overflow-hidden"
                                            >
                                                <motion.div 
                                                    variants={containerVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="grid grid-cols-1 gap-6 opacity-60 pb-8"
                                                >
                                                    {groups.upcoming.map(r => (
                                                        <motion.div key={r.id} variants={itemVariants}>
                                                            <ReviewCard 
                                                                review={r} users={users}
                                                                onAction={handleActionClick} onOpenTask={onOpenTask} 
                                                                getChannelName={getChannelName} getStatusInfo={getStatusInfo}
                                                                currentUser={currentUser}
                                                                canReview={canReview}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            )}
                        </div>
                    )}
                </div>

                <ReviewActionModal 
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    actionType={modalConfig.type}
                    task={modalConfig.task} // Pass task object for calculation
                    submissionDate={modalConfig.submissionDate}
                    onConfirm={onConfirmModal}
                    masterOptions={masterOptions} // PASS MASTER OPTIONS
                    isProcessing={isProcessing}
                />

                <InfoModal 
                    isOpen={isInfoOpen}
                    onClose={() => setIsInfoOpen(false)}
                    title="คู่มือห้องตรวจงาน (Quality Gate)"
                >
                    <QualityGuide />
                </InfoModal>
            </div>
        </AppBackground>
    );
};

export default QualityGateView;

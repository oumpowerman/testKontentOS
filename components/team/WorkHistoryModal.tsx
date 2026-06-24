import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, History as HistoryIcon } from 'lucide-react';
import { 
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    subMonths, startOfDay, endOfDay, startOfQuarter, endOfQuarter,
    isToday, isYesterday, isThisWeek, format, parseISO
} from 'date-fns';
import { useWorkHistory } from '../../hooks/useWorkHistory';
import { User, Task, Channel } from '../../types';
import { calculateTaskXP } from '../../lib/gameLogic';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Modular Components
import HistoryHeader from './history/HistoryHeader';
import HistoryFilterBar from './history/HistoryFilterBar';
import HistoryTaskCard from './history/HistoryTaskCard';
import HistoryPagination from './history/HistoryPagination';
import HistoryQuickStats from './history/HistoryQuickStats';

interface WorkHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    channels: Channel[];
    onOpenTask: (task: Task) => void;
}

const WorkHistoryModal: React.FC<WorkHistoryModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    channels,
    onOpenTask
}) => {
    const { 
        tasks, 
        totalCount, 
        loading, 
        page, 
        setPage, 
        filters, 
        setFilters 
    } = useWorkHistory(currentUser?.id, isOpen);

    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const [tempSearch, setTempSearch] = useState('');

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setIsHeaderCollapsed(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Calculation Logic ---
    const calculateStats = () => {
        if (!tasks.length) return { 
            totalXp: 0, 
            totalTasks: 0,
            completedTasks: 0,
            totalHours: 0,
            overdueTasks: 0,
            revertCount: 0,
            difficultyCounts: { EASY: 0, MEDIUM: 0, HARD: 0 }
        };
        
        let totalXp = 0;
        let completedTasksCount = 0;
        let totalHours = 0;
        let overdueTasksCount = 0;
        let totalReverts = 0;
        const difficultyCounts = { EASY: 0, MEDIUM: 0, HARD: 0 };

        tasks.forEach(task => {
            // Stats for all tasks in range
            if (task.difficulty && (task.difficulty === 'EASY' || task.difficulty === 'MEDIUM' || task.difficulty === 'HARD')) {
                difficultyCounts[task.difficulty]++;
            }
            totalHours += task.estimatedHours || 0;
            totalReverts += task.sla_revert_count || 0;

            if (task.status === 'DONE') {
                completedTasksCount++;
                const xp = calculateTaskXP(task);
                totalXp += xp.total;

                // Check Overdue (if deadline exists)
                if (task.endDate && task.updatedAt) {
                    const deadline = new Date(task.endDate);
                    const completed = new Date(task.updatedAt);
                    if (completed > deadline) {
                        overdueTasksCount++;
                    }
                }
            }
        });

        return {
            totalXp,
            totalTasks: totalCount,
            completedTasks: completedTasksCount,
            totalHours,
            overdueTasks: overdueTasksCount,
            revertCount: totalReverts,
            difficultyCounts
        };
    };

    // --- Grouping Logic ---
    const groupTasks = (tasks: Task[]) => {
        const groups: { title: string; tasks: Task[] }[] = [];
        
        tasks.forEach(task => {
            const date = task.createdAt ? new Date(task.createdAt) : new Date();
            let title = 'Earlier';
            
            if (isToday(date)) title = 'วันนี้ (Today)';
            else if (isYesterday(date)) title = 'เมื่อวาน (Yesterday)';
            else if (isThisWeek(date)) title = 'สัปดาห์นี้ (This Week)';
            else title = format(date, 'd MMMM yyyy');

            const existing = groups.find(g => g.title === title);
            if (existing) existing.tasks.push(task);
            else groups.push({ title, tasks: [task] });
        });

        return groups;
    };

    const stats = calculateStats();
    const taskGroups = groupTasks(tasks);

    const applySearch = () => {
        setFilters(prev => ({ ...prev, search: tempSearch }));
        setPage(0);
    };

    const shiftMonth = (direction: number) => {
        setFilters(prev => {
            const nextStart = new Date(prev.startDate);
            nextStart.setMonth(nextStart.getMonth() + direction);
            
            const newStart = startOfMonth(nextStart);
            const newEnd = endOfMonth(nextStart);
            
            return { ...prev, startDate: newStart, endDate: newEnd };
        });
        setPage(0);
    };

    const presets = [
        { label: 'Today', onClick: () => {
            setFilters({ ...filters, startDate: startOfDay(new Date()), endDate: endOfDay(new Date()) });
            setPage(0);
        }},
        { label: 'This Week', onClick: () => {
            setFilters({ ...filters, startDate: startOfWeek(new Date(), { weekStartsOn: 1 }), endDate: endOfWeek(new Date(), { weekStartsOn: 1 }) });
            setPage(0);
        }},
        { label: 'This Month', onClick: () => {
            setFilters({ ...filters, startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) });
            setPage(0);
        }},
        { label: 'Last Month', onClick: () => {
            const prev = subMonths(new Date(), 1);
            setFilters({ ...filters, startDate: startOfMonth(prev), endDate: endOfMonth(prev) });
            setPage(0);
        }},
        { label: 'This Quarter', onClick: () => {
            setFilters({ ...filters, startDate: startOfQuarter(new Date()), endDate: endOfQuarter(new Date()) });
            setPage(0);
        }},
    ];

    if (!currentUser) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 md:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] relative z-10 flex flex-col border-0 sm:border border-white overflow-hidden"
                    >
                        {/* Header */}
                        <HistoryHeader 
                            user={currentUser} 
                            totalCount={totalCount} 
                            onClose={onClose} 
                            isCollapsed={isHeaderCollapsed}
                            onToggleCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                        />

                        {/* Filters */}
                        <HistoryFilterBar 
                            filters={filters}
                            tempSearch={tempSearch}
                            onSearchChange={setTempSearch}
                            onApplySearch={applySearch}
                            onSetFilters={setFilters}
                            onShiftMonth={shiftMonth}
                            onSetPage={setPage}
                            presets={presets}
                        />

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-8 bg-gradient-to-b from-slate-50/30 to-white overflow-x-hidden scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent hover:scrollbar-thumb-indigo-200">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-6">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-pulse" />
                                        <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-slate-800 tracking-tight">กำลังขุดคุ้ยประวัติผลงาน...</p>
                                        <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Scanning Work Database</p>
                                    </div>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-slate-300 text-center">
                                    <motion.div 
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="bg-slate-50 p-10 rounded-[3rem] mb-6 border border-slate-100"
                                    >
                                        <Inbox className="w-16 h-16 opacity-30 text-indigo-500" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-slate-800">ไม่พบประวัติการทำงานในช่วงนี้</h3>
                                    <p className="text-sm mt-2 text-slate-400 font-medium">ลองเปลี่ยนช่วงวันที่หรือสถานะเพื่อค้นหาข้อมูลที่คุณต้องการ</p>
                                    <button 
                                        onClick={() => {
                                            setFilters({ ...filters, status: 'ALL', search: '' });
                                            setPage(0);
                                        }}
                                        className="mt-8 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto space-y-12">
                                    {/* Personal Insights Header */}
                                    <HistoryQuickStats 
                                        stats={stats} 
                                        isCollapsed={isHeaderCollapsed}
                                    />

                                    <div className={cn("space-y-10", isHeaderCollapsed && "space-y-6")}>
                                        {taskGroups.map((group) => (
                                            <div key={group.title} className={cn("space-y-4", isHeaderCollapsed && "space-y-2")}>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-px bg-slate-200/50 flex-1" />
                                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                                        {group.title}
                                                    </h4>
                                                    <div className="h-px bg-slate-200/50 flex-1" />
                                                </div>
                                                
                                                <motion.div 
                                                    className={cn("grid gap-4", isHeaderCollapsed && "gap-2.5")}
                                                    initial="hidden"
                                                    animate="visible"
                                                    variants={{
                                                        visible: { transition: { staggerChildren: 0.05 } }
                                                    }}
                                                >
                                                    {group.tasks.map((task) => (
                                                        <HistoryTaskCard 
                                                            key={task.id}
                                                            task={task}
                                                            channels={channels}
                                                            onClick={() => onOpenTask(task)}
                                                            isLean={isHeaderCollapsed}
                                                        />
                                                    ))}
                                                </motion.div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Pagination */}
                        {tasks.length > 0 && (
                            <HistoryPagination 
                                page={page}
                                totalCount={totalCount}
                                pageSize={20}
                                loading={loading}
                                onPageChange={setPage}
                            />
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default WorkHistoryModal;

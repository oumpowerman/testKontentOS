
import React, { useState, useMemo } from 'react';
import { Goal, Channel, User } from '../types';
import { useGoals } from '../hooks/useGoals';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import GoalStatsHeader from './goal/GoalStatsHeader';
import GoalCard from './goal/GoalCard';
import { GoalFormModal, UpdateProgressModal } from './goal/GoalActionModals';
import SpaceBackground from './common/SpaceBackground';
import FilterDropdown from './common/FilterDropdown';
import { Plus, Filter, Calendar, ChevronLeft, ChevronRight, LayoutGrid, List, Target, X, CalendarDays, Rocket } from 'lucide-react';
import { format, isSameMonth, addMonths, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay, getDay, startOfWeek, endOfWeek } from 'date-fns';
import th from 'date-fns/locale/th';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface GoalViewProps {
    channels: Channel[];
    users: User[];
    currentUser: User;
}

const ITEMS_PER_PAGE = 9;

const GoalView: React.FC<GoalViewProps> = ({ channels, users, currentUser }) => {
    // Destructure updateGoal
    const { goals, addGoal, updateGoal, updateGoalValue, deleteGoal, toggleOwner, toggleBoost, redeemGoal, requestExtension, isLoading } = useGoals(currentUser);
    
    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [updatingGoal, setUpdatingGoal] = useState<Goal | null>(null);
    
    // Filter State
    const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'FAILED'>('ACTIVE');
    const [filterChannel, setFilterChannel] = useState<string>('ALL');
    const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ 
        start: null, 
        end: null 
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(new Date());
    
    // Pagination
    const [page, setPage] = useState(1);

    // Channel Options for FilterDropdown
    const channelOptions = useMemo(() => {
        return [
            {
                key: 'ALL',
                label: 'All Sectors (ทุกช่องทาง)',
                icon: (
                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/15 flex items-center justify-center text-[8px] font-black text-indigo-400 shrink-0">
                        ALL
                    </div>
                )
            },
            ...channels.map(ch => ({
                key: ch.id,
                label: ch.name,
                icon: ch.logoUrl ? (
                    <img 
                        src={ch.logoUrl} 
                        alt={ch.name} 
                        className="w-5 h-5 rounded-full object-cover shrink-0 bg-white/10" 
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: ch.color || '#4f46e5' }}
                    >
                        {ch.name.substring(0, 1).toUpperCase()}
                    </div>
                )
            }))
        ];
    }, [channels]);

    // --- Filtering Logic ---
    const filteredGoals = useMemo(() => {
        const now = new Date();
        return goals.filter(g => {
            // 1. Tab Filter
            if (g.isArchived) return false; 
            
            const isCompleted = g.currentValue >= g.targetValue;
            const isFailed = !isCompleted && now > new Date(g.deadline);

            if (filterTab === 'COMPLETED' && !isCompleted) return false;
            if (filterTab === 'ACTIVE' && (isCompleted || isFailed)) return false;
            if (filterTab === 'FAILED' && !isFailed) return false;

            // 2. Channel Filter
            if (filterChannel !== 'ALL' && g.channelId !== filterChannel) return false;

            // 3. Date Range Filter (Based on Deadline)
            if (dateRange.start && dateRange.end) {
                const deadline = new Date(g.deadline);
                if (!isWithinInterval(deadline, { 
                    start: startOfDay(dateRange.start), 
                    end: endOfDay(dateRange.end) 
                })) return false;
            }

            return true;
        }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, [goals, filterTab, filterChannel, dateRange]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredGoals.length / ITEMS_PER_PAGE);
    const paginatedGoals = filteredGoals.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleSaveGoal = async (data: any) => {
        if (editingGoal) {
            // Update Existing Goal
            const updatedGoal: Goal = {
                ...editingGoal,
                ...data
            };
            await updateGoal(updatedGoal);
            setEditingGoal(null);
            setIsCreateModalOpen(false); // Close shared modal logic if needed, though usually controlled by props
        } else {
            // Create New Goal
            addGoal(data);
        }
    };

    // Reset page when filters change
    useMemo(() => {
        setPage(1);
    }, [filterTab, filterChannel, dateRange]);

    // Handle Lazy Loading for Completed Goals
    React.useEffect(() => {
        if (filterTab === 'COMPLETED' || filterTab === 'ALL') {
            // In a real app, you might call a specific function to fetch more data here
            // For now, we'll ensure useGoals is aware of the need for more data if implemented server-side
        }
    }, [filterTab]);

    const handleQuickDateSelect = (type: 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_90' | 'ALL') => {
        const now = new Date();
        switch (type) {
            case 'THIS_MONTH':
                setDateRange({ start: startOfMonth(now), end: endOfMonth(now) });
                setViewMonth(now);
                break;
            case 'LAST_MONTH':
                const lastMonth = addMonths(now, -1);
                setDateRange({ start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
                setViewMonth(lastMonth);
                break;
            case 'LAST_90':
                setDateRange({ start: subDays(now, 90), end: now });
                setViewMonth(now);
                break;
            case 'ALL':
                setDateRange({ start: null, end: null });
                break;
        }
        setIsDatePickerOpen(false);
    };

    const handleDateClick = (date: Date) => {
        if (!dateRange.start || (dateRange.start && dateRange.end)) {
            setDateRange({ start: date, end: null });
        } else {
            if (date < dateRange.start) {
                setDateRange({ start: date, end: dateRange.start });
            } else {
                setDateRange({ start: dateRange.start, end: date });
            }
        }
    };

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewMonth));
        const end = endOfWeek(endOfMonth(viewMonth));
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);

    const handleUpdateProgress = async (val: number) => {
        if (!updatingGoal) return;
        
        const wasCompleted = updatingGoal.currentValue >= updatingGoal.targetValue;
        const isNowCompleted = val >= updatingGoal.targetValue;

        await updateGoalValue(updatingGoal.id, val);
        
        if (!wasCompleted && isNowCompleted) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
            });
        }
        setUpdatingGoal(null);
    };

    return (
        <SpaceBackground className="pb-24">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                
                {/* 1. Header & Stats */}
                <div className="relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4 sm:gap-6">
                        <div className="relative z-10 w-full sm:w-auto">
                            <div className="flex items-center gap-2.5 sm:gap-3 mb-1 sm:mb-2">
                                <div className="p-1.5 sm:p-2 bg-indigo-500/20 rounded-lg sm:rounded-xl border border-indigo-500/30 backdrop-blur-sm shrink-0">
                                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 animate-pulse" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                                    Mission Control
                                </h1>
                            </div>
                            <p className="text-indigo-300/70 font-bold text-[10px] sm:text-xs md:text-sm tracking-widest uppercase ml-1">Strategic Objective Tracking System</p>
                        </div>
                        
                        <button 
                            onClick={() => { setEditingGoal(null); setIsCreateModalOpen(true); }}
                            className="w-full sm:w-auto flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-900/40 hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest border border-indigo-400/30"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 stroke-[4px]" /> Initiate New Mission
                        </button>
                    </div>
                    
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] p-1.5 sm:p-2">
                        <GoalStatsHeader goals={filteredGoals} />
                    </div>
                </div>

                {/* 2. Controls & Filters */}
                <div className="bg-slate-900/60 p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl shadow-black/50 flex flex-col xl:flex-row gap-3 sm:gap-4 items-center justify-between sticky top-2 sm:top-4 z-40 backdrop-blur-xl">
                    
                    {/* Left: Tab & Date Range */}
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                        {/* Tabs */}
                        <div className="flex bg-black/40 p-1 rounded-xl sm:rounded-2xl w-full md:w-auto border border-white/5 overflow-x-auto scrollbar-hide">
                            <button onClick={() => setFilterTab('ACTIVE')} className={`flex-1 md:flex-none px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterTab === 'ACTIVE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-gray-500 hover:text-gray-300'}`}>Active</button>
                            <button onClick={() => setFilterTab('COMPLETED')} className={`flex-1 md:flex-none px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterTab === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-gray-500 hover:text-gray-300'}`}>Completed</button>
                            <button onClick={() => setFilterTab('FAILED')} className={`flex-1 md:flex-none px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterTab === 'FAILED' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : 'text-gray-500 hover:text-gray-300'}`}>Failed</button>
                            <button onClick={() => setFilterTab('ALL')} className={`flex-1 md:flex-none px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterTab === 'ALL' ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-500 hover:text-gray-300'}`}>All</button>
                        </div>

                        {/* Date Range Picker UI */}
                        <div className="relative w-full md:w-auto">
                            <button 
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                className={`flex items-center justify-between gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all w-full md:w-auto min-w-[220px] ${isDatePickerOpen ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-black/20 hover:border-indigo-500/50 shadow-sm'}`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <CalendarDays className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${dateRange.start ? 'text-indigo-400' : 'text-gray-500'}`} />
                                    <span className="text-[9px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest truncate">
                                        {dateRange.start && dateRange.end 
                                            ? `${format(dateRange.start, 'd MMM', { locale: th })} - ${format(dateRange.end, 'd MMM yy', { locale: th })}`
                                            : 'Temporal Range: All Time'}
                                    </span>
                                </div>
                                <Filter className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform shrink-0 ${isDatePickerOpen ? 'rotate-180 text-indigo-400' : 'text-gray-500'}`} />
                            </button>

                            <AnimatePresence>
                                {isDatePickerOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-0 mt-2 w-full md:w-[320px] max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-2xl rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-white/10 p-4 sm:p-6 z-50 overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center mb-4 sm:mb-6 px-1">
                                            <span className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest">Temporal Selection</span>
                                            <button onClick={() => setIsDatePickerOpen(false)} className="p-1.5 hover:bg-white/5 rounded-xl text-gray-500"><X className="w-4 h-4" /></button>
                                        </div>
                                        
                                        {/* Calendar Header */}
                                        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                                            <button onClick={() => setViewMonth(prev => addMonths(prev, -1))} className="p-1 hover:bg-white/5 rounded-lg text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
                                            <span className="text-[11px] sm:text-xs font-black text-white uppercase tracking-widest">{format(viewMonth, 'MMMM yyyy', { locale: th })}</span>
                                            <button onClick={() => setViewMonth(prev => addMonths(prev, 1))} className="p-1 hover:bg-white/5 rounded-lg text-gray-500"><ChevronRight className="w-4 h-4" /></button>
                                        </div>

                                        {/* Calendar Grid */}
                                        <div className="grid grid-cols-7 gap-1 mb-6">
                                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                                                <div key={day} className="text-[9px] font-black text-gray-600 text-center py-1 uppercase">{day}</div>
                                            ))}
                                            {calendarDays.map((date, i) => {
                                                const isSelected = (dateRange.start && isSameDay(date, dateRange.start)) || (dateRange.end && isSameDay(date, dateRange.end));
                                                const isInRange = dateRange.start && dateRange.end && isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
                                                const isCurrentMonth = isSameMonth(date, viewMonth);

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleDateClick(date)}
                                                        className={`
                                                            relative h-9 w-full flex items-center justify-center text-[10px] font-bold rounded-xl transition-all
                                                            ${!isCurrentMonth ? 'text-gray-700' : 'text-gray-400 hover:bg-white/5'}
                                                            ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-900/50 z-10' : ''}
                                                            ${isInRange && !isSelected ? 'bg-indigo-500/20 text-indigo-400 rounded-none first:rounded-l-xl last:rounded-r-xl' : ''}
                                                        `}
                                                    >
                                                        {format(date, 'd')}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="h-px bg-white/5 mb-4"></div>

                                        {/* Quick Selects */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => handleQuickDateSelect('THIS_MONTH')} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-[9px] font-black text-gray-500 hover:text-indigo-400 transition-colors text-center uppercase tracking-wider">This Month</button>
                                            <button onClick={() => handleQuickDateSelect('LAST_MONTH')} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-[9px] font-black text-gray-500 hover:text-indigo-400 transition-colors text-center uppercase tracking-wider">Last Month</button>
                                            <button onClick={() => handleQuickDateSelect('LAST_90')} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-[9px] font-black text-gray-500 hover:text-indigo-400 transition-colors text-center uppercase tracking-wider">Last 90 Days</button>
                                            <button onClick={() => handleQuickDateSelect('ALL')} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black text-gray-600 hover:text-gray-300 transition-colors text-center uppercase tracking-wider">All Time</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right: Channel Filter */}
                    <div className="w-full xl:w-72 shrink-0">
                        <FilterDropdown
                            label="All Sectors"
                            options={channelOptions}
                            value={filterChannel}
                            onChange={(val) => setFilterChannel(val)}
                            showAllOption={false}
                            clearable={false}
                            theme="dark"
                            placeholder="เลือกช่องทาง"
                        />
                    </div>
                </div>

                {/* 3. Grid Content */}
                {isLoading ? (
                    <div className="py-32 text-center text-indigo-400/50 animate-pulse font-black uppercase tracking-[0.2em]">Scanning Data Streams...</div>
                ) : paginatedGoals.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-black/20 backdrop-blur-sm">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                            <Target className="w-12 h-12 text-indigo-400/30" />
                        </div>
                        <p className="text-white font-black text-xl uppercase tracking-widest">No Active Missions Found</p>
                        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Adjust temporal range or sector filters</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {paginatedGoals.map(goal => (
                                <div key={goal.id} className="h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <GoalCard 
                                        goal={goal}
                                        channel={channels.find(c => c.id === goal.channelId)}
                                        users={users}
                                        currentUser={currentUser}
                                        onUpdate={() => setUpdatingGoal(goal)}
                                        onToggleOwner={toggleOwner}
                                        onToggleBoost={toggleBoost}
                                        onDelete={deleteGoal}
                                        onEdit={(g) => { setEditingGoal(g); setIsCreateModalOpen(true); }}
                                        onRedeem={redeemGoal}
                                        onRequestExtension={requestExtension}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-6 py-8">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-gray-400 hover:text-white hover:bg-indigo-600/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl backdrop-blur-md"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <span className="text-xs font-black text-indigo-400 bg-slate-900/80 px-6 py-3 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl uppercase tracking-[0.2em]">
                                    Sector {page} <span className="text-gray-600 mx-2">/</span> {totalPages}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-gray-400 hover:text-white hover:bg-indigo-600/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl backdrop-blur-md"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Modals */}
                <GoalFormModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)}
                    initialData={editingGoal}
                    channels={channels}
                    onSave={handleSaveGoal}
                />

                {updatingGoal && (
                    <UpdateProgressModal 
                        isOpen={!!updatingGoal}
                        onClose={() => setUpdatingGoal(null)}
                        goal={updatingGoal}
                        onUpdate={handleUpdateProgress}
                    />
                )}

            </div>
        </SpaceBackground>
    );
};

export default GoalView;

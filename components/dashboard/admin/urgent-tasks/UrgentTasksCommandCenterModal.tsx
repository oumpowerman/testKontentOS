import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Users, AlertTriangle } from 'lucide-react';
import { isBefore, isToday, addDays } from 'date-fns';
import { Task, Channel, User, MasterOption } from '../../../../types';
import { isTaskCompleted } from '../../../../constants';

// Modular Subcomponents
import { CommandCenterHeader } from './command-center/CommandCenterHeader';
import { CommandCenterFilters } from './command-center/CommandCenterFilters';
import { CommandCenterStatsDesk } from './command-center/CommandCenterStatsDesk';
import { CommandCenterSidebar } from './command-center/CommandCenterSidebar';
import { CommandCenterList } from './command-center/CommandCenterList';

interface UrgentTasksCommandCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    viewScope: 'ALL' | 'ME';
    currentUser: User;
    onEditTask: (task: Task) => void;
}

export const UrgentTasksCommandCenterModal: React.FC<UrgentTasksCommandCenterModalProps> = ({
    isOpen,
    onClose,
    tasks,
    channels,
    users,
    masterOptions,
    viewScope,
    currentUser,
    onEditTask,
}) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // State filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<'ALL' | 'CONTENT' | 'TASK'>('ALL');
    const [timeFilter, setTimeFilter] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'SOON' | 'NORMAL'>('ALL');
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [activeAssigneeId, setActiveAssigneeId] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'LIST' | 'ANALYTICS'>('LIST');

    // Advanced Capabilities State
    const [notificationToast, setNotificationToast] = useState<string | null>(null);
    const [isNudging, setIsNudging] = useState(false);

    // --- Core Data Preparation (Pending Items) ---
    const allPendingTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return tasks.filter((t) => {
            // Must not be completed & not unscheduled
            if (t.isUnscheduled || isTaskCompleted(t.status as string)) return false;

            // Handle Scope ('ME' view constraint)
            if (viewScope === 'ME') {
                const isAssignee = t.assigneeIds?.includes(currentUser.id);
                const isOwner = t.ideaOwnerIds?.includes(currentUser.id);
                const isEditor = t.editorIds?.includes(currentUser.id);
                if (!isAssignee && !isOwner && !isEditor) return false;
            }
            return true;
        });
    }, [tasks, viewScope, currentUser]);

    // --- Dynamic Bottleneck & Workload Analysis for Scalability ---
    const channelsAnalytics = useMemo(() => {
        const counts: Record<string, number> = {};
        allPendingTasks
            .filter((t) => t.type === 'CONTENT')
            .forEach((t) => {
                if (t.channelId) {
                    counts[t.channelId] = (counts[t.channelId] || 0) + 1;
                }
            });

        return Object.entries(counts)
            .map(([id, count]) => {
                const ch = channels.find((c) => c.id === id);
                return { id, count, channel: ch };
            })
            .filter((item) => item.channel)
            .sort((a, b) => b.count - a.count);
    }, [allPendingTasks, channels]);

    const assigneesAnalytics = useMemo(() => {
        const counts: Record<string, number> = {};
        allPendingTasks
            .filter((t) => t.type === 'TASK')
            .forEach((t) => {
                t.assigneeIds?.forEach((uid) => {
                    if (uid) {
                        counts[uid] = (counts[uid] || 0) + 1;
                    }
                });
            });

        return Object.entries(counts)
            .map(([id, count]) => {
                const u = users.find((user) => user.id === id);
                return { id, count, user: u };
            })
            .filter((item) => item.user)
            .sort((a, b) => b.count - a.count);
    }, [allPendingTasks, users]);

    // Overall Metrics & Scalability Risk index algorithms
    const metrics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let overdue = 0;
        let todayCount = 0;
        let soonCount = 0;
        let normal = 0;

        allPendingTasks.forEach((t) => {
            const date = new Date(t.endDate);
            date.setHours(0, 0, 0, 0);

            if (isBefore(date, today)) overdue++;
            else if (isToday(date)) todayCount++;
            else if (isBefore(date, addDays(today, 3))) soonCount++;
            else normal++;
        });

        // Risk Level Calculation
        let riskLabel = 'ระดับปกติ (Nominal)';
        let riskColor = 'text-emerald-500 bg-emerald-50 border-emerald-100/60';
        if (overdue > 4) {
            riskLabel = 'วิกฤตความล่าช้าสะสม (Urgency Red)';
            riskColor = 'text-red-600 bg-red-50 border-red-100/60 animate-pulse';
        } else if (overdue > 0 || todayCount > 2) {
            riskLabel = 'เฝ้าระวังหนาแน่น (Moderate)';
            riskColor = 'text-amber-600 bg-amber-50 border-amber-100/60';
        }

        const total = allPendingTasks.length;
        const contentsCount = allPendingTasks.filter((t) => t.type === 'CONTENT').length;
        const tasksCount = allPendingTasks.filter((t) => t.type === 'TASK').length;

        const contentPercent = total > 0 ? Math.round((contentsCount / total) * 100) : 0;
        const taskPercent = total > 0 ? Math.round((tasksCount / total) * 100) : 0;

        return {
            overdue,
            todayCount,
            soonCount,
            normal,
            total,
            riskLabel,
            riskColor,
            contentPercent,
            taskPercent,
            contentsCount,
            tasksCount,
        };
    }, [allPendingTasks]);

    // --- Filter logic for display ---
    const filteredTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return allPendingTasks
            .filter((t) => {
                // 1. Type Segmented Filter
                if (selectedType === 'CONTENT' && t.type !== 'CONTENT') return false;
                if (selectedType === 'TASK' && t.type !== 'TASK') return false;

                // 2. Timeline Status Filter
                const date = new Date(t.endDate);
                date.setHours(0, 0, 0, 0);
                if (timeFilter === 'OVERDUE' && !isBefore(date, today)) return false;
                if (timeFilter === 'TODAY' && !isToday(date)) return false;
                if (timeFilter === 'SOON' && !(isBefore(date, addDays(today, 3)) && !isBefore(date, today) && !isToday(date))) return false;
                if (timeFilter === 'NORMAL' && isBefore(date, addDays(today, 3))) return false;

                // 3. Interactive Sidebar Lock Filters
                if (activeChannelId && t.channelId !== activeChannelId) return false;
                if (activeAssigneeId && !t.assigneeIds?.includes(activeAssigneeId)) return false;

                // 4. Input Search Query Match
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase();
                    const matchTitle = t.title.toLowerCase().includes(query);
                    const channelName = channels.find((c) => c.id === t.channelId)?.name || '';
                    const matchChannel = channelName.toLowerCase().includes(query);
                    const matchUser =
                        t.assigneeIds?.some((uid) => {
                            const u = users.find((usr) => usr.id === uid);
                            return u?.name.toLowerCase().includes(query);
                        }) || false;

                    if (!matchTitle && !matchChannel && !matchUser) return false;
                }

                return true;
            })
            .sort((a, b) => {
                // Sort style logic: Overdue first, Urgent priority next, then Date ascending
                const dateA = new Date(a.endDate).getTime();
                const dateB = new Date(b.endDate).getTime();

                const isOverdueA = dateA < today.getTime();
                const isOverdueB = dateB < today.getTime();
                if (isOverdueA && !isOverdueB) return -1;
                if (!isOverdueA && isOverdueB) return 1;

                if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
                if (a.priority !== 'URGENT' && b.priority === 'URGENT') return 1;

                return dateA - dateB;
            });
    }, [allPendingTasks, selectedType, timeFilter, activeChannelId, activeAssigneeId, searchQuery, channels, users]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedType('ALL');
        setTimeFilter('ALL');
        setActiveChannelId(null);
        setActiveAssigneeId(null);
        setMobileTab('LIST');
    };

    // Emergency Send Broadcast Alerts simulation
    const handleTriggerNudges = () => {
        if (allPendingTasks.length === 0) {
            setNotificationToast('🟢 ไม่มีงานค้างด่วนใด ๆ สภาพความปลอดภัยสมบูรณ์!');
            return;
        }
        setIsNudging(true);
        setTimeout(() => {
            setIsNudging(false);
            setNotificationToast(
                `🔔 ส่งการแจ้งเตือนงานเร่งด่วนไปที่ Slack/Line และโทรศัพท์ของผู้ปฏิบัติตามแผนกแล้ว เรียบร้อยครับ! (${allPendingTasks.length} รายการ)`
            );
            setTimeout(() => {
                setNotificationToast(null);
            }, 5500);
        }, 1200);
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6" id="urgent-tasks-command-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 15 }}
                        transition={{ type: 'spring', duration: 0.45 }}
                        className="relative bg-slate-50/95 backdrop-blur-xl w-full h-full md:h-[88vh] md:max-w-6xl md:rounded-[2.5rem] border border-white/80 shadow-2xl overflow-hidden z-[110] flex flex-col"
                    >
                        {/* Interactive Dynamic Banner Toast */}
                        <AnimatePresence>
                            {notificationToast && (
                                <motion.div
                                    initial={{ opacity: 0, y: -40, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -40, scale: 0.95 }}
                                    className="absolute top-2 w-[90%] left-[5%] md:left-[2.5%] md:w-[95%] bg-indigo-950 text-indigo-100 py-3.5 px-5 rounded-2xl shadow-xl z-50 border border-indigo-800/60 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400 font-bold">
                                            <Bell className="w-4 h-4 animate-bounce" />
                                        </div>
                                        <span className="text-[11px] sm:text-xs font-bold leading-normal">{notificationToast}</span>
                                    </div>
                                    <button
                                        onClick={() => setNotificationToast(null)}
                                        className="p-1 text-indigo-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Modulized Component 1: Header */}
                        <CommandCenterHeader
                            totalPendingTasks={metrics.total}
                            onResetFilters={resetFilters}
                            onClose={onClose}
                        />

                        {/* Modulized Component 2: Filters */}
                        <CommandCenterFilters
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            selectedType={selectedType}
                            onSelectedTypeChange={setSelectedType}
                            timeFilter={timeFilter}
                            onTimeFilterChange={setTimeFilter}
                            totalCount={metrics.total}
                            contentCount={metrics.contentsCount}
                            taskCount={metrics.tasksCount}
                            overdueCount={metrics.overdue}
                            todayCount={metrics.todayCount}
                            soonCount={metrics.soonCount}
                        />

                        {/* Mobile sub-tabs selector */}
                        <div className="lg:hidden flex bg-white border-b border-slate-200/60 p-1 shrink-0">
                            <button
                                onClick={() => setMobileTab('LIST')}
                                className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    mobileTab === 'LIST'
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                รายการงาน ({filteredTasks.length})
                            </button>
                            <button
                                onClick={() => setMobileTab('ANALYTICS')}
                                className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    mobileTab === 'ANALYTICS'
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                เจาะลึกวิเคราะห์ & รายสื่อ
                            </button>
                        </div>

                        {/* Main Grid View Area */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
                            {/* Left Column Sidebar */}
                            <div
                                className={`lg:col-span-4 border-r border-slate-200/60 bg-slate-50 flex flex-col overflow-y-auto ${
                                    mobileTab === 'ANALYTICS' ? 'flex' : 'hidden lg:flex'
                                } h-full scrollbar-thin`}
                            >
                                {/* Modulized Component 3: Stats Desk */}
                                <CommandCenterStatsDesk
                                    riskColor={metrics.riskColor}
                                    riskLabel={metrics.riskLabel}
                                    contentPercent={metrics.contentPercent}
                                    taskPercent={metrics.taskPercent}
                                    isNudging={isNudging}
                                    onTriggerNudge={handleTriggerNudges}
                                />

                                {/* Modulized Component 4: Sidebar Details */}
                                <CommandCenterSidebar
                                    selectedType={selectedType}
                                    channelsAnalytics={channelsAnalytics}
                                    assigneesAnalytics={assigneesAnalytics}
                                    activeChannelId={activeChannelId}
                                    activeAssigneeId={activeAssigneeId}
                                    onChannelSelect={(id) => {
                                        setActiveChannelId(id);
                                        setActiveAssigneeId(null);
                                    }}
                                    onAssigneeSelect={(id) => {
                                        setActiveAssigneeId(id);
                                        setActiveChannelId(null);
                                    }}
                                    setMobileTab={setMobileTab}
                                />
                            </div>

                            {/* Right Column List panel */}
                            <CommandCenterList
                                filteredTasks={filteredTasks}
                                channels={channels}
                                users={users}
                                masterOptions={masterOptions}
                                onEditTask={onEditTask}
                                timeFilter={timeFilter}
                                onClearTimeFilter={() => setTimeFilter('ALL')}
                                activeChannelId={activeChannelId}
                                onClearChannelFilter={() => setActiveChannelId(null)}
                                activeAssigneeId={activeAssigneeId}
                                onClearAssigneeFilter={() => setActiveAssigneeId(null)}
                                searchQuery={searchQuery}
                                mobileTab={mobileTab}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

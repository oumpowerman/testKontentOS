import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, MasterOption } from '../../../types';
import { PartyPopper, CalendarClock, X, HelpCircle } from 'lucide-react';
import { SirenIndicator, SirenInsetOverlay } from './urgent-tasks/SirenIndicator';
import { UrgentTasksFilterTabs } from './urgent-tasks/UrgentTasksFilterTabs';
import { UrgentTasksStats } from './urgent-tasks/UrgentTasksStats';
import { UrgentTaskItem } from './urgent-tasks/UrgentTaskItem';
import { UrgentTasksHelpModal } from './urgent-tasks/UrgentTasksHelpModal';
import { UrgentTasksWorkloadBreakdown } from './urgent-tasks/UrgentTasksWorkloadBreakdown';
import { useUrgentTasks } from './urgent-tasks/useUrgentTasks';
import { UrgentTasksCommandCenterModal } from './urgent-tasks/UrgentTasksCommandCenterModal';

interface UrgentTasksWidgetProps {
    tasks: Task[]; // Raw tasks (filtered by scope in parent or here)
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[]; // Prop for VLOOKUP
    viewScope: 'ALL' | 'ME';
    currentUser: User;
    onEditTask: (task: Task) => void;
    onNavigateToCalendar: () => void;
}

const UrgentTasksWidget: React.FC<UrgentTasksWidgetProps> = ({
    tasks,
    channels,
    users,
    masterOptions,
    viewScope,
    currentUser,
    onEditTask,
    onNavigateToCalendar
}) => {
    const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
    const [isSirenOpen, setIsSirenOpen] = useState(false);
    const {
        selectedType,
        activeFilter,
        setActiveFilter,
        isHelpOpen,
        setIsHelpOpen,
        selectedChannelId,
        setSelectedChannelId,
        selectedAssigneeId,
        setSelectedAssigneeId,
        displayTasks,
        stats,
        counts,
        channelsWithPending,
        assigneesWithPending,
        toggleFilter,
        handleTypeChange,
    } = useUrgentTasks({
        tasks,
        channels,
        users,
        viewScope,
        currentUser,
    });

    return (
        <div className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col h-full relative transition-all duration-500 shadow-indigo-100/50">
            
            {/* Siren 6-Level Inset Overlaid Slide Panel */}
            <SirenInsetOverlay 
                overdueCount={stats.overdue} 
                todayCount={stats.today} 
                isOpen={isSirenOpen} 
                onClose={() => setIsSirenOpen(false)} 
            />

            {/* --- Header: Stats Filter --- */}
            <div className="p-6 pb-6 border-b border-white/40 relative z-25">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-100/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none opacity-40"></div>
                
                <div className="flex justify-between items-start relative z-30 mb-6 col-span-3">
                    <div className="flex items-center gap-4">
                        <SirenIndicator 
                            overdueCount={stats.overdue} 
                            todayCount={stats.today} 
                            isOpen={isSirenOpen} 
                            setIsOpen={setIsSirenOpen} 
                        />
                        <div>
                            <h3 className="font-bold text-2xl tracking-tighter text-slate-800">งานด่วน (Priority)</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[14px] text-slate-400 font-black uppercase tracking-widest">
                                    {activeFilter === 'ALL' ? (viewScope === 'ME' ? 'เฉพาะงานของคุณ' : 'ภาพรวมทั้งทีม') : `กรอง: ${activeFilter}`}
                                </p>
                                {activeFilter !== 'ALL' && (
                                    <button onClick={() => setActiveFilter('ALL')} className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full flex items-center transition-all cursor-pointer">
                                        <X className="w-3 h-3 mr-1" /> Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsHelpOpen(true)}
                        className="p-2.5 rounded-2xl bg-white/60 hover:bg-white text-slate-400 hover:text-indigo-600 border border-white hover:border-indigo-100 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                        title="คำอธิบายการคำนวณงานด่วน"
                        id="btn-urgent-tasks-help"
                    >
                        <HelpCircle className="w-5 h-5 animate-pulse" />
                    </motion.button>
                </div>

                {/* Overdue, Today, Soon Stats Indicators */}
                <UrgentTasksStats 
                    stats={{ overdue: stats.overdue, today: stats.today, upcoming: stats.upcoming }}
                    activeFilter={activeFilter}
                    onToggleFilter={toggleFilter}
                />
            </div>

            {/* Segmented Type Filtering Tabs */}
            <div className="pt-4 border-b border-white/20">
                <UrgentTasksFilterTabs 
                    selectedType={selectedType}
                    onChangeType={handleTypeChange}
                    allCount={counts.allCount}
                    contentCount={counts.contentCount}
                    taskCount={counts.taskCount}
                />
            </div>

            {/* Dynamic Workload Summaries: Channels (for Content) & Assignees (for Tasks) */}
            <UrgentTasksWorkloadBreakdown 
                selectedType={selectedType}
                channelsWithPending={channelsWithPending}
                assigneesWithPending={assigneesWithPending}
                selectedChannelId={selectedChannelId}
                setSelectedChannelId={setSelectedChannelId}
                selectedAssigneeId={selectedAssigneeId}
                setSelectedAssigneeId={setSelectedAssigneeId}
            />

            {/* --- Body: Task List --- */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-thin">
                {displayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <motion.div
                            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                        >
                            <PartyPopper className="w-16 h-16 mb-4 text-amber-400 opacity-80" />
                        </motion.div>
                        <p className="font-black text-slate-600 text-lg">
                            {activeFilter === 'ALL' ? 'สถานการณ์ปกติ (All Clear)' : 'ไม่มีรายการในหมวดนี้'}
                        </p>
                        <p className="text-xs text-slate-400 font-bold mt-1">
                            {activeFilter === 'ALL' ? 'ไม่มีงานด่วนหรือค้างส่ง เยี่ยมมาก!' : 'ลองเลือกหมวดอื่นดูนะครับ'}
                        </p>
                    </div>
                ) : (
                    displayTasks.map((task, idx) => (
                        <UrgentTaskItem 
                            key={task.id}
                            task={task}
                            idx={idx}
                            channels={channels}
                            users={users}
                            masterOptions={masterOptions}
                            onEditTask={onEditTask}
                        />
                    ))
                )}
            </div>

            {/* --- Footer: View All --- */}
            {activeFilter === 'ALL' && stats.total > 5 && (
                <div className="p-4 border-t border-white/40 bg-white/30 backdrop-blur-md">
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCommandCenterOpen(true)}
                        className="w-full py-3.5 flex items-center justify-center gap-2 text-xs font-black text-slate-500 hover:text-indigo-600 hover:bg-white rounded-2xl border border-white/60 hover:border-indigo-100 transition-all shadow-sm uppercase tracking-widest cursor-pointer"
                        id="btn-view-all-pending-command-center"
                    >
                        <CalendarClock className="w-4 h-4" />
                        ดูงานที่เหลืออีก {stats.total - 5} รายการ
                    </motion.button>
                </div>
            )}

            {/* Help Explanation Modal */}
            <UrgentTasksHelpModal 
                isOpen={isHelpOpen} 
                onClose={() => setIsHelpOpen(false)} 
            />

            {/* Command Center for Pending items Modal */}
            <UrgentTasksCommandCenterModal
                isOpen={isCommandCenterOpen}
                onClose={() => setIsCommandCenterOpen(false)}
                tasks={tasks}
                channels={channels}
                users={users}
                masterOptions={masterOptions}
                viewScope={viewScope}
                currentUser={currentUser}
                onEditTask={onEditTask}
            />
        </div>
    );
};

export default UrgentTasksWidget;

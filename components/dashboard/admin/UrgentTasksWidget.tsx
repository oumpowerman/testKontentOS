import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, MasterOption } from '../../../types';
import { Siren, PartyPopper, CalendarClock, X, HelpCircle } from 'lucide-react';
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
    const [isSirenHovered, setIsSirenHovered] = useState(false);
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
            
            {/* --- Header: Stats Filter --- */}
            <div className="p-6 pb-6 border-b border-white/40 relative z-25">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-100/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none opacity-40"></div>
                
                <div className="flex justify-between items-start relative z-30 mb-6 col-span-3">
                    <div className="flex items-center gap-4">
                        <div className="relative z-45">
                            <motion.div 
                                onMouseEnter={() => setIsSirenHovered(true)}
                                onMouseLeave={() => setIsSirenHovered(false)}
                                onFocus={() => setIsSirenHovered(true)}
                                onBlur={() => setIsSirenHovered(false)}
                                tabIndex={0}
                                animate={stats.overdue > 0 ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`p-3.5 rounded-2xl shadow-sm border transition-colors cursor-help outline-none focus:ring-2 focus:ring-indigo-500/20 ${stats.overdue > 0 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}
                            >
                                <Siren className={`w-7 h-7 ${stats.overdue > 0 ? 'animate-pulse' : ''}`} />
                            </motion.div>

                            <AnimatePresence>
                                {isSirenHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute top-full left-0 mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-xl p-4.5 z-[100] pointer-events-none text-slate-800"
                                    >
                                        <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100">
                                            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <Siren className="w-4 h-4" />
                                            </span>
                                            <span className="font-extrabold text-xs text-slate-800">คู่มือนำทางสีไฟแจ้งเตือน</span>
                                        </div>
                                        
                                        <div className="space-y-2.5">
                                            {/* Red Indicator Explanation */}
                                            <div className={`p-2.5 rounded-2xl border transition-all ${stats.overdue > 0 ? 'bg-red-50/50 border-red-100/80 ring-1 ring-red-500/20' : 'bg-slate-50/40 border-slate-100/60 opacity-60'}`}>
                                                <div className="flex items-start gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full mt-1 bg-red-500 shrink-0 ${stats.overdue > 0 ? 'animate-ping' : ''}`} />
                                                    <div>
                                                        <p className="font-black text-xs text-red-600 flex items-center gap-1">
                                                            สีแดงแจ้งเตือนวิกฤต
                                                            {stats.overdue > 0 && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full font-extrabold">Active</span>}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                                                            มีงานค้างส่ง (Overdue) เลยดีดไลน์แล้วแต่ยังไม่สำเร็จ ควรรีบเร่งจัดการทันทีเพื่อป้องกันความล่าช้าสะสม
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Green Indicator Explanation */}
                                            <div className={`p-2.5 rounded-2xl border transition-all ${stats.overdue === 0 ? 'bg-green-50/50 border-green-100/80 ring-1 ring-green-500/20' : 'bg-slate-50/40 border-slate-100/60 opacity-60'}`}>
                                                <div className="flex items-start gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full mt-1 bg-green-500 shrink-0" />
                                                    <div>
                                                        <p className="font-black text-xs text-green-600 flex items-center gap-1">
                                                            สีเขียวสถานการณ์สุดยอด
                                                            {stats.overdue === 0 && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.2 rounded-full font-extrabold">Active</span>}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                                                            ไม่มีงานที่ค้างส่งเลยในทีมขณะนี้ ระบบดำเนินไปได้อย่างไหลลื่นและตรงตามแผนงาน 100%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                            <span>ความถี่: ตรวจสอบเรียลไทม์</span>
                                            <span>สถานะปัจจุบัน: {stats.overdue > 0 ? '🔴 มีงานค้างส่ง' : '🟢 ปกติสมบูรณ์'}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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

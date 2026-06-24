import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, User as UserType, Channel } from '../../types';
import { startOfWeek, endOfWeek, isPast, isToday, isTomorrow, isSameWeek } from 'date-fns';
import { isTaskCompleted } from '../../constants';

// Sub-components & Helpers from workload module
import { 
    WORKLOAD_LEVELS, 
    calculateHours, 
    getMyRole 
} from './workload/workloadConstants';
import WorkloadHeader from './workload/WorkloadHeader';
import WorkloadControls from './workload/WorkloadControls';
import TeamWorkloadTab from './workload/TeamWorkloadTab';
import MyFocusTab from './workload/MyFocusTab';

interface MyWorkloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    users: UserType[];
    currentUser: UserType;
    channels: Channel[];
    onOpenTask: (task: Task) => void;
    onOpenHistory?: () => void;
}

type GroupMode = 'DATE' | 'CHANNEL' | 'ROLE';
type ViewMode = 'GRID' | 'LIST';

const MyWorkloadModal: React.FC<MyWorkloadModalProps> = ({ 
    isOpen, onClose, tasks, users, currentUser, channels, onOpenTask, onOpenHistory 
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [groupMode, setGroupMode] = useState<GroupMode>('DATE');
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [tabMode, setTabMode] = useState<'TEAM' | 'ME'>('ME');

    // Date Logic
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    // 1. Filter: Get only MY active tasks
    const myActiveTasks = useMemo(() => {
        return tasks.filter(t => {
            // Must be involved
            const isMe = t.assigneeIds.includes(currentUser.id) || 
                         t.ideaOwnerIds?.includes(currentUser.id) || 
                         t.editorIds?.includes(currentUser.id);
            
            // Must not be done
            const isDone = isTaskCompleted(t.status as string);
            
            return isMe && !isDone;
        }).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }, [tasks, currentUser]);

    // Calculate Total Hours for Display
    const totalHours = useMemo(() => {
        return myActiveTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    }, [myActiveTasks]);

    // Grouping Logic
    const groupedTasks = useMemo(() => {
        const groups: Record<string, Task[]> = {};
        
        myActiveTasks.forEach(task => {
            let key = 'Other';
            
            if (groupMode === 'DATE') {
                const due = new Date(task.endDate);
                if (task.isUnscheduled) key = '📦 Unscheduled (Stock)';
                else if (isPast(due) && !isToday(due)) key = '🔥 Overdue (งานค้าง)';
                else if (isToday(due)) key = '📅 Today (วันนี้)';
                else if (isTomorrow(due)) key = '⏳ Tomorrow (พรุ่งนี้)';
                else if (isSameWeek(due, new Date(), { weekStartsOn: 1 })) key = '🗓️ This Week (สัปดาห์นี้)';
                else key = '🔮 Upcoming (ล่วงหน้า)';
            } 
            else if (groupMode === 'CHANNEL') {
                const ch = channels.find(c => c.id === task.channelId);
                key = ch ? ch.name : '🌐 General / Other';
            } 
            else if (groupMode === 'ROLE') {
                key = getMyRole(task, currentUser.id);
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        // Custom Sort Keys for Date Mode
        if (groupMode === 'DATE') {
            const order = ['🔥 Overdue (งานค้าง)', '📅 Today (วันนี้)', '⏳ Tomorrow (พรุ่งนี้)', '🗓️ This Week (สัปดาห์นี้)', '🔮 Upcoming (ล่วงหน้า)', '📦 Unscheduled (Stock)'];
            // Reconstruct object with sorted keys
            const sortedGroups: Record<string, Task[]> = {};
            order.forEach(k => {
                if (groups[k]) sortedGroups[k] = groups[k];
            });
            return sortedGroups;
        }

        return groups;
    }, [myActiveTasks, groupMode, channels, currentUser.id]);

    // Team Workload calculation
    const workloadData = useMemo(() => {
        const activeUsers = users.filter(u => u.isActive);
        return activeUsers.map(u => {
            const hours = calculateHours(tasks, u.id, weekStart, weekEnd);
            const level = WORKLOAD_LEVELS.find(l => hours <= l.max) || WORKLOAD_LEVELS[WORKLOAD_LEVELS.length - 1];
            return { user: u, hours, level };
        }).sort((a, b) => b.hours - a.hours); // Sort most busy first
    }, [tasks, users, weekStart, weekEnd]);

    // Stats
    const overdueCount = myActiveTasks.filter(t => !t.isUnscheduled && isPast(new Date(t.endDate)) && !isToday(new Date(t.endDate))).length;
    const todayCount = myActiveTasks.filter(t => !t.isUnscheduled && isToday(new Date(t.endDate))).length;

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-4 font-sans">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Main Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full md:max-w-5xl h-full md:h-[90vh] rounded-none md:rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col z-10 border-0 md:border-4 border-indigo-50"
                >
                    {/* Header */}
                    <WorkloadHeader 
                        currentUser={currentUser}
                        totalHours={totalHours}
                        activeTasksCount={myActiveTasks.length}
                        overdueCount={overdueCount}
                        todayCount={todayCount}
                        onOpenHistory={onOpenHistory}
                        onClose={onClose}
                    />

                    {/* Controls */}
                    <WorkloadControls 
                        tabMode={tabMode}
                        setTabMode={setTabMode}
                        groupMode={groupMode}
                        setGroupMode={setGroupMode}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        weekStart={weekStart}
                        weekEnd={weekEnd}
                    />

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
                        {tabMode === 'TEAM' ? (
                            <TeamWorkloadTab 
                                workloadData={workloadData}
                                weekStart={weekStart}
                                weekEnd={weekEnd}
                                tasks={tasks}
                                channels={channels}
                                onOpenTask={onOpenTask}
                            />
                        ) : (
                            <MyFocusTab 
                                groupedTasks={groupedTasks}
                                viewMode={viewMode}
                                channels={channels}
                                onOpenTask={onOpenTask}
                                currentUser={currentUser}
                            />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default MyWorkloadModal;

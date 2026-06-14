import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, User as UserType } from '../../types';

// Import extracted components
import WorkloadHeader from './parts/WorkloadHeader';
import WorkloadTabs from './parts/WorkloadTabs';
import WorkloadTeamView from './parts/WorkloadTeamView';
import WorkloadMyView from './parts/WorkloadMyView';
import UserTasksDetailModal from './parts/UserTasksDetailModal';

interface WorkloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    users: UserType[];
    currentUser: UserType;
    onOpenTask?: (task: Task) => void;
}

// 7-Level Color Scale for Capacity representation
const WORKLOAD_LEVELS = [
    { max: 5, color: 'bg-slate-200', text: 'text-slate-500', label: 'Idle (ว่างพักผ่อน)' }, // 0-5h
    { max: 15, color: 'bg-emerald-300', text: 'text-emerald-700', label: 'Light (กำลังสแกนงาน)' }, // 6-15h
    { max: 25, color: 'bg-sky-400', text: 'text-sky-700', label: 'Comfort (กำลังพอเหมาะ)' }, // 16-25h
    { max: 35, color: 'bg-indigo-500', text: 'text-indigo-600', label: 'Productive (มุ่งมั่นเต็มสูบ)' }, // 26-35h
    { max: 45, color: 'bg-orange-400', text: 'text-orange-600', label: 'Busy (เต็มขีดจำกัด)' }, // 36-45h
    { max: 55, color: 'bg-red-500', text: 'text-red-600', label: 'Heavy (เสี่ยงน็อคเอ้าท์)' }, // 46-55h
    { max: 999, color: 'bg-rose-800 animate-pulse', text: 'text-rose-700', label: 'Overload (ไม่ไหวโปรดช่วยเหลือ!)' } // 56+
];

const WorkloadModal: React.FC<WorkloadModalProps> = ({ isOpen, onClose, tasks, users, currentUser, onOpenTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'TEAM' | 'ME'>('TEAM');
    
    // State to trigger the detailed team member tasks popup
    const [selectedTeammate, setSelectedTeammate] = useState<{
        user: UserType;
        hours: number;
        tasks: Task[];
    } | null>(null);

    // Active week range determination
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    // Dynamic hours aggregator
    const calculateHours = (taskList: Task[], userId: string) => {
        return taskList
            .filter(t => {
                if (t.isUnscheduled || !t.endDate) return false;
                const taskEnd = startOfDay(new Date(t.endDate));
                // Match items strictly inside the active range
                const inWeek = isWithinInterval(taskEnd, { start: weekStart, end: weekEnd });
                // Check if user is assigned to work as either Owner, Editor, or assignee
                const isInvolved = 
                    t.assigneeIds.includes(userId) || 
                    t.ideaOwnerIds?.includes(userId) || 
                    t.editorIds?.includes(userId);
                
                return inWeek && isInvolved;
            })
            .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    };

    // Filter tasks for a specific user within the active week
    const getTasksForUser = (userId: string) => {
        return tasks.filter(t => {
            if (t.isUnscheduled || !t.endDate) return false;
            const taskEnd = startOfDay(new Date(t.endDate));
            const inWeek = isWithinInterval(taskEnd, { start: weekStart, end: weekEnd });
            const isInvolved = 
                t.assigneeIds.includes(userId) || 
                t.ideaOwnerIds?.includes(userId) || 
                t.editorIds?.includes(userId);
            return inWeek && isInvolved;
        }).sort((a, b) => (b.estimatedHours || 0) - (a.estimatedHours || 0));
    };

    // Workload data mapper
    const workloadData = useMemo(() => {
        const activeUsers = users.filter(u => u.isActive);
        return activeUsers.map(u => {
            const hours = calculateHours(tasks, u.id);
            const level = WORKLOAD_LEVELS.find(l => hours <= l.max) || WORKLOAD_LEVELS[WORKLOAD_LEVELS.length - 1];
            return { user: u, hours, level };
        }).sort((a, b) => b.hours - a.hours); // Dense work first
    }, [tasks, users, weekStart, weekEnd]);

    // Active user's personal context
    const myData = useMemo(() => {
        const data = workloadData.find(d => d.user.id === currentUser.id);
        const tasksList = getTasksForUser(currentUser.id);
        return {
            hours: data?.hours || 0,
            level: data?.level || WORKLOAD_LEVELS[0],
            tasks: tasksList
        };
    }, [workloadData, currentUser.id, tasks, weekStart, weekEnd]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 font-sans">
                    
                    {/* Background Overlay click to close */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 cursor-default" 
                        onClick={onClose}
                    />

                    {/* Modal Window Sheet */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-150 relative z-10"
                    >
                        {/* 1. Header (Thai ranges) */}
                        <WorkloadHeader 
                            currentDate={currentDate} 
                            setCurrentDate={setCurrentDate} 
                            weekStart={weekStart} 
                            weekEnd={weekEnd} 
                            onClose={onClose} 
                        />

                        {/* 2. Tabs Selector (Team vs Me) */}
                        <WorkloadTabs 
                            viewMode={viewMode} 
                            setViewMode={setViewMode} 
                        />

                        {/* 3. Main Scrollable Workspace Container */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                            {viewMode === 'TEAM' ? (
                                <WorkloadTeamView 
                                    workloadData={workloadData} 
                                    getTasksForUser={getTasksForUser} 
                                    onSelectTeammate={(user, hours, itemTasks) => {
                                        setSelectedTeammate({ user, hours, tasks: itemTasks });
                                    }}
                                />
                            ) : (
                                <WorkloadMyView 
                                    hours={myData.hours} 
                                    level={myData.level} 
                                    myTasksList={myData.tasks} 
                                    onOpenTask={(task) => {
                                        if (onOpenTask) {
                                            onOpenTask(task);
                                            onClose();
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </motion.div>

                    {/* Teammate Detailed Task Breakdown Popup */}
                    <AnimatePresence>
                        {selectedTeammate && (
                            <UserTasksDetailModal 
                                isOpen={!!selectedTeammate}
                                onClose={() => setSelectedTeammate(null)}
                                user={selectedTeammate.user}
                                tasks={selectedTeammate.tasks}
                                totalHours={selectedTeammate.hours}
                                weekStart={weekStart}
                                weekEnd={weekEnd}
                                onOpenTask={(task) => {
                                    if (onOpenTask) {
                                        onOpenTask(task);
                                        onClose();
                                    }
                                }}
                            />
                        )}
                    </AnimatePresence>

                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default WorkloadModal;

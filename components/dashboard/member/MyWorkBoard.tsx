
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, MasterOption, User } from '../../../types';
import { isTaskCompleted, isTaskTodo } from '../../../constants';
import { Layers } from 'lucide-react';
import { subDays, isAfter } from 'date-fns'; // Import date helpers
import TaskCategoryModal from '../../TaskCategoryModal';
import DoneHistoryModal from './board/DoneHistoryModal'; // Import New Modal
import WorkColumn from './board/WorkColumn';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

import { motion } from 'framer-motion';

interface MyWorkBoardProps {
    tasks: Task[];
    masterOptions: MasterOption[];
    users: User[];
    currentUser: User;
    onOpenTask: (task: Task) => void;
    onUpdateTask?: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
    isUltimate?: boolean;
}

type ColumnType = 'TODO' | 'DOING' | 'WAITING' | 'DONE';

const MyWorkBoard: React.FC<MyWorkBoardProps> = ({ 
    tasks, masterOptions, users, currentUser, onOpenTask, onUpdateTask, onDeleteTask, isUltimate = false 
}) => {
    const { showAlert } = useGlobalDialog();
    const [activeModalColumn, setActiveModalColumn] = useState<ColumnType | null>(null);
    const [isDoneHistoryOpen, setIsDoneHistoryOpen] = useState(false);
    const isAdmin = currentUser.role === 'ADMIN';

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheelEvent = (e: WheelEvent) => {
            const isHorizontalOverflow = container.scrollWidth > container.clientWidth;
            if (isHorizontalOverflow && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                container.scrollLeft += e.deltaY;
                e.preventDefault();
            }
        };

        container.addEventListener('wheel', handleWheelEvent, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheelEvent);
        };
    }, []);

    // --- Logic: Categorize Tasks ---
    const getPhase = (status: string): ColumnType => {
        const s = status ? status.toUpperCase() : '';
        if (isTaskCompleted(s)) return 'DONE';
        if (isTaskTodo(s)) return 'TODO';
        const WAITING_KEYWORDS = ['FEEDBACK', 'WAITING', 'APPROVE', 'REVIEW', 'QC', 'PENDING', 'CHECK'];
        if (WAITING_KEYWORDS.some(k => s.includes(k))) return 'WAITING';
        return 'DOING';
    };

    const { todoTasks, doingTasks, waitingTasks, doneTasks, allDoneTasks } = useMemo(() => {
        const activeTasks = tasks.filter(t => !t.isUnscheduled && t.type !== 'CONTENT');
        const doneCutoffDate = subDays(new Date(), 7);

        return {
            todoTasks: activeTasks.filter(t => getPhase(t.status as string) === 'TODO'),
            doingTasks: activeTasks.filter(t => getPhase(t.status as string) === 'DOING'),
            waitingTasks: activeTasks.filter(t => getPhase(t.status as string) === 'WAITING'),
            doneTasks: activeTasks.filter(t => {
                if (getPhase(t.status as string) !== 'DONE') return false;
                return isAfter(new Date(t.endDate), doneCutoffDate);
            }),
            allDoneTasks: activeTasks.filter(t => getPhase(t.status as string) === 'DONE'),
        };
    }, [tasks]);

    const handleDropTask = (taskId: string, targetType: ColumnType) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !onUpdateTask) return;

        if (targetType === 'DONE' && !isAdmin) {
            showAlert('🔒 เฉพาะหัวหน้า/Admin เท่านั้นที่สามารถย้ายงานไปช่อง "เสร็จแล้ว" ได้\n\nกรุณากด "ส่งงาน" ในหน้าแก้ไขงาน เพื่อให้หัวหน้าตรวจสอบครับ');
            return;
        }

        const currentType = getPhase(task.status as string);
        if (currentType === targetType) return;

        let newStatus = task.status;
        if (targetType === 'TODO') newStatus = 'TODO';
        else if (targetType === 'DOING') newStatus = 'DOING';
        else if (targetType === 'DONE' && isAdmin) newStatus = 'DONE';
        else if (targetType === 'WAITING') newStatus = task.type === 'CONTENT' ? 'FEEDBACK' : 'WAITING';
        else return;

        onUpdateTask({ ...task, status: newStatus });
    };

    const getModalData = () => {
        switch (activeModalColumn) {
            case 'TODO': return { title: '🎒 รายการที่รอทำ (To Do)', tasks: todoTasks, theme: 'slate' };
            case 'DOING': return { title: '⚡ กำลังลุยงาน (Doing)', tasks: doingTasks, theme: 'blue' };
            case 'WAITING': return { title: '☕ รอตรวจ / รอผล (Waiting)', tasks: waitingTasks, theme: 'orange' };
            case 'DONE': return { title: '', tasks: [], theme: 'green' }; 
            default: return { title: '', tasks: [], theme: 'slate' };
        }
    };
    const modalData = getModalData();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`min-h-0 flex flex-col rounded-[2.5rem] border shadow-2xl overflow-hidden relative group transition-all duration-300 ${
                isUltimate 
                    ? 'h-full bg-[#0a0c16]/30 backdrop-blur-xl border-indigo-500/20 text-white' 
                    : 'h-full bg-white/40 backdrop-blur-xl border-white/60 text-slate-800'
            }`}
        >
            {/* Animated Background Blobs */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 45, 0],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${
                    isUltimate ? 'bg-indigo-500/10' : 'bg-indigo-200'
                }`}
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.3, 1],
                    x: [0, -30, 0],
                    opacity: [0.05, 0.15, 0.05]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none ${
                    isUltimate ? 'bg-purple-500/10' : 'bg-purple-200'
                }`}
            />

            {/* Header Section */}
            <div className="p-8 pb-4 relative z-10 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-bold tracking-tight leading-none ${isUltimate ? 'text-indigo-200' : 'text-slate-800'}`}>กระดานงานของฉัน</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">My Personal Work Board</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className={`px-4 py-2 rounded-2xl shadow-sm border ${
                            isUltimate 
                                ? 'bg-slate-900/60 border-indigo-500/20' 
                                : 'bg-white/80 border-slate-100'
                        }`}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isUltimate ? 'text-slate-400' : 'text-slate-500'}`}>Total Tasks: </span>
                            <span className={`text-sm font-black ${isUltimate ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                {todoTasks.length + doingTasks.length + waitingTasks.length + doneTasks.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 4-Column Grid - Side-by-side horizontal scroll under xl, grid on xl+ */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 min-h-0 p-6 pt-2 relative z-10 overflow-x-auto overflow-y-auto"
            >
                <div className={`flex xl:grid xl:grid-cols-4 gap-5 h-full w-max xl:w-full ${isUltimate ? '' : 'min-h-[500px]'}`}>
                    <WorkColumn 
                        type="TODO" 
                        tasks={todoTasks} 
                        users={users}
                        masterOptions={masterOptions}
                        isDroppable={true}
                        onDropTask={handleDropTask}
                        onOpenTask={onOpenTask}
                        onDeleteTask={onDeleteTask}
                        onViewAll={() => setActiveModalColumn('TODO')}
                        isUltimate={isUltimate}
                    />

                    <WorkColumn 
                        type="DOING" 
                        tasks={doingTasks} 
                        users={users}
                        masterOptions={masterOptions}
                        isDroppable={true}
                        onDropTask={handleDropTask}
                        onOpenTask={onOpenTask}
                        onDeleteTask={onDeleteTask}
                        onViewAll={() => setActiveModalColumn('DOING')}
                        isUltimate={isUltimate}
                    />

                    <WorkColumn 
                        type="WAITING" 
                        tasks={waitingTasks} 
                        users={users}
                        masterOptions={masterOptions}
                        isDroppable={false}
                        onDropTask={() => {}}
                        onOpenTask={onOpenTask}
                        onDeleteTask={onDeleteTask}
                        onViewAll={() => setActiveModalColumn('WAITING')}
                        isUltimate={isUltimate}
                    />

                    <WorkColumn 
                        type="DONE" 
                        tasks={doneTasks} 
                        users={users}
                        masterOptions={masterOptions}
                        isDroppable={isAdmin}
                        onDropTask={handleDropTask}
                        onOpenTask={onOpenTask}
                        onDeleteTask={onDeleteTask}
                        onViewAll={() => setIsDoneHistoryOpen(true)}
                        isUltimate={isUltimate}
                    />
                </div>
            </div>

            {/* Modals */}
            <TaskCategoryModal 
                isOpen={!!activeModalColumn && activeModalColumn !== 'DONE'}
                onClose={() => setActiveModalColumn(null)}
                title={modalData.title}
                tasks={modalData.tasks}
                channels={[]} 
                onEditTask={onOpenTask}
                colorTheme={modalData.theme}
            />

            <DoneHistoryModal 
                isOpen={isDoneHistoryOpen}
                onClose={() => setIsDoneHistoryOpen(false)}
                tasks={allDoneTasks}
                onOpenTask={onOpenTask}
            />
        </motion.div>
    );
};

export default MyWorkBoard;

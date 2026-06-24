
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, MasterOption } from '../../../types';
import { AlertTriangle, Wrench, ArrowRight, CheckCircle2, Clock, List, Flame, Siren, Megaphone, Sparkles, Star } from 'lucide-react';
import { isPast, isToday, addDays, isBefore, differenceInCalendarDays, startOfDay } from 'date-fns';
import TaskCategoryModal from '../../TaskCategoryModal';
import { isTaskCompleted, STATUS_LABELS } from '../../../constants';

// --- Card Component (Mission Alert Style) ---
interface CardItemProps {
    task: Task;
    isRevise?: boolean;
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onOpenTask: (task: Task) => void;
    today: Date; // รับค่าวันนี้ที่ถูกจัดการมาแล้วจาก Parent
}

const CardItem: React.FC<CardItemProps> = ({ task, isRevise = false, channels, users, masterOptions, onOpenTask, today }) => {
    const taskDate = startOfDay(new Date(task.endDate));
    const isOverdue = taskDate < today;
    const channel = channels.find(c => c.id === task.channelId);
    
    // Determine Assignee to show
    const assigneeId = task.assigneeIds?.[0] || task.ideaOwnerIds?.[0] || task.editorIds?.[0];
    const assignee = users.find(u => u.id === assigneeId);

    const getDeadlineText = (targetDate: Date) => {
        const diff = differenceInCalendarDays(targetDate, today);
        
        if (diff < 0) return `${Math.abs(diff)} วันที่แล้ว`;
        if (diff === 0) return 'ส่งวันนี้!';
        if (diff === 1) return 'พรุ่งนี้';
        return `อีก ${diff} วัน`;
    };

    // Helper for Status Badge (Small pill)
    const getStatusBadge = () => {
        const s = (task.status || '').toString().toUpperCase();
        
        // 1. Try to find label from Master Options (Prioritize STATUS and TASK_STATUS types)
        let masterStatus = masterOptions.find(opt => 
            (opt.type === 'STATUS' || opt.type === 'TASK_STATUS') && 
            opt.key.toUpperCase() === s
        );

        // 2. Fallback: Search any master option by key if not found in specific types
        if (!masterStatus) {
            masterStatus = masterOptions.find(opt => opt.key.toUpperCase() === s);
        }
        
        const label = masterStatus?.label || STATUS_LABELS[s as any] || task.status;

        if (s === 'WAITING' || s === 'FEEDBACK' || s === 'FEEDBACK_1') return { text: label, color: 'bg-yellow-100 text-yellow-700' };
        if (s === 'REVISE' || s.includes('EDIT')) return { text: label, color: 'bg-red-100 text-red-700' };
        if (s === 'DONE' || s === 'APPROVE') return { text: label, color: 'bg-emerald-100 text-emerald-700' };
        return { text: label, color: 'bg-gray-100 text-gray-600' };
    };
    const badge = getStatusBadge();
    const isContent = task.type === 'CONTENT';

    return (
        <div 
            onClick={() => onOpenTask(task)}
            className={`
                relative p-4 rounded-2xl border-l-4 transition-all cursor-pointer group/item flex flex-col gap-2 shadow-sm hover:-translate-y-1 hover:shadow-md
                ${isRevise 
                    ? 'bg-red-50/80 border-l-red-400 border-y border-r border-white/50 hover:bg-red-50' 
                    : 'bg-amber-50/80 border-l-amber-400 border-y border-r border-white/50 hover:bg-amber-50'
                }
            `}
        >
            {/* Header: Status Pill */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Type Badge */}
                    <span className={`flex items-center text-[9px] font-black px-1.5 py-0.5 rounded-md border shadow-sm ${isContent ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                        {isContent ? <Megaphone className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {isContent ? 'Content' : 'Task'}
                    </span>

                    {channel && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border bg-white/80 ${channel.color}`}>
                            {channel.name}
                        </span>
                    )}
                    
                    {/* Status Badge - Always show label instead of key */}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border border-black/5 ${badge.color}`}>
                        {badge.text}
                    </span>

                    {isRevise && (
                         <span className="flex items-center text-[9px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                            <Wrench className="w-3 h-3 mr-1" /> แก้ไขด่วน
                        </span>
                    )}
                    {!isRevise && isOverdue && (
                        <span className="flex items-center text-[9px] font-black text-white bg-red-500 px-2 py-0.5 rounded-md shadow-sm animate-pulse">
                            🔥 สายแล้ว!
                        </span>
                    )}
                     {!isRevise && !isOverdue && (
                        <span className="flex items-center text-[9px] font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-md">
                            ⚡ ด่วน
                        </span>
                    )}
                </div>
            </div>

            {/* Content: Title */}
            <div>
                <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 group-hover/item:text-indigo-700 transition-colors">
                    {task.title}
                </h4>
            </div>

            {/* Footer: User & Date */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 mt-1">
                {/* User Check */}
                <div className="flex items-center gap-2">
                    {assignee ? (
                        <div className="flex items-center gap-1.5 bg-white/60 pr-2 pl-1 py-0.5 rounded-full border border-black/5">
                            <img src={assignee.avatarUrl} className="w-4 h-4 rounded-full object-cover" />
                            <span className="text-[10px] font-bold text-gray-600 truncate max-w-[60px]">{assignee.name.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <span className="text-[10px] text-gray-400 italic">...</span>
                    )}
                </div>

                {/* Date */}
                <div className={`flex items-center text-[10px] font-black ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {getDeadlineText(taskDate)}
                </div>
            </div>
            
            {/* Action Arrow (Hover) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity transform group-hover/item:translate-x-1">
                <div className="p-1 bg-white rounded-full shadow-sm text-indigo-600">
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

interface FocusZoneProps {
    tasks: Task[];
    channels: Channel[]; 
    users: User[];
    masterOptions: MasterOption[]; // Add Prop
    onOpenTask: (task: Task) => void;
}

const FocusZone: React.FC<FocusZoneProps> = ({ tasks, channels, users, masterOptions, onOpenTask }) => {
    // กำหนดวันที่ปัจจุบันโดยล้างเวลาออกตั้งแต่ต้นทาง
    const today = startOfDay(new Date());
    
    const [viewAllType, setViewAllType] = useState<'URGENT' | 'REVISE' | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'TASK' | 'CONTENT'>('ALL'); // New State

    // Filter Logic
    const filteredTasks = tasks.filter(t => {
        if (activeTab === 'ALL') return true;
        return t.type === activeTab;
    });

    const checkIsUrgent = (t: Task) => {
        const isDone = isTaskCompleted(t.status as string);
        if (isDone) return false;
        if (t.isUnscheduled) return false;

        const s = t.status as string;
        const isReviseStatus = s === 'FEEDBACK' || s === 'WAITING' || s === 'REVISE' || s.includes('EDIT_DRAFT');
        if (isReviseStatus) return false;
        
        const taskDate = startOfDay(new Date(t.endDate));
        const diff = differenceInCalendarDays(taskDate, today);
        
        // เป็นงานด่วนหาก: สายแล้ว (diff < 0), ส่งภายใน 2 วัน (0, 1, 2), หรือตั้ง Priority URGENT
        const isOverdue = diff < 0;
        const isDueSoon = diff >= 0 && diff <= 2; 
        
        return isOverdue || isDueSoon || t.priority === 'URGENT';
    };

    const checkIsRevise = (t: Task) => {
        if (t.isUnscheduled) return false;
        const s = t.status as string;
        if (isTaskCompleted(s)) return false; 
        
        // Include BOTH Content (FEEDBACK) and General Task (WAITING) + explicit Revise statuses
        return s === 'FEEDBACK' || s === 'WAITING' || s === 'REVISE' || s.includes('EDIT_DRAFT');
    };

    const urgentTasks = filteredTasks.filter(checkIsUrgent).sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    const reviseTasks = filteredTasks.filter(checkIsRevise);

    // Calculate system-wide lists (all tabs)
    const systemUrgentTasks = tasks.filter(checkIsUrgent);
    const systemReviseTasks = tasks.filter(checkIsRevise);
    const hasNoTasksAtAll = systemUrgentTasks.length === 0 && systemReviseTasks.length === 0;

    // SCENARIO 1: No urgent/revise tasks in the system at all (Render full-cover Ambient/Soothing Zen view)
    if (hasNoTasksAtAll) {
        return (
            <div className="bg-gradient-to-tr from-emerald-50/90 via-sky-50/90 to-teal-50/80 rounded-[2.5rem] p-8 text-center shadow-xl border-4 border-white flex flex-col items-center justify-center h-full min-h-[350px] relative overflow-hidden">
                {/* Decorative Breathing Sparkles */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.25, 1],
                        rotate: [0, 12, -12, 0],
                        y: [0, -10, 0],
                        opacity: [0.3, 0.65, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 left-10 text-emerald-400/80 pointer-events-none"
                >
                    <Sparkles className="w-8 h-8" />
                </motion.div>
                <motion.div 
                    animate={{ 
                        scale: [1, 1.4, 1],
                        y: [0, 12, 0],
                        opacity: [0.2, 0.55, 0.2]
                    }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1, ease: "easeInOut" }}
                    className="absolute bottom-12 right-12 text-teal-400/80 pointer-events-none"
                >
                    <Star className="w-6 h-6 fill-current text-teal-300" />
                </motion.div>
                <motion.div 
                    animate={{ 
                        scale: [0.9, 1.15, 0.9],
                        x: [0, -8, 0],
                        opacity: [0.25, 0.5, 0.25]
                    }}
                    transition={{ duration: 4.5, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
                    className="absolute top-20 right-16 text-emerald-300 pointer-events-none"
                >
                    <Sparkles className="w-5 h-5" />
                </motion.div>
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        x: [0, 10, 0],
                        opacity: [0.15, 0.4, 0.15]
                    }}
                    transition={{ duration: 6, repeat: Infinity, delay: 2, ease: "easeInOut" }}
                    className="absolute bottom-16 left-16 text-sky-300 pointer-events-none"
                >
                    <Star className="w-4 h-4 fill-current text-sky-300" />
                </motion.div>

                {/* Main Icon with Glow */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: 1, 
                        opacity: 1,
                        rotate: [0, -4, 4, -4, 0]
                    }}
                    transition={{ 
                        scale: { type: "spring", stiffness: 180, damping: 12 },
                        rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="relative mb-6"
                >
                    <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10 border-4 border-emerald-50">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-pulse" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-xl font-bold text-emerald-800 mb-2 relative inline-block">
                        <span className="relative z-10">ว่างจัง... ฮูเล่! ✨</span>
                    </h2>
                    <p className="text-emerald-700/80 text-sm font-medium max-w-[220px] mx-auto leading-relaxed">
                        ไม่มีงานด่วนหรือแก้ไขให้กวนใจ<br/>
                        <span className="text-emerald-500 font-black">พักผ่อนให้เต็มที่เลยนะ! 🌈</span>
                    </p>
                </motion.div>
            </div>
        );
    }

    // BASE LAYOUT: Show tabs and layout because there are some tasks somewhere, even if the current tab is empty
    return (
        <div className="bg-gradient-to-br from-rose-50/80 to-orange-50/80 backdrop-blur-md rounded-[2.5rem] border-4 border-white shadow-xl shadow-orange-100/50 p-5 h-full flex flex-col gap-5 relative overflow-hidden">
            
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

            {/* Title & Tabs */}
            <div className="flex flex-col gap-4 relative z-10 px-1">
                <h3 className="text-[24px] font-bold text-slate-700 flex items-center">
                    <div className="p-2 bg-white rounded-xl shadow-sm mr-3 text-red-500 animate-pulse">
                         <Siren className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">EMERGENCY</span>
                        <span>งานเข้า! (Mission)</span>
                    </div>
                </h3>

                {/* Modern Sliding Tab Switch */}
                <div className="relative flex bg-white/40 p-1.5 rounded-2xl border border-white/60 backdrop-blur-sm">
                    {/* Sliding Background */}
                    <div 
                        className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-sm transition-all duration-300 ease-out border border-white/50"
                        style={{
                            left: activeTab === 'ALL' ? '6px' : activeTab === 'TASK' ? '33.33%' : '66.66%',
                            width: 'calc(33.33% - 4px)',
                            transform: activeTab === 'TASK' ? 'translateX(2px)' : activeTab === 'CONTENT' ? 'translateX(-2px)' : 'translateX(0)'
                        }}
                    ></div>

                    {/* Tab Buttons */}
                    <button 
                        onClick={() => setActiveTab('ALL')}
                        className={`relative z-10 flex-1 py-2 text-[11px] font-black rounded-xl transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'ALL' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <List className="w-3.5 h-3.5" /> ทั้งหมด
                    </button>
                    <button 
                        onClick={() => setActiveTab('TASK')}
                        className={`relative z-10 flex-1 py-2 text-[11px] font-black rounded-xl transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'TASK' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> ทั่วไป
                    </button>
                    <button 
                        onClick={() => setActiveTab('CONTENT')}
                        className={`relative z-10 flex-1 py-2 text-[11px] font-black rounded-xl transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'CONTENT' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Megaphone className="w-3.5 h-3.5" /> คอนเทนต์
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 relative z-10 overflow-y-auto pr-1 flex-1">
                {/* SCENARIO 2: No tasks for the *currently selected tab*, but some tasks exist in other tabs */}
                {urgentTasks.length === 0 && reviseTasks.length === 0 ? (
                    <div className="bg-white/50 backdrop-blur-xs rounded-[2rem] p-6 text-center shadow-xs border border-white/60 flex flex-col items-center justify-center flex-1 min-h-[180px] my-auto">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-slate-400 flex flex-col items-center flex-1 justify-center"
                        >
                            <span className="text-3xl mb-3 animate-bounce">💫</span>
                            <p className="text-[13px] font-bold text-slate-600 mb-1">ไม่มีงานในหมวดหมู่นี้</p>
                            <p className="text-[11px] text-slate-500 bg-white/60 px-3 py-1.5 rounded-full border border-white/80 shadow-2xs">
                                ลองสลับตรวจสอบที่แท็บอื่นดูนะ! 🌈
                            </p>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        {/* 1. REVISE ZONE (Top Priority) */}
                        {reviseTasks.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center">
                                        <Wrench className="w-3 h-3 mr-1" /> ต้องแก้ / รอตรวจ (Revise/Wait)
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {reviseTasks.slice(0, 3).map(task => (
                                        <CardItem 
                                            key={task.id} 
                                            task={task} 
                                            isRevise={true} 
                                            channels={channels} 
                                            users={users}
                                            masterOptions={masterOptions}
                                            onOpenTask={onOpenTask} 
                                            today={today}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. URGENT ZONE */}
                        {urgentTasks.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center px-2 mt-2">
                                     <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center">
                                        <Flame className="w-3 h-3 mr-1" /> ไฟลุก (Urgent)
                                     </span>
                                </div>
                                <div className="space-y-2">
                                    {urgentTasks.slice(0, reviseTasks.length > 0 ? 2 : 4).map(task => (
                                        <CardItem 
                                            key={task.id} 
                                            task={task} 
                                            channels={channels} 
                                            users={users}
                                            masterOptions={masterOptions}
                                            onOpenTask={onOpenTask} 
                                            today={today}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* View All Button */}
            {(urgentTasks.length > 3 || reviseTasks.length > 3) && (
                <button 
                    onClick={() => setViewAllType(reviseTasks.length > 0 ? 'REVISE' : 'URGENT')}
                    className="mt-auto w-full py-3 bg-white/80 border border-white text-slate-500 rounded-2xl text-xs font-bold hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <List className="w-3 h-3" /> ดูทั้งหมด
                </button>
            )}

            {/* Drill Down Modal */}
            <TaskCategoryModal 
                isOpen={!!viewAllType}
                onClose={() => setViewAllType(null)}
                title={viewAllType === 'REVISE' ? 'รายการงานแก้ / รอปรับ (Revise)' : 'รายการงานด่วน / ใกล้ส่ง (Urgent)'}
                tasks={viewAllType === 'REVISE' ? reviseTasks : urgentTasks}
                channels={channels}
                masterOptions={masterOptions}
                onEditTask={onOpenTask}
                colorTheme={viewAllType === 'REVISE' ? 'red' : 'orange'}
            />
        </div>
    );
};

export default FocusZone;

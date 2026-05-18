
import React, { useState, useRef, useEffect } from 'react';
import { Task, User, Status } from '../../types';
import { RefreshCw, AlertCircle, MessageSquare, Check, ArrowRight, Calendar, Clock, Sparkles, ChevronDown, User as UserIcon, Search, X } from 'lucide-react';
import { format, addDays, isValid, parse } from 'date-fns';
import { STATUS_COLORS } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface MeetingActionModuleProps {
    users: User[];
    tasks: Task[];
    projectTags: string[];
    meetingTitle: string; // Used for context display
    meetingDate: Date;
    onAddTask: (title: string, assigneeId: string, type: 'TASK' | 'CONTENT', targetDate?: Date) => Promise<void>;
    onUpdateTask: (task: Task, updateType: 'DONE' | 'NOTE') => Promise<void>;
}

// Internal type for recent activity visual feedback
interface RecentAction {
    id: string;
    title: string;
    assignee: string;
    dateLabel: string;
}

const MeetingActionModule: React.FC<MeetingActionModuleProps> = ({ 
    users, tasks, projectTags, meetingTitle, meetingDate, onAddTask, onUpdateTask 
}) => {
    // Input State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    const [taskType, setTaskType] = useState<'TASK' | 'CONTENT'>('TASK');
    const [targetDateStr, setTargetDateStr] = useState(''); // Empty = ASAP
    
    // UI State
    const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);


    const selectedAssignee = users.find(u => u.id === newTaskAssignee);
    const filteredUsers = users.filter(u => 
        u.isActive && 
        u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
    );

    // Filter Linked Tasks (Existing Logic)
    const linkedTasks = React.useMemo(() => {
        if (!projectTags || projectTags.length === 0) return [];
        return tasks.filter(t => 
            t.tags?.some(tag => projectTags.includes(tag)) && 
            t.status !== 'DONE' && 
            t.status !== 'APPROVE'
        );
    }, [tasks, projectTags]);

    const handleAdd = async () => {
        if (!newTaskTitle || !newTaskAssignee) return;
        
        const finalDate = targetDateStr ? new Date(targetDateStr) : new Date();
        
        await onAddTask(newTaskTitle, newTaskAssignee, taskType, finalDate);
        
        // Add to local visual list
        const assigneeName = users.find(u => u.id === newTaskAssignee)?.name || 'Unknown';
        const dateDisplay = targetDateStr ? format(finalDate, 'd MMM') : 'ASAP';
        
        setRecentActions(prev => [{
            id: crypto.randomUUID(),
            title: newTaskTitle,
            assignee: assigneeName,
            dateLabel: dateDisplay
        }, ...prev]);

        // Reset inputs
        setNewTaskTitle('');
        setNewTaskAssignee('');
        setTargetDateStr('');
    };

    // Quick Date Helpers
    const setQuickDate = (daysToAdd: number) => {
        const target = addDays(new Date(), daysToAdd);
        setTargetDateStr(format(target, 'yyyy-MM-dd'));
    };

    return (
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 md:space-y-10 bg-white/20 backdrop-blur-xl scrollbar-thin scrollbar-thumb-slate-200/50">
            
            {/* 1. New Action Item Form (Glassy & 3D) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden group"
            >
                 {/* Decor */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-bl-[10rem] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 rounded-tr-[5rem] pointer-events-none" />

                <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center relative z-10 tracking-tight">
                    <span className="bg-indigo-100/80 p-2.5 rounded-2xl mr-4 text-indigo-600 shadow-sm border border-white/60">
                        <AlertCircle className="w-6 h-6" />
                    </span>
                    สั่งงาน / นัดหมาย (Assign Action)
                </h3>
                
                <div className="space-y-6 relative z-10">
                    {/* Task Title */}
                    <div className="group/input">
                        <input 
                            type="text" 
                            className="w-full px-6 py-4 rounded-2xl border border-white/80 outline-none focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 text-lg font-bold text-slate-700 placeholder:text-slate-300 transition-all bg-white/60 shadow-inner"
                            placeholder={taskType === 'TASK' ? "เช่น หารูป Ref, จองสตูดิโอ..." : "เช่น ถ่ายคลิป Vlog..."}
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Custom Assignee Selection (Avatar List) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[12px] font-kanit font-bold text-slate-400 uppercase tracking-widest opacity-70">มอบหมายให้ (Who)</label>
                                {selectedAssignee && (
                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                        {selectedAssignee.name}
                                    </span>
                                )}
                            </div>
                            
                            <div className="relative group/search">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="ค้นหาชื่อ..."
                                    className="w-full pl-9 pr-4 py-2 bg-white/40 border border-white/60 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all shadow-inner"
                                    value={assigneeSearch}
                                    onChange={e => setAssigneeSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar -mx-2 px-2 scroll-smooth">
                                {filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => setNewTaskAssignee(user.id)}
                                        className={`flex flex-col items-center gap-2 shrink-0 transition-all group/avatar ${newTaskAssignee === user.id ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                                    >
                                        <div className={`
                                            w-12 h-12 rounded-full border-2 p-0.5 transition-all relative
                                            ${newTaskAssignee === user.id 
                                                ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg' 
                                                : 'border-white/80 bg-white/40 group-hover/avatar:border-indigo-200'
                                            }
                                        `}>
                                            <img 
                                                src={user.avatarUrl} 
                                                className={`w-full h-full rounded-full object-cover ${newTaskAssignee === user.id ? '' : 'grayscale group-hover/avatar:grayscale-0'}`} 
                                                referrerPolicy="no-referrer" 
                                            />
                                            {newTaskAssignee === user.id && (
                                                <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold truncate w-16 text-center ${newTaskAssignee === user.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                                            {user.name.split(' ')[0]}
                                        </span>
                                    </button>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="w-full py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                        ไม่พบรายชื่อ
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Custom Date Picker UI */}
                        <div className="space-y-2">
                            <label className="text-[12px] font-kanit font-bold text-slate-400 uppercase tracking-widest ml-2 opacity-70 flex justify-between">
                                <span>กำหนดส่ง (When)</span>
                                <span className="text-indigo-500 font-bold">{targetDateStr ? format(new Date(targetDateStr), 'EEE, d MMM') : 'ASAP (เร็วที่สุด)'}</span>
                            </label>
                            <div className="flex gap-3">
                                <div className="relative flex-1 group/date">
                                    <Calendar className="w-5 h-5 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <div className="relative w-full">
                                        {/* Display Layer */}
                                        <div className="absolute inset-0 px-12 py-4 rounded-2xl border border-white/80 bg-white/60 flex items-center text-sm font-bold text-slate-700 pointer-events-none shadow-sm group-hover/date:bg-white transition-colors">
                                            {targetDateStr ? format(new Date(targetDateStr), 'dd/MM/yyyy') : 'dd/mm/yyyy'}
                                        </div>
                                        {/* Actual Input Layer (Invisible but clickable) */}
                                        <input 
                                            ref={dateInputRef}
                                            type="date" 
                                            className="w-full opacity-0 px-12 py-4 rounded-2xl cursor-pointer relative z-20"
                                            value={targetDateStr}
                                            onChange={e => setTargetDateStr(e.target.value)}
                                            onClick={(e) => {
                                                try {
                                                    if ('showPicker' in HTMLInputElement.prototype) {
                                                        (e.target as any).showPicker();
                                                    }
                                                } catch (err) {
                                                    console.warn('showPicker failed:', err);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Quick Chips */}
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                                {[
                                    { label: 'พรุ่งนี้', days: 1 },
                                    { label: '3 วัน', days: 3 },
                                    { label: 'อาทิตย์หน้า', days: 7 },
                                    { label: '2 อาทิตย์', days: 14 }
                                ].map(chip => (
                                    <button 
                                        key={chip.days}
                                        onClick={() => setQuickDate(chip.days)} 
                                        className="px-4 py-2 bg-white/60 border border-white/80 hover:border-indigo-200 hover:text-indigo-600 hover:bg-white text-[12px] font-bold rounded-xl transition-all whitespace-nowrap shadow-sm active:scale-95"
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                         {/* Type Toggles */}
                        <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-inner w-full sm:w-auto">
                            <button 
                                onClick={() => setTaskType('TASK')}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${taskType === 'TASK' ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                General Task
                            </button>
                            <button 
                                onClick={() => setTaskType('CONTENT')}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${taskType === 'CONTENT' ? 'bg-white shadow-md text-orange-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Content
                            </button>
                        </div>

                        <button 
                            onClick={handleAdd}
                            disabled={!newTaskTitle || !newTaskAssignee}
                            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-10 py-4 rounded-2xl font-bold text-sm shadow-[0_12px_24px_-8px_rgba(99,102,241,0.4)] hover:shadow-[0_16px_32px_-8px_rgba(99,102,241,0.5)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-white/20"
                        >
                            สั่งการ <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Recently Created List (Visual Feedback) */}
                <AnimatePresence>
                    {recentActions.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-10 pt-6 border-t border-white/40"
                        >
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 opacity-70">เพิ่งสั่งไปล่าสุด (Recent)</p>
                            <div className="space-y-3">
                                {recentActions.slice(0, 3).map(action => (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={action.id} 
                                        className="flex items-center justify-between bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/60 text-xs shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-1.5 bg-emerald-100/80 text-emerald-600 rounded-xl shadow-sm border border-white/60"><Check className="w-3.5 h-3.5" /></div>
                                            <span className="font-bold text-slate-700 truncate">{action.title}</span>
                                            <span className="text-slate-300">→</span>
                                            <span className="font-bold text-indigo-600">{action.assignee}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold bg-white/60 px-2 py-1 rounded-lg border border-white/60 whitespace-nowrap ml-3">{action.dateLabel}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            
            {/* 2. Linked Tasks (Follow-up) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-8 shadow-lg relative overflow-hidden"
            >
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center tracking-tight">
                        <span className="bg-slate-100/80 p-2.5 rounded-2xl mr-4 text-slate-600 shadow-sm border border-white/60">
                            <RefreshCw className="w-5 h-5" />
                        </span>
                        ติดตามงานเก่า {projectTags.length > 0 && <span className="text-indigo-500 ml-2">#{projectTags.join(', #')}</span>}
                    </h3>
                    <span className="text-xs bg-white/60 text-slate-500 px-4 py-1.5 rounded-xl font-bold border border-white/60 shadow-sm">{linkedTasks.length} pending</span>
                </div>
                
                {!projectTags || projectTags.length === 0 ? (
                    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-10 border-2 border-dashed border-white/60 text-center text-slate-400">
                        <p className="font-bold">ยังไม่ได้ใส่ Project Tag ด้านบน</p>
                        <p className="text-xs mt-2 opacity-70">ใส่ Tag ให้ตรงกันเพื่อดึงงานเก่ามาตาม</p>
                    </div>
                ) : linkedTasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white/20 backdrop-blur-md rounded-3xl border-2 border-dashed border-white/60">
                        <div className="w-16 h-16 bg-white/40 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-white/60">
                            <Sparkles className="w-8 h-8 text-yellow-400" />
                        </div>
                        <p className="font-bold text-lg text-slate-500">เย้! ไม่มีงานค้างในโปรเจคนี้</p>
                        <p className="text-xs mt-1 opacity-70">ทีมงานจัดการได้ยอดเยี่ยมมาก</p>
                    </div>
                ) : (
                    <div className="space-y-3 relative z-10 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200/50">
                        {linkedTasks.map(task => (
                            <motion.div 
                                layout
                                key={task.id} 
                                className="flex items-center justify-between p-4 rounded-2xl border border-white/60 bg-white/40 hover:bg-white/80 hover:border-indigo-200 transition-all group shadow-sm"
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`w-3 h-3 shrink-0 rounded-full shadow-sm ${STATUS_COLORS[task.status as Status]?.split(' ')[0] || 'bg-slate-300'}`}></div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-700 text-sm truncate group-hover:text-indigo-600 transition-colors">{task.title}</p>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5">
                                                <img 
                                                    src={users.find(u => u.id === task.assigneeIds[0])?.avatarUrl} 
                                                    className="w-4 h-4 rounded-full border border-white shadow-sm"
                                                    referrerPolicy="no-referrer"
                                                />
                                                {users.find(u => u.id === task.assigneeIds[0])?.name || 'Unassigned'}
                                            </span>
                                            <span className="opacity-30">•</span>
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> Due: {format(task.endDate, 'd MMM')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2 group-hover:translate-x-0 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-x-4">
                                    <button 
                                        onClick={() => onUpdateTask(task, 'NOTE')}
                                        className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold text-slate-600 bg-white shadow-sm border border-slate-100 rounded-xl hover:border-indigo-300 hover:text-indigo-600 active:scale-95 transition-all"
                                    >
                                        Note
                                    </button>
                                    <button 
                                        onClick={() => onUpdateTask(task, 'DONE')}
                                        className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 shadow-sm border border-emerald-100 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all"
                                    >
                                        Done
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default MeetingActionModule;

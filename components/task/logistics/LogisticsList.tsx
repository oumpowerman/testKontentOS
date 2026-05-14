import React from 'react';
import { Task, User } from '../../../types';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Calendar, User as UserIcon, Lock, Search, Eye, EyeOff, Trash2, UserPlus } from 'lucide-react';

interface LogisticsListProps {
    subTasks: Task[];
    isLoading: boolean;
    users: User[];
    onItemClick: (task: Task) => void;
    onToggleShowOnBoard: (task: Task) => void;
    onDelete: (id: string) => void;
    onOpenTask?: (task: Task, currentViewMode?: string) => void;
}

const LogisticsList: React.FC<LogisticsListProps> = ({
    subTasks,
    isLoading,
    users,
    onItemClick,
    onToggleShowOnBoard,
    onDelete,
    onOpenTask
}) => {
    return (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {isLoading ? (
                <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
            ) : subTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                    <p>ยังไม่มีงานย่อยในโปรเจกต์นี้</p>
                </div>
            ) : (
                subTasks.map(task => {
                    const isDone = task.status === 'DONE';
                    const isWaiting = task.status === 'WAITING';
                    const hasAssignee = task.assigneeIds && task.assigneeIds.length > 0;
                    const assignee = hasAssignee ? users.find(u => u.id === task.assigneeIds[0]) : null;

                    return (
                        <div 
                            key={task.id} 
                            className={`
                                group flex items-center gap-3 p-3 bg-white border rounded-xl transition-all 
                                ${isDone ? 'opacity-60 bg-gray-50 border-gray-200' : 'hover:border-indigo-300 hover:shadow-sm'}
                                ${!hasAssignee && !isDone ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}
                            `}
                        >
                            <button 
                                onClick={() => onItemClick(task)} 
                                className={`shrink-0 transition-colors ${
                                    isDone ? 'text-green-500' : 
                                    isWaiting ? 'text-yellow-500 cursor-not-allowed' : 
                                    'text-gray-300 hover:text-indigo-500'
                                }`}
                            >
                                {isDone ? <CheckCircle2 className="w-6 h-6" /> : isWaiting ? <Lock className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>
                            
                            <div className="flex-1 min-w-0 pointer-events-auto">
                                <button 
                                    onClick={() => onOpenTask ? onOpenTask(task, 'DETAILS') : undefined}
                                    className={`text-sm font-medium text-left hover:text-indigo-600 transition-colors ${isDone ? 'line-through text-gray-500' : 'text-gray-800'}`}
                                >
                                    {task.title}
                                </button>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                    <Calendar className="w-3 h-3" /> {format(task.startDate, 'd MMM')}
                                    {!hasAssignee && !isDone && (
                                        <span className="text-[9px] bg-amber-500 text-white px-1.5 rounded font-bold uppercase tracking-tighter animate-pulse">
                                            No Assignee
                                        </span>
                                    )}
                                    {task.showOnBoard && (
                                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 rounded border border-indigo-100 flex items-center gap-1">
                                            <Eye className="w-2.5 h-2.5" /> On Board
                                        </span>
                                    )}
                                    {isWaiting && (
                                        <span className="text-[9px] bg-yellow-50 text-yellow-600 px-1.5 rounded border border-yellow-100 flex items-center gap-1">
                                            <Lock className="w-2.5 h-2.5" /> Under Review
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {assignee ? (
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-gray-100">
                                        <img src={assignee.avatarUrl} className="w-4 h-4 rounded-full" />
                                        <span className="hidden sm:inline text-xs font-bold text-gray-600">{assignee.name.split(' ')[0]}</span>
                                    </div>
                                ) : (
                                    <div className={`
                                        w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex flex-col items-center justify-center transition-all
                                        ${!isDone ? 'bg-amber-100 text-amber-600 border-2 border-amber-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}
                                    `}>
                                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                        <span className="text-[7px] font-bold uppercase leading-none mt-0.5">Pick</span>
                                    </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => onOpenTask ? onOpenTask(task, 'DETAILS') : undefined}
                                        className="p-1 sm:p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        title="ดูรายละเอียด"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                    {!isWaiting && (
                                        <>
                                            <button 
                                                onClick={() => onToggleShowOnBoard(task)} 
                                                className={`hidden sm:block p-1.5 rounded-lg transition-all ${task.showOnBoard ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'}`}
                                                title={task.showOnBoard ? "ซ่อนจากบอร์ดหลัก" : "แสดงบนบอร์ดหลัก"}
                                            >
                                                {task.showOnBoard ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => onDelete(task.id)} 
                                                className="p-1 sm:p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    );
};

export default LogisticsList;

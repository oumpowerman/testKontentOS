import React from 'react';
import { CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { Task, Channel, User as UserType } from '../../../types';
import { isPast, isToday, format } from 'date-fns';
import { getMyRole } from './workloadConstants';

interface MyFocusTabProps {
    groupedTasks: Record<string, Task[]>;
    viewMode: 'GRID' | 'LIST';
    channels: Channel[];
    onOpenTask: (task: Task) => void;
    currentUser: UserType;
}

const MyFocusTab: React.FC<MyFocusTabProps> = ({
    groupedTasks,
    viewMode,
    channels,
    onOpenTask,
    currentUser
}) => {
    if (Object.keys(groupedTasks).length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <CheckCircle2 className="w-20 h-20 text-emerald-300 mb-6" />
                <h3 className="text-2xl font-bold text-gray-600">สุดยอด! เคลียร์งานหมดแล้ว</h3>
                <p className="text-base mt-2">พักผ่อนได้เลย หรือไปช่วยเพื่อนทำก็ได้นะ</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {Object.entries(groupedTasks).map(([groupTitle, items]) => {
                const tasksInGroup = items as Task[];
                return (
                    <div key={groupTitle} className="animate-in slide-in-from-bottom-2 duration-500">
                        <h3 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                            <span className="w-3 h-3 rounded-full bg-indigo-400 mr-3"></span>
                            {groupTitle} 
                            <span className="ml-3 bg-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full">{tasksInGroup.length}</span>
                        </h3>
                        
                        <div className={`grid gap-4 ${viewMode === 'GRID' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                            {tasksInGroup.map(task => {
                                const channel = channels.find(c => c.id === task.channelId);
                                const isOverdue = !task.isUnscheduled && isPast(new Date(task.endDate)) && !isToday(new Date(task.endDate));
                                const roleText = getMyRole(task, currentUser.id);
                                
                                // LIST VIEW RENDER
                                if (viewMode === 'LIST') {
                                    return (
                                        <div 
                                            key={task.id}
                                            onClick={() => onOpenTask(task)}
                                            className={`
                                                bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group relative overflow-hidden
                                                ${isOverdue ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-indigo-400'}
                                            `}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                    {channel && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${channel.color}`}>
                                                            {channel.name}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                        {roleText}
                                                    </span>
                                                    {isOverdue && (
                                                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded animate-pulse">
                                                            Late!
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate group-hover:text-indigo-600 transition-colors">
                                                    {task.title}
                                                </h4>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-0 border-gray-50 pt-2 sm:pt-0 shrink-0">
                                                <div className="flex items-center gap-3">
                                                    {/* Hours Badge (LIST VIEW) */}
                                                    <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg whitespace-nowrap border border-indigo-100">
                                                        {task.estimatedHours}h
                                                    </div>

                                                    <div className={`text-xs sm:text-sm font-bold flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                                        <Calendar className="w-3.5 h-3.5 block sm:hidden text-gray-400" />
                                                        {task.isUnscheduled ? 'Stock' : format(new Date(task.endDate), 'd MMM')}
                                                    </div>
                                                </div>
                                                <div className="p-1.5 rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // GRID VIEW RENDER
                                return (
                                    <div 
                                        key={task.id} 
                                        onClick={() => onOpenTask(task)}
                                        className={`
                                            bg-white p-5 rounded-3xl border-2 transition-all cursor-pointer group hover:shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]
                                            ${isOverdue ? 'border-red-100 hover:border-red-300' : 'border-gray-100 hover:border-indigo-300'}
                                        `}
                                    >
                                        {/* Left Accent */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${channel?.color?.replace('text-', 'bg-')?.split(' ')[0] || 'bg-gray-300'}`}></div>
                                        
                                        {/* Hours Badge (GRID VIEW) */}
                                        <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                            {task.estimatedHours}h
                                        </div>

                                        <div className="pl-4">
                                            <div className="flex justify-between items-start mb-3 mr-8">
                                                <div className="flex flex-wrap gap-2">
                                                    {channel && (
                                                        <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg border border-gray-100">
                                                            {channel.name}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                        {roleText}
                                                    </span>
                                                </div>
                                                {isOverdue && (
                                                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg animate-pulse shadow-sm">
                                                        LATE
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="font-bold text-gray-800 text-lg line-clamp-2 group-hover:text-indigo-600 transition-colors mb-4 leading-tight">
                                                {task.title}
                                            </h4>
                                            
                                            <div className="flex justify-between items-end mt-auto border-t border-gray-50 pt-3">
                                                <div className={`flex items-center text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                                    <Calendar className="w-4 h-4 mr-1.5" />
                                                    {task.isUnscheduled ? 'No Date' : format(new Date(task.endDate), 'd MMM')}
                                                </div>
                                                <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MyFocusTab;

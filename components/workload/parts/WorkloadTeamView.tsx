import React, { useMemo } from 'react';
import { AlertTriangle, ChevronRight, Briefcase, Info } from 'lucide-react';
import { Task, User as UserType } from '../../../types';

interface WorkloadLevel {
    max: number;
    color: string;
    text: string;
    label: string;
}

interface WorkloadItem {
    user: UserType;
    hours: number;
    level: WorkloadLevel;
}

interface WorkloadTeamViewProps {
    workloadData: WorkloadItem[];
    getTasksForUser: (userId: string) => Task[];
    onSelectTeammate: (user: UserType, hours: number, itemTasks: Task[]) => void;
}

const WorkloadTeamView: React.FC<WorkloadTeamViewProps> = ({
    workloadData,
    getTasksForUser,
    onSelectTeammate
}) => {
    // 1. Group members by Position / ตำแหน่ง
    const itemsByPosition = useMemo(() => {
        const groups: Record<string, WorkloadItem[]> = {};
        
        workloadData.forEach(item => {
            const rawPos = item.user.position || '';
            const normalizedPos = rawPos.trim() === '' ? 'ทั่วไป (General Support)' : rawPos;
            
            if (!groups[normalizedPos]) {
                groups[normalizedPos] = [];
            }
            groups[normalizedPos].push(item);
        });
        
        // Sort groups so positions with busier members appear first, or sort positions alphabetically
        return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    }, [workloadData]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Guide Info Banner */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-700 leading-relaxed font-bold">
                    <p>💡 คำแนะนำการควบคุมกำลังคน:</p>
                    <p className="mt-1 text-slate-500 font-medium font-sans">
                        คุณสามารถกดคลิกที่การ์ดของสมาชิกคนใดก็ได้ในแต่ละตำแหน่ง เพื่อเรียกดูรายละเอียดของรายการชิ้นงาน (Task Breakdown) ของสมาชิกรายสัปดาห์นั้นๆ ได้ทันที
                    </p>
                </div>
            </div>

            {itemsByPosition.map(([positionName, list]) => (
                <div key={positionName} className="space-y-4">
                    {/* Position Section Header */}
                    <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            ตำแหน่ง: {positionName}
                            <span className="px-2 py-0.5 bg-slate-200/65 text-slate-600 rounded-full text-[10px] lowercase font-bold">
                                {list.length} คน
                            </span>
                        </h3>
                    </div>

                    {/* Members List Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {list.map((data) => {
                            const memberTasks = getTasksForUser(data.user.id);
                            const tasksCount = memberTasks.length;

                            return (
                                <button
                                    key={data.user.id}
                                    onClick={() => onSelectTeammate(data.user, data.hours, memberTasks)}
                                    className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 text-left group cursor-pointer w-full"
                                >
                                    {/* Avatar Column */}
                                    <div className="relative shrink-0">
                                        <img 
                                            src={data.user.avatarUrl} 
                                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform" 
                                            alt={data.user.name}
                                        />
                                        {data.hours > 45 && (
                                            <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full border-2 border-white animate-bounce shadow-md">
                                                <AlertTriangle className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Details Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-slate-800 text-sm tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                                                    {data.user.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg ${data.level.text} ${data.level.color} bg-opacity-15`}>
                                                        {data.level.label}
                                                    </span>
                                                    <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                                                        {tasksCount} ภารกิจ
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-2xl font-extrabold text-slate-800/80 font-mono tracking-tighter leading-none">
                                                    {data.hours}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-extrabold tracking-widest mt-1 uppercase">ชั่วโมง</p>
                                            </div>
                                        </div>
                                        
                                        {/* Progressive Load Bar */}
                                        <div className="mt-3">
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner flex relative">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${data.level.color}`} 
                                                    style={{ width: `${Math.min((data.hours / 60) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tiny Click Arrow Indicator */}
                                    <div className="text-slate-350 group-hover:text-indigo-400 transition-colors shrink-0">
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WorkloadTeamView;

import React from 'react';
import { BatteryFull, CalendarClock, Zap } from 'lucide-react';
import { Task } from '../../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface WorkloadLevel {
    max: number;
    color: string;
    text: string;
    label: string;
}

interface WorkloadMyViewProps {
    hours: number;
    level: WorkloadLevel;
    myTasksList: Task[];
    onOpenTask?: (task: Task) => void;
}

const WorkloadMyView: React.FC<WorkloadMyViewProps> = ({
    hours,
    level,
    myTasksList,
    onOpenTask
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* My Big Summary Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm text-center relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-3 ${level.color}`} />
                
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.25em] mb-3">สรุปภาระงานประจำสัปดาห์นี้ของคุณ</h3>
                
                <div className="text-6xl font-extrabold text-slate-800 tracking-tighter mb-3 flex items-center justify-center gap-2">
                    <span>{hours}</span>
                    <span className="text-lg text-slate-400 font-bold tracking-normal uppercase">ชั่วโมงงาน</span>
                </div>
                
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-xs font-extrabold shadow-lg shadow-slate-100 bg-slate-900 text-white">
                    <span className={`w-2.5 h-2.5 rounded-full ${level.color} inline-block animate-pulse`} />
                    <span>ระดับความหนาแน่น: {level.label}</span>
                </div>
            </div>

            {/* Task Breakdown Section */}
            <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-2">
                    รายการงานที่ได้รับมอบหมายของคุณ (Weekly Breakdown)
                </h4>
                
                {myTasksList.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem] bg-white/50">
                        <BatteryFull className="w-12 h-12 mx-auto mb-3 opacity-25 text-indigo-500 animate-pulse" />
                        <p className="text-sm font-extrabold text-slate-500">สัปดาห์นี้ไม่พบภาระงานของคุณแบบระบุชั่วโมง</p>
                        <p className="text-xs text-slate-400 mt-1">ดีใจด้วยนะ! สัปดาห์นี้คุณสามารถดำเนินการอย่างสุขสันต์ หรือทำงานระยะปรับปรุงได้</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myTasksList.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => onOpenTask?.(task)}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50/50 hover:scale-[1.01] transition-all duration-300 group gap-3 ${onOpenTask ? 'cursor-pointer' : ''}`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                            task.type === 'CONTENT' 
                                            ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                            {task.type === 'CONTENT' ? 'คอนเทนต์' : 'งานทั่วไป'}
                                        </span>
                                    </div>
                                    <h5 className="font-extrabold text-slate-700 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                        {task.title}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-bold">
                                        <CalendarClock className="w-4 h-4 text-slate-300" />
                                        <span>วันครบกำหนด: {task.endDate ? format(new Date(task.endDate), 'd MMMM yyyy', { locale: th }) : 'ไม่ระบุ'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 shrink-0">
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-2xl font-extrabold text-indigo-600 font-mono tracking-tighter">
                                            {task.estimatedHours || 0}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">ชม.</span>
                                    </div>
                                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase mt-1">
                                        {task.difficulty === 'EASY' ? 'ง่าย' : task.difficulty === 'HARD' ? 'ยากมาก' : 'ปานกลาง'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkloadMyView;

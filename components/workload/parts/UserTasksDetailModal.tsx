import React from 'react';
import { X, CalendarClock, Briefcase, Zap, AlertTriangle, CheckCircle2, Loader2, Hourglass } from 'lucide-react';
import { Task, User as UserType } from '../../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface UserTasksDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserType;
    tasks: Task[];
    totalHours: number;
    weekStart: Date;
    weekEnd: Date;
    onOpenTask?: (task: Task) => void;
}

const UserTasksDetailModal: React.FC<UserTasksDetailModalProps> = ({
    isOpen,
    onClose,
    user,
    tasks,
    totalHours,
    weekStart,
    weekEnd,
    onOpenTask,
}) => {
    if (!isOpen) return null;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DONE':
            case 'APPROVE':
            case 'PASSED':
                return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'เสร็จสิ้น ✨', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
            case 'IN_PROGRESS':
            case 'REVIEW':
            case 'QUALITY_GATE':
                return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'กำลังดำเนินการ ⚡', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> };
            default:
                return { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'รอดำเนินการ ⏳', icon: <Hourglass className="w-3.5 h-3.5" /> };
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl border border-slate-150 flex flex-col overflow-hidden max-h-[80vh]">
                
                {/* Modal Header */}
                <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-800 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <img 
                            src={user.avatarUrl} 
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-white/20 shadow-md" 
                            alt={user.name}
                        />
                        <div>
                            <h3 className="text-base font-bold tracking-tight">{user.name}</h3>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                {user.position || 'สมาชิกร่วมพัฒนาระบบ'} • ระดับ {user.level}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 active:scale-95 rounded-full transition-all text-white/80 hover:text-white"
                        title="ปิด"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
 
                {/* Info Bar */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 shrink-0">
                    <div className="text-xs font-bold text-slate-500">
                        ภาระงานระบุในสัปดาห์: <span className="font-mono text-indigo-600 font-bold">{format(weekStart, 'd MMMM', { locale: th })} - {format(weekEnd, 'd MMMM yyyy', { locale: th })}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl">
                        <Zap className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-bold">{totalHours} ชั่วโมงคำนวณ</span>
                    </div>
                </div>
 
                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {tasks.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                            <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500">ไม่พบบันทึกชิ้นงานในรอบสัปดาห์นี้</p>
                            <p className="text-xs text-slate-400 mt-1">สมาชิกลงแรงสนับสนุนแบบภาพรวม หรือยังไม่ได้ถูกแจกแจงชั่วโมงงาน</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map(task => {
                                const statusConfig = getStatusStyle(task.status);
                                return (
                                    <div 
                                        key={task.id} 
                                        onClick={() => {
                                            if (onOpenTask) {
                                                onOpenTask(task);
                                                onClose();
                                            }
                                        }}
                                        className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50/50 hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border rounded-lg ${statusConfig.bg}`}>
                                                    {statusConfig.icon}
                                                    {statusConfig.label}
                                                </span>
                                                {task.type === 'CONTENT' && (
                                                    <span className="px-2.5 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-[10px] font-bold">
                                                        🎬 คอนเทนต์
                                                    </span>
                                                )}
                                                {task.type !== 'CONTENT' && (
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold">
                                                        🔧 งานทั่วไป
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h4 className="font-extrabold text-slate-700 text-sm tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                                                {task.title}
                                            </h4>
                                            
                                            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-bold">
                                                <CalendarClock className="w-3.5 h-3.5 text-slate-300" />
                                                <span>กำหนดส่ง: {task.endDate ? format(new Date(task.endDate), 'd MMM yyyy', { locale: th }) : 'ไม่ระบุ'}</span>
                                            </div>
                                        </div>
 
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 shrink-0">
                                            <span className="text-xl font-bold text-slate-800 font-mono tracking-tighter">
                                                {task.estimatedHours || 0}
                                                <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">ชม.</span>
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                                                {task.difficulty === 'EASY' ? 'ระดับง่าย' : task.difficulty === 'HARD' ? 'ระดับสูง' : 'ระดับกลาง'}
                                            </span>
                                        </div>
                                    </div>
                                );
                             })}
                        </div>
                    )}
                </div>
 
                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-200 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
                    >
                        ตกลง / ปิดหน้าต่าง
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UserTasksDetailModal;

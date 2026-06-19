import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Task } from '../../types';
import { Calendar, Clock, AlertTriangle, Flame, SlidersHorizontal, ExternalLink, Sparkles } from 'lucide-react';
import { useNotificationContext } from '../../context/NotificationContext';
import AdminDeadlineRequestsModal from './AdminDeadlineRequestsModal';

interface AdminDeadlineRequestsProps {
    currentUser: User;
    users?: User[];
    tasks?: Task[];
}

const AdminDeadlineRequests: React.FC<AdminDeadlineRequestsProps> = ({ 
    currentUser, 
    users = [], 
    tasks = [] 
}) => {
    const { deadlineRequests: requests } = useNotificationContext();
    const [isCtrlOpen, setIsCtrlOpen] = useState(false);

    // Summary intelligence calculations for UI/UX elements
    const metrics = useMemo(() => {
        const total = requests.length;
        const now = new Date();
        
        const urgent = requests.filter(r => {
            const matchedTask = tasks.find(t => t.id === r.taskId);
            if (!matchedTask) return false;
            const originalEnd = new Date(matchedTask.endDate);
            return originalEnd.getTime() < now.getTime() || (originalEnd.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
        }).length;

        const longExtensions = requests.filter(r => {
            const matchedTask = tasks.find(t => t.id === r.taskId);
            if (!matchedTask) return false;
            const originalEnd = new Date(matchedTask.endDate);
            const diffDays = Math.ceil((r.newDeadline.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 7;
        }).length;

        const requestersCount: Record<string, number> = {};
        requests.forEach(r => {
            const name = r.user?.name || 'พนักงาน';
            requestersCount[name] = (requestersCount[name] || 0) + 1;
        });
        
        let topRequester = 'ไม่มี';
        let maxReqVal = 0;
        Object.entries(requestersCount).forEach(([name, count]) => {
            if (count > maxReqVal) {
                maxReqVal = count;
                topRequester = `${name} (${count} รายการ)`;
            }
        });

        return { total, urgent, longExtensions, topRequester };
    }, [requests, tasks]);

    const hasPending = requests.length > 0;

    // Helper to format date nicely in Thai
    const formatThaiDate = (dateVal: any) => {
        try {
            const d = new Date(dateVal);
            return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        } catch {
            return '';
        }
    };

    return (
        <div id="deadline-requests-widget" className={`rounded-3xl border p-6 space-y-5 relative overflow-hidden text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-md ${
            hasPending 
                ? 'bg-gradient-to-br from-rose-50 via-red-50/50 to-orange-50 border-red-200 shadow-xl shadow-red-500/20 ring-2 ring-red-500/40' 
                : 'bg-white border-slate-100 shadow-2xs'
        }`}>
            {/* Ambient dynamic pulsing glow indicator */}
            {hasPending && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/20 to-orange-500/20 blur-3xl pointer-events-none rounded-full animate-pulse" />
            )}

            {/* Ambient dynamic drifting background clock icon */}
            <div className="absolute -top-1 -right-1 p-3 opacity-[0.06] pointer-events-none select-none">
                <motion.div
                    animate={hasPending ? {
                        rotate: [0, -15, 15, -15, 0],
                        scale: [1, 1.1, 0.9, 1.1, 1],
                    } : {}}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                    }}
                >
                    <Clock className={`w-36 h-36 ${hasPending ? 'text-red-600' : 'text-slate-400'}`} />
                </motion.div>
            </div>

            {/* Widget layout top Header */}
            <div className="flex items-center justify-between gap-3 relative z-10 text-left">
                <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-2xl shrink-0 transition-all duration-500 flex items-center justify-center ${
                        hasPending 
                            ? 'bg-red-500 text-white border border-red-400 shadow-lg shadow-red-500/40 animate-bounce' 
                            : 'bg-slate-50 text-slate-400 border border-slate-100/50'
                    }`}>
                        <Calendar className={`w-5 h-5`} />
                    </span>
                    <div className="text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className={`text-base md:text-lg font-bold tracking-tight ${hasPending ? 'text-red-950' : 'text-slate-800'}`}>ศูนย์พิจารณาเลื่อนเดดไลน์</h3>
                            {hasPending && (
                                <span className="bg-red-500 text-white text-[8.5px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 border border-red-400 shadow-sm animate-pulse">
                                    <Sparkles className="w-2 h-2" /> ด่วนมาก
                                </span>
                            )}
                        </div>
                        <p className={`text-[10px] mt-0.5 font-medium ${hasPending ? 'text-red-800' : 'text-slate-400'}`}>มีคำขอขยายเวลางานรอการพิจารณา!</p>
                    </div>
                </div>

                <div className="shrink-0">
                    <span className={`h-6 px-3 text-[10px] rounded-full flex items-center justify-center transition-all duration-500 font-bold ${
                        hasPending
                            ? 'bg-red-600 text-white border border-red-500 shadow-md shadow-red-500/30 animate-pulse'
                            : 'bg-slate-50 border border-slate-100 text-slate-400 font-medium'
                    }`}>
                        {hasPending ? `ค้างคา ${requests.length} ราย` : 'เรียบร้อยดี'}
                    </span>
                </div>
            </div>

            {/* Micro Dashboard Insights row */}
            <div className="grid grid-cols-2 gap-2.5 text-left relative z-10">
                <div className={`p-3 rounded-2xl border transition-all duration-500 ${
                    hasPending && metrics.urgent > 0
                        ? 'bg-white/80 border-red-200'
                        : 'bg-slate-50 border-slate-100'
                }`}>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1 ${
                        hasPending && metrics.urgent > 0 ? 'text-red-600' : 'text-slate-400'
                    }`}>
                        <AlertTriangle className={`w-3 h-3 shrink-0 ${hasPending && metrics.urgent > 0 ? 'animate-pulse' : ''}`} /> ยื่นด่วนจี๋
                    </span>
                    <p className={`text-sm mt-0.5 font-black ${
                        hasPending && metrics.urgent > 0 ? 'text-red-700' : 'text-slate-700'
                    }`}>{metrics.urgent} คำขอ</p>
                    <p className={`text-[8.5px] font-medium mt-0.5 ${hasPending && metrics.urgent > 0 ? 'text-red-500' : 'text-slate-450'}`}>เดดไลน์วันนี้หรือพรุ่งนี้</p>
                </div>
                
                <div className={`p-3 rounded-2xl border transition-all duration-500 min-w-0 ${
                    hasPending
                        ? 'bg-white/80 border-orange-200'
                        : 'bg-slate-50 border-slate-100'
                }`}>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1 ${hasPending ? 'text-orange-600' : 'text-slate-400'}`}>
                        <Flame className={`w-3 h-3 shrink-0 ${hasPending ? 'animate-pulse' : ''}`} /> ขอบ่อยที่สุด
                    </span>
                    <p className={`text-xs mt-0.5 truncate font-bold ${
                        hasPending ? 'text-orange-900' : 'text-slate-600'
                    }`}>{metrics.topRequester}</p>
                    <p className={`text-[8.5px] font-medium mt-0.5 ${hasPending ? 'text-orange-600' : 'text-slate-450'}`}>จากสถิติในรอบสัปดาห์นี้</p>
                </div>
            </div>

            {/* Real-Time Request Pipeline Preview list - Only shown when there are pending requests */}
            {hasPending && (
                <div className="relative z-10 space-y-2 pt-1 border-t border-dashed border-red-200/50">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-red-900 font-bold tracking-wide uppercase">รายการเร่งด่วน</span>
                        <span className="text-[9px] text-red-600 font-medium animate-pulse">รอการอนุมัติ...</span>
                    </div>

                    <div className="space-y-2">
                        {requests.slice(0, 2).map((req) => {
                            const matchedTask = tasks.find(t => t.id === req.taskId);
                            const originalEnd = matchedTask ? new Date(matchedTask.endDate) : null;
                            const diffDays = originalEnd ? Math.ceil((new Date(req.newDeadline).getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                            return (
                                <div 
                                    key={req.id} 
                                    onClick={() => setIsCtrlOpen(true)}
                                    className="p-3 bg-white/90 rounded-2xl border-2 border-red-100 hover:border-red-400 hover:bg-white hover:shadow-md hover:shadow-red-500/10 transition-all duration-300 cursor-pointer text-left space-y-1.5 flex flex-col justify-between"
                                >
                                    {/* User and date info */}
                                    <div className="flex items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {req.user?.avatarUrl ? (
                                                <img 
                                                    src={req.user.avatarUrl} 
                                                    alt={req.user.name} 
                                                    className="w-5 h-5 rounded-full object-cover ring-2 ring-red-200 shrink-0" 
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-[9px] flex items-center justify-center shrink-0 ring-2 ring-red-200">
                                                    {req.user?.name?.slice(0, 1) || 'พ'}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-red-950 font-bold truncate">{req.user?.name || 'พนักงาน'}</span>
                                        </div>
                                        {diffDays > 0 && (
                                            <span className="shrink-0 bg-red-100 text-red-800 border border-red-300 text-[8.5px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                                ยืด +{diffDays} วัน
                                            </span>
                                        )}
                                    </div>

                                    {/* Task title */}
                                    <p className="text-[10px] text-slate-800 font-bold leading-tight line-clamp-1">
                                        📌 {matchedTask?.title || 'ไม่พบชิ้นงานในระบบ'}
                                    </p>

                                    {/* Request Reason */}
                                    <div className="bg-red-50/50 p-1.5 rounded-lg border border-red-100">
                                        <p className="text-[9px] text-red-700 italic font-medium line-clamp-1">
                                            "{req.reason || 'ไม่ได้ระบุเหตุผลในการเลื่อนแผนงาน'}"
                                        </p>
                                    </div>
                                    
                                    {/* Footer dates comparison */}
                                    <div className="flex items-center gap-1 text-[8px] text-slate-500 font-semibold pt-0.5">
                                        <span className="line-through">เดดไลน์เดิม: {originalEnd ? formatThaiDate(originalEnd) : '-'}</span>
                                        <span className="text-red-400 font-bold">→</span>
                                        <span className="text-red-600 font-bold">ขอเลื่อนเป็น: {formatThaiDate(req.newDeadline)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Launch Command center overlay CTA button */}
            <div className="relative z-10 pt-1">
                <motion.button 
                    whileHover={{ scale: 1.02, y: -0.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCtrlOpen(true)}
                    className={`w-full py-2.5 rounded-2xl text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-all duration-300 font-bold text-center focus:outline-none ${
                        hasPending 
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/40 animate-pulse' 
                            : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                >
                    <AlertTriangle className={`w-3.5 h-3.5 ${hasPending ? 'animate-bounce' : ''}`} /> 
                    {hasPending 
                        ? `เปิดห้องพิจารณาด่วน (${requests.length} รายการ)` 
                        : 'เปิดสมุดบันทึกเลื่อนเดดไลน์'
                    }
                    <ExternalLink className="w-3 h-3 opacity-70" />
                </motion.button>
            </div>

            {/* Refactored separate Modal component */}
            <AdminDeadlineRequestsModal 
                isOpen={isCtrlOpen} 
                onClose={() => setIsCtrlOpen(false)} 
                currentUser={currentUser} 
                users={users} 
                tasks={tasks} 
                metrics={metrics}
            />
        </div>
    );
};

export default AdminDeadlineRequests;

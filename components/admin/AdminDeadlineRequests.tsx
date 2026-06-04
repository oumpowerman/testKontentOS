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
                ? 'bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/30 border-indigo-150 shadow-sm shadow-indigo-100/20' 
                : 'bg-white border-slate-100 shadow-2xs'
        }`}>
            {/* Ambient dynamic pulsing glow indicator */}
            {hasPending && (
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-200/15 to-purple-200/10 blur-3xl pointer-events-none rounded-full" />
            )}

            {/* Ambient dynamic drifting background clock icon */}
            <div className="absolute -top-1 -right-1 p-3 opacity-[0.03] pointer-events-none select-none">
                <motion.div
                    animate={hasPending ? {
                        rotate: [0, -8, 8, -8, 0],
                        scale: [1, 1.05, 0.95, 1.05, 1],
                    } : {}}
                    transition={{
                        repeat: Infinity,
                        duration: 6,
                        ease: "easeInOut"
                    }}
                >
                    <Clock className="w-24 h-24 text-indigo-500" />
                </motion.div>
            </div>

            {/* Widget layout top Header */}
            <div className="flex items-center justify-between gap-3 relative z-10 text-left">
                <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-2xl shrink-0 transition-all duration-500 flex items-center justify-center ${
                        hasPending 
                            ? 'bg-indigo-100/80 text-indigo-600 border border-indigo-200/20 shadow-2xs' 
                            : 'bg-slate-50 text-slate-400 border border-slate-100/50'
                    }`}>
                        <Calendar className={`w-4.5 h-4.5 ${hasPending ? 'animate-pulse' : ''}`} />
                    </span>
                    <div className="text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base md:text-lg text-slate-800 font-bold tracking-tight">ศูนย์พิจารณาเลื่อนเดดไลน์</h3>
                            {hasPending && (
                                <span className="bg-amber-100 text-amber-800 text-[8.5px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-0.5 border border-amber-200/40 shadow-2xs">
                                    <Sparkles className="w-2 h-2 text-amber-500" /> ใหม่
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">คำขอขยายเวลางานส่งตรงจากทีมแพลนเนอร์</p>
                    </div>
                </div>

                <div className="shrink-0">
                    <span className={`h-6 px-3 text-[10px] rounded-full flex items-center justify-center transition-all duration-500 font-semibold ${
                        hasPending
                            ? 'bg-orange-100 text-orange-700 border border-orange-200/50 animate-pulse'
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
                        ? 'bg-rose-50/60 border-rose-150'
                        : 'bg-slate-50/40 border-slate-100/50'
                }`}>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1 ${
                        hasPending && metrics.urgent > 0 ? 'text-rose-500 font-bold' : 'text-slate-400'
                    }`}>
                        <AlertTriangle className="w-3 h-3 shrink-0" /> ยื่นด่วนจี๋
                    </span>
                    <p className={`text-sm mt-0.5 font-bold ${
                        hasPending && metrics.urgent > 0 ? 'text-rose-600' : 'text-slate-700'
                    }`}>{metrics.urgent} คำขอ</p>
                    <p className="text-[8.5px] text-slate-450 font-medium mt-0.5">เดดไลน์วันนี้หรือพรุ่งนี้</p>
                </div>
                
                <div className={`p-3 rounded-2xl border transition-all duration-500 min-w-0 ${
                    hasPending
                        ? 'bg-indigo-50/50 border-indigo-150'
                        : 'bg-slate-50/40 border-slate-100/50'
                }`}>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                        <Flame className={`w-3 h-3 shrink-0 ${hasPending ? 'text-indigo-500' : 'text-slate-400'}`} /> ขอบ่อยที่สุด
                    </span>
                    <p className={`text-xs mt-0.5 truncate font-bold ${
                        hasPending ? 'text-indigo-900' : 'text-slate-600'
                    }`}>{metrics.topRequester}</p>
                    <p className="text-[8.5px] text-slate-450 font-medium mt-0.5">จากสถิติในรอบสัปดาห์นี้</p>
                </div>
            </div>

            {/* Real-Time Request Pipeline Preview list - Only shown when there are pending requests */}
            {hasPending && (
                <div className="relative z-10 space-y-2 pt-1 border-t border-dashed border-indigo-100/50">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-900 font-semibold tracking-wide uppercase">กล่องคำขอรอดำเนินการ</span>
                        <span className="text-[9px] text-slate-400 font-medium">แสดงล่าสุด 2 รายการ</span>
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
                                    className="p-3 bg-white/90 rounded-2xl border border-indigo-100/40 hover:bg-white hover:border-indigo-200/50 transition-all duration-300 cursor-pointer text-left space-y-1.5 shadow-2xs flex flex-col justify-between"
                                >
                                    {/* User and date info */}
                                    <div className="flex items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {req.user?.avatarUrl ? (
                                                <img 
                                                    src={req.user.avatarUrl} 
                                                    alt={req.user.name} 
                                                    className="w-5 h-5 rounded-full object-cover ring-1 ring-indigo-150/20 shrink-0" 
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-[9px] flex items-center justify-center shrink-0">
                                                    {req.user?.name?.slice(0, 1) || 'พ'}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-slate-600 font-semibold truncate">{req.user?.name || 'พนักงาน'}</span>
                                        </div>
                                        {diffDays > 0 && (
                                            <span className="shrink-0 bg-amber-50 text-amber-700 border border-amber-200/20 text-[8.5px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                                ยืด +{diffDays} วัน
                                            </span>
                                        )}
                                    </div>

                                    {/* Task title */}
                                    <p className="text-[10px] text-slate-700 font-bold leading-tight line-clamp-1">
                                        📌 {matchedTask?.title || 'ไม่พบชิ้นงานในระบบ'}
                                    </p>

                                    {/* Request Reason */}
                                    <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50">
                                        <p className="text-[9px] text-slate-500 italic font-medium line-clamp-1">
                                            "{req.reason || 'ไม่ได้ระบุเหตุผลในการเลื่อนแผนงาน'}"
                                        </p>
                                    </div>
                                    
                                    {/* Footer dates comparison */}
                                    <div className="flex items-center gap-1 text-[8px] text-slate-400 font-semibold pt-0.5">
                                        <span>เดดไลน์เดิม: {originalEnd ? formatThaiDate(originalEnd) : '-'}</span>
                                        <span className="text-indigo-300 font-semibold">→</span>
                                        <span className="text-indigo-500 font-semibold">ขอเลื่อนเป็น: {formatThaiDate(req.newDeadline)}</span>
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
                    className={`w-full py-2.5 rounded-2xl text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-all duration-300 font-semibold text-center focus:outline-none ${
                        hasPending 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-xs' 
                            : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> 
                    {hasPending 
                        ? `เปิดห้องอนุมัติเลื่อนกำหนดเวลา (${requests.length})` 
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

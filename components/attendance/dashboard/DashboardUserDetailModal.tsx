import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { 
    ArrowRight, CheckCircle2, Star, Sparkles
} from 'lucide-react';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';
import { motion, AnimatePresence } from 'framer-motion';
import { getAttendanceSummary } from '../../../lib/attendanceUtils';
import { useUserSession } from '../../../context/UserSessionContext';

// Import our new subcomponents
import { DetailModalHeader } from './modal/DetailModalHeader';
import { DetailModalFilterGrid, FilterType } from './modal/DetailModalFilterGrid';
import { AttendanceRecordCard } from './modal/AttendanceRecordCard';
import { OvertimeBreakdownSection } from './modal/OvertimeBreakdownSection';

interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    absent: number;
    totalHours: number;
    avgCheckIn: string;
    logs: AttendanceLog[];
}

interface DashboardUserDetailModalProps {
    user: User;
    stat: UserStat;
    workingDaysInMonth: Date[];
    startTime: string;
    lateBuffer: number;
    onClose: () => void;
}

const DashboardUserDetailModal: React.FC<DashboardUserDetailModalProps> = ({
    user,
    stat,
    workingDaysInMonth,
    startTime,
    lateBuffer,
    onClose
}) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [isScrolled, setIsScrolled] = useState(false);
    const { leaveRequests } = useUserSession();

    // Categorize dates
    const onTimeLogs = useMemo(() => {
        return stat.logs.filter(l => {
            if (l.status === 'LEAVE' || l.workType === 'LEAVE') return false;
            if (!l.checkInTime) return false;
            const summary = getAttendanceSummary(
                l.checkInTime,
                l.checkOutTime,
                { startTime, buffer: lateBuffer, minHours: 9 }
            );
            return !summary.isLate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stat.logs, startTime, lateBuffer]);

    const lateLogs = useMemo(() => {
        return stat.logs.filter(l => {
            if (!l.checkInTime) return false;
            const summary = getAttendanceSummary(
                l.checkInTime,
                l.checkOutTime,
                { startTime, buffer: lateBuffer, minHours: 9 }
            );
            return summary.isLate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stat.logs, startTime, lateBuffer]);

    const leaveLogs = useMemo(() => {
        return stat.logs.filter(l => l.status === 'LEAVE' || l.workType === 'LEAVE')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stat.logs]);

    const absentDates = useMemo(() => {
        return workingDaysInMonth.filter(day => {
            if (day > new Date()) return false;
            const dateStr = format(day, 'yyyy-MM-dd');
            return !stat.logs.some(l => l.date === dateStr);
        }).sort((a, b) => b.getTime() - a.getTime());
    }, [workingDaysInMonth, stat.logs]);

    // Calculate OT stats
    const approvedOtRequests = useMemo(() => {
        if (workingDaysInMonth.length === 0) return [];
        const currentMonth = workingDaysInMonth[0].getMonth();
        const currentYear = workingDaysInMonth[0].getFullYear();

        return (leaveRequests || []).filter(req => {
            if (req.userId !== user.id) return false;
            if (req.status !== 'APPROVED') return false;
            if (req.type !== 'OVERTIME') return false;
            const reqDate = new Date(req.startDate);
            return reqDate.getMonth() === currentMonth && reqDate.getFullYear() === currentYear;
        });
    }, [leaveRequests, user.id, workingDaysInMonth]);

    const totalOtHours = useMemo(() => {
        return approvedOtRequests.reduce((sum, req) => {
            const reasonStr = req.reason || '';
            const match = reasonStr.match(/\[OT:([\d\.]+)hr\]/);
            const durationHours = match ? parseFloat(match[1]) : 0;
            return sum + durationHours;
        }, 0);
    }, [approvedOtRequests]);

    const totalIssues = lateLogs.length + absentDates.length + leaveLogs.length;

    const stats = useMemo(() => ({
        present: stat.present,
        late: stat.late,
        absent: stat.absent,
        leaves: stat.leaves,
        otHours: totalOtHours
    }), [stat, totalOtHours]);

    return createPortal(
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 80, rotateX: -15, rotateZ: -1.5 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0, rotateZ: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 160, rotateX: 20, rotateZ: 3.5 }}
                transition={{ type: "spring", damping: 28, stiffness: 200 }}
                style={{ transformPerspective: 1200 }}
                className="bg-white w-full max-w-2xl h-[80vh] sm:h-[1000px] sm:max-h-[85vh] rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(99,102,241,0.2)] overflow-hidden border-[8px] border-indigo-50 flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 opacity-10 pointer-events-none">
                    <Sparkles className="w-12 h-12 text-indigo-400" />
                </div>
                <div className="absolute bottom-40 right-10 opacity-10 pointer-events-none">
                    <Star className="w-16 h-16 text-pink-400" />
                </div>

                {/* Header & Quick Filter Stats Grid */}
                <div className="shrink-0">
                    <DetailModalHeader 
                        user={user}
                        isScrolled={isScrolled}
                        totalIssues={totalIssues}
                        onClose={onClose}
                    />
                    
                    {/* Filter grid attached right under header */}
                    <div className="bg-gradient-to-br from-indigo-50/20 via-white to-pink-50/20 px-6 pb-4 border-b border-indigo-50 shrink-0">
                        <DetailModalFilterGrid 
                            activeFilter={activeFilter}
                            setActiveFilter={setActiveFilter}
                            isScrolled={isScrolled}
                            stats={stats}
                        />
                    </div>
                </div>

                {/* Content Section - Scrollable */}
                <div 
                    className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-indigo-100"
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        setIsScrolled(target.scrollTop > 20);
                    }}
                >
                    <AnimatePresence mode="wait">
                        {/* On-Time Section */}
                        {activeFilter === 'ALL' && onTimeLogs.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="on-time-section"
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-2xl text-emerald-500">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-left">
                                        On-Time Arrival Records
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {onTimeLogs.map(log => (
                                        <AttendanceRecordCard 
                                            key={log.id}
                                            date={new Date(log.date)}
                                            variant="on-time"
                                            timeLabel={log.checkInTime ? format(new Date(log.checkInTime), 'HH:mm') : '--:--'}
                                            badgeText="ON-TIME"
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Late Section */}
                        {(activeFilter === 'ALL' || activeFilter === 'LATE') && lateLogs.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="late-section"
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-2xl text-amber-500">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-left">
                                        Late Arrival Records
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {lateLogs.map(log => (
                                        <AttendanceRecordCard 
                                            key={log.id}
                                            date={new Date(log.date)}
                                            variant="late"
                                            timeLabel={log.checkInTime ? format(new Date(log.checkInTime), 'HH:mm') : '--:--'}
                                            badgeText="LATE"
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Absent Section */}
                        {(activeFilter === 'ALL' || activeFilter === 'ABSENT') && absentDates.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="absent-section"
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-2xl text-rose-500">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-left">
                                        Missing Attendance
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {absentDates.map(date => (
                                        <AttendanceRecordCard 
                                            key={date.toString()}
                                            date={date}
                                            variant="absent"
                                            badgeText="ABSENT"
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Leave Section */}
                        {(activeFilter === 'ALL' || activeFilter === 'LEAVE') && leaveLogs.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="leave-section"
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-50 rounded-2xl text-sky-500">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-left">
                                        Official Leave History
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {leaveLogs.map(log => (
                                        <AttendanceRecordCard 
                                            key={log.id}
                                            date={new Date(log.date)}
                                            variant="leave"
                                            badgeText={log.workType || 'LEAVE'}
                                            note={log.note}
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Overtime Breakdown View */}
                        {activeFilter === 'OT' && (
                            <OvertimeBreakdownSection 
                                leaveRequests={leaveRequests || []}
                                userId={user.id}
                                workingDaysInMonth={workingDaysInMonth}
                            />
                        )}

                        {/* Empty State / Filter Empty State */}
                        {((activeFilter === 'LATE' && lateLogs.length === 0) || 
                          (activeFilter === 'ABSENT' && absentDates.length === 0) || 
                          (activeFilter === 'LEAVE' && leaveLogs.length === 0) ||
                          (activeFilter === 'OT' && approvedOtRequests.length === 0) ||
                          (activeFilter === 'ALL' && totalIssues === 0 && onTimeLogs.length === 0)) && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key="empty-state"
                                className="flex flex-col items-center justify-center py-20 text-indigo-200"
                            >
                                <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 bg-indigo-100 rounded-[2.5rem] animate-ping opacity-20"></div>
                                    <CheckCircle2 className="w-12 h-12 text-indigo-400 relative z-10" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-800">Everything is Good!</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">No records found for this category</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Section - Cute Style */}
                <div className="p-8 bg-white border-t border-indigo-50 shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] uppercase hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Close Details <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default DashboardUserDetailModal;

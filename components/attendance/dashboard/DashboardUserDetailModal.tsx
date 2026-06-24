
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { 
    X, Clock, UserX, HeartPulse, Calendar, 
    ArrowRight, AlertCircle, CheckCircle2, Info,
    Filter, Sparkles, Star
} from 'lucide-react';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';
import { motion, AnimatePresence } from 'framer-motion';
import { getAttendanceSummary } from '../../../lib/attendanceUtils';

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

type FilterType = 'ALL' | 'LATE' | 'ABSENT' | 'LEAVE';

const DashboardUserDetailModal: React.FC<DashboardUserDetailModalProps> = ({
    user,
    stat,
    workingDaysInMonth,
    startTime,
    lateBuffer,
    onClose
}) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

    // Categorize dates
    const lateLogs = stat.logs.filter(l => {
        if (!l.checkInTime) return false;
        const summary = getAttendanceSummary(
            l.checkInTime,
            l.checkOutTime,
            { startTime, buffer: lateBuffer, minHours: 9 }
        );
        return summary.isLate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const leaveLogs = stat.logs.filter(l => l.status === 'LEAVE' || l.workType === 'LEAVE')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const absentDates = workingDaysInMonth.filter(day => {
        if (day > new Date()) return false;
        const dateStr = format(day, 'yyyy-MM-dd');
        return !stat.logs.some(l => l.date === dateStr);
    }).sort((a, b) => b.getTime() - a.getTime());

    const totalIssues = lateLogs.length + absentDates.length + leaveLogs.length;

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/20 backdrop-blur-md p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(99,102,241,0.15)] overflow-hidden border-[8px] border-indigo-50 flex flex-col max-h-[90vh] relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 opacity-10 pointer-events-none">
                    <Sparkles className="w-12 h-12 text-indigo-400" />
                </div>
                <div className="absolute bottom-40 right-10 opacity-10 pointer-events-none">
                    <Star className="w-16 h-16 text-pink-400" />
                </div>

                {/* Header Section - Pastel Style */}
                <div className="bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-8 relative overflow-hidden shrink-0 border-b border-indigo-100">
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm z-20 border border-slate-100"
                    >
                        <X className="w-5 h-5"/>
                    </button>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-200 to-pink-200 rounded-[2.5rem] blur-lg opacity-40 animate-pulse"></div>
                            <img src={user.avatarUrl} className="w-24 h-24 rounded-[2.2rem] border-4 border-white object-cover shadow-xl relative z-10" alt={user.name} />
                            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-xl border-4 border-white flex items-center justify-center z-20 ${user.workStatus === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-300'}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-[10px] font-black text-indigo-500 uppercase tracking-widest">Profile Card</span>
                                {totalIssues === 0 && <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><Star className="w-2 h-2" /> Perfect</span>}
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight leading-none mb-2">{user.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-xl bg-white border border-indigo-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                                    {user.position}
                                </span>
                                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-400 to-sky-400 text-[10px] font-black text-white uppercase tracking-widest shadow-md">
                                    Level {user.level}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Quick Stats Grid - Pastel Buttons */}
                    <div className="grid grid-cols-4 gap-3 mt-8">
                        <button 
                            onClick={() => setActiveFilter('ALL')}
                            className={`p-3 rounded-[1.8rem] transition-all flex flex-col items-center border-2 ${activeFilter === 'ALL' ? 'bg-white border-indigo-200 shadow-md scale-105' : 'bg-white/40 border-transparent hover:bg-white/60'}`}
                        >
                            <Filter className={`w-5 h-5 mb-1 ${activeFilter === 'ALL' ? 'text-indigo-500' : 'text-slate-400'}`} />
                            <span className={`text-lg font-black ${activeFilter === 'ALL' ? 'text-slate-800' : 'text-slate-400'}`}>{stat.present}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All Days</span>
                        </button>
                        <button 
                            onClick={() => setActiveFilter('LATE')}
                            className={`p-3 rounded-[1.8rem] transition-all flex flex-col items-center border-2 ${activeFilter === 'LATE' ? 'bg-amber-50 border-amber-200 shadow-md scale-105' : 'bg-white/40 border-transparent hover:bg-amber-50/50'}`}
                        >
                            <Clock className={`w-5 h-5 mb-1 ${activeFilter === 'LATE' ? 'text-amber-500' : 'text-amber-300'}`} />
                            <span className={`text-lg font-black ${activeFilter === 'LATE' ? 'text-amber-600' : 'text-amber-300'}`}>{stat.late}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late</span>
                        </button>
                        <button 
                            onClick={() => setActiveFilter('ABSENT')}
                            className={`p-3 rounded-[1.8rem] transition-all flex flex-col items-center border-2 ${activeFilter === 'ABSENT' ? 'bg-rose-50 border-rose-200 shadow-md scale-105' : 'bg-white/40 border-transparent hover:bg-rose-50/50'}`}
                        >
                            <UserX className={`w-5 h-5 mb-1 ${activeFilter === 'ABSENT' ? 'text-rose-500' : 'text-rose-300'}`} />
                            <span className={`text-lg font-black ${activeFilter === 'ABSENT' ? 'text-rose-600' : 'text-rose-300'}`}>{stat.absent}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absent</span>
                        </button>
                        <button 
                            onClick={() => setActiveFilter('LEAVE')}
                            className={`p-3 rounded-[1.8rem] transition-all flex flex-col items-center border-2 ${activeFilter === 'LEAVE' ? 'bg-sky-50 border-sky-200 shadow-md scale-105' : 'bg-white/40 border-transparent hover:bg-sky-50/50'}`}
                        >
                            <HeartPulse className={`w-5 h-5 mb-1 ${activeFilter === 'LEAVE' ? 'text-sky-500' : 'text-sky-300'}`} />
                            <span className={`text-lg font-black ${activeFilter === 'LEAVE' ? 'text-sky-600' : 'text-sky-300'}`}>{stat.leaves}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave</span>
                        </button>
                    </div>
                </div>

                {/* Content Section - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-indigo-100">
                    <AnimatePresence mode="wait">
                        {/* Late Section */}
                        {(activeFilter === 'ALL' || activeFilter === 'LATE') && lateLogs.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="late-section"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-amber-50 rounded-2xl text-amber-500"><Clock className="w-5 h-5"/></div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Late Arrival Records</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {lateLogs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-4 bg-white rounded-[2rem] border border-amber-100 group hover:shadow-lg hover:shadow-amber-100/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex flex-col items-center justify-center border border-amber-100">
                                                    <span className="text-[10px] font-black text-amber-400 uppercase">{format(new Date(log.date), 'EEE')}</span>
                                                    <span className="text-lg font-black text-amber-600">{format(new Date(log.date), 'd')}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-700">{format(new Date(log.date), 'MMMM yyyy', { locale: th })}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-lg text-[9px] font-black uppercase">LATE</span>
                                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {log.checkInTime ? format(new Date(log.checkInTime), 'HH:mm') : '--:--'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
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
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-rose-50 rounded-2xl text-rose-500"><UserX className="w-5 h-5"/></div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Missing Attendance</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {absentDates.map(date => (
                                        <div key={date.toString()} className="flex items-center justify-between p-4 bg-white rounded-[2rem] border border-rose-100 group hover:shadow-lg hover:shadow-rose-100/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex flex-col items-center justify-center border border-rose-100">
                                                    <span className="text-[10px] font-black text-rose-400 uppercase">{format(date, 'EEE')}</span>
                                                    <span className="text-lg font-black text-rose-600">{format(date, 'd')}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-700">{format(date, 'MMMM yyyy', { locale: th })}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase">ABSENT</span>
                                                        <p className="text-[10px] font-bold text-rose-400">No record found</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
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
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-sky-50 rounded-2xl text-sky-500"><HeartPulse className="w-5 h-5"/></div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Official Leave History</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {leaveLogs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-4 bg-white rounded-[2rem] border border-sky-100 group hover:shadow-lg hover:shadow-sky-100/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-sky-50 rounded-2xl flex flex-col items-center justify-center border border-sky-100">
                                                    <span className="text-[10px] font-black text-sky-400 uppercase">{format(new Date(log.date), 'EEE')}</span>
                                                    <span className="text-lg font-black text-sky-600">{format(new Date(log.date), 'd')}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-700">{format(new Date(log.date), 'MMMM yyyy', { locale: th })}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="px-2 py-0.5 bg-sky-100 text-sky-600 rounded-lg text-[9px] font-black uppercase">{log.workType || 'LEAVE'}</span>
                                                        <p className="text-[10px] font-bold text-slate-400 italic truncate max-w-[150px]">
                                                            "{log.note || 'No reason'}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Empty State / Filter Empty State */}
                        {((activeFilter === 'LATE' && lateLogs.length === 0) || 
                          (activeFilter === 'ABSENT' && absentDates.length === 0) || 
                          (activeFilter === 'LEAVE' && leaveLogs.length === 0) ||
                          (activeFilter === 'ALL' && totalIssues === 0)) && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
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
        </div>,
        document.body
    );
};

export default DashboardUserDetailModal;


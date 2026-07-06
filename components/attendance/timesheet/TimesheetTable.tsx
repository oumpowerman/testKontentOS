
import React from 'react';
import { format, isToday, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import th from 'date-fns/locale/th';
import { Loader2, UserX, Layers } from 'lucide-react';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';
import TimesheetCell from './TimesheetCell';

interface TimesheetTableProps {
    isLoading: boolean;
    dateRange: Date[];
    filteredAndGroupedUsers: Record<string, User[]>;
    logs: AttendanceLog[];
    leaveRequests?: any[];
    getEffectiveDayStatus: (date: Date) => { status: 'WORK_DAY' | 'HOLIDAY', source: string, desc: string };
    onCellClick: (log: AttendanceLog | null, leaveRequest?: any) => void;
    workConfig: { startTime: string; buffer: number };
}

const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
            type: "spring" as const,
            stiffness: 300,
            damping: 28
        }
    },
    exit: { 
        opacity: 0, 
        y: -8,
        transition: { duration: 0.15 }
    }
};

const TimesheetTable: React.FC<TimesheetTableProps> = ({
    isLoading,
    dateRange,
    filteredAndGroupedUsers,
    logs,
    leaveRequests = [],
    getEffectiveDayStatus,
    onCellClick,
    workConfig
}) => {
    return (
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[500px] sm:min-h-[600px] relative z-10">
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 rounded-b-3xl sm:rounded-b-[2.5rem]">
                <table className="w-full border-collapse table-fixed min-w-[700px] sm:min-w-[1200px]">
                    <thead className="sticky top-0 z-[100]">
                        <tr className="bg-slate-50/95 backdrop-blur-md border-b border-slate-200">
                            <th className="w-32 sm:w-64 p-3 sm:p-4 text-left text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] sticky left-0 bg-slate-50 z-[110] border-r border-slate-200 after:content-[''] after:absolute after:top-0 after:bottom-0 after:-right-12 after:w-12 after:bg-gradient-to-r after:from-slate-50 after:to-transparent after:pointer-events-none">
                                Member Profile
                            </th>
                            {dateRange.map(day => {
                                const dayStatus = getEffectiveDayStatus(day);
                                const isHoliday = dayStatus.status === 'HOLIDAY';
                                const isTodayDay = isToday(day);
                                return (
                                    <motion.th 
                                        key={day.toString()} 
                                        layout="position"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className={`p-1.5 sm:p-2 text-center w-16 sm:w-24 ${isTodayDay ? 'bg-indigo-50/50' : ''} ${isHoliday ? 'bg-slate-50/30' : ''}`}
                                    >
                                        <motion.div
                                            key={day.toString()}
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <p className={`text-[9px] sm:text-[10px] font-black uppercase ${isHoliday ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {format(day, 'EEE', { locale: th })}
                                            </p>
                                            <p className={`text-xs sm:text-sm font-black leading-tight ${isTodayDay ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                {format(day, 'd MMM', { locale: th })}
                                            </p>
                                            {dayStatus.source === 'EXCEPTION' && (
                                                <div className="flex justify-center mt-0.5">
                                                    <div className={`w-1 h-1 rounded-full ${dayStatus.status === 'WORK_DAY' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </motion.th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.tr
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <td colSpan={dateRange.length + 1} className="py-32">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                                            <p className="font-bold text-xs sm:text-sm tracking-widest uppercase">Initializing Interface...</p>
                                        </div>
                                    </td>
                                </motion.tr>
                            ) : Object.keys(filteredAndGroupedUsers).length === 0 ? (
                                <motion.tr
                                    key="empty"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <td colSpan={dateRange.length + 1} className="py-32 text-center text-slate-400">
                                        <UserX className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                        <p className="font-bold">ไม่พบข้อมูลพนักงานที่ตรงเงื่อนไข</p>
                                    </td>
                                </motion.tr>
                            ) : (
                                (Object.entries(filteredAndGroupedUsers) as [string, User[]][]).flatMap(([dept, deptUsers]) => [
                                    <motion.tr 
                                        key={`dept-${dept}`}
                                        variants={rowVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="bg-slate-100/50 border-y border-slate-200/50"
                                    >
                                        <td colSpan={dateRange.length + 1} className="px-4 sm:px-6 py-2">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                                <span className="text-[9px] sm:text-[10px] font-black text-indigo-900 uppercase tracking-widest">{dept}</span>
                                                <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[8px] font-bold text-slate-400">{deptUsers.length} MEMBERS</span>
                                            </div>
                                        </td>
                                    </motion.tr>,
                                    ...deptUsers.map(user => (
                                        <motion.tr 
                                            key={`user-${user.id}`}
                                            variants={rowVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            layout="position"
                                            className="hover:bg-indigo-50/40 transition-all duration-200 group"
                                        >
                                            <td className="p-2 sm:p-4 sticky left-0 bg-white group-hover:bg-[#f8faff] z-[90] border-r border-slate-100 shadow-[10px_0_15px_-5px_rgba(0,0,0,0.05)] transition-all duration-200 after:content-[''] after:absolute after:top-0 after:bottom-0 after:-right-12 after:w-12 after:bg-gradient-to-r after:from-white group-hover:after:from-[#f8faff] after:to-transparent after:pointer-events-none">
                                                <div className="flex items-center gap-1.5 sm:gap-3">
                                                    <div className="relative shrink-0">
                                                        <img src={user.avatarUrl} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-md object-cover" />
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full border border-white ${user.workStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] sm:text-sm font-black text-slate-800 truncate leading-tight">{user.name}</p>
                                                        <p className="hidden sm:block text-[10px] text-indigo-500 font-bold uppercase truncate opacity-70">Lv.{user.level} {user.position}</p>
                                                        <p className="block sm:hidden text-[9px] text-indigo-500/85 font-black uppercase truncate">Lv.{user.level}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {dateRange.map(day => {
                                                const dateStr = format(day, 'yyyy-MM-dd');
                                                const log = logs.find(l => l.userId === user.id && l.date === dateStr);
                                                const dayStatus = getEffectiveDayStatus(day);
                                                
                                                // Find relevant leave request for this user and day
                                                const relevantRequest = leaveRequests.find(r => 
                                                    r.user_id === user.id && 
                                                    dateStr >= r.start_date && 
                                                    dateStr <= r.end_date
                                                );

                                                return (
                                                    <td key={day.toString()} className="p-0">
                                                        <TimesheetCell 
                                                            date={day}
                                                            log={log} 
                                                            leaveRequest={relevantRequest}
                                                            dayStatus={dayStatus}
                                                            isToday={isToday(day)}
                                                            workConfig={workConfig}
                                                            userStartDate={user.startDate}
                                                            onClick={() => {
                                                                if (log || relevantRequest) {
                                                                     onCellClick(log || null, relevantRequest);
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </motion.tr>
                                    ))
                                ])
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TimesheetTable;


import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';
import { checkIsLate, getAttendanceSummary, getLateMinutes } from '../../../lib/attendanceUtils';
import { useGameConfig } from '../../../context/GameConfigContext';
import { useUserSession } from '../../../context/UserSessionContext';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';
import { eachDayOfInterval, startOfMonth, endOfMonth, isWeekend } from 'date-fns';

// Import Separated Components
import DashboardHeader from './DashboardHeader';
import DashboardStats from './DashboardStats';
import DashboardTable from './DashboardTable';
import DashboardUserDetailModal from './DashboardUserDetailModal';
import { ExportControlCenterModal } from './modal/ExportControlCenterModal';

// Lazy Loaded Analytics Component
const AttendanceAnalytics = lazy(() => import('./analytics/AttendanceAnalytics'));

const AnalyticsSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-gray-100 h-[440px] rounded-3xl" />
            <div className="lg:col-span-8 bg-gray-100 h-[440px] rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-gray-100 h-[380px] rounded-3xl" />
            <div className="lg:col-span-7 bg-gray-100 h-[380px] rounded-3xl" />
        </div>
    </div>
);

interface AdminAttendanceDashboardProps {
    users: User[];
}

interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    absent: number;
    totalHours: number;
    avgCheckIn: string;
    logs: AttendanceLog[];
    totalLateMinutes?: number;
    totalOtHours?: number;
    totalOtPayout?: number;
}

import { useMasterData } from '../../../hooks/useMasterData';

const AdminAttendanceDashboard: React.FC<AdminAttendanceDashboardProps> = ({ users }) => {
    const { masterOptions } = useMasterData();
    const { otRequests } = useUserSession();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [dateFilterMode, setDateFilterMode] = useState<'MONTH' | 'CUSTOM'>('MONTH');
    const [customStartDate, setCustomStartDate] = useState<Date>(startOfMonth(new Date()));
    const [customEndDate, setCustomEndDate] = useState<Date>(endOfMonth(new Date()));
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmploymentType, setSelectedEmploymentType] = useState('ALL');
    const [selectedPosition, setSelectedPosition] = useState('ALL');
    const [viewMode, setViewMode] = useState<'TABLE' | 'ANALYTICS'>('TABLE');
    const [lateViewMode, setLateViewMode] = useState<'DAYS' | 'HOURS'>('DAYS');
    const [otViewMode, setOtViewMode] = useState<'HOURS' | 'PAYOUT'>('HOURS');
    const [activeStatFilter, setActiveStatFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'>('ALL');
    const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
    const [isToolsExpanded, setIsToolsExpanded] = useState(false);

    useEffect(() => {
        setSortDirection('DESC');
    }, [activeStatFilter]);
    
    // Modal State
    const [selectedUser, setSelectedUser] = useState<{ user: User, stat: UserStat } | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    // Config State
    const [startTime, setStartTime] = useState('10:00');
    const [lateBuffer, setLateBuffer] = useState(0);

    const { config } = useGameConfig(); // Hook for dynamic grading
    const { annualHolidays } = useAnnualHolidays();
    const { exceptions } = useCalendarExceptions();

    // Helper: Get Effective Status for a Day
    const getEffectiveDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) return { status: exception.type, source: 'EXCEPTION' };
        const holiday = annualHolidays.find(h => h.day === date.getDate() && h.month === date.getMonth() + 1 && h.isActive);
        if (holiday) return { status: 'HOLIDAY' as const, source: 'ANNUAL' };
        if (isWeekend(date)) return { status: 'HOLIDAY' as const, source: 'WEEKEND' };
        return { status: 'WORK_DAY' as const, source: 'DEFAULT' };
    };

    // Calculate Working Days in current month or range
    const monthDays = useMemo(() => {
        const start = dateFilterMode === 'MONTH' ? startOfMonth(currentMonth) : customStartDate;
        const end = dateFilterMode === 'MONTH' ? endOfMonth(currentMonth) : customEndDate;
        if (start > end) {
            return [];
        }
        return eachDayOfInterval({
            start,
            end
        });
    }, [currentMonth, dateFilterMode, customStartDate, customEndDate]);

    const workingDaysInMonth = useMemo(() => {
        return monthDays.filter(day => getEffectiveDayStatus(day).status === 'WORK_DAY');
    }, [monthDays, annualHolidays, exceptions]);

    // Load Config
    useEffect(() => {
        const workConfig = masterOptions.filter(opt => opt.type === 'WORK_CONFIG');
        const start = workConfig.find(c => c.key === 'START_TIME')?.label || '10:00';
        const buffer = parseInt(workConfig.find(c => c.key === 'LATE_BUFFER')?.label || '0');
        setStartTime(start);
        setLateBuffer(buffer);
    }, [masterOptions]);

    // Fetch Logs for the selected month or range
    useEffect(() => {
        const start = format(dateFilterMode === 'MONTH' ? startOfMonth(currentMonth) : customStartDate, 'yyyy-MM-dd');
        const end = format(dateFilterMode === 'MONTH' ? endOfMonth(currentMonth) : customEndDate, 'yyyy-MM-dd');

        const fetchMonthLogs = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .gte('date', start)
                    .lte('date', end);

                if (error) throw error;
                
                if (data) {
                    setLogs(data.map((l: any) => ({
                        id: l.id,
                        userId: l.user_id,
                        date: l.date,
                        checkInTime: l.check_in_time ? new Date(l.check_in_time) : null,
                        checkOutTime: l.check_out_time ? new Date(l.check_out_time) : null,
                        workType: l.work_type,
                        status: l.status,
                        note: l.note
                    })));
                }
            } catch (err) {
                console.error("Fetch admin logs error", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMonthLogs();

        // Real-time Subscriptions
        const logsChannel = supabase.channel('admin-dashboard-logs')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance_logs',
                filter: `date=gte.${start}&date=lte.${end}`
            }, () => fetchMonthLogs())
            .subscribe();

        return () => {
            supabase.removeChannel(logsChannel);
        };
    }, [currentMonth, dateFilterMode, customStartDate, customEndDate]);

    // Calculate Stats per User
    const userStats = useMemo(() => {
        const statsMap: Record<string, UserStat> = {};
        const today = new Date();

        // Initialize for all active users
        users.filter(u => u.isActive).forEach(u => {
            statsMap[u.id] = {
                userId: u.id,
                present: 0,
                late: 0,
                leaves: 0,
                absent: 0,
                totalHours: 0,
                avgCheckIn: '-',
                logs: [],
                totalLateMinutes: 0
            };
        });

        // Process Logs
        logs.forEach(log => {
            if (statsMap[log.userId]) {
                const stat = statsMap[log.userId];
                stat.logs.push(log);

                if (log.status === 'LEAVE' || log.workType === 'LEAVE') {
                    stat.leaves++;
                } else {
                    stat.present++;

                    const summary = getAttendanceSummary(
                        log.checkInTime,
                        log.checkOutTime,
                        { startTime, buffer: lateBuffer, minHours: 9 }
                    );

                    if (summary.isLate) {
                        stat.late++;
                    }
                    const lateMins = getLateMinutes(log.checkInTime, startTime, lateBuffer);
                    stat.totalLateMinutes = (stat.totalLateMinutes || 0) + lateMins;
                    stat.totalHours += summary.workHours;
                }
            }
        });

        // Calculate Absents
        Object.values(statsMap).forEach(stat => {
            workingDaysInMonth.forEach(day => {
                // Check if this day is in the future
                const isFutureDay = (day.getFullYear() > today.getFullYear()) ||
                                    (day.getFullYear() === today.getFullYear() && day.getMonth() > today.getMonth()) ||
                                    (day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth() && day.getDate() > today.getDate());
                if (isFutureDay) return;

                const isToday = day.getDate() === today.getDate() &&
                                day.getMonth() === today.getMonth() &&
                                day.getFullYear() === today.getFullYear();

                if (isToday) {
                    let [startHour, startMin] = [10, 0];
                    if (startTime && startTime.includes(':')) {
                        const parts = startTime.split(':');
                        startHour = parseInt(parts[0], 10) || 10;
                        startMin = parseInt(parts[1], 10) || 0;
                    }
                    const currentHour = today.getHours();
                    const currentMin = today.getMinutes();

                    // If it is today and we haven't reached the official work start time yet, 
                    // do not mark as absent yet (safeguard for early morning checks e.g. 03:00)
                    if (currentHour < startHour || (currentHour === startHour && currentMin < startMin)) {
                        return;
                    }
                }
                
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasLog = stat.logs.some(l => l.date === dateStr);
                const isLeave = stat.logs.some(l => l.date === dateStr && (l.status === 'LEAVE' || l.workType === 'LEAVE'));
                
                if (!hasLog && !isLeave) {
                    stat.absent++;
                }
            });
        });

        // Calculate approved Overtime for each user in the selected month/range
        const activeOtRequests = otRequests.filter(req => {
            if (req.status !== 'APPROVED') return false;
            const reqDate = new Date(req.date);
            const start = dateFilterMode === 'MONTH' ? startOfMonth(currentMonth) : customStartDate;
            const end = dateFilterMode === 'MONTH' ? endOfMonth(currentMonth) : customEndDate;
            return reqDate >= start && reqDate <= end;
        });

        Object.values(statsMap).forEach(stat => {
            const userOt = activeOtRequests.filter(req => req.userId === stat.userId);
            stat.totalOtHours = userOt.reduce((sum, req) => sum + req.durationHours, 0);
            stat.totalOtPayout = userOt.reduce((sum, req) => sum + req.computedPayout, 0);
        });

        return Object.values(statsMap);
    }, [users, logs, startTime, lateBuffer, workingDaysInMonth, otRequests, currentMonth, dateFilterMode, customStartDate, customEndDate]);

    // Compute unique positions from active users
    const positions = useMemo(() => {
        const unique = new Set(users.filter(u => u.isActive && u.position).map(u => u.position));
        return Array.from(unique).sort();
    }, [users]);

    // Filtering (Two-Phase Filtering)
    const filteredStats = useMemo(() => {
        const baseFiltered = userStats.filter(stat => {
            const user = users.find(u => u.id === stat.userId);
            if (!user) return false;

            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEmploymentType = selectedEmploymentType === 'ALL' || user.employmentType === selectedEmploymentType;
            const matchesPosition = selectedPosition === 'ALL' || user.position === selectedPosition;

            return matchesSearch && matchesEmploymentType && matchesPosition;
        });

        // Dynamic Metric Filter
        let finalStats = baseFiltered;

        if (activeStatFilter !== 'ALL') {
            const getVal = (s: typeof userStats[0]) => {
                if (activeStatFilter === 'PRESENT') return s.present;
                if (activeStatFilter === 'LATE') {
                    return lateViewMode === 'HOURS' ? (s.totalLateMinutes || 0) : s.late;
                }
                if (activeStatFilter === 'ABSENT') return s.absent;
                if (activeStatFilter === 'LEAVE') return s.leaves;
                return s.present;
            };

            if (sortDirection === 'DESC') {
                finalStats = baseFiltered.filter(s => getVal(s) > 0);
            } else {
                // ASC
                const hasZero = baseFiltered.some(s => getVal(s) === 0);
                if (hasZero) {
                    finalStats = baseFiltered.filter(s => getVal(s) === 0);
                }
            }
        }

        // Sort
        return [...finalStats].sort((a, b) => {
            let valA = 0;
            let valB = 0;
            if (activeStatFilter === 'LATE') {
                valA = lateViewMode === 'HOURS' ? (a.totalLateMinutes || 0) : a.late;
                valB = lateViewMode === 'HOURS' ? (b.totalLateMinutes || 0) : b.late;
            } else if (activeStatFilter === 'ABSENT') {
                valA = a.absent;
                valB = b.absent;
            } else if (activeStatFilter === 'LEAVE') {
                valA = a.leaves;
                valB = b.leaves;
            } else {
                // PRESENT or ALL
                valA = a.present;
                valB = b.present;
            }

            if (sortDirection === 'ASC') {
                return valA - valB;
            } else {
                return valB - valA;
            }
        });
    }, [userStats, users, searchTerm, selectedEmploymentType, selectedPosition, activeStatFilter, sortDirection, lateViewMode]);

    // Aggregates
    const totalCheckins = logs.filter(l => l.status !== 'LEAVE').length;
    const totalLeaves = logs.filter(l => l.status === 'LEAVE').length;
    const totalLates = userStats.reduce((sum, s) => sum + s.late, 0);
    const totalAbsents = userStats.reduce((sum, s) => sum + s.absent, 0);
    const lateRate = totalCheckins > 0 ? Math.round((totalLates / totalCheckins) * 100) : 0;

    const getGrade = (stat: UserStat) => {
        if (stat.present === 0 && stat.leaves === 0) return { grade: 'N/A', color: 'bg-gray-100 text-gray-400' };

        // Use Dynamic Rules from Config if available
        const rules = config?.ATTENDANCE_GRADING_RULES || [
             { grade: "A+", max_late: 0, color: "bg-green-100 text-green-700" },
             { grade: "B", max_late: 2, color: "bg-blue-100 text-blue-700" },
             { grade: "C", max_late: 4, color: "bg-yellow-100 text-yellow-700" },
             { grade: "F", max_late: 999, color: "bg-red-100 text-red-700" }
        ];

        // Sort rules by strictness (lowest max_late first)
        const sortedRules = [...rules].sort((a: any, b: any) => a.max_late - b.max_late);

        for (const rule of sortedRules) {
            if (stat.late <= rule.max_late) {
                return { grade: rule.grade, color: rule.color };
            }
        }
        
        // Fallback
        return { grade: 'F', color: 'bg-red-100 text-red-700' };
    };

    // --- CSV Export Logic ---
    const handleExportCSV = () => {
        // 1. Header
        const headers = [
            "Employee Name", 
            "Position", 
            "Days Present", 
            lateViewMode === 'HOURS' ? "Late Duration" : "Late Count", 
            "Leave Days", 
            "Total Hours", 
            "Performance Grade"
        ];
        
        // 2. Rows
        const rows = filteredStats.map(stat => {
            const user = users.find(u => u.id === stat.userId);
            const gradeInfo = getGrade(stat);
            
            let lateValue: string | number = stat.late;
            if (lateViewMode === 'HOURS') {
                const totalMins = stat.totalLateMinutes || 0;
                const hrs = Math.floor(totalMins / 60);
                const mins = totalMins % 60;
                lateValue = hrs > 0 ? `"${hrs}h ${mins}m"` : `"${mins}m"`;
            }

            return [
                `"${user?.name || 'Unknown'}"`,
                `"${user?.position || '-'}"`,
                stat.present,
                lateValue,
                stat.leaves,
                stat.totalHours.toFixed(2),
                `"${gradeInfo.grade}"`
            ].join(",");
        });

        // 3. Combine & Download
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        const dateRangeStr = dateFilterMode === 'MONTH' 
            ? format(currentMonth, 'MMMM_yyyy') 
            : `${format(customStartDate, 'yyyy-MM-dd')}_to_${format(customEndDate, 'yyyy-MM-dd')}`;
        const fileName = `Attendance_Report_${dateRangeStr}.csv`;
        
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            <AnimatePresence mode="wait">
                {viewMode === 'TABLE' ? (
                    <motion.div
                        key="TABLE"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        <DashboardStats 
                            totalCheckins={totalCheckins}
                            totalLates={totalLates}
                            lateRate={lateRate}
                            totalAbsents={totalAbsents}
                            totalLeaves={totalLeaves}
                            activeUsersCount={users.filter(u => u.isActive).length}
                            activeFilter={activeStatFilter}
                            onFilterChange={setActiveStatFilter}
                        />

                        <DashboardHeader 
                            currentMonth={currentMonth}
                            setCurrentMonth={setCurrentMonth}
                            dateFilterMode={dateFilterMode}
                            setDateFilterMode={setDateFilterMode}
                            customStartDate={customStartDate}
                            setCustomStartDate={setCustomStartDate}
                            customEndDate={customEndDate}
                            setCustomEndDate={setCustomEndDate}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            selectedEmploymentType={selectedEmploymentType}
                            setSelectedEmploymentType={setSelectedEmploymentType}
                            selectedPosition={selectedPosition}
                            setSelectedPosition={setSelectedPosition}
                            positions={positions}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            isToolsExpanded={isToolsExpanded}
                            setIsToolsExpanded={setIsToolsExpanded}
                        />

                        <DashboardTable 
                            isLoading={isLoading}
                            filteredStats={filteredStats}
                            users={users}
                            getGrade={getGrade}
                            onUserClick={(user, stat) => setSelectedUser({ user, stat })}
                            activeStatFilter={activeStatFilter}
                            sortDirection={sortDirection}
                            onSortDirectionChange={setSortDirection}
                            lateViewMode={lateViewMode}
                            onLateViewModeChange={setLateViewMode}
                            otViewMode={otViewMode}
                            onOtViewModeChange={setOtViewMode}
                        />

                        <div className="flex justify-end">
                            <button 
                                onClick={() => setIsExportModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                            >
                                <Download className="w-4 h-4" /> Export CSV Report
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="ANALYTICS"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="space-y-6 w-full"
                    >
                        <DashboardHeader 
                            currentMonth={currentMonth}
                            setCurrentMonth={setCurrentMonth}
                            dateFilterMode={dateFilterMode}
                            setDateFilterMode={setDateFilterMode}
                            customStartDate={customStartDate}
                            setCustomStartDate={setCustomStartDate}
                            customEndDate={customEndDate}
                            setCustomEndDate={setCustomEndDate}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            selectedEmploymentType={selectedEmploymentType}
                            setSelectedEmploymentType={setSelectedEmploymentType}
                            selectedPosition={selectedPosition}
                            setSelectedPosition={setSelectedPosition}
                            positions={positions}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            isToolsExpanded={isToolsExpanded}
                            setIsToolsExpanded={setIsToolsExpanded}
                        />

                        <Suspense fallback={<AnalyticsSkeleton />}>
                            <AttendanceAnalytics 
                                users={users}
                                userStats={userStats}
                                workingDaysInMonth={workingDaysInMonth}
                                startTime={startTime}
                                lateBuffer={lateBuffer}
                                currentMonth={currentMonth}
                                getGrade={getGrade}
                                onUserClick={(user, stat) => setSelectedUser({ user, stat })}
                            />
                        </Suspense>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {selectedUser && (
                    <DashboardUserDetailModal 
                        user={selectedUser.user}
                        stat={selectedUser.stat}
                        workingDaysInMonth={workingDaysInMonth}
                        startTime={startTime}
                        lateBuffer={lateBuffer}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
            </AnimatePresence>

            <ExportControlCenterModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                users={users}
                userStats={userStats}
                getGrade={getGrade}
                currentMonth={currentMonth}
                workingDaysInMonth={workingDaysInMonth}
            />
        </div>
    );
};

export default AdminAttendanceDashboard;

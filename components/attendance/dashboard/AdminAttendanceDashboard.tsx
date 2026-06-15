
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';
import { checkIsLate, getAttendanceSummary } from '../../../lib/attendanceUtils';
import { useGameConfig } from '../../../context/GameConfigContext';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';
import { eachDayOfInterval, startOfMonth, endOfMonth, isWeekend } from 'date-fns';

// Import Separated Components
import DashboardHeader from './DashboardHeader';
import DashboardStats from './DashboardStats';
import DashboardTable from './DashboardTable';
import DashboardUserDetailModal from './DashboardUserDetailModal';

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
}

import { useMasterData } from '../../../hooks/useMasterData';

const AdminAttendanceDashboard: React.FC<AdminAttendanceDashboardProps> = ({ users }) => {
    const { masterOptions } = useMasterData();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [selectedUser, setSelectedUser] = useState<{ user: User, stat: UserStat } | null>(null);
    
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

    // Calculate Working Days in current month
    const monthDays = useMemo(() => {
        return eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth)
        });
    }, [currentMonth]);

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

    // Fetch Logs for the selected month
    useEffect(() => {
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

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
    }, [currentMonth]);

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
                logs: []
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
                    stat.totalHours += summary.workHours;
                }
            }
        });

        // Calculate Absents
        Object.values(statsMap).forEach(stat => {
            workingDaysInMonth.forEach(day => {
                // Only count past days or today if it's already late
                if (day > today) return;
                
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasLog = stat.logs.some(l => l.date === dateStr);
                const isLeave = stat.logs.some(l => l.date === dateStr && (l.status === 'LEAVE' || l.workType === 'LEAVE'));
                
                if (!hasLog && !isLeave) {
                    stat.absent++;
                }
            });
        });

        return Object.values(statsMap);
    }, [users, logs, startTime, lateBuffer, workingDaysInMonth]);

    // Filtering
    const filteredStats = userStats.filter(stat => {
        const user = users.find(u => u.id === stat.userId);
        return user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => b.present - a.present); // Sort by most present

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
        const headers = ["Employee Name", "Position", "Days Present", "Late Count", "Leave Days", "Total Hours", "Performance Grade"];
        
        // 2. Rows
        const rows = filteredStats.map(stat => {
            const user = users.find(u => u.id === stat.userId);
            const gradeInfo = getGrade(stat);
            return [
                `"${user?.name || 'Unknown'}"`,
                `"${user?.position || '-'}"`,
                stat.present,
                stat.late,
                stat.leaves,
                stat.totalHours.toFixed(2),
                `"${gradeInfo.grade}"`
            ].join(",");
        });

        // 3. Combine & Download
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        const fileName = `Attendance_Report_${format(currentMonth, 'MMMM_yyyy')}.csv`;
        
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            <DashboardHeader 
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            <DashboardStats 
                totalCheckins={totalCheckins}
                totalLates={totalLates}
                lateRate={lateRate}
                totalAbsents={totalAbsents}
                totalLeaves={totalLeaves}
                activeUsersCount={users.filter(u => u.isActive).length}
            />

            <DashboardTable 
                isLoading={isLoading}
                filteredStats={filteredStats}
                users={users}
                getGrade={getGrade}
                onUserClick={(user, stat) => setSelectedUser({ user, stat })}
            />
            
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
            
            <div className="flex justify-end">
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                >
                    <Download className="w-4 h-4" /> Export CSV Report
                </button>
            </div>
        </div>
    );
};

export default AdminAttendanceDashboard;

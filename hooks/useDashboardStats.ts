
import { useState, useMemo, useEffect } from 'react';
import { Task, User } from '../types';
import { isAfter, isBefore, addDays, isSameMonth, getISOWeek, isPast, isToday, format, subDays } from 'date-fns';
import { useDashboardConfig } from './useDashboardConfig';
import { CHART_COLORS_MAP } from '../components/dashboard/admin/constants';
import { isTaskCompleted } from '../constants'; // Import helper
import { supabase } from '../lib/supabase';
import { useMasterData } from './useMasterData';
import { checkIsLate } from '../lib/attendanceUtils';

export type TimeRangeOption = 'THIS_MONTH' | 'LAST_30' | 'LAST_90' | 'CUSTOM' | 'ALL';
export type ViewScope = 'ALL' | 'ME';

export interface AttendanceStat {
    present: number;
    late: number;
    leave: number;
    absent: number;
    totalUsers: number;
}

// Theme Definitions - Updated for Redesign 2.0 (Clean White Cards)
export const WEEKLY_THEMES = [
    {
        id: 'MODERN_CLEAN',
        name: 'Modern Clean ☁️',
        getStyle: (color: string) => ({
            container: `bg-white border border-gray-100 shadow-sm hover:shadow-md border-b-[4px] border-b-${color}-400`,
            iconBg: `text-${color}-500 bg-${color}-50 opacity-0 group-hover:opacity-100 transition-opacity`, // Hidden by default in new design usually, but we use absolute positioning
            textCount: `text-gray-800`,
            label: `text-gray-500 font-bold uppercase tracking-wider`,
            decoration: 'bottom-bar',
            accentColor: color
        })
    },
    {
        id: 'SOFT_POP',
        name: 'Soft Pop 🍬',
        getStyle: (color: string) => ({
            container: `bg-white border border-gray-100 shadow-sm hover:shadow-md border-l-[4px] border-l-${color}-400`,
            iconBg: `text-${color}-500`,
            textCount: `text-gray-800`,
            label: `text-gray-500 font-bold`,
            decoration: 'left-border',
            accentColor: color
        })
    },
    {
        id: 'NEO_GLASS',
        name: 'Neo Glass 💎',
        getStyle: (color: string) => ({
            container: `bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 hover:ring-${color}-300`,
            iconBg: `text-${color}-500`,
            textCount: `text-gray-800`,
            label: `text-gray-500 font-bold`,
            decoration: 'glass',
            accentColor: color
        })
    },
    {
        id: 'BOLD_STROKE',
        name: 'Bold Stroke ✏️',
        getStyle: (color: string) => ({
            container: `bg-white border-2 border-gray-100 hover:border-${color}-400 shadow-sm`,
            iconBg: `text-${color}-600`,
            textCount: `text-gray-900`,
            label: `text-gray-600 font-black uppercase`,
            decoration: 'border-hover',
            accentColor: color
        })
    }
];

export const useDashboardStats = (tasks: Task[], currentUser: User) => {
    const today = new Date();
    const { configs, isLoading: configLoading } = useDashboardConfig();
    const { masterOptions } = useMasterData();

    // Local State for Filters
    const [timeRange, setTimeRange] = useState<TimeRangeOption>('LAST_30');
    const [customDays, setCustomDays] = useState<number>(7);
    const [viewScope, setViewScope] = useState<ViewScope>(currentUser.role === 'ADMIN' ? 'ALL' : 'ME');

    // Server-aggregated Stats State
    const [stats, setStats] = useState<{
        cardStats: any[];
        chartData: any[];
        totalFilteredTasks: number;
        progressPercentage: number;
    }>({
        cardStats: [],
        chartData: [],
        totalFilteredTasks: 0,
        progressPercentage: 0
    });
    const [statsLoading, setStatsLoading] = useState<boolean>(true);

    // Attendance Stats
    const [attendanceToday, setAttendanceToday] = useState<AttendanceStat>({ present: 0, late: 0, leave: 0, absent: 0, totalUsers: 0 });
    const [attendanceYesterday, setAttendanceYesterday] = useState<AttendanceStat>({ present: 0, late: 0, leave: 0, absent: 0, totalUsers: 0 });

    // --- Weekly Theme Logic ---
    const currentWeekNum = getISOWeek(today);
    const themeIndex = currentWeekNum % WEEKLY_THEMES.length;
    const currentTheme = WEEKLY_THEMES[themeIndex];

    // --- Attendance Fetching Logic ---
    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                // 1. Get Total Active Users
                const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
                
                const todayStr = format(today, 'yyyy-MM-dd');
                const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

                // 2. Fetch Logs for Today & Yesterday
                const { data: logs } = await supabase
                    .from('attendance_logs')
                    .select('date, status, check_in_time, work_type')
                    .in('date', [todayStr, yesterdayStr]);

                if (logs) {
                    const workConfig = masterOptions.filter(opt => opt.type === 'WORK_CONFIG');
                    const startTimeStr = workConfig.find(c => c.key === 'START_TIME')?.label || '10:00';
                    const lateBufferMinutes = parseInt(workConfig.find(c => c.key === 'LATE_BUFFER')?.label || '0');

                    const calcStats = (dateStr: string): AttendanceStat => {
                        const dayLogs = logs.filter(l => l.date === dateStr);
                        
                        let present = 0;
                        let late = 0;
                        let leave = 0;

                        dayLogs.forEach(log => {
                            if (log.status === 'LEAVE' || log.work_type === 'LEAVE') {
                                leave++;
                            } else {
                                present++;
                                // Check Late (Using dynamic rule)
                                if (log.check_in_time) {
                                    const time = new Date(log.check_in_time);
                                    if (checkIsLate(time, startTimeStr, lateBufferMinutes)) {
                                        late++;
                                    }
                                }
                            }
                        });

                        // Absent = Total Active - (Present + Leave)
                        const absent = Math.max(0, (totalUsers || 0) - (present + leave));

                        return { present, late, leave, absent, totalUsers: totalUsers || 0 };
                    };

                    setAttendanceToday(calcStats(todayStr));
                    setAttendanceYesterday(calcStats(yesterdayStr));
                }

            } catch (err) {
                console.error("Error fetching attendance stats:", err);
            }
        };

        fetchAttendance();
    }, [masterOptions]); // Run when master options load

    // --- Server-side Stats Aggregate Fetching Effect ---
    useEffect(() => {
        let active = true;
        setStatsLoading(true);

        const fetchStats = async () => {
            try {
                const params = new URLSearchParams({
                    timeRange,
                    customDays: String(customDays),
                    viewScope,
                    userId: currentUser?.id || ''
                });
                const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch stats');
                const json = await res.json();
                if (json.success && active) {
                    setStats({
                        cardStats: json.cardStats || [],
                        chartData: json.chartData || [],
                        totalFilteredTasks: json.totalFilteredTasks || 0,
                        progressPercentage: json.progressPercentage || 0
                    });
                }
            } catch (err) {
                console.error('Error loading dashboard stats:', err);
            } finally {
                if (active) {
                    setStatsLoading(false);
                }
            }
        };

        fetchStats();

        return () => {
            active = false;
        };
    }, [timeRange, customDays, viewScope, currentUser?.id, tasks]); // Live reactivity lock!

    // --- Chart Data Color Mapper ---
    const chartData = useMemo(() => {
        return stats.chartData.map(d => ({
            name: d.name,
            value: d.value,
            color: CHART_COLORS_MAP[d.colorTheme || 'blue'] || '#3b82f6'
        }));
    }, [stats.chartData]);

    const getTimeRangeLabel = () => {
        switch(timeRange) {
            case 'THIS_MONTH': return 'เดือนนี้';
            case 'LAST_30': return '30 วันล่าสุด';
            case 'LAST_90': return '90 วันล่าสุด';
            case 'CUSTOM': return `ย้อนหลัง ${customDays} วัน`;
            case 'ALL': return 'ทั้งหมด (All Time)';
        }
    };

    return {
        timeRange, setTimeRange,
        customDays, setCustomDays,
        viewScope, setViewScope,
        configLoading: configLoading || statsLoading,
        currentTheme,
        cardStats: stats.cardStats,
        urgentTasks: [], // Unused in AdminDashboard
        dueSoon: [], // Unused in AdminDashboard
        chartData,
        totalFilteredTasks: stats.totalFilteredTasks,
        progressPercentage: stats.progressPercentage,
        getTimeRangeLabel,
        // Attendance Data
        attendanceToday,
        attendanceYesterday
    };
};

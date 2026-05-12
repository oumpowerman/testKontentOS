
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
                        // Note: This is an approximation. Ideally check against user list.
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
    }, []); // Run once on mount

    // --- Filtering Logic ---
    const checkDateInRange = (date: Date) => {
        switch (timeRange) {
            case 'THIS_MONTH': return isSameMonth(date, today);
            case 'LAST_30': return isAfter(date, addDays(today, -30));
            case 'LAST_90': return isAfter(date, addDays(today, -90));
            case 'CUSTOM': return isAfter(date, addDays(today, -customDays));
            case 'ALL': return true;
            default: return true;
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const isDone = isTaskCompleted(t.status as string);

            // 0. Exclude Stock Items from general stats (unless Done)
            if (t.isUnscheduled && !isDone) {
                return false;
            }

            // 1. Scope Filter (Me vs All)
            if (viewScope === 'ME') {
                const isAssignee = t.assigneeIds?.includes(currentUser.id);
                const isOwner = t.ideaOwnerIds?.includes(currentUser.id);
                const isEditor = t.editorIds?.includes(currentUser.id);
                if (!isAssignee && !isOwner && !isEditor) return false;
            }

            // 2. Time Range Filter
            if (timeRange === 'ALL') return true;
            const isInRange = checkDateInRange(t.endDate);
            
            if (isDone) {
                // Done tasks: Strict range check
                return isInRange;
            } else {
                // Pending tasks: Show if in range OR if overdue (Active work should stay visible)
                return isInRange || isBefore(t.endDate, today); 
            }
        });
    }, [tasks, viewScope, timeRange, customDays, currentUser.id]);

    // --- Stats Generation ---
    const cardStats = useMemo(() => {
        return configs.map(config => {
            const matchingTasks = filteredTasks.filter(t => {
                if (config.filterType === 'STATUS') {
                    return (config.statusKeys || []).includes(t.status || '');
                } 
                else if (config.filterType === 'FORMAT') {
                    const formats = t.contentFormats || [];
                    return (config.statusKeys || []).some(key => formats.includes(key));
                }
                else if (config.filterType === 'PILLAR') {
                    return (config.statusKeys || []).includes(t.pillar || '');
                }
                else if (config.filterType === 'CATEGORY') {
                    return (config.statusKeys || []).includes(t.category || '');
                }
                return false;
            });

            // Urgent Count: Overdue or Due Soon AND NOT DONE
            const urgentCount = matchingTasks.filter(t => {
                const isDone = isTaskCompleted(t.status as string); // Explicit check using helper
                if (isDone || t.isUnscheduled) return false;
                
                // Logic: Overdue OR Due Today/Tomorrow
                const isOverdue = isPast(t.endDate) && !isToday(t.endDate);
                const isDueSoon = isToday(t.endDate) || isBefore(t.endDate, addDays(new Date(), 1));
                
                return isOverdue || isDueSoon;
            }).length;

            return {
                ...config,
                tasks: matchingTasks,
                count: matchingTasks.length,
                urgentCount: urgentCount
            };
        });
    }, [configs, filteredTasks]);

    // --- Urgent & Due Soon Logic (Global) ---
    const urgentTasks = useMemo(() => filteredTasks
        .filter(t => {
            // FIX: Use isTaskCompleted helper to handle all "Done" variations
            const isDone = isTaskCompleted(t.status as string);
            
            if (isDone || t.isUnscheduled) return false;

            const isExplicitUrgent = t.priority === 'URGENT' || t.priority === 'HIGH';
            const isOverdue = isPast(t.endDate) && !isToday(t.endDate);
            const isDueSoon = isToday(t.endDate) || isBefore(t.endDate, addDays(today, 2));

            return isExplicitUrgent || isOverdue || isDueSoon;
        })
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        .slice(0, 5), [filteredTasks]);

    const dueSoon = useMemo(() => filteredTasks
        .filter(t => {
            const isDone = isTaskCompleted(t.status as string);
            return isAfter(t.endDate, today) && 
                   isBefore(t.endDate, addDays(today, 3)) && 
                   !isDone &&
                   !t.isUnscheduled;
        })
        .slice(0, 3), [filteredTasks, today]);

    // --- Chart Data ---
    const chartData = useMemo(() => {
        return cardStats.map(stat => ({
            name: stat.label,
            value: stat.count,
            color: CHART_COLORS_MAP[stat.colorTheme || 'blue'] || '#3b82f6'
        })).filter(d => d.value > 0);
    }, [cardStats]);

    const totalFilteredTasks = filteredTasks.length;
    const doneTasksCount = filteredTasks.filter(t => isTaskCompleted(t.status as string)).length;
    const progressPercentage = totalFilteredTasks > 0 ? Math.round((doneTasksCount / totalFilteredTasks) * 100) : 0;

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
        configLoading,
        currentTheme,
        cardStats,
        urgentTasks,
        dueSoon,
        chartData,
        totalFilteredTasks,
        progressPercentage,
        getTimeRangeLabel,
        // Attendance Data
        attendanceToday,
        attendanceYesterday
    };
};

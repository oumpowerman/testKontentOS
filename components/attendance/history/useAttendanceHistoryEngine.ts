import { useState, useEffect, useMemo, useCallback } from 'react';
import { AttendanceLog, LeaveType, LeaveRequest } from '../../../types/attendance';
import { useAttendanceHistory } from '../../../hooks/attendance/useAttendanceHistory';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests'; 
import { useUserSession } from '../../../context/UserSessionContext';
import { supabase } from '../../../lib/supabase';
import { format, isSameDay, isBefore, startOfDay, eachDayOfInterval, parseISO, isFuture } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import { checkIsLate, parseAttendanceMetadata } from '../../../lib/attendanceUtils';
import { useMasterDataContext } from '../../../context/MasterDataContext';
import { isWorkingDay, isUserOnLeave } from '../../../utils/judgeUtils';
import { AnnualHoliday } from '../../../types';
import { Clock, CheckCircle2, XCircle, Calendar, HelpCircle, Loader2, AlertTriangle } from 'lucide-react';

const PAGE_SIZE = 15;

export const useAttendanceHistoryEngine = (userId: string) => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<any>({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        workType: 'ALL'
    });

    const { getAttendanceLogs, isHistoryLoading: isFetching } = useAttendanceHistory(userId);
    const { allUsers } = useUserSession();
    const { requests, submitRequest } = useLeaveRequests({ id: userId } as any);

    const targetUser = useMemo(() => allUsers.find(u => u.id === userId), [allUsers, userId]);

    // Data State
    const [historyLogs, setHistoryLogs] = useState<AttendanceLog[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [holidays, setHolidays] = useState<AnnualHoliday[]>([]);
    const [exceptions, setExceptions] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        // 1. Generate all days in the filter range first to calculate dates interval
        const start = parseISO(filters.startDate);
        const end = parseISO(filters.endDate);
        const allDays = eachDayOfInterval({ start, end });

        // Fetch logs from DB only within the selected date range to minimize network and database load
        const dbFilters = {
            startDate: filters.startDate,
            endDate: filters.endDate,
            workType: 'ALL'
        };
        const maxLogsNeeded = Math.max(100, allDays.length + 10);
        const { data: dbLogs, aborted } = await getAttendanceLogs(1, maxLogsNeeded, dbFilters);
        
        if (aborted) {
            return;
        }
        
        // 2. Map existing logs by date for O(1) fast lookup
        const logMap = new Map<string, AttendanceLog>();
        dbLogs.forEach(log => {
            const dateStr = format(new Date(log.date), 'yyyy-MM-dd');
            logMap.set(dateStr, log);
        });

        // 3. Define basic structure for calendar-first pagination (Active days metadata)
        interface ActiveDayInfo {
            date: Date;
            dateStr: string;
            existingLog?: AttendanceLog;
            virtualStatus?: 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'NOT_STARTED';
            virtualWorkType?: string;
        }

        const activeDays: ActiveDayInfo[] = [];

        for (const date of allDays) {
            const dateStr = format(date, 'yyyy-MM-dd');
            const existingLog = logMap.get(dateStr);

            if (existingLog) {
                activeDays.push({ date, dateStr, existingLog });
            } else {
                // Determine virtual status and workType
                const isWorkDay = isWorkingDay(date, holidays, exceptions, targetUser || null);
                const leaveCheck = isUserOnLeave(dateStr, requests);
                const isPast = !isFuture(date) && !isSameDay(date, new Date());

                let status: 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'NOT_STARTED' = 'ABSENT';
                let workType = 'OFFICE';
                
                if (leaveCheck.onLeave) {
                    status = 'LEAVE';
                    workType = 'LEAVE';
                } else if (!isWorkDay) {
                    status = 'HOLIDAY';
                    workType = 'OFFICE'; // Default
                } else if (!isPast) {
                    status = 'NOT_STARTED'; // Skip future/unstarted
                    workType = 'OFFICE';
                }

                // Filter out holidays/weekends/unstarted from the active log list to match previous logic
                if (status === 'HOLIDAY' || status === 'NOT_STARTED') {
                    continue;
                }

                activeDays.push({
                    date,
                    dateStr,
                    virtualStatus: status,
                    virtualWorkType: workType
                });
            }
        }

        // 4. Perform client-side workType filtering on the active days metadata list
        let filteredActiveDays = activeDays;
        if (filters.workType && filters.workType !== 'ALL') {
            filteredActiveDays = activeDays.filter(day => {
                if (day.existingLog) {
                    return day.existingLog.workType === filters.workType;
                } else {
                    return day.virtualWorkType === filters.workType;
                }
            });
        }

        // 5. Sort descending by date (latest date first)
        filteredActiveDays.sort((a, b) => b.date.getTime() - a.date.getTime());

        setTotalCount(filteredActiveDays.length);
        
        // 6. Paginate the calendar metadata list first to identify target 15 days
        const startIndex = (page - 1) * PAGE_SIZE;
        const pageActiveDays = filteredActiveDays.slice(startIndex, startIndex + PAGE_SIZE);

        // 7. Perform Gap-Filling ONLY for the 15 active days of the current page
        const pagedData: AttendanceLog[] = pageActiveDays.map(day => {
            if (day.existingLog) {
                return day.existingLog;
            }

            return {
                id: `virtual-${day.dateStr}`,
                userId: userId,
                date: day.dateStr,
                checkInTime: null,
                checkOutTime: null,
                status: day.virtualStatus || 'ABSENT',
                workType: day.virtualWorkType || 'OFFICE',
                note: '[VIRTUAL] Missing log',
                locationName: undefined
            } as AttendanceLog;
        });

        setHistoryLogs(pagedData);

    }, [getAttendanceLogs, page, filters, holidays, exceptions, targetUser, requests, userId]);

    // Initial Fetch & Filter Change
    useEffect(() => {
        const fetchPrerequisites = async () => {
            const [hRes, eRes] = await Promise.all([
                supabase.from('annual_holidays').select('*'),
                supabase.from('calendar_exceptions').select('*')
            ]);
            if (hRes.data) setHolidays(hRes.data);
            if (eRes.data) setExceptions(eRes.data);
        };
        fetchPrerequisites();
    }, []);

    useEffect(() => {
        fetchData();

        // Real-time Subscription for this user's logs
        const channel = supabase.channel(`attendance-history-realtime-${userId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance_logs',
                filter: `user_id=eq.${userId}`
            }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, userId]); 

    const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
    
    // Re-submit State
    const [resubmitLog, setResubmitLog] = useState<AttendanceLog | null>(null);
    const [isResubmitOpen, setIsResubmitOpen] = useState(false);

    // Filter MY requests for the separate component
    const myRequests = useMemo(() => {
        return requests
            .filter(r => r.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [requests, userId]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev: any) => ({ ...prev, [key]: value }));
        setPage(1); 
    };

    const resetFilters = () => {
        setFilters({
            startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
            workType: 'ALL'
        });
        setPage(1);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const { masterOptions } = useMasterDataContext();
    const startTimeStr = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
    const lateBufferMinutes = parseInt(masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER')?.label || '0');

    // Helpers
    const isLate = useCallback((log: AttendanceLog) => {
        if (!log.checkInTime) return false;
        return checkIsLate(log.checkInTime, startTimeStr, lateBufferMinutes);
    }, [startTimeStr, lateBufferMinutes]);

    const getProofUrl = useCallback((log: AttendanceLog) => {
        if (log.note && log.note.includes('[PROOF:')) {
            const meta = parseAttendanceMetadata(log.note);
            return meta.proofUrl;
        }
        return null;
    }, []);

    const getLocationDisplay = useCallback((log: AttendanceLog) => {
        if (log.locationName) return log.locationName;
        const meta = parseAttendanceMetadata(log.note);
        return meta.locationName || (meta.location ? `${meta.location.lat.toFixed(4)}, ${meta.location.lng.toFixed(4)}` : '-');
    }, []);

    const getWorkHours = useCallback((log: AttendanceLog) => {
        if (!log.checkInTime || !log.checkOutTime) return '-';
        const diffMs = log.checkOutTime.getTime() - log.checkInTime.getTime();
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}h ${mins}m`;
    }, []);
    
    // --- STATUS BADGE LOGIC (Updated for 100% Coverage) ---
    const getStatusConfig = useCallback((log: AttendanceLog, userStartDate?: Date) => {
        if (log.status === 'ABSENT' && userStartDate && isBefore(startOfDay(new Date(log.date)), startOfDay(userStartDate))) {
            return { label: 'ยังไม่เริ่มงาน', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: HelpCircle };
        }
        switch (log.status) {
            case 'COMPLETED':
            case 'ON_TIME': // In case we use specific status
                return { label: 'ปกติ', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
            case 'LATE':
                return { label: 'สาย', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock };
            case 'ABSENT':
            case 'NO_SHOW':
                return { label: 'ขาดงาน', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
            case 'LEAVE':
                return { label: 'ลา', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar };
            case 'PENDING_VERIFY':
                return { label: 'รอตรวจสอบ', color: 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse', icon: HelpCircle };
            case 'ACTION_REQUIRED':
                return { label: 'แก้ไขด่วน', color: 'bg-red-500 text-white border-red-600 animate-bounce', icon: AlertTriangle };
            case 'WORKING':
                return { label: 'กำลังทำงาน', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Loader2 };
            default:
                return { label: log.status, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Calendar };
        }
    }, []);

    const handleResubmit = useCallback((log: AttendanceLog) => {
        setResubmitLog(log);
        setIsResubmitOpen(true);
    }, []);
    
    const handleResubmitSubmit = useCallback(async (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => {
        const success = await submitRequest(type, start, end, reason, file);
        if (success) {
            fetchData(); 
        }
        return success;
    }, [submitRequest, fetchData]);

    return {
        page,
        setPage,
        filters,
        isFetching,
        historyLogs,
        totalCount,
        totalPages,
        targetUser,
        myRequests,
        handleFilterChange,
        resetFilters,
        viewProofUrl,
        setViewProofUrl,
        resubmitLog,
        setResubmitLog,
        isResubmitOpen,
        setIsResubmitOpen,
        handleResubmit,
        handleResubmitSubmit,
        fetchData,
        isLate,
        getProofUrl,
        getLocationDisplay,
        getWorkHours,
        getStatusConfig,
        holidays,
        exceptions,
        PAGE_SIZE
    };
};


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AttendanceLog, LeaveType } from '../../../types/attendance';
import { useAttendanceHistory } from '../../../hooks/attendance/useAttendanceHistory';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests'; 
import { useUserSession } from '../../../context/UserSessionContext';
import { supabase } from '../../../lib/supabase';
import { format, isSameDay, isBefore, startOfDay, eachDayOfInterval, parseISO, isFuture } from 'date-fns';
import startOfDayFn from 'date-fns/startOfDay'; // avoid namespace clash
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import th from 'date-fns/locale/th';
import { 
    Calendar, MapPin, XCircle, Image as ImageIcon, 
    ExternalLink, ChevronLeft, ChevronRight, Filter, RefreshCw, Loader2, ArrowRight,
    AlertTriangle, Clock, CheckCircle2, HelpCircle
} from 'lucide-react';
import { parseAttendanceMetadata, getWorkingDaysDifference, checkIsLate } from '../../../lib/attendanceUtils';
import { useMasterDataContext } from '../../../context/MasterDataContext';
import { getDirectDriveUrl } from '../../../lib/imageUtils';
import { isWorkingDay, isUserOnLeave } from '../../../utils/judgeUtils';
import LeaveRequestModal from '../leave-request/LeaveRequestModal'; 
import MyRequestHistory from './MyRequestHistory'; 
import { AnnualHoliday } from '../../../types';

interface AttendanceHistoryProps {
    userId: string;
}

const PAGE_SIZE = 15;

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ userId }) => {
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
        // Fetch a larger set to handle gap filling (max 93 days/3 months suggested range)
        const { data: dbLogs, aborted } = await getAttendanceLogs(1, 200, filters);
        
        if (aborted) {
            return;
        }
        
        // 1. Generate all days in the filter range
        const start = parseISO(filters.startDate);
        const end = parseISO(filters.endDate);
        const allDays = eachDayOfInterval({ start, end });

        // 2. Map existing logs by date for easy lookup
        const logMap = new Map<string, AttendanceLog>();
        dbLogs.forEach(log => {
            const dateStr = format(new Date(log.date), 'yyyy-MM-dd');
            logMap.set(dateStr, log);
        });

        // 3. Construct the full history list
        const filledHistory: AttendanceLog[] = allDays.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const existingLog = logMap.get(dateStr);

            if (existingLog) return existingLog;

            // Generate virtual log for missing days
            const isWorkDay = isWorkingDay(date, holidays, exceptions, targetUser || null);
            const leaveCheck = isUserOnLeave(dateStr, requests);
            const isPast = !isFuture(date) && !isSameDay(date, new Date());

            let status: any = 'ABSENT';
            let workType: any = 'OFFICE';
            
            if (leaveCheck.onLeave) {
                status = 'LEAVE';
                workType = 'LEAVE';
            } else if (!isWorkDay) {
                status = 'HOLIDAY';
                workType = 'OFFICE'; // Default
            } else if (!isPast) {
                status = 'NOT_STARTED'; // Use a special label or skip
                workType = 'OFFICE';
            }

            return {
                id: `virtual-${dateStr}`,
                userId: userId,
                date: dateStr,
                checkInTime: null,
                checkOutTime: null,
                status: status,
                workType: workType,
                note: '[VIRTUAL] Missing log',
                locationName: undefined
            } as AttendanceLog;
        })
        .filter((log: any) => {
            // Filter out weekends/holidays if desired, or show them as non-absent
            if (log.status === 'HOLIDAY' || log.status === 'NOT_STARTED') return false;
            return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTotalCount(filledHistory.length);
        
        // Paginate locally
        const startIndex = (page - 1) * PAGE_SIZE;
        const pagedData = filledHistory.slice(startIndex, startIndex + PAGE_SIZE);
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
    const isLate = (log: AttendanceLog) => {
        if (!log.checkInTime) return false;
        return checkIsLate(log.checkInTime, startTimeStr, lateBufferMinutes);
    };

    const getProofUrl = (log: AttendanceLog) => {
        if (log.note && log.note.includes('[PROOF:')) {
            const meta = parseAttendanceMetadata(log.note);
            return meta.proofUrl;
        }
        return null;
    };

    const getLocationDisplay = (log: AttendanceLog) => {
        if (log.locationName) return log.locationName;
        const meta = parseAttendanceMetadata(log.note);
        return meta.locationName || (meta.location ? `${meta.location.lat.toFixed(4)}, ${meta.location.lng.toFixed(4)}` : '-');
    };

    const getWorkHours = (log: AttendanceLog) => {
        if (!log.checkInTime || !log.checkOutTime) return '-';
        const diffMs = log.checkOutTime.getTime() - log.checkInTime.getTime();
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}h ${mins}m`;
    };
    
    // --- STATUS BADGE LOGIC (Updated for 100% Coverage) ---
    const getStatusConfig = (log: AttendanceLog, userStartDate?: Date) => {
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
    };

    const handleResubmit = (log: AttendanceLog) => {
        setResubmitLog(log);
        setIsResubmitOpen(true);
    };
    
    const handleResubmitSubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => {
        const success = await submitRequest(type, start, end, reason, file);
        if (success) {
            fetchData(); 
        }
        return success;
    };

    return (
        <div className="space-y-8">
            
            {/* --- SECTION 1: REQUESTS (คำขอต่างๆ) --- */}
            <div className="animate-in fade-in slide-in-from-top-4">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">รายการคำขอ (Requests)</h3>
                 <MyRequestHistory requests={myRequests} />
            </div>

            {/* --- SECTION 2: ATTENDANCE LOGS (ประวัติเวลา) --- */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest ml-1">บันทึกเวลา (Time Logs)</h3>

                {/* --- Filter Bar --- */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 w-full sm:w-auto">
                            <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                            <input 
                                type="date" 
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none w-24"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            />
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <input 
                                type="date" 
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none w-24"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            />
                        </div>

                        {/* Work Type Filter */}
                        <div className="relative w-full sm:w-40">
                            <select 
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 appearance-none outline-none focus:border-indigo-400 cursor-pointer"
                                value={filters.workType}
                                onChange={(e) => handleFilterChange('workType', e.target.value)}
                            >
                                <option value="ALL">ทุกรูปแบบ (All Types)</option>
                                <option value="OFFICE">เข้าออฟฟิศ</option>
                                <option value="WFH">Work From Home</option>
                                <option value="SITE">On Site (ข้างนอก)</option>
                                <option value="LEAVE">การลา (Leaves)</option>
                            </select>
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={resetFilters} 
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="ล้างตัวกรอง"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={fetchData} 
                            className={`p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all ${isFetching ? 'animate-spin' : ''}`}
                            title="โหลดข้อมูลใหม่"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* --- Data Table --- */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Time In</th>
                                    <th className="px-6 py-4">Time Out</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-center">Duration</th>
                                    <th className="px-6 py-4 text-center">Proof</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isFetching && historyLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-gray-400">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
                                            กำลังโหลดข้อมูล...
                                        </td>
                                    </tr>
                                ) : historyLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-20 text-gray-400">
                                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            ไม่พบประวัติการลงเวลาในช่วงนี้
                                        </td>
                                    </tr>
                                ) : (
                                    historyLogs.map(log => {
                                        const late = isLate(log);
                                        const proof = getProofUrl(log);
                                        const statusConfig = getStatusConfig(log, targetUser?.startDate);
                                        const StatusIcon = statusConfig.icon;
                                        const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
                                        const isPending = log.status === 'PENDING_VERIFY';
                                        const isNotStarted = statusConfig.label === 'ยังไม่เริ่มงาน';
                                        
                                        // Check if it's a late correction (over 3 days)
                                        const isLateCorrection = log.status === 'ACTION_REQUIRED' && getWorkingDaysDifference(new Date(log.date), new Date(), holidays, exceptions, targetUser) > 3;
                                        
                                        return (
                                            <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${isSameDay(new Date(log.date), new Date()) ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                                        <div>
                                                            <span className="block text-sm font-bold text-gray-700">{format(new Date(log.date), 'd MMM yyyy')}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">{format(new Date(log.date), 'EEEE', { locale: th })}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.status === 'ACTION_REQUIRED' ? (
                                                        <button 
                                                            onClick={() => handleResubmit(log)}
                                                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-colors shadow-sm ${
                                                                isLateCorrection 
                                                                    ? 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600' 
                                                                    : 'bg-red-600 text-white border-red-700 hover:bg-red-700 animate-pulse'
                                                            }`}
                                                        >
                                                            <AlertTriangle className="w-3 h-3" /> 
                                                            {isLateCorrection ? 'ลงเวลาย้อนหลัง' : 'แก้ไขด่วน!'}
                                                        </button>
                                                    ) : (
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide flex items-center w-fit gap-1.5 ${statusConfig.color}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {statusConfig.label}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.checkInTime ? (
                                                        <span className={`font-mono font-bold text-sm ${late ? 'text-red-500' : 'text-green-600'}`}>
                                                            {format(log.checkInTime, 'HH:mm')}
                                                            {late && <span className="ml-2 text-[9px] bg-red-100 px-1.5 py-0.5 rounded text-red-600 uppercase">LATE</span>}
                                                        </span>
                                                    ) : (isLeave || isNotStarted) ? <span className="text-xs text-gray-400">-</span> : <span className="text-gray-300 text-xs">--:--</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.checkOutTime ? (
                                                        <span className="font-mono font-bold text-sm text-gray-600">{format(log.checkOutTime, 'HH:mm')}</span>
                                                    ) : isPending ? (
                                                        <span className="text-orange-500 italic text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> รออนุมัติ</span>
                                                    ) : (isLeave || isNotStarted) ? (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    ) : (log.status === 'ABSENT' || log.status === 'NO_SHOW' || !log.checkInTime) ? (
                                                        <span className="text-red-400 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-100 opacity-70">
                                                            <XCircle className="w-3 h-3" /> ขาดงาน
                                                        </span>
                                                    ) : isSameDay(new Date(log.date), new Date()) ? (
                                                        <span className="text-indigo-500 italic text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Working...</span>
                                                    ) : (
                                                        <span className="text-red-500 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                                                            <AlertTriangle className="w-3 h-3" /> ลืมลงออก
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide w-fit ${
                                                            log.workType === 'OFFICE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                            log.workType === 'WFH' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            log.workType === 'LEAVE' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                                            'bg-orange-50 text-orange-600 border-orange-100'
                                                        }`}>
                                                            {log.workType}
                                                        </span>
                                                        {!isLeave && (
                                                            <span className="text-xs text-gray-500 truncate max-w-[120px]" title={getLocationDisplay(log)}>
                                                                {getLocationDisplay(log)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {isLeave ? '8h' : getWorkHours(log)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {proof ? (
                                                        <button onClick={() => setViewProofUrl(proof)} className="p-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-gray-400 transition-all shadow-sm">
                                                            <ImageIcon className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-200 text-lg">•</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Pagination */}
                    {totalCount > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <span className="text-xs text-gray-500 font-medium">
                                Showing {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                            </span>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || isFetching}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold text-gray-700 px-2">
                                    Page {page} / {totalPages}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || isFetching}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Proof Modal */}
                {viewProofUrl && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewProofUrl(null)}>
                        <div className="relative max-w-lg w-full bg-white p-2 rounded-2xl shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setViewProofUrl(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
                                <XCircle className="w-8 h-8" />
                            </button>
                            <img 
                                src={getDirectDriveUrl(viewProofUrl)} 
                                className="w-full h-auto rounded-xl shadow-inner bg-gray-100" 
                                alt="Proof" 
                                referrerPolicy="no-referrer"
                            />
                            <a href={viewProofUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center mt-3 text-indigo-600 font-bold text-sm hover:underline py-2">
                                เปิดรูปต้นฉบับ <ExternalLink className="w-4 h-4 ml-1.5" />
                            </a>
                        </div>
                    </div>
                )}
                
                {/* Resubmit Modal */}
                <LeaveRequestModal 
                    isOpen={isResubmitOpen}
                    onClose={() => { setIsResubmitOpen(false); setResubmitLog(null); }}
                    onSubmit={handleResubmitSubmit}
                    initialDate={resubmitLog ? new Date(resubmitLog.date) : undefined}
                    initialReason={resubmitLog?.note ? resubmitLog.note.replace(/\[.*?\]/g, '').trim() : ''}
                    fixedType={(() => {
                        if (!resubmitLog) return undefined;
                        // Determine the correct correction type based on missing times
                        if (!resubmitLog.checkInTime && !resubmitLog.checkOutTime) return 'FORGOT_BOTH';
                        if (!resubmitLog.checkInTime) return 'FORGOT_CHECKIN';
                        if (!resubmitLog.checkOutTime) return 'FORGOT_CHECKOUT';
                        return 'LATE_ENTRY'; // Fallback for other action required cases
                    })() as LeaveType}
                />
            </div>
        </div>
    );
};

export default AttendanceHistory;

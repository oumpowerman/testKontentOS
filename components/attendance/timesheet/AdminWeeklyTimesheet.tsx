import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';
import { supabase } from '../../../lib/supabase';
import { 
    format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, 
    isToday, startOfMonth, endOfMonth, addMonths, isWeekend
} from 'date-fns';
import th from 'date-fns/locale/th';
import { checkIsLate } from '../../../lib/attendanceUtils';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';

// Import Separated Components
import TimesheetHeader from './TimesheetHeader';
import TimesheetTable from './TimesheetTable';
import TimesheetDetailModal from './TimesheetDetailModal';
import ExportSettingsModal from './ExportSettingsModal';
import { useMasterDataContext } from '../../../context/MasterDataContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

// --- Main Dashboard ---
const AdminWeeklyTimesheet: React.FC<{ users: User[] }> = ({ users }) => {
    const { masterOptions } = useMasterDataContext();
    
    // Toast state
    const [exportToast, setExportToast] = useState<{ filename: string; id: string } | null>(null);

    // Auto-dismiss Toast
    useEffect(() => {
        if (exportToast) {
            const timer = setTimeout(() => {
                setExportToast(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [exportToast]);

    // View States
    const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');
    const [showExportSettings, setShowExportSettings] = useState(false);
    const [isToolsExpanded, setIsToolsExpanded] = useState(false);

    const workConfig = useMemo(() => {
        const startTime = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
        const buffer = parseInt(masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER')?.label || '15');
        return { startTime, buffer };
    }, [masterOptions]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'LATE' | 'ABSENT'>('ALL');
    const [showInactive, setShowInactive] = useState(false);
    
    // Data States
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
    const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<any | null>(null);

    // Smart Calendar Data
    const { annualHolidays } = useAnnualHolidays();
    const { exceptions } = useCalendarExceptions();

    // Helper: Get Effective Status for a Day
    const getEffectiveDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // 1. Exception (Highest Priority)
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) return { status: exception.type, source: 'EXCEPTION', desc: exception.description || (exception.type === 'WORK_DAY' ? 'วันทำงานพิเศษ' : 'วันหยุดพิเศษ') };

        // 2. Annual Holiday
        const holiday = annualHolidays.find(h => h.day === date.getDate() && h.month === date.getMonth() + 1 && h.isActive);
        if (holiday) return { status: 'HOLIDAY' as const, source: 'ANNUAL', desc: holiday.name };

        // 3. Weekend
        if (isWeekend(date)) return { status: 'HOLIDAY' as const, source: 'WEEKEND', desc: 'วันหยุดสุดสัปดาห์' };

        // 4. Default
        return { status: 'WORK_DAY' as const, source: 'DEFAULT', desc: 'วันทำงานปกติ' };
    };

    // Calculate Range
    const dateRange = useMemo(() => {
        const start = viewMode === 'WEEK' 
            ? startOfWeek(currentDate, { weekStartsOn: 1 }) 
            : startOfMonth(currentDate);
        const end = viewMode === 'WEEK' 
            ? endOfWeek(currentDate, { weekStartsOn: 1 }) 
            : endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate, viewMode]);

    // Fetch Data
    useEffect(() => {
        const startStr = format(dateRange[0], 'yyyy-MM-dd');
        const endStr = format(dateRange[dateRange.length - 1], 'yyyy-MM-dd');

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Logs
                const { data: logData, error: logError } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .gte('date', startStr)
                    .lte('date', endStr);

                if (logError) throw logError;
                setLogs(logData.map((l: any) => ({
                    id: l.id, userId: l.user_id, date: l.date,
                    checkInTime: l.check_in_time ? new Date(l.check_in_time) : null,
                    checkOutTime: l.check_out_time ? new Date(l.check_out_time) : null,
                    workType: l.work_type, status: l.status, note: l.note,
                    locationName: l.location_name, checkOutLocationName: l.check_out_location_name
                })));

                // 2. Fetch Leave Requests (to handle pending/approved without logs)
                const { data: leaveData, error: leaveError } = await supabase
                    .from('leave_requests')
                    .select('*')
                    .or(`and(start_date.lte.${endStr},end_date.gte.${startStr})`);
                
                if (leaveError) throw leaveError;
                setLeaveRequests(leaveData || []);

            } catch (err) {
                console.error("Fetch data failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Real-time Subscriptions
        const logsChannel = supabase.channel('admin-timesheet-logs')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance_logs',
                filter: `date=gte.${startStr}&date=lte.${endStr}`
            }, () => fetchData())
            .subscribe();

        const leavesChannel = supabase.channel('admin-timesheet-leaves')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'leave_requests'
            }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(logsChannel);
            supabase.removeChannel(leavesChannel);
        };
    }, [dateRange]);

    // Department Grouping Logic
    const departments = useMemo(() => {
        const set = new Set(users.map(u => u.position || 'General'));
        return Array.from(set).sort();
    }, [users]);

    const filteredAndGroupedUsers = useMemo(() => {
        const filtered = users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = filterDepartment === 'ALL' || u.position === filterDepartment;
            const matchesActive = showInactive || u.isActive;
            
            if (!matchesActive) return false;
            
            if (filterStatus === 'ALL') return matchesSearch && matchesDept;
            
            const userLogs = logs.filter(l => l.userId === u.id);
            if (filterStatus === 'LATE') {
                // Logic for late can be added here if needed
                return matchesSearch && matchesDept;
            }
            return matchesSearch && matchesDept;
        });

        // Grouping
        const groups: Record<string, User[]> = {};
        filtered.forEach(u => {
            const dept = u.position || 'General';
            if (!groups[dept]) groups[dept] = [];
            groups[dept].push(u);
        });
        return groups;
    }, [users, searchTerm, filterDepartment, filterStatus,showInactive, logs]);

    const nav = (offset: number) => {
        setCurrentDate(prev => viewMode === 'WEEK' ? addWeeks(prev, offset) : addMonths(prev, offset));
    };

    const handleExportCSV = () => {
        setShowExportSettings(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            
            <TimesheetHeader 
                viewMode={viewMode}
                setViewMode={setViewMode}
                dateRange={dateRange}
                onNav={nav}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterDepartment={filterDepartment}
                setFilterDepartment={setFilterDepartment}
                departments={departments}
                showInactive={showInactive}
                setShowInactive={setShowInactive}
                onExportCSV={handleExportCSV}
                isToolsExpanded={isToolsExpanded}
                setIsToolsExpanded={setIsToolsExpanded}
            />

            <TimesheetTable 
                isLoading={isLoading}
                dateRange={dateRange}
                filteredAndGroupedUsers={filteredAndGroupedUsers}
                logs={logs}
                leaveRequests={leaveRequests}
                getEffectiveDayStatus={getEffectiveDayStatus}
                workConfig={workConfig}
                onCellClick={(log, leaveReq) => {
                    setSelectedLog(log);
                    setSelectedLeaveRequest(leaveReq);
                }}
            />

            <AnimatePresence>
                {(selectedLog || selectedLeaveRequest) && (
                    <TimesheetDetailModal 
                        log={selectedLog}
                        leaveRequest={selectedLeaveRequest}
                        onClose={() => {
                            setSelectedLog(null);
                            setSelectedLeaveRequest(null);
                        }}
                    />
                )}
                <ExportSettingsModal 
                    isOpen={showExportSettings}
                    onClose={() => setShowExportSettings(false)}
                    dateRange={dateRange}
                    filteredAndGroupedUsers={filteredAndGroupedUsers}
                    logs={logs}
                    leaveRequests={leaveRequests}
                    getEffectiveDayStatus={getEffectiveDayStatus}
                    workConfig={workConfig}
                    viewMode={viewMode}
                    onExportSuccess={(filename) => setExportToast({ filename, id: Date.now().toString() })}
                />
                {exportToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="fixed top-6 right-6 z-[250] bg-white/95 backdrop-blur-md border border-emerald-100 shadow-2xl rounded-2xl p-4 pr-12 max-w-sm w-full flex items-center gap-3.5"
                    >
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">
                            <Check className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-slate-800">ดาวน์โหลดสำเร็จแล้ว! 📥</p>
                            <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5" title={exportToast.filename}>
                                {exportToast.filename}
                            </p>
                        </div>
                        <button
                            onClick={() => setExportToast(null)}
                            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminWeeklyTimesheet;

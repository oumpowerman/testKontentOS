import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Download, SlidersHorizontal, Settings2, History 
} from 'lucide-react';
import { User } from '../../../../types';
import { useUserSession } from '../../../../context/UserSessionContext';
import { useMasterData } from '../../../../hooks/useMasterData';
import { 
    generateAttendanceSummaryCSV, 
    generateRawClocksCSV, 
    generateLeavesCSV, 
    generateOvertimeCSV, 
    downloadCSVFile
} from '../../../../utils/attendanceExportUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, differenceInMinutes } from 'date-fns';
import { th } from 'date-fns/locale';

import { DateScopeSection } from './export/DateScopeSection';
import { DatasetSelectorSection } from './export/DatasetSelectorSection';
import { EmployeeSegmentationSection } from './export/EmployeeSegmentationSection';
import { ReportSettingsSection } from './export/ReportSettingsSection';
import { AuditLogsTab, ExportAuditLog } from './export/AuditLogsTab';

interface ExportControlCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    userStats: any[];
    getGrade: (stat: any) => { grade: string };
    currentMonth: Date;
    workingDaysInMonth: Date[];
}

export const ExportControlCenterModal: React.FC<ExportControlCenterModalProps> = ({
    isOpen,
    onClose,
    users,
    userStats,
    getGrade,
    currentMonth: parentCurrentMonth,
    workingDaysInMonth: parentWorkingDaysInMonth
}) => {
    const { leaveRequests, otRequests, attendanceLogs, currentUserProfile } = useUserSession();
    const { masterOptions, annualHolidays, calendarExceptions } = useMasterData();

    // Filter active users once to simplify all downstream operations
    const activeUsers = useMemo(() => {
        return users.filter(u => u.isActive);
    }, [users]);

    // 1. Date Scope States
    const [dateMode, setDateMode] = useState<'MONTH' | 'CUSTOM'>('MONTH');
    const [selectedMonth, setSelectedMonth] = useState<string>(format(parentCurrentMonth, 'yyyy-MM'));
    const [customStart, setCustomStart] = useState<string>(format(startOfMonth(parentCurrentMonth), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd] = useState<string>(format(endOfMonth(parentCurrentMonth), 'yyyy-MM-dd'));

    // 2. Selected Dataset Type
    const [datasetType, setDatasetType] = useState<'SUMMARY' | 'RAW_CLOCKS' | 'LEAVES' | 'OVERTIME'>('SUMMARY');

    // 3. Employee Segmentation Filters
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState<'ALL' | 'INTERN' | 'PROBATION' | 'FULL_TIME'>('ALL');
    const [positionFilter, setPositionFilter] = useState<string>('ALL');
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    // Sync selected user IDs once activeUsers is ready
    useEffect(() => {
        setSelectedUserIds(new Set(activeUsers.map(u => u.id)));
    }, [activeUsers]);

    // 4. Accounting formatting
    const [delimiter, setDelimiter] = useState<',' | ';'>(',');
    const [useBOM, setUseBOM] = useState<boolean>(true);
    const [startTime, setStartTime] = useState<string>('10:00');

    // Sync startTime with masterOptions WORK_CONFIG -> START_TIME if available
    useEffect(() => {
        if (masterOptions && masterOptions.length > 0) {
            const startOption = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME');
            if (startOption && startOption.label) {
                setStartTime(startOption.label);
            }
        }
    }, [masterOptions]);

    // 5. Audit Log States
    const [auditLogs, setAuditLogs] = useState<ExportAuditLog[]>([]);
    const [activeTab, setActiveTab] = useState<'EXPORT' | 'AUDIT'>('EXPORT');
    const [isScrolled, setIsScrolled] = useState<boolean>(false);

    // Reset states when modal is opened to ensure fresh default values
    useEffect(() => {
        if (isOpen) {
            setDateMode('MONTH');
            setSelectedMonth(format(parentCurrentMonth, 'yyyy-MM'));
            setCustomStart(format(startOfMonth(parentCurrentMonth), 'yyyy-MM-dd'));
            setCustomEnd(format(endOfMonth(parentCurrentMonth), 'yyyy-MM-dd'));
            setDatasetType('SUMMARY');
            setEmploymentTypeFilter('ALL');
            setPositionFilter('ALL');
            setUserSearchTerm('');
            setSelectedUserIds(new Set(activeUsers.map(u => u.id)));
            setActiveTab('EXPORT');
            setIsScrolled(false);
        }
    }, [isOpen]);

    const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 24);
    };

    // Load Audit Logs from LocalStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('juijui_export_audit_logs');
        if (stored) {
            try {
                setAuditLogs(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse audit logs', e);
            }
        }
    }, []);

    // Save Audit Logs
    const saveAuditLog = (typeLabel: string, scopeLabel: string, filtersLabel: string) => {
        const newLog: ExportAuditLog = {
            id: `audit-${Date.now()}`,
            timestamp: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
            datasetType: typeLabel,
            dateScope: scopeLabel,
            filters: filtersLabel,
            format: `CSV (${delimiter === ',' ? 'Comma' : 'Semicolon'}) | UTF-8 ${useBOM ? 'BOM' : 'Plain'}`,
            status: 'SUCCESS'
        };
        const updated = [newLog, ...auditLogs].slice(0, 50); // Keep last 50 logs
        setAuditLogs(updated);
        localStorage.setItem('juijui_export_audit_logs', JSON.stringify(updated));
    };

    // Derived unique positions for filtering
    const positions = useMemo(() => {
        const set = new Set(activeUsers.filter(u => u.position).map(u => u.position));
        return Array.from(set).sort();
    }, [activeUsers]);

    // Handle Month Selection conversion to Date objects
    const dateRange = useMemo(() => {
        if (dateMode === 'MONTH') {
            const [year, month] = selectedMonth.split('-').map(Number);
            const start = new Date(year, month - 1, 1);
            const end = endOfMonth(start);
            return { start, end };
        } else {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            return { start, end };
        }
    }, [dateMode, selectedMonth, customStart, customEnd]);

    // Calculate dynamic stats if user selects custom range (to make sure Dataset A is accurate for arbitrary dates!)
    const dynamicUserStats = useMemo(() => {
        if (dateMode === 'MONTH' && selectedMonth === format(parentCurrentMonth, 'yyyy-MM')) {
            // Re-use parent stats to avoid duplicate work if month is current
            return userStats;
        }

        // Otherwise recalculate local stats for the selected date range
        const statsMap: Record<string, any> = {};
        activeUsers.forEach(u => {
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

        // 1. Filter Logs in range
        const startStr = format(dateRange.start, 'yyyy-MM-dd');
        const endStr = format(dateRange.end, 'yyyy-MM-dd');
        const rangeLogs = attendanceLogs.filter(l => l.date >= startStr && l.date <= endStr);

        rangeLogs.forEach(log => {
            if (statsMap[log.userId]) {
                const stat = statsMap[log.userId];
                stat.logs.push(log);

                if (log.status === 'LEAVE' || log.workType === 'LEAVE') {
                    stat.leaves++;
                } else {
                    stat.present++;
                    
                    // Simple working hour math (using state value / 0 buffer for recalculation if not specified)
                    const buffer = 0;
                    
                    // check in time parsing
                    if (log.checkInTime) {
                        const checkInDate = new Date(log.checkInTime);
                        const [targetH, targetM] = startTime.split(':').map(Number);
                        const targetDate = new Date(checkInDate);
                        targetDate.setHours(targetH, targetM + buffer, 0, 0);

                        if (checkInDate > targetDate) {
                            stat.late++;
                            const diffMins = differenceInMinutes(checkInDate, targetDate);
                            stat.totalLateMinutes = (stat.totalLateMinutes || 0) + diffMins;
                        }

                        if (log.checkOutTime) {
                            const checkOutDate = new Date(log.checkOutTime);
                            const workMs = checkOutDate.getTime() - checkInDate.getTime();
                            const hrs = Math.max(0, parseFloat((workMs / (1000 * 60 * 60)).toFixed(2)));
                            stat.totalHours += hrs;
                        }
                    }
                }
            }
        });

        // 2. Count Absents on workdays in range
        const rangeDays = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        const workingDaysInRange = rangeDays.filter(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const exception = (calendarExceptions || []).find(e => e.date === dateStr);
            if (exception) return exception.type === 'WORK_DAY';
            const holiday = (annualHolidays || []).find(h => h.day === day.getDate() && h.month === day.getMonth() + 1 && h.isActive);
            if (holiday) return false;
            return !isWeekend(day);
        });

        const today = new Date();
        Object.values(statsMap).forEach(stat => {
            workingDaysInRange.forEach(day => {
                const isFutureDay = day > today;
                if (isFutureDay) return;

                const dateStr = format(day, 'yyyy-MM-dd');
                const hasLog = stat.logs.some((l: any) => l.date === dateStr);
                const isLeave = stat.logs.some((l: any) => l.date === dateStr && (l.status === 'LEAVE' || l.workType === 'LEAVE'));
                
                if (!hasLog && !isLeave) {
                    stat.absent++;
                }
            });
        });

        return Object.values(statsMap);
    }, [dateMode, dateRange, selectedMonth, parentCurrentMonth, userStats, activeUsers, attendanceLogs, annualHolidays, calendarExceptions, startTime]);

    // Segmented and searched employee list
    const filteredEmployees = useMemo(() => {
        return activeUsers.filter(user => {
            const matchesType = employmentTypeFilter === 'ALL' || user.employmentType === employmentTypeFilter;
            const matchesPosition = positionFilter === 'ALL' || user.position === positionFilter;
            const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                                 (user.id || '').toLowerCase().includes(userSearchTerm.toLowerCase());
            return matchesType && matchesPosition && matchesSearch;
        });
    }, [activeUsers, employmentTypeFilter, positionFilter, userSearchTerm]);

    // Auto-update chosen employees Set when filtered lists change (if users click select all)
    const handleSelectAllFiltered = () => {
        const nextSet = new Set(selectedUserIds);
        filteredEmployees.forEach(u => nextSet.add(u.id));
        setSelectedUserIds(nextSet);
    };

    const handleDeselectAllFiltered = () => {
        const nextSet = new Set(selectedUserIds);
        filteredEmployees.forEach(u => nextSet.delete(u.id));
        setSelectedUserIds(nextSet);
    };

    const toggleUserSelected = (id: string) => {
        setSelectedUserIds(prev => {
            const nextSet = new Set(prev);
            if (nextSet.has(id)) {
                nextSet.delete(id);
            } else {
                nextSet.add(id);
            }
            return nextSet;
        });
    };

    const toggleUsersSelected = (ids: string[], select: boolean) => {
        setSelectedUserIds(prev => {
            const nextSet = new Set(prev);
            ids.forEach(id => {
                if (select) {
                    nextSet.add(id);
                } else {
                    nextSet.delete(id);
                }
            });
            return nextSet;
        });
    };

    // Execute Export Action
    const handleExportSubmit = () => {
        const exportingUsers = activeUsers.filter(u => selectedUserIds.has(u.id));
        if (exportingUsers.length === 0) {
            alert('กรุณาเลือกพนักงานอย่างน้อย 1 ท่านเพื่อทำการส่งออกข้อมูล');
            return;
        }

        let csvString = '';
        let fileName = '';
        let typeLabel = '';

        const formattedRangeStr = dateMode === 'MONTH' 
            ? selectedMonth 
            : `${customStart}_to_${customEnd}`;

        if (datasetType === 'SUMMARY') {
            typeLabel = 'สรุปภาพรวมทำงาน (Attendance Summary)';
            csvString = generateAttendanceSummaryCSV(exportingUsers, dynamicUserStats, getGrade, delimiter);
            fileName = `Attendance_Summary_${formattedRangeStr}.csv`;
        } else if (datasetType === 'RAW_CLOCKS') {
            typeLabel = 'บันทึกเวลาสแกนเข้าออกรายวัน (Raw Clocks Audit)';
            csvString = generateRawClocksCSV(exportingUsers, attendanceLogs, dateRange.start, dateRange.end, delimiter);
            fileName = `Raw_Clocks_Audit_${formattedRangeStr}.csv`;
        } else if (datasetType === 'LEAVES') {
            typeLabel = 'ประวัติยื่นใบลา (Leaves & Absences)';
            csvString = generateLeavesCSV(exportingUsers, leaveRequests, dateRange.start, dateRange.end, delimiter);
            fileName = `Leaves_Absence_Report_${formattedRangeStr}.csv`;
        } else if (datasetType === 'OVERTIME') {
            typeLabel = 'รายงานการอนุมัติ OT และเงินชดเชย (OT & Payroll)';
            csvString = generateOvertimeCSV(exportingUsers, otRequests, attendanceLogs, dateRange.start, dateRange.end, annualHolidays || [], calendarExceptions || [], delimiter);
            fileName = `OT_Payroll_Report_${formattedRangeStr}.csv`;
        }

        // Trigger file download with BOM option
        downloadCSVFile(csvString, fileName, useBOM);

        // Record Audit Logs
        const scopeLabel = dateMode === 'MONTH' 
            ? `รายเดือน: ${format(dateRange.start, 'MMMM yyyy', { locale: th })}` 
            : `ช่วงเวลาพิเศษ: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}`;

        const filtersLabel = `พนักงาน ${exportingUsers.length} คน (การจ้าง: ${employmentTypeFilter}, ตำแหน่ง: ${positionFilter})`;
        
        saveAuditLog(typeLabel, scopeLabel, filtersLabel);

        // Feedback notification
        const successToast = document.createElement('div');
        successToast.className = 'fixed bottom-5 right-5 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[9999] flex items-center gap-3 animate-bounce border border-slate-800';
        successToast.innerHTML = `
            <div class="p-1 bg-emerald-500 rounded-full text-white"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>
            <div class="text-left">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Export Completed</p>
                <p class="text-xs font-bold text-slate-100">${fileName}</p>
            </div>
        `;
        document.body.appendChild(successToast);
        setTimeout(() => successToast.remove(), 4000);
    };

    // Clear all audit logs
    const handleClearAuditLogs = () => {
        if (confirm('คุณต้องการลบประวัติการส่งออก (Audit Logs) ทั้งหมดหรือไม่?')) {
            setAuditLogs([]);
            localStorage.removeItem('juijui_export_audit_logs');
        }
    };

    if (typeof window === 'undefined' || !document.body) {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
                {/* Overlay backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                />

                {/* Main Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-4xl h-[100dvh] sm:h-[900px] sm:max-h-[85vh] bg-white rounded-none sm:rounded-[2.5rem] border-0 sm:border border-slate-100 shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
                >
                    {/* Header */}
                    <div className={`border-b border-slate-100 flex items-center justify-between bg-slate-50/50 transition-all duration-300 relative z-10 ${
                        isScrolled 
                            ? 'py-3 px-6 md:py-4 md:px-8 shadow-md shadow-slate-100/60' 
                            : 'p-6 md:p-8'
                    }`}>
                        <div className="flex items-center gap-3 sm:gap-4 text-left">
                            <div className={`bg-indigo-500 text-white shadow-md shadow-indigo-100 transition-all duration-300 flex items-center justify-center ${
                                isScrolled ? 'p-1.5 rounded-xl' : 'p-3 rounded-2xl'
                            }`}>
                                <Settings2 className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-6 h-6'}`} />
                            </div>
                            <div>
                                <span className={`font-bold uppercase tracking-[0.25em] text-indigo-500 block transition-all duration-300 origin-left ${
                                    isScrolled 
                                        ? 'opacity-0 max-h-0 overflow-hidden pointer-events-none scale-y-0 mt-0' 
                                        : 'opacity-100 max-h-10 text-[9px] sm:text-[10px] scale-y-100 mb-0.5 mt-0.5'
                                }`}>
                                    ระบบวิเคราะห์ข้อมูลพนักงานระดับองค์กร (Enterprise Data Center)
                                </span>
                                <h3 className={`font-bold text-slate-800 tracking-tight transition-all duration-300 ${
                                    isScrolled 
                                        ? 'text-base sm:text-lg' 
                                        : 'text-xl sm:text-2xl mt-0.5'
                                }`}>
                                    ศูนย์ส่งออกข้อมูลและจัดทำรายงานขั้นสูง
                                </h3>
                            </div>
                        </div>

                        {/* Top Right Action Close */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className={`bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-all ${
                                    isScrolled ? 'p-1.5' : 'p-2.5'
                                }`}
                            >
                                <X className={`text-slate-500 transition-all ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Sub navigation for export vs audit logs */}
                    <div className={`flex border-b border-slate-100 bg-white transition-all duration-300 px-6 sm:px-8 ${
                        isScrolled ? 'py-0 shadow-sm shadow-slate-100/40 relative z-10' : ''
                    }`}>
                        <button
                            onClick={() => setActiveTab('EXPORT')}
                            className={`font-bold text-[10px] sm:text-xs uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${
                                activeTab === 'EXPORT'
                                    ? 'border-indigo-500 text-indigo-600 font-bold'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            } ${isScrolled ? 'py-2 px-3 sm:px-4' : 'py-4 px-6'}`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> สั่งพิมพ์รายงาน (Export Settings)
                        </button>
                        <button
                            onClick={() => setActiveTab('AUDIT')}
                            className={`font-bold text-[10px] sm:text-xs uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${
                                activeTab === 'AUDIT'
                                    ? 'border-indigo-500 text-indigo-600 font-bold'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            } ${isScrolled ? 'py-2 px-3 sm:px-4' : 'py-4 px-6'}`}
                        >
                            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> ประวัติดาวน์โหลดรายงาน ({auditLogs.length})
                        </button>
                    </div>

                    {/* Body container scrollable */}
                    <div 
                        onScroll={handleBodyScroll}
                        className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50/20"
                    >
                        {activeTab === 'EXPORT' ? (
                            <>
                                {/* 1. Date range configuration */}
                                <DateScopeSection
                                    dateMode={dateMode}
                                    setDateMode={setDateMode}
                                    selectedMonth={selectedMonth}
                                    setSelectedMonth={setSelectedMonth}
                                    customStart={customStart}
                                    setCustomStart={setCustomStart}
                                    customEnd={customEnd}
                                    setCustomEnd={setCustomEnd}
                                />

                                {/* 2. Choose Dataset Cards */}
                                <DatasetSelectorSection
                                    datasetType={datasetType}
                                    setDatasetType={setDatasetType}
                                />

                                {/* 3. Employee Segmentation Filters */}
                                <EmployeeSegmentationSection
                                    users={activeUsers}
                                    filteredEmployees={filteredEmployees}
                                    selectedUserIds={selectedUserIds}
                                    employmentTypeFilter={employmentTypeFilter}
                                    setEmploymentTypeFilter={setEmploymentTypeFilter}
                                    positionFilter={positionFilter}
                                    setPositionFilter={setPositionFilter}
                                    positions={positions}
                                    userSearchTerm={userSearchTerm}
                                    setUserSearchTerm={setUserSearchTerm}
                                    onSelectAllFiltered={handleSelectAllFiltered}
                                    onDeselectAllFiltered={handleDeselectAllFiltered}
                                    onToggleUserSelected={toggleUserSelected}
                                    onToggleUsersSelected={toggleUsersSelected}
                                />

                                {/* 4. Formatting settings */}
                                <ReportSettingsSection
                                    delimiter={delimiter}
                                    setDelimiter={setDelimiter}
                                    useBOM={useBOM}
                                    setUseBOM={setUseBOM}
                                />
                            </>
                        ) : (
                            /* Audit Logs tab */
                            <AuditLogsTab
                                auditLogs={auditLogs}
                                onClearLogs={handleClearAuditLogs}
                            />
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className={`border-t border-slate-100 flex items-center justify-between bg-slate-50/50 transition-all duration-300 relative z-10 ${
                        isScrolled 
                            ? 'py-3 px-6 md:px-8 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]' 
                            : 'p-6 md:p-8'
                    }`}>
                        <div className="text-left text-[11px] text-slate-400 font-medium hidden sm:block">
                            *ข้อมูลจะถูกส่งออกแบบ Raw CSV เข้ารหัส UTF-8 พร้อมนำไปคำนวณภาษีและเงินเดือนต่อได้ทันที
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all ${
                                    isScrolled ? 'px-4 py-2' : 'px-5 py-3'
                                }`}
                            >
                                ยกเลิก (Cancel)
                            </button>
                            {activeTab === 'EXPORT' && (
                                <button
                                    type="button"
                                    onClick={handleExportSubmit}
                                    className={`flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 ${
                                        isScrolled ? 'px-5 py-2' : 'px-6 py-3'
                                    }`}
                                >
                                    <Download className="w-4 h-4" /> สั่งพิมพ์บันทึกดาวน์โหลด (Generate CSV)
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

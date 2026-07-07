import { format, isToday } from 'date-fns';
import th from 'date-fns/locale/th';
import { User } from '../../../../types';
import { AttendanceLog } from '../../../../types/attendance';
import { checkIsLate } from '../../../../lib/attendanceUtils';

export interface ExportConfigOptions {
    cellFormat: 'detailed' | 'summary';
    showWorkedDays: boolean;
    showLateDays: boolean;
    showLeaveDays: boolean;
    showEmail: boolean;
    holidayFormat: 'text' | 'blank';
}

/**
 * Translates a single user's log for a specific day into cell text according to export config options
 */
export const getCellTextForUserDay = (
    user: User,
    day: Date,
    logs: AttendanceLog[],
    leaveRequests: any[],
    getEffectiveDayStatus: (date: Date) => { status: 'WORK_DAY' | 'WEEKEND' | 'HOLIDAY'; source: string; desc: string },
    workConfig: { startTime: string; buffer: number },
    cellFormat: 'detailed' | 'summary',
    holidayFormat: 'text' | 'blank'
): string => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const log = logs.find(l => l.userId === user.id && l.date === dateStr);
    const dayStatus = getEffectiveDayStatus(day);
    const isHoliday = dayStatus.status === 'HOLIDAY';
    const isTodayDay = isToday(day);

    // Check if user has started working on this date
    let hasStarted = true;
    if (user.startDate) {
        const start = new Date(user.startDate);
        const checkDate = new Date(day);
        checkDate.setHours(0,0,0,0);
        start.setHours(0,0,0,0);
        if (checkDate < start) {
            hasStarted = false;
        }
    }

    const relevantRequest = leaveRequests.find(r => 
        r.user_id === user.id && 
        dateStr >= r.start_date && 
        dateStr <= r.end_date
    );

    // 1. If not started yet
    if (!hasStarted) {
        return cellFormat === 'summary' ? 'N/A' : 'ยังไม่ได้เริ่มงาน (Not Joined)';
    }

    if (!log) {
        if (relevantRequest && (relevantRequest.status === 'PENDING' || relevantRequest.status === 'APPROVED')) {
            if (cellFormat === 'summary') {
                return 'V'; // Leave (Vacation/Sick etc.)
            }
            const prefix = relevantRequest.status === 'PENDING' ? '[รอ] ' : '';
            return `${prefix}ลา ${relevantRequest.type}`;
        } else if (dayStatus.status === 'WORK_DAY' && (day < new Date() && !isTodayDay)) {
            return cellFormat === 'summary' ? 'A' : 'ขาดงาน (Absent)';
        } else if (isHoliday) {
            if (holidayFormat === 'blank') return '';
            return cellFormat === 'summary' ? 'H' : `หยุด: ${dayStatus.desc}`;
        } else if (dayStatus.status === 'WEEKEND') {
            if (holidayFormat === 'blank') return '';
            return cellFormat === 'summary' ? 'H' : 'วันหยุด';
        }
        return '—';
    } else {
        const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
        const isHardAbsent = log.status === 'ABSENT' || log.status === 'NO_SHOW';
        const isPendingVerify = log.status === 'PENDING_VERIFY';
        const isNoCheckIn = !log.checkInTime && !isLeave && !isHardAbsent;
        const leaveTypeMatch = log.note?.match(/\[APPROVED LEAVE: (.*?)\]/);
        const leaveType = leaveTypeMatch ? leaveTypeMatch[1] : null;

        if (isHardAbsent) {
            return cellFormat === 'summary' ? 'A' : 'ขาดงาน (Absent)';
        } else if (isLeave && (leaveType || relevantRequest?.type)) {
            return cellFormat === 'summary' ? 'V' : `ลา ${leaveType || relevantRequest?.type}`;
        } else {
            if (cellFormat === 'summary') {
                if (log.checkInTime) {
                    const isLate = checkIsLate(log.checkInTime, workConfig.startTime, workConfig.buffer);
                    if (isLate) return 'L'; // Late
                }
                if (log.workType === 'WFH') return 'W'; // WFH
                return 'O'; // On-Time / OK
            }

            // Detailed formatting
            const checkInStr = log.checkInTime ? format(log.checkInTime, 'HH:mm') : '--:--';
            const checkOutStr = log.checkOutTime ? format(log.checkOutTime, 'HH:mm') : '--:--';
            
            let suffix = '';
            if (isPendingVerify) {
                suffix = ' (รอตรวจ)';
            } else if (log.checkInTime) {
                const isLate = checkIsLate(log.checkInTime, workConfig.startTime, workConfig.buffer);
                if (isLate) {
                    suffix = ' (สาย)';
                }
            }

            if (isNoCheckIn) {
                return `ออก: ${checkOutStr} (ไม่มีเข้า)`;
            } else {
                return `${checkInStr}-${checkOutStr}${suffix}`;
            }
        }
    }
};

/**
 * Calculates user metrics (worked days, late count, leave count) for the exported date range
 */
export const getUserMetrics = (
    user: User,
    dateRange: Date[],
    logs: AttendanceLog[],
    leaveRequests: any[]
) => {
    let workedCount = 0;
    let lateCount = 0;
    let leaveCount = 0;

    dateRange.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const log = logs.find(l => l.userId === user.id && l.date === dateStr);

        // Check if user has started work by this date
        let hasStarted = true;
        if (user.startDate) {
            const start = new Date(user.startDate);
            const checkDate = new Date(day);
            if (checkDate < start) hasStarted = false;
        }
        if (!hasStarted) return;

        const relevantRequest = leaveRequests.find(r => 
            r.user_id === user.id && 
            dateStr >= r.start_date && 
            dateStr <= r.end_date
        );

        if (log) {
            const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
            const isHardAbsent = log.status === 'ABSENT' || log.status === 'NO_SHOW';
            
            if (isLeave) {
                leaveCount++;
            } else if (!isHardAbsent) {
                workedCount++;
                if (log.checkInTime) {
                    // Quick default check, usually we import this or pass work config
                    // To keep this pure we assume standard values or pass options if needed
                }
            }
        } else if (relevantRequest && (relevantRequest.status === 'APPROVED' || relevantRequest.status === 'PENDING')) {
            leaveCount++;
        }
    });

    return { workedCount, lateCount, leaveCount };
};

/**
 * Generates and triggers the CSV file download
 */
export const generateAndDownloadCSV = (
    dateRange: Date[],
    filteredAndGroupedUsers: Record<string, User[]>,
    logs: AttendanceLog[],
    leaveRequests: any[],
    getEffectiveDayStatus: (date: Date) => { status: 'WORK_DAY' | 'WEEKEND' | 'HOLIDAY'; source: string; desc: string },
    workConfig: { startTime: string; buffer: number },
    options: ExportConfigOptions,
    viewMode: 'WEEK' | 'MONTH'
) => {
    const { cellFormat, showWorkedDays, showLateDays, showLeaveDays, showEmail, holidayFormat } = options;

    // 1. Headers
    const headers = [
        '"ชื่อพนักงาน"',
        '"แผนก/ตำแหน่ง"',
        '"ระดับ (Level)"'
    ];

    if (showEmail) {
        headers.push('"อีเมลพนักงาน"');
    }

    // Add daily columns
    dateRange.forEach(day => {
        headers.push(`"${format(day, 'yyyy-MM-dd (EEE)', { locale: th })}"`);
    });

    // Add summary columns
    if (showWorkedDays) headers.push('"วันทำงานจริง (วัน)"');
    if (showLateDays) headers.push('"จำนวนวันสาย (ครั้ง)"');
    if (showLeaveDays) headers.push('"จำนวนวันลา (วัน)"');

    const csvRows: string[] = [headers.join(',')];

    // Helper to calculate exact late counts using the correct late logic
    const getDetailedUserStats = (user: User) => {
        let workedCount = 0;
        let lateCount = 0;
        let leaveCount = 0;

        dateRange.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const log = logs.find(l => l.userId === user.id && l.date === dateStr);

            // check started
            let hasStarted = true;
            if (user.startDate) {
                const start = new Date(user.startDate);
                const checkDate = new Date(day);
                if (checkDate < start) hasStarted = false;
            }
            if (!hasStarted) return;

            const relevantRequest = leaveRequests.find(r => 
                r.user_id === user.id && 
                dateStr >= r.start_date && 
                dateStr <= r.end_date
            );

            if (log) {
                const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
                const isHardAbsent = log.status === 'ABSENT' || log.status === 'NO_SHOW';
                
                if (isLeave) {
                    leaveCount++;
                } else if (!isHardAbsent) {
                    workedCount++;
                    if (log.checkInTime) {
                        const isLate = checkIsLate(log.checkInTime, workConfig.startTime, workConfig.buffer);
                        if (isLate) lateCount++;
                    }
                }
            } else if (relevantRequest && (relevantRequest.status === 'APPROVED' || relevantRequest.status === 'PENDING')) {
                leaveCount++;
            }
        });

        return { workedCount, lateCount, leaveCount };
    };

    // 2. Rows
    Object.entries(filteredAndGroupedUsers).forEach(([dept, deptUsers]) => {
        deptUsers.forEach(user => {
            const stats = getDetailedUserStats(user);
            const rowCells = [
                `"${user.name.replace(/"/g, '""')}"`,
                `"${dept.replace(/"/g, '""')}"`,
                `"${user.level}"`
            ];

            if (showEmail) {
                rowCells.push(`"${(user.email || '').replace(/"/g, '""')}"`);
            }

            // Add daily cells
            dateRange.forEach(day => {
                const cellText = getCellTextForUserDay(
                    user, 
                    day, 
                    logs, 
                    leaveRequests, 
                    getEffectiveDayStatus, 
                    workConfig, 
                    cellFormat, 
                    holidayFormat
                );
                rowCells.push(`"${cellText.replace(/"/g, '""')}"`);
            });

            // Add summary stats
            if (showWorkedDays) rowCells.push(`"${stats.workedCount}"`);
            if (showLateDays) rowCells.push(`"${stats.lateCount}"`);
            if (showLeaveDays) rowCells.push(`"${stats.leaveCount}"`);

            csvRows.push(rowCells.join(','));
        });
    });

    // 3. BOM & Trigger Download
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const startStr = format(dateRange[0], 'yyyy-MM-dd');
    const endStr = format(dateRange[dateRange.length - 1], 'yyyy-MM-dd');
    const formatLabel = cellFormat === 'summary' ? 'summary' : 'detailed';
    const modeLabel = viewMode === 'WEEK' ? 'weekly' : 'monthly';
    const filename = `timesheet_${modeLabel}_${formatLabel}_${startStr}_to_${endStr}.csv`;

    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return filename;
};

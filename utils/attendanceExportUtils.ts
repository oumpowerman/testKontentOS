import { format, differenceInMinutes, isWeekend } from 'date-fns';
import { User } from '../types';
import { AttendanceLog, LeaveRequest, OtRequest } from '../types/attendance';

// Helper to escape CSV cells safely according to RFC 4180
const escapeCSVCell = (val: any, delimiter: string = ','): string => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (str.includes('"')) {
        str = str.replace(/"/g, '""');
    }
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
    }
    return str;
};

// Map technical leave types to user-friendly Thai names
const getLeaveTypeThai = (type: string): string => {
    const mapping: Record<string, string> = {
        'SICK': 'ลาป่วย (Sick Leave)',
        'VACATION': 'ลาพักร้อน (Vacation Leave)',
        'PERSONAL': 'ลากิจ (Personal Leave)',
        'EMERGENCY': 'ลาฉุกเฉิน (Emergency Leave)',
        'LATE_ENTRY': 'ขอเข้าสาย (Late Entry)',
        'OVERTIME': 'ทำงานล่วงเวลา (Overtime)',
        'FORGOT_CHECKIN': 'ลืมสแกนเข้า (Forgot Check-in)',
        'FORGOT_CHECKOUT': 'ลืมสแกนออก (Forgot Check-out)',
        'FORGOT_BOTH': 'ลืมสแกนทั้งเข้าและออก (Forgot Both)',
        'WFH': 'ทำงานที่บ้าน (WFH)',
        'UNPAID': 'ลาไม่รับค่าจ้าง (Unpaid Leave)'
    };
    return mapping[type] || type;
};

// Get Thai text for Employment Type
export const getEmploymentTypeThai = (type?: string): string => {
    if (!type) return 'ไม่ระบุ';
    const mapping: Record<string, string> = {
        'INTERN': 'นักศึกษาฝึกงาน',
        'PROBATION': 'ทดลองงาน',
        'FULL_TIME': 'พนักงานประจำ'
    };
    return mapping[type] || type;
};

// Trigger download in browser
export const downloadCSVFile = (csvContent: string, fileName: string, useBOM: boolean) => {
    // Add UTF-8 Byte Order Mark (BOM) to prevent Thai characters corruption in Excel
    const content = useBOM ? `\uFEFF${csvContent}` : csvContent;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// --- Dataset A: Attendance Summary ---
export const generateAttendanceSummaryCSV = (
    filteredUsers: User[],
    userStats: any[],
    getGrade: (stat: any) => { grade: string },
    delimiter: string = ','
): string => {
    const headers = [
        "รหัสพนักงาน (Employee ID)",
        "ชื่อพนักงาน (Employee Name)",
        "ตำแหน่ง (Position)",
        "ประเภทการจ้าง (Employment Type)",
        "วันทำงานจริง (Days Present)",
        "จำนวนครั้งที่สาย (Late Count)",
        "เวลาสายสะสม (Late Duration - mins)",
        "วันลาสะสม (Leave Days)",
        "ขาดงานสะสม (Absent Days)",
        "ชั่วโมงทำงานรวม (Total Hours)",
        "เวลาสแกนเข้าเฉลี่ย (Avg Check-in)",
        "เกรดประเมินพฤติกรรม (Behavior Grade)"
    ];

    const rows = filteredUsers.map(user => {
        const stat = userStats.find(s => s.userId === user.id) || {
            present: 0,
            late: 0,
            totalLateMinutes: 0,
            leaves: 0,
            absent: 0,
            totalHours: 0,
            avgCheckIn: '-'
        };
        const gradeInfo = getGrade(stat);

        return [
            escapeCSVCell(user.id, delimiter),
            escapeCSVCell(user.name, delimiter),
            escapeCSVCell(user.position || '-', delimiter),
            escapeCSVCell(getEmploymentTypeThai(user.employmentType), delimiter),
            stat.present,
            stat.late,
            stat.totalLateMinutes || 0,
            stat.leaves,
            stat.absent,
            parseFloat((stat.totalHours || 0).toFixed(2)),
            escapeCSVCell(stat.avgCheckIn || '-', delimiter),
            escapeCSVCell(gradeInfo.grade || 'N/A', delimiter)
        ].join(delimiter);
    });

    return [headers.join(delimiter), ...rows].join("\n");
};

// --- Dataset B: Raw Clocks Audit Trail ---
export const generateRawClocksCSV = (
    filteredUsers: User[],
    allLogs: AttendanceLog[],
    startDate: Date,
    endDate: Date,
    delimiter: string = ','
): string => {
    const headers = [
        "วันที่ (Date)",
        "รหัสพนักงาน (Employee ID)",
        "ชื่อพนักงาน (Employee Name)",
        "ตำแหน่ง (Position)",
        "เวลาสแกนเข้า (Check-In)",
        "เวลาสแกนออก (Check-Out)",
        "ประเภทการทำงาน (Workplace)",
        "สถานะประเมิน (Status)",
        "หมายเหตุการทำงาน (Note)"
    ];

    // Filter logs within range and for filtered users
    const filteredUserIds = new Set(filteredUsers.map(u => u.id));
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    const relevantLogs = allLogs.filter(log => {
        return filteredUserIds.has(log.userId) && log.date >= startStr && log.date <= endStr;
    }).sort((a, b) => b.date.localeCompare(a.date)); // descending date

    const rows = relevantLogs.map(log => {
        const user = filteredUsers.find(u => u.id === log.userId);
        const checkInStr = log.checkInTime ? format(new Date(log.checkInTime), 'HH:mm:ss') : '-';
        const checkOutStr = log.checkOutTime ? format(new Date(log.checkOutTime), 'HH:mm:ss') : '-';
        
        let statusText = 'ปกติ';
        if (log.status === 'LATE') statusText = 'สาย';
        else if (log.status === 'ABSENT') statusText = 'ขาดงาน';
        else if (log.status === 'LEAVE') statusText = 'ลา';
        else if (log.status === 'EARLY_LEAVE') statusText = 'กลับก่อนเวลา';

        let workplaceText = 'On-site (ออฟฟิศ)';
        if (log.workType === 'WFH') workplaceText = 'WFH (ที่บ้าน)';
        else if (log.workType === 'SITE') workplaceText = 'On-site (หน้างาน)';
        else if (log.workType === 'LEAVE') workplaceText = 'ลาหยุด';

        return [
            escapeCSVCell(log.date, delimiter),
            escapeCSVCell(user?.id || '', delimiter),
            escapeCSVCell(user?.name || 'Unknown', delimiter),
            escapeCSVCell(user?.position || '-', delimiter),
            escapeCSVCell(checkInStr, delimiter),
            escapeCSVCell(checkOutStr, delimiter),
            escapeCSVCell(workplaceText, delimiter),
            escapeCSVCell(statusText, delimiter),
            escapeCSVCell(log.note || '', delimiter)
        ].join(delimiter);
    });

    return [headers.join(delimiter), ...rows].join("\n");
};

// --- Dataset C: Leaves & Absence Breakdown ---
export const generateLeavesCSV = (
    filteredUsers: User[],
    allLeaves: LeaveRequest[],
    startDate: Date,
    endDate: Date,
    delimiter: string = ','
): string => {
    const headers = [
        "รหัสพนักงาน (Employee ID)",
        "ชื่อพนักงาน (Employee Name)",
        "ตำแหน่ง (Position)",
        "ประเภทการลา (Leave Type)",
        "วันที่เริ่มต้น (Start Date)",
        "วันที่สิ้นสุด (End Date)",
        "จำนวนชั่วโมง/วันลารวม (Duration)",
        "สถานะการพิจารณา (Status)",
        "เหตุผลประกอบการลา (Reason)"
    ];

    const filteredUserIds = new Set(filteredUsers.map(u => u.id));

    // Filter leaves within overlap range
    const relevantLeaves = allLeaves.filter(req => {
        if (!filteredUserIds.has(req.userId)) return false;
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate || req.startDate);
        
        // Check if overlaps with [startDate, endDate]
        return reqStart <= endDate && reqEnd >= startDate;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const rows = relevantLeaves.map(req => {
        const user = filteredUsers.find(u => u.id === req.userId);
        const startStr = format(new Date(req.startDate), 'yyyy-MM-dd HH:mm');
        const endStr = req.endDate ? format(new Date(req.endDate), 'yyyy-MM-dd HH:mm') : startStr;
        
        // Calculate days or hours duration
        const diffMs = new Date(req.endDate || req.startDate).getTime() - new Date(req.startDate).getTime();
        const hoursTotal = diffMs / (1000 * 60 * 60);
        const durationStr = hoursTotal > 8 
            ? `${(hoursTotal / 24).toFixed(1)} วัน` 
            : `${hoursTotal.toFixed(1)} ชั่วโมง`;

        let statusText = 'รออนุมัติ';
        if (req.status === 'APPROVED') statusText = 'อนุมัติแล้ว';
        else if (req.status === 'REJECTED') statusText = 'ปฏิเสธ';

        return [
            escapeCSVCell(user?.id || '', delimiter),
            escapeCSVCell(user?.name || 'Unknown', delimiter),
            escapeCSVCell(user?.position || '-', delimiter),
            escapeCSVCell(getLeaveTypeThai(req.type), delimiter),
            escapeCSVCell(startStr, delimiter),
            escapeCSVCell(endStr, delimiter),
            escapeCSVCell(durationStr, delimiter),
            escapeCSVCell(statusText, delimiter),
            escapeCSVCell(req.reason || '-', delimiter)
        ].join(delimiter);
    });

    return [headers.join(delimiter), ...rows].join("\n");
};

// --- Dataset D: OT & Payroll Ingestion ---
export const generateOvertimeCSV = (
    filteredUsers: User[],
    allOts: OtRequest[],
    allLogs: AttendanceLog[],
    startDate: Date,
    endDate: Date,
    annualHolidays: any[],
    calendarExceptions: any[],
    delimiter: string = ','
): string => {
    const headers = [
        "รหัสพนักงาน (Employee ID)",
        "ชื่อพนักงาน (Employee Name)",
        "ฐานเงินเดือน (Base Salary)",
        "วันที่ทำ OT (OT Date)",
        "ช่วงเวลาที่ขออนุมัติ (Requested Slot)",
        "เวลาสแกนเข้าออฟฟิศจริง (Actual In)",
        "เวลาสแกนเช็คเอาท์จริง (Actual Out)",
        "ชั่วโมงขออนุมัติจริง (Approved Hours)",
        "วันปกติ 1.5 เท่า (Normal Day OT - Hrs)",
        "วันหยุดเสาร์-อาทิตย์ 2.0 เท่า (Holiday OT - Hrs)",
        "วันหยุดนักขัตฤกษ์ 3.0 เท่า (Special Holiday OT - Hrs)",
        "เงินโอทีพึงจ่ายโดยประมาณ (Estimated Payout - Baht)",
        "สถานะสแกนบัตรจริงเทียบคำขอ (Verification Status)"
    ];

    const filteredUserIds = new Set(filteredUsers.map(u => u.id));
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    // Filter approved OT requests
    const relevantOts = allOts.filter(req => {
        return filteredUserIds.has(req.userId) && 
               req.status === 'APPROVED' && 
               req.date >= startStr && 
               req.date <= endStr;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const rows = relevantOts.map(req => {
        const user = filteredUsers.find(u => u.id === req.userId);
        const userSalary = user?.baseSalary || 0;
        const formattedDate = req.date;

        // Find checkout log of that day
        const dayLog = allLogs.find(l => l.userId === req.userId && l.date === formattedDate);
        const actualInStr = dayLog && dayLog.checkInTime ? format(new Date(dayLog.checkInTime), 'HH:mm') : '-';
        const actualOutStr = dayLog && dayLog.checkOutTime ? format(new Date(dayLog.checkOutTime), 'HH:mm') : '-';

        // Check verification status (Safe Minimum Rule)
        let verificationStatus = 'ไม่พบเวลาสแกนเข้า/ออก';
        let actualScannedHours = 0;

        if (dayLog && dayLog.checkOutTime && req.startTime) {
            const checkOutDate = new Date(dayLog.checkOutTime);
            const [startH, startM] = req.startTime.split(':').map(Number);
            const reqStart = new Date(`${formattedDate}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`);
            
            if (checkOutDate > reqStart) {
                const diffMs = checkOutDate.getTime() - reqStart.getTime();
                actualScannedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
            }

            const [endH, endM] = req.endTime.split(':').map(Number);
            const reqEnd = new Date(`${formattedDate}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
            
            if (checkOutDate < reqEnd) {
                verificationStatus = `กลับก่อนกำหนด (ทำจริง ${actualScannedHours.toFixed(1)} ชม.)`;
            } else {
                verificationStatus = 'สแกนเช็คเอาท์ถูกต้อง ครบตามสิทธิ์';
            }
        }

        // Segments
        let normalHours = 0;
        let holidayHours = 0;
        let specialHours = 0;

        if (req.type === 'NORMAL_DAY') {
            normalHours = req.durationHours;
        } else if (req.type === 'HOLIDAY') {
            holidayHours = req.durationHours;
        } else if (req.type === 'HOLIDAY_OVERTIME') {
            specialHours = req.durationHours;
        }

        return [
            escapeCSVCell(user?.id || '', delimiter),
            escapeCSVCell(user?.name || 'Unknown', delimiter),
            userSalary,
            escapeCSVCell(formattedDate, delimiter),
            escapeCSVCell(`${req.startTime || '18:30'} - ${req.endTime || '20:30'}`, delimiter),
            escapeCSVCell(actualInStr, delimiter),
            escapeCSVCell(actualOutStr, delimiter),
            req.durationHours.toFixed(2),
            normalHours.toFixed(2),
            holidayHours.toFixed(2),
            specialHours.toFixed(2),
            req.computedPayout ? parseFloat(req.computedPayout.toFixed(2)) : 0,
            escapeCSVCell(verificationStatus, delimiter)
        ].join(delimiter);
    });

    return [headers.join(delimiter), ...rows].join("\n");
};

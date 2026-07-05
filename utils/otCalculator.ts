import { format, isValid } from 'date-fns';

export interface OtMultiplierResult {
    type: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME';
    multiplier: number;
}

/**
 * Calculates the OT multiplier based on holidays and weekends.
 */
export const calculateOtMultiplier = (
    date: Date,
    annualHolidays: any[] = [],
    calendarExceptions: any[] = []
): OtMultiplierResult => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isAnnualHoliday = (annualHolidays || []).some(h => 
        h.isActive && h.day === date.getDate() && h.month === (date.getMonth() + 1)
    );
    const holidayException = (calendarExceptions || []).find(e => e.date === dateStr && e.type === 'HOLIDAY');
    const isSpecialHoliday = isAnnualHoliday || !!holidayException;

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isSpecialHoliday) {
        return { type: 'HOLIDAY_OVERTIME', multiplier: 3.0 };
    } else if (isWeekend) {
        return { type: 'HOLIDAY', multiplier: 2.0 };
    } else {
        return { type: 'NORMAL_DAY', multiplier: 1.5 };
    }
};

/**
 * Calculates the estimated payout for overtime hours.
 */
export const calculateEstimatedPayout = (
    baseSalary: number,
    hours: number,
    multiplier: number
): number => {
    if (!baseSalary || baseSalary <= 0 || !hours || hours <= 0) return 0;
    const dailyWage = baseSalary / 30;
    const hourlyRate = dailyWage / 8;
    return Number((hourlyRate * multiplier * hours).toFixed(2));
};

/**
 * Compares the requested OT slot with actual check-out time to calculate payable hours.
 */
export const alignOtHoursWithClockOut = (
    dateStr: string,
    startTime: string,
    endTime: string,
    requestedHours: number,
    actualCheckOutTime: string | null | undefined
): { finalHours: number; message: string } => {
    if (!actualCheckOutTime) {
        return {
            finalHours: 0,
            message: ' (ไม่พบเวลาสแกนเช็คเอาท์จริงของวันนั้น)'
        };
    }

    const checkOutDate = new Date(actualCheckOutTime);
    const reqStart = new Date(`${dateStr}T${startTime}`);
    const reqEnd = new Date(`${dateStr}T${endTime}`);

    if (!isValid(checkOutDate) || !isValid(reqStart) || !isValid(reqEnd)) {
        return {
            finalHours: requestedHours,
            message: ' (รูปแบบวันเวลาไม่ถูกต้อง ใช้ชั่วโมงตามที่ขอ)'
        };
    }

    if (checkOutDate < reqStart) {
        return {
            finalHours: 0,
            message: ' (พนักงานเช็คเอาท์ออกก่อนช่วงเวลาเริ่ม OT)'
        };
    } else if (checkOutDate < reqEnd) {
        const diffMs = checkOutDate.getTime() - reqStart.getTime();
        const actualHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        return {
            finalHours: actualHours,
            message: ` (กลับก่อนเวลาที่ขอ! คํานวณจริงตามเวลาสแกนออก: ${actualHours} ชม.)`
        };
    } else {
        return {
            finalHours: requestedHours,
            message: ' (สแกนเช็คเอาท์ตามเวลาจริง ครบกำหนดขอ)'
        };
    }
};

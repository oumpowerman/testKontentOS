
import { differenceInMinutes, addMinutes, isBefore, setHours, setMinutes, parse } from 'date-fns';
import { isWorkingDay } from '../utils/judgeUtils';
import { AnnualHoliday, User, ShiftSlotResult } from '../types';
import { calculateShiftAndActualTime } from '../utils/shiftCalculator';
import { BRAND_CONFIG } from '../config/brand';

/**
 * Calculates the number of working days between two dates.
 * Respects annual holidays and manual exceptions if provided.
 */
export const getWorkingDaysDifference = (
    startDate: Date | string, 
    endDate: Date | string, 
    holidays: AnnualHoliday[] = [], 
    exceptions: any[] = [],
    user?: User | null,
    inclusive: boolean = false,
    isHalfDay?: boolean
): number => {
    if (isHalfDay) return 0.5;
    let count = 0;
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    let end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const isReverse = current > end;
    if (isReverse) {
        const temp = current;
        current = end;
        end = temp;
    }

    if (inclusive) {
        while (current <= end) {
            if (isWorkingDay(current, holidays, exceptions, user || null)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
    } else {
        while (current < end) {
            if (isWorkingDay(current, holidays, exceptions, user || null)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
    }
    return isReverse ? -count : count;
};

/**
 * Safely merges an existing note with a new incoming note string.
 * Prevents duplicates and handles spacing correctly.
 */
export const mergeAttendanceNotes = (existing: string | null | undefined, incoming: string | null | undefined): string => {
    const oldNote = (existing || '').trim();
    const newNote = (incoming || '').trim();

    if (!oldNote) return newNote;
    if (!newNote) return oldNote;

    // Avoid duplicating the exact same note
    if (oldNote.includes(newNote)) return oldNote;
    if (newNote.includes(oldNote)) return newNote;

    return `${oldNote} | ${newNote}`.trim();
};

export interface CheckOutCalculationResult {
    status: 'COMPLETED' | 'EARLY_LEAVE';
    isDurationMet: boolean;
    missingMinutes: number;
    hoursWorked: number;
    requiredEndTime: Date;
}

/**
 * Strict Duration Logic:
 * Returns 'COMPLETED' ONLY if Hours Worked >= Min Hours.
 * Fixed End Time (e.g. 18:00) is IGNORED for status calculation.
 */
export const calculateCheckOutStatus = (
    checkInTime: Date,
    currentTime: Date,
    minHours: number = 9,
    effectiveStartTimeStr?: string,
    isHalfDay: boolean = false,
    halfDaySession?: 'AM' | 'PM',
    useShiftEndTimeForLate: boolean = false
): CheckOutCalculationResult => {
    // Determine the base time for required checkout time calculation.
    // If checkInTime is earlier than shift start time or if useShiftEndTimeForLate is enabled for late entry cases, use shiftStartTime.
    // Otherwise (standard late check-in without strict flag), use the actual checkInTime.
    let baseTime = checkInTime;
    if (effectiveStartTimeStr) {
        try {
            const [sh, sm] = effectiveStartTimeStr.split(':').map(Number);
            const shiftStartTime = new Date(checkInTime);
            shiftStartTime.setHours(sh, sm, 0, 0);

            // Check if 4-stage late entry rule allows normal checkout (Stage 1 & 2: late <= 30 mins)
            let isFourStageEligible = false;
            if (BRAND_CONFIG.enableFourStageLateRules && (BRAND_CONFIG as any).fourStageLateConfig) {
                const stage2MaxMins = (BRAND_CONFIG as any).fourStageLateConfig.stage2MaxMins || 30;
                const lateMins = differenceInMinutes(checkInTime, shiftStartTime);
                if (lateMins > 0 && lateMins <= stage2MaxMins) {
                    isFourStageEligible = true;
                }
            }

            if (isBefore(checkInTime, shiftStartTime) || useShiftEndTimeForLate || isFourStageEligible) {
                baseTime = shiftStartTime;
            }
        } catch (e) {
            console.error("Error parsing effectiveStartTimeStr in calculateCheckOutStatus", e);
        }
    }

    // 1. Duration Check relative to actual check-in time
    const durationMinutes = differenceInMinutes(currentTime, checkInTime);
    const hoursWorked = durationMinutes / 60;
    
    // Calculate exact target end time based on baseTime
    // Half-day sessions only require 4 hours of work
    const requiredHours = isHalfDay ? 4 : minHours;
    const requiredMinutes = requiredHours * 60;
    const requiredEndTime = addMinutes(baseTime, requiredMinutes);
    
    // Check if current time is NOT before required end time (meaning we met or passed it)
    const isDurationMet = !isBefore(currentTime, requiredEndTime);
    
    // If completed, missing is 0. If early, calculate difference.
    const missingMinutes = isDurationMet ? 0 : differenceInMinutes(requiredEndTime, currentTime);

    // 2. Determine Status
    const status = isDurationMet ? 'COMPLETED' : 'EARLY_LEAVE';

    return {
        status,
        isDurationMet,
        missingMinutes,
        hoursWorked,
        requiredEndTime
    };
};

/**
 * Parses unstructured note data (e.g., "[PROOF:url] [LOC:lat,lng]")
 */
export const parseAttendanceMetadata = (note: string | undefined) => {
    if (!note) return { proofUrl: null, location: null, locationName: null, reason: null };

    const proofMatch = note.match(/\[PROOF:(.*?)\]/);
    const locMatch = note.match(/\[LOC:(.*?)\]/);
    const outLocMatch = note.match(/\[OUT_LOC:(.*?)\]/);
    const reasonMatch = note.match(/\[REASON:(.*?)\]/);

    // Parse Location (Lat,Lng)
    let location = null;
    let locationName = null;
    
    // Check OUT_LOC first, then LOC
    const locString = outLocMatch ? outLocMatch[1] : (locMatch ? locMatch[1] : null);
    
    if (locString) {
        const parts = locString.split('|'); // Support Name pipe: "13.1,100.2|Office"
        const coords = parts[0].split(',');
        if (coords.length === 2) {
            location = { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
        }
        if (parts.length > 1) {
            locationName = parts[1];
        }
    }

    let cleanNoteStr = '';
    if (note) {
        const rMatch = note.match(/\[REASON:(.*?)\]/);
        const aMatch = note.match(/\[ADMIN FIXED:(.*?)\]/);
        if (rMatch && rMatch[1]) {
            cleanNoteStr = rMatch[1].trim();
        } else if (aMatch && aMatch[1]) {
            cleanNoteStr = `แก้ไขโดยแอดมิน: ${aMatch[1].trim()}`;
        } else {
            cleanNoteStr = note.replace(/\[.*?\]/g, '').trim();
        }
    }

    return {
        proofUrl: proofMatch ? proofMatch[1] : null,
        location: location,
        locationName: locationName,
        reason: reasonMatch ? reasonMatch[1] : null,
        cleanNote: cleanNoteStr
    };
};

export interface ICTTimeResult {
    hour: string;
    minute: string;
    second: string;
    totalMinutes: number;
}

/**
 * Converts any Date or string representing a date-time into ICT (Asia/Bangkok) hour, minute, second and total minutes since midnight.
 */
export const getICTTime = (date: Date | string): ICTTimeResult => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(d);
    const hour = parts.find(p => p.type === 'hour')?.value || '00';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const second = parts.find(p => p.type === 'second')?.value || '00';
    
    let hNum = parseInt(hour, 10);
    if (hNum === 24) hNum = 0;
    const hStr = String(hNum).padStart(2, '0');
    
    return {
        hour: hStr,
        minute,
        second,
        totalMinutes: hNum * 60 + parseInt(minute, 10)
    };
};

/**
 * Adds minutes to a HH:mm time string.
 */
export const addMinutesToTimeString = (timeStr: string, minutesToAdd: number): string => {
    const [h, m] = (timeStr || '08:00').split(':').map(Number);
    const totalMinutes = h * 60 + m + minutesToAdd;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

export interface MultipleShiftsConfig {
    enabled?: boolean;
    shiftsList?: string[] | string;
}

/**
 * Determines the target shift start time (e.g. "08:00", "08:30", "09:00")
 * Priority:
 * 1. [TARGET_SHIFT:HH:mm] tag in note
 * 2. If multiple shifts enabled and shiftsList available:
 *    Matches checkInTime against shift slots using calculateShiftAndActualTime logic.
 * 3. Fallback to default startTimeStr
 */
export const getEffectiveStartTime = (
    checkInTime: Date | string | null,
    defaultStartTimeStr: string,
    note?: string | null,
    multipleShifts?: MultipleShiftsConfig
): string => {
    // 1. Check for [TARGET_SHIFT:HH:mm] tag in note
    if (note) {
        const targetShiftMatch = note.match(/\[TARGET_SHIFT:(\d{1,2}:\d{2})\]/);
        if (targetShiftMatch && targetShiftMatch[1]) {
            return targetShiftMatch[1];
        }
        const timeMatch = note.match(/\[TIME:(\d{1,2}:\d{2})(?:-\d{1,2}:\d{2})?\]/);
        if (timeMatch && timeMatch[1]) {
            return timeMatch[1];
        }
    }

    // 2. Check for Multiple Shifts if enabled
    if (multipleShifts && multipleShifts.enabled && checkInTime) {
        let shiftsArray: string[] = [];
        if (Array.isArray(multipleShifts.shiftsList)) {
            shiftsArray = multipleShifts.shiftsList;
        } else if (typeof multipleShifts.shiftsList === 'string') {
            shiftsArray = multipleShifts.shiftsList.split(',').map(s => s.trim()).filter(Boolean);
        }

        if (shiftsArray.length > 0) {
            const checkInDate = typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime;
            const { hour, minute } = getICTTime(checkInDate);
            const timeStr = `${hour}:${minute}`;
            const result = calculateShiftAndActualTime(timeStr, shiftsArray);
            if (result && result.targetShift) {
                return result.targetShift;
            }
        }
    }

    return defaultStartTimeStr || '08:00';
};

/**
 * Check if a specific time is considered "Late" based on dynamic config string (e.g. "10:00")
 */
export const checkIsLate = (
    checkInTime: Date | string | null, 
    startTimeStr: string, 
    bufferMinutes: number = 0,
    note?: string | null,
    multipleShifts?: MultipleShiftsConfig
): boolean => {
    if (!checkInTime) return false;
    try {
        const actualBuffer = (BRAND_CONFIG.lateCalculationMode === 2 || BRAND_CONFIG.enableFourStageLateRules) ? 0 : bufferMinutes;
        const effectiveStartTime = getEffectiveStartTime(checkInTime, startTimeStr, note, multipleShifts);
        const { totalMinutes } = getICTTime(checkInTime);
        const [sh, sm] = effectiveStartTime.split(':').map(Number);
        const shiftMinutes = sh * 60 + sm;
        return totalMinutes > (shiftMinutes + actualBuffer);
    } catch (e) {
        console.error("Error checking is late", e);
        return false; // Default to not late if config error
    }
};

/**
 * Calculates exact late minutes relative to the official start time.
 * If actual check-in exceeds the late buffer time, late duration is calculated 
 * from the official start time.
 */
export const getLateMinutes = (
    checkInTime: Date | string | null, 
    startTimeStr: string, 
    bufferMinutes: number = 0,
    note?: string | null,
    multipleShifts?: MultipleShiftsConfig
): number => {
    if (!checkInTime) return 0;
    try {
        const actualBuffer = (BRAND_CONFIG.lateCalculationMode === 2 || BRAND_CONFIG.enableFourStageLateRules) ? 0 : bufferMinutes;
        const effectiveStartTime = getEffectiveStartTime(checkInTime, startTimeStr, note, multipleShifts);
        const { totalMinutes } = getICTTime(checkInTime);
        const [sh, sm] = effectiveStartTime.split(':').map(Number);
        const shiftMinutes = sh * 60 + sm;
        
        if (totalMinutes > (shiftMinutes + actualBuffer)) {
            // Calculated from the official start time
            return totalMinutes - shiftMinutes;
        }
        return 0; // Not late or within buffer
    } catch (e) {
        return 0;
    }
};

/**
 * Calculates work hours between check-in and check-out.
 */
export const calculateWorkHours = (checkIn: Date | string | null, checkOut: Date | string | null): number => {
    if (!checkIn || !checkOut) return 0;
    try {
        const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
        const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
        const diffMs = end.getTime() - start.getTime();
        return Math.max(0, diffMs / (1000 * 60 * 60));
    } catch (e) {
        return 0;
    }
};

export interface AttendanceSummary {
    isLate: boolean;
    isEarlyLeave: boolean;
    workHours: number;
    requiredEndTime: Date | null;
}

export interface AttendanceSummaryConfig {
    startTime: string;
    buffer: number;
    minHours: number;
    note?: string | null;
    multipleShifts?: MultipleShiftsConfig;
    isHalfDay?: boolean;
    halfDaySession?: 'AM' | 'PM' | null;
    useShiftEndTimeForLate?: boolean;
}

/**
 * Comprehensive attendance summary calculation.
 */
export const getAttendanceSummary = (
    checkInTime: Date | string | null,
    checkOutTime: Date | string | null,
    config: AttendanceSummaryConfig
): AttendanceSummary => {
    const checkIn = checkInTime ? (typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime) : null;
    const checkOut = checkOutTime ? (typeof checkOutTime === 'string' ? new Date(checkOutTime) : checkOutTime) : null;

    let isHalfDay = config.isHalfDay;
    let halfDaySession = config.halfDaySession;

    if (!isHalfDay && config.note) {
        const halfDayMatch = config.note.match(/\[HALF_DAY:(AM|PM)\]/i);
        if (halfDayMatch) {
            isHalfDay = true;
            halfDaySession = halfDayMatch[1].toUpperCase() as 'AM' | 'PM';
        }
    }

    let startTime = config.startTime;
    let minHours = config.minHours;

    if (isHalfDay) {
        minHours = 4; // ปรับลดเกณฑ์ชั่วโมงการทำงานลงครึ่งหนึ่งเหลือ 4 ชั่วโมง
        if (halfDaySession === 'AM') {
            // ปรับเวลาเข้างานบ่ายแบบ Dynamic ตามเวลาเริ่มกะจริงของพนักงาน
            startTime = addMinutesToTimeString(config.startTime, 300); // บวก 5 ชั่วโมง (ทำงาน 4 ชม. + พัก 1 ชม.)
        }
    }

    const isLate = checkIn 
        ? checkIsLate(
            checkIn, 
            startTime, 
            config.buffer, 
            isHalfDay ? null : config.note, 
            isHalfDay ? undefined : config.multipleShifts
          ) 
        : false;
    const workHours = calculateWorkHours(checkIn, checkOut);
    
    let requiredEndTime = null;
    let isEarlyLeave = false;

    if (checkIn) {
        let baseTime = checkIn;
        if (!isHalfDay) {
            const effectiveStartTimeStr = getEffectiveStartTime(
                checkIn,
                config.startTime,
                config.note,
                config.multipleShifts
            );
            try {
                const [sh, sm] = effectiveStartTimeStr.split(':').map(Number);
                const shiftStartTime = new Date(checkIn);
                shiftStartTime.setHours(sh, sm, 0, 0);

                if (isBefore(checkIn, shiftStartTime) || config.useShiftEndTimeForLate) {
                    baseTime = shiftStartTime;
                }
            } catch (e) {
                console.error("Error parsing baseTime in getAttendanceSummary", e);
            }
        }
        requiredEndTime = addMinutes(baseTime, minHours * 60);

        if (isHalfDay && halfDaySession === 'PM') {
            // คำนวณเวลาที่อนุญาตให้ออกงานได้จริงตามกะของวันนั้น ๆ
            const [sh, sm] = (config.startTime || '08:00').split(':').map(Number);
            const amWorkDurationMinutes = 240; // 4 ชั่วโมงสำหรับการทำงานกะเช้า
            
            const checkoutTime = new Date(checkIn);
            checkoutTime.setHours(sh, sm, 0, 0); // ตั้งต้นเวลาที่เวลาเริ่มกะจริง
            requiredEndTime = addMinutes(checkoutTime, amWorkDurationMinutes); // บวกเวลาทำงาน 4 ชั่วโมง
        }

        if (checkOut) {
            isEarlyLeave = isBefore(checkOut, requiredEndTime);
        } else {
            // If not checked out yet, compare with current time
            isEarlyLeave = isBefore(new Date(), requiredEndTime);
        }
    }

    return {
        isLate,
        isEarlyLeave,
        workHours,
        requiredEndTime
    };
};

/**
 * Calculates matched shift slot for multi-shift environments.
 */
export const getMatchedShiftSlot = (
    now: Date,
    shiftsList: string[],
    bufferMinutes: number = 15,
    ignoreBrandMode: boolean = false
): ShiftSlotResult => {
    const actualBuffer = (ignoreBrandMode || (BRAND_CONFIG.lateCalculationMode !== 2 && !BRAND_CONFIG.enableFourStageLateRules)) ? bufferMinutes : 0;
    if (!shiftsList || shiftsList.length === 0) {
        return {
            targetStartTime: '08:00',
            isLate: false,
            isBlocked: false,
            isExceededLastShift: false,
            lateMinutes: 0
        };
    }

    // Sort ascending, e.g. ["08:00", "08:30", "09:00"]
    const sortedShifts = [...shiftsList].sort((a, b) => {
        const [ah, am] = a.split(':').map(Number);
        const [bh, bm] = b.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
    });

    const { totalMinutes: currentTotalMinutes } = getICTTime(now);

    // Find the first shift slot we are early or exactly on-time for
    for (const shift of sortedShifts) {
        const [sh, sm] = shift.split(':').map(Number);
        const shiftTotalMinutes = sh * 60 + sm;

        if (currentTotalMinutes <= shiftTotalMinutes) {
            return {
                targetStartTime: shift,
                isLate: false,
                isBlocked: false,
                isExceededLastShift: false,
                lateMinutes: 0
            };
        }
    }

    // If we passed all shift slots, we belong to the last shift slot as late
    const lastShift = sortedShifts[sortedShifts.length - 1];
    const [lastH, lastM] = lastShift.split(':').map(Number);
    const lastShiftTotalMinutes = lastH * 60 + lastM;

    const diff = currentTotalMinutes - lastShiftTotalMinutes;
    const isExceededLastShift = diff > actualBuffer;
    const isLate = isExceededLastShift;
    const isRawLate = diff > 0;
    const isBlocked = isExceededLastShift;

    return {
        targetStartTime: lastShift,
        isLate,
        isRawLate,
        isBlocked,
        isExceededLastShift,
        lateMinutes: diff > 0 ? diff : 0
    };
};

/**
 * Resolves the overall status of an attendance log based on the times and tags inside the note.
 */
export const resolveAttendanceLogStatus = (
    checkInTime: string | null | undefined,
    checkOutTime: string | null | undefined,
    note: string | null | undefined,
    currentStatus?: string
): 'WORKING' | 'COMPLETED' | 'LATE' | 'PENDING_VERIFY' | 'ACTION_REQUIRED' | 'ABSENT' | 'LEAVE' => {
    const noteText = note || '';

    // If status is LEAVE or ABSENT, preserve it unless times are explicitly provided
    if (currentStatus === 'LEAVE') return 'LEAVE';
    if (currentStatus === 'ABSENT' && !checkInTime && !checkOutTime) return 'ABSENT';

    // 1. Check for Active Rejections (ACTION_REQUIRED has highest priority)
    const hasRejectedCheckIn = noteText.includes('[REJECTED FORGOT_CHECKIN]') || noteText.includes('[REJECTED GPS_SPOOF_APPEAL]') || noteText.includes('[REJECTED_GPS_SPOOF_APPEAL]');
    const hasRejectedCheckOut = noteText.includes('[REJECTED OUT_OF_RANGE_CHECKOUT]') || noteText.includes('[REJECTED FORGOT_CHECKOUT]');
    
    const isCheckInApproved = noteText.includes('[APPROVED FORGOT_CHECKIN]') || noteText.includes('[APPROVED LATE_ENTRY]') || noteText.includes('[APPROVED FORGOT_BOTH]') || noteText.includes('[APPROVED GPS_SPOOF_APPEAL]');
    const isCheckOutApproved = noteText.includes('[APPROVED OUT_OF_RANGE_CHECKOUT]') || noteText.includes('[APPROVED FORGOT_CHECKOUT]') || noteText.includes('[APPROVED FORGOT_BOTH]');

    const isCheckInResolved = !!checkInTime && (!hasRejectedCheckIn || isCheckInApproved);
    const isCheckOutResolved = !!checkOutTime && (!hasRejectedCheckOut || isCheckOutApproved);

    if ((hasRejectedCheckIn && !isCheckInResolved) || (hasRejectedCheckOut && !isCheckOutResolved)) {
        return 'ACTION_REQUIRED';
    }

    // 2. Check for Provisional / Pending Verification
    const hasProvisionalCheckIn = 
        (noteText.includes('[PROVISIONAL_FORGOT_CHECKIN]') && !noteText.includes('[APPROVED FORGOT_CHECKIN]') && !noteText.includes('[REJECTED FORGOT_CHECKIN]')) || 
        (noteText.includes('[PROVISIONAL_LATE_ENTRY]') && !noteText.includes('[APPROVED LATE_ENTRY]') && !noteText.includes('[REJECTED LATE_ENTRY]')) ||
        (noteText.includes('[PROVISIONAL_WFH]') && !noteText.includes('[APPROVED WFH]') && !noteText.includes('[REJECTED_WFH]')) ||
        (noteText.includes('[PROVISIONAL_ONSITE]') && !noteText.includes('[APPROVED ONSITE]') && !noteText.includes('[REJECTED_ONSITE]')) ||
        (noteText.includes('[PROVISIONAL_GPS_SPOOF_APPEAL]') && !noteText.includes('[APPROVED GPS_SPOOF_APPEAL]') && !noteText.includes('[REJECTED GPS_SPOOF_APPEAL]') && !noteText.includes('[REJECTED_GPS_SPOOF_APPEAL]')) ||
        (noteText.includes('[GPS_SPOOF_APPEAL_PENDING]') && !noteText.includes('[APPROVED GPS_SPOOF_APPEAL]') && !noteText.includes('[REJECTED GPS_SPOOF_APPEAL]') && !noteText.includes('[REJECTED_GPS_SPOOF_APPEAL]'));
    const hasProvisionalCheckOut = 
        ((noteText.includes('[PROVISIONAL_CHECKOUT]') || noteText.includes('[PROVISIONAL_GPS_SPOOF_OUT]') || noteText.includes('[GPS_SPOOF_OUT_PENDING]')) && 
        !noteText.includes('[APPROVED FORGOT_CHECKOUT]') && 
        !noteText.includes('[APPROVED OUT_OF_RANGE_CHECKOUT]') && 
        !noteText.includes('[APPROVED EARLY_LEAVE_APPEAL]') &&
        !noteText.includes('[APPROVED GPS_SPOOF_OUT]') &&
        !noteText.includes('[REJECTED FORGOT_CHECKOUT]') && 
        !noteText.includes('[REJECTED OUT_OF_RANGE_CHECKOUT]') &&
        !noteText.includes('[REJECTED EARLY_LEAVE_APPEAL]') &&
        !noteText.includes('[REJECTED GPS_SPOOF_OUT]'));
    const hasEarlyLeaveResolvedTag = noteText.includes('[REJECTED EARLY_LEAVE_APPEAL]') || noteText.includes('[APPROVED EARLY_LEAVE_APPEAL]');
    const hasProvisionalTags = hasProvisionalCheckIn || hasProvisionalCheckOut;

    let isPendingVerify = false;
    if (hasProvisionalTags) {
        isPendingVerify = true;
    } else if (currentStatus === 'PENDING_VERIFY') {
        if (!hasProvisionalTags || hasEarlyLeaveResolvedTag) {
            isPendingVerify = false;
        } else {
            isPendingVerify = true;
        }
    }

    if (isPendingVerify) {
        return 'PENDING_VERIFY';
    }

    // 3. Normal states
    if (checkInTime && checkOutTime) {
        if (noteText.includes('[APPROVED LATE_ENTRY]') || noteText.includes('[LATE]')) {
            return 'LATE';
        }
        return 'COMPLETED';
    }

    if (checkInTime) {
        return 'WORKING';
    }

    return (currentStatus as any) || 'ACTION_REQUIRED';
};

/**
 * Calculates the maximum allowed check-in time based on the latest shift and buffer.
 * e.g., if shifts are ['08:00', '08:30', '09:00'] and buffer is 15 mins, max allowed time is '09:15'.
 */
export function getMaxShiftWithBuffer(masterOptions: any[] = []): { maxShiftTimeStr: string; maxAllowedTimeStr: string; bufferMinutes: number } {
    const shiftsEnabledOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_ENABLED');
    const shiftsListOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_LIST');
    const startTimeOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME');
    const lateBufferOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER');

    const bufferMinutes = BRAND_CONFIG.lateCalculationMode === 2 ? 0 : parseInt(lateBufferOpt?.label || '15', 10);
    const shiftsEnabled = shiftsEnabledOpt?.label === 'true';

    let maxShiftTimeStr = startTimeOpt?.label || '09:00';

    if (shiftsEnabled && shiftsListOpt?.label) {
        const shifts = shiftsListOpt.label.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (shifts.length > 0) {
            shifts.sort();
            maxShiftTimeStr = shifts[shifts.length - 1];
        }
    }

    const [h, m] = maxShiftTimeStr.split(':').map(Number);
    const totalMinutes = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m) + bufferMinutes;
    const maxH = Math.floor(totalMinutes / 60) % 24;
    const maxM = totalMinutes % 60;
    const maxAllowedTimeStr = `${String(maxH).padStart(2, '0')}:${String(maxM).padStart(2, '0')}`;

    return { maxShiftTimeStr, maxAllowedTimeStr, bufferMinutes };
}



import { differenceInMinutes, addMinutes, isBefore, setHours, setMinutes, parse } from 'date-fns';
import { isWorkingDay } from '../utils/judgeUtils';
import { AnnualHoliday, User } from '../types';

/**
 * Calculates the number of working days between two dates.
 * Respects annual holidays and manual exceptions if provided.
 */
export const getWorkingDaysDifference = (
    startDate: Date, 
    endDate: Date, 
    holidays: AnnualHoliday[] = [], 
    exceptions: any[] = [],
    user?: User | null
): number => {
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

    while (current < end) {
        if (isWorkingDay(current, holidays, exceptions, user || null)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
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
    minHours: number = 9
): CheckOutCalculationResult => {
    // 1. Duration Check
    const durationMinutes = differenceInMinutes(currentTime, checkInTime);
    const hoursWorked = durationMinutes / 60;
    
    // Calculate exact target end time based on check-in
    const requiredMinutes = minHours * 60;
    const requiredEndTime = addMinutes(checkInTime, requiredMinutes);
    
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

    return {
        proofUrl: proofMatch ? proofMatch[1] : null,
        location: location,
        locationName: locationName,
        reason: reasonMatch ? reasonMatch[1] : null,
        cleanNote: note.replace(/\[.*?\]/g, '').trim() // Note text without tags
    };
};

/**
 * Check if a specific time is considered "Late" based on dynamic config string (e.g. "10:00")
 */
export const checkIsLate = (checkInTime: Date | string | null, startTimeStr: string, bufferMinutes: number = 0): boolean => {
    if (!checkInTime) return false;
    try {
        const checkIn = typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime;
        const [targetHour, targetMinute] = startTimeStr.split(':').map(Number);
        
        // Create target time object for the same day as checkInTime
        const targetTime = setMinutes(setHours(checkIn, targetHour), targetMinute + bufferMinutes);
        
        // If checkInTime is AFTER targetTime, it is late
        return isBefore(targetTime, checkIn);
    } catch (e) {
        console.error("Error parsing start time", e);
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
    bufferMinutes: number = 0
): number => {
    if (!checkInTime) return 0;
    try {
        const checkIn = typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime;
        const [targetHour, targetMinute] = startTimeStr.split(':').map(Number);
        
        const officialStartTime = setMinutes(setHours(checkIn, targetHour), targetMinute);
        const lateLimitTime = setMinutes(setHours(checkIn, targetHour), targetMinute + bufferMinutes);
        
        // If check-in time is AFTER late limit, compute exact late minutes from official starting time
        if (isBefore(lateLimitTime, checkIn)) {
            return Math.max(0, differenceInMinutes(checkIn, officialStartTime));
        }
        return 0; // Not late
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

/**
 * Comprehensive attendance summary calculation.
 */
export const getAttendanceSummary = (
    checkInTime: Date | string | null,
    checkOutTime: Date | string | null,
    config: { startTime: string; buffer: number; minHours: number }
): AttendanceSummary => {
    const checkIn = checkInTime ? (typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime) : null;
    const checkOut = checkOutTime ? (typeof checkOutTime === 'string' ? new Date(checkOutTime) : checkOutTime) : null;

    const isLate = checkIn ? checkIsLate(checkIn, config.startTime, config.buffer) : false;
    const workHours = calculateWorkHours(checkIn, checkOut);
    
    let requiredEndTime = null;
    let isEarlyLeave = false;

    if (checkIn) {
        requiredEndTime = addMinutes(checkIn, config.minHours * 60);
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

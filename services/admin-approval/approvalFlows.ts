import { supabase } from '../../lib/supabase';
import { LeaveRequest } from '../../types/attendance';
import { format, eachDayOfInterval } from 'date-fns';
import { getRegistryItem } from '../../constants/attendanceRegistry';
import { calculateShiftAndActualTime } from '../../utils/shiftCalculator';
import {
    buildOtAuditLog,
    buildAttendanceCorrectionPayload,
    parseWorkConfig,
    cleanAttendanceNoteTags,
    deduceTargetWorkType,
    parseOtDetailsFromReason,
    processHpRefundIfEligible
} from '../../utils/adminApprovalHelpers';
import { checkIsLate, getLateMinutes, mergeAttendanceNotes, resolveAttendanceLogStatus, getMaxShiftWithBuffer, getICTTime } from '../../lib/attendanceUtils';
import { publishToTeamChannel } from './communicationHelpers';

/**
 * Handles approval logic for Special Work Requests: WFH, ONSITE, and OVERTIME.
 */
export async function approveSpecialWorkRequest({
    request,
    customOtHours,
    customStartTime,
    customEndTime,
    adminNote,
    masterOptions = [],
    processAction
}: {
    request: LeaveRequest;
    customOtHours?: number;
    customStartTime?: string;
    customEndTime?: string;
    adminNote?: string;
    masterOptions?: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    let finalDbNote = adminNote || '';
    let isTimeModified = false;
    let updatedReason = request.reason;

    if (request.type === 'OVERTIME') {
        const isFixedOt = (request as any).isFixed || (request as any).is_fixed || (request.reason && request.reason.includes('[OT:FIXED]'));
        
        if (isFixedOt) {
            isTimeModified = true;
            const { origStart, origEnd, origHours, cleanReason } = parseOtDetailsFromReason(request.reason || '');
            
            const newStart = '00:00';
            const newEnd = '00:00';
            const newHours = 0;
            
            let fixedCleanReason = cleanReason.replace(/\[OT:FIXED\]/g, '').trim();
            updatedReason = `[OT:FIXED] [OT:${newStart}-${newEnd}] (${newHours}hr) ${fixedCleanReason}`.trim();
            
            const { finalDbNote: computedDbNote } = buildOtAuditLog(
                origStart,
                origEnd,
                origHours,
                newStart,
                newEnd,
                newHours,
                adminNote,
                true,
                true
            );
            finalDbNote = computedDbNote;
        } else {
            isTimeModified = (customStartTime !== undefined) || (customEndTime !== undefined) || (customOtHours !== undefined);
            if (isTimeModified) {
                const { origStart, origEnd, origHours, cleanReason } = parseOtDetailsFromReason(request.reason || '');

                const newStart = customStartTime || origStart;
                const newEnd = customEndTime || origEnd;
                const newHours = customOtHours !== undefined ? customOtHours : origHours;

                updatedReason = `[OT:${newStart}-${newEnd}] (${newHours}hr) ${cleanReason}`;
                
                const { finalDbNote: computedDbNote } = buildOtAuditLog(
                    origStart,
                    origEnd,
                    origHours,
                    newStart,
                    newEnd,
                    newHours,
                    adminNote,
                    true
                );
                finalDbNote = computedDbNote;
            }
        }
    }

    if (request.type === 'OVERTIME' && isTimeModified) {
        await supabase.from('leave_requests')
            .update({ reason: updatedReason })
            .eq('id', request.id);
    }

    if (request.type === 'WFH' || request.type === 'ONSITE') {
        const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');
        const { data: freshLog } = await supabase
            .from('attendance_logs')
            .select('id, note, check_out_time, check_in_time')
            .eq('user_id', request.userId)
            .eq('date', shiftDateStr)
            .maybeSingle();

        if (freshLog) {
            let newNote = freshLog.note || '';
            const registryItem = getRegistryItem(request.type);
            if (registryItem) {
                const tagsToClean = [registryItem.tags.pending, registryItem.tags.provisional, '[APPEAL_PENDING]'].filter(Boolean) as string[];
                tagsToClean.forEach(tag => {
                    const escaped = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const regex = new RegExp(escaped, 'g');
                    newNote = newNote.replace(regex, '');
                });
                newNote = newNote.replace(/\s+/g, ' ').trim();
            }
            
            const { startTime: startTimeStr, lateBuffer: buffer, multipleShifts } = parseWorkConfig(masterOptions);
            let isLate = false;
            let lateMinutes = 0;

            if (freshLog.check_in_time) {
                const checkInDate = new Date(freshLog.check_in_time);
                isLate = checkIsLate(checkInDate, startTimeStr, buffer, freshLog.note, multipleShifts);
                lateMinutes = isLate ? getLateMinutes(checkInDate, startTimeStr, buffer, freshLog.note, multipleShifts) : 0;
            }

            const targetStatus = isLate ? 'LATE' : (freshLog.check_out_time ? 'COMPLETED' : 'WORKING');

            await supabase.from('attendance_logs')
                .update({ 
                    note: newNote,
                    status: targetStatus
                })
                .eq('id', freshLog.id);

            // Award check-in points on approval!
            if (freshLog.check_in_time) {
                const checkInDate = new Date(freshLog.check_in_time);
                await processAction(request.userId, 'ATTENDANCE_CHECK_IN', {
                    status: isLate ? 'LATE' : 'ON_TIME',
                    time: format(checkInDate, 'HH:mm'),
                    lateMinutes: lateMinutes,
                    date: checkInDate
                });
            }
        }

        if (request.type === 'WFH') {
            await publishToTeamChannel(`🏠 **${request.user?.name}** ได้รับอนุมัติ WFH (อย่าลืม Check-in เมื่อเริ่มงานนะ!)`);
        } else if (request.type === 'ONSITE') {
            await publishToTeamChannel(`📍 **${request.user?.name}** ได้รับอนุมัติปฏิบัติงาน Onsite นอกสถานที่แล้ว`);
        }
    } else if (request.type === 'OVERTIME') {
        const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');
        const { data: freshLog } = await supabase
            .from('attendance_logs')
            .select('id, note')
            .eq('user_id', request.userId)
            .eq('date', shiftDateStr)
            .maybeSingle();

        if (freshLog) {
            const newNote = (freshLog.note || '')
                .replace('[OT_PENDING:', '[OT_APPROVED:')
                .trim();
            await supabase.from('attendance_logs')
                .update({ note: newNote })
                .eq('id', freshLog.id);
        }

        let otHours = 0;
        if (customOtHours !== undefined) {
            otHours = customOtHours;
        } else {
            const otMinutesMatch = request.reason ? request.reason.match(/\[OT_MINUTES:(\d+)\]/) : null;
            const otMinutes = otMinutesMatch ? parseInt(otMinutesMatch[1], 10) : 60;
            otHours = parseFloat((otMinutes / 60).toFixed(1));
        }

        await processAction(request.userId, 'ATTENDANCE_OVERTIME', { 
            hours: otHours, 
            id: `OT_REWARD:${request.id}` 
        });
    }

    return { finalDbNote, updatedReason, isTimeModified };
}

/**
 * Handles approval logic for Attendance Corrections: LATE_ENTRY, FORGOT_BOTH, FORGOT_CHECKIN, FORGOT_CHECKOUT.
 */
export async function approveAttendanceCorrection({
    request,
    customStartTime,
    masterOptions = [],
    processAction
}: {
    request: LeaveRequest;
    customStartTime?: string;
    masterOptions?: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})(-\d{2}:\d{2})?\]/);
    let timeStr = customStartTime || (timeMatch ? timeMatch[1] : '00:00');
    let endTimeStr = timeMatch && timeMatch[2] ? timeMatch[2].substring(1) : null;

    // ตรวจจับว่าถ้า customStartTime ที่รับเข้ามา มีการระบุขีด (-) แปลว่าเป็นช่วงเวลาเข้า-ออกคู่กัน
    if (timeStr && timeStr.includes('-')) {
        const parts = timeStr.split('-');
        timeStr = parts[0];       // ดึงเอาเฉพาะเวลาเข้างานจริง เช่น "08:30"
        endTimeStr = parts[1];    // ดึงเอาเฉพาะเวลาออกงานจริง เช่น "17:30"
    }
    const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');

    const registryItem = getRegistryItem(request.type);
    const behavior = registryItem?.approvalBehavior;

    const { data: freshLog } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', request.userId)
        .eq('date', shiftDateStr)
        .maybeSingle();

    let finalReason = (request.reason || '').replace('[PROVISIONAL_CHECKOUT]', '').trim();
    if (customStartTime) {
        // Parse actual entry and exit times from customStartTime
        let adminEntryTime = customStartTime;
        let adminExitTime = '';
        if (customStartTime.includes('-')) {
            const parts = customStartTime.split('-');
            adminEntryTime = parts[0].trim();
            adminExitTime = parts[1].trim();
        }

        // Clean and replace [TARGET_SHIFT:...] tag with the correct admin approved entry/target time
        // Skip this for LATE_ENTRY as customStartTime is the corrected entry time, not the shift start time
        if (request.type !== 'LATE_ENTRY' && finalReason.includes('[TARGET_SHIFT:')) {
            let targetShiftTime = adminEntryTime;

            if (request.type === 'FORGOT_CHECKIN') {
                const { multipleShifts } = parseWorkConfig(masterOptions || []);
                if (multipleShifts?.enabled && multipleShifts.shiftsList) {
                    let shiftsArray: string[] = [];
                    if (Array.isArray(multipleShifts.shiftsList)) {
                        shiftsArray = multipleShifts.shiftsList;
                    } else if (typeof multipleShifts.shiftsList === 'string') {
                        shiftsArray = multipleShifts.shiftsList.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    if (shiftsArray.length > 0) {
                        const shiftResult = calculateShiftAndActualTime(adminEntryTime, shiftsArray);
                        if (shiftResult && shiftResult.targetShift) {
                            targetShiftTime = shiftResult.targetShift;
                        }
                    }
                }
            }

            finalReason = finalReason.replace(/\[TARGET_SHIFT:[^\]]+\]/g, `[TARGET_SHIFT:${targetShiftTime}]`);
        }

        // Clean and replace [TIME:...] tag with the correct range or single time
        const newTimeTag = adminExitTime 
            ? `[TIME:${adminEntryTime}-${adminExitTime}]` 
            : `[TIME:${adminEntryTime}]`;
            
        if (finalReason.includes('[TIME:')) {
            finalReason = finalReason.replace(/\[TIME:[^\]]+\]/g, newTimeTag);
        }

        // Now update or add [APPROVED_TIME:...] tag
        const hasApprovedTimeMatch = finalReason.match(/\[APPROVED_TIME:[^\]]+\]/);
        if (hasApprovedTimeMatch) {
            finalReason = finalReason.replace(/\[APPROVED_TIME:[^\]]+\]/g, `[APPROVED_TIME:${customStartTime}]`);
        } else {
            finalReason = `${finalReason} [APPROVED_TIME:${customStartTime}]`.replace(/\s+/g, ' ').trim();
        }

        await supabase.from('leave_requests')
            .update({ reason: finalReason })
            .eq('id', request.id);
    }

    if (request.type === 'LATE_ENTRY' && freshLog) {
        let actualCheckInDateTime = freshLog.check_in_time ? new Date(freshLog.check_in_time) : null;
        
        if (customStartTime) {
            const [h, m] = customStartTime.split(':').map(Number);
            const updatedCheckIn = new Date(request.startDate);
            updatedCheckIn.setHours(h, m, 0, 0);
            actualCheckInDateTime = updatedCheckIn;
            freshLog.check_in_time = updatedCheckIn.toISOString();
        }

        // Determine the late entry threshold (shift start / approved late time) using prioritized rules:
        // 1. [APPROVED_TIME:...] tag in finalReason / request.reason
        // 2. Default timeStr (requested late time)
        // 3. [TARGET_SHIFT:...] tag in finalReason / request.reason (fallback)
        const approvedTimeMatch = finalReason.match(/\[APPROVED_TIME:([^\]]+)\]/);
        const targetShiftMatch = finalReason.match(/\[TARGET_SHIFT:(\d{2}:\d{2})\]/);

        let lateThresholdStr = '';
        if (approvedTimeMatch) {
            const approvedVal = approvedTimeMatch[1];
            lateThresholdStr = approvedVal.includes('-') ? approvedVal.split('-')[0].trim() : approvedVal.trim();
        } else if (timeStr && timeStr !== '00:00') {
            lateThresholdStr = timeStr;
        } else if (targetShiftMatch) {
            lateThresholdStr = targetShiftMatch[1].trim();
        } else {
            lateThresholdStr = timeStr;
        }

        const [approvedHour, approvedMinute] = lateThresholdStr.split(':').map(Number);
        const approvedMinutesSinceMidnight = approvedHour * 60 + approvedMinute;
        
        let isActuallyLate = false;
        let diffLateMinutes = 0;
        let actualTimeStr = '00:00';
        
        if (actualCheckInDateTime) {
            const { hour, minute, totalMinutes: actualMinutesSinceMidnight } = getICTTime(actualCheckInDateTime);
            actualTimeStr = `${hour}:${minute}`;
            
            // If actual check-in time is AFTER the approved late threshold time, they are late!
            if (actualMinutesSinceMidnight > approvedMinutesSinceMidnight) {
                isActuallyLate = true;
                diffLateMinutes = actualMinutesSinceMidnight - approvedMinutesSinceMidnight;
            }
        }

        let newNote = cleanAttendanceNoteTags(freshLog.note || '', request.type);
        newNote = `${newNote} [APPROVED LATE_ENTRY] ${finalReason}`;
        
        if (isActuallyLate) {
            newNote = `${newNote} [LATE]`;
        }
        
        newNote = newNote.replace(/\s+/g, ' ').trim();

        // Determine targetWorkType from approved WFH/ONSITE leave request or tags
        const targetWorkType = await deduceTargetWorkType({
            userId: request.userId,
            dateStr: shiftDateStr,
            requestReason: finalReason,
            existingNote: freshLog.note,
            existingWorkType: freshLog.work_type
        });

        const targetStatus = freshLog.check_out_time 
            ? (isActuallyLate ? 'LATE' : 'COMPLETED') 
            : 'WORKING';

        await supabase.from('attendance_logs')
            .update({ 
                status: targetStatus, 
                note: newNote, 
                work_type: targetWorkType,
                check_in_time: actualCheckInDateTime ? actualCheckInDateTime.toISOString() : null
            })
            .eq('id', freshLog.id);

        // Recalculate and trigger ATTENDANCE_CHECK_IN action for gamification
        try {
            await processAction(request.userId, 'ATTENDANCE_CHECK_IN', {
                status: isActuallyLate ? 'LATE' : 'ON_TIME',
                time: actualTimeStr,
                lateMinutes: diffLateMinutes,
                date: actualCheckInDateTime || request.startDate
            });
        } catch (gameErr) {
            console.error('Failed to process ATTENDANCE_CHECK_IN gamification action on LATE_ENTRY approval:', gameErr);
        }
    } else if (behavior?.correctionTarget === 'BOTH') {
        const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
        const checkOutDateTime = new Date(`${shiftDateStr}T${endTimeStr || '18:00'}:00`);
        const originalStatusNote = (freshLog?.status === 'ABSENT' || freshLog?.note?.includes('[ORIGINALLY: ABSENT]')) ? '[ORIGINALLY: ABSENT] ' : '';

        // Calculate isLate considering MULTIPLE_SHIFTS_ENABLED
        const { startTime: startTimeStr, lateBuffer: buffer, multipleShifts } = parseWorkConfig(masterOptions);
        const { maxShiftTimeStr } = getMaxShiftWithBuffer(masterOptions);
        const referenceStart = (multipleShifts?.enabled && maxShiftTimeStr) ? maxShiftTimeStr : startTimeStr;
        const isLate = checkIsLate(checkInDateTime, referenceStart, buffer);

        // Determine targetWorkType
        const targetWorkType = await deduceTargetWorkType({
            userId: request.userId,
            dateStr: shiftDateStr,
            requestReason: finalReason,
            existingNote: freshLog?.note,
            existingWorkType: freshLog?.work_type
        });

        // Clean up existing pending/provisional tags for FORGOT_BOTH
        const cleanedNote = cleanAttendanceNoteTags(freshLog?.note || '', request.type);

        const payload = buildAttendanceCorrectionPayload({
            userId: request.userId,
            date: shiftDateStr,
            type: 'FORGOT_BOTH',
            checkInTime: checkInDateTime.toISOString(),
            checkOutTime: checkOutDateTime.toISOString(),
            isLate,
            reason: finalReason,
            originalStatusNote,
            existingNote: cleanedNote,
            existingWorkType: freshLog?.work_type,
            targetWorkType
        });
        await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
    } else if (behavior?.correctionTarget === 'CHECKIN_ONLY') {
        const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
        const originalStatusNote = freshLog?.status === 'ABSENT' ? '[ORIGINALLY: ABSENT] ' : '';
        
        const cleanedNote = cleanAttendanceNoteTags(freshLog?.note || '', request.type);
 
        const { startTime: startTimeStr, lateBuffer: buffer, multipleShifts } = parseWorkConfig(masterOptions);
        const { maxShiftTimeStr } = getMaxShiftWithBuffer(masterOptions);
        const referenceStart = (multipleShifts?.enabled && maxShiftTimeStr) ? maxShiftTimeStr : startTimeStr;
        const isLate = checkIsLate(checkInDateTime, referenceStart, buffer);

        // Determine targetWorkType
        const targetWorkType = await deduceTargetWorkType({
            userId: request.userId,
            dateStr: shiftDateStr,
            requestReason: `${finalReason || ''} ${request.reason || ''}`,
            existingNote: freshLog?.note,
            existingWorkType: freshLog?.work_type
        });
 
        const payload = buildAttendanceCorrectionPayload({
            userId: request.userId,
            date: shiftDateStr,
            type: request.type as 'FORGOT_CHECKIN' | 'LATE_ENTRY',
            checkInTime: checkInDateTime.toISOString(),
            checkOutTime: freshLog?.check_out_time || undefined,
            isLate,
            reason: finalReason,
            originalStatusNote,
            existingNote: cleanedNote,
            existingWorkType: freshLog?.work_type,
            targetWorkType
        });
        await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
    } else if (behavior?.correctionTarget === 'CHECKOUT_ONLY') {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const checkOutDateTime = new Date(request.startDate);
        checkOutDateTime.setHours(hours, minutes, 0, 0);
        if (hours < 5) checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);

        const { data: freshLogCheckout } = await supabase
            .from('attendance_logs')
            .select('id, note, status, check_in_time')
            .eq('user_id', request.userId)
            .eq('date', shiftDateStr)
            .maybeSingle();

        if (freshLogCheckout) {
            const cleanedNoteStr = cleanAttendanceNoteTags(freshLogCheckout.note || '', request.type);

            const approvedTag = registryItem?.tags.approved || '[APPROVED CORRECTION]';
            const finalNote = mergeAttendanceNotes(cleanedNoteStr, `${approvedTag} ${finalReason}`);
            const resolvedStatus = resolveAttendanceLogStatus(
                freshLogCheckout.check_in_time,
                checkOutDateTime.toISOString(),
                finalNote
            );
            await supabase.from('attendance_logs').update({
                check_out_time: checkOutDateTime.toISOString(),
                status: resolvedStatus,
                note: finalNote
            }).eq('id', freshLogCheckout.id);

            await processAction(request.userId, 'ATTENDANCE_CHECK_OUT', { 
                time: timeStr,
                date: shiftDateStr
            });

            await processHpRefundIfEligible({
                userId: request.userId,
                dateStr: shiftDateStr,
                statusBefore: freshLogCheckout.status,
                noteBefore: freshLogCheckout.note,
                behavior,
                reason: finalReason,
                processAction
            });
        } else {
            const defaultStart = new Date(request.startDate);
            defaultStart.setHours(10, 0, 0, 0);
            await supabase.from('attendance_logs').insert({
                user_id: request.userId,
                date: shiftDateStr,
                check_in_time: defaultStart.toISOString(),
                check_out_time: checkOutDateTime.toISOString(),
                work_type: 'OFFICE',
                status: 'COMPLETED',
                note: `[AUTO-CREATED FOR ${request.type}] ${finalReason}`
            });
        }
    }

    if (behavior?.updateProfileOnline !== false && !freshLog?.check_out_time) {
        await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', request.userId);
    }

    if (behavior?.correctionTarget !== 'CHECKOUT_ONLY') {
        await processHpRefundIfEligible({
            userId: request.userId,
            dateStr: shiftDateStr,
            statusBefore: freshLog?.status,
            noteBefore: freshLog?.note,
            behavior,
            reason: finalReason,
            processAction
        });
    }

    if (behavior?.correctionTarget !== 'CHECKOUT_ONLY' && request.type !== 'LATE_ENTRY') {
        const { startTime: defaultStartTime, lateBuffer: buffer, multipleShifts } = parseWorkConfig(masterOptions);
        const { maxShiftTimeStr } = getMaxShiftWithBuffer(masterOptions);
        
        const referenceStartTime = (multipleShifts?.enabled && maxShiftTimeStr) ? maxShiftTimeStr : defaultStartTime;
        const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
        const isLate = checkIsLate(checkInDateTime, referenceStartTime, buffer);
        
        let lateMinutes = 0;
        let calculatedStatus: 'LATE' | 'ON_TIME' = 'ON_TIME';
        let checkInTimeForAction = timeStr;

        if (isLate || (behavior?.verifyLateness && isLate)) {
            calculatedStatus = 'LATE';
            lateMinutes = getLateMinutes(checkInDateTime, referenceStartTime, buffer);
        }

        if (calculatedStatus === 'LATE') {
            await processAction(request.userId, 'ATTENDANCE_LATE', { 
                status: 'LATE', 
                time: checkInTimeForAction,
                lateMinutes: lateMinutes,
                date: shiftDateStr
            });
        } else {
            await processAction(request.userId, 'ATTENDANCE_CHECK_IN', { 
                status: 'ON_TIME', 
                time: checkInTimeForAction,
                lateMinutes: 0,
                date: shiftDateStr
            });
        }

        if (behavior?.correctionTarget === 'BOTH') {
            await processAction(request.userId, 'ATTENDANCE_CHECK_OUT', { 
                time: endTimeStr || '18:00',
                date: shiftDateStr
            });
        }
    }
}

/**
 * Handles approval logic for Out of Range Checkout requests.
 * Delegates checkout and status correction to the unified correction flow.
 */
export async function approveOutOfRangeCheckoutRequest({
    request,
    customStartTime,
    masterOptions = [],
    processAction
}: {
    request: LeaveRequest;
    customStartTime?: string;
    masterOptions?: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    await approveAttendanceCorrection({
        request,
        customStartTime,
        masterOptions,
        processAction
    });
}

/**
 * Handles approval logic for Standard Leave requests: SICK, VACATION, PERSONAL, etc.
 */
export async function approveStandardLeave({
    request,
    processAction
}: {
    request: LeaveRequest;
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const days = eachDayOfInterval({ start: request.startDate, end: request.endDate });
    const dateStrings = days.map(d => format(d, 'yyyy-MM-dd'));

    const { data: existingLogs } = await supabase
        .from('attendance_logs')
        .select('date, note, check_in_time, check_out_time, work_type, status')
        .eq('user_id', request.userId)
        .in('date', dateStrings);

    const logs = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const existing = existingLogs?.find(l => l.date === dateStr);
        return buildAttendanceCorrectionPayload({
            userId: request.userId,
            date: dateStr,
            type: 'LEAVE',
            reason: request.reason,
            existingNote: existing?.note,
            leaveType: request.type,
            isHalfDay: request.isHalfDay || (request as any).is_half_day || false,
            halfDaySession: request.halfDaySession || (request as any).half_day_session || null,
            checkInTime: existing?.check_in_time,
            checkOutTime: existing?.check_out_time,
            existingWorkType: existing?.work_type,
            existingStatus: existing?.status
        });
    });

    await supabase.from('attendance_logs').upsert(logs, { onConflict: 'user_id, date' });
    await processAction(request.userId, 'ATTENDANCE_LEAVE', { type: request.type });
}

/**
 * Handles approval logic for GPS Spoof Appeal requests.
 */
export async function approveGpsSpoofAppealRequest({
    request,
    masterOptions = [],
    processAction
}: {
    request: LeaveRequest;
    masterOptions?: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');

    const { data: freshLog } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', request.userId)
        .eq('date', shiftDateStr)
        .maybeSingle();

    if (freshLog) {
        const cleanedNoteStr = cleanAttendanceNoteTags(freshLog.note || '', request.type, [
            '[PROVISIONAL_GPS_SPOOF_APPEAL]',
            '[GPS_SPOOF_APPEAL_PENDING]'
        ]);

        const cleanedReason = (request.reason || '')
            .replace(/\[PROVISIONAL_GPS_SPOOF_APPEAL\]/g, '')
            .replace(/\[GPS_SPOOF_APPEAL_PENDING\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const newNote = mergeAttendanceNotes(cleanedNoteStr, `[APPROVED GPS_SPOOF_APPEAL] อนุมัติการยื่นอุทธรณ์พิกัด GPS: ${cleanedReason}`);

        const finalStatus = resolveAttendanceLogStatus(
            freshLog.check_in_time ? new Date(freshLog.check_in_time).toISOString() : null,
            freshLog.check_out_time ? new Date(freshLog.check_out_time).toISOString() : null,
            newNote,
            freshLog.status
        );

        await supabase.from('attendance_logs').update({
            status: finalStatus,
            note: newNote
        }).eq('id', freshLog.id);

        // Award check-in points on GPS spoof appeal approval!
        if (freshLog.check_in_time) {
            const checkInDate = new Date(freshLog.check_in_time);
            const { startTime: startTimeStr, lateBuffer: buffer, multipleShifts } = parseWorkConfig(masterOptions);
            const isLate = checkIsLate(checkInDate, startTimeStr, buffer, freshLog.note, multipleShifts);
            const lateMinutes = isLate ? getLateMinutes(checkInDate, startTimeStr, buffer, freshLog.note, multipleShifts) : 0;

            await processAction(request.userId, 'ATTENDANCE_CHECK_IN', {
                status: isLate ? 'LATE' : 'ON_TIME',
                time: format(checkInDate, 'HH:mm'),
                lateMinutes: lateMinutes,
                date: checkInDate
            });
        }
    }
}

/**
 * Handles approval logic for GPS Spoof Out Appeal requests (Check-out).
 */
export async function approveGpsSpoofOutAppealRequest({
    request,
    masterOptions = [],
    processAction
}: {
    request: LeaveRequest;
    masterOptions?: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}) {
    const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');

    const { data: freshLog } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', request.userId)
        .eq('date', shiftDateStr)
        .maybeSingle();

    if (freshLog) {
        const cleanedNoteStr = cleanAttendanceNoteTags(freshLog.note || '', request.type, [
            '[PROVISIONAL_GPS_SPOOF_OUT]',
            '[GPS_SPOOF_OUT_PENDING]'
        ]);

        const cleanedReason = (request.reason || '')
            .replace(/\[PROVISIONAL_GPS_SPOOF_OUT\]/g, '')
            .replace(/\[GPS_SPOOF_OUT_PENDING\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const newNote = mergeAttendanceNotes(cleanedNoteStr, `[APPROVED GPS_SPOOF_OUT] อนุมัติการยื่นอุทธรณ์พิกัด GPS (ออกงาน): ${cleanedReason}`);

        const finalStatus = resolveAttendanceLogStatus(
            freshLog.check_in_time ? new Date(freshLog.check_in_time).toISOString() : null,
            freshLog.check_out_time ? new Date(freshLog.check_out_time).toISOString() : null,
            newNote,
            freshLog.status
        );

        await supabase.from('attendance_logs').update({
            status: finalStatus,
            note: newNote
        }).eq('id', freshLog.id);

        // Award check-out points on GPS spoof out appeal approval!
        if (freshLog.check_out_time) {
            const checkOutDate = new Date(freshLog.check_out_time);
            await processAction(request.userId, 'ATTENDANCE_CHECK_OUT', {
                time: format(checkOutDate, 'HH:mm'),
                date: shiftDateStr
            });
        }
    }
}


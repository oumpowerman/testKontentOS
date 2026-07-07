import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, RequestStatus } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { eachDayOfInterval, format, isValid } from 'date-fns';
import { useUserSession } from '../context/UserSessionContext';
import { useMasterData } from './useMasterData';
import { useGamification } from './useGamification';
import { isWorkingDay } from '../utils/judgeUtils';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { alignOtHoursWithClockOut, calculateEstimatedPayout } from '../utils/otCalculator';
import { attendanceService } from '../services/attendanceService';
import { mergeAttendanceNotes } from '../lib/attendanceUtils';

export const useAdminApprovals = (currentUser?: any, options: { enabled?: boolean } = {}) => {
    const { enabled = true } = options;
    const { 
        leaveRequests: contextLeaveRequests, 
        otRequests: contextOtRequests, 
        allUsers, 
        isReady: isContextReady, 
        refreshOTRequests 
    } = useUserSession();

    const { annualHolidays, calendarExceptions, masterOptions } = useMasterData();
    const { showConfirm } = useGlobalDialog();
    const { processAction } = useGamification();
    const [rawRequests, setRawRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
    const { showToast } = useToast();

    const fetchAllRequests = async () => {
        if (!enabled) return;
        setIsLoading(true);
        try {
            const data = await attendanceService.fetchCombinedRequests(undefined, { all: true, isAdmin: true });
            setRawRequests(data);
        } catch (err: any) {
            console.error("Fetch all requests failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRequestsForRange = async (start?: Date, end?: Date): Promise<LeaveRequest[]> => {
        if (!enabled) return [];
        setIsLoadingHistorical(true);
        try {
            const options: any = { all: true, isAdmin: true };
            if (start) options.startDate = format(start, 'yyyy-MM-dd');
            if (end) options.endDate = format(end, 'yyyy-MM-dd');
            const data = await attendanceService.fetchCombinedRequests(undefined, options);
            
            // Map users if they aren't fully merged
            return data.map(req => {
                if (req.user) return req;
                const user = allUsers.find(u => u.id === req.userId);
                return {
                    ...req,
                    user: user ? {
                        id: user.id,
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                        position: user.position
                    } : undefined
                };
            });
        } catch (err: any) {
            console.error("Fetch requests for range failed", err);
            showToast('ดึงข้อมูลประวัติย้อนหลังล้มเหลว', 'error');
            return [];
        } finally {
            setIsLoadingHistorical(false);
        }
    };

    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        if (currentUser?.role !== 'ADMIN') return;

        if (!isContextReady) {
            fetchAllRequests();
            return;
        }

        // Merge standard leaves and OT requests from context
        let combinedRequests = [...contextLeaveRequests];
        
        const mappedOtRequests: LeaveRequest[] = (contextOtRequests || []).map(r => ({
            id: r.id,
            userId: r.userId,
            type: 'OVERTIME' as LeaveType,
            startDate: new Date(r.date + 'T' + r.startTime),
            endDate: new Date(r.date + 'T' + r.endTime),
            reason: `[OT:${r.durationHours}hr] ${r.reason}`,
            status: r.status as RequestStatus,
            createdAt: new Date(r.createdAt),
            rejectionReason: r.rejectionReason,
            user: r.user,
            attachmentUrl: r.attachmentUrl
        }));

        combinedRequests = [...combinedRequests, ...mappedOtRequests];
        combinedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRawRequests(combinedRequests);
        setIsLoading(false);
    }, [currentUser?.role, contextLeaveRequests, contextOtRequests, isContextReady, enabled]);

    const requests = useMemo(() => {
        if (!enabled) return [];
        return rawRequests.map(req => {
            if (req.user) return req;
            const user = allUsers.find(u => u.id === req.userId);
            return {
                ...req,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    position: user.position
                } : undefined
            };
        });
    }, [rawRequests, allUsers, enabled]);

    const approveRequest = async (
        request: LeaveRequest, 
        customOtHours?: number, 
        customStartTime?: string, 
        customEndTime?: string,
        adminNote?: string
    ) => {
        if (!currentUser || currentUser.role !== 'ADMIN') {
            showToast('คุณไม่มีสิทธิ์ในการอนุมัติคำขอ', 'error');
            return;
        }

        const isDedicatedOtRequest = (contextOtRequests || []).some(ot => ot.id === request.id);
        if (isDedicatedOtRequest) {
            try {
                const otReq = (contextOtRequests || []).find(r => r.id === request.id);
                if (!otReq) throw new Error('ไม่พบข้อมูลคำขอ OT');

                let finalHours = otReq.durationHours;
                let checkOutMsg = '';

                if (customOtHours !== undefined) {
                    finalHours = customOtHours;
                } else {
                    // Get actual clock-out logs from DB
                    const { data: attendanceLogs } = await supabase
                        .from('attendance_logs')
                        .select('*')
                        .eq('user_id', otReq.userId);

                    const employeeLog = (attendanceLogs || []).find(
                        log => log.user_id === otReq.userId && log.date === otReq.date
                    );

                    const aligned = alignOtHoursWithClockOut(
                        otReq.date,
                        otReq.startTime,
                        otReq.endTime,
                        otReq.durationHours,
                        employeeLog?.check_out_time
                    );
                    finalHours = aligned.finalHours;
                    checkOutMsg = aligned.message;
                }

                // Recalculate estimated payout based on final verified hours
                const baseSalary = otReq.baseSalaryAtTime || 0;
                let multiplier = 1.5;
                if (otReq.type === 'HOLIDAY_OVERTIME') multiplier = 3.0;
                else if (otReq.type === 'HOLIDAY') multiplier = 2.0;

                const finalPayout = calculateEstimatedPayout(baseSalary, finalHours, multiplier);

                const updatePayload: any = {
                    duration_hours: finalHours,
                    computed_payout: finalPayout,
                    approved_by: currentUser.id,
                    approved_at: new Date().toISOString()
                };

                if (customStartTime) updatePayload.start_time = customStartTime;
                if (customEndTime) updatePayload.end_time = customEndTime;

                // Construct audit log and merge with adminNote
                const isTimeModified = (customStartTime && customStartTime !== otReq.startTime) || 
                                       (customEndTime && customEndTime !== otReq.endTime) || 
                                       (customOtHours !== undefined && customOtHours !== otReq.durationHours);

                let auditLogText = '';
                if (isTimeModified) {
                    const origStartStr = otReq.startTime.substring(0, 5);
                    const origEndStr = otReq.endTime.substring(0, 5);
                    const newStartStr = (customStartTime || otReq.startTime).substring(0, 5);
                    const newEndStr = (customEndTime || otReq.endTime).substring(0, 5);
                    
                    auditLogText = `⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• เวลาเดิม: ${origStartStr} - ${origEndStr} น. (${otReq.durationHours.toFixed(2)} ชม.)\n• เวลาใหม่: ${newStartStr} - ${newEndStr} น. (${finalHours.toFixed(2)} ชม.)`;
                }

                let finalDbNote = '';
                if (auditLogText) {
                    finalDbNote = auditLogText;
                    if (adminNote) {
                        finalDbNote += `\n----------------------------------\n📝 บันทึกจากแอดมิน: ${adminNote}`;
                    }
                } else if (adminNote) {
                    finalDbNote = adminNote;
                }

                if (finalDbNote) {
                    updatePayload.rejection_reason = finalDbNote; // Save combined note in rejection_reason column
                }

                await attendanceService.updateOtRequestStatus(otReq.id, 'APPROVED', updatePayload);

                const dateDisplay = format(new Date(otReq.date), 'd MMM yyyy');
                
                // Build a custom notification message with edit logs
                let notifMsg = `คำขอ OT วันที่: ${dateDisplay} (${finalHours} ชม.) ได้รับการอนุมัติแล้ว\nรายละเอียดเดิม: ${otReq.reason}`;
                
                if (isTimeModified) {
                    const origStartStr = otReq.startTime.substring(0, 5);
                    const origEndStr = otReq.endTime.substring(0, 5);
                    const newStartStr = (customStartTime || otReq.startTime).substring(0, 5);
                    const newEndStr = (customEndTime || otReq.endTime).substring(0, 5);
                    
                    notifMsg += `\n\n⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• เวลาเดิม: ${origStartStr} - ${origEndStr} น. (${otReq.durationHours} ชม.)\n• เวลาใหม่: ${newStartStr} - ${newEndStr} น. (${finalHours} ชม.)`;
                }
                
                if (adminNote) {
                    notifMsg += `\n\n📝 บันทึกจากแอดมิน: ${adminNote}`;
                }

                await supabase.from('notifications').insert({
                    user_id: otReq.userId,
                    type: 'INFO',
                    title: '✅ อนุมัติคำขอพิเศษ (OT)',
                    message: notifMsg,
                    is_read: false,
                    link_path: 'ATTENDANCE'
                });

                await supabase.from('team_messages').insert({
                    content: `✅ คำขอ OT ของ **${request.user?.name || 'พนักงาน'}** วันที่ ${dateDisplay} (${finalHours} ชม.) ได้รับการอนุมัติแล้ว${checkOutMsg}${adminNote ? `\n📝 บันทึก: ${adminNote}` : ''}`,
                    is_bot: true,
                    message_type: 'TEXT',
                    user_id: null
                });

                showToast(`อนุมัติคำขอ OT เรียบร้อยแล้ว${checkOutMsg} 🎉`, 'success');
                if (refreshOTRequests) {
                    await refreshOTRequests();
                }
                fetchAllRequests();
            } catch (err: any) {
                showToast('อนุมัติ OT ล้มเหลว: ' + err.message, 'error');
            }
            return;
        }

        const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'];
        const CORRECTION_TYPES = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'];
        const SPECIAL_TYPES = ['WFH', 'OVERTIME'];

        let finalDbNote = adminNote || '';
        let isTimeModified = false;
        let updatedReason = request.reason;

        if (request.type === 'OVERTIME') {
            isTimeModified = (customStartTime !== undefined) || (customEndTime !== undefined) || (customOtHours !== undefined);
            if (isTimeModified) {
                let cleanReasonText = request.reason || '';
                const otRangeMatch = cleanReasonText.match(/\[OT:(\d{2}:\d{2}-\d{2}:\d{2})\]/);
                const originalTimeRange = otRangeMatch ? otRangeMatch[1] : '18:30-20:30';
                const [origStart, origEnd] = originalTimeRange.split('-');
                
                const otHoursMatch = cleanReasonText.match(/\(([\d\.]+)hr\)/) || cleanReasonText.match(/\[OT:([\d\.]+)hr\]/);
                const origHours = otHoursMatch ? parseFloat(otHoursMatch[1]) : 2.0;

                // Clean all OT tags from the reason
                cleanReasonText = cleanReasonText
                    .replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]\s*\([\d\.]+hr\)\s*/g, '')
                    .replace(/\[OT:[\d\.]+hr\]\s*/g, '')
                    .replace(/\[OT_MINUTES:\d+\]/g, '')
                    .trim();

                const newStart = customStartTime || origStart;
                const newEnd = customEndTime || origEnd;
                const newHours = customOtHours !== undefined ? customOtHours : origHours;

                updatedReason = `[OT:${newStart}-${newEnd}] (${newHours}hr) ${cleanReasonText}`;
                
                // Construct audit log for general leave overtime request
                const origStartStr = origStart.substring(0, 5);
                const origEndStr = origEnd.substring(0, 5);
                const newStartStr = newStart.substring(0, 5);
                const newEndStr = newEnd.substring(0, 5);
                
                const auditLogText = `⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• เวลาเดิม: ${origStartStr} - ${origEndStr} น. (${origHours.toFixed(2)} ชม.)\n• เวลาใหม่: ${newStartStr} - ${newEndStr} น. (${newHours.toFixed(2)} ชม.)`;
                
                if (adminNote) {
                    finalDbNote = `${auditLogText}\n----------------------------------\n📝 บันทึกจากแอดมิน: ${adminNote}`;
                } else {
                    finalDbNote = auditLogText;
                }
            }
        }

        // Optimistic Update
        setRawRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'APPROVED', rejectionReason: finalDbNote } : r));

        try {
            if (request.type === 'OVERTIME' && isTimeModified) {
                await supabase.from('leave_requests')
                    .update({ reason: updatedReason })
                    .eq('id', request.id);
            }

            await attendanceService.updateLeaveRequestStatus(request.id, 'APPROVED', { 
                approver_id: currentUser.id,
                rejection_reason: finalDbNote // ส่งตัวแปร string ไปตรงๆ ได้เลยครับ (หรือใช้ finalDbNote || "")
            });

            let notifTitle = '✅ คำขอได้รับการอนุมัติ';
            if (CORRECTION_TYPES.includes(request.type)) notifTitle = '🛠️ อนุมัติการแก้ไขเวลา';
            if (SPECIAL_TYPES.includes(request.type)) notifTitle = '✨ อนุมัติคำขอพิเศษ';

            const dateDisplay = format(request.startDate, 'd MMM yyyy');
            const fullDateDisplay = request.startDate.getTime() === request.endDate.getTime() 
                ? dateDisplay 
                : `${dateDisplay} - ${format(request.endDate, 'd MMM yyyy')}`;

            let notifMsg = `รายการ: ${request.type === 'OVERTIME' ? 'ขอ OT' : request.type}\nวันที่: ${fullDateDisplay}`;
            
            if (request.type === 'OVERTIME' && isTimeModified) {
                notifMsg += `\n\n⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• รายละเอียดเดิม: ${request.reason}\n• รายละเอียดใหม่: ${updatedReason}`;
            } else {
                notifMsg += `\nรายละเอียด: ${request.reason || '-'}`;
            }
            
            if (adminNote) {
                notifMsg += `\n\n📝 บันทึกจากแอดมิน: ${adminNote}`;
            }

            await supabase.from('notifications').insert({
                user_id: request.userId,
                type: 'INFO',
                title: notifTitle,
                message: notifMsg,
                is_read: false,
                link_path: 'ATTENDANCE'
            });

            // Special work handling (WFH / OVERTIME)
            if (SPECIAL_TYPES.includes(request.type)) {
                if (request.type === 'WFH') {
                    await supabase.from('team_messages').insert({
                        content: `🏠 **${request.user?.name}** ได้รับอนุมัติ WFH (อย่าลืม Check-in เมื่อเริ่มงานนะ!)`,
                        is_bot: true,
                        message_type: 'TEXT',
                        user_id: null
                    });
                    showToast('อนุมัติ WFH เรียบร้อย', 'success');
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

                    showToast(`อนุมัติการทำ OT เรียบร้อย มอบแต้มสำหรับ ${otHours} ชม.`, 'success');
                }
                return;
            }

            // Correction handling
            if (CORRECTION_TYPES.includes(request.type)) {
                const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})(-\d{2}:\d{2})?\]/);
                const timeStr = timeMatch ? timeMatch[1] : '00:00';
                const endTimeStr = timeMatch && timeMatch[2] ? timeMatch[2].substring(1) : null;
                const shiftDateStr = format(request.startDate, 'yyyy-MM-dd');

                const { data: freshLog } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', request.userId)
                    .eq('date', shiftDateStr)
                    .maybeSingle();

                if (request.type === 'LATE_ENTRY' && freshLog) {
                    const newNote = `${freshLog.note || ''} [APPROVED LATE_ENTRY] ${request.reason}`.replace('[APPEAL_PENDING]', '').trim();
                    await supabase.from('attendance_logs')
                        .update({ status: 'WORKING', note: newNote })
                        .eq('id', freshLog.id);
                } else if (request.type === 'FORGOT_BOTH') {
                    const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
                    const checkOutDateTime = new Date(`${shiftDateStr}T${endTimeStr || '18:00'}:00`);
                    const originalStatusNote = freshLog?.status === 'ABSENT' ? '[ORIGINALLY: ABSENT] ' : '';

                    const payload = {
                        user_id: request.userId,
                        date: shiftDateStr,
                        check_in_time: checkInDateTime.toISOString(),
                        check_out_time: checkOutDateTime.toISOString(),
                        work_type: 'OFFICE',
                        status: 'COMPLETED',
                        note: mergeAttendanceNotes(freshLog?.note, `${originalStatusNote}[APPROVED FORGOT_BOTH] ${request.reason}`)
                    };
                    await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
                } else if (request.type === 'FORGOT_CHECKIN' || request.type === 'LATE_ENTRY') {
                    const checkInDateTime = new Date(`${shiftDateStr}T${timeStr}:00`);
                    const originalStatusNote = freshLog?.status === 'ABSENT' ? '[ORIGINALLY: ABSENT] ' : '';
                    const payload = {
                        user_id: request.userId,
                        date: shiftDateStr,
                        check_in_time: checkInDateTime.toISOString(),
                        work_type: 'OFFICE',
                        status: 'WORKING',
                        note: mergeAttendanceNotes(freshLog?.note, `${originalStatusNote}[APPROVED ${request.type}] ${request.reason}`)
                    };
                    await supabase.from('attendance_logs').upsert(payload, { onConflict: 'user_id, date' });
                }

                if (request.type !== 'FORGOT_BOTH') {
                    await supabase.from('profiles').update({ work_status: 'ONLINE' }).eq('id', request.userId);
                }

                // Refund HP
                const isLateSubmission = request.reason.includes('[LATE_SUBMISSION]');
                if (!isLateSubmission) {
                    if (freshLog?.status === 'ABSENT') {
                        await processAction(request.userId, 'ATTENDANCE_ABSENT_REFUND', {
                            originalDescription: `คืนค่า HP จากการแก้สถานะขาดงานวันที่ ${shiftDateStr}`
                        });
                    } else if (freshLog?.note?.includes('[SYSTEM] Penalized')) {
                        await processAction(request.userId, 'ATTENDANCE_CORRECTION_REFUND', {
                            originalDescription: `คืนค่า HP จากการแก้เวลาออกงานวันที่ ${shiftDateStr}`
                        });
                    }
                }

                if (request.type !== 'FORGOT_CHECKOUT') {
                    await processAction(request.userId, 'ATTENDANCE_CHECK_IN', { 
                        status: request.type === 'LATE_ENTRY' ? 'LATE' : 'ON_TIME', 
                        time: timeStr 
                    });

                    if (request.type === 'FORGOT_BOTH') {
                        await processAction(request.userId, 'ATTENDANCE_CHECK_OUT', { 
                            time: endTimeStr || '18:00',
                            date: shiftDateStr
                        });
                    }
                } else if (request.type === 'FORGOT_CHECKOUT') {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const checkOutDateTime = new Date(request.startDate);
                    checkOutDateTime.setHours(hours, minutes, 0, 0);
                    if (hours < 5) checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);

                    const { data: freshLogCheckout } = await supabase
                        .from('attendance_logs')
                        .select('id, note, status')
                        .eq('user_id', request.userId)
                        .eq('date', shiftDateStr)
                        .maybeSingle();

                    if (freshLogCheckout) {
                        await supabase.from('attendance_logs').update({
                            check_out_time: checkOutDateTime.toISOString(),
                            status: 'COMPLETED',
                            note: mergeAttendanceNotes(freshLogCheckout.note, `[APPROVED CORRECTION] ${request.reason}`)
                        }).eq('id', freshLogCheckout.id);

                        await processAction(request.userId, 'ATTENDANCE_CHECK_OUT', { 
                            time: timeStr,
                            date: shiftDateStr
                        });

                        const isCheckoutLateSub = request.reason.includes('[LATE_SUBMISSION]');
                        if (!isCheckoutLateSub) {
                            if (freshLogCheckout.status === 'ABSENT') {
                                await processAction(request.userId, 'ATTENDANCE_ABSENT_REFUND', {
                                    originalDescription: `คืนค่า HP จากการแก้เวลาออกงานวันที่ ${shiftDateStr}`
                                });
                            } else if (freshLogCheckout.note?.includes('[SYSTEM] Penalized')) {
                                await processAction(request.userId, 'ATTENDANCE_CORRECTION_REFUND', {
                                    originalDescription: `คืนค่า HP จากการแก้เวลาออกงานวันที่ ${shiftDateStr}`
                                });
                            }
                        }
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
                            note: `[AUTO-CREATED FOR CHECKOUT] ${request.reason}`
                        });
                    }
                }
                showToast('ปรับปรุงข้อมูลเวลาให้เรียบร้อยแล้ว ✅', 'success');
            }

            // Leave requests handling
            else if (LEAVE_TYPES.includes(request.type)) {
                if (request.startDate > request.endDate) {
                    showToast('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุดครับ', 'error');
                    setRawRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'PENDING' } : r));
                    return;
                }

                // Check Quota and Warn Admin
                const selectedOption = (masterOptions || []).find(o => o.key === request.type);
                let limit = 999;
                if (selectedOption?.description) {
                    try {
                        const metadata = JSON.parse(selectedOption.description);
                        limit = metadata.defaultQuota || 999;
                    } catch (e) {
                        // ignore
                    }
                }

                if (limit < 999) {
                    // Fetch existing approved requests
                    const { data: userApprovedRequests } = await supabase
                        .from('leave_requests')
                        .select('*')
                        .eq('user_id', request.userId)
                        .eq('type', request.type)
                        .eq('status', 'APPROVED')
                        .neq('id', request.id); // Exclude current request

                    let approvedDaysCount = 0;
                    if (userApprovedRequests) {
                        for (const req of userApprovedRequests) {
                            const start = new Date(req.start_date);
                            const end = new Date(req.end_date);
                            if (isValid(start) && isValid(end) && start <= end) {
                                const days = eachDayOfInterval({ start, end });
                                const workingDaysCount = days.filter(d => 
                                    isWorkingDay(d, annualHolidays || [], calendarExceptions || [], request.user as any)
                                ).length;
                                approvedDaysCount += workingDaysCount;
                            }
                        }
                    }

                    // Calculate days for current request
                    const days = eachDayOfInterval({ start: request.startDate, end: request.endDate });
                    const currentRequestedDays = days.filter(d => 
                        isWorkingDay(d, annualHolidays || [], calendarExceptions || [], request.user as any)
                    ).length;

                    const totalUsedIfApproved = approvedDaysCount + currentRequestedDays;

                    if (totalUsedIfApproved > limit) {
                        const confirmed = await showConfirm(
                            `พนักงานท่านนี้ (${request.user?.name || 'พนักงาน'}) มีวันลาประเภท ${request.type} ที่ได้รับอนุมัติแล้ว ${approvedDaysCount} วัน และคำขอนี้ต้องการลาอีก ${currentRequestedDays} วัน ซึ่งรวมเป็น ${totalUsedIfApproved} วัน เกินจากโควต้าที่ระบุไว้สูงสุดที่ ${limit} วัน\n\nคุณแน่ใจหรือไม่ที่จะอนุมัติคำขอนี้?`,
                            '⚠️ อนุมัติเกินโควต้า'
                        );
                        if (!confirmed) {
                            setRawRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'PENDING' } : r));
                            return;
                        }
                    }
                }

                const days = eachDayOfInterval({ start: request.startDate, end: request.endDate });
                const dateStrings = days.map(d => format(d, 'yyyy-MM-dd'));

                const { data: existingLogs } = await supabase
                    .from('attendance_logs')
                    .select('date, note')
                    .eq('user_id', request.userId)
                    .in('date', dateStrings);

                const logs = days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const existing = existingLogs?.find(l => l.date === dateStr);
                    return {
                        user_id: request.userId,
                        date: dateStr,
                        work_type: 'LEAVE',
                        status: 'LEAVE',
                        note: mergeAttendanceNotes(existing?.note, `[APPROVED LEAVE: ${request.type}] ${request.reason}`)
                    };
                });

                await supabase.from('attendance_logs').upsert(logs, { onConflict: 'user_id, date' });
                await processAction(request.userId, 'ATTENDANCE_LEAVE', { type: request.type });
                showToast(`อนุมัติวันลา (${request.type}) และลงบันทึกแล้ว ✅`, 'success');
            }

            await supabase.from('team_messages').insert({
                content: `✅ คำขอของ **${request.user?.name}** (${request.type}) ได้รับการอนุมัติแล้ว`,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });
            
            fetchAllRequests();
        } catch (err: any) {
            setRawRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'PENDING' } : r));
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    const rejectRequest = async (id: string, reason: string) => {
        if (!currentUser || currentUser.role !== 'ADMIN') {
            showToast('คุณไม่มีสิทธิ์ในการปฏิเสธคำขอ', 'error');
            return;
        }

        const isDedicatedOtRequest = (contextOtRequests || []).some(ot => ot.id === id);
        if (isDedicatedOtRequest) {
            try {
                const otReq = (contextOtRequests || []).find(r => r.id === id);
                if (!otReq) throw new Error('ไม่พบข้อมูลคำขอ OT');

                await supabase
                    .from('ot_requests')
                    .update({
                        status: 'REJECTED',
                        rejection_reason: reason,
                        approved_by: currentUser.id,
                        approved_at: new Date().toISOString()
                    })
                    .eq('id', id);

                const dateDisplay = format(new Date(otReq.date), 'd MMM yyyy');
                await supabase.from('notifications').insert({
                    user_id: otReq.userId,
                    type: 'INFO',
                    title: '❌ ปฏิเสธคำขอพิเศษ (OT)',
                    message: `คำขอ OT วันที่: ${dateDisplay} ถูกปฏิเสธ\nเหตุผล: ${reason}`,
                    is_read: false,
                    link_path: 'ATTENDANCE'
                });

                showToast('ปฏิเสธคำขอ OT เรียบร้อย', 'info');
                if (refreshOTRequests) {
                    await refreshOTRequests();
                }
                fetchAllRequests();
            } catch (err: any) {
                showToast('ปฏิเสธ OT ล้มเหลว: ' + err.message, 'error');
            }
            return;
        }

        const targetReq = requests.find(r => r.id === id);
        setRawRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED', rejectionReason: reason } : r));

        try {
            const { data: req } = await supabase.from('leave_requests').select('*').eq('id', id).single();
            await attendanceService.updateLeaveRequestStatus(id, 'REJECTED', {
                approver_id: currentUser.id,
                rejection_reason: reason
            });

            if (req && req.type === 'FORGOT_CHECKOUT') {
                 await supabase.from('attendance_logs').update({ status: 'ACTION_REQUIRED' }).eq('user_id', req.user_id).eq('date', req.start_date);
            }

            if (req && req.type === 'OVERTIME') {
                const dateStr = req.start_date;
                const { data: freshLog } = await supabase.from('attendance_logs')
                    .select('id, note')
                    .eq('user_id', req.user_id)
                    .eq('date', dateStr)
                    .maybeSingle();

                if (freshLog) {
                    const newNote = (freshLog.note || '').replace('[OT_PENDING:', '[OT_REJECTED:').trim();
                    await supabase.from('attendance_logs').update({ note: newNote }).eq('id', freshLog.id);
                }
            }

            if (targetReq) {
                const dateDisplay = format(targetReq.startDate, 'd MMM yyyy');
                await supabase.from('notifications').insert({
                    user_id: targetReq.userId,
                    type: 'INFO',
                    title: '❌ ปฏิเสธคำขอ',
                    message: `คำขอประเภท: ${targetReq.type} วันที่: ${dateDisplay} ถูกปฏิเสธ\nเหตุผล: ${reason}`,
                    is_read: false,
                    link_path: 'ATTENDANCE'
                });

                await supabase.from('team_messages').insert({
                    content: `❌ คำขอของ **${targetReq.user?.name || 'พนักงาน'}** (${targetReq.type}) ถูกปฏิเสธ`,
                    is_bot: true,
                    message_type: 'TEXT',
                    user_id: null
                });
            }

            showToast('ปฏิเสธคำขอเรียบร้อย', 'info');
            fetchAllRequests();
        } catch (err: any) {
            setRawRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'PENDING' } : r));
            showToast('ปฏิเสธคำขอล้มเหลว: ' + err.message, 'error');
        }
    };

    return {
        requests,
        isLoading,
        isLoadingHistorical,
        approveRequest,
        rejectRequest,
        fetchAllRequests,
        fetchRequestsForRange
    };
};

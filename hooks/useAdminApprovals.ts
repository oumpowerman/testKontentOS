import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, RequestStatus } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { eachDayOfInterval, format, isValid } from 'date-fns';
import { useUserSession } from '../context/UserSessionContext';
import { useMasterData } from './useMasterData';
import { useGamification } from './useGamification';
import { isWorkingDay } from '../utils/judgeUtils';
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

    const { annualHolidays, calendarExceptions } = useMasterData();
    const { processAction } = useGamification();
    const [rawRequests, setRawRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
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
            user: r.user
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

    const approveRequest = async (request: LeaveRequest) => {
        if (!currentUser || currentUser.role !== 'ADMIN') {
            showToast('คุณไม่มีสิทธิ์ในการอนุมัติคำขอ', 'error');
            return;
        }

        const isDedicatedOtRequest = (contextOtRequests || []).some(ot => ot.id === request.id);
        if (isDedicatedOtRequest) {
            try {
                const otReq = (contextOtRequests || []).find(r => r.id === request.id);
                if (!otReq) throw new Error('ไม่พบข้อมูลคำขอ OT');

                // Get actual clock-out logs from DB
                const { data: attendanceLogs } = await supabase
                    .from('attendance_logs')
                    .select('*')
                    .eq('user_id', otReq.userId);

                const employeeLog = (attendanceLogs || []).find(
                    log => log.user_id === otReq.userId && log.date === otReq.date
                );

                const { finalHours, message: checkOutMsg } = alignOtHoursWithClockOut(
                    otReq.date,
                    otReq.startTime,
                    otReq.endTime,
                    otReq.durationHours,
                    employeeLog?.check_out_time
                );

                // Recalculate estimated payout based on final verified hours
                const baseSalary = otReq.baseSalaryAtTime || 0;
                let multiplier = 1.5;
                if (otReq.type === 'HOLIDAY_OVERTIME') multiplier = 3.0;
                else if (otReq.type === 'HOLIDAY') multiplier = 2.0;

                const finalPayout = calculateEstimatedPayout(baseSalary, finalHours, multiplier);

                await attendanceService.updateOtRequestStatus(otReq.id, 'APPROVED', {
                    duration_hours: finalHours,
                    computed_payout: finalPayout,
                    approved_by: currentUser.id,
                    approved_at: new Date().toISOString()
                });

                const dateDisplay = format(new Date(otReq.date), 'd MMM yyyy');
                await supabase.from('notifications').insert({
                    user_id: otReq.userId,
                    type: 'INFO',
                    title: '✅ อนุมัติคำขอพิเศษ (OT)',
                    message: `คำขอ OT วันที่: ${dateDisplay} (${finalHours} ชม.) ได้รับการอนุมัติแล้ว\nรายละเอียด: ${otReq.reason}`,
                    is_read: false,
                    link_path: 'ATTENDANCE'
                });

                await supabase.from('team_messages').insert({
                    content: `✅ คำขอ OT ของ **${request.user?.name || 'พนักงาน'}** วันที่ ${dateDisplay} (${finalHours} ชม.) ได้รับการอนุมัติแล้ว${checkOutMsg}`,
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

        // Optimistic Update
        setRawRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'APPROVED' } : r));

        try {
            await attendanceService.updateLeaveRequestStatus(request.id, 'APPROVED', { approver_id: currentUser.id });

            let notifTitle = '✅ คำขอได้รับการอนุมัติ';
            if (CORRECTION_TYPES.includes(request.type)) notifTitle = '🛠️ อนุมัติการแก้ไขเวลา';
            if (SPECIAL_TYPES.includes(request.type)) notifTitle = '✨ อนุมัติคำขอพิเศษ';

            const dateDisplay = format(request.startDate, 'd MMM yyyy');
            const fullDateDisplay = request.startDate.getTime() === request.endDate.getTime() 
                ? dateDisplay 
                : `${dateDisplay} - ${format(request.endDate, 'd MMM yyyy')}`;

            await supabase.from('notifications').insert({
                user_id: request.userId,
                type: 'INFO',
                title: notifTitle,
                message: `รายการ: ${request.type}\nวันที่: ${fullDateDisplay}\nรายละเอียด: ${request.reason || '-'}`,
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

                    const otMinutesMatch = request.reason ? request.reason.match(/\[OT_MINUTES:(\d+)\]/) : null;
                    const otMinutes = otMinutesMatch ? parseInt(otMinutesMatch[1], 10) : 60;
                    const otHours = parseFloat((otMinutes / 60).toFixed(1));

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
                    return;
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
        approveRequest,
        rejectRequest,
        fetchAllRequests
    };
};

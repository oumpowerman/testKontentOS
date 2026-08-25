import { supabase } from '../lib/supabase';
import { LeaveRequest } from '../types/attendance';
import { ATTENDANCE_REGISTRY } from '../constants/attendanceRegistry';
import { format } from 'date-fns';
import { alignOtHoursWithClockOut, calculateEstimatedPayout } from '../utils/otCalculator';
import { attendanceService } from './attendanceService';
import { buildOtAuditLog } from '../utils/adminApprovalHelpers';
import {
    approveSpecialWorkRequest,
    approveAttendanceCorrection,
    approveStandardLeave,
    approveOutOfRangeCheckoutRequest,
    approveGpsSpoofAppealRequest,
    approveGpsSpoofOutAppealRequest
} from './admin-approval/approvalFlows';
import {
    rejectWfhOnsiteRequest,
    rejectForgotCheckInRequest,
    rejectLateEntryRequest,
    rejectForgotCheckOutRequest,
    rejectOutOfRangeCheckoutRequest,
    rejectGpsSpoofAppealRequest,
    rejectGpsSpoofOutAppealRequest,
    rejectForgotBothRequest
} from './admin-approval/rejectionFlows';
import {
    sendApprovalNotification,
    sendRejectionNotification,
    publishToTeamChannel,
    sendGroupSummaryNotification
} from './admin-approval/communicationHelpers';

export function translateRequestType(type: string): string {
    const mapping: Record<string, string> = {
        'SICK': 'ลาป่วย',
        'VACATION': 'พักร้อน',
        'PERSONAL': 'ลากิจ',
        'EMERGENCY': 'ลาฉุกเฉิน',
        'WFH': 'Work From Home (WFH)',
        'OVERTIME': 'ขอปฏิบัติงานล่วงเวลา (OT)',
        'ONSITE': 'ปฏิบัติงานนอกสถานที่',
        'LATE_ENTRY': 'แจ้งเข้าสาย / แก้ไขเวลาเข้างาน',
        'FORGOT_CHECKIN': 'ลืมลงเวลาเข้า (Forgot Check-in)',
        'FORGOT_CHECKOUT': 'ลืมลงเวลาออก (Forgot Check-out)',
        'FORGOT_BOTH': 'ลืมทั้งเข้า-ออก (Forgot Both)',
        'UNPAID': 'ลาไม่รับค่าจ้าง (Unpaid Leave)',
        'OUT_OF_RANGE_CHECKOUT': 'สแกนออกนอกพื้นที่ (Out of Range Checkout)',
        'GPS_SPOOF_APPEAL': 'อุทธรณ์พิกัด GPS คลาดเคลื่อน'
    };
    return mapping[type] || type;
}

export interface ApproveOtRequestParams {
    otReq: any;
    currentUser: any;
    customOtHours?: number;
    customStartTime?: string;
    customEndTime?: string;
    adminNote?: string;
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
    forceFullHours?: boolean;
}

export interface ApproveLeaveRequestParams {
    request: LeaveRequest;
    currentUser: any;
    customOtHours?: number;
    customStartTime?: string;
    customEndTime?: string;
    adminNote?: string;
    masterOptions: any[];
    annualHolidays: any[];
    calendarExceptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
}

export interface RejectRequestParams {
    id: string;
    reason: string;
    currentUser: any;
    isDedicatedOtRequest: boolean;
    otReq?: any;
    targetReq?: LeaveRequest;
    customCheckInTime?: string;
    masterOptions: any[];
    processAction: (userId: string, actionType: any, payload?: any) => Promise<any>;
    rejectionMode?: 'ABSENT' | 'ACTION_REQUIRED' | 'KEEP_WORKING';
}

export const adminApprovalService = {
    /**
     * Approves a dedicated OT request (from the `ot_requests` table).
     */
    async approveOtRequestTransaction({
        otReq,
        currentUser,
        customOtHours,
        customStartTime,
        customEndTime,
        adminNote,
        processAction,
        forceFullHours
    }: ApproveOtRequestParams): Promise<{ success: boolean; checkOutMsg: string }> {
        const isFixedOt = otReq.isFixed || (otReq.reason && otReq.reason.includes('[OT:FIXED]'));

        let finalHours = otReq.durationHours;
        let checkOutMsg = '';

        if (customOtHours !== undefined) {
            finalHours = customOtHours;
        } else if (isFixedOt) {
            finalHours = 0;
            checkOutMsg = '';
        } else if (forceFullHours) {
            finalHours = otReq.durationHours;
            checkOutMsg = ' (อนุมัติเวลาเต็มจำนวนตามคำขอเป็นกรณีพิเศษ)';
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

        const finalPayout = isFixedOt ? 0 : calculateEstimatedPayout(baseSalary, finalHours, multiplier);

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

        const { finalDbNote } = buildOtAuditLog(
            otReq.startTime,
            otReq.endTime,
            otReq.durationHours,
            customStartTime || otReq.startTime,
            customEndTime || otReq.endTime,
            finalHours,
            adminNote,
            isTimeModified,
            isFixedOt
        );

        if (finalDbNote) {
            updatePayload.rejection_reason = finalDbNote; // Save combined note in rejection_reason column
        }

        await attendanceService.updateOtRequestStatus(otReq.id, 'APPROVED', updatePayload);

        const dateDisplay = format(new Date(otReq.date), 'd MMM yyyy');
        
        // Build a custom notification message with edit logs
        let notifMsg = `คำขอ OT วันที่: ${dateDisplay} (${finalHours} ชม.) ได้รับการอนุมัติแล้ว\nรายละเอียดเดิม: ${otReq.reason}`;
        
        if (isFixedOt) {
            notifMsg += `\n\n⚙️ [อนุมัติ OT แบบเหมาจ่าย (Lump-sum)]`;
        } else if (isTimeModified) {
            const origStartStr = otReq.startTime.substring(0, 5);
            const origEndStr = otReq.endTime.substring(0, 5);
            const newStartStr = (customStartTime || otReq.startTime).substring(0, 5);
            const newEndStr = (customEndTime || otReq.endTime).substring(0, 5);
            
            notifMsg += `\n\n⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• เวลาเดิม: ${origStartStr} - ${origEndStr} น. (${otReq.durationHours} ชม.)\n• เวลาใหม่: ${newStartStr} - ${newEndStr} น. (${finalHours} ชม.)`;
        }
        
        if (adminNote) {
            notifMsg += `\n\n📝 บันทึกจากแอดมิน: ${adminNote}`;
        }

        await sendApprovalNotification(otReq.userId, '✅ อนุมัติคำขอพิเศษ (OT)', notifMsg, otReq.id, { request_type: 'OT' });

        await publishToTeamChannel(`✅ คำขอ OT ของ **${otReq.user?.name || 'พนักงาน'}** วันที่ ${dateDisplay} (${finalHours} ชม.) ได้รับการอนุมัติแล้ว${checkOutMsg}${adminNote ? `\n📝 บันทึก: ${adminNote}` : ''}`);

        await sendGroupSummaryNotification(
            otReq.userId,
            otReq.user?.name || 'พนักงาน',
            translateRequestType('OVERTIME'),
            currentUser.name || currentUser.full_name || 'ผู้พิจารณา (Admin)',
            'อนุมัติแล้ว ✅',
            adminNote,
            otReq.id,
            { request_type: 'OT' }
        );

        return { success: true, checkOutMsg };
    },

    /**
     * Approves a leave or attendance correction request (from the `leave_requests` table).
     */
    async approveLeaveOrCorrectionTransaction({
        request,
        currentUser,
        customOtHours,
        customStartTime,
        customEndTime,
        adminNote,
        masterOptions,
        annualHolidays,
        calendarExceptions,
        processAction
    }: ApproveLeaveRequestParams): Promise<{ success: boolean; type: string; infoMsg?: string }> {
        const LEAVE_TYPES = Object.values(ATTENDANCE_REGISTRY)
            .filter(item => item.category === 'LEAVE')
            .map(item => item.id);
        const CORRECTION_TYPES = Object.values(ATTENDANCE_REGISTRY)
            .filter(item => item.category === 'CORRECTION' || item.id === 'GPS_SPOOF_APPEAL')
            .map(item => item.id);
        const SPECIAL_TYPES = Object.values(ATTENDANCE_REGISTRY)
            .filter(item => item.category === 'SPECIAL' && item.id !== 'GPS_SPOOF_APPEAL')
            .map(item => item.id);

        let finalDbNote = adminNote || '';
        let isTimeModified = false;
        let updatedReason = request.reason;

        // Delegate execution to appropriate sub-flows
        if (SPECIAL_TYPES.includes(request.type)) {
            const res = await approveSpecialWorkRequest({
                request,
                customOtHours,
                customStartTime,
                customEndTime,
                adminNote,
                masterOptions,
                processAction
            });
            finalDbNote = res.finalDbNote;
            updatedReason = res.updatedReason;
            isTimeModified = res.isTimeModified;
        } else if (CORRECTION_TYPES.includes(request.type)) {
            if (request.type === 'OUT_OF_RANGE_CHECKOUT') {
                await approveOutOfRangeCheckoutRequest({
                    request,
                    customStartTime,
                    masterOptions,
                    processAction
                });
            } else if (request.type === 'GPS_SPOOF_APPEAL') {
                await approveGpsSpoofAppealRequest({
                    request,
                    masterOptions,
                    processAction
                });
            } else if (request.type === 'GPS_SPOOF_OUT_APPEAL') {
                await approveGpsSpoofOutAppealRequest({
                    request,
                    masterOptions,
                    processAction
                });
            } else {
                await approveAttendanceCorrection({
                    request,
                    customStartTime,
                    masterOptions,
                    processAction
                });
            }
        } else if (LEAVE_TYPES.includes(request.type)) {
            await approveStandardLeave({
                request,
                processAction
            });
        }

        // Update main request status
        await attendanceService.updateLeaveRequestStatus(request.id, 'APPROVED', { 
            approver_id: currentUser.id,
            rejection_reason: finalDbNote
        });

        // Assemble notifications and announcements
        let notifTitle = '✅ คำขอได้รับการอนุมัติ';
        if (CORRECTION_TYPES.includes(request.type)) notifTitle = '🛠️ อนุมัติการแก้ไขเวลา';
        if (SPECIAL_TYPES.includes(request.type)) notifTitle = '✨ อนุมัติคำขอพิเศษ';

        const dateDisplay = format(request.startDate, 'd MMM yyyy');
        const fullDateDisplay = request.startDate.getTime() === request.endDate.getTime() 
            ? dateDisplay 
            : `${dateDisplay} - ${format(request.endDate, 'd MMM yyyy')}`;

        let notifMsg = `รายการ: ${translateRequestType(request.type)}\nวันที่: ${fullDateDisplay}`;
        
        if (request.type === 'OVERTIME' && isTimeModified) {
            notifMsg += `\n\n⚙️ [แอดมินแก้ไขสิทธิ์และเวลาปฏิบัติงาน]\n• รายละเอียดเดิม: ${request.reason}\n• รายละเอียดใหม่: ${updatedReason}`;
        } else {
            notifMsg += `\nรายละเอียด: ${request.reason || '-'}`;
        }
        
        if (adminNote) {
            notifMsg += `\n\n📝 บันทึกจากแอดมิน: ${adminNote}`;
        }

        await sendApprovalNotification(request.userId, notifTitle, notifMsg, request.id, { request_type: request.type });

        await publishToTeamChannel(`✅ คำขอของ **${request.user?.name || 'พนักงาน'}** (${translateRequestType(request.type)}) ได้รับการอนุมัติแล้ว`);

        await sendGroupSummaryNotification(
            request.userId,
            request.user?.name || 'พนักงาน',
            translateRequestType(request.type),
            currentUser.name || currentUser.full_name || 'ผู้พิจารณา (Admin)',
            'อนุมัติแล้ว ✅',
            adminNote,
            request.id,
            { request_type: request.type }
        );

        return { success: true, type: request.type };
    },

    /**
     * Rejects any request (either from `ot_requests` or `leave_requests`).
     */
    async rejectRequestTransaction({
        id,
        reason,
        currentUser,
        isDedicatedOtRequest,
        otReq,
        targetReq,
        customCheckInTime,
        masterOptions,
        processAction,
        rejectionMode
    }: RejectRequestParams): Promise<{ success: boolean }> {
        if (isDedicatedOtRequest) {
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
            await sendRejectionNotification(otReq.userId, '❌ ปฏิเสธคำขอพิเศษ (OT)', `คำขอ OT วันที่: ${dateDisplay} ถูกปฏิเสธ\nเหตุผล: ${reason}`, otReq.id, { request_type: 'OT' });

            await sendGroupSummaryNotification(
                otReq.userId,
                otReq.user?.name || 'พนักงาน',
                translateRequestType('OVERTIME'),
                currentUser.name || currentUser.full_name || 'ผู้พิจารณา (Admin)',
                'ถูกปฏิเสธ ❌',
                reason,
                otReq.id,
                { request_type: 'OT' }
            );

            return { success: true };
        }

        // General leave_requests table reject logic
        const { data: req } = await supabase.from('leave_requests').select('*').eq('id', id).single();
        await attendanceService.updateLeaveRequestStatus(id, 'REJECTED', {
            approver_id: currentUser.id,
            rejection_reason: reason
        });

        if (req && (req.type === 'FORGOT_CHECKOUT' || req.type === 'EARLY_LEAVE')) {
            await rejectForgotCheckOutRequest({
                req,
                reason,
                masterOptions,
                processAction
            });
        }

        if (req && req.type === 'OUT_OF_RANGE_CHECKOUT') {
            await rejectOutOfRangeCheckoutRequest({
                req,
                reason
            });
        }

        if (req && (req.type === 'WFH' || req.type === 'ONSITE')) {
            await rejectWfhOnsiteRequest({
                req,
                reason,
                rejectionMode,
                customCheckInTime,
                masterOptions,
                processAction
            });
        }

        if (req && req.type === 'FORGOT_CHECKIN') {
            await rejectForgotCheckInRequest({
                req,
                reason,
                customCheckInTime,
                masterOptions,
                processAction
            });
        }

        if (req && req.type === 'FORGOT_BOTH') {
            await rejectForgotBothRequest({
                req,
                reason,
                masterOptions,
                processAction
            });
        }

        if (req && req.type === 'LATE_ENTRY') {
            await rejectLateEntryRequest({
                req,
                reason,
                masterOptions,
                processAction
            });
        }

        if (req && req.type === 'GPS_SPOOF_APPEAL') {
            await rejectGpsSpoofAppealRequest({
                req,
                reason
            });
        }

        if (req && req.type === 'GPS_SPOOF_OUT_APPEAL') {
            await rejectGpsSpoofOutAppealRequest({
                req,
                reason
            });
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
            await sendRejectionNotification(targetReq.userId, '❌ ปฏิเสธคำขอ', `คำขอประเภท: ${translateRequestType(targetReq.type)} วันที่: ${dateDisplay} ถูกปฏิเสธ\nเหตุผล: ${reason}`, targetReq.id, { request_type: targetReq.type });

            await publishToTeamChannel(`❌ คำขอของ **${targetReq.user?.name || 'พนักงาน'}** (${translateRequestType(targetReq.type)}) ถูกปฏิเสธ`);

            await sendGroupSummaryNotification(
                targetReq.userId,
                targetReq.user?.name || 'พนักงาน',
                translateRequestType(targetReq.type),
                currentUser.name || currentUser.full_name || 'ผู้พิจารณา (Admin)',
                'ถูกปฏิเสธ ❌',
                reason,
                targetReq.id,
                { request_type: targetReq.type }
            );
        }

        return { success: true };
    }
};

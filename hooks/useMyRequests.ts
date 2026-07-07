import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, LeaveUsage, RequestStatus } from '../types/attendance';
import { useToast } from '../context/ToastContext';
import { eachDayOfInterval, format, isValid } from 'date-fns';
import { useGoogleDrive } from './useGoogleDrive';
import { useUserSession } from '../context/UserSessionContext';
import { useMasterData } from './useMasterData';
import { isWorkingDay } from '../utils/judgeUtils';
import { calculateOtMultiplier, calculateEstimatedPayout } from '../utils/otCalculator';
import { attendanceService } from '../services/attendanceService';

export const useMyRequests = (currentUser?: any, options: { enabled?: boolean } = {}) => {
    const { enabled = true } = options;
    const { 
        leaveRequests: contextLeaveRequests, 
        otRequests: contextOtRequests, 
        allUsers, 
        isReady: isContextReady, 
        refreshOTRequests 
    } = useUserSession();
    
    const { annualHolidays, calendarExceptions } = useMasterData();
    const [rawRequests, setRawRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
    const { showToast } = useToast();
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();

    const checkLateSubmissionRule = (
        requestDate: Date,
        submittedDate: Date,
        annualHolidays: any,
        calendarExceptions: any,
        user: any
    ): boolean => {
        if (!isValid(requestDate) || !isValid(submittedDate)) return false;
        const requestDay = new Date(requestDate.getFullYear(), requestDate.getMonth(), requestDate.getDate());
        const submittedDay = new Date(submittedDate.getFullYear(), submittedDate.getMonth(), submittedDate.getDate());
        return requestDay < submittedDay;
    };

    const fetchMyRequests = async () => {
        if (!enabled || !currentUser?.id) return;
        setIsLoading(true);
        try {
            const data = await attendanceService.fetchCombinedRequests(currentUser.id, { all: false });
            setRawRequests(data);
        } catch (err: any) {
            console.error("Fetch my requests failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        if (!currentUser?.id) return;

        if (!isContextReady) {
            fetchMyRequests();
            return;
        }

        // Merge and filter personal requests from context
        const personalLeaves = contextLeaveRequests.filter(r => r.userId === currentUser.id);
        const personalOts: LeaveRequest[] = (contextOtRequests || [])
            .filter(r => r.userId === currentUser.id)
            .map(r => ({
                id: r.id,
                userId: r.userId,
                type: 'OVERTIME' as LeaveType,
                startDate: new Date(r.date + 'T' + r.startTime),
                endDate: new Date(r.date + 'T' + r.endTime),
                reason: `[OT:${r.durationHours}hr] ${r.reason}`,
                status: r.status as RequestStatus,
                createdAt: new Date(r.createdAt),
                rejectionReason: r.rejectionReason,
                user: currentUser ? {
                    id: currentUser.id,
                    name: currentUser.name,
                    avatarUrl: currentUser.avatarUrl,
                    position: currentUser.position
                } : undefined
            }));

        const combined = [...personalLeaves, ...personalOts];
        combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRawRequests(combined);
        setIsLoading(false);
    }, [currentUser?.id, contextLeaveRequests, contextOtRequests, isContextReady, enabled]);

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

    const leaveUsage: LeaveUsage = useMemo(() => {
        const usage: LeaveUsage = {
            SICK: 0, VACATION: 0, PERSONAL: 0, EMERGENCY: 0,
            LATE_ENTRY: 0, OVERTIME: 0, FORGOT_CHECKIN: 0, FORGOT_CHECKOUT: 0, FORGOT_BOTH: 0, WFH: 0, UNPAID: 0
        };

        if (!enabled || !currentUser?.id) return usage;

        const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'];

        requests.forEach(req => {
            if (req.userId === currentUser.id && req.status === 'APPROVED') {
                if (LEAVE_TYPES.includes(req.type)) {
                    const start = new Date(req.startDate);
                    const end = new Date(req.endDate);
                    if (!isValid(start) || !isValid(end) || start > end) return; 
                    
                    const days = eachDayOfInterval({ start, end });
                    const workingDaysCount = days.filter(d => 
                        isWorkingDay(d, annualHolidays, calendarExceptions, currentUser)
                    ).length;
                    
                    usage[req.type as keyof LeaveUsage] += workingDaysCount;
                } else {
                    usage[req.type as keyof LeaveUsage] += 1;
                }
            }
        });

        return usage;
    }, [requests, currentUser?.id, annualHolidays, calendarExceptions, enabled]);

    const pendingUsage: LeaveUsage = useMemo(() => {
        const usage: LeaveUsage = {
            SICK: 0, VACATION: 0, PERSONAL: 0, EMERGENCY: 0,
            LATE_ENTRY: 0, OVERTIME: 0, FORGOT_CHECKIN: 0, FORGOT_CHECKOUT: 0, FORGOT_BOTH: 0, WFH: 0, UNPAID: 0
        };

        if (!enabled || !currentUser?.id) return usage;

        const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'];

        requests.forEach(req => {
            if (req.userId === currentUser.id && req.status === 'PENDING') {
                if (LEAVE_TYPES.includes(req.type)) {
                    const start = new Date(req.startDate);
                    const end = new Date(req.endDate);
                    if (!isValid(start) || !isValid(end) || start > end) return; 
                    
                    const days = eachDayOfInterval({ start, end });
                    const workingDaysCount = days.filter(d => 
                        isWorkingDay(d, annualHolidays, calendarExceptions, currentUser)
                    ).length;
                    
                    usage[req.type as keyof LeaveUsage] += workingDaysCount;
                } else {
                    usage[req.type as keyof LeaveUsage] += 1;
                }
            }
        });

        return usage;
    }, [requests, currentUser?.id, annualHolidays, calendarExceptions, enabled]);

    const submitRequest = async (
        type: LeaveType, 
        startDate: Date, 
        endDate: Date, 
        reason: string, 
        file?: File
    ): Promise<boolean> => {
        if (!currentUser?.id) return false;
        try {
            const startDateStr = format(startDate, 'yyyy-MM-dd');

            // --- OT Request Handling ---
            if (type === 'OVERTIME') {
                // Try matching new format: [OT:18:30-20:30] (2hr) Reason
                const otTimeMatch = reason.match(/\[OT:(\d{2}:\d{2})-(\d{2}:\d{2})\]/);
                const startTime = otTimeMatch ? otTimeMatch[1] : '18:30';
                const endTime = otTimeMatch ? otTimeMatch[2] : '20:30';

                // Match hours from new format "(Xhr)" or old format "[OT:Xhr]"
                const otHoursMatch = reason.match(/\(([\d\.]+)hr\)/) || reason.match(/\[OT:([\d\.]+)hr\]/);
                const otHours = otHoursMatch ? parseFloat(otHoursMatch[1]) : 2.0;

                // Clean the reason prefix
                const cleanReason = reason
                    .replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]\s*\([\d\.]+hr\)\s*/, '')
                    .replace(/\[OT:[\d\.]+hr\]\s*/, '')
                    .trim();

                const { data: existing } = await supabase
                    .from('ot_requests')
                    .select('id, status')
                    .eq('user_id', currentUser.id)
                    .eq('date', startDateStr)
                    .in('status', ['PENDING', 'APPROVED'])
                    .maybeSingle();

                if (existing) {
                    if (existing.status === 'PENDING') {
                        showToast('คุณได้ส่งคำขอ OT ของวันนี้ไปแล้ว และกำลังรออนุมัติอยู่ ⏳', 'warning');
                    } else {
                        showToast('คำขอ OT ของวันนี้ได้รับการอนุมัติเรียบร้อยแล้วครับ ✅', 'info');
                    }
                    return false;
                }

                // Upload attachment specifically for OT if provided
                let otAttachmentUrl: string | null = null;
                if (file) {
                    let driveSuccess = false;
                    if (isDriveReady) {
                        try {
                            showToast('กำลังอัปโหลดไปที่ Google Drive...', 'info');
                            const currentYear = format(new Date(), 'yyyy');
                            const currentMonth = format(new Date(), 'MM');
                            const driveResult = await uploadFileToDrive(file, ['Juijui_Assets', 'Attendance', 'Leaves', currentYear, currentMonth, currentUser.name || 'Unknown']);
                            otAttachmentUrl = driveResult.thumbnailUrl || driveResult.url;
                            driveSuccess = true;
                        } catch (driveErr: any) {
                            console.warn("Drive upload failed, falling back to Supabase", driveErr);
                        }
                    }

                    if (!driveSuccess) {
                        try {
                            showToast('กำลังอัปโหลดไปที่ Storage สำรอง...', 'info');
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
                            const { error: uploadErr } = await supabase.storage
                                .from('chat-files')
                                .upload(`proofs/${fileName}`, file);

                            if (uploadErr) throw uploadErr;

                            const { data } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                            otAttachmentUrl = data.publicUrl;
                        } catch (supabaseErr: any) {
                            console.error("Supabase upload failed", supabaseErr);
                            throw new Error("ไม่สามารถอัปโหลดไฟล์ได้ทั้ง Google Drive และ Supabase");
                        }
                    }
                }

                const baseSalary = currentUser.baseSalary || 0;
                const { type: otType, multiplier } = calculateOtMultiplier(startDate, annualHolidays, calendarExceptions);
                const estimatedPayout = calculateEstimatedPayout(baseSalary, otHours, multiplier);

                await attendanceService.insertOtRequest({
                    user_id: currentUser.id,
                    date: startDateStr,
                    start_time: startTime,
                    end_time: endTime,
                    duration_hours: otHours,
                    reason: cleanReason,
                    type: otType,
                    status: 'PENDING',
                    base_salary_at_time: baseSalary,
                    computed_payout: estimatedPayout,
                    attachment_url: otAttachmentUrl
                });

                const msg = `📢 **${currentUser.name}** ส่งคำขอ OT (${otHours} ชม.) \n📅 ${format(startDate, 'd MMM')} \n📝: ${cleanReason}`;
                await supabase.from('team_messages').insert({
                    content: msg,
                    is_bot: true,
                    message_type: 'TEXT',
                    user_id: null
                });

                showToast('ส่งคำขอ OT เรียบร้อย รออนุมัติครับ 📨', 'success');
                if (refreshOTRequests) {
                    await refreshOTRequests();
                }
                fetchMyRequests();
                return true;
            }

            // --- Late Submission Rule check ---
            const CORRECTION_TYPES = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'];
            let isLateSubmission = false;
            if (CORRECTION_TYPES.includes(type)) {
                isLateSubmission = checkLateSubmissionRule(startDate, new Date(), annualHolidays, calendarExceptions, currentUser);
            }

            // Check duplicate leave request
            const { data: existingRequest } = await supabase
                .from('leave_requests')
                .select('id, status')
                .eq('user_id', currentUser.id)
                .eq('type', type)
                .eq('start_date', startDateStr)
                .in('status', ['PENDING', 'APPROVED']) 
                .maybeSingle();

            if (existingRequest) {
                if (existingRequest.status === 'PENDING') {
                    showToast('คำขอนี้ส่งไปแล้ว รออนุมัติครับ ⏳', 'warning');
                } else {
                    showToast('คำขอนี้อนุมัติแล้วครับ ✅', 'info');
                }
                return false; 
            }

            let attachmentUrl: string | null = null;
            if (file) {
                let driveSuccess = false;
                if (isDriveReady) {
                    try {
                        showToast('กำลังอัปโหลดไปที่ Google Drive...', 'info');
                        const currentYear = format(new Date(), 'yyyy');
                        const currentMonth = format(new Date(), 'MM');
                        const driveResult = await uploadFileToDrive(file, ['Juijui_Assets', 'Attendance', 'Leaves', currentYear, currentMonth, currentUser.name || 'Unknown']);
                        attachmentUrl = driveResult.thumbnailUrl || driveResult.url;
                        driveSuccess = true;
                    } catch (driveErr: any) {
                        console.warn("Drive upload failed, falling back to Supabase", driveErr);
                    }
                }

                if (!driveSuccess) {
                    try {
                        showToast('กำลังอัปโหลดไปที่ Storage สำรอง...', 'info');
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
                        const { error: uploadErr } = await supabase.storage
                            .from('chat-files')
                            .upload(`proofs/${fileName}`, file);

                        if (uploadErr) throw uploadErr;

                        const { data } = supabase.storage.from('chat-files').getPublicUrl(`proofs/${fileName}`);
                        attachmentUrl = data.publicUrl;
                    } catch (supabaseErr: any) {
                        console.error("Supabase upload failed", supabaseErr);
                        throw new Error("ไม่สามารถอัปโหลดไฟล์ได้ทั้ง Google Drive และ Supabase");
                    }
                }
            }

            await attendanceService.insertLeaveRequest({
                user_id: currentUser.id,
                type,
                start_date: startDateStr,
                end_date: format(endDate, 'yyyy-MM-dd'),
                reason: isLateSubmission ? `[LATE_SUBMISSION] ${reason}` : reason,
                attachment_url: attachmentUrl,
                status: 'PENDING'
            });

            if (type === 'FORGOT_CHECKOUT') {
                await supabase.from('attendance_logs').update({ status: 'PENDING_VERIFY' }).eq('user_id', currentUser.id).eq('date', startDateStr);
            }

            const msg = `📢 **${currentUser.name}** ส่งคำขอ (${type}) \n📅 ${format(startDate, 'd MMM')} \n📝: ${reason}`;
            await supabase.from('team_messages').insert({
                content: msg,
                is_bot: true,
                message_type: 'TEXT',
                user_id: null
            });

            showToast('ส่งคำขอเรียบร้อย รออนุมัติครับ 📨', 'success');
            fetchMyRequests();
            return true;
        } catch (err: any) {
            showToast('ส่งคำขอไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const fetchRequestsForRange = async (start?: Date, end?: Date): Promise<LeaveRequest[]> => {
        if (!currentUser?.id) return [];
        setIsLoadingHistorical(true);
        try {
            const options: any = { all: false };
            if (start) options.startDate = format(start, 'yyyy-MM-dd');
            if (end) options.endDate = format(end, 'yyyy-MM-dd');
            const data = await attendanceService.fetchCombinedRequests(currentUser.id, options);
            return data;
        } catch (err) {
            console.error("Fetch requests for range failed", err);
            showToast('ดึงข้อมูลประวัติย้อนหลังล้มเหลว', 'error');
            return [];
        } finally {
            setIsLoadingHistorical(false);
        }
    };

    return {
        requests,
        leaveUsage,
        pendingUsage,
        isLoading,
        isLoadingHistorical,
        submitRequest,
        fetchMyRequests,
        fetchRequestsForRange
    };
};

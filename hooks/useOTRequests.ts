import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { OtRequest, OtType, OtStatus } from '../types/attendance';
import { useUserSession } from '../context/UserSessionContext';
import { useToast } from '../context/ToastContext';
import { format, parse, isValid } from 'date-fns';

export const useOTRequests = () => {
    const { otRequests, allUsers, attendanceLogs, currentUserProfile, refreshOTRequests } = useUserSession();
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    // Helper to calculate duration in hours between two HH:MM strings
    const calculateDuration = (start: string, end: string): number => {
        try {
            const [startH, startM] = start.split(':').map(Number);
            const [endH, endM] = end.split(':').map(Number);
            
            if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
            
            let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
            if (diffMins < 0) {
                // Handles overnight OT if end_time < start_time
                diffMins += 24 * 60;
            }
            return Number((diffMins / 60).toFixed(2));
        } catch (e) {
            return 0;
        }
    };

    // Helper to calculate OT hourly rate based on standard Thai labor formula
    const calculateHourlyRate = (salary: number): number => {
        if (!salary || salary <= 0) return 0;
        const dailyWage = salary / 30;
        const hourlyWage = dailyWage / 8;
        return hourlyWage;
    };

    // Helper to get multiplier for OT type
    const getMultiplier = (type: OtType): number => {
        switch (type) {
            case 'NORMAL_DAY': return 1.5;
            case 'HOLIDAY': return 2.0;
            case 'HOLIDAY_OVERTIME': return 3.0;
            default: return 1.5;
        }
    };

    // Get mapped requests with user details
    const requestsWithUsers = useMemo(() => {
        return otRequests.map(req => {
            const user = allUsers.find(u => u.id === req.userId);
            return {
                ...req,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    position: user.position,
                    baseSalary: user.baseSalary
                } : undefined
            } as OtRequest;
        });
    }, [otRequests, allUsers]);

    // Submit a new Overtime Request
    const submitOTRequest = async (
        date: string, // YYYY-MM-DD
        startTime: string, // HH:MM
        endTime: string, // HH:MM
        reason: string,
        type: OtType
    ): Promise<boolean> => {
        if (!currentUserProfile) {
            showToast('กรุณาเข้าสู่ระบบก่อนดำเนินการ', 'error');
            return false;
        }

        setIsLoading(true);
        try {
            // Check for existing pending/approved OT request for this user on this date
            const { data: existing } = await supabase
                .from('ot_requests')
                .select('id, status')
                .eq('user_id', currentUserProfile.id)
                .eq('date', date)
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

            const durationHours = calculateDuration(startTime, endTime);
            if (durationHours <= 0) {
                showToast('เวลาเริ่มและเวลาสิ้นสุดไม่ถูกต้อง', 'error');
                return false;
            }

            const baseSalary = currentUserProfile.baseSalary || 0;
            const hourlyRate = calculateHourlyRate(baseSalary);
            const multiplier = getMultiplier(type);
            const estimatedPayout = Number((hourlyRate * multiplier * durationHours).toFixed(2));

            const { error } = await supabase
                .from('ot_requests')
                .insert({
                    user_id: currentUserProfile.id,
                    date,
                    start_time: startTime,
                    end_time: endTime,
                    duration_hours: durationHours,
                    reason,
                    type,
                    status: 'PENDING',
                    base_salary_at_time: baseSalary,
                    computed_payout: estimatedPayout
                });

            if (error) throw error;

            showToast('ยื่นขออนุมัติ OT เรียบร้อยแล้วครับ 🎉', 'success');
            await refreshOTRequests();
            return true;
        } catch (err: any) {
            console.error('Submit OT request failed:', err);
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Approve an OT Request with Cross-Reference Validation against actual Check-out Time
    const approveOTRequest = async (
        id: string,
        customDurationOverride?: number // Optional manual override by Admin
    ): Promise<boolean> => {
        if (!currentUserProfile || currentUserProfile.role !== 'ADMIN') {
            showToast('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติได้', 'error');
            return false;
        }

        setIsLoading(true);
        try {
            // 1. Fetch the request detail
            const request = requestsWithUsers.find(r => r.id === id);
            if (!request) {
                showToast('ไม่พบข้อมูลคำขอ OT', 'error');
                return false;
            }

            // 2. Cross-reference with attendance logs
            // Find employee's attendance log for that specific date
            const employeeLog = attendanceLogs.find(
                log => log.userId === request.userId && log.date === request.date
            );

            let finalHours = request.durationHours;
            let checkOutMsg = '';

            if (customDurationOverride !== undefined) {
                finalHours = customDurationOverride;
                checkOutMsg = ' (ปรับแต่งจำนวนชั่วโมงโดย Admin)';
            } else if (employeeLog && employeeLog.checkOutTime) {
                // Perform double-check calculation
                const checkOutDate = new Date(employeeLog.checkOutTime);
                const reqStart = new Date(`${request.date}T${request.startTime}`);
                const reqEnd = new Date(`${request.date}T${request.endTime}`);

                if (isValid(checkOutDate) && isValid(reqStart) && isValid(reqEnd)) {
                    if (checkOutDate < reqStart) {
                        // Checked out before OT started!
                        finalHours = 0;
                        checkOutMsg = ' (พนักงานเช็คเอาท์ออกก่อนช่วงเวลาเริ่ม OT)';
                    } else if (checkOutDate < reqEnd) {
                        // Checked out in the middle of OT!
                        const diffMs = checkOutDate.getTime() - reqStart.getTime();
                        finalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
                        checkOutMsg = ` (กลับก่อนเวลาที่ขอ! คํานวณจริงตามเวลาสแกนออก: ${finalHours} ชม.)`;
                    } else {
                        // Checked out after or at reqEnd
                        finalHours = request.durationHours;
                        checkOutMsg = ' (สแกนเช็คเอาท์ตามเวลาจริง ครบกำหนดขอ)';
                    }
                }
            } else {
                // No checkout logged on that day!
                finalHours = 0;
                checkOutMsg = ' (ไม่พบเวลาสแกนเช็คเอาท์จริงของวันนั้น)';
            }

            // 3. Re-calculate actual payout based on final calculated hours
            const baseSalary = request.baseSalaryAtTime || (request.user?.baseSalary) || 0;
            const hourlyRate = calculateHourlyRate(baseSalary);
            const multiplier = getMultiplier(request.type);
            const finalPayout = Number((hourlyRate * multiplier * finalHours).toFixed(2));

            // 4. Update Database
            const { error } = await supabase
                .from('ot_requests')
                .update({
                    status: 'APPROVED',
                    duration_hours: finalHours,
                    computed_payout: finalPayout,
                    approved_by: currentUserProfile.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            showToast(`อนุมัติคำขอ OT เรียบร้อยแล้ว${checkOutMsg} 🎉`, 'success');
            await refreshOTRequests();
            return true;
        } catch (err: any) {
            console.error('Approve OT request failed:', err);
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Reject an OT Request
    const rejectOTRequest = async (id: string, reason: string): Promise<boolean> => {
        if (!currentUserProfile || currentUserProfile.role !== 'ADMIN') {
            showToast('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถดําเนินการได้', 'error');
            return false;
        }

        if (!reason.trim()) {
            showToast('กรุณาระบุเหตุผลในการปฏิเสธ', 'warning');
            return false;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('ot_requests')
                .update({
                    status: 'REJECTED',
                    rejection_reason: reason,
                    approved_by: currentUserProfile.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            showToast('ปฏิเสธคำขอ OT เรียบร้อย', 'info');
            await refreshOTRequests();
            return true;
        } catch (err: any) {
            console.error('Reject OT request failed:', err);
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Cancel / Delete a pending OT Request (by the requesting employee)
    const cancelOTRequest = async (id: string): Promise<boolean> => {
        if (!currentUserProfile) return false;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('ot_requests')
                .delete()
                .eq('id', id)
                .eq('user_id', currentUserProfile.id)
                .eq('status', 'PENDING');

            if (error) throw error;

            showToast('ยกเลิกคำขอ OT แล้ว', 'info');
            await refreshOTRequests();
            return true;
        } catch (err: any) {
            console.error('Cancel OT request failed:', err);
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        requests: requestsWithUsers,
        isLoading,
        submitOTRequest,
        approveOTRequest,
        rejectOTRequest,
        cancelOTRequest,
        calculateDuration,
        calculateHourlyRate,
        getMultiplier
    };
};

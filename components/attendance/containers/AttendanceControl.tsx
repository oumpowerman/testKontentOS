
import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../../types';
import { WorkLocation } from '../../../types/attendance';
import { useAttendanceStatus } from '../../../hooks/attendance/useAttendanceStatus';
import { useAttendanceActions } from '../../../hooks/attendance/useAttendanceActions';
import { useMasterData } from '../../../hooks/useMasterData';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { format } from 'date-fns';
import { Info, AlertTriangle, HelpCircle } from 'lucide-react';
import { checkIsLate, calculateCheckOutStatus, getMatchedShiftSlot, getEffectiveStartTime } from '../../../lib/attendanceUtils';
import StatusCard from '../widget/StatusCard';
import CheckInModal from '../widget/CheckInModal';
import LiveClock from '../widget/LiveClock';
import AttendanceRulesModal from '../widget/AttendanceRulesModal';
import { BRAND_CONFIG } from '../../../config/brand';

interface AttendanceControlProps {
    user: User;
    todayActiveLeave: any;
    requests?: any[];
    onLeaveSubmit: any;
    onOpenLeave: (type?: any, workType?: 'WFH' | 'ONSITE', isInstant?: boolean) => void;
    isCheckInModalOpen: boolean;
    setIsCheckInModalOpen: (isOpen: boolean) => void;
}

const AttendanceControl: React.FC<AttendanceControlProps> = ({ 
    user, 
    todayActiveLeave, 
    requests = [],
    onLeaveSubmit, 
    onOpenLeave,
    isCheckInModalOpen,
    setIsCheckInModalOpen
}) => {
    const { todayLog, outdatedLogs, isLoading, refresh } = useAttendanceStatus(user.id);
    const { checkIn, checkOut } = useAttendanceActions(user.id);
    const { masterOptions } = useMasterData();
    const { uploadFileToDrive, isReady: isDriveReady, isAuthenticated: isDriveAuthenticated, login: connectDrive, retry: retryDrive } = useGoogleDrive();
    const { showAlert, showSuccess, showConfirm } = useGlobalDialog();

    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && navigator?.userAgent) {
            const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsDesktop(!isMobileOrTablet);
        }
    }, []);

    const effectiveIsDesktop = useMemo(() => {
        return isDesktop && BRAND_CONFIG.allowDesktopCheckInMode !== 1;
    }, [isDesktop]);

    const availableLocations = useMemo(() => {
        const locs = masterOptions.filter(o => o.type === 'WORK_LOCATION' || o.type === 'SHOOT_LOCATION');
        return locs.map(l => {
            const parts = l.key.split(',');
            if (parts.length >= 2) {
                return {
                    id: l.id,
                    name: l.label,
                    lat: parseFloat(parts[0]),
                    lng: parseFloat(parts[1]),
                    radiusMeters: parts[2] ? parseFloat(parts[2]) : 500,
                    type: l.type
                };
            }
            return null;
        }).filter(Boolean) as any[];
    }, [masterOptions]);

    const startTime = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
    const lateBuffer = parseInt(masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER')?.label || '15');
    const shiftsEnabledOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_ENABLED');
    const shiftsListOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_LIST');
    const isShiftsEnabled = shiftsEnabledOpt?.label === 'true';
    const shiftsList = useMemo(() => {
        if (shiftsListOpt?.label) {
            return shiftsListOpt.label.split(',').map(s => s.trim());
        }
        return ['08:00', '08:30', '09:00'];
    }, [shiftsListOpt]);

    const todayRequests = useMemo(() => {
        const reqs = requests && requests.length > 0 ? requests : (todayActiveLeave ? [todayActiveLeave] : []);
        const today = new Date();
        return reqs.filter(req => {
            if (req.status === 'REJECTED') return false;
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
            
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            return today >= start && today <= end;
        });
    }, [requests, todayActiveLeave]);

    const approvedLateTime = useMemo(() => {
        const lateReq = todayRequests.find(r => r.type === 'LATE_ENTRY' && r.status === 'APPROVED');
        if (lateReq) {
            const startD = new Date(lateReq.startDate);
            if (!isNaN(startD.getTime())) {
                const h = String(startD.getHours()).padStart(2, '0');
                const m = String(startD.getMinutes()).padStart(2, '0');
                return `${h}:${m}`;
            }
        }
        return undefined;
    }, [todayRequests]);

    const pendingLateTime = useMemo(() => {
        const lateReq = todayRequests.find(r => r.type === 'LATE_ENTRY' && r.status === 'PENDING');
        if (lateReq) {
            const startD = new Date(lateReq.startDate);
            if (!isNaN(startD.getTime())) {
                const h = String(startD.getHours()).padStart(2, '0');
                const m = String(startD.getMinutes()).padStart(2, '0');
                return `${h}:${m}`;
            }
        }
        return undefined;
    }, [todayRequests]);

    const pendingWFHRequest = useMemo(() => {
        return todayRequests.find(r => r.type === 'WFH' && r.status === 'PENDING');
    }, [todayRequests]);

    const pendingOnsiteRequest = useMemo(() => {
        return todayRequests.find(r => (r.type === 'ONSITE' || r.type === 'OFFSITE') && r.status === 'PENDING');
    }, [todayRequests]);

    const handleConfirmCheckIn = async (
        type: WorkLocation, 
        file: File | null, 
        location: { lat: number, lng: number }, 
        locationName?: string, 
        isProvisionalOnsite?: boolean, 
        provisionalReason?: string,
        isGpsAppeal: boolean = false,
        gpsAppealReason?: string
    ) => {
        if (isCheckingIn) return;
        setIsCheckingIn(true);

        try {
            let proofUrl: string | null = null;
            let shouldProceed = true;

            if (isDriveReady && file) {
                try {
                    const currentYear = format(new Date(), 'yyyy');
                    const currentMonth = format(new Date(), 'MM');
                    const result = await uploadFileToDrive(file, ['Juijui_Assets', 'Attendance', currentYear, currentMonth]);
                    proofUrl = result.thumbnailUrl || result.url;
                } catch (err: any) {
                    console.error("Drive Upload Error:", err);
                    
                    let errorDetails = "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพลง Google Drive";
                    if (err.reason === 'storageQuotaExceeded') {
                        errorDetails = "พื้นที่ Google Drive ของคุณเต็ม (Storage Quota Exceeded)";
                    } else if (err.reason === 'insufficientPermissions') {
                        errorDetails = "ไม่ได้รับอนุญาตให้เขียนไฟล์ (Insufficient Permissions)";
                    } else if (err.reason === 'rateLimitExceeded' || err.reason === 'userRateLimitExceeded') {
                        errorDetails = "คุณใช้งานระบบอัปโหลดบ่อยเกินไป กรุณารอสักครู่ (Rate Limit Exceeded)";
                    } else if (err.message) {
                        errorDetails = `ข้อผิดพลาดจาก Google: ${err.message}`;
                    }

                    const choice = await showConfirm(
                        `${errorDetails}\n\nคุณต้องการบันทึกข้อมูลต่อไปโดยไม่มีรูปภาพ หรือจะตรวจสอบ Drive ก่อนครับ?`,
                        "เกิดข้อผิดพลาดในการอัปโหลด"
                    );
                    if (choice) proofUrl = null;
                    else shouldProceed = false;
                }
            }

            if (shouldProceed) {
                const isApprovedWFH = todayRequests.some(r => r.type === 'WFH' && r.status === 'APPROVED');
                const isAppeal = todayRequests.some(r => r.type === 'LATE_ENTRY');
                const lateReason = todayRequests.find(r => r.type === 'LATE_ENTRY')?.reason || todayActiveLeave?.reason;
                
                const now = new Date();
                let matchedShift = null;
                if (isShiftsEnabled) {
                    matchedShift = getMatchedShiftSlot(now, shiftsList, lateBuffer);
                }
                const baseStartTime = matchedShift ? matchedShift.targetStartTime : startTime;
                const effectiveStartTime = approvedLateTime || (pendingLateTime && checkIsLate(now, pendingLateTime, lateBuffer) ? pendingLateTime : baseStartTime);
                const isLate = matchedShift && !approvedLateTime && !pendingLateTime
                    ? (matchedShift.isLate || matchedShift.isBlocked)
                    : checkIsLate(now, effectiveStartTime, lateBuffer);

                const success = await checkIn(
                    type, 
                    file || undefined, 
                    location, 
                    locationName, 
                    undefined, 
                    undefined, 
                    isAppeal, 
                    proofUrl, 
                    isApprovedWFH, 
                    isProvisionalOnsite, 
                    provisionalReason, 
                    approvedLateTime, 
                    pendingLateTime, 
                    lateReason,
                    isGpsAppeal,
                    gpsAppealReason
                );
                if (success) {
                    if (!isLate && !isAppeal) {
                        await showSuccess(
                            `เย้! ดีใจด้วยครับ คุณเช็คอินตรงเวลาเมื่อ ${format(now, 'HH:mm')} น. คุณสุดยอดมาก รักษาวินัยที่ยอดเยี่ยมแบบนี้ต่อไปนะครับ! 🏆🎉`,
                            "🌟 เช็คอินตรงเวลาสำเร็จ!",
                            true
                        );
                    } else {
                        showAlert("บันทึกข้อมูลการเข้างานเรียบร้อยแล้วครับ", "สำเร็จ");
                    }
                    refresh();
                    setIsCheckInModalOpen(false);
                }
            }
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleCheckOut = async (location?: any, locationName?: string, reason?: string, proofUrl?: string) => {
        if (!todayLog) return;
        
        const now = new Date();
        const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
        const minHoursStr = configData?.find(c => c.key === 'MIN_HOURS')?.label || '9';
        const minHours = parseFloat(minHoursStr) || 9;

        const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
        const shiftsEnabledOpt = configData?.find(o => o.key === 'MULTIPLE_SHIFTS_ENABLED');
        const shiftsListOpt = configData?.find(o => o.key === 'MULTIPLE_SHIFTS_LIST');
        const lateEntryStrictOpt = configData?.find(o => o.key === 'LATE_ENTRY_STRICT_END_TIME');
        const isShiftsEnabled = shiftsEnabledOpt?.label === 'true';
        const shiftsList = shiftsListOpt?.label || '';
        const isLateEntryStrictEndTime = lateEntryStrictOpt?.label === 'true';

        const effectiveStartTimeStr = getEffectiveStartTime(
            new Date(todayLog.checkInTime),
            startTimeStr,
            todayLog.note,
            { enabled: isShiftsEnabled, shiftsList }
        );

        const todayHalfDayLeave = todayRequests.find(
            r => (r.status === 'APPROVED' || r.status === 'PENDING') && 
                 (r.is_half_day === true || r.is_half_day === 'true' || r.isHalfDay === true || r.isHalfDay === 'true')
        );
        const isHalfDay = !!todayHalfDayLeave;
        const halfDaySession = todayHalfDayLeave ? (todayHalfDayLeave.half_day_session || todayHalfDayLeave.halfDaySession) : undefined;

        const note = todayLog.note || '';
        const hasLateEntryNote = note.includes('[PROVISIONAL_LATE_ENTRY]') ||
            note.includes('[APPROVED LATE_ENTRY]') ||
            note.includes('[REJECTED LATE_ENTRY]') ||
            note.includes('LATE_ENTRY') ||
            note.includes('[APPROVED_TIME:') ||
            note.includes('[LATE_PAST_PENDING]') ||
            note.includes('[APPEAL_PENDING]');

        const hasLateEntryRequest = todayRequests.some((req: any) => req.type === 'LATE_ENTRY');
        const useShiftEndTimeForLate = Boolean(isLateEntryStrictEndTime && (hasLateEntryNote || hasLateEntryRequest));

        const calcResult = calculateCheckOutStatus(
            new Date(todayLog.checkInTime), 
            now, 
            minHours, 
            effectiveStartTimeStr,
            isHalfDay,
            halfDaySession,
            useShiftEndTimeForLate
        );
        const isEarlyLeave = calcResult.status === 'EARLY_LEAVE';

        const success = await checkOut(todayLog, location, locationName, reason, proofUrl);
        if (success) {
            if (!isEarlyLeave) {
                await showSuccess(
                    `เก่งมากๆ เลยครับวันนี้! ทำงานสำเร็จลุล่วงครบถ้วน (${calcResult.hoursWorked.toFixed(1)} ชม.) เช็คเอาท์เวลา ${format(now, 'HH:mm')} น. กลับบ้านพักผ่อนให้เต็มที่นะครับ! 💤🏆`,
                    "🎉 เลิกงานตรงเวลาสำเร็จ!",
                    true
                );
            }
            refresh();
        }
    };

    if (isLoading) return <div className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>;

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-indigo-50 p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${todayLog ? 'bg-green-400' : 'bg-orange-400'}`}></div>
            
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight text-lg">Attendance</h3>
                    <button 
                        onClick={() => setIsRulesModalOpen(true)}
                        className="
                            relative w-10 h-10 
                            bg-white/70 backdrop-blur 
                            border border-indigo-100 
                            text-indigo-600 
                            rounded-xl 
                            flex items-center justify-center 
                            shadow-sm 
                            transition-all duration-300
                            hover:shadow-lg hover:scale-110
                            active:scale-95
                        "
                        title="กฎการลงเวลา"
                        >
                        {/* glow วิ่งเบาๆ */}
                        <span className="
                            absolute inset-0 rounded-xl 
                            bg-indigo-400/20 blur-md 
                            animate-pulse
                        " />

                        {/* icon ดุ๊กดิ๊ก */}
                        <HelpCircle 
                            size={18} 
                            className="relative z-10 animate-wiggle"
                        />
                    </button>
                </div>
                
                <button 
                    onClick={() => onOpenLeave()}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-[12px] font-kanit font-medium uppercase tracking-widest transition-all flex items-center gap-1.5 border border-orange-100 shadow-sm active:scale-95"
                >
                    <AlertTriangle className="w-3 h-3" /> ยื่นคำขอ
                </button>
            </div>

            {effectiveIsDesktop && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-left relative z-10 shadow-sm">
                    <div className="bg-red-100 p-2 rounded-xl text-red-600 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-800 font-kanit">⚠️ สำหรับโทรศัพท์มือถือและแท็บเล็ตเท่านั้น</h4>
                        <p className="text-[11px] text-red-600 leading-normal mt-1 font-sarabun font-medium">
                            ระบบลงเวลาเข้าออกงาน (Attendance) รองรับการทำรายการผ่านโทรศัพท์มือถือและแท็บเล็ตเพื่อความปลอดภัยเท่านั้น ปุ่มลงเวลาและการทำรายการทั้งหมดถูกปิดใช้งานชั่วคราวบนคอมพิวเตอร์
                        </p>
                    </div>
                </div>
            )}

            <LiveClock hp={user?.hp} />

            <StatusCard 
                user={user}
                todayLog={todayLog}
                outdatedLogs={outdatedLogs}
                stats={{ totalDays: 0, lateDays: 0, onTimeDays: 0, absentDays: 0, totalHours: 0, currentStreak: 0 }} // Stats handled separately
                todayActiveLeave={todayActiveLeave}
                onCheckOut={handleCheckOut}
                onCheckOutRequest={onLeaveSubmit}
                onOpenCheckIn={async (isHoliday) => {
                    if (effectiveIsDesktop) return;
                    if (isHoliday) {
                        const confirm = await showConfirm(
                            "โปรดยืนยันว่าการลงเวลาในวันหยุดครั้งนี้ ได้รับการอนุมัติหรือเห็นชอบจากหัวหน้างานของคุณแล้ว\nกดตกลงเพื่อเริ่มต้นขั้นตอนตรวจสอบสถานที่และเข้าสู่ระบบบันทึกเวลา",
                            "⚠️ ยืนยันการลงเวลาปฏิบัติงานในวันหยุด (OT)"
                        );
                        if (!confirm) return;
                    }
                    setIsCheckInModalOpen(true);
                }}
                onOpenLeave={onOpenLeave}
                isDriveReady={isDriveReady}
                isAuthenticated={isDriveAuthenticated}
                onConnectDrive={connectDrive}
                onRetryDrive={retryDrive}
                onRefresh={refresh}
                availableLocations={availableLocations}
                startTime={startTime}
                lateBuffer={lateBuffer}
                isDesktop={effectiveIsDesktop}
            />

            <CheckInModal 
                isOpen={isCheckInModalOpen} 
                onClose={() => setIsCheckInModalOpen(false)}
                onConfirm={handleConfirmCheckIn}
                availableLocations={availableLocations}
                startTime={startTime}
                lateBuffer={lateBuffer}
                onSwitchToLeave={(type, workType) => { onOpenLeave(type, workType, true); }} // Keep CheckIn open so they can return to it if they change their mind
                approvedWFH={todayRequests.some(r => r.type === 'WFH' && r.status === 'APPROVED')}
                approvedOnsite={todayRequests.some(r => (r.type === 'ONSITE' || r.type === 'OFFSITE') && r.status === 'APPROVED')}
                pendingWFHRequest={pendingWFHRequest}
                pendingOnsiteRequest={pendingOnsiteRequest}
                hasLateRequest={todayRequests.some(r => r.type === 'LATE_ENTRY')}
                approvedLateTime={approvedLateTime}
                pendingLateTime={pendingLateTime}
                isDriveConnected={isDriveAuthenticated}
                userId={user.id}
                todayRequests={todayRequests}
            />

            <AttendanceRulesModal 
                isOpen={isRulesModalOpen} 
                onClose={() => setIsRulesModalOpen(false)} 
            />
        </div>
    );
};

export default AttendanceControl;

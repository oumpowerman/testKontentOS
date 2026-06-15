
import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { WorkLocation } from '../../../types/attendance';
import { useAttendanceStatus } from '../../../hooks/attendance/useAttendanceStatus';
import { useAttendanceActions } from '../../../hooks/attendance/useAttendanceActions';
import { useMasterData } from '../../../hooks/useMasterData';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { format } from 'date-fns';
import { Info, AlertTriangle ,HelpCircle} from 'lucide-react';
import StatusCard from '../widget/StatusCard';
import CheckInModal from '../widget/CheckInModal';
import LiveClock from '../widget/LiveClock';
import AttendanceRulesModal from '../widget/AttendanceRulesModal';

interface AttendanceControlProps {
    user: User;
    todayActiveLeave: any;
    onLeaveSubmit: any;
    onOpenLeave: () => void;
}

const AttendanceControl: React.FC<AttendanceControlProps> = ({ user, todayActiveLeave, onLeaveSubmit, onOpenLeave }) => {
    const { todayLog, outdatedLogs, isLoading, refresh } = useAttendanceStatus(user.id);
    const { checkIn, checkOut } = useAttendanceActions(user.id);
    const { masterOptions } = useMasterData();
    const { uploadFileToDrive, isReady: isDriveReady, isAuthenticated: isDriveAuthenticated, login: connectDrive, retry: retryDrive } = useGoogleDrive();
    const { showAlert, showConfirm } = useGlobalDialog();

    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    const availableLocations = useMemo(() => {
        const locs = masterOptions.filter(o => o.type === 'WORK_LOCATION');
        return locs.map(l => {
            const parts = l.key.split(',');
            if (parts.length >= 2) {
                return {
                    id: l.id,
                    name: l.label,
                    lat: parseFloat(parts[0]),
                    lng: parseFloat(parts[1]),
                    radiusMeters: parts[2] ? parseFloat(parts[2]) : 500
                };
            }
            return null;
        }).filter(Boolean) as any[];
    }, [masterOptions]);

    const startTime = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
    const lateBuffer = parseInt(masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER')?.label || '15');

    const handleConfirmCheckIn = async (type: WorkLocation, file: File, location: { lat: number, lng: number }, locationName?: string) => {
        let proofUrl: string | null = null;
        let shouldProceed = true;

        if (isDriveReady) {
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
            const isApprovedWFH = todayActiveLeave?.type === 'WFH' && todayActiveLeave.status === 'APPROVED';
            const isAppeal = todayActiveLeave?.type === 'LATE_ENTRY';
            const success = await checkIn(type, file, location, locationName, undefined, undefined, isAppeal, proofUrl, isApprovedWFH);
            if (success) {
                showAlert("บันทึกข้อมูลการเข้างานเรียบร้อยแล้วครับ", "สำเร็จ");
                refresh();
                setIsCheckInModalOpen(false);
            }
        }
    };

    const handleCheckOut = async (location?: any, locationName?: string, reason?: string) => {
        if (!todayLog) return;
        const success = await checkOut(todayLog, location, locationName, reason);
        if (success) refresh();
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
                    onClick={onOpenLeave}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-[12px] font-kanit font-medium uppercase tracking-widest transition-all flex items-center gap-1.5 border border-orange-100 shadow-sm active:scale-95"
                >
                    <AlertTriangle className="w-3 h-3" /> แจ้งลา / สาย
                </button>
            </div>

            <LiveClock />

            <StatusCard 
                user={user}
                todayLog={todayLog}
                outdatedLogs={outdatedLogs}
                stats={{ totalDays: 0, lateDays: 0, onTimeDays: 0, absentDays: 0, totalHours: 0, currentStreak: 0 }} // Stats handled separately
                todayActiveLeave={todayActiveLeave}
                onCheckOut={handleCheckOut}
                onCheckOutRequest={onLeaveSubmit}
                onOpenCheckIn={() => setIsCheckInModalOpen(true)}
                onOpenLeave={onOpenLeave}
                isDriveReady={isDriveReady}
                isAuthenticated={isDriveAuthenticated}
                onConnectDrive={connectDrive}
                onRetryDrive={retryDrive}
                onRefresh={refresh}
                availableLocations={availableLocations}
                startTime={startTime}
                lateBuffer={lateBuffer}
            />

            <CheckInModal 
                isOpen={isCheckInModalOpen} 
                onClose={() => setIsCheckInModalOpen(false)}
                onConfirm={handleConfirmCheckIn}
                availableLocations={availableLocations}
                startTime={startTime}
                lateBuffer={lateBuffer}
                onSwitchToLeave={() => { onOpenLeave(); }} // Keep CheckIn open so they can return to it if they change their mind
                approvedWFH={todayActiveLeave?.type === 'WFH' && todayActiveLeave.status === 'APPROVED'}
                hasLateRequest={todayActiveLeave?.type === 'LATE_ENTRY'}
                isDriveConnected={isDriveAuthenticated}
            />

            <AttendanceRulesModal 
                isOpen={isRulesModalOpen} 
                onClose={() => setIsRulesModalOpen(false)} 
            />
        </div>
    );
};

export default AttendanceControl;

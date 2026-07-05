
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AttendanceLog, LeaveType, LocationDef, AttendanceStats, LeaveRequest } from '../../../types/attendance';
import { User } from '../../../types';
import { MapPin, LogOut, LogIn, CheckCircle2, Cloud, CloudOff, Sparkles, Coffee, Calendar, Flame, Briefcase, AlertTriangle, Palmtree, Hourglass, AlertCircle, ShieldCheck, ArrowRight, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import { format, isToday } from 'date-fns';
import th from 'date-fns/locale/th';
import LeaveRequestModal from '../leave-request/LeaveRequestModal';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { CheckOutModal } from './CheckOutModal';
import ForgotCheckInControl from './ForgotCheckInControl';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';

interface StatusCardProps {
    user: User;
    todayLog: AttendanceLog | null;
    outdatedLogs: AttendanceLog[]; // NEW
    stats: AttendanceStats;
    todayActiveLeave: LeaveRequest | null;
    onCheckOut: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>; 
    onCheckOutRequest: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>; 
    onOpenCheckIn: (isHoliday?: boolean) => void;
    onOpenLeave: () => void;
    isDriveReady: boolean;
    isAuthenticated?: boolean;
    onConnectDrive?: () => void;
    onRetryDrive?: () => void;
    onRefresh?: () => void;
    availableLocations: LocationDef[];
    onNavigateToHistory?: () => void;
    // New Props for Time Fencing
    startTime: string;
    lateBuffer: number;
}

const StatusCard: React.FC<StatusCardProps> = ({ 
    user, todayLog, outdatedLogs, stats, todayActiveLeave, onCheckOut, onCheckOutRequest, onOpenCheckIn, onOpenLeave, isDriveReady, isAuthenticated, onConnectDrive, onRetryDrive, onRefresh, availableLocations, onNavigateToHistory,
    startTime, lateBuffer
}) => {
    const { showAlert } = useGlobalDialog(); 
    const { showToast } = useToast();

    // --- DRIVE LOADING TIMER ---
    const [loadingTime, setLoadingTime] = useState(0);
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        let interval: any;
        if (!isDriveReady && !isTimeout) {
            interval = setInterval(() => {
                setLoadingTime(prev => {
                    if (prev >= 20) {
                        setIsTimeout(true);
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else if (isDriveReady) {
            setLoadingTime(0);
            setIsTimeout(false);
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isDriveReady, isTimeout]);

    const handleRetry = () => {
        setLoadingTime(0);
        setIsTimeout(false);
        if (onRetryDrive) onRetryDrive();
    };

    // --- HOLIDAY LOGIC HOOKS ---
    const { exceptions } = useCalendarExceptions();
    const { annualHolidays } = useAnnualHolidays();
    const [time, setTime] = useState(new Date());

    // Live Clock for accurate day check
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- CHECK HOLIDAY & SPECIAL WORK STATUS ---
    const dayStatus = useMemo(() => {
        const currentCheckDate = time; 
        const todayStr = format(currentCheckDate, 'yyyy-MM-dd');
        const dayOfWeek = currentCheckDate.getDay(); // 0 = Sun, 6 = Sat
        
        // 1. Check Exception (Highest Priority)
        const exception = exceptions.find(e => e.date === todayStr);
        if (exception) {
            if (exception.type === 'HOLIDAY') {
                return { mode: 'HOLIDAY', name: exception.description || 'วันหยุดพิเศษ' };
            }
            if (exception.type === 'WORK_DAY') {
                return { mode: 'SPECIAL_WORK', name: exception.description || 'วันทำงานพิเศษ' };
            }
        }

        // 2. Check Annual Holiday
        const annual = annualHolidays.find(h => h.isActive && h.day === currentCheckDate.getDate() && h.month === (currentCheckDate.getMonth() + 1));
        if (annual) {
            return { mode: 'HOLIDAY', name: annual.name };
        }

        // 3. Check Weekend (Sat/Sun)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { mode: 'HOLIDAY', name: dayOfWeek === 0 ? 'วันอาทิตย์' : 'วันเสาร์' };
        }

        return { mode: 'NORMAL', name: '' };
    }, [exceptions, annualHolidays, time]);

    // Check if user is checked in AND not on leave
    const isLeaveLog = todayLog?.status === 'LEAVE' || todayLog?.workType === 'LEAVE';
    const isApprovedLeaveToday = todayActiveLeave?.status === 'APPROVED';

    const isCheckedOut = !!todayLog?.checkOutTime;
    const isCheckedIn = !!todayLog && !isLeaveLog; 
    
    // --- OUTDATED SESSION CHECK ---
    const isSessionOutdated = outdatedLogs && outdatedLogs.length > 0;

    const isAdmin = user.role === 'ADMIN';
    
    // Recovery Logic
    const [recoveryLogDate, setRecoveryLogDate] = useState<string | null>(null);
    // Check-out Verification Logic
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

    const { leaveUsage } = useLeaveRequests(user); 

    const handleRecoverySubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => {
        const targetLog = outdatedLogs.find(l => l.date === recoveryLogDate);
        if (isAdmin && targetLog) {
            try {
                const timeMatch = reason.match(/\[TIME:(\d{2}:\d{2})\]/);
                const timeStr = timeMatch ? timeMatch[1] : '18:00'; 
                
                const logDate = format(new Date(targetLog.date), 'yyyy-MM-dd');
                const fullDateTimeStr = `${logDate}T${timeStr}:00`;

                // FETCH FRESH NOTE TO PREVENT OVERWRITE
                const { data: freshLog } = await supabase.from('attendance_logs').select('note').eq('id', targetLog.id).single();
                const currentNote = freshLog?.note || targetLog.note || '';
                
                const { error } = await supabase.from('attendance_logs')
                    .update({
                        check_out_time: new Date(fullDateTimeStr).toISOString(),
                        status: 'COMPLETED',
                        note: `${currentNote} [ADMIN FIXED: ${reason}]`.trim()
                    })
                    .eq('id', targetLog.id);

                if (error) throw error;
                
                showToast('แก้ไขเวลาออกเรียบร้อย (Admin Override) ✅', 'success');
                setRecoveryLogDate(null);
                if (onRefresh) onRefresh();
                return true;

            } catch (err: any) {
                console.error(err);
                showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
                return false;
            }
        } else {
            const success = await onCheckOutRequest('FORGOT_CHECKOUT', start, end, reason, file);
            if (success) {
                setRecoveryLogDate(null); 
                await showAlert(
                    'ระบบได้รับข้อมูลเวลาออกงานของคุณแล้ว สถานะของวันนี้จะเปลี่ยนเป็น "รอตรวจสอบ (Pending)" กรุณารอ Admin อนุมัติครับ',
                    'ส่งคำขอเรียบร้อยแล้ว! ✅'
                );
                if (onRefresh) onRefresh();
            }
            return success;
        }
    };

    const handleCheckOutRequest = async (timeStr: string, reason: string) => {
        const now = new Date();
        const formattedReason = `[TIME:${timeStr}] ${reason} (Location Mismatch)`;
        return await onCheckOutRequest('FORGOT_CHECKOUT', now, now, formattedReason);
    };

    const handleOvertimeSubmit = async (otMinutes: number, reason: string) => {
        const now = new Date();
        const success = await onCheckOutRequest('OVERTIME', now, now, reason);
        if (success) {
            await showAlert(
                `ส่งคำขออนุมัติการทำ OT เรียบร้อยแล้วครับ (${Math.floor(otMinutes / 60)} ชม. ${otMinutes % 60} นาที) กรุณารอแอดมินพิจารณาครับ ✨`,
                'ส่งคำขอ OT สำเร็จ!'
            );
            if (onRefresh) onRefresh();
        }
        return success;
    };

    // --- STATE MACHINE UI ---

    return (
        <div className="space-y-3 relative z-10">
            {/* GOOGLE DRIVE STATUS BANNER (NEW TOP POSITION) */}
            <div className="mb-2 animate-in fade-in slide-in-from-top-1 duration-500">
                {!isDriveReady ? (
                    <div className={`p-3 rounded-2xl border transition-all ${isTimeout ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                        {isTimeout ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-rose-100 p-2 rounded-full text-rose-500">
                                        <CloudOff className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-bold text-rose-800">Drive Connection Timeout</p>
                                        <p className="text-[9px] text-rose-600">การเชื่อมต่อล้มเหลว กรุณาลองใหม่</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleRetry} 
                                    className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-rose-600 transition-colors shadow-sm"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-medium text-slate-500">กำลังเตรียมระบบ Google Drive...</p>
                                    <div className="mt-1.5 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-400 transition-all duration-1000 ease-linear" 
                                            style={{ width: `${(loadingTime / 20) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : !isAuthenticated ? (
                    <motion.div 
                        animate={{ 
                            backgroundColor: ["rgba(255, 241, 242, 0.5)", "rgba(255, 228, 230, 0.8)", "rgba(255, 241, 242, 0.5)"],
                            borderColor: ["rgba(251, 113, 133, 0.2)", "rgba(251, 113, 133, 0.5)", "rgba(251, 113, 133, 0.2)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="border rounded-2xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden"
                    >
                        {/* Urgent Background Pulse */}
                        <motion.div 
                            animate={{ opacity: [0, 0.1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 bg-red-500 pointer-events-none"
                        />

                        <div className="flex items-center gap-3 relative z-10">
                            <motion.div 
                                animate={{ rotate: [-10, 10, -10] }}
                                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                                className="bg-white p-2 rounded-full text-rose-500 shadow-sm border border-rose-100"
                            >
                                <AlertTriangle className="w-5 h-5" />
                            </motion.div>
                            <div className="text-left">
                                <p className="text-[11px] font-black text-rose-900 uppercase tracking-tight flex items-center gap-1">
                                    Backup System Disabled
                                </p>
                                <p className="text-[9px] text-rose-600 font-bold leading-tight">
                                    เสี่ยงข้อมูลสูญหาย! กรุณาเชื่อมต่อ Drive ทันที
                                </p>
                            </div>
                        </div>
                        <motion.button 
                            onClick={onConnectDrive}
                            animate={{ 
                                scale: [1, 1.1, 1],
                                boxShadow: [
                                    "0 0 0px rgba(225, 29, 72, 0)",
                                    "0 0 20px rgba(225, 29, 72, 0.5)",
                                    "0 0 0px rgba(225, 29, 72, 0)"
                                ]
                            }}
                            transition={{ 
                                duration: 1, 
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            whileHover={{ scale: 1.15, boxShadow: "0 0 25px rgba(225, 29, 72, 0.7)" }}
                            whileTap={{ scale: 0.9 }}
                            className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[14px] font-kanit font-medium uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all relative z-10"
                        >
                            เชื่อมต่อตอนนี้!
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-2.5 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Google Drive Connected</span>
                    </div>
                )}
            </div>

            {/* OUTDATED SESSION BANNER (Persistent) */}
            {isSessionOutdated && outdatedLogs.map(log => (
                <div key={log.id} className="bg-orange-100 border border-orange-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 mb-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-orange-800">ลืมตอกบัตรออก!</p>
                            <p className="text-[10px] text-orange-600">วันที่ {format(new Date(log.date), 'd MMM yyyy', { locale: th })}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setRecoveryLogDate(log.date)}
                        className="bg-orange-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm hover:bg-orange-600 transition-colors"
                    >
                        แจ้งเวลาออก
                    </button>
                </div>
            ))}

            <LeaveRequestModal 
                isOpen={!!recoveryLogDate}
                onClose={() => setRecoveryLogDate(null)}
                onSubmit={handleRecoverySubmit}
                leaveUsage={leaveUsage}
                fixedType="FORGOT_CHECKOUT"
                initialDate={recoveryLogDate ? new Date(recoveryLogDate) : new Date()}
            />

            {/* State 4: Finished Work Today */}
            {isCheckedOut ? (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                    <p className="text-green-700 font-bold text-lg">🎉 เลิกงานแล้ว!</p>
                    <div className="flex justify-center gap-4 mt-2 text-xs text-green-600">
                        <div>
                            <span className="block opacity-70">เข้างาน</span>
                            <span className="font-mono font-bold">{todayLog?.checkInTime ? format(todayLog.checkInTime, 'HH:mm') : '--:--'}</span>
                        </div>
                        <div>
                            <span className="block opacity-70">ออกงาน</span>
                            <span className="font-mono font-bold">{todayLog?.checkOutTime ? format(todayLog.checkOutTime, 'HH:mm') : '--:--'}</span>
                        </div>
                    </div>
                </div>
            ) : isCheckedIn ? (
                /* State 5: Working Now */
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                        <span className="text-xs font-bold text-indigo-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" /> {todayLog?.workType}
                        </span>
                        <span className="text-xs text-indigo-400">
                            เข้าเมื่อ: <span className="font-mono font-bold text-indigo-600">{todayLog?.checkInTime ? format(todayLog.checkInTime, 'HH:mm') : '--:--'}</span>
                        </span>
                    </div>
                    {todayLog?.note?.includes('[APPEAL_PENDING]') && (
                         <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2">
                            <Hourglass className="w-4 h-4 text-orange-500 animate-pulse" />
                            <span className="text-xs text-orange-700 font-bold">รออนุมัติการเข้าสาย (Appeal Pending)</span>
                        </div>
                    )}
                    {todayLog?.status === 'PENDING_VERIFY' && (
                         <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 animate-pulse" />
                            <span className="text-xs text-yellow-700 font-bold">รายการนี้รอตรวจสอบ (Manual Entry)</span>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsCheckOutModalOpen(true)}
                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" /> ตอกบัตรออก (Check Out)
                    </button>

                    <CheckOutModal 
                        isOpen={isCheckOutModalOpen}
                        onClose={() => setIsCheckOutModalOpen(false)}
                        onConfirm={onCheckOut}
                        onRequest={handleCheckOutRequest}
                        availableLocations={availableLocations}
                        checkInTime={todayLog!.checkInTime || new Date()} 
                        onOvertimeSubmit={handleOvertimeSubmit}
                    />
                </div>
            ) : (
                /* State 6: Not Checked In (Idle) - Default */
                <>
                    {/* HOLIDAY WARNING BANNER */}
                    {dayStatus.mode === 'HOLIDAY' && (
                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-3 flex items-center justify-between animate-pulse-slow mb-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-1.5 rounded-full shadow-sm text-pink-500">
                                    <Palmtree className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-pink-700">วันนี้ {dayStatus.name}</h4>
                                    <p className="text-[10px] text-pink-600 font-medium">วันหยุดพักผ่อน ไม่ต้องลงเวลาก็ได้นะ</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ON LEAVE BANNER (Non-Blocking) */}
                    {(isLeaveLog || isApprovedLeaveToday) && todayActiveLeave?.type !== 'WFH' && todayActiveLeave?.type !== 'LATE_ENTRY' && (
                        <div className="bg-blue-100 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <Palmtree className="w-4 h-4 text-blue-600" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-blue-800">วันนี้คุณลางาน: {todayActiveLeave?.type || 'Leave'}</p>
                                    <p className="text-[10px] text-blue-600">หากต้องการทำงาน สามารถ Check-in ได้ปกติ</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Late Entry Approved Banner */}
                    {todayActiveLeave?.type === 'LATE_ENTRY' && todayActiveLeave.status === 'APPROVED' && !todayLog && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between mb-2 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-green-600" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-green-800">อนุมัติการเข้าสายแล้ว ✅</p>
                                    <p className="text-[10px] text-green-600">คุณสามารถกด Check-in เพื่อเริ่มงานได้เลย</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appeal Pending Banner */}
                    {todayActiveLeave?.type === 'LATE_ENTRY' && todayActiveLeave.status === 'PENDING' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 flex items-center justify-center gap-2 mb-2 animate-in slide-in-from-top-2">
                             <Hourglass className="w-4 h-4 text-orange-500" />
                             <span className="text-xs font-bold text-orange-700">รออนุมัติ: ขอเข้าสาย (Late Entry)</span>
                        </div>
                    )}

                    {/* General Pending Leave Banner (Non-Blocking) */}
                    {todayActiveLeave && todayActiveLeave.status === 'PENDING' && todayActiveLeave.type !== 'LATE_ENTRY' && todayActiveLeave.type !== 'FORGOT_CHECKIN' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between gap-2 mb-2 animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2">
                                <Hourglass className="w-4 h-4 text-yellow-600 animate-pulse" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-yellow-800">รออนุมัติ: {todayActiveLeave.type}</p>
                                    <p className="text-[10px] text-yellow-600">คุณสามารถ Check-in เพื่อยกเลิกการลาได้</p>
                                </div>
                             </div>
                        </div>
                    )}
                    
                    {/* Streak */}
                    {stats.currentStreak > 0 && (
                        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 py-1.5 rounded-xl border border-orange-200/50 mb-2 animate-pulse-slow">
                            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
                            <span className="text-xs font-black uppercase tracking-wide">
                                {stats.currentStreak} Day Streak!
                            </span>
                        </div>
                    )}

                    <div className={`rounded-xl p-4 text-center border-2 border-dashed ${dayStatus.mode === 'HOLIDAY' ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-sm font-medium mb-3 ${dayStatus.mode === 'HOLIDAY' ? 'text-pink-600' : 'text-gray-500'}`}>
                            {dayStatus.mode === 'HOLIDAY' ? 'แต่ถ้าจะทำงาน ก็กดได้เลย!' : 'พร้อมเริ่มงานรึยัง?'}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => onOpenCheckIn(dayStatus.mode === 'HOLIDAY')}
                                className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                                    ${dayStatus.mode === 'HOLIDAY' 
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink-200' 
                                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200'
                                    }
                                `}
                            >
                                <LogIn className="w-5 h-5" /> {dayStatus.mode === 'HOLIDAY' ? 'ลงเวลาปฏิบัติงานพิเศษในวันหยุด (OT)' : 'กดเพื่อลงเวลา (Check-in)'}
                            </button>
                            
                            {/* NEW: Forgot Check-in Component (Auto Logic) */}
                            <ForgotCheckInControl 
                                startTime={startTime}
                                lateBuffer={lateBuffer}
                                isCheckedIn={!!todayLog}
                                onSubmit={onCheckOutRequest}
                                leaveUsage={leaveUsage}
                            />
                        </div>
                    </div>
                </>
            )}
            
        </div>
    );
};

export default StatusCard;

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { History, RefreshCw, ShieldAlert, MapPin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeaveRequestModal from '../leave-request/LeaveRequestModal';
import { LeaveType, LeaveUsage, LeaveRequest, LocationDef } from '../../../types/attendance';
import { setHours, setMinutes, addMinutes, addHours, isWithinInterval } from 'date-fns';
import { useMasterData } from '../../../hooks/useMasterData';
import { useCheckInLocation } from '../../../hooks/attendance/useCheckInLocation';
import { OFFICE_COORDS } from '../../../lib/locationUtils';
import { BRAND_CONFIG } from '../../../config/brand';

interface ForgotCheckInControlProps {
    startTime: string; // "HH:mm" from MasterData
    lateBuffer: number; // Minutes
    isCheckedIn: boolean;
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, files?: File[], linkedRemoteType?: 'WFH' | 'ONSITE') => Promise<boolean>;
    leaveUsage?: LeaveUsage;
    todayActiveLeave?: LeaveRequest | null;
    availableLocations?: LocationDef[];
    isDesktop?: boolean;
}

const ForgotCheckInControl: React.FC<ForgotCheckInControlProps> = ({
    startTime,
    lateBuffer,
    isCheckedIn,
    onSubmit,
    leaveUsage,
    todayActiveLeave,
    availableLocations = [],
    isDesktop = false
}) => {
    const { masterOptions } = useMasterData();
    const isWfhEnabled = BRAND_CONFIG.showWfhOptionMode !== 2;

    const [isVisible, setIsVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [gpsCheckStatus, setGpsCheckStatus] = useState<'IDLE' | 'SCANNING' | 'SECURE_ERROR' | 'OFFSITE_ALERT' | 'SUCCESS_TRANSITION' | 'READY_FORM' | 'DETECTED_LINK'>('IDLE');
    const [gpsErrorReason, setGpsErrorReason] = useState('');
    const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(null);
    const [selectedRemoteType, setSelectedRemoteType] = useState<'WFH' | 'ONSITE' | undefined>(undefined);
    const [isInOffice, setIsInOffice] = useState(false);
    const [progress, setProgress] = useState(0);
    const [countdown, setCountdown] = useState(3);

    const formatDistance = (distanceMeters: number | null): string => {
        if (distanceMeters === null) return '0 ม.';
        if (distanceMeters < 1000) {
            return `${Math.round(distanceMeters)} ม.`;
        }
        return `${(distanceMeters / 1000).toFixed(2)} กม.`;
    };

    useEffect(() => {
        if (gpsCheckStatus !== 'SUCCESS_TRANSITION') {
            setProgress(0);
            setCountdown(3);
            return;
        }

        let startTimestamp: number | null = null;
        const duration = 3000; // 3 seconds
        let animationFrameId: number;

        const updateProgress = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsed = timestamp - startTimestamp;
            const percent = Math.min((elapsed / duration) * 100, 100);
            setProgress(percent);

            const remainingSeconds = Math.max(Math.ceil((duration - elapsed) / 1000), 0);
            setCountdown(remainingSeconds);

            if (elapsed < duration) {
                animationFrameId = requestAnimationFrame(updateProgress);
            } else {
                setGpsCheckStatus('READY_FORM');
                setIsModalOpen(true);
            }
        };

        animationFrameId = requestAnimationFrame(updateProgress);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [gpsCheckStatus]);

    const targets = useMemo(() => {
        if (availableLocations && availableLocations.length > 0) {
            return availableLocations;
        }

        const latOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LAT');
        const lngOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LNG');
        const radOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_RADIUS');

        return [{
            id: 'def',
            name: 'Office (Default)',
            lat: latOpt && latOpt.label && !isNaN(parseFloat(latOpt.label)) ? parseFloat(latOpt.label) : OFFICE_COORDS.lat,
            lng: lngOpt && lngOpt.label && !isNaN(parseFloat(lngOpt.label)) ? parseFloat(lngOpt.label) : OFFICE_COORDS.lng,
            radiusMeters: radOpt && radOpt.label && !isNaN(parseFloat(radOpt.label)) ? parseFloat(radOpt.label) : OFFICE_COORDS.radiusMeters,
            type: 'WORK_LOCATION'
        }];
    }, [availableLocations, masterOptions]);

    const { locationState, isGpsSecure, gpsThreatReason, checkLocation } = useCheckInLocation(targets);

    useEffect(() => {
        const checkVisibility = () => {
            // If already checked in, hide the button
            if (isCheckedIn) {
                setIsVisible(false);
                return;
            }

            const shiftsEnabledOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && (o.key === 'MULTIPLE_SHIFTS_ENABLED' || o.key === 'MULTIPLE_SHIFTS_ENABLE'));
            const shiftsListOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_LIST');
            const isShiftsEnabled = shiftsEnabledOpt?.label === 'true';

            let earliestStartTimeStr = startTime;
            let latestStartTimeStr = startTime;

            if (isShiftsEnabled && shiftsListOpt?.label) {
                const shiftsList = shiftsListOpt.label.split(',').map(s => s.trim()).filter(Boolean);
                if (shiftsList.length > 0) {
                    const sortedShifts = [...shiftsList].sort((a, b) => {
                        const [ah, am] = a.split(':').map(Number);
                        const [bh, bm] = b.split(':').map(Number);
                        return (ah * 60 + am) - (bh * 60 + bm);
                    });
                    earliestStartTimeStr = sortedShifts[0];
                    latestStartTimeStr = sortedShifts[sortedShifts.length - 1];
                }
            }

            if (!earliestStartTimeStr || !latestStartTimeStr) return;

            const now = new Date();
            const [earliestHour, earliestMinute] = earliestStartTimeStr.split(':').map(Number);
            const earliestWorkStartTime = setMinutes(setHours(now, earliestHour), earliestMinute);
            const showAfterTime = addMinutes(earliestWorkStartTime, lateBuffer);

            const [latestHour, latestMinute] = latestStartTimeStr.split(':').map(Number);
            const latestWorkStartTime = setMinutes(setHours(now, latestHour), latestMinute);

            const limitHoursOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'FORGOT_CHECKIN_LIMIT_HOURS');
            const limitHours = limitHoursOpt && limitHoursOpt.label && !isNaN(parseInt(limitHoursOpt.label, 10))
                ? parseInt(limitHoursOpt.label, 10)
                : 12;

            const hideAfterTime = addHours(latestWorkStartTime, limitHours);

            try {
                // Check if NOW is within the window (Starts after first shift buffer, ends dynamic limit hours after last shift)
                const shouldShow = isWithinInterval(now, { start: showAfterTime, end: hideAfterTime });
                setIsVisible(shouldShow);
            } catch (e) {
                // Handle edge cases where interval might be invalid (rare)
                setIsVisible(false);
            }
        };

        // Initial Check
        checkVisibility();

        // Re-check every minute
        const interval = setInterval(checkVisibility, 60000);
        return () => clearInterval(interval);
    }, [startTime, lateBuffer, isCheckedIn, masterOptions]);

    useEffect(() => {
        if (gpsCheckStatus === 'SCANNING') {
            if (!isGpsSecure) {
                setGpsErrorReason(gpsThreatReason || 'ตรวจพบพิกัดผิดปกติหรือการเปิดใช้ Fake GPS');
                setGpsCheckStatus('SECURE_ERROR');
            }
        }
    }, [isGpsSecure, gpsThreatReason, gpsCheckStatus]);

    useEffect(() => {
        if (gpsCheckStatus === 'SCANNING' && locationState.status === 'ERROR') {
            setGpsErrorReason(gpsThreatReason || 'ไม่สามารถดึงข้อมูลพิกัดได้ กรุณาเปิด GPS และอนุญาตสิทธิ์');
            setGpsCheckStatus('SECURE_ERROR');
        }
    }, [locationState.status, gpsThreatReason, gpsCheckStatus]);

    const handleStartForgotCheckIn = () => {
        setGpsCheckStatus('SCANNING');
        setSelectedRemoteType(undefined);
        setDistanceFromOffice(null);
        setIsInOffice(false);
        
        checkLocation(
            (matches, primaryMatch) => {
                // Inside Office!
                setIsInOffice(true);
                setSelectedRemoteType(undefined);
                setGpsCheckStatus('SUCCESS_TRANSITION');
            },
            (minDistance) => {
                // Outside Office!
                setDistanceFromOffice(minDistance);
                setIsInOffice(false);
                
                // Smart Decider: check if user has approved/pending WFH or ONSITE request today
                if (todayActiveLeave && 
                    ((isWfhEnabled && todayActiveLeave.type === 'WFH') || todayActiveLeave.type === 'ONSITE') &&
                    (todayActiveLeave.status === 'APPROVED' || todayActiveLeave.status === 'PENDING')
                ) {
                    setSelectedRemoteType(todayActiveLeave.type);
                    setGpsCheckStatus('DETECTED_LINK');
                } else {
                    setGpsCheckStatus('OFFSITE_ALERT');
                }
            }
        );
    };

    const handleSubmit = async (type: LeaveType, start: Date, end: Date, reason: string, files?: File[]) => {
        let finalReason = reason;
        if (distanceFromOffice !== null && distanceFromOffice > 0) {
            const distanceKm = (distanceFromOffice / 1000).toFixed(2);
            finalReason = `[DISTANCE:${distanceKm}] ${finalReason}`;
        }

        const effectiveRemoteType = selectedRemoteType || (
            todayActiveLeave && ((isWfhEnabled && todayActiveLeave.type === 'WFH') || todayActiveLeave.type === 'ONSITE')
                ? todayActiveLeave.type as 'WFH' | 'ONSITE'
                : undefined
        );

        if (effectiveRemoteType && !finalReason.includes('[REMOTE:')) {
            finalReason = `[REMOTE:${effectiveRemoteType}] ${finalReason}`;
        }

        const success = await onSubmit(type, start, end, finalReason, files, effectiveRemoteType);
        if (success) {
            setIsModalOpen(false);
            setGpsCheckStatus('IDLE');
        }
        return success;
    };

    if (!isVisible) return null;

    return (
        <>
            <motion.button 
                disabled={isDesktop}
                whileHover={isDesktop ? undefined : { scale: 1.02 }}
                whileTap={isDesktop ? undefined : { scale: 0.98 }}
                onClick={isDesktop ? undefined : handleStartForgotCheckIn}
                className={`py-2 px-4 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                    ${isDesktop
                        ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-white border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 cursor-pointer'
                    }
                `}
            >
                <History className="w-4 h-4" /> ลืมลงเวลาเข้า?
            </motion.button>

            {/* Render scanning/alert/error dialog via Portal */}
            {createPortal(
                <AnimatePresence>
                    {gpsCheckStatus !== 'IDLE' && gpsCheckStatus !== 'READY_FORM' && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overscroll-none">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                                onClick={() => setGpsCheckStatus('IDLE')} 
                            />
                            
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                                transition={{ 
                                    opacity: { duration: 0.25 },
                                    scale: { type: 'spring', stiffness: 350, damping: 28 },
                                    y: { type: 'spring', stiffness: 350, damping: 28 },
                                    layout: { type: 'spring', stiffness: 300, damping: 30 }
                                }}
                                className="relative bg-white w-full max-w-md min-h-[380px] rounded-[2rem] shadow-2xl p-6 border-4 border-white ring-1 ring-gray-100/50 flex flex-col items-center justify-between text-center overflow-hidden"
                            >
                                <AnimatePresence mode="wait">
                                    {gpsCheckStatus === 'SCANNING' && (
                                        <motion.div
                                            key="scanning"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-6 py-6 w-full flex flex-col items-center justify-center flex-1"
                                        >
                                            {/* Beautiful Animated Radar Scanner container */}
                                            <div className="relative flex items-center justify-center w-40 h-40">
                                                {/* Pulsing rings */}
                                                <motion.div 
                                                    animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
                                                    className="absolute inset-0 bg-indigo-100/70 rounded-full"
                                                />
                                                <motion.div 
                                                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2.2, delay: 0.7, ease: "easeOut" }}
                                                    className="absolute inset-0 bg-indigo-200/50 rounded-full"
                                                />
                                                <motion.div 
                                                    animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2.2, delay: 1.4, ease: "easeOut" }}
                                                    className="absolute inset-0 bg-indigo-300/30 rounded-full"
                                                />
                                                {/* Scanning concentric radar lines */}
                                                <div className="absolute inset-2 border border-indigo-100/50 rounded-full" />
                                                <div className="absolute inset-8 border border-dashed border-indigo-200/40 rounded-full" />
                                                <div className="absolute inset-14 border border-indigo-100/20 rounded-full" />
                                                
                                                {/* Rotating sweeps */}
                                                <motion.div 
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                                                    className="absolute inset-0 border-t-2 border-r border-indigo-400/40 rounded-full"
                                                    style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }}
                                                />

                                                {/* Center pulsing core badge */}
                                                <motion.div 
                                                    animate={{ scale: [0.95, 1.05, 0.95] }}
                                                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                                                    className="relative w-18 h-18 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-300/50"
                                                >
                                                    <motion.div
                                                        animate={{ rotate: -360 }}
                                                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                    >
                                                        <RefreshCw className="w-8 h-8" />
                                                    </motion.div>
                                                </motion.div>
                                            </div>

                                            <div className="space-y-2 max-w-sm">
                                                <h3 className="text-lg font-bold text-gray-800 tracking-tight flex items-center justify-center gap-2">
                                                    <motion.span
                                                        animate={{ opacity: [1, 0.5, 1] }}
                                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                                        className="w-2.5 h-2.5 bg-indigo-500 rounded-full"
                                                    />
                                                    กำลังตรวจสอบพิกัด (GPS Scan)
                                                </h3>
                                                <p className="text-xs text-gray-400 font-medium px-4 leading-relaxed">
                                                    ระบบกำลังตรวจสอบความปลอดภัยเพื่อยืนยันพิกัดปัจจุบันของคุณ และตรวจจับแอปพลิเคชันตำแหน่งจำลอง...
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {gpsCheckStatus === 'SECURE_ERROR' && (
                                        <motion.div
                                            key="secure_error"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-6 py-2 w-full flex flex-col items-center justify-between flex-1"
                                        >
                                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                                <ShieldAlert className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold text-red-600">สแกนพิกัดไม่สำเร็จ</h3>
                                                <p className="text-xs text-gray-500 font-medium px-2 leading-relaxed whitespace-pre-wrap">
                                                    {gpsErrorReason || 'ระบบตรวจพบการพยายามใช้แอปสวมสิทธิ์พิกัดปลอมหรือจำลอง GPS'}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setGpsCheckStatus('IDLE')}
                                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                            >
                                                ตกลง
                                            </button>
                                        </motion.div>
                                    )}

                                    {gpsCheckStatus === 'DETECTED_LINK' && (
                                        <motion.div
                                            key="detected_link"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-5 py-2 w-full flex flex-col items-center justify-between flex-1"
                                        >
                                            <div className="space-y-4 flex flex-col items-center">
                                                <div className="relative flex items-center justify-center mt-2">
                                                    <div className="absolute w-20 h-20 bg-indigo-50 rounded-full animate-ping opacity-60" />
                                                    <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                                                        {todayActiveLeave?.type === 'WFH' ? (
                                                            <span className="text-2xl">🏡</span>
                                                        ) : (
                                                            <span className="text-2xl">📍</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2 px-1">
                                                    <h3 className="text-lg font-bold text-gray-800">พบคำขอปฏิบัติงานล่วงหน้า</h3>
                                                    <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">
                                                        ระบบตรวจพบคำขอ <span className="font-bold text-indigo-600">{todayActiveLeave?.type === 'WFH' ? 'Work From Home (WFH)' : 'ปฏิบัติงานนอกสถานที่ (On-site)'}</span> ของคุณในวันนี้เรียบร้อยแล้ว ({todayActiveLeave?.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รอพิจารณา'})
                                                    </p>
                                                    <p className="text-[11px] text-indigo-600 font-semibold bg-indigo-50/70 rounded-2xl py-2.5 px-4 mx-2 leading-relaxed">
                                                        💡 ระบบจะผูกคำขอลืมลงเวลานี้เข้ากับรูปแบบงานดังกล่าวโดยอัตโนมัติ คุณไม่ต้องยื่นคำขอปฏิบัติงานซ้ำซ้อนอีกรอบครับ
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5 w-full px-2 pt-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setGpsCheckStatus('READY_FORM');
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    ดำเนินการต่อ <ArrowRight className="w-4 h-4" />
                                                </motion.button>
                                                <button 
                                                    onClick={() => setGpsCheckStatus('IDLE')}
                                                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                                                >
                                                    ยกเลิก
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {gpsCheckStatus === 'OFFSITE_ALERT' && (
                                        <motion.div
                                            key="offsite_alert"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-5 py-2 w-full flex flex-col items-center justify-between flex-1"
                                        >
                                            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                                <MapPin className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold text-gray-800">อยู่นอกพื้นที่สำนักงาน</h3>
                                                <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed font-sarabun">
                                                    ระบบตรวจพบว่าคุณอยู่นอกพื้นที่สำนักงานใหญ่เป็นระยะทาง <span className="font-bold text-amber-600">{formatDistance(distanceFromOffice)}</span>
                                                </p>
                                                <p className="text-[11px] text-amber-600 font-semibold bg-amber-50 rounded-xl py-1.5 px-3 mx-4 leading-relaxed">
                                                    ⚠️ เนื่องจากอยู่นอกพื้นที่ คุณจำเป็นต้องยื่นคำขอปฏิบัติงานนอกสถานที่ควบคู่เพื่อตรวจสอบความถูกต้อง
                                                </p>
                                            </div>

                                            <div className="space-y-2.5 px-2 w-full">
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left pl-1">
                                                    กรุณาเลือกรูปแบบการทำงานของวันนี้:
                                                </div>
                                                <div className={`grid ${isWfhEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-3 w-full`}>
                                                    {isWfhEnabled && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.03, y: -4, borderColor: '#a5b4fc', boxShadow: '0 8px 16px rgba(99,102,241,0.08)' }}
                                                            whileTap={{ scale: 0.97 }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                            onClick={() => {
                                                                setSelectedRemoteType('WFH');
                                                                setGpsCheckStatus('READY_FORM');
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-4 bg-[#f8fafc] border-2 border-gray-100 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer group text-center"
                                                        >
                                                            <span className="text-lg">🏡</span>
                                                            <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-600">Work From Home</span>
                                                            <span className="text-[9px] text-gray-400 font-medium">ทำงานที่บ้าน</span>
                                                        </motion.button>
                                                    )}

                                                    <motion.button
                                                        whileHover={{ scale: 1.02, y: -2, borderColor: '#6ee7b7', boxShadow: '0 8px 16px rgba(16,185,129,0.08)' }}
                                                        whileTap={{ scale: 0.98 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                        onClick={() => {
                                                            setSelectedRemoteType('ONSITE');
                                                            setGpsCheckStatus('READY_FORM');
                                                            setIsModalOpen(true);
                                                        }}
                                                        className={`p-4 bg-[#f8fafc] border-2 border-gray-100 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer group text-center w-full ${!isWfhEnabled ? 'py-5' : ''}`}
                                                    >
                                                        <span className={isWfhEnabled ? 'text-lg' : 'text-xl'}>📍</span>
                                                        <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-600">
                                                            {isWfhEnabled ? 'On-Site' : 'ปฏิบัติงานนอกสถานที่ (On-site)'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-medium">
                                                            {isWfhEnabled ? 'ปฏิบัติงานนอกสถานที่' : 'ยืนยันขอลงเวลากรณีปฏิบัติงานนอกสถานที่ / ออกกอง'}
                                                        </span>
                                                    </motion.button>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => setGpsCheckStatus('IDLE')}
                                                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                                            >
                                                ยกเลิก
                                            </button>
                                        </motion.div>
                                    )}

                                    {gpsCheckStatus === 'SUCCESS_TRANSITION' && (
                                        <motion.div
                                            key="success_transition"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-6 py-4 w-full flex flex-col items-center justify-center flex-1"
                                        >
                                            {/* Large Pulsing Check Circle */}
                                            <div className="relative flex items-center justify-center w-36 h-36">
                                                {/* Pulsing Ripple */}
                                                <motion.div 
                                                    animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                                    className="absolute inset-0 bg-emerald-100 rounded-full"
                                                />
                                                <motion.div 
                                                    animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2, delay: 0.6, ease: "easeOut" }}
                                                    className="absolute inset-0 bg-emerald-200 rounded-full"
                                                />
                                                
                                                {/* Safe Inner Ring */}
                                                <div className="absolute inset-2 border border-emerald-100 rounded-full" />

                                                {/* Core Animated Success Badge */}
                                                <motion.div 
                                                    initial={{ scale: 0, rotate: -45 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                    className="relative w-18 h-18 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200"
                                                >
                                                    <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <motion.path 
                                                            initial={{ pathLength: 0 }}
                                                            animate={{ pathLength: 1 }}
                                                            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round" 
                                                            d="M5 13l4 4L19 7" 
                                                        />
                                                    </svg>
                                                </motion.div>
                                            </div>

                                            {/* Info and Badge */}
                                            <div className="space-y-3 px-4 flex flex-col items-center">
                                                {/* Badge */}
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1.5 shadow-sm text-emerald-700 text-[10px] font-bold uppercase tracking-wider"
                                                >
                                                    <span className="text-[11px] leading-none">🏢</span>
                                                    <span>Office Secure</span>
                                                </motion.div>

                                                <h3 className="text-base font-bold text-gray-800 tracking-tight font-kanit">
                                                    ระบบตรวจสอบพิกัดเสร็จสิ้น
                                                </h3>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xs font-sarabun text-center">
                                                    คุณยืนยันตัวตนอยู่ที่ <span className="font-bold text-emerald-600">[{locationState.matchedLocation?.name || 'สำนักงานใหญ่'}]</span> เรียบร้อยแล้ว
                                                </p>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full px-6 space-y-2">
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className="bg-emerald-500 h-full transition-all duration-75 ease-out rounded-full" 
                                                        style={{ width: `${progress}%` }} 
                                                    />
                                                </div>
                                                <p className="text-[11px] text-emerald-600 font-semibold font-sarabun text-center">
                                                    กำลังนำคุณไปยังหน้ายื่นคำขอในอีก {countdown} วินาที...
                                                </p>
                                            </div>

                                            {/* Skip button */}
                                            <button 
                                                onClick={() => {
                                                    setGpsCheckStatus('READY_FORM');
                                                    setIsModalOpen(true);
                                                }}
                                                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full text-[11px] font-bold transition-all hover:text-gray-700 flex items-center gap-1 shrink-0 cursor-pointer"
                                            >
                                                ข้ามขั้นตอนการรอ (Skip)
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <LeaveRequestModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setGpsCheckStatus('IDLE');
                }}
                onBack={() => {
                    setIsModalOpen(false);
                    if (isInOffice) {
                        setGpsCheckStatus('IDLE');
                    } else if (todayActiveLeave && 
                        ((isWfhEnabled && todayActiveLeave.type === 'WFH') || todayActiveLeave.type === 'ONSITE') &&
                        (todayActiveLeave.status === 'APPROVED' || todayActiveLeave.status === 'PENDING')
                    ) {
                        setGpsCheckStatus('DETECTED_LINK');
                    } else {
                        setGpsCheckStatus('OFFSITE_ALERT');
                    }
                }}
                onSubmit={handleSubmit}
                masterOptions={masterOptions}
                leaveUsage={leaveUsage}
                fixedType="FORGOT_CHECKIN"
                initialTargetTime={startTime}
                linkedRemoteType={selectedRemoteType}
                isInOffice={isInOffice}
                locationName={locationState.matchedLocation?.name}
            />
        </>
    );
};

export default ForgotCheckInControl;

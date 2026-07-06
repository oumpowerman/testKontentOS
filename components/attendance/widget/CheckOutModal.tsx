import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Loader2, AlertTriangle, Send, LogOut, RefreshCw, Clock, CheckCircle2, MessageSquare, Sparkles, Hourglass } from 'lucide-react';
import { LocationDef } from '../../../types/attendance';
import { calculateDistance } from '../../../lib/locationUtils';
import { format } from 'date-fns';
import { calculateCheckOutStatus } from '../../../lib/attendanceUtils';
import { useMasterData } from '../../../hooks/useMasterData';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useGameConfig } from '../../../context/GameConfigContext';
import TimePickerModal from '../../ui/TimePickerModal';

interface CheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>; // Updated signature
    onRequest: (time: string, reason: string) => Promise<boolean>; // Correction request
    availableLocations: LocationDef[];
    checkInTime: Date; // Passed from parent for calculation
    onOvertimeSubmit?: (otMinutes: number, reason: string) => Promise<boolean>;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({ 
    isOpen, onClose, onConfirm, onRequest, availableLocations, checkInTime, onOvertimeSubmit
}) => {
    const { showAlert } = useGlobalDialog();
    const { masterOptions } = useMasterData(); // Fetch latest config
    const { config } = useGameConfig(); // Fetch game tuner configs

    // Dynamically retrieve early leave interval and rate from Game Config (LawTuner), Master Options (DB), or safe fallbacks
    const earlyLeaveInterval = parseFloat(
        config?.PENALTY_RATES?.HP_PENALTY_EARLY_LEAVE_INTERVAL?.toString() || 
        masterOptions.find(o => o.key === 'HP_PENALTY_EARLY_LEAVE_INTERVAL')?.label || 
        '10'
    );
    const earlyLeaveRate = parseFloat(
        config?.PENALTY_RATES?.HP_PENALTY_EARLY_LEAVE_RATE?.toString() || 
        masterOptions.find(o => o.key === 'HP_PENALTY_EARLY_LEAVE_RATE')?.label || 
        '1'
    );
    
    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'OUT_OF_RANGE' | 'ERROR'>('LOADING');
    const [distance, setDistance] = useState(0);
    const [matchedLocation, setMatchedLocation] = useState<LocationDef | undefined>();
    const [currentLat, setCurrentLat] = useState<number>(0);
    const [currentLng, setCurrentLng] = useState<number>(0);
    
    // Status Logic State
    const [checkOutStatus, setCheckOutStatus] = useState<'COMPLETED' | 'EARLY_LEAVE'>('COMPLETED');
    const [statusDetails, setStatusDetails] = useState<any>(null);

    // Overtime Flow State
    const [otFlowStep, setOtFlowStep] = useState<'NONE' | 'PROMPT' | 'REASON'>('NONE');
    const [otReason, setOtReason] = useState('');
    const [otStartTime, setOtStartTime] = useState('');
    const [otEndTime, setOtEndTime] = useState('');
    const [activeOtTimePicker, setActiveOtTimePicker] = useState<'START' | 'END' | null>(null);

    // Form for Request / Early Leave
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [earlyReason, setEarlyReason] = useState(''); // New state for early leave reason when GPS is OK
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [showEarlyConfirmation, setShowEarlyConfirmation] = useState(false);

    // Calculate real-time projected OT hours and JP rewards based on custom selected start & end times
    const otDetails = React.useMemo(() => {
        const start = otStartTime || (statusDetails?.requiredEndTime ? format(statusDetails.requiredEndTime, 'HH:mm') : '18:00');
        const end = otEndTime || format(new Date(), 'HH:mm');
        
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        
        let minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        if (minutes < 0) {
            minutes += 24 * 60; // handle cross-day OT
        }
        
        const hours = (minutes / 60).toFixed(1);
        const calculatedJP = Math.round((minutes / 60) * 10); // Base rate 10 JP per hour
        return { minutes, hours, calculatedJP };
    }, [otStartTime, otEndTime, statusDetails]);

    useEffect(() => {
        if (isOpen) {
            checkLocation();
            setTime(format(new Date(), 'HH:mm'));
            setReason('');
            setEarlyReason('');
            setOtFlowStep('NONE');
            setOtReason('');
            setStatus('LOADING');
            setShowEarlyConfirmation(false);
            
            // Calculate Status Logic (Strict Duration)
            const minHours = parseFloat(masterOptions.find(o => o.key === 'MIN_HOURS')?.label || '9');
            
            const result = calculateCheckOutStatus(checkInTime, new Date(), minHours);
            setCheckOutStatus(result.status);
            setStatusDetails(result);

            // Initialize custom OT start & end times
            if (result && result.requiredEndTime) {
                setOtStartTime(format(result.requiredEndTime, 'HH:mm'));
            } else {
                setOtStartTime('18:00');
            }
            setOtEndTime(format(new Date(), 'HH:mm'));
        }
    }, [isOpen]);

    const checkLocation = () => {
        setStatus('LOADING');
        if (!navigator.geolocation) {
            setStatus('ERROR');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setCurrentLat(latitude);
                setCurrentLng(longitude);
                
                let minDetails = { dist: Infinity, loc: undefined as LocationDef | undefined };

                for (const loc of availableLocations) {
                    const dist = calculateDistance(latitude, longitude, loc.lat, loc.lng);
                    if (dist < minDetails.dist) {
                        minDetails = { dist, loc };
                    }
                    if (dist <= loc.radiusMeters) {
                         // Found valid location
                         setDistance(dist);
                         setMatchedLocation(loc);
                         setStatus('SUCCESS');
                         return;
                    }
                }
                
                // If loop finishes without return, we are out of range
                setDistance(minDetails.dist);
                setMatchedLocation(minDetails.loc); // Closest one
                setStatus('OUT_OF_RANGE');
            },
            () => setStatus('ERROR'),
            { enableHighAccuracy: true }
        );
    };

    const handleNormalSubmit = async () => {
        if (checkOutStatus === 'EARLY_LEAVE') {
            if (!earlyReason.trim()) {
                showAlert('กรุณาระบุเหตุผลที่กลับก่อนเวลาด้วยครับ', 'ข้อมูลไม่ครบ');
                return;
            }
            if (!showEarlyConfirmation) {
                setShowEarlyConfirmation(true);
                return;
            }
        }

        // Overtime check logic
        if (checkOutStatus === 'COMPLETED' && otFlowStep === 'NONE') {
            const otThresholdOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OT_THRESHOLD_HOURS');
            const otThreshold = parseFloat(otThresholdOpt?.label || '2');
            
            // thresholdEndTime = requiredEndTime + otThreshold (hours)
            if (statusDetails && statusDetails.requiredEndTime) {
                const thresholdEndTime = new Date(statusDetails.requiredEndTime.getTime() + otThreshold * 60 * 60 * 1000);
                if (new Date() > thresholdEndTime) {
                    setOtFlowStep('PROMPT');
                    return;
                }
            }
        }
        
        setIsSubmitting(true);
        // Pass location and potential reason
        await onConfirm(
            { lat: currentLat, lng: currentLng }, 
            matchedLocation?.name, 
            earlyReason
        );
        setIsSubmitting(false);
        setShowEarlyConfirmation(false);
        onClose();
    };

    const handleForgetfulSubmit = async () => {
        if (!statusDetails || !statusDetails.requiredEndTime) return;
        setIsSubmitting(true);
        
        // Pass the adjusted checkout timestamp inside the reason parameter using a parsed format
        const adjustedCheckoutTime = statusDetails.requiredEndTime;
        await onConfirm(
            { lat: currentLat, lng: currentLng },
            matchedLocation?.name,
            `[ADJUSTED_CHECKOUT:${adjustedCheckoutTime.toISOString()}] ลืมลงเวลากลับตามปกติ`
        );
        
        setIsSubmitting(false);
        showAlert('ระบบลงเวลากลับตามปกติเวลา ' + format(adjustedCheckoutTime, 'HH:mm') + ' น. สำเร็จแล้วครับ 👍', 'ลงเวลากลับ');
        onClose();
    };

    const handleOvertimeSubmit = async () => {
        if (!otReason.trim()) {
            showAlert('กรุณาระบุรายละเอียดงานล่วงเวลาด้วยครับ', 'ข้อมูลไม่ครบ');
            return;
        }
        if (!statusDetails || !statusDetails.requiredEndTime) return;

        setIsSubmitting(true);
        
        // 1. Check out now at the actual current time with OT reason
        await onConfirm(
            { lat: currentLat, lng: currentLng },
            matchedLocation?.name,
            `[OT_PENDING:${otReason}] ทำงานล่วงเวลา (OT): ${otReason}`
        );

        // 2. Calculate OT minutes from selected start/end times and submit the formal OT request
        const otMinutes = otDetails.minutes;
        if (onOvertimeSubmit) {
            await onOvertimeSubmit(
                otMinutes, 
                `[OT:${otStartTime}-${otEndTime}] (${otDetails.hours}hr) [OT_MINUTES:${otMinutes}] ${otReason}`
            );
        }

        setIsSubmitting(false);
        onClose();
    };

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;
        setIsSubmitting(true);
        const success = await onRequest(time, reason);
        setIsSubmitting(false);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-4 border-white">
                
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-gray-800">ยืนยันเวลาออก (Check-out)</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {otFlowStep === 'PROMPT' && statusDetails && (
                        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse shadow-lg shadow-violet-100">
                                <Clock className="w-8 h-8 text-violet-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-violet-800">ยืนยันการบันทึก OT</h3>
                                <p className="text-xs text-gray-500">คุณเลิกงานเกินเวลาเลิกงานมาตรฐานมามากกว่า 2 ชั่วโมง</p>
                            </div>
                            
                            <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100 text-left space-y-1">
                                <p className="text-xs font-bold text-violet-700">สรุปเวลาทำงานของวันนี้:</p>
                                <p className="text-xs text-gray-600">เวลาเข้างานจริง: <span className="font-bold text-gray-800">{format(checkInTime, 'HH:mm')} น.</span></p>
                                <p className="text-xs text-gray-600">เวลาเลิกงานเกณฑ์ปกติ: <span className="font-bold text-gray-800">{format(statusDetails.requiredEndTime, 'HH:mm')} น.</span></p>
                                <p className="text-xs text-gray-600">เวลาปัจจุบัน: <span className="font-bold text-violet-700">{format(new Date(), 'HH:mm')} น.</span></p>
                            </div>

                            <p className="text-sm font-bold text-gray-700">คุณทำงานล่วงเวลา (OT) ใช่หรือไม่?</p>

                            <div className="space-y-3">
                                <button 
                                    onClick={handleForgetfulSubmit}
                                    disabled={isSubmitting}
                                    className="w-full p-4 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/20 rounded-2xl text-left transition-all active:scale-98 flex items-start gap-3 group"
                                >
                                    <div className="p-2 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 shrink-0">
                                        <RefreshCw className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">ไม่ใช่ ฉันแค่ลืมลงเวลา</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">ระบบจะบันทึกเวลาเลิกงานของคุณเป็นแบบมาตรฐาน ({format(statusDetails.requiredEndTime, 'HH:mm')} น.)</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setOtFlowStep('REASON')}
                                    className="w-full p-4 border-2 border-violet-200 hover:border-violet-300 bg-gradient-to-br from-violet-50/60 to-fuchsia-50/60 rounded-2xl text-left transition-all active:scale-98 flex items-start gap-3 shadow-lg shadow-violet-100/50 hover:shadow-violet-200/50 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-300/10 via-fuchsia-300/10 to-indigo-300/10 animate-pulse pointer-events-none" />
                                    <div className="p-2 bg-violet-100 rounded-xl text-violet-600 group-hover:bg-violet-200 shrink-0 relative z-10">
                                        <Send className="w-4 h-4" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-sm font-bold text-violet-900 flex items-center gap-1.5">
                                            ใช่ ฉันทำงานล่วงเวลาจริง 
                                            <span className="text-[10px] bg-violet-200/60 text-violet-700 px-1.5 py-0.5 rounded-full font-bold">OT ✨</span>
                                        </p>
                                        <p className="text-[11px] text-violet-700/80 mt-0.5">บันทึกเวลาออกงานปัจจุบัน และส่งคำขออนุมัติชั่วโมง OT ล่วงเวลาอย่างเป็นทางการ</p>
                                    </div>
                                </button>
                            </div>

                            <button 
                                onClick={() => setOtFlowStep('NONE')}
                                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ย้อนกลับ
                            </button>
                        </div>
                    )}

                    {otFlowStep === 'REASON' && (
                        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                                <MessageSquare className="w-8 h-8 text-violet-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-violet-800">ระบุรายละเอียดงาน OT</h3>
                                <p className="text-xs text-gray-500">กรุณากรอกเหตุผลหรือรายละเอียดการทำงานล่วงเวลา</p>
                            </div>

                            {/* JP Prediction Card */}
                            {otDetails && otDetails.minutes > 0 && (
                                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-4 rounded-2xl text-left space-y-1.5 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Sparkles className="w-12 h-12 text-violet-600" />
                                    </div>
                                    <p className="text-[11px] font-bold text-violet-700 flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" /> แต้มรางวัลคาดการณ์ (Projected Rewards)
                                    </p>
                                    <p className="text-[11px] text-gray-600 leading-relaxed">
                                        หากคำขอนี้ได้รับการอนุมัติ คุณจะได้รับโบนัสประมาณ <span className="font-black text-violet-700 text-sm">+{otDetails.calculatedJP} JP</span> (คำนวณจาก <span className="font-bold text-gray-800">{otDetails.hours} ชม.</span> x อัตรา JP พื้นฐาน 10 JP/ชม.)
                                    </p>
                                </div>
                            )}

                            {/* TIME PICKER INPUTS FOR OT */}
                            <div className="grid grid-cols-2 gap-3 text-left">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">เวลาเริ่มต้น OT</label>
                                    <button
                                        type="button"
                                        onClick={() => setActiveOtTimePicker('START')}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-300 rounded-2xl font-bold text-gray-700 transition-all text-sm"
                                    >
                                        <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
                                        {otStartTime || '--:--'}
                                    </button>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">เวลาสิ้นสุด OT</label>
                                    <button
                                        type="button"
                                        onClick={() => setActiveOtTimePicker('END')}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 hover:border-rose-300 rounded-2xl font-bold text-gray-700 transition-all text-sm"
                                    >
                                        <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
                                        {otEndTime || '--:--'}
                                    </button>
                                </div>
                            </div>

                            {/* แสดงสรุปชั่วโมง OT รวมใต้ปุ่มเลือกเวลา */}
                            {otDetails && (
                                <div className="flex items-center justify-between p-3.5 px-4 bg-violet-50/50 border border-violet-100 rounded-2xl text-xs transition-all animate-in fade-in slide-in-from-top-2 shadow-sm shadow-violet-100/30">
                                    <span className="text-violet-700 font-bold flex items-center gap-1.5">
                                        <Hourglass className="w-3.5 h-3.5 text-violet-500 animate-spin-slow" /> รวมเวลา OT:
                                    </span>
                                    <span className="font-extrabold text-violet-700 bg-white border border-violet-200/60 px-2.5 py-1 rounded-lg shadow-sm">
                                        {otDetails.hours} ชั่วโมง <span className="text-violet-400 font-normal">({otDetails.minutes} นาที)</span>
                                    </span>
                                </div>
                            )}

                            <div className="text-left space-y-2">
                                <label className="text-xs font-bold text-gray-500">รายละเอียดงานที่ทำล่วงเวลา (Required)</label>
                                <textarea
                                    value={otReason}
                                    onChange={e => setOtReason(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-violet-100 focus:border-violet-300 outline-none resize-none"
                                    placeholder="เช่น ประชุมวางแผนโปรเจกต์ใหม่, แก้ไขข้อผิดพลาดบนระบบเซิร์ฟเวอร์..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={handleOvertimeSubmit}
                                    disabled={isSubmitting || !otReason.trim() || otDetails.minutes <= 0}
                                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                    ส่งคำขอและเลิกงาน
                                </button>

                                <button
                                    onClick={() => setOtFlowStep('PROMPT')}
                                    className="w-full py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    ย้อนกลับ
                                </button>
                            </div>
                        </div>
                    )}

                    {otFlowStep === 'NONE' && (
                        showEarlyConfirmation ? (
                            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse shadow-lg shadow-red-100">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-red-800">⚠️ ยืนยันการกลับก่อนเวลา</h3>
                                    <p className="text-xs text-gray-500">การลงเวลาก่อนเวลาปฏิบัติงานมาตรฐานจะส่งผลต่อสถานะของคุณ</p>
                                </div>

                                <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-100 text-left space-y-2">
                                    <p className="text-xs font-bold text-orange-700">รายละเอียดชั่วโมงงาน:</p>
                                    <p className="text-xs text-gray-600 flex justify-between">
                                        <span>เวลาเลิกงานเกณฑ์ปกติ:</span>
                                        <span className="font-bold text-gray-800">{statusDetails ? format(statusDetails.requiredEndTime, 'HH:mm') : '--:--'} น.</span>
                                    </p>
                                    <p className="text-xs text-gray-600 flex justify-between">
                                        <span>เวลาปัจจุบัน:</span>
                                        <span className="font-bold text-gray-800">{format(new Date(), 'HH:mm')} น.</span>
                                    </p>
                                    <p className="text-xs text-gray-600 flex justify-between border-t border-orange-100/50 pt-2">
                                        <span>เวลาปฏิบัติงานขาดไป:</span>
                                        <span className="font-bold text-orange-600">ขาดอีก {statusDetails ? statusDetails.missingMinutes.toFixed(0) : 0} นาที</span>
                                    </p>
                                </div>

                                {statusDetails && (
                                    <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl text-left space-y-1.5">
                                        <p className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> ผลกระทบด้านคะแนน (HP Penalty)
                                        </p>
                                        <p className="text-xs text-red-800 font-bold">
                                            🚨 คุณจะถูกหักคะแนนชีวิต (HP) ทันที: -{Math.ceil(statusDetails.missingMinutes / earlyLeaveInterval) * earlyLeaveRate} HP
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            (เกณฑ์หักคะแนน: หัก {earlyLeaveRate} HP ทุก ๆ {earlyLeaveInterval} นาทีที่กลับก่อนเวลา)
                                        </p>
                                    </div>
                                )}

                                <p className="text-xs text-gray-600 px-2 leading-relaxed">
                                    การกลับก่อนเวลาจะส่งผลต่อคะแนนสุขภาพในระบบเกมของคุณ คุณยังยืนยันที่จะตอกบัตรกลับ ณ เวลานี้หรือไม่?
                                </p>

                                <div className="space-y-2 pt-2">
                                    <button
                                        onClick={handleNormalSubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogOut className="w-6 h-6" />}
                                        ใช่, ฉันยืนยันต้องการกลับตอนนี้
                                    </button>

                                    <button
                                        onClick={() => setShowEarlyConfirmation(false)}
                                        className="w-full py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        ไม่, ย้อนกลับไปทำงานต่อ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {statusDetails && (
                                    <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${checkOutStatus === 'EARLY_LEAVE' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                                        <div className={`p-2 rounded-full shrink-0 ${checkOutStatus === 'EARLY_LEAVE' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                            {checkOutStatus === 'EARLY_LEAVE' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-sm ${checkOutStatus === 'EARLY_LEAVE' ? 'text-orange-800' : 'text-green-800'}`}>
                                                {checkOutStatus === 'EARLY_LEAVE' ? 'ยังไม่ครบชั่วโมงงาน' : 'เวลาครบตามเกณฑ์'}
                                            </h4>
                                            <p className="text-xs mt-1 text-gray-600">
                                                เวลาที่ต้องออก: <span className="font-bold">{format(statusDetails.requiredEndTime, 'HH:mm')}</span> <br/>
                                                {checkOutStatus === 'EARLY_LEAVE' 
                                                    ? `(ขาดอีก ${statusDetails.missingMinutes.toFixed(0)} นาที)` 
                                                    : `(ทำไปแล้ว ${statusDetails.hoursWorked.toFixed(1)} ชม.)`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {status === 'LOADING' && (
                                    <div className="py-10 text-center">
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3"/>
                                        <p className="text-gray-500 font-bold">กำลังตรวจสอบพิกัด...</p>
                                    </div>
                                )}

                                {status === 'ERROR' && (
                                    <div className="text-center">
                                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3"/>
                                        <p className="text-red-600 font-bold">ไม่สามารถระบุตำแหน่งได้</p>
                                        <p className="text-sm text-gray-500 mt-1">กรุณาลองใหม่ หรือส่งคำขอแบบ Manual</p>
                                        <button onClick={checkLocation} className="mt-4 text-indigo-600 font-bold text-sm underline">ลองใหม่</button>
                                        
                                        {/* Fallback to Request Form if GPS fails */}
                                        <form onSubmit={handleRequestSubmit} className="mt-6 text-left space-y-3 pt-4 border-t border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase">ส่งคำขอ Check-out</p>
                                            <div>
                                                <label className="text-xs font-bold text-gray-700">เวลาออกจริง</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsTimePickerOpen(true)}
                                                    className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-bold text-center text-xl text-indigo-600 shadow-sm hover:border-indigo-400 transition-all"
                                                >
                                                    {time || '--:--'}
                                                </button>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-700">เหตุผล / หมายเหตุ</label>
                                                <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded-xl text-sm" placeholder="เช่น GPS มีปัญหา, แบตหมด..." required rows={2} />
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex justify-center">
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'ส่งคำขออนุมัติ'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {status === 'SUCCESS' && (
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                            <MapPin className="w-10 h-10 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-black text-green-700">อยู่ในพื้นที่ Check-out</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {matchedLocation?.name} (ระยะ {distance.toFixed(0)}m)
                                        </p>
                                        
                                        {/* Early Leave Reason Input */}
                                        {checkOutStatus === 'EARLY_LEAVE' && (
                                            <div className="mt-4 text-left bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                <label className="text-xs font-bold text-orange-700 mb-1 flex items-center">
                                                    <MessageSquare className="w-3 h-3 mr-1"/> ระบุเหตุผลที่กลับก่อน (Required)
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white" 
                                                    placeholder="เช่น ป่วย, ธุระด่วน..."
                                                    value={earlyReason}
                                                    onChange={e => setEarlyReason(e.target.value)}
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="mt-6">
                                            <button 
                                                onClick={handleNormalSubmit}
                                                disabled={isSubmitting}
                                                className={`w-full py-4 text-white rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${checkOutStatus === 'EARLY_LEAVE' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                                            >
                                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin"/> : <LogOut className="w-6 h-6"/>}
                                                {checkOutStatus === 'EARLY_LEAVE' ? 'ยืนยันกลับก่อน (Early)' : 'ยืนยันการเลิกงาน'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {status === 'OUT_OF_RANGE' && (
                                    <div>
                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-3 mb-4">
                                            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-orange-800 text-sm">อยู่นอกพื้นที่ ({distance.toFixed(0)}m)</h4>
                                                <p className="text-xs text-orange-700 mt-0.5">
                                                    คุณอยู่ห่างจาก {matchedLocation?.name || 'Office'} เกินกำหนด
                                                </p>
                                                <button onClick={checkLocation} className="text-[10px] font-bold text-orange-600 underline mt-1 flex items-center gap-1">
                                                    <RefreshCw className="w-3 h-3"/> ลองใหม่
                                                </button>
                                            </div>
                                        </div>

                                        <form onSubmit={handleRequestSubmit} className="space-y-4">
                                            <p className="text-sm font-bold text-gray-700">กรุณาส่งคำขอ Check-out นอกสถานที่</p>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">เวลาเลิกงานจริง (Actual Time)</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsTimePickerOpen(true)}
                                                    className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-bold text-gray-800 text-center text-xl focus:ring-2 focus:ring-indigo-100 outline-none hover:border-indigo-400 transition-all"
                                                >
                                                    {time || '--:--'}
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">เหตุผล (Reason)</label>
                                                <textarea 
                                                    value={reason} 
                                                    onChange={e => setReason(e.target.value)} 
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none" 
                                                    placeholder="เช่น ออกมาหาลูกค้าแล้วกลับบ้านเลย..." 
                                                    rows={3}
                                                    required 
                                                />
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={isSubmitting}
                                                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                                                ส่งคำขออนุมัติ
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>
            </div>
            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={time}
                onSelect={(val) => setTime(val)}
            />
            <TimePickerModal
                isOpen={activeOtTimePicker !== null}
                onClose={() => setActiveOtTimePicker(null)}
                initialTime={activeOtTimePicker === 'START' ? otStartTime : otEndTime}
                onSelect={(val) => {
                    if (activeOtTimePicker === 'START') {
                        setOtStartTime(val);
                    } else if (activeOtTimePicker === 'END') {
                        setOtEndTime(val);
                    }
                    setActiveOtTimePicker(null);
                }}
            />
        </div>,
        document.body
    );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Loader2, AlertTriangle, Send, LogOut, RefreshCw, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { LocationDef } from '../../types/attendance';
import { calculateDistance } from '../../lib/locationUtils';
import { format } from 'date-fns';
import { calculateCheckOutStatus } from '../../lib/attendanceUtils';
import { useMasterData } from '../../hooks/useMasterData';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import TimePickerModal from '../ui/TimePickerModal';

interface CheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>; // Updated signature
    onRequest: (time: string, reason: string) => Promise<boolean>; // Correction request
    availableLocations: LocationDef[];
    checkInTime: Date; // Passed from parent for calculation
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({ 
    isOpen, onClose, onConfirm, onRequest, availableLocations, checkInTime
}) => {
    const { showAlert } = useGlobalDialog();
    const { masterOptions } = useMasterData(); // Fetch latest config
    
    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'OUT_OF_RANGE' | 'ERROR'>('LOADING');
    const [distance, setDistance] = useState(0);
    const [matchedLocation, setMatchedLocation] = useState<LocationDef | undefined>();
    const [currentLat, setCurrentLat] = useState<number>(0);
    const [currentLng, setCurrentLng] = useState<number>(0);
    
    // Status Logic State
    const [checkOutStatus, setCheckOutStatus] = useState<'COMPLETED' | 'EARLY_LEAVE'>('COMPLETED');
    const [statusDetails, setStatusDetails] = useState<any>(null);

    // Form for Request / Early Leave
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [earlyReason, setEarlyReason] = useState(''); // New state for early leave reason when GPS is OK
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkLocation();
            setTime(format(new Date(), 'HH:mm'));
            setReason('');
            setEarlyReason('');
            setStatus('LOADING');
            
            // Calculate Status Logic (Strict Duration)
            const minHours = parseFloat(masterOptions.find(o => o.key === 'MIN_HOURS')?.label || '9');
            
            const result = calculateCheckOutStatus(checkInTime, new Date(), minHours);
            setCheckOutStatus(result.status);
            setStatusDetails(result);
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
        if (checkOutStatus === 'EARLY_LEAVE' && !earlyReason.trim()) {
            showAlert('กรุณาระบุเหตุผลที่กลับก่อนเวลาด้วยครับ', 'ข้อมูลไม่ครบ');
            return;
        }
        
        setIsSubmitting(true);
        // Pass location and potential reason
        await onConfirm(
            { lat: currentLat, lng: currentLng }, 
            matchedLocation?.name, 
            earlyReason
        );
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
                    {/* Status Feedback */}
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
                </div>
            </div>
            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={time}
                onSelect={(val) => setTime(val)}
            />
        </div>,
        document.body
    );
};

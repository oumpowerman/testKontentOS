import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, CheckCircle2, XCircle, Calendar, Clock, 
    Briefcase, AlertTriangle, MapPin, Moon, FileText, 
    ExternalLink, User, HelpCircle, ShieldAlert, Settings,
    History, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { LeaveRequest } from '../../../types/attendance';
import { getWorkingDaysDifference } from '../../../lib/attendanceUtils';
import { useMasterData } from '../../../hooks/useMasterData';
import { attendanceService } from '../../../services/attendanceService';
import TimePickerModal from '../../ui/TimePickerModal';

interface RequestDetailModalProps {
    request: LeaveRequest | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (
        req: LeaveRequest, 
        customOtHours?: number, 
        customStartTime?: string, 
        customEndTime?: string,
        adminNote?: string
    ) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
}

interface ParsedReason {
    cleanReason: string;
    isLateSubmission: boolean;
    isLocationMismatch: boolean;
    forgotCheckoutPenalty: boolean;
    time: string | null;
    otHours: string | null;
}

const parseReason = (reason: string): ParsedReason => {
    let text = reason || '';
    
    const isLateSubmission = text.includes('[LATE_SUBMISSION]');
    text = text.replace(/\[LATE_SUBMISSION\]/g, '');
    
    const isLocationMismatch = text.includes('(Location Mismatch)');
    text = text.replace(/\(Location Mismatch\)/g, '');
    
    const forgotCheckoutPenalty = text.includes('Penalized for forgotten checkout') || text.includes('forgotten checkout') || text.includes('ลืมเช็คเอาท์');
    text = text.replace(/\[SYSTEM\]\s*Penalized for forgotten checkout/g, '');
    text = text.replace(/Penalized for forgotten checkout/g, '');
    text = text.replace(/\|/g, '');
    
    const timeMatch = text.match(/\[TIME:(\d{2}:\d{2})\]/);
    let time: string | null = null;
    if (timeMatch) {
        time = timeMatch[1];
        text = text.replace(/\[TIME:\d{2}:\d{2}\]/g, '');
    }

    // Extract [OT:HH:MM-HH:MM]
    const otRangeMatch = text.match(/\[OT:(\d{2}:\d{2}-\d{2}:\d{2})\]/);
    if (otRangeMatch) {
        time = otRangeMatch[1];
    }

    // Extract OT hours: from either (Xhr) or [OT:Xhr]
    const otHoursMatch1 = text.match(/\(([\d\.]+)hr\)/);
    const otHoursMatch2 = text.match(/\[OT:([\d\.]+)hr\]/);
    let otHours: string | null = null;
    if (otHoursMatch1) {
        otHours = otHoursMatch1[1];
    } else if (otHoursMatch2) {
        otHours = otHoursMatch2[1];
    }

    // Cleanup all OT markup tags completely
    text = text.replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]/g, '');
    text = text.replace(/\([\d\.]+hr\)/g, '');
    text = text.replace(/\[OT_MINUTES:\d+\]/g, '');
    text = text.replace(/\[OT:[\d\.]+hr\]/g, '');

    text = text.trim();
    return {
        cleanReason: text,
        isLateSubmission,
        isLocationMismatch,
        forgotCheckoutPenalty,
        time,
        otHours
    };
};

const getTypeName = (type: string) => {
    const labels: Record<string, string> = {
        SICK: 'ลาป่วย',
        VACATION: 'ลาพักร้อน',
        PERSONAL: 'ลากิจ',
        EMERGENCY: 'ลาฉุกเฉิน',
        LATE_ENTRY: 'ขอเข้าสาย',
        OVERTIME: 'แจ้งทำงานล่วงเวลา (OT)',
        FORGOT_CHECKIN: 'ลืมเช็คอิน (ลืมลงเวลาเข้างาน)',
        FORGOT_CHECKOUT: 'ลืมเช็คเอาท์ (ลืมลงเวลาออกงาน)',
        FORGOT_BOTH: 'ลืมบันทึกเวลาทั้งเข้าและออก',
        WFH: 'ขอทำงานที่บ้าน (WFH)',
        UNPAID: 'ลากิจไม่รับค่าจ้าง (Unpaid Leave)'
    };
    return labels[type] || type;
};

const getTypeColorClass = (type: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
        SICK: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' },
        VACATION: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', accent: 'bg-emerald-500' },
        PERSONAL: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', accent: 'bg-slate-500' },
        EMERGENCY: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' },
        LATE_ENTRY: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', accent: 'bg-violet-500' },
        OVERTIME: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', accent: 'bg-indigo-500' },
        FORGOT_CHECKIN: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        FORGOT_CHECKOUT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        FORGOT_BOTH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        WFH: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', accent: 'bg-sky-500' }
    };
    return colors[type] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', accent: 'bg-gray-500' };
};

const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
        PENDING: { bg: 'bg-amber-100 text-amber-800', text: 'text-amber-500', label: 'รอตรวจสอบ' },
        APPROVED: { bg: 'bg-green-100 text-green-800', text: 'text-green-500', label: 'อนุมัติแล้ว' },
        REJECTED: { bg: 'bg-red-100 text-red-800', text: 'text-red-500', label: 'ปฏิเสธแล้ว' }
    };
    const current = badges[status] || { bg: 'bg-gray-100 text-gray-800', text: 'text-gray-500', label: status };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${current.bg}`}>
            {current.label}
        </span>
    );
};

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
    request, isOpen, onClose, onApprove, onReject
}) => {
    const { annualHolidays, calendarExceptions } = useMasterData();
    const [isRejectMode, setIsRejectMode] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageExpanded, setIsImageExpanded] = useState(false);

    // Admin OT Customization States
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editOtHours, setEditOtHours] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
    const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);

    // Leave History States
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    const parsed = parseReason(request?.reason || '');

    useEffect(() => {
        setAdminNote('');
        if (request && request.type === 'OVERTIME') {
            const parsedReason = parseReason(request.reason);
            let sTime = '';
            let eTime = '';
            try {
                sTime = format(request.startDate, 'HH:mm');
                eTime = format(request.endDate, 'HH:mm');
            } catch (e) {
                if (parsedReason.time) {
                    const [s, e] = parsedReason.time.split('-');
                    sTime = s || '';
                    eTime = e || '';
                }
            }
            setEditStartTime(sTime);
            setEditEndTime(eTime);
            setEditOtHours(parsedReason.otHours || '');
        } else {
            setEditStartTime('');
            setEditEndTime('');
            setEditOtHours('');
        }

        // Fetch Leave History
        if (request && request.userId) {
            setIsLoadingHistory(true);
            attendanceService.getUserLeaveHistory(request.userId)
                .then(historyData => {
                    // Filter out current request itself so we don't list it twice
                    const filtered = historyData.filter(h => h.id !== request.id);
                    setHistory(filtered);
                })
                .catch(err => {
                    console.error('Failed to fetch user leave history:', err);
                })
                .finally(() => {
                    setIsLoadingHistory(false);
                });
        } else {
            setHistory([]);
        }
        setIsHistoryExpanded(false);
    }, [request]);

    if (!isOpen || !request) return null;

    const colorStyle = getTypeColorClass(request.type);
    const isLeave = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'WFH', 'UNPAID'].includes(request.type);

    // Calculate duration details
    let durationText = '';
    if (isLeave) {
        const days = getWorkingDaysDifference(request.startDate, request.endDate, annualHolidays, calendarExceptions);
        durationText = `รวมเป็นเวลา ${days} วันทำการ`;
    }

    const calculateHoursFromTimes = (start: string, end: string): string => {
        if (!start || !end) return '';
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (diffMinutes < 0) {
            // Over midnight
            diffMinutes += 24 * 60;
        }
        
        const hours = diffMinutes / 60;
        return parseFloat(hours.toFixed(2)).toString();
    };

    const handleStartTimeSelect = (val: string) => {
        setEditStartTime(val);
        const autoHours = calculateHoursFromTimes(val, editEndTime);
        if (autoHours) {
            setEditOtHours(autoHours);
        }
    };

    const handleEndTimeSelect = (val: string) => {
        setEditEndTime(val);
        const autoHours = calculateHoursFromTimes(editStartTime, val);
        if (autoHours) {
            setEditOtHours(autoHours);
        }
    };

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            const hasCustom = request.type === 'OVERTIME' && editOtHours !== '';
            await onApprove(
                request,
                hasCustom ? parseFloat(editOtHours) : undefined,
                editStartTime || undefined,
                editEndTime || undefined,
                adminNote || undefined
            );
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) return;
        setIsSubmitting(true);
        try {
            await onReject(request.id, rejectionReason);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
            setIsRejectMode(false);
            setRejectionReason('');
        }
    };

    return createPortal(
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ 
                    type: 'spring', 
                    damping: 26, 
                    stiffness: 300 
                }}
                className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
                {/* Header Profile Panel */}
                <div className="relative bg-gradient-to-r from-slate-50 to-slate-100/50 p-6 border-b border-slate-100 shrink-0">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex gap-4 items-start">
                        {request.user?.avatarUrl ? (
                            <img 
                                src={request.user.avatarUrl} 
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0" 
                                alt={request.user?.name}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-white shadow-md flex items-center justify-center font-semibold text-indigo-400 text-xl shrink-0">
                                {request.user?.name?.charAt(0)}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 leading-tight truncate">
                                {request.user?.name || 'ไม่ทราบชื่อ'}
                            </h3>
                            <p className="text-xs text-slate-500 font-bold mt-1">
                                {request.user?.position || 'พนักงานบริษัท'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {getStatusBadge(request.status)}
                                {request.user?.employmentType && (
                                    <span className="text-[10px] bg-slate-200/60 text-slate-600 font-extrabold px-2 py-0.5 rounded-md uppercase">
                                        {request.user.employmentType === 'FULL_TIME' ? 'พนักงานประจำ' : request.user.employmentType === 'PROBATION' ? 'ทดลองงาน' : 'เด็กฝึกงาน'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body Content - Scrollable */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    {/* Request Type Panel */}
                    <div className={`${colorStyle.bg} ${colorStyle.border} p-4 rounded-2xl border flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${colorStyle.accent} text-white shadow-sm shrink-0`}>
                                {request.type === 'LATE_ENTRY' ? <Clock className="w-5 h-5" /> :
                                 request.type === 'OVERTIME' ? <Moon className="w-5 h-5" /> :
                                 request.type.includes('FORGOT') ? <Clock className="w-5 h-5" /> :
                                 <Briefcase className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ประเภทคำขอ</p>
                                <h4 className="text-sm font-semibold text-slate-800 mt-0.5">{getTypeName(request.type)}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Date and Time Period */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>ช่วงเวลาปฏิบัติงาน / วันลา</span>
                        </div>
                        <div className="text-slate-800 font-semibold text-sm flex flex-col gap-1">
                            <div>
                                {format(new Date(request.startDate), 'd MMMM yyyy')}
                                {new Date(request.startDate).getTime() !== new Date(request.endDate).getTime() && (
                                    <span className="text-slate-500 font-bold"> ถึง {format(new Date(request.endDate), 'd MMMM yyyy')}</span>
                                )}
                            </div>
                            {durationText && (
                                <p className="text-xs text-indigo-600 font-extrabold mt-1">{durationText}</p>
                            )}
                        </div>

                        {/* Extra Specific Time Info */}
                        {(parsed.time || parsed.otHours) && (
                            <div className="border-t border-slate-100 pt-3 mt-1 flex flex-wrap gap-2">
                                {parsed.time && (
                                    <div className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-bold">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>ระบุเวลาบันทึก: {parsed.time} น.</span>
                                    </div>
                                )}
                                {parsed.otHours && (
                                    <div className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-bold">
                                        <Moon className="w-3.5 h-3.5" />
                                        <span>ชั่วโมง OT ที่ขออนุมัติ: {parsed.otHours} ชั่วโมง</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Smart Alert flags if any */}
                    {(parsed.isLateSubmission || parsed.isLocationMismatch || parsed.forgotCheckoutPenalty) && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <ShieldAlert className="w-4 h-4 text-slate-500" />
                                <span>สัญญาณแจ้งเตือนระบบ (Smart Flags)</span>
                            </div>
                            <div className="grid gap-2">
                                {parsed.isLateSubmission && (
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 text-xs font-bold">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                                        <span>การยื่นย้อนหลังล่าช้า (ยื่นคำขอนี้ล่าช้ากว่ากำหนดของระบบ)</span>
                                    </div>
                                )}
                                {parsed.isLocationMismatch && (
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 text-xs font-bold animate-pulse">
                                        <MapPin className="w-4 h-4 shrink-0 text-rose-500" />
                                        <span>ตรวจพบพิกัดเช็คอินผิดปกติ (อยู่นอกพื้นที่สำนักงานที่กำหนด)</span>
                                    </div>
                                )}
                                {parsed.forgotCheckoutPenalty && (
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-50 text-orange-800 border border-orange-100 text-xs font-bold">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-orange-500" />
                                        <span>ลืมเช็คเอาท์ (ระบบทำการปรับลดอัตโนมัติ)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reason Text Area */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span>เหตุผลความจำเป็น</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic shadow-inner">
                            "{parsed.cleanReason || 'ไม่มีการระบุเหตุผลความจำเป็นเพิ่มเติม'}"
                        </div>
                    </div>

                    {/* Collapsible Leave History Panel */}
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-2.5">
                                <History className="w-4 h-4 text-slate-500 group-hover:text-indigo-500 transition-colors" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    ประวัติคำขอย้อนหลัง
                                </span>
                                {!isLoadingHistory && history.length > 0 && (
                                    <span className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                                        {history.length} ครั้ง
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center">
                                {isLoadingHistory ? (
                                    <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                ) : isHistoryExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                )}
                            </div>
                        </button>

                        <AnimatePresence initial={false}>
                            {isHistoryExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-slate-50/20 rounded-2xl border border-slate-100/60 p-4 space-y-3">
                                        {isLoadingHistory ? (
                                            <div className="py-4 text-center text-xs font-medium text-slate-400">
                                                กำลังโหลดข้อมูลประวัติ...
                                            </div>
                                        ) : history.length === 0 ? (
                                            <div className="py-4 text-center text-xs font-medium text-slate-400">
                                                ไม่มีประวัติการลาก่อนหน้า
                                            </div>
                                        ) : (
                                            <div className="max-h-[200px] overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
                                                {history.map((hist, idx) => {
                                                    const histDays = getWorkingDaysDifference(
                                                        hist.startDate, 
                                                        hist.endDate, 
                                                        annualHolidays, 
                                                        calendarExceptions
                                                    );
                                                    const histStyle = getTypeColorClass(hist.type);
                                                    const cleanHistReason = parseReason(hist.reason).cleanReason;

                                                    return (
                                                        <div key={hist.id} className="flex gap-3 items-start relative group/item">
                                                            {/* Timeline line decoration */}
                                                            {idx < history.length - 1 && (
                                                                <div className="absolute left-[9px] top-6 bottom-[-14px] w-0.5 bg-slate-100" />
                                                            )}
                                                            
                                                            {/* Dot Indicator */}
                                                            <div className="relative mt-1">
                                                                {hist.status === 'APPROVED' ? (
                                                                    <div className="w-5 h-5 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                    </div>
                                                                ) : hist.status === 'REJECTED' ? (
                                                                    <div className="w-5 h-5 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center text-rose-500 shrink-0 shadow-sm">
                                                                        <XCircle className="w-3 h-3" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                                                                        <Clock className="w-3 h-3" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Card item */}
                                                            <div className="flex-1 min-w-0 bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:border-slate-200 transition-all">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${histStyle.bg} ${histStyle.text} border ${histStyle.border}`}>
                                                                            {getTypeName(hist.type)}
                                                                        </span>
                                                                        <span className="text-[10px] font-extrabold text-slate-500 shrink-0">
                                                                            {histDays} วัน
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap shrink-0">
                                                                        {format(hist.startDate, 'd MMM yyyy')}
                                                                    </span>
                                                                </div>

                                                                {cleanHistReason && (
                                                                    <p className="text-xs text-slate-500 font-medium line-clamp-1 italic mt-1 pl-1">
                                                                        "{cleanHistReason}"
                                                                    </p>
                                                                )}

                                                                {hist.status === 'REJECTED' && hist.rejectionReason && (
                                                                    <div className="mt-1.5 px-2 py-1 bg-rose-50 border border-rose-100/50 rounded-lg text-[10px] text-rose-600 font-medium leading-relaxed">
                                                                        <span className="font-bold">เหตุผลปฏิเสธ:</span> {hist.rejectionReason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Admin OT Settings Panel */}
                    {request.status === 'PENDING' && request.type === 'OVERTIME' && (
                        <div className="bg-indigo-50/50 p-5 rounded-2xl border-2 border-dashed border-indigo-200 space-y-4">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
                                <Settings className="w-4 h-4 text-indigo-500 animate-pulse" />
                                <span>⚙️ ปรับปรุงสิทธิและชั่วโมงปฏิบัติงาน OT</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">เวลาเริ่มปฏิบัติงาน</label>
                                    <button 
                                        type="button"
                                        onClick={() => setIsStartTimeOpen(true)}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 border-2 border-slate-200 hover:border-indigo-400 bg-white rounded-xl text-sm font-bold text-slate-700 transition-all outline-none cursor-pointer shadow-sm text-left"
                                    >
                                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate">{editStartTime || 'เลือกเวลาเริ่ม'}</span>
                                    </button>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">เวลาสิ้นสุดปฏิบัติงาน</label>
                                    <button 
                                        type="button"
                                        onClick={() => setIsEndTimeOpen(true)}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 border-2 border-slate-200 hover:border-indigo-400 bg-white rounded-xl text-sm font-bold text-slate-700 transition-all outline-none cursor-pointer shadow-sm text-left"
                                    >
                                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate">{editEndTime || 'เลือกเวลาสิ้นสุด'}</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">จำนวนชั่วโมง OT จริง (ชั่วโมง)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0"
                                    max="24"
                                    placeholder="ตัวอย่างเช่น 1.5, 2.5, 3"
                                    value={editOtHours}
                                    onChange={(e) => setEditOtHours(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 bg-white rounded-xl text-sm outline-none transition-all font-bold text-indigo-600"
                                />
                                <p className="text-[10px] text-slate-400 font-medium mt-1">
                                    *ระบบคำนวณชั่วโมงให้อัตโนมัติเมื่อเลือกเวลาเริ่ม/สิ้นสุด แต่แอดมินยังแก้ไขเองเพื่อปัดเศษได้
                                </p>
                            </div>

                            <div className="pt-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                                    บันทึกหรือเหตุผลการแก้ไข/อนุมัติ (แสดงในประวัติและแจ้งเตือนพนักงาน)
                                </label>
                                <textarea 
                                    rows={2}
                                    placeholder="ระบุเหตุผลในการแก้ไขหรือบันทึกเพิ่มเติมเพื่อให้พนักงานทราบ เช่น มีการปรับแก้เวลาตามบันทึกสแกนนิ้วมือ..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 bg-white rounded-xl text-sm outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 leading-relaxed resize-none shadow-sm"
                                />
                            </div>

                            {/* TimePickerModals embedded in Admin Panel */}
                            <TimePickerModal 
                                isOpen={isStartTimeOpen}
                                onClose={() => setIsStartTimeOpen(false)}
                                onSelect={handleStartTimeSelect}
                                initialTime={editStartTime || '18:00'}
                                title="เลือกเวลาเริ่มปฏิบัติงาน OT"
                            />
                            <TimePickerModal 
                                isOpen={isEndTimeOpen}
                                onClose={() => setIsEndTimeOpen(false)}
                                onSelect={handleEndTimeSelect}
                                initialTime={editEndTime || '21:30'}
                                title="เลือกเวลาสิ้นสุดปฏิบัติงาน OT"
                            />
                        </div>
                    )}

                    {/* Attachment Preview */}
                    {request.attachmentUrl && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">เอกสารประกอบหรือรูปภาพหลักฐาน</span>
                            </div>
                            <div 
                                onClick={() => setIsImageExpanded(true)}
                                className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 group relative cursor-pointer hover:scale-[1.01] hover:shadow-md active:scale-[0.99] transition-all"
                            >
                                <img 
                                    src={request.attachmentUrl} 
                                    alt="Attachment" 
                                    className="max-h-60 rounded-xl object-contain shadow-sm group-hover:opacity-90 transition-opacity"
                                    onError={(e) => {
                                        // Handle non-image file type preview or load error
                                        e.currentTarget.style.display = 'none';
                                        const sibling = e.currentTarget.nextElementSibling;
                                        if (sibling) sibling.classList.remove('hidden');
                                    }}
                                />
                                {/* Hover interactive magnifier overlay */}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 text-white font-semibold text-xs rounded-2xl backdrop-blur-[2px]">
                                    <div className="bg-white/20 px-4 py-2.5 rounded-full flex items-center gap-2 border border-white/30 shadow-lg scale-90 group-hover:scale-100 transition-all duration-300">
                                        <ExternalLink className="w-4 h-4" />
                                        <span>คลิกเพื่อขยายภาพเต็มจอ</span>
                                    </div>
                                </div>
                                <div className="hidden flex-col items-center justify-center py-8 text-slate-400">
                                    <FileText className="w-12 h-12 mb-2" />
                                    <p className="text-xs font-bold">ไฟล์เอกสารแนบประกอบ</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show Rejection Reason if already REJECTED */}
                    {request.status === 'REJECTED' && request.rejectionReason && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span>เหตุผลที่ปฏิเสธโดยแอดมิน</span>
                            </div>
                            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-red-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                                "{request.rejectionReason}"
                            </div>
                        </div>
                    )}
                </div>

                {/* Admin Actions Footer Panel - Slide up if Reject click */}
                {request.status === 'PENDING' && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                        <AnimatePresence mode="wait">
                            {!isRejectMode ? (
                                <motion.div 
                                    key="main-actions"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex gap-3"
                                >
                                    <button
                                        onClick={() => setIsRejectMode(true)}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3.5 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <XCircle className="w-4 h-4" /> ปฏิเสธคำขอ
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> อนุมัติคำขอ
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="reject-form"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">กรุณาระบุเหตุผลที่ปฏิเสธ</label>
                                        <textarea 
                                            className="w-full p-4 border-2 border-slate-200 focus:border-red-400 bg-white rounded-2xl text-sm outline-none resize-none transition-all shadow-inner"
                                            rows={3}
                                            placeholder="ระบุเหตุผล เช่น ข้อมูลเอกสารไม่ชัดเจน, วันลาโควตาไม่เพียงพอ..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setIsRejectMode(false); setRejectionReason(''); }}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold transition-colors"
                                        >
                                            ย้อนกลับ
                                        </button>
                                        <button
                                            onClick={handleRejectSubmit}
                                            disabled={isSubmitting || !rejectionReason.trim()}
                                            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
                                        >
                                            {isSubmitting ? 'กำลังปฏิเสธ...' : 'ยืนยันการปฏิเสธ'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Image Fullscreen Lightbox */}
            <AnimatePresence>
                {isImageExpanded && request.attachmentUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsImageExpanded(false)}
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 cursor-zoom-out"
                    >
                        {/* Close button with interactive rotate on hover */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsImageExpanded(false); }}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 hover:rotate-90 text-white rounded-full transition-all duration-300 z-[130] shadow-lg border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900"
                        >
                            <img 
                                src={request.attachmentUrl} 
                                alt="Expanded Attachment" 
                                className="max-w-full max-h-[85vh] object-contain select-none"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>,
        document.body
    );
};

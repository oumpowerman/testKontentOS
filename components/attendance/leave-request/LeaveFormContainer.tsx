
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Upload, CheckCircle2, Send, Loader2, AlertCircle, CalendarClock, Clock, FileText, Image as ImageIcon, ArrowRight, Edit3, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaveUsage, LeaveType } from '../../../types/attendance';
import { MasterOption } from '../../../types';
import { LEAVE_THEMES } from './constants';
import { useLeaveFormLogic } from './hooks/useLeaveFormLogic';
import LeaveQuotaDisplay from './LeaveQuotaDisplay';
import { differenceInDays, format, eachDayOfInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import { isWorkingDay } from '../../../utils/judgeUtils';
import { useMasterData } from '../../../hooks/useMasterData';
import { useUserSession } from '../../../context/UserSessionContext';

// Input Components
import StandardLeaveInputs from './form-inputs/StandardLeaveInputs';
import TimeCorrectionInputs from './form-inputs/TimeCorrectionInputs';
import OvertimeInputs from './form-inputs/OvertimeInputs';

interface Props {
    selectedType: string;
    onBack: () => void;
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    onClose: () => void;
    masterOptions: MasterOption[];
    leaveUsage?: LeaveUsage;
    pendingUsage?: LeaveUsage;
    initialDate?: Date;
    initialReason?: string;
    fixedType?: boolean;
}


const LeaveFormContainer: React.FC<Props> = ({ 
    selectedType, onBack, onSubmit, onClose, masterOptions, leaveUsage, pendingUsage, initialDate, initialReason, fixedType
}) => {
    const { annualHolidays, calendarExceptions } = useMasterData();
    const { currentUserProfile } = useUserSession();

    const selectedOption = useMemo(() => masterOptions.find(o => o.key === selectedType), [masterOptions, selectedType]);
    const metadata = useMemo(() => {
        try {
            return selectedOption?.description ? JSON.parse(selectedOption.description) : {};
        } catch (e) {
            return {};
        }
    }, [selectedOption]);

    const minDate = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const candidateDates: Date[] = [];

        if (metadata.advanceDays && metadata.advanceDays > 0) {
            const allowedAdvance = new Date(today);
            allowedAdvance.setDate(today.getDate() + metadata.advanceDays);
            candidateDates.push(allowedAdvance);
        }

        if (metadata.maxPastDays && metadata.maxPastDays > 0) {
            const allowedPast = new Date(today);
            allowedPast.setDate(today.getDate() - metadata.maxPastDays);
            candidateDates.push(allowedPast);
        }

        if (candidateDates.length === 0) return undefined;
        return candidateDates.reduce((max, current) => current > max ? current : max, candidateDates[0]);
    }, [metadata.advanceDays, metadata.maxPastDays]);

    const maxDate = useMemo(() => {
        if (metadata.maxFutureDays && metadata.maxFutureDays > 0) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const allowed = new Date(today);
            allowed.setDate(today.getDate() + metadata.maxFutureDays);
            return allowed;
        }
        return undefined;
    }, [metadata.maxFutureDays]);
    
    const { 
        startDate, setStartDate, endDate, setEndDate, 
        reason, setReason, file, setFile, 
        targetTime, setTargetTime, endTime, setEndTime, otHours, setOtHours, 
        isSubmitting, isReviewing, setIsReviewing, handleReview, handleSubmit 
    } = useLeaveFormLogic({ 
        onSubmit, 
        onClose, 
        initialDate, 
        initialReason, 
        selectedType, 
        advanceDays: metadata.advanceDays,
        maxFutureDays: metadata.maxFutureDays,
        maxPastDays: metadata.maxPastDays
    });

    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        if (!file) {
            setFilePreviewUrl(null);
            return;
        }
        if (file.type && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFilePreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setFilePreviewUrl(null);
        }
    }, [file]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isReviewing && bodyRef.current) {
            bodyRef.current.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [isReviewing]);

    const theme = LEAVE_THEMES[selectedType] || LEAVE_THEMES['DEFAULT'];
    

    const fallbackLabels: Record<string, string> = {
        LATE_ENTRY: 'สาย',
        FORGOT_CHECKIN: 'ลืมเช็คอิน',
        FORGOT_CHECKOUT: 'ลืมเช็คเอาท์',
        FORGOT_BOTH: 'ลืมเช็คอินและเช็คเอาท์',
    };

    const thaiLabel = selectedOption?.label || fallbackLabels[selectedType] || selectedType;
    const isTimeSpecific = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'].includes(selectedType);
    const headerLabel = isTimeSpecific ? 'แก้ไขเวลา' : thaiLabel;

    const daysRequested = useMemo(() => {
        if (isTimeSpecific) return 0;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

            const days = eachDayOfInterval({ start, end });
            return days.filter(d => 
                isWorkingDay(d, annualHolidays || [], calendarExceptions || [], currentUserProfile)
            ).length;
        }
        return 0;
    }, [startDate, endDate, isTimeSpecific, annualHolidays, calendarExceptions, currentUserProfile]);

    const quotaInfo = useMemo(() => {
        const limit = metadata.defaultQuota || 999;
        if (!limit || !leaveUsage) return null;
        const used = leaveUsage[selectedType as LeaveType] || 0;
        const pending = pendingUsage ? (pendingUsage[selectedType as LeaveType] || 0) : 0;
        const remaining = Math.max(0, limit - used);
        const remainingIncludingPending = Math.max(0, limit - used - pending);
        return { limit, used, pending, remaining, remainingIncludingPending };
    }, [selectedType, leaveUsage, pendingUsage, metadata]);

    const isOverQuota = !!(quotaInfo && daysRequested > quotaInfo.remainingIncludingPending);

    const getPlaceholder = () => {
        if (metadata.placeholder) return metadata.placeholder;
        if (selectedType === 'LATE_ENTRY') return "เช่น รถติดหนักมากที่แยก...";
        if (selectedType === 'OVERTIME') return "เช่น เร่งปิดงานลูกค้า Project A...";
        if (selectedType === 'FORGOT_CHECKOUT' || selectedType === 'FORGOT_CHECKIN' || selectedType === 'FORGOT_BOTH') {
            return "กรุณาระบุรายละเอียดงานที่ทำในช่วงเวลานั้นและเหตุผลย้อนหลังโดยละเอียด เพื่อให้แอดมินตรวจสอบได้...";
        }
        if (selectedType === 'WFH') return "เช่น เคลียร์งานตัดต่อที่บ้าน...";
        return "ระบุเหตุผลการลา...";
    };

    const getReasonLabel = () => {
        if (metadata.reasonLabel) return metadata.reasonLabel;
        if (selectedType === 'WFH') return "รายละเอียดงานที่จะทำ (Task)";
        return "เหตุผล / รายละเอียด";
    };

    const formatDateThai = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'd MMM yyyy', { locale: th });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col flex-1 min-h-0 bg-white/40 backdrop-blur-2xl"
        >
            {/* Header */}
            <div className={`px-4 py-4 sm:px-6 sm:py-6 border-b border-white/40 bg-white/60 backdrop-blur-md flex items-center gap-3 sm:gap-4 shrink-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${fixedType ? 'bg-orange-50/40' : ''}`}>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={isReviewing ? () => setIsReviewing(false) : onBack} 
                    className="p-2.5 sm:p-3 bg-white/80 hover:bg-white rounded-xl sm:rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-white/50"
                >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
                <div className="flex-1 min-w-0">
                    <motion.h3 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-lg sm:text-2xl font-bold text-slate-800 flex items-center gap-2.5 sm:gap-3"
                    >
                        <motion.span 
                            animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.08)] ${theme.bg} ${theme.text} border border-white/50 shrink-0`}
                        >
                            {fixedType ? <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : (theme.icon && React.createElement(theme.icon, { className: "w-5 h-5 sm:w-6 sm:h-6" }))}
                        </motion.span>
                        <span className="tracking-tight truncate">{isReviewing ? 'ตรวจสอบความถูกต้อง' : headerLabel}</span>
                    </motion.h3>
                </div>
            </div>

            {/* Scrollable Body */}
            <div 
                ref={bodyRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 pb-6 sm:pb-8 space-y-5 sm:space-y-8 
                    scroll-smooth 
                    scrollbar-thin scrollbar-thumb-slate-300/60 scrollbar-track-transparent
                    hover:scrollbar-thumb-slate-400/80"
            >

                <AnimatePresence mode="wait">
                    {isReviewing ? (
                        /* --- REVIEW STEP --- */
                        <motion.div 
                            key="review"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-4 sm:space-y-6"
                        >
                            <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/80 backdrop-blur-xl border border-white/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-5 shadow-xl shadow-indigo-100/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-300/30 transition-colors" />
                                
                                <div className="flex items-center gap-2.5 sm:gap-3 text-indigo-600 mb-2 relative">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">รายละเอียดเวลา</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 sm:gap-5 relative">
                                    <div className="bg-white/70 backdrop-blur-md p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[9px] sm:text-[10px] font-bold text-indigo-300 uppercase mb-1 sm:mb-2 tracking-widest">เริ่มต้น (Start)</p>
                                        <p className="text-xs sm:text-base font-bold text-indigo-950">{formatDateThai(startDate)}</p>
                                        {isTimeSpecific && <p className="text-lg sm:text-2xl font-bold text-indigo-600 mt-1 sm:mt-2">{targetTime} น.</p>}
                                    </div>
                                    
                                    <div className="bg-white/70 backdrop-blur-md p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[9px] sm:text-[10px] font-bold text-indigo-300 uppercase mb-1 sm:mb-2 tracking-widest">สิ้นสุด (End)</p>
                                        <p className="text-xs sm:text-base font-bold text-indigo-950">{formatDateThai(endDate)}</p>
                                        {selectedType === 'FORGOT_BOTH' && <p className="text-lg sm:text-2xl font-bold text-indigo-600 mt-1 sm:mt-2">{endTime} น.</p>}
                                    </div>
                                </div>

                                {!isTimeSpecific && daysRequested > 0 && (
                                    selectedType === 'OVERTIME' ? (
                                        <div className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600  bg-no-repeat bg-[length:100%_100%] bg-clip-padding text-white p-4 rounded-[1.5rem] shadow-xl shadow-indigo-500/20 border border-white/20 relative flex items-center justify-between overflow-hidden">
                                            {/* Glow overlay */}
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
                                            
                                            {/* Left side: OT Hours */}
                                            <div className="flex items-center gap-3 relative z-10 flex-1">
                                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md shadow-inner text-sky-100 animate-pulse">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[8px] text-sky-100 font-prompt uppercase tracking-widest font-semibold">ชั่วโมงที่ขอปฏิบัติงาน</p>
                                                    <p className="text-sm sm:text-lg font-semibold font-prompt text-white">ทำโอที {otHours} ชั่วโมง</p>
                                                </div>
                                            </div>

                                            {/* Vertical Glass Divider */}
                                            <div className="h-10 w-px bg-white/20 mx-4 relative z-10" />

                                            {/* Right side: Days count */}
                                            <div className="text-right relative z-10 shrink-0">
                                                <div className="bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                                                    <p className="text-[10px] text-purple-100 font-prompt font-semibold">รวมระยะเวลา</p>
                                                    <p className="text-sm font-bold font-pro text-white">{daysRequested} วัน</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-indigo-600 text-white p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] text-center shadow-xl shadow-indigo-200 relative">
                                            <p className="text-xs sm:text-sm font-bold tracking-wide">รวมระยะเวลา: {daysRequested} วัน</p>
                                        </div>
                                    )
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-xl border border-white/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-5 shadow-xl shadow-emerald-100/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-300/30 transition-colors" />
                                
                                <div className="flex items-center gap-2.5 sm:gap-3 text-emerald-600 mb-2 relative">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">เหตุผลที่ระบุ</span>
                                </div>
                                <div className="bg-white/70 backdrop-blur-md p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white shadow-sm">
                                    <p className="text-sm sm:text-base font-bold text-emerald-950 leading-relaxed italic">"{reason}"</p>
                                </div>
                            </div>

                             {file && (
                                <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-xl border border-white/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-5 shadow-xl shadow-amber-100/20">
                                    <div className="flex items-center gap-2.5 sm:gap-3 text-amber-600 mb-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm">
                                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium font-kanit uppercase tracking-[0.2em]">เอกสารแนบ</span>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] border border-white shadow-sm flex items-center gap-3 sm:gap-4">
                                            <div className="bg-amber-100 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-amber-600">
                                                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-amber-900 truncate flex-1">{file.name}</p>
                                        </div>

                                        {filePreviewUrl && (
                                            <div className="flex justify-center pt-2">
                                                <div 
                                                    onClick={() => setIsPreviewOpen(true)}
                                                    className="w-full max-w-md h-48 sm:h-56 rounded-2xl border-2 border-white shadow-lg overflow-hidden relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                                                >
                                                    <img 
                                                        src={filePreviewUrl} 
                                                        alt="Attachment preview" 
                                                        className="w-full h-full object-cover"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                                                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                                                            <Eye className="w-5 h-5 text-white" />
                                                        </div>
                                                        <span className="text-xs font-bold font-kanit tracking-wide">คลิกเพื่อดูรูปภาพขนาดเต็ม</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50/40 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem] border border-white/60 shadow-sm">
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-500 shrink-0">
                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <p className="text-[11px] sm:text-xs font-bold text-blue-700 leading-relaxed">เมื่อกดยืนยัน ระบบจะส่งคำขอไปยัง Admin เพื่อพิจารณาและแจ้งเตือนผ่านกลุ่มทันที</p>
                            </div>
                        </motion.div>
                    ) : (
                        /* --- FORM STEP --- */
                        <motion.div 
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Quota Display */}
                            {!fixedType && (
                                <motion.div 
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    className="relative"
                                >
                                    <LeaveQuotaDisplay type={selectedType} usage={leaveUsage} limit={quotaInfo?.limit} />
                                </motion.div>
                            )}

                             {/* Over Quota Alert */}
                             {isOverQuota && (
                                 <motion.div 
                                     initial={{ x: -20, opacity: 0 }}
                                     animate={{ x: 0, opacity: 1 }}
                                     className="bg-rose-50/80 backdrop-blur-xl border border-rose-100/50 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex items-start gap-4 sm:gap-5 shadow-xl shadow-rose-100/20"
                                 >
                                     <div className="bg-rose-100 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-rose-600 shadow-sm shrink-0">
                                         <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-rose-800 text-sm sm:text-base">วันลาเกินสิทธิ์ (Over Quota)</h4>
                                         <p className="text-[11px] sm:text-xs text-rose-500 mt-1 sm:mt-1.5 leading-relaxed font-bold">
                                             คุณเหลือสิทธิ์ {quotaInfo?.remaining} วัน {quotaInfo?.pending && quotaInfo.pending > 0 ? `(และมีรายการที่รอนุมัติอยู่แล้ว ${quotaInfo.pending} วัน)` : ''} แต่ต้องการลา {daysRequested} วัน <br/>
                                             กรุณาปรับเปลี่ยนวันที่ หรือติดต่อ HR ครับ
                                         </p>
                                     </div>
                                 </motion.div>
                             )}

                            {/* Time Correction Strictness Warning */}
                            {(selectedType === 'FORGOT_CHECKIN' || selectedType === 'FORGOT_CHECKOUT' || selectedType === 'FORGOT_BOTH') && (
                                <motion.div 
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-amber-50/90 backdrop-blur-xl border-2 border-amber-500/20 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex items-start gap-4 shadow-xl shadow-amber-500/5"
                                >
                                    <div className="bg-amber-100 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-amber-600 shadow-sm shrink-0">
                                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <h4 className="font-bold text-amber-800 text-sm sm:text-base font-kanit">⚠️ กำชับเรื่องการขออนุมัติแก้ไขเวลา</h4>
                                        <p className="text-[11px] sm:text-xs text-amber-700/90 leading-relaxed font-sarabun font-medium">
                                            การขอแก้ไขเวลาเข้า-ออกงานจะต้องเป็นกรณีสุดวิสัยจริงๆ เท่านั้น <span className="text-amber-800 underline">ไม่ใช่เพียงเพราะความประมาทเลินเล่อหรือ "ลืมกดเพราะรีบ"</span> โดยคุณต้องระบุรายละเอียดเหตุผลและชี้แจงงานที่ปฏิบัติในช่วงเวลานั้นให้ชัดเจนที่สุด หากมีเอกสาร/รูปภาพ เช่น พิกัดหน้างาน หรือประวัติแชทกลุ่ม โปรดแนบไฟล์ที่ "แนบเอกสารประกอบ" ด้านล่างเพื่อให้ Admin ใช้ประกอบการพิจารณาอนุมัติ
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Dynamic Inputs */}
                            <div className={`relative z-30 bg-white/60 backdrop-blur-xl p-5 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border-2 transition-all duration-500 shadow-2xl ${isOverQuota ? 'border-rose-200 ring-8 ring-rose-50/50' : 'border-white/80 hover:border-indigo-100 hover:shadow-indigo-100/20'}`}>
                                {isTimeSpecific ? (
                                    <TimeCorrectionInputs 
                                        date={startDate} setDate={setStartDate} 
                                        time={targetTime} setTime={setTargetTime} 
                                        endTime={endTime} setEndTime={setEndTime}
                                        showEndTime={selectedType === 'FORGOT_BOTH'}
                                        isFixedDate={!!fixedType}
                                    />
                                ) : selectedType === 'OVERTIME' ? (
                                    <OvertimeInputs 
                                        date={startDate} setDate={setStartDate} 
                                        startTime={targetTime} setStartTime={setTargetTime}
                                        endTime={endTime} setEndTime={setEndTime}
                                        hours={otHours} setHours={setOtHours} 
                                    />
                                ) : (
                                    <StandardLeaveInputs 
                                        startDate={startDate} setStartDate={setStartDate} 
                                        endDate={endDate} setEndDate={setEndDate} 
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        workingDaysCount={daysRequested}
                                    />
                                )}
                            </div>

                            {/* Common Fields */}
                            <div className="relative z-10 space-y-4 sm:space-y-6">
                                <div className="bg-white/60 backdrop-blur-xl p-5 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-white/80 shadow-2xl space-y-3 sm:space-y-4 group focus-within:border-indigo-100 transition-all">
                                    <label className="flex items-center gap-2 text-[11px] sm:text-[13px] font-kanit font-bold text-slate-400 uppercase ml-1 sm:ml-2 tracking-[0.20em] sm:tracking-[0.25em] group-focus-within:text-indigo-400 transition-colors">
                                        <FileText className="w-4 h-4" />
                                        {getReasonLabel()} <span className="text-rose-400">*</span>
                                    </label>
                                    <textarea 
                                        value={reason} 
                                        onChange={e => setReason(e.target.value)}
                                        placeholder={getPlaceholder()}
                                        className="w-full p-4 sm:p-6 bg-white/40 border-2 border-transparent rounded-[1.5rem] sm:rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-[8px] sm:focus:ring-[12px] focus:ring-indigo-50/50 outline-none text-sm sm:text-base font-bold placeholder:font-sarabun placeholder:font-normal text-slate-700 resize-none h-32 sm:h-40 transition-all placeholder:text-slate-300 shadow-inner"
                                    />
                                </div>
                                
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                                        p-5 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-4 sm:gap-5 group relative overflow-hidden shadow-xl
                                        ${file ? 'border-emerald-200 bg-emerald-50/60 backdrop-blur-md' : 'border-slate-200 bg-white/40 backdrop-blur-md hover:bg-white hover:border-indigo-200 hover:shadow-indigo-100/30'}
                                    `}
                                >
                                    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] shadow-lg transition-all group-hover:rotate-12 ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400'}`}>
                                        {file ? <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8"/> : <Upload className="w-6 h-6 sm:w-8 sm:h-8"/>}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className={`text-sm sm:text-base font-bold truncate ${file ? 'text-emerald-800' : 'text-slate-500 group-hover:text-indigo-600'}`}>
                                            {file ? file.name : (selectedType === 'SICK' ? 'แนบใบรับรองแพทย์' : 'แนบเอกสารประกอบ')}
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-bold tracking-wider uppercase">รองรับรูปภาพ และ PDF (สูงสุด 5MB)</p>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-8 border-t border-white/40 bg-white/60 backdrop-blur-xl shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                {isReviewing ? (
                    <div className="flex gap-3 sm:gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsReviewing(false)}
                            className="flex-1 py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] font-bold text-slate-500 bg-white/80 border border-white shadow-lg hover:bg-white transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" /> แก้ไข
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSubmit(selectedType)}
                            disabled={isSubmitting}
                            className={`
                                flex-[2.5] py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] font-bold text-white text-base sm:text-xl shadow-2xl transition-all flex items-center justify-center gap-2 sm:gap-3
                                bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200/50
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 animate-spin"/> : <Send className="w-5 h-5 sm:w-6 sm:h-6" />}
                            ยืนยันและส่งคำขอ
                        </motion.button>
                    </div>
                ) : (
                    <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReview}
                        disabled={isOverQuota}
                        className={`
                            w-full py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2.5rem] font-bold font-kanit text-white text-base sm:text-xl shadow-2xl transition-all flex items-center justify-center gap-2 sm:gap-3
                            ${theme.btn} hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed
                            ${isOverQuota ? 'bg-slate-300 pointer-events-none opacity-50 shadow-none' : 'shadow-indigo-200/50'}
                        `}
                    >
                        ตรวจสอบข้อมูล <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                )}
            </div>

            {/* Fullscreen Image Preview Modal */}
            <AnimatePresence>
                {isPreviewOpen && filePreviewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsPreviewOpen(false)}
                        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        {/* Close Button */}
                        <motion.button
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPreviewOpen(false);
                            }}
                            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-md shadow-lg z-50 border border-white/10 cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </motion.button>

                        {/* Image Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-full max-h-[85vh] flex items-center justify-center cursor-default"
                        >
                            <img
                                src={filePreviewUrl}
                                alt="Fullscreen Preview"
                                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10 select-none"
                                referrerPolicy="no-referrer"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LeaveFormContainer;

import React from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle2, XCircle, Clock, AlertTriangle, MapPin, 
    Calendar, ExternalLink, Moon 
} from 'lucide-react';
import { format } from 'date-fns';
import { LeaveRequest } from '../../../../types/attendance';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { getWorkingDaysDifference } from '../../../../lib/attendanceUtils';
import { parseReason, ParsedReason } from '../request-detail/utils';

interface ApprovalRequestCardProps {
    request: LeaveRequest;
    onApprove: (req: LeaveRequest) => Promise<void>;
    onRejectClick: (id: string) => void;
    onViewDetail: (req: LeaveRequest) => void;
    annualHolidays: any;
    calendarExceptions: any;
}

const getCardStyle = (type: string) => {
    const styles: Record<string, { bg: string; border: string; accent: string }> = {
        OVERTIME: { 
            bg: 'bg-indigo-50 hover:bg-indigo-100/40', 
            border: 'border-indigo-100 hover:border-indigo-200/80', 
            accent: 'bg-indigo-500' 
        },
        WFH: { 
            bg: 'bg-sky-50 hover:bg-sky-100/40', 
            border: 'border-sky-100 hover:border-sky-200/80', 
            accent: 'bg-sky-500' 
        },
        SICK: { 
            bg: 'bg-rose-50 hover:bg-rose-100/40', 
            border: 'border-rose-100 hover:border-rose-200/80', 
            accent: 'bg-rose-500' 
        },
        VACATION: { 
            bg: 'bg-emerald-50 hover:bg-emerald-100/40', 
            border: 'border-emerald-100 hover:border-emerald-200/80', 
            accent: 'bg-emerald-500' 
        },
        PERSONAL: { 
            bg: 'bg-slate-50 hover:bg-slate-100/40', 
            border: 'border-slate-100 hover:border-slate-200/80', 
            accent: 'bg-slate-500' 
        },
        EMERGENCY: { 
            bg: 'bg-amber-50 hover:bg-amber-100/40', 
            border: 'border-amber-100 hover:border-amber-200/80', 
            accent: 'bg-amber-500' 
        },
        LATE_ENTRY: { 
            bg: 'bg-violet-50 hover:bg-violet-100/40', 
            border: 'border-violet-100 hover:border-violet-200/80', 
            accent: 'bg-violet-500' 
        },
        FORGOT_CHECKIN: { 
            bg: 'bg-amber-50 hover:bg-amber-100/40', 
            border: 'border-amber-100 hover:border-amber-200/80', 
            accent: 'bg-amber-500' 
        },
        FORGOT_CHECKOUT: { 
            bg: 'bg-amber-50 hover:bg-amber-100/40', 
            border: 'border-amber-100 hover:border-amber-200/80', 
            accent: 'bg-amber-500' 
        },
        FORGOT_BOTH: { 
            bg: 'bg-amber-50 hover:bg-amber-100/40', 
            border: 'border-amber-100 hover:border-amber-200/80', 
            accent: 'bg-amber-500' 
        }
    };

    return styles[type] || { bg: 'bg-white', border: 'border-gray-100', accent: 'bg-orange-400' };
};

export const ApprovalRequestCard: React.FC<ApprovalRequestCardProps> = ({
    request,
    onApprove,
    onRejectClick,
    onViewDetail,
    annualHolidays,
    calendarExceptions
}) => {
    const { showConfirm } = useGlobalDialog();
    const cardStyle = getCardStyle(request.type);
    const parsed = parseReason(request.reason);

    const renderReason = (parsedReason: ParsedReason) => {
        return (
            <p className="text-sm text-gray-700 bg-white p-3.5 rounded-2xl border border-black/5 italic leading-relaxed shadow-inner">
                "{parsedReason.cleanReason || 'ไม่ได้ระบุเหตุผลเพิ่มเติม'}"
            </p>
        );
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 380,
                damping: 35,
                mass: 0.8
            }}
            onClick={() => onViewDetail(request)}
            className={`${cardStyle.bg} ${cardStyle.border} p-5 rounded-3xl border shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-shadow relative overflow-hidden group cursor-pointer`}
            id={`request-card-${request.id}`}
        >
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
                request.status === 'APPROVED' ? 'bg-green-500' : 
                request.status === 'REJECTED' ? 'bg-red-500' : 
                `${cardStyle.accent} animate-pulse`
            }`}></div>

            <div className="flex flex-col lg:flex-row gap-6 justify-between">
                <div className="flex gap-5 flex-1">
                    <div className="shrink-0 relative">
                        {request.user?.avatarUrl ? (
                            <img 
                                src={request.user.avatarUrl} 
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" 
                                referrerPolicy="no-referrer"
                                alt={request.user?.name}
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-400 border-2 border-white shadow-md">
                                {request.user?.name?.charAt(0)}
                            </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                            request.status === 'APPROVED' ? 'bg-green-500' : 
                            request.status === 'REJECTED' ? 'bg-red-500' : 
                            'bg-orange-400'
                        }`}>
                            {request.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-white" />}
                            {request.status === 'REJECTED' && <XCircle className="w-3 h-3 text-white" />}
                            {request.status === 'PENDING' && <Clock className="w-3 h-3 text-white" />}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                            {/* Group name and position vertically */}
                            <div className="flex flex-col justify-center">
                                <h4 className="font-black text-gray-800 text-base leading-tight">
                                    {request.user?.name || 'Unknown'}
                                </h4>
                                {request.user?.position && (
                                    <span className="text-[11px] text-slate-500 font-semibold tracking-wide mt-0.5 leading-none">
                                        {request.user.position}
                                    </span>
                                )}
                            </div>
                            
                            {/* Parsed Badges */}
                            {parsed.isLateSubmission && (
                                <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-amber-100 text-amber-700 border-amber-200/60 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> ส่งคำขอช้ากว่ากำหนด
                                </span>
                            )}

                            {parsed.isLocationMismatch && (
                                <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-rose-100 text-rose-700 border-rose-200/60 flex items-center gap-1 animate-pulse">
                                    <MapPin className="w-3 h-3" /> พิกัดภายนอกพื้นที่ทำงาน
                                </span>
                            )}

                            {parsed.forgotCheckoutPenalty && (
                                <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-orange-100 text-orange-700 border-orange-200/60 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> ลืมเช็คเอาท์ (ระบบปรับลดคะแนน)
                                </span>
                            )}

                            {parsed.time && (
                                <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-indigo-100 text-indigo-700 border-indigo-200/60 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> เวลา: {parsed.time} น.
                                </span>
                            )}

                            {parsed.otHours && (
                                <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-indigo-100 text-indigo-700 border-indigo-200/60 flex items-center gap-1 animate-pulse">
                                    <Moon className="w-3 h-3 text-indigo-500" /> จำนวน: {parsed.otHours} ชม.
                                </span>
                            )}

                            {/* Expiration Warning */}
                            {request.status === 'PENDING' && ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'].includes(request.type) && (
                                getWorkingDaysDifference(request.createdAt, new Date(), annualHolidays, calendarExceptions) >= 2 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-red-100 text-red-700 border-red-200/60 flex items-center gap-1 animate-pulse">
                                        <AlertTriangle className="w-3 h-3" /> ใกล้หมดอายุ
                                    </span>
                                )
                            )}

                            <span className="text-[11px] text-slate-500 font-semibold bg-slate-50/80 px-2 py-0.5 rounded-md border border-slate-100 ml-auto">
                                {format(new Date(request.createdAt), 'd MMM HH:mm')}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className={`flex items-center gap-2 text-xs font-black px-3 py-1.5 rounded-full shadow-sm ${
                                request.type === 'LATE_ENTRY' ? 'bg-violet-100 text-violet-700' : 
                                request.type.includes('FORGOT') ? 'bg-amber-100 text-amber-700' :
                                'bg-white/80 text-gray-700 border border-black/5'
                            }`}>
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(request.startDate), 'd MMM')} 
                                {new Date(request.startDate).getTime() !== new Date(request.endDate).getTime() && ` - ${format(new Date(request.endDate), 'd MMM yyyy')}`}
                            </div>

                            {request.attachmentUrl && (
                                <a 
                                    href={request.attachmentUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 text-[10px] bg-blue-100 text-blue-700 border border-blue-200/50 px-3 py-1.5 rounded-full font-black hover:bg-blue-200 transition-colors cursor-pointer"
                                    id={`evidence-link-${request.id}`}
                                >
                                    <ExternalLink className="w-3 h-3" /> ดูหลักฐาน
                                </a>
                            )}
                        </div>

                        {renderReason(parsed)}
                        
                        {/* Rejection Reason Display */}
                        {request.status === 'REJECTED' && request.rejectionReason && (
                            <div className="mt-3 text-xs text-red-600 bg-red-50/50 p-3 rounded-2xl border border-red-100/50 flex gap-2">
                                <XCircle className="w-4 h-4 shrink-0" />
                                <div>
                                    <span className="font-black block mb-0.5">เหตุผลที่ปฏิเสธ:</span>
                                    <p className="italic">"{request.rejectionReason}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {request.status === 'PENDING' && (
                    <div className="flex flex-row lg:flex-col gap-2 shrink-0 lg:w-32 lg:justify-center border-t lg:border-t-0 lg:border-l border-black/5 pt-4 lg:pt-0 lg:pl-6 mt-2 lg:mt-0">
                        <button 
                            onClick={async (e) => { 
                                e.stopPropagation(); 
                                if (await showConfirm('อนุมัติคำขอนี้?')) {
                                    await onApprove(request); 
                                }
                            }}
                            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            id={`approve-btn-${request.id}`}
                        >
                            <CheckCircle2 className="w-4 h-4" /> อนุมัติ
                        </button>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onRejectClick(request.id); 
                            }}
                            className="flex-1 px-4 py-3 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            id={`reject-btn-${request.id}`}
                        >
                            <XCircle className="w-4 h-4" /> ปฏิเสธ
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ApprovalRequestCard;

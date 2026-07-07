import React from 'react';
import { format } from 'date-fns';
import { 
    Clock, Calendar, Briefcase, Moon, FileText, 
    AlertTriangle, MapPin, ShieldAlert
} from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';
import { 
    ParsedReason, getTypeName, getTypeColorClass 
} from './utils';
import { AttachmentPreview } from './AttachmentPreview';

interface RequestInfoSectionProps {
    request: LeaveRequest;
    parsed: ParsedReason;
    durationText: string;
}

export const RequestInfoSection: React.FC<RequestInfoSectionProps> = ({
    request,
    parsed,
    durationText
}) => {
    const colorStyle = getTypeColorClass(request.type);

    return (
        <div className="space-y-5">
            {/* Request Type Panel */}
            <div className={`${colorStyle.bg} ${colorStyle.border} p-4 rounded-2xl border flex items-center justify-between shadow-sm`}>
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
                            <div className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-bold shadow-sm">
                                <Clock className="w-3.5 h-3.5" />
                                <span>ระบุเวลาบันทึก: {parsed.time} น.</span>
                            </div>
                        )}
                        {parsed.otHours && (
                            <div className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-bold shadow-sm">
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
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 text-xs font-bold shadow-sm">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                                <span>การยื่นย้อนหลังล่าช้า (ยื่นคำขอนี้ล่าช้ากว่ากำหนดของระบบ)</span>
                            </div>
                        )}
                        {parsed.isLocationMismatch && (
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 text-xs font-bold shadow-sm animate-pulse">
                                <MapPin className="w-4 h-4 shrink-0 text-rose-500" />
                                <span>ตรวจพบพิกัดเช็คอินผิดปกติ (อยู่นอกพื้นที่สำนักงานที่กำหนด)</span>
                            </div>
                        )}
                        {parsed.forgotCheckoutPenalty && (
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-50 text-orange-800 border border-orange-100 text-xs font-bold shadow-sm">
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

            {/* Attachment Preview (if any) */}
            {request.attachmentUrl && (
                <div className="pt-2">
                    <AttachmentPreview attachmentUrl={request.attachmentUrl} />
                </div>
            )}
        </div>
    );
};
export default RequestInfoSection;

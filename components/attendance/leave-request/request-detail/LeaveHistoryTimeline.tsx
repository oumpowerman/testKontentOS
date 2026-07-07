import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';
import { getWorkingDaysDifference } from '../../../../lib/attendanceUtils';
import { getTypeColorClass, getTypeName, parseReason } from './utils';

interface LeaveHistoryTimelineProps {
    history: LeaveRequest[];
    isLoadingHistory: boolean;
    annualHolidays: any;
    calendarExceptions: any;
}

export const LeaveHistoryTimeline: React.FC<LeaveHistoryTimelineProps> = ({
    history,
    isLoadingHistory,
    annualHolidays,
    calendarExceptions
}) => {
    if (isLoadingHistory) {
        return (
            <div className="py-8 text-center text-xs font-medium text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <span>กำลังโหลดข้อมูลประวัติ...</span>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="py-8 text-center text-xs font-medium text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                ไม่มีประวัติการลาก่อนหน้า
            </div>
        );
    }

    const limitedHistory = history.slice(0, 10);

    return (
        <div className="space-y-4 pr-1">
            {limitedHistory.map((hist, idx) => {
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
                        {idx < limitedHistory.length - 1 && (
                            <div className="absolute left-[9px] top-6 bottom-[-14px] w-0.5 bg-slate-100" />
                        )}
                        
                        {/* Dot Indicator with precise color coding */}
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

                        {/* Card item with compact styling */}
                        <div className="flex-1 min-w-0 bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:border-slate-200 hover:shadow-md hover:translate-x-[2px] transition-all duration-200">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${histStyle.bg} ${histStyle.text} border ${histStyle.border}`}>
                                        {getTypeName(hist.type)}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                        {histDays} วัน
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap shrink-0">
                                    {format(new Date(hist.startDate), 'd MMM yyyy')}
                                </span>
                            </div>

                            {cleanHistReason && (
                                <p className="text-xs text-slate-500 font-medium line-clamp-2 italic mt-1 pl-1">
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

            {history.length > 10 && (
                <div className="text-center text-[10px] text-slate-400 font-medium py-2 border-t border-dashed border-slate-100 mt-2">
                    * แสดงข้อมูลล่าสุด 10 รายการสำหรับใช้ประกอบการพิจารณาเท่านั้น
                </div>
            )}
        </div>
    );
};
export default LeaveHistoryTimeline;

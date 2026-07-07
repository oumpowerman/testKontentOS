import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Clock, Calendar, Image as ImageIcon } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';
import { getDirectDriveUrl } from '../../../lib/imageUtils';

interface AttendanceDetailTableProps {
    logs: AttendanceLog[];
    leaveRequests?: any[];
    getStatusDetails: (status: string) => { label: string; className: string };
    extractProofUrl: (note?: string) => string | null;
    cleanNote: (note?: string) => string;
    formatTime: (time: any) => string;
    setPreviewImage: (url: string | null) => void;
    isStreak?: boolean;
}

export const AttendanceDetailTable: React.FC<AttendanceDetailTableProps> = ({
    logs,
    leaveRequests,
    getStatusDetails,
    extractProofUrl,
    cleanNote,
    formatTime,
    setPreviewImage,
    isStreak,
}) => {
    const getOtDetailsForDate = (dateStr: string, userId: string) => {
        if (!leaveRequests) return null;
        const req = leaveRequests.find(r => {
            if (r.userId !== userId) return false;
            if (r.type !== 'OVERTIME') return false;
            const s = format(new Date(r.startDate), 'yyyy-MM-dd');
            return s === dateStr;
        });

        if (!req) return null;

        const match = req.reason ? req.reason.match(/\[OT:(.*?)\]/) : null;
        const hours = match ? match[1] : null;
        const cleanReason = req.reason ? req.reason.replace(/\[OT:.*?\]/, '').trim() : '';

        return {
            hours: hours || 'ไม่ระบุ',
            status: req.status,
            reason: cleanReason
        };
    };

    const renderOtBadge = (ot: { hours: string; status: string; reason: string }) => {
        let bgClass = '';
        let borderClass = '';
        let textClass = '';
        let dotClass = '';
        let statusText = '';

        if (ot.status === 'APPROVED') {
            bgClass = 'bg-amber-50';
            borderClass = 'border-amber-200/50';
            textClass = 'text-amber-700';
            dotClass = 'bg-amber-500';
            statusText = 'อนุมัติแล้ว';
        } else if (ot.status === 'PENDING') {
            bgClass = 'bg-indigo-50 animate-pulse';
            borderClass = 'border-indigo-200/50';
            textClass = 'text-indigo-600';
            dotClass = 'bg-indigo-500';
            statusText = 'รออนุมัติ';
        } else {
            bgClass = 'bg-slate-50';
            borderClass = 'border-slate-200';
            textClass = 'text-slate-500';
            dotClass = 'bg-slate-400';
            statusText = 'ปฏิเสธ';
        }

        return (
            <div 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${bgClass} ${borderClass} ${textClass}`}
                title={`ชั่วโมง: ${ot.hours} | เหตุผล: ${ot.reason || 'ไม่ได้ระบุ'}`}
            >
                <span className={`w-1 h-1 rounded-full shrink-0 ${dotClass}`} />
                <span>OT {ot.hours} ({statusText})</span>
            </div>
        );
    };
    return (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] selection:bg-indigo-50">
            <table className="w-full min-w-[540px] sm:min-w-[700px] text-left border-collapse table-auto">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="w-1 p-0"></th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-6 sm:pl-8">วันที่</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                            <span className="hidden sm:inline">เวลาเข้างาน (Check In)</span>
                            <span className="inline sm:hidden">เข้างาน</span>
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                            <span className="hidden sm:inline">เวลาออกงาน (Check Out)</span>
                            <span className="inline sm:hidden">ออกงาน</span>
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-4">
                            <span className="hidden sm:inline">หมายเหตุ / หลักฐาน</span>
                            <span className="inline sm:hidden">โน้ต/หลักฐาน</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => {
                        const proofUrl = extractProofUrl(log.note);
                        const noteText = cleanNote(log.note);
                        const statusDetails = getStatusDetails(log.status);

                        // Define subtle color accents based on status
                        const getAccentLineClass = (status: string) => {
                            if (status === 'LATE') return 'bg-rose-500';
                            if (status === 'ON_TIME' || status === 'WORKING' || status === 'COMPLETED') return 'bg-emerald-500';
                            if (status === 'LEAVE') return 'bg-amber-500';
                            return 'bg-slate-300';
                        };

                        return (
                            <motion.tr
                                key={log.id}
                                layout
                                className="hover:bg-slate-50/50 transition-colors group relative"
                            >
                                {/* Active status color feedback tab on left side of row */}
                                <td className="p-0 w-1 relative overflow-visible">
                                    <div className={`absolute left-0 top-2 bottom-2 w-[4px] rounded-r-md transition-all group-hover:scale-y-110 ${getAccentLineClass(log.status)}`} />
                                </td>

                                {/* Date with responsive formats */}
                                <td className="px-3 sm:px-6 py-3.5 pl-5 sm:pl-7">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center border shrink-0 transition-colors
                                            ${isStreak
                                                ? 'bg-amber-50/70 border-amber-200/50'
                                                : 'bg-indigo-50/60 border-indigo-100/30'
                                            }
                                        `}>
                                            <Calendar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors
                                                ${isStreak ? 'text-amber-500' : 'text-indigo-500'}
                                            `} />
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                                            {/* Longer format for desktop/tablets, compact for mobile */}
                                            <span className="hidden sm:inline">
                                                {format(parseISO(log.date), 'd MMMM yyyy', { locale: th })}
                                            </span>
                                            <span className="inline sm:hidden">
                                                {format(parseISO(log.date), 'd MMM yy', { locale: th })}
                                            </span>
                                        </span>
                                    </div>
                                </td>

                                {/* Status Badge */}
                                <td className="px-3 sm:px-6 py-3.5 text-center">
                                    <div className="flex flex-col items-center gap-1.5 justify-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide border whitespace-nowrap ${statusDetails.className}`}>
                                            {statusDetails.label}
                                        </span>
                                        {(() => {
                                            const ot = getOtDetailsForDate(log.date, log.userId);
                                            return ot ? renderOtBadge(ot) : null;
                                        })()}
                                    </div>
                                </td>

                                {/* Check In */}
                                <td className="px-3 sm:px-6 py-3.5 text-center font-mono">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-50 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold text-slate-700 border border-slate-100/50 whitespace-nowrap">
                                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                                        {formatTime(log.checkInTime)}
                                    </div>
                                </td>

                                {/* Check Out */}
                                <td className="px-3 sm:px-6 py-3.5 text-center font-mono">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-50 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold text-slate-700 border border-slate-100/50 whitespace-nowrap">
                                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                                        {formatTime(log.checkOutTime)}
                                    </div>
                                </td>

                                {/* Note / Proof */}
                                <td className="px-3 sm:px-6 py-3.5 pl-4">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {proofUrl && (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewImage(proofUrl);
                                                }}
                                                className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer hover:shadow hover:scale-105 transition-all group/thumb shrink-0"
                                                title="คลิกเพื่อขยายดูรูปภาพ"
                                            >
                                                <img
                                                    src={getDirectDriveUrl(proofUrl)}
                                                    alt="Proof thumbnail"
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageIcon className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            </div>
                                        )}
                                        {noteText ? (
                                            <div className={`text-[11px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl flex items-start gap-1 max-w-[120px] sm:max-w-[280px] border transition-colors
                                                ${isStreak
                                                    ? 'text-amber-700 bg-amber-50/30 border-amber-100/50'
                                                    : 'text-slate-600 bg-indigo-50/20 border-indigo-50/40'
                                                }
                                            `}>
                                                <span className="line-clamp-1 sm:line-clamp-2" title={noteText}>{noteText}</span>
                                            </div>
                                        ) : (
                                            !proofUrl && <span className="text-xs text-slate-300">-</span>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

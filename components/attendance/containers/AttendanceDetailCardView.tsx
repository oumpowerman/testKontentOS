import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Clock, Calendar, Image as ImageIcon, Eye } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';
import { getDirectDriveUrl } from '../../../lib/imageUtils';

interface AttendanceDetailCardViewProps {
    logs: AttendanceLog[];
    getStatusDetails: (status: string) => { label: string; className: string };
    extractProofUrl: (note?: string) => string | null;
    cleanNote: (note?: string) => string;
    formatTime: (time: any) => string;
    setPreviewImage: (url: string | null) => void;
}

export const AttendanceDetailCardView: React.FC<AttendanceDetailCardViewProps> = ({
    logs,
    getStatusDetails,
    extractProofUrl,
    cleanNote,
    formatTime,
    setPreviewImage,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {logs.map((log) => {
                const proofUrl = extractProofUrl(log.note);
                const noteText = cleanNote(log.note);
                const statusDetails = getStatusDetails(log.status);

                return (
                    <motion.div
                        key={log.id}
                        layout
                        className="bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50/60 flex items-center justify-center border border-indigo-100/30">
                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                    {format(parseISO(log.date), 'd MMMM yyyy', { locale: th })}
                                </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusDetails.className}`}>
                                {statusDetails.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                            <div className="bg-slate-50/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Clock className="w-3" /> Check In
                                </p>
                                <p className="text-lg sm:text-xl font-bold text-slate-800 font-mono">
                                    {formatTime(log.checkInTime)}
                                </p>
                            </div>
                            <div className="bg-slate-50/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Clock className="w-3" /> Check Out
                                </p>
                                <p className="text-lg sm:text-xl font-bold text-slate-800 font-mono">
                                    {formatTime(log.checkOutTime)}
                                </p>
                            </div>
                        </div>

                        {proofUrl && (
                            <div className="mb-4 relative group/img">
                                <div
                                    onClick={() => setPreviewImage(proofUrl)}
                                    className="w-full h-24 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100 cursor-pointer relative"
                                >
                                    <img
                                        src={getDirectDriveUrl(proofUrl)}
                                        alt="Proof attachment"
                                        className="w-full h-full object-cover group-hover/img:scale-105 transition-all duration-500"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Eye className="w-5 h-5 text-white" />
                                        <span className="text-xs text-white font-bold">ขยายดูหลักฐาน</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {noteText && (
                            <div className="p-3 sm:p-4 bg-indigo-50/30 rounded-xl sm:rounded-2xl border border-indigo-100/50">
                                <p className="text-xs text-indigo-600 font-medium leading-relaxed">
                                    <span className="font-bold uppercase text-[9px] tracking-widest block mb-1 opacity-60">Note</span>
                                    "{noteText}"
                                </p>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

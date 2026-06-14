
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AttendanceLog } from '../../../types/attendance';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Clock, Calendar, AlertCircle, CheckCircle2, TrendingUp, X, Image as ImageIcon, LayoutGrid, Table } from 'lucide-react';

interface Props {
    logs: AttendanceLog[];
    type: 'LATE' | 'ON_TIME' | 'STREAK' | 'HOURS' | null;
    onClose: () => void;
}

const AttendanceDetailCards: React.FC<Props> = ({ logs, type, onClose }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

    if (!type) return null;

    const filteredLogs = logs.filter(log => {
        if (type === 'LATE') return log.status === 'LATE';
        if (type === 'ON_TIME') return log.status === 'ON_TIME' || log.status === 'WORKING' || log.status === 'COMPLETED';
        return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getTitle = () => {
        switch (type) {
            case 'LATE': return 'รายการมาสาย (Late)';
            case 'ON_TIME': return 'รายการมาตรงเวลา (On Time)';
            case 'STREAK': return 'สถิติ Streak ล่าสุด';
            case 'HOURS': return 'ชั่วโมงการทำงานสะสม';
            default: return '';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'LATE': return <AlertCircle className="w-6 h-6 text-rose-500" />;
            case 'ON_TIME': return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
            case 'STREAK': return <TrendingUp className="w-6 h-6 text-orange-500" />;
            case 'HOURS': return <Clock className="w-6 h-6 text-blue-500" />;
            default: return null;
        }
    };

    const extractProofUrl = (note?: string) => {
        if (!note) return null;
        const match = note.match(/\[PROOF:(.*?)\]/);
        return match ? match[1] : null;
    };

    const cleanNote = (note?: string) => {
        if (!note) return '';
        return note.replace(/\[PROOF:.*?\]/, '').replace(/\[APPEAL_PENDING\]/, '').replace(/\[MANUAL_ENTRY\]/, '').trim();
    };

    const formatTime = (time: any) => {
        if (!time) return '--:--';
        try {
            const d = typeof time === 'string' ? parseISO(time) : new Date(time);
            return format(d, 'HH:mm');
        } catch {
            return '--:--';
        }
    };

    const getStatusDetails = (status: string) => {
        switch (status) {
            case 'LATE':
                return { label: 'สาย', className: 'bg-rose-50 text-rose-600 border-rose-100/30' };
            case 'ON_TIME':
                return { label: 'ตรงเวลา', className: 'bg-emerald-50 text-emerald-600 border-emerald-100/30' };
            case 'WORKING':
                return { label: 'กำลังทำงาน', className: 'bg-blue-50 text-blue-600 border-blue-100/30' };
            case 'COMPLETED':
                return { label: 'เช็คเอาท์แล้ว', className: 'bg-indigo-50 text-indigo-600 border-indigo-100/30' };
            case 'ABSENT':
                return { label: 'ขาดงาน', className: 'bg-rose-100/70 text-rose-700 border-rose-200/50' };
            case 'LEAVE':
                return { label: 'ลา', className: 'bg-amber-50 text-amber-600 border-amber-100/30' };
            case 'EARLY_LEAVE':
                return { label: 'กลับก่อนเวลา', className: 'bg-orange-50 text-orange-600 border-orange-100/30' };
            case 'PENDING_VERIFY':
                return { label: 'รอตรวจสอบ', className: 'bg-slate-100 text-slate-600 border-slate-200/50' };
            case 'ACTION_REQUIRED':
                return { label: 'ต้องดำเนินการ', className: 'bg-pink-50 text-pink-600 border-pink-100/30' };
            case 'NO_SHOW':
                return { label: 'ไม่เช็คอิน', className: 'bg-slate-200 text-slate-500 border-slate-300/50' };
            default:
                return { label: status || 'ไม่ระบุ', className: 'bg-slate-50 text-slate-500 border-slate-100/30' };
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-slate-50 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
            >
                {/* Header */}
                <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-2xl shadow-inner border border-slate-100">
                            {getIcon()}
                        </div>
                        <div>
                            <h4 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">{getTitle()}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Attendance Details</p>
                        </div>
                    </div>
                    
                    {/* View Switcher & Close button */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black transition-all ${
                                    viewMode === 'card'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title="แสดงแบบการ์ด"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">การ์ด</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title="แสดงแบบตาราง"
                            >
                                <Table className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">ตาราง</span>
                            </button>
                        </div>

                        <button 
                            onClick={onClose}
                            className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    {filteredLogs.length > 0 ? (
                        viewMode === 'table' ? (
                            <div className="w-full overflow-x-auto rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                                <table className="w-full min-w-[700px] text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/70">
                                            <th className="px-6 py-4.5 text-xs font-black text-slate-400 uppercase tracking-wider">วันที่</th>
                                            <th className="px-6 py-4.5 text-xs font-black text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                                            <th className="px-6 py-4.5 text-xs font-black text-slate-400 uppercase tracking-wider text-center">เวลาเข้างาน (Check In)</th>
                                            <th className="px-6 py-4.5 text-xs font-black text-slate-400 uppercase tracking-wider text-center">เวลาออกงาน (Check Out)</th>
                                            <th className="px-6 py-4.5 text-xs font-black text-slate-400 uppercase tracking-wider">หมายเหตุ / หลักฐาน</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredLogs.map((log) => {
                                            const proofUrl = extractProofUrl(log.note);
                                            const noteText = cleanNote(log.note);
                                            const statusDetails = getStatusDetails(log.status);
                                            
                                            return (
                                                <motion.tr 
                                                    key={log.id}
                                                    layout
                                                    className="hover:bg-slate-50/40 transition-colors"
                                                >
                                                    {/* Date */}
                                                    <td className="px-6 py-4.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-indigo-50/60 flex items-center justify-center border border-indigo-100/30">
                                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                            </div>
                                                            <span className="text-sm font-black text-slate-700">
                                                                {format(parseISO(log.date), 'd MMMM yyyy', { locale: th })}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-6 py-4.5 text-center">
                                                        <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${statusDetails.className}`}>
                                                            {statusDetails.label}
                                                        </span>
                                                    </td>

                                                    {/* Check In */}
                                                    <td className="px-6 py-4.5 text-center font-mono">
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg text-sm font-black text-slate-700 border border-slate-100/50">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            {formatTime(log.checkInTime)}
                                                        </div>
                                                    </td>

                                                    {/* Check Out */}
                                                    <td className="px-6 py-4.5 text-center font-mono">
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg text-sm font-black text-slate-700 border border-slate-100/50">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            {formatTime(log.checkOutTime)}
                                                        </div>
                                                    </td>

                                                    {/* Note / Proof */}
                                                    <td className="px-6 py-4.5">
                                                        <div className="flex items-center gap-3">
                                                            {proofUrl && (
                                                                <div 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPreviewImage(proofUrl);
                                                                    }}
                                                                    className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer hover:shadow hover:scale-105 transition-all group/thumb shrink-0"
                                                                    title="คลิกเพื่อขยายดูรูปภาพ"
                                                                >
                                                                    <img 
                                                                        src={proofUrl} 
                                                                        alt="Proof thumbnail" 
                                                                        className="w-full h-full object-cover"
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <ImageIcon className="w-4 h-4 text-white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {noteText ? (
                                                                <div className="text-xs text-slate-600 bg-indigo-50/30 border border-indigo-50/80 px-3 py-2 rounded-xl flex items-start gap-1.5 max-w-[280px]">
                                                                    <span className="line-clamp-2" title={noteText}>{noteText}</span>
                                                                </div>
                                                            ) : (
                                                                !proofUrl && <span className="text-xs text-slate-300 font-bold">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredLogs.map((log) => {
                                    const proofUrl = extractProofUrl(log.note);
                                    const noteText = cleanNote(log.note);
                                    const statusDetails = getStatusDetails(log.status);
                                    
                                    return (
                                        <motion.div 
                                            key={log.id}
                                            layout
                                            className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-700">
                                                        {format(parseISO(log.date), 'd MMMM yyyy', { locale: th })}
                                                    </span>
                                                </div>
                                                <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusDetails.className}`}>
                                                    {statusDetails.label}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <Clock className="w-3" /> Check In
                                                    </p>
                                                    <p className="text-xl font-black text-slate-800 font-mono">
                                                        {formatTime(log.checkInTime)}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <Clock className="w-3" /> Check Out
                                                    </p>
                                                    <p className="text-xl font-black text-slate-800 font-mono">
                                                        {formatTime(log.checkOutTime)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Proof Image Preview */}
                                            {proofUrl && (
                                                <div className="mb-4 relative group/img">
                                                    <div 
                                                        onClick={() => setPreviewImage(proofUrl)}
                                                        className="w-full h-32 rounded-2xl overflow-hidden border border-slate-100 cursor-pointer relative"
                                                    >
                                                        <img 
                                                            src={proofUrl} 
                                                            alt="Attendance Proof" 
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ImageIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                                                        <ImageIcon className="w-3 h-3" /> คลิกเพื่อดูรูปหลักฐาน
                                                    </p>
                                                </div>
                                            )}

                                            {noteText && (
                                                <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                                    <p className="text-xs text-indigo-600 font-medium leading-relaxed">
                                                        <span className="font-black uppercase text-[9px] tracking-widest block mb-1 opacity-60">Note</span>
                                                        "{noteText}"
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black text-lg">ไม่พบข้อมูลในหมวดนี้</p>
                            <p className="text-slate-300 text-sm font-medium">ลองเลือกดูสถิติหมวดอื่นๆ แทนนะครับ</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                        onClick={() => setPreviewImage(null)}
                    >
                        <button 
                            className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={previewImage} 
                            alt="Full Preview" 
                            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                            referrerPolicy="no-referrer"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
};

export default AttendanceDetailCards;

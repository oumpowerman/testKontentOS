
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AttendanceLog } from '../../../types/attendance';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Clock, Calendar, AlertCircle, CheckCircle2, TrendingUp, X, Image as ImageIcon, LayoutGrid, Table } from 'lucide-react';
import { AttendanceDetailTable } from './AttendanceDetailTable';
import { AttendanceDetailCardView } from './AttendanceDetailCardView';
import { getDirectDriveUrl } from '../../../lib/imageUtils';
import { useMasterData } from '../../../hooks/useMasterData';
import { getAttendanceSummary } from '../../../lib/attendanceUtils';

interface Props {
    logs: AttendanceLog[];
    type: 'LATE' | 'ON_TIME' | 'STREAK' | 'HOURS' | null;
    onClose: () => void;
}

const AttendanceDetailCards: React.FC<Props> = ({ logs, type, onClose }) => {
    const { masterOptions } = useMasterData();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            setViewMode('card');
        }
    }, []);

    if (!type) return null;

    const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
    const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
    const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '0');

    const filteredLogs = logs.filter(log => {
        const summary = getAttendanceSummary(
            log.checkInTime,
            log.checkOutTime,
            { startTime: startTimeStr, buffer, minHours: 9 }
        );

        if (type === 'LATE') return summary.isLate;
        if (type === 'ON_TIME') return !summary.isLate && !!log.checkInTime;
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
            case 'LATE': return <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />;
            case 'ON_TIME': return <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />;
            case 'STREAK': return <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />;
            case 'HOURS': return <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
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
                className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-slate-50 rounded-2xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
            >
                {/* Header */}
                <div className="p-4 sm:p-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl shadow-inner border border-slate-100">
                            {getIcon()}
                        </div>
                        <div>
                            <h4 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight leading-none">{getTitle()}</h4>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Attendance Details</p>
                        </div>
                    </div>
                    
                    {/* View Switcher & Close button */}
                    <div className="flex items-center gap-2 sm:gap-3 justify-end w-full sm:w-auto">
                        <div className="bg-slate-100 p-1 rounded-xl sm:rounded-2xl flex items-center">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
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
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
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
                            className="p-2.5 sm:p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl sm:rounded-2xl transition-all active:scale-90"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
                    {filteredLogs.length > 0 ? (
                        viewMode === 'table' ? (
                            <AttendanceDetailTable 
                                logs={filteredLogs}
                                getStatusDetails={getStatusDetails}
                                extractProofUrl={extractProofUrl}
                                cleanNote={cleanNote}
                                formatTime={formatTime}
                                setPreviewImage={setPreviewImage}
                            />
                        ) : (
                            <AttendanceDetailCardView 
                                logs={filteredLogs}
                                getStatusDetails={getStatusDetails}
                                extractProofUrl={extractProofUrl}
                                cleanNote={cleanNote}
                                formatTime={formatTime}
                                setPreviewImage={setPreviewImage}
                            />
                        )
                    ) : (
                        <div className="py-12 sm:py-20 text-center bg-white rounded-2xl sm:rounded-[3rem] border-2 border-dashed border-slate-200">
                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold text-lg">ไม่พบข้อมูลในหมวดนี้</p>
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
                            src={getDirectDriveUrl(previewImage)} 
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

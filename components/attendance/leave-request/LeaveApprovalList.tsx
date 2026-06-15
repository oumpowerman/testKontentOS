
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, FileText, Calendar, ExternalLink, Clock, Briefcase, User, Info, ChevronDown, Filter, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { LeaveRequest } from '../../../types/attendance';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getWorkingDaysDifference } from '../../../lib/attendanceUtils';
import { useMasterData } from '../../../hooks/useMasterData';

interface LeaveApprovalListProps {
    requests: LeaveRequest[];
    isLoading: boolean;
    onApprove: (req: LeaveRequest) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
}

type HistoryFilter = 'ALL' | 'APPROVED' | 'REJECTED';

const LeaveApprovalList: React.FC<LeaveApprovalListProps> = ({ 
    requests, isLoading, onApprove, onReject 
}) => {
    const { showAlert, showConfirm } = useGlobalDialog();
    const { annualHolidays, calendarExceptions } = useMasterData();
    const [filterStatus, setFilterStatus] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const [historySubFilter, setHistorySubFilter] = useState<HistoryFilter>('ALL');
    const [displayLimit, setDisplayLimit] = useState(10);
    
    // New State for Rejection Modal
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredRequests = useMemo(() => {
        let base = requests.filter(r => 
            filterStatus === 'PENDING' ? r.status === 'PENDING' : r.status !== 'PENDING'
        );

        if (filterStatus === 'HISTORY') {
            if (historySubFilter === 'APPROVED') base = base.filter(r => r.status === 'APPROVED');
            if (historySubFilter === 'REJECTED') base = base.filter(r => r.status === 'REJECTED');
        }

        return base;
    }, [requests, filterStatus, historySubFilter]);

    const paginatedRequests = useMemo(() => {
        return filteredRequests.slice(0, displayLimit);
    }, [filteredRequests, displayLimit]);

    const hasMore = filteredRequests.length > displayLimit;

    const handleRejectClick = (id: string) => {
        setRejectingId(id);
        setRejectionReason('');
    };

    const handleConfirmReject = async () => {
        if (!rejectingId) return;
        if (!rejectionReason.trim()) {
            showAlert('กรุณาระบุเหตุผลในการปฏิเสธ', 'ข้อมูลไม่ครบ');
            return;
        }
        setIsSubmitting(true);
        await onReject(rejectingId, rejectionReason);
        setIsSubmitting(false);
        setRejectingId(null);
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            SICK: 'bg-rose-50 text-rose-600 border-rose-100',
            VACATION: 'bg-sky-50 text-sky-600 border-sky-100',
            PERSONAL: 'bg-slate-50 text-slate-600 border-slate-100',
            EMERGENCY: 'bg-amber-50 text-amber-600 border-amber-100',
            LATE_ENTRY: 'bg-violet-50 text-violet-600 border-violet-100',
            OVERTIME: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            FORGOT_CHECKIN: 'bg-orange-50 text-orange-600 border-orange-100',
            FORGOT_CHECKOUT: 'bg-orange-50 text-orange-600 border-orange-100',
            WFH: 'bg-indigo-50 text-indigo-600 border-indigo-100'
        };

        const labels: Record<string, string> = {
            SICK: 'ลาป่วย',
            VACATION: 'ลาพักร้อน',
            PERSONAL: 'ลากิจ',
            EMERGENCY: 'ลาฉุกเฉิน',
            LATE_ENTRY: 'ขอเข้าสาย',
            OVERTIME: 'แจ้ง OT',
            FORGOT_CHECKIN: 'ลืมเช็คอิน',
            FORGOT_CHECKOUT: 'ลืมเช็คเอาท์',
            WFH: 'ขอ WFH'
        };
        
        let icon = <Info className="w-3 h-3 mr-1"/>;
        if (type === 'LATE_ENTRY') icon = <Clock className="w-3 h-3 mr-1"/>;
        else if (type === 'OVERTIME') icon = <Briefcase className="w-3 h-3 mr-1"/>;
        else if (type.includes('FORGOT')) icon = <Clock className="w-3 h-3 mr-1"/>;

        return (
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border flex items-center ${styles[type] || 'bg-gray-100'}`}>
                {icon} {labels[type] || type}
            </span>
        );
    };

    const renderReason = (reason: string) => {
        const timeMatch = reason.match(/\[TIME:(\d{2}:\d{2})\]/);
        if (timeMatch) {
            const time = timeMatch[1];
            const cleanReason = reason.replace(/\[TIME:\d{2}:\d{2}\]/, '').trim();
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black shadow-sm flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-3 h-3" />
                            ระบุเวลา: {time} น.
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 italic leading-relaxed">
                        "{cleanReason || 'ไม่ได้ระบุเหตุผลเพิ่มเติม'}"
                    </p>
                </div>
            );
        }
        return (
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 italic leading-relaxed">
                "{reason || 'ไม่ได้ระบุเหตุผล'}"
            </p>
        );
    };

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-fit shadow-sm">
                    <button 
                        onClick={() => { setFilterStatus('PENDING'); setDisplayLimit(10); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filterStatus === 'PENDING' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        รออนุมัติ 
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === 'PENDING' ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                            {requests.filter(r => r.status === 'PENDING').length}
                        </span>
                    </button>
                    <button 
                        onClick={() => { setFilterStatus('HISTORY'); setDisplayLimit(10); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'HISTORY' ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        ประวัติย้อนหลัง
                    </button>
                </div>

                {filterStatus === 'HISTORY' && (
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 w-fit shadow-sm">
                        <button 
                            onClick={() => { setHistorySubFilter('ALL'); setDisplayLimit(10); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${historySubFilter === 'ALL' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            ทั้งหมด
                        </button>
                        <button 
                            onClick={() => { setHistorySubFilter('APPROVED'); setDisplayLimit(10); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${historySubFilter === 'APPROVED' ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            อนุมัติแล้ว
                        </button>
                        <button 
                            onClick={() => { setHistorySubFilter('REJECTED'); setDisplayLimit(10); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${historySubFilter === 'REJECTED' ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            ไม่อนุมัติ
                        </button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold">กำลังดึงข้อมูลคำขอ...</p>
                    </div>
                ) : paginatedRequests.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400"
                    >
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="font-bold">ไม่มีรายการคำขอในหน้านี้</p>
                        <p className="text-xs mt-1">รายการใหม่ๆ จะปรากฏที่นี่เมื่อพนักงานส่งคำขอ</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {paginatedRequests.map((req) => (
                                <motion.div 
                                    key={req.id} 
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                                >
                                    {/* Status Indicator Bar */}
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${
                                        req.status === 'APPROVED' ? 'bg-green-500' : 
                                        req.status === 'REJECTED' ? 'bg-red-500' : 
                                        'bg-orange-400 animate-pulse'
                                    }`}></div>

                                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                                        <div className="flex gap-5 flex-1">
                                            <div className="shrink-0 relative">
                                                {req.user?.avatarUrl ? (
                                                    <img src={req.user.avatarUrl} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-400 border-2 border-white shadow-md">
                                                        {req.user?.name?.charAt(0)}
                                                    </div>
                                                )}
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                                                    req.status === 'APPROVED' ? 'bg-green-500' : 
                                                    req.status === 'REJECTED' ? 'bg-red-500' : 
                                                    'bg-orange-400'
                                                }`}>
                                                    {req.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    {req.status === 'REJECTED' && <XCircle className="w-3 h-3 text-white" />}
                                                    {req.status === 'PENDING' && <Clock className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <h4 className="font-black text-gray-800 text-lg leading-none">{req.user?.name || 'Unknown'}</h4>
                                                    {getTypeBadge(req.type)}
                                                    
                                                    {/* NEW: Expiration Warning */}
                                                    {req.status === 'PENDING' && ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'].includes(req.type) && (
                                                        getWorkingDaysDifference(req.createdAt, new Date(), annualHolidays, calendarExceptions) >= 2 && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-red-50 text-red-600 border-red-100 flex items-center gap-1 animate-pulse">
                                                                <AlertTriangle className="w-3 h-3" /> ใกล้หมดอายุ
                                                            </span>
                                                        )
                                                    )}

                                                    <span className="text-[10px] text-gray-400 font-mono ml-auto">
                                                        {format(req.createdAt, 'd MMM HH:mm')}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                                    <div className={`flex items-center gap-2 text-xs font-black px-3 py-1.5 rounded-full shadow-sm ${
                                                        req.type === 'LATE_ENTRY' ? 'bg-violet-50 text-violet-700' : 
                                                        req.type.includes('FORGOT') ? 'bg-orange-50 text-orange-700' :
                                                        'bg-gray-50 text-gray-700'
                                                    }`}>
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(req.startDate, 'd MMM')} 
                                                        {req.startDate.getTime() !== req.endDate.getTime() && ` - ${format(req.endDate, 'd MMM yyyy')}`}
                                                    </div>

                                                    {req.attachmentUrl && (
                                                        <a 
                                                            href={req.attachmentUrl} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="inline-flex items-center gap-1.5 text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-black hover:bg-blue-100 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3 h-3" /> ดูหลักฐาน
                                                        </a>
                                                    )}
                                                </div>

                                                {renderReason(req.reason)}
                                                
                                                {/* Rejection Reason Display */}
                                                {req.status === 'REJECTED' && req.rejectionReason && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="mt-3 text-xs text-red-600 bg-red-50/50 p-3 rounded-2xl border border-red-100/50 flex gap-2"
                                                    >
                                                        <XCircle className="w-4 h-4 shrink-0" />
                                                        <div>
                                                            <span className="font-black block mb-0.5">เหตุผลที่ปฏิเสธ:</span>
                                                            <p className="italic">"{req.rejectionReason}"</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {req.status === 'PENDING' && (
                                            <div className="flex flex-row lg:flex-col gap-2 shrink-0 lg:w-32 lg:justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 mt-2 lg:mt-0">
                                                <button 
                                                    onClick={async () => { if(await showConfirm('อนุมัติคำขอนี้?')) onApprove(req); }}
                                                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> อนุมัติ
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectClick(req.id)}
                                                    className="flex-1 px-4 py-3 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" /> ปฏิเสธ
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {hasMore && (
                            <button 
                                onClick={() => setDisplayLimit(prev => prev + 10)}
                                className="w-full py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <ChevronDown className="w-4 h-4" />
                                โหลดข้อมูลเพิ่มเติม ({filteredRequests.length - displayLimit} รายการ)
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Rejection Reason Modal */}
            {rejectingId && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border-2 border-red-100 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        
                        <div className="relative">
                            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mb-6">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                            
                            <h3 className="text-xl font-black text-gray-800 mb-2">ระบุเหตุผลการปฏิเสธ</h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium">เพื่อให้พนักงานทราบเหตุผลและปรับปรุงแก้ไขในครั้งถัดไป</p>
                            
                            <textarea 
                                className="w-full p-4 border-2 border-gray-100 rounded-3xl text-sm focus:ring-4 focus:ring-red-50 focus:border-red-200 outline-none resize-none mb-6 transition-all"
                                rows={4}
                                placeholder="เช่น เอกสารไม่ครบ, วันลาหมด, หรือเหตุผลอื่นๆ..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                autoFocus
                            />
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setRejectingId(null)}
                                    className="flex-1 py-3 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl text-sm font-black transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    onClick={handleConfirmReject}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default LeaveApprovalList;

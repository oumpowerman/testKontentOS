import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronUp, ChevronDown, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { LeaveRequest } from '../../../types/attendance';
import { getWorkingDaysDifference } from '../../../lib/attendanceUtils';
import { useMasterData } from '../../../hooks/useMasterData';
import { attendanceService } from '../../../services/attendanceService';

// Import refactored sub-components
import { RequestHeader } from './request-detail/RequestHeader';
import { RequestInfoSection } from './request-detail/RequestInfoSection';
import { LeaveHistoryTimeline } from './request-detail/LeaveHistoryTimeline';
import { AdminOtAdjustment } from './request-detail/AdminOtAdjustment';
import { ActionFooter } from './request-detail/ActionFooter';
import { parseReason } from './request-detail/utils';

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

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
    request, isOpen, onClose, onApprove, onReject
}) => {
    const { annualHolidays, calendarExceptions } = useMasterData();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Admin OT Customization States
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editOtHours, setEditOtHours] = useState('');
    const [adminNote, setAdminNote] = useState('');

    // Leave History States
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [isMobileFlipped, setIsMobileFlipped] = useState(false);

    const parsed = parseReason(request?.reason || '');

    useEffect(() => {
        setAdminNote('');
        if (request && request.type === 'OVERTIME') {
            const parsedReason = parseReason(request.reason);
            let sTime = '';
            let eTime = '';
            
            if (parsedReason.time && parsedReason.time.includes('-')) {
                const [s, e] = parsedReason.time.split('-');
                sTime = s || '';
                eTime = e || '';
            } else {
                try {
                    sTime = format(new Date(request.startDate), 'HH:mm');
                    eTime = format(new Date(request.endDate), 'HH:mm');
                } catch (e) {
                    sTime = '';
                    eTime = '';
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
        setIsMobileFlipped(false);
    }, [request]);

    if (!isOpen || !request) return null;

    const isLeave = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'WFH', 'UNPAID'].includes(request.type);

    // Calculate duration details
    let durationText = '';
    if (isLeave) {
        const days = getWorkingDaysDifference(request.startDate, request.endDate, annualHolidays, calendarExceptions);
        durationText = `รวมเป็นเวลา ${days} วันทำการ`;
    }

    // Keep original values for OT comparison
    let originalStartTime = '';
    let originalEndTime = '';
    let originalOtHours = '';

    if (request && request.type === 'OVERTIME') {
        const parsedReason = parseReason(request.reason);
        if (parsedReason.time && parsedReason.time.includes('-')) {
            const [s, e] = parsedReason.time.split('-');
            originalStartTime = s || '';
            originalEndTime = e || '';
        } else {
            try {
                originalStartTime = format(new Date(request.startDate), 'HH:mm');
                originalEndTime = format(new Date(request.endDate), 'HH:mm');
            } catch (e) {
                originalStartTime = '';
                originalEndTime = '';
            }
        }
        originalOtHours = parsedReason.otHours || '';
    }

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

    const handleRejectSubmit = async (reason: string) => {
        setIsSubmitting(true);
        try {
            await onReject(request.id, reason);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            id="request-detail-modal-portal"
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
                className="bg-white w-full max-w-lg lg:max-w-none lg:w-auto rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
                id="request-detail-modal-card"
            >
                {/* Header Profile Panel */}
                <RequestHeader request={request} onClose={onClose} />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                    
                    {/* Desktop Version */}
                    <div className="hidden lg:flex flex-row flex-1 min-h-0 overflow-hidden">
                        {/* Left Column (Requests, Admin Controls, Actions) */}
                        <div className="flex-1 flex flex-col min-h-0 bg-white relative lg:w-[620px] shrink-0">
                            {/* Desktop-Only Expandable History Vertical Tab */}
                            <div className="absolute right-0 top-1/3 -translate-y-1/2 z-20">
                                <button
                                    type="button"
                                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                    className={`flex flex-col items-center gap-2 py-6 px-2 rounded-l-2xl shadow-md transition-all duration-300 cursor-pointer border-y border-l ${
                                        isHistoryExpanded
                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 hover:-translate-x-0.5'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 hover:-translate-x-1 hover:shadow-lg'
                                    }`}
                                    id="desktop-history-tab-btn"
                                >
                                    <History className={`w-4 h-4 ${isHistoryExpanded ? 'text-slate-500' : 'text-white'}`} />
                                    <span className="[writing-mode:vertical-lr] text-[10px] font-bold tracking-widest uppercase">
                                        {isHistoryExpanded ? 'พับเก็บประวัติ' : 'ดูประวัติย้อนหลัง'}
                                    </span>
                                    {!isLoadingHistory && history.length > 0 && (
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold shadow-sm mt-1 ${
                                            isHistoryExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-indigo-600'
                                        }`}>
                                            {history.length > 10 ? '10+' : history.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-5 flex-1">
                                {/* Request Info Description */}
                                <RequestInfoSection 
                                    request={request} 
                                    parsed={parsed} 
                                    durationText={durationText} 
                                />

                                {/* Admin OT Settings (Only PENDING and OVERTIME) */}
                                {request.status === 'PENDING' && request.type === 'OVERTIME' && (
                                    <AdminOtAdjustment 
                                        editStartTime={editStartTime}
                                        setEditStartTime={setEditStartTime}
                                        editEndTime={editEndTime}
                                        setEditEndTime={setEditEndTime}
                                        editOtHours={editOtHours}
                                        setEditOtHours={setEditOtHours}
                                        adminNote={adminNote}
                                        setAdminNote={setAdminNote}
                                        originalStartTime={originalStartTime}
                                        originalEndTime={originalEndTime}
                                        originalOtHours={originalOtHours}
                                    />
                                )}

                                {/* Show Rejection Reason if already REJECTED */}
                                {request.status === 'REJECTED' && request.rejectionReason && (
                                    <div className="space-y-2 animate-fade-in">
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

                            {/* Admin Action Footer (Only for PENDING status) */}
                            {request.status === 'PENDING' && (
                                <ActionFooter 
                                    isSubmitting={isSubmitting} 
                                    onApprove={handleApprove} 
                                    onReject={handleRejectSubmit} 
                                />
                            )}
                        </div>

                        {/* Right Column (Work History Sidebar - Desktop Only) */}
                        <AnimatePresence>
                            {isHistoryExpanded && (
                                <motion.div 
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 380, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 30, stiffness: 220 }}
                                    className="flex flex-col border-l border-slate-100 bg-slate-50/30 min-h-0 overflow-hidden shrink-0"
                                >
                                    <div className="w-[380px] p-6 flex flex-col h-full min-h-0 shrink-0">
                                        <div className="flex items-center justify-between w-full mb-4 shrink-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <History className="w-4 h-4 text-indigo-500 shrink-0" />
                                                <h4 className="text-sm font-bold text-slate-800 truncate">ประวัติคำขอย้อนหลัง</h4>
                                            </div>
                                            {!isLoadingHistory && history.length > 0 && (
                                                <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold shadow-sm shrink-0 whitespace-nowrap">
                                                    {history.length > 10 ? '10 ครั้งล่าสุด' : `${history.length} ครั้ง`}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto pr-1">
                                            <LeaveHistoryTimeline 
                                                history={history}
                                                isLoadingHistory={isLoadingHistory}
                                                annualHolidays={annualHolidays}
                                                calendarExceptions={calendarExceptions}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile Version (3D Flip Book) */}
                    <div className="lg:hidden flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-50/20">
                        <div className="w-full relative px-3 py-3 sm:px-4 sm:py-4 flex-1 flex flex-col min-h-0" style={{ perspective: '1200px' }}>
                            <motion.div
                                animate={{ rotateY: isMobileFlipped ? 180 : 0 }}
                                transition={{ type: 'spring', damping: 24, stiffness: 120 }}
                                style={{ transformStyle: 'preserve-3d' }}
                                className="w-full flex-1 relative min-h-[390px] sm:min-h-[460px] h-[65vh] max-h-[580px]"
                            >
                                {/* FRONT FACE (Main request details) */}
                                <div 
                                    style={{ 
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        transformStyle: 'preserve-3d',
                                        transform: 'rotateY(0deg)'
                                    }}
                                    className={`absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-0 overflow-hidden ${isMobileFlipped ? 'pointer-events-none' : ''}`}
                                >
                                    <div className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 flex-1 min-h-0">
                                        {/* Open history book trigger */}
                                        <button
                                            type="button"
                                            onClick={() => setIsMobileFlipped(true)}
                                            className="w-full flex items-center justify-between p-3 sm:p-4 bg-amber-50/50 hover:bg-amber-100/60 border border-amber-100 rounded-2xl transition-all cursor-pointer group shadow-sm"
                                            id="mobile-open-history-book-btn"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">📖</span>
                                                <div className="text-left">
                                                    <div className="text-xs font-bold text-amber-900 tracking-wider">
                                                        เปิดดูสมุดประวัติย้อนหลัง
                                                    </div>
                                                    <div className="text-[10px] text-amber-600 font-medium">
                                                        ประเมินพฤติกรรมการลาเพื่อประกอบการตัดสินใจ
                                                    </div>
                                                </div>
                                            </div>
                                            {!isLoadingHistory && history.length > 0 ? (
                                                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold border border-amber-300 shadow-sm animate-pulse">
                                                    {history.length > 10 ? '10 ครั้งล่าสุด' : `${history.length} ครั้ง`}
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">
                                                    ไม่มีประวัติ
                                                </span>
                                            )}
                                        </button>

                                        {/* Request Info Description */}
                                        <RequestInfoSection 
                                            request={request} 
                                            parsed={parsed} 
                                            durationText={durationText} 
                                        />

                                        {/* Admin OT Settings (Only PENDING and OVERTIME) */}
                                        {request.status === 'PENDING' && request.type === 'OVERTIME' && (
                                            <AdminOtAdjustment 
                                                editStartTime={editStartTime}
                                                setEditStartTime={setEditStartTime}
                                                editEndTime={editEndTime}
                                                setEditEndTime={setEditEndTime}
                                                editOtHours={editOtHours}
                                                setEditOtHours={setEditOtHours}
                                                adminNote={adminNote}
                                                setAdminNote={setAdminNote}
                                                originalStartTime={originalStartTime}
                                                originalEndTime={originalEndTime}
                                                originalOtHours={originalOtHours}
                                            />
                                        )}

                                        {/* Show Rejection Reason if already REJECTED */}
                                        {request.status === 'REJECTED' && request.rejectionReason && (
                                            <div className="space-y-2 animate-fade-in">
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

                                    {/* Admin Action Footer (Only for PENDING status) */}
                                    {request.status === 'PENDING' && (
                                        <ActionFooter 
                                            isSubmitting={isSubmitting} 
                                            onApprove={handleApprove} 
                                            onReject={handleRejectSubmit} 
                                        />
                                    )}
                                </div>

                                {/* BACK FACE (Notebook Leave History Timeline) */}
                                <div 
                                    style={{ 
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        transformStyle: 'preserve-3d',
                                        transform: 'rotateY(180deg)'
                                    }}
                                    className={`absolute inset-0 w-full h-full bg-[#fdfbf7] rounded-3xl border border-amber-200/60 shadow-inner flex flex-col p-3 sm:p-4 ${!isMobileFlipped ? 'pointer-events-none' : ''}`}
                                >
                                    <div className="flex items-center justify-between pb-3 border-b border-dashed border-amber-200 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">📓</span>
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-950">สมุดบันทึกประวัติการลา</h4>
                                                <p className="text-[10px] text-amber-600 font-medium">คุณ {request.user?.name || 'ไม่ทราบชื่อ'}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsMobileFlipped(false)}
                                            className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                                            id="mobile-close-history-book-btn"
                                        >
                                            <span>🔙</span>
                                            <span>กลับหน้าพิจารณา</span>
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3">
                                        <LeaveHistoryTimeline 
                                            history={history}
                                            isLoadingHistory={isLoadingHistory}
                                            annualHolidays={annualHolidays}
                                            calendarExceptions={calendarExceptions}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

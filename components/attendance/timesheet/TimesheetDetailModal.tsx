
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { X, ImageIcon, Download, Clock, MapPin, Info, ArrowRight, ZoomIn, ExternalLink } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';
import { getDirectDriveUrl } from '../../../lib/imageUtils';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const lightboxBackdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const lightboxImageVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
        scale: 1, 
        opacity: 1,
        transition: { 
            type: "spring" as const, 
            damping: 25, 
            stiffness: 240 
        }
    },
    exit: { 
        scale: 0.95, 
        opacity: 0,
        transition: { 
            duration: 0.2,
            ease: "easeIn" as const
        }
    }
};

// --- SUB-COMPONENT: Lightbox Modal (Consistent with TeamChat) ---
const Lightbox: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
    return createPortal(
        <motion.div 
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={lightboxBackdropVariants}
            transition={{ duration: 0.25 }}
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <motion.div 
                className="absolute top-6 right-6 flex items-center gap-3 z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink className="w-5 h-5" />
                </a>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </motion.div>

            <motion.div 
                className="relative max-w-5xl w-full h-full flex items-center justify-center" 
                onClick={(e) => e.stopPropagation()}
                variants={lightboxImageVariants}
            >
                <img 
                    src={getDirectDriveUrl(url)} 
                    alt="Full Preview" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    referrerPolicy="no-referrer"
                />
            </motion.div>
            
            <motion.div 
                className="mt-4 text-white/50 text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                Click anywhere to close
            </motion.div>
        </motion.div>,
        document.body
    );
};

interface TimesheetDetailModalProps {
    log?: AttendanceLog | null;
    leaveRequest?: any | null;
    onClose: () => void;
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: (isMobile: boolean) => ({
        y: isMobile ? '100%' : 24,
        scale: isMobile ? 1 : 0.95,
        opacity: isMobile ? 1 : 0,
    }),
    visible: {
        y: 0,
        scale: 1,
        opacity: 1,
    },
    exit: (isMobile: boolean) => ({
        y: isMobile ? '100%' : 16,
        scale: isMobile ? 1 : 0.98,
        opacity: isMobile ? 1 : 0,
    }),
};

const TimesheetDetailModal: React.FC<TimesheetDetailModalProps> = ({ log, leaveRequest, onClose }) => {
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState('');
    const isMobile = useIsMobile();

    const displayDate = log ? new Date(log.date) : (leaveRequest ? new Date(leaveRequest.start_date) : new Date());
    const note = log?.note || leaveRequest?.reason || '';
    const userReason = leaveRequest?.reason || '';
    const adminRejection = leaveRequest?.rejectionReason || leaveRequest?.rejection_reason || '';
    const systemLogNote = log?.note?.replace(/\[.*?\]/g, '').trim() || '';
    
    return createPortal(
        <motion.div 
            className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-slate-900/80 backdrop-blur-xl p-0 md:p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            transition={{ duration: 0.3 }}
            onClick={onClose}
        >
            <motion.div 
                className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] max-w-xl flex flex-col rounded-none md:rounded-[2.5rem] md:rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border-0 md:border-4 border-white relative"
                custom={isMobile}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
                transition={
                    isMobile 
                        ? { type: "spring", damping: 30, stiffness: 300 }
                        : { ease: "easeOut", duration: 0.25 }
                }
                onClick={e => e.stopPropagation()}
            >
                {/* Floating Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-[calc(env(safe-area-inset-top,16px)+12px)] md:top-6 right-6 p-2 bg-black/40 hover:bg-red-500 text-white rounded-full transition-all shadow-xl backdrop-blur-md z-50 border border-white/10"
                >
                    <X className="w-5 h-5"/>
                </button>

                {/* Natural Scroll Container (No outer padding to allow full-bleed top image) */}
                <div 
                    className="overflow-y-auto flex-1 flex flex-col min-h-0 overscroll-behavior-y-contain -webkit-overflow-scrolling-touch scrollbar-none"
                >
                    {/* Visual Evidence Header (Inside Scrollable list) */}
                    <div 
                        className="relative w-full h-64 sm:h-72 shrink-0 bg-slate-900 flex items-center justify-center group/img overflow-hidden"
                    >
                        {/* Visual drag handle for native mobile sheet feel */}
                        <div 
                            className="absolute top-[calc(env(safe-area-inset-top,16px)+6px)] left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full z-20 md:hidden" 
                        />
                        
                        {(() => {
                            const proofMatch = note.match(/\[PROOF:(.*?)\]/);
                            const url = proofMatch ? proofMatch[1] : (leaveRequest?.attachment_url || null);
                            
                            return url ? (
                                <>
                                    <img 
                                        src={getDirectDriveUrl(url)} 
                                        className="w-full h-full object-cover opacity-90 group-hover/img:scale-105 transition-transform duration-700 cursor-pointer" 
                                        alt="Proof"
                                        referrerPolicy="no-referrer"
                                        onClick={() => {
                                            setLightboxUrl(url);
                                            setShowLightbox(true);
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
                                    
                                    {/* Zoom Indicator */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 text-white">
                                            <ZoomIn className="w-8 h-8" />
                                        </div>
                                    </div>
 
                                    <div 
                                        className="absolute bottom-4 left-6 flex items-center gap-3 transition-all duration-100"
                                    >
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-widest">Visual Evidence</span>
                                        </div>
                                        <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition-all">
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div 
                                    className="flex flex-col items-center text-slate-500 gap-4"
                                >
                                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-700">
                                        <ImageIcon className="w-10 h-10 opacity-20" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">No Visual Record</p>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Details Content Container (With inner Padding) */}
                    <div className="p-6 md:p-8 flex-1 flex flex-col space-y-7 pb-[calc(env(safe-area-inset-bottom,24px)+24px)] min-h-0">
                        <div className="flex justify-between items-start shrink-0">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">
                                    {log ? 'Time Analysis Log' : 'Leave Request Detail'}
                                </p>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-800">
                                    {format(displayDate, 'EEEE d MMMM', { locale: th })}
                                </h3>
                                {leaveRequest && (
                                    <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0
                                    ${leaveRequest.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                      leaveRequest.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                      'bg-red-100 text-red-700 border-red-200'}`}>
                                    {leaveRequest.status} {leaveRequest.type}
                                </div>
                            )}
                            {log && !leaveRequest && (() => {
                                const leaveMatch = log.note?.match(/\[APPROVED LEAVE: (.*?)\]/);
                                if (leaveMatch) {
                                    return (
                                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-widest border border-sky-200 shrink-0">
                                            {leaveMatch[1]} LEAVE
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-[1.25rem] md:rounded-[1.5rem] shadow-inner shrink-0">
                            {leaveRequest ? <Info className="w-6 h-6 md:w-8 md:h-8" /> : <Clock className="w-6 h-6 md:w-8 md:h-8" />}
                        </div>
                    </div>

                    {log ? (
                        <div className="grid grid-cols-2 gap-4 md:gap-6 shrink-0">
                            <div className="bg-slate-50 p-4 md:p-5 rounded-[2rem] border border-slate-100 group hover:border-emerald-200 transition-all">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center"><ArrowRight className="w-3 h-3 mr-1 text-emerald-500" /> Start Mission</p>
                                <p className="text-2xl md:text-3xl font-black text-indigo-600 font-mono">
                                    {log.checkInTime ? format(log.checkInTime, 'HH:mm') : '--:--'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-300"/> {log.locationName || 'Unspecified'}</p>
                            </div>
                            <div className="bg-slate-50 p-4 md:p-5 rounded-[2rem] border border-slate-100 group hover:border-orange-200 transition-all">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center"><ArrowRight className="w-3 h-3 mr-1 text-orange-500 rotate-180" /> Mission End</p>
                                <p className="text-2xl md:text-3xl font-black text-slate-700 font-mono">
                                    {log.checkOutTime ? format(log.checkOutTime, 'HH:mm') : '--:--'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-300"/> {log.checkOutLocationName || 'Unspecified'}</p>
                            </div>
                        </div>
                    ) : leaveRequest && (
                        <div className="bg-slate-50 p-5 md:p-6 rounded-[2rem] border border-slate-100 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    <span className="text-xs font-bold text-slate-600">Duration</span>
                                </div>
                                <span className="text-xs font-black text-indigo-600">
                                    {format(new Date(leaveRequest.start_date), 'd MMM')} - {format(new Date(leaveRequest.end_date), 'd MMM')}
                                </span>
                            </div>
                            <div className="h-[1px] bg-slate-200 w-full mb-4"></div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-indigo-500" />
                                    <span className="text-xs font-bold text-slate-600">Type</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{leaveRequest.type}</span>
                            </div>
                        </div>
                    )}

                    {/* Employee Leave/Edit Time Reason */}
                    {userReason && (
                        <div className="bg-indigo-900 rounded-[2rem] p-6 text-indigo-100 shadow-2xl relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-16 h-16"/></div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-indigo-400">เหตุผลคำขอ (Employee Reason)</h4>
                            <p className="text-sm font-medium leading-relaxed italic">
                                "{userReason.replace(/\[.*?\]/g, '').trim() || 'ยื่นคำขอโดยไม่มีระบุหมายเหตุเพิ่มเติม'}"
                            </p>
                        </div>
                    )}

                    {/* Admin Rejection Reason */}
                    {adminRejection && (
                        <div className="bg-red-900 rounded-[2rem] p-6 text-red-100 shadow-2xl relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-16 h-16"/></div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-red-300">เหตุผลที่ปฏิเสธ (Admin Rejection Reason)</h4>
                            <p className="text-sm font-semibold leading-relaxed">
                                "{adminRejection}"
                            </p>
                        </div>
                    )}

                    {/* System/Log Additional Note */}
                    {systemLogNote && systemLogNote !== userReason.replace(/\[.*?\]/g, '').trim() && (
                        <div className="bg-slate-900 rounded-[2rem] p-6 text-slate-100 shadow-2xl relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-16 h-16"/></div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-slate-400">บันทึกเพิ่มเติมระบบ (System/Log Note)</h4>
                            <p className="text-sm font-medium leading-relaxed">
                                "{systemLogNote}"
                            </p>
                        </div>
                    )}

                    <div className="flex-grow min-h-0" />

                    <div className="px-6 pt-2 pb-8 sm:pb-10 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] shrink-0">
                        <button 
                            onClick={onClose}
                            className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-semibold text-sm tracking-widest uppercase hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200 shrink-0"
                        >
                            ปิดรายละเอียด
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {showLightbox && (
                    <Lightbox 
                        url={lightboxUrl} 
                        onClose={() => setShowLightbox(false)} 
                    />
                )}
            </AnimatePresence>
        </motion.div>,
        document.body
    );
};

export default TimesheetDetailModal;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ActionFooterProps {
    isSubmitting: boolean;
    onApprove: () => Promise<void>;
    onReject: (reason: string) => Promise<void>;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({
    isSubmitting,
    onApprove,
    onReject
}) => {
    const [isRejectMode, setIsRejectMode] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) return;
        try {
            await onReject(rejectionReason);
            setIsRejectMode(false);
            setRejectionReason('');
        } catch (e) {
            console.error('Failed to submit rejection:', e);
        }
    };

    return (
        <div className="p-3 sm:p-6 bg-slate-50 border-t border-slate-100 shrink-0">
            <AnimatePresence mode="wait">
                {!isRejectMode ? (
                    <motion.div 
                        key="main-actions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-3"
                    >
                        <button
                            type="button"
                            onClick={() => setIsRejectMode(true)}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                            id="reject-trigger-btn"
                        >
                            <XCircle className="w-4 h-4" /> ปฏิเสธคำขอ
                        </button>
                        <button
                            type="button"
                            onClick={onApprove}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-100 cursor-pointer"
                            id="approve-trigger-btn"
                        >
                            <CheckCircle2 className="w-4 h-4" /> {isSubmitting ? 'กำลังอนุมัติ...' : 'อนุมัติคำขอ'}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="reject-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">กรุณาระบุเหตุผลที่ปฏิเสธ</label>
                            <textarea 
                                className="w-full p-4 border-2 border-slate-200 focus:border-red-400 bg-white rounded-2xl text-sm outline-none resize-none transition-all shadow-inner font-medium text-slate-700"
                                rows={3}
                                placeholder="ระบุเหตุผล เช่น ข้อมูลเอกสารไม่ชัดเจน, วันลาโควตาไม่เพียงพอ..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                autoFocus
                                id="rejection-reason-textarea"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setIsRejectMode(false); setRejectionReason(''); }}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
                                id="reject-back-btn"
                            >
                                ย้อนกลับ
                            </button>
                            <button
                                type="button"
                                onClick={handleRejectSubmit}
                                disabled={isSubmitting || !rejectionReason.trim()}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                                id="reject-submit-btn"
                            >
                                {isSubmitting ? 'กำลังปฏิเสธ...' : 'ยืนยันการปฏิเสธ'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default ActionFooter;

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, X, Send, CheckCircle2 } from 'lucide-react';
import { Task } from '../../../types';

interface LogisticsActionModalProps {
    task: Task | null;
    isAdmin: boolean;
    isActionProcessing: boolean;
    onClose: () => void;
    onSendToQC: () => void;
    onAdminQuickPass: (reason: string) => void;
}

const LogisticsActionModal: React.FC<LogisticsActionModalProps> = ({
    task,
    isAdmin,
    isActionProcessing,
    onClose,
    onSendToQC,
    onAdminQuickPass
}) => {
    const [adminPassReason, setAdminPassReason] = useState('');

    if (!task) return null;

    return createPortal(
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                onClick={onClose} 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border-4 border-indigo-50 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center text-lg">
                        <ShieldCheck className="w-6 h-6 mr-2 text-indigo-600" />
                        จัดการงานย่อย
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-2">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Task Title</p>
                        <p className="font-bold text-slate-700">{task.title}</p>
                    </div>

                    <button 
                        onClick={onSendToQC}
                        disabled={isActionProcessing}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" /> ส่งตรวจ (Send to QC)
                    </button>

                    {isAdmin && (
                        <div className="border-t-2 border-dashed border-gray-100 pt-4 mt-4 text-left">
                            <p className="text-[10px] font-black text-green-600 mb-3 flex items-center uppercase tracking-[0.2em]">
                                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Admin Quick Pass
                            </p>
                            <textarea 
                                className="w-full p-4 text-sm border-2 border-gray-200 rounded-2xl mb-3 focus:ring-4 focus:ring-green-500/10 focus:border-green-400 outline-none transition-all resize-none min-h-[80px]"
                                placeholder="ระบุเหตุผลที่อนุมัติด่วน..."
                                value={adminPassReason}
                                onChange={e => setAdminPassReason(e.target.value)}
                            />
                            <button 
                                onClick={() => onAdminQuickPass(adminPassReason)}
                                disabled={isActionProcessing || !adminPassReason.trim()}
                                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                            >
                                <CheckCircle2 className="w-5 h-5" /> อนุมัติทันที
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default LogisticsActionModal;

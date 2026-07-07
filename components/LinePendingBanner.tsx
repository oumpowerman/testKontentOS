import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, X, BellRing, Sparkles } from 'lucide-react';

export const LinePendingBanner: React.FC = () => {
    const [pendingLineUserId, setPendingLineUserId] = useState<string | null>(null);

    const checkPendingId = () => {
        try {
            const stored = sessionStorage.getItem('pending_line_user_id');
            setPendingLineUserId(stored);
        } catch (e) {
            console.error('Failed to read sessionStorage:', e);
        }
    };

    useEffect(() => {
        // Initial check
        checkPendingId();

        // Listen for standard storage events (in case of multi-tabs or same-tab changes)
        const handleStorage = () => checkPendingId();
        window.addEventListener('storage', handleStorage);
        
        // Custom interval fallback to detect same-tab programmatic writes to sessionStorage
        const interval = setInterval(checkPendingId, 1000);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, []);

    const handleCancel = () => {
        try {
            sessionStorage.removeItem('pending_line_user_id');
            setPendingLineUserId(null);
        } catch (e) {
            console.error('Failed to remove sessionStorage item:', e);
        }
    };

    if (!pendingLineUserId) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg border-b border-indigo-500/30 relative z-[9999]"
                id="line-pending-linking-banner"
            >
                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="bg-white/10 p-2 rounded-xl border border-white/20 animate-pulse">
                            <Link2 className="w-5 h-5 text-indigo-200" />
                        </div>
                        <div className="text-sm">
                            <span className="font-bold flex items-center gap-1 text-indigo-100">
                                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> 
                                ตรวจพบคำขอเชื่อมต่อบัญชี LINE อัตโนมัติ
                            </span>
                            <p className="text-white/90 font-medium text-xs sm:text-sm mt-0.5">
                                กรุณา <strong className="text-amber-300">เข้าสู่ระบบ</strong> หรือ <strong className="text-pink-300">สมัครสมาชิก</strong> เพื่อผูก ID LINE <code className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-xs text-white select-all">{pendingLineUserId}</code> เข้ากับโปรไฟล์ Juijui Planner ของคุณ
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:flex items-center gap-1.5 bg-black/10 px-2.5 py-1 rounded-lg border border-white/5 text-[11px] text-indigo-100">
                            <BellRing className="w-3.5 h-3.5 text-indigo-300" />
                            รับใบเตือนและแจ้งสิทธิ์ลาตรงถึง LINE
                        </div>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/10 transition-all active:scale-95 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                            ยกเลิกเชื่อมต่อ
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LinePendingBanner;

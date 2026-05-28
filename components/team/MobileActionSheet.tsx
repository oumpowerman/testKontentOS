import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ShoppingBag, Settings } from 'lucide-react';

interface MobileActionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenRandomizer?: () => void;
    onOpenReport?: () => void;
    isShopOpen: boolean;
    toggleShop: () => void;
    isAdmin: boolean;
    onManageClick?: () => void;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
    isOpen,
    onClose,
    onOpenRandomizer,
    onOpenReport,
    isShopOpen,
    toggleShop,
    isAdmin,
    onManageClick
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with elegant blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[9998] md:hidden"
                        id="mobile-action-sheet-backdrop"
                    />

                    {/* Slide-up Container */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="fixed bottom-0 inset-x-0 bg-white rounded-t-[2.2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.15)] z-[9999] md:hidden border-t border-gray-100 flex flex-col max-h-[82vh] overflow-hidden"
                        id="mobile-action-sheet-container"
                    >
                        {/* Drag Handle or Indicator */}
                        <div className="py-3.5 shrink-0 flex justify-center">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                        </div>

                        {/* Header (Sticky / Non-scrollable) */}
                        <div className="px-6 pb-4 flex justify-between items-center border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-1.5" id="mobile-action-sheet-title">
                                    เมนูควบคุมระบบทีม
                                </h2>
                                <p className="text-xs text-gray-500 font-semibold mt-0.5">เข้าถึงฟีเจอร์อื่นๆ อย่างสะดวกรวดเร็ว</p>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors border border-gray-200/40"
                                id="mobile-action-sheet-close-btn"
                            >
                                <X className="w-4.5 h-4.5" />
                            </motion.button>
                        </div>

                        {/* Action List (Optimized Scrollable Area) */}
                        <div className="flex-1 overflow-y-auto p-6 pb-16 flex flex-col gap-3.5 no-scrollbar">
                            {/* Randomizer Action */}
                            {onOpenRandomizer && (
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        onClose();
                                        onOpenRandomizer();
                                    }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-pink-500/5 to-rose-500/5 hover:from-pink-500/10 hover:to-rose-500/10 border border-pink-100/60 text-left transition-all active:scale-95 w-full"
                                    id="mobile-action-randomizer-btn"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                                        🎲
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">สุ่มผู้โชคดี</p>
                                        <p className="text-xs text-pink-600 font-medium mt-0.5">เลือกเกลอมาทำงานในแบบสุ่มสนุกๆ</p>
                                    </div>
                                </motion.button>
                            )}

                            {/* Report Action */}
                            {onOpenReport && (
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        onClose();
                                        onOpenReport();
                                    }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-red-500/5 to-orange-500/5 hover:from-red-500/10 hover:to-orange-500/10 border border-red-100/60 text-left transition-all active:scale-95 w-full"
                                    id="mobile-action-report-btn"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">ฟ้อง/แจ้งเหตุ</p>
                                        <p className="text-xs text-red-600 font-medium mt-0.5">ส่งคำร้อง ฟ้องพฤติกรรม แจ้งปัญหางานสะดุด</p>
                                    </div>
                                </motion.button>
                            )}

                            {/* Shop Action */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    onClose();
                                    toggleShop();
                                }}
                                className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-95 border w-full ${isShopOpen ? 'bg-indigo-50 border-indigo-200' : 'bg-gradient-to-br from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 border-indigo-100/60'}`}
                                id="mobile-action-shop-btn"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md shrink-0 ${isShopOpen ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white'}`}>
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">{isShopOpen ? 'ปิดหน้าร้านค้า' : 'เปิดหน้าร้านค้า'}</p>
                                    <p className="text-xs text-indigo-600 font-medium mt-0.5">แลกของรางวัล แกล้งเพื่อน หรือซื้อบัฟเพิ่มเติม</p>
                                </div>
                            </motion.button>

                            {/* Settings/Manage Action (Admin Only) */}
                            {isAdmin && onManageClick && (
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        onClose();
                                        onManageClick();
                                    }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-gray-500/5 to-slate-500/5 hover:from-gray-500/10 hover:to-slate-500/10 border border-gray-200 text-left transition-all active:scale-95 w-full"
                                    id="mobile-action-manage-btn"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 text-white flex items-center justify-center shadow-md shrink-0">
                                        <Settings className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">จัดการสมาชิกทีม (Admin)</p>
                                        <p className="text-xs text-slate-600 font-medium mt-0.5">กำหนดบทบาท เครดิต และข้อมูลผู้ใช้งาน</p>
                                    </div>
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';

interface ImageWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onUseDrive: () => void;
}

const ImageWarningModal: React.FC<ImageWarningModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    onUseDrive
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 wrongs-layer z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop with elegant blur */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    
                    {/* Glassmorphic Container Card */}
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="bg-white/95 backdrop-blur-xl border border-slate-200/80 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center text-center relative z-10 overflow-hidden"
                    >
                        {/* Animated glowing decorative circle */}
                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center relative mb-6 shadow-inner">
                            <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
                            <div className="absolute inset-0 bg-amber-400/10 rounded-full animate-ping scale-110 -z-10" />
                        </div>

                        {/* Heading */}
                        <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2 font-sans">
                            ⚠️ แนะนำให้แนบรูปภาพโดยใช้ Google Drive
                        </h3>
                        
                        {/* Description */}
                        <p className="text-xs text-slate-500 mt-3 leading-relaxed max-w-md font-sans">
                            การทำงานโดยฝังรูปภาพเต็มแบบข้อความ <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-indigo-600">Base64</span> ที่มีขนาดข้อมูลสูงลงในบทการถ่ายทำโดยตรง จะทำให้ปริมาณรวมของแผ่นงานมีขนาดใหญ่มาก ส่งผลให้ระบบบันทึก ซิงก์ข้อมูล และความเร็วขณะเขียนแก้ไขร่วมกับผู้อื่นทำงานช้าลง
                        </p>

                        <div className="w-full h-px bg-slate-100 my-6" />

                        {/* Choices / Actions Column */}
                        <div className="flex flex-col gap-3 w-full font-sans">
                            {/* Drive Upload Button (Primary Action) */}
                            <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onUseDrive}
                                className="w-full py-4 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
                            >
                                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                                <span>อัปโหลดเข้า Google Drive หรือแนบลิงก์ (แนะนำ ⚡)</span>
                                <ChevronRight className="w-4 h-4 text-white/70" />
                            </motion.button>

                            {/* Direct Embed / Skip Option (Secondary Action) */}
                            <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                className="w-full py-4 px-5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-2xl font-bold text-xs cursor-pointer transition-all border border-slate-200/40"
                            >
                                เข้าใจแล้ว ฝังรูปดั้งเดิมแบบข้อความพรีวิวต่อไป (Embed Base64)
                            </motion.button>

                            {/* Dismiss button */}
                            <button
                                onClick={onClose}
                                className="pt-2 text-slate-400 hover:text-slate-600 font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                ยกเลิกการเพิ่มรูปภาพ
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ImageWarningModal;

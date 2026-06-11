import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Siren, HelpCircle, LayoutTemplate, CheckSquare, AlertTriangle, Clock, Calendar } from 'lucide-react';

interface UrgentTasksHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UrgentTasksHelpModal: React.FC<UrgentTasksHelpModalProps> = ({ isOpen, onClose }) => {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="urgent-tasks-help-modal">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.4 }}
                        className="relative bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-[1.5rem] sm:rounded-[2rem] border border-white/80 shadow-2xl overflow-hidden z-[60] flex flex-col max-h-[90vh] sm:max-h-[85vh]"
                    >
                        {/* Header decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/40 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-100/40 rounded-full blur-2xl pointer-events-none" />

                        {/* Top bar with close button */}
                        <div className="flex justify-between items-center px-4 pt-4 pb-2 sm:px-6 sm:pt-6 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                                    <HelpCircle className="w-5 h-5" />
                                </span>
                                <h3 className="font-black text-lg sm:text-xl text-slate-800 tracking-tight">ทำความรู้จัก "งานด่วน"</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-all cursor-pointer border border-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body content */}
                        <div className="flex-1 overflow-y-auto px-4 pb-5 pt-2 sm:px-6 sm:pb-6 space-y-4 sm:space-y-5 relative z-10 scrollbar-thin">
                            
                            {/* Summary alert banner */}
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-4 rounded-2xl flex gap-3">
                                <Siren className="w-8 h-8 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                                <div className="text-sm">
                                    <h4 className="font-black text-red-800 tracking-tight">สูตรคำนวณลำดับความด่วน</h4>
                                    <p className="text-red-700/80 font-bold mt-0.5 leading-relaxed">
                                        ระบบจะดึงเฉพาะ <strong className="text-red-900 font-extrabold">"งานที่ยังทำไม่เสร็จ"</strong> 
                                        แล้วเรียงลำดับความเร่งด่วนตามเงื่อนไข:
                                    </p>
                                    <div className="mt-2 text-xs font-bold text-red-700/80 space-y-1">
                                        <div>1. 🔴 งานเลยกำหนดส่ง (Overdue) ต้องรีบจัดการทันที</div>
                                        <div>2. ⚡ งานที่มีความสำคัญเร่งด่วนสูงสุด (Urgent Priority)</div>
                                        <div>3. 📅 เรียงตามวันที่ใกล้ส่งที่สุด (ใกล้มาก่อน-ไกลมาหลัง)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bullet explanation of Card designs */}
                            <div className="space-y-4">
                                <h4 className="font-black text-sm uppercase tracking-widest text-indigo-600">สัญลักษณ์สีแถบด้านข้าง (Visual Indicators)</h4>
                                
                                <div className="grid grid-cols-1 gap-2.5">
                                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-3 h-8 bg-red-500 rounded-full animate-pulse shrink-0" />
                                        <div className="text-xs">
                                            <p className="font-extrabold text-slate-800 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> เลยกำหนดส่ง (Overdue)
                                            </p>
                                            <p className="text-slate-500 font-medium mt-0.5">แถบสีแดงกระพริบเมื่อค้างส่งเกิน 7 วัน</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-3 h-8 bg-orange-400 rounded-full shrink-0" />
                                        <div className="text-xs">
                                            <p className="font-extrabold text-slate-800 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-orange-500" /> กำหนดส่งวันนี้ (Due Today)
                                            </p>
                                            <p className="text-slate-500 font-medium mt-0.5">แถบสีส้มบ่งบอกว่าต้องส่งภายในวันนี้</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-3 h-8 bg-slate-300 rounded-full shrink-0" />
                                        <div className="text-xs">
                                            <p className="font-extrabold text-slate-800 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-500" /> กำหนดเร่งด่วนถัดไป (Soon)
                                            </p>
                                            <p className="text-slate-500 font-medium mt-0.5">กำหนดส่งใน 2 วันข้างหน้า สีแถบสีเทาเรียบง่าย</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Explanation of the new design swapping */}
                            <div className="space-y-3.5">
                                <h4 className="font-black text-sm uppercase tracking-widest text-purple-600">การแสดงสัญญลักษณ์หลัก (New Update!)</h4>
                                
                                <div className="space-y-2 text-xs font-bold text-slate-600">
                                    <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100/50 flex gap-3">
                                        <LayoutTemplate className="w-5 h-5 text-purple-500 shrink-0" />
                                        <div>
                                            <p className="font-extrabold text-purple-950">คอนเทนต์ลงสื่อ (Content)</p>
                                            <p className="text-purple-900/70 font-semibold mt-1 leading-relaxed">
                                                เปลี่ยนมาใช้ <strong className="text-purple-950 font-black">โลโก้ช่องทางสื่อออนไลน์ (Channel Logo)</strong> เป็นภาพหลัก 
                                                เพื่อความชัดเจนเพราะหนึ่งชิ้นงานมีทีมทำงานร่วมกันหลายคน (พร้อมแสดงรูปผู้รับผิดชอบเป็นวงกลมเล็กซ้อนมุมขวา)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-3">
                                        <CheckSquare className="w-5 h-5 text-blue-500 shrink-0" />
                                        <div>
                                            <p className="font-extrabold text-blue-950">งานทั่วไป (General Task)</p>
                                            <p className="text-blue-900/70 font-semibold mt-1 leading-relaxed">
                                                แสดง <strong className="text-blue-950 font-black">โปรไฟล์ผู้รับผิดชอบงาน (Assignee)</strong> คู่กับโลโก้ช่องแบรนด์ขนาดกะทัดรัด 
                                                เนื่องจากงานทั่วไปเป็นงานเดี่ยวที่มีโอกาสสืบค้นผู้ดูแลเดี่ยวได้ง่าย
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

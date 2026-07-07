import React, { useState, useEffect } from 'react';
import { Settings, Clock, Unlock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import TimePickerModal from '../../../ui/TimePickerModal';

interface AdminOtAdjustmentProps {
    editStartTime: string;
    setEditStartTime: (val: string) => void;
    editEndTime: string;
    setEditEndTime: (val: string) => void;
    editOtHours: string;
    setEditOtHours: (val: string) => void;
    adminNote: string;
    setAdminNote: (val: string) => void;
    originalStartTime?: string;
    originalEndTime?: string;
    originalOtHours?: string;
}

export const AdminOtAdjustment: React.FC<AdminOtAdjustmentProps> = ({
    editStartTime,
    setEditStartTime,
    editEndTime,
    setEditEndTime,
    editOtHours,
    setEditOtHours,
    adminNote,
    setAdminNote,
    originalStartTime = '',
    originalEndTime = '',
    originalOtHours = ''
}) => {
    const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
    const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);
    
    // Lock & Edit States
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // Store original values so we can revert if locked back
    const [originalValues, setOriginalValues] = useState({
        start: '',
        end: '',
        hours: '',
        note: ''
    });

    // Capture initial values on mount or whenever a new request is loaded
    useEffect(() => {
        if (!isUnlocked) {
            setOriginalValues({
                start: editStartTime,
                end: editEndTime,
                hours: editOtHours,
                note: adminNote
            });
        }
    }, [editStartTime, editEndTime, editOtHours, isUnlocked]);

    const calculateHoursFromTimes = (start: string, end: string): string => {
        if (!start || !end) return '';
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (diffMinutes < 0) {
            // Over midnight
            diffMinutes += 24 * 60;
        }
        
        const hours = diffMinutes / 60;
        return parseFloat(hours.toFixed(2)).toString();
    };

    const handleStartTimeSelect = (val: string) => {
        setEditStartTime(val);
        const autoHours = calculateHoursFromTimes(val, editEndTime);
        if (autoHours) {
            setEditOtHours(autoHours);
        }
    };

    const handleEndTimeSelect = (val: string) => {
        setEditEndTime(val);
        const autoHours = calculateHoursFromTimes(editStartTime, val);
        if (autoHours) {
            setEditOtHours(autoHours);
        }
    };

    const handleLockBack = () => {
        // Revert to original values
        setEditStartTime(originalValues.start);
        setEditEndTime(originalValues.end);
        setEditOtHours(originalValues.hours);
        setAdminNote(originalValues.note);
        setIsUnlocked(false);
        setShowConfirm(false);
    };

    const handleUnlockConfirm = () => {
        // Capture exact snapshot before unlocking
        setOriginalValues({
            start: editStartTime,
            end: editEndTime,
            hours: editOtHours,
            note: adminNote
        });
        setIsUnlocked(true);
        setShowConfirm(false);
    };

    // Check if values have been modified relative to employee's original submitted values
    const isTimeModified = (editStartTime && originalStartTime && editStartTime !== originalStartTime) || 
                          (editEndTime && originalEndTime && editEndTime !== originalEndTime);
    const isHoursModified = editOtHours && originalOtHours && editOtHours !== originalOtHours;
    const isModified = isTimeModified || isHoursModified;

    // Calculate hours diff
    let hoursDiffText = '';
    let hoursDiffStyle = '';
    if (isHoursModified) {
        const orig = parseFloat(originalOtHours || '0') || 0;
        const curr = parseFloat(editOtHours || '0') || 0;
        const diff = curr - orig;
        if (diff > 0) {
            hoursDiffText = `(เพิ่มขึ้น ${diff.toFixed(1)} ชม.)`;
            hoursDiffStyle = 'text-emerald-600';
        } else if (diff < 0) {
            hoursDiffText = `(ลดลง ${Math.abs(diff).toFixed(1)} ชม.)`;
            hoursDiffStyle = 'text-rose-600';
        }
    }

    return (
        <div className="bg-indigo-50/50 p-5 rounded-2xl border-2 border-dashed border-indigo-200 space-y-4 shadow-sm animate-fade-in relative">
            
            {/* 1. Header showing states with Compact/Minimal Toggle buttons */}
            <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    {isUnlocked ? (
                        <span>📂 กำลังปรับปรุงข้อมูล (โหมดแอดมิน)</span>
                    ) : (
                        <span>🔒 เวลา OT ยื่นโดยพนักงาน</span>
                    )}
                </h4>
                
                {!isUnlocked ? (
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="py-1 px-2.5 bg-indigo-100 hover:bg-indigo-200 active:scale-95 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        id="ot-unlock-trigger-btn"
                    >
                        <Unlock className="w-3 h-3" />
                        <span>ปรับปรุงเวลา</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleLockBack}
                        className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        id="ot-lock-back-btn"
                    >
                        <span>🔒 ล็อกข้อมูลตามเดิม</span>
                    </button>
                )}
            </div>

            {/* 2. Global Confirmation Portal Dialog overlay with blur */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        {/* Backdrop with Blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirm(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        
                        {/* Dialog Box */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] border border-slate-100 shadow-2xl p-6 relative z-10 space-y-4"
                        >
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-1 text-amber-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-base font-extrabold text-slate-800">⚠️ ยืนยันการปรับปรุงเวลาปฏิบัติงาน</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    การปรับปรุงเวลาและชั่วโมงปฏิบัติงานในขั้นตอนนี้ จะมีผลโดยตรงต่อการคำนวณเงินหรือสถิติ และระบบจะทำการส่งข้อความแจ้งเตือนที่ปรับปรุงใหม่นี้ไปยังผู้ขอ OT ทันทีเมื่อได้รับการอนุมัติ
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2.5 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-100 active:scale-95"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUnlockConfirm}
                                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                    ยืนยันการแก้ไข
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 3. Read-Only displays vs Editable form fields */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">เวลาเริ่มปฏิบัติงาน</label>
                    {isUnlocked ? (
                        <button 
                            type="button"
                            onClick={() => setIsStartTimeOpen(true)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 border-2 border-slate-200 hover:border-indigo-400 bg-white rounded-xl text-sm font-bold text-slate-700 transition-all outline-none cursor-pointer shadow-sm text-left"
                            id="ot-start-time-btn"
                        >
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{editStartTime || 'เลือกเวลาเริ่ม'}</span>
                        </button>
                    ) : (
                        <div className="w-full flex items-center gap-2.5 px-4 py-2.5 border-2 border-slate-100 bg-slate-50/75 text-slate-500 rounded-xl text-sm font-semibold shadow-inner select-none cursor-not-allowed">
                            <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="truncate">{editStartTime || '-'}</span>
                        </div>
                    )}
                </div>
                <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">เวลาสิ้นสุดปฏิบัติงาน</label>
                    {isUnlocked ? (
                        <button 
                            type="button"
                            onClick={() => setIsEndTimeOpen(true)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 border-2 border-slate-200 hover:border-indigo-400 bg-white rounded-xl text-sm font-bold text-slate-700 transition-all outline-none cursor-pointer shadow-sm text-left"
                            id="ot-end-time-btn"
                        >
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{editEndTime || 'เลือกเวลาสิ้นสุด'}</span>
                        </button>
                    ) : (
                        <div className="w-full flex items-center gap-2.5 px-4 py-2.5 border-2 border-slate-100 bg-slate-50/75 text-slate-500 rounded-xl text-sm font-semibold shadow-inner select-none cursor-not-allowed">
                            <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="truncate">{editEndTime || '-'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">จำนวนชั่วโมง OT จริง (ชั่วโมง)</label>
                {isUnlocked ? (
                    <input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max="24"
                        placeholder="ตัวอย่างเช่น 1.5, 2.5, 3"
                        value={editOtHours}
                        onChange={(e) => setEditOtHours(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 bg-white rounded-xl text-sm outline-none transition-all font-bold text-indigo-600 shadow-sm"
                        id="ot-hours-input"
                    />
                ) : (
                    <div className="w-full px-4 py-2.5 border-2 border-slate-100 bg-slate-50/75 text-slate-500 rounded-xl text-sm font-bold shadow-inner select-none cursor-not-allowed">
                        <span className="text-indigo-600/80">{editOtHours || '-'} ชั่วโมง</span>
                    </div>
                )}
                {isUnlocked && (
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                        *ระบบคำนวณชั่วโมงให้อัตโนมัติเมื่อเลือกเวลาเริ่ม/สิ้นสุด แต่แอดมินยังแก้ไขเองเพื่อปัดเศษได้
                    </p>
                )}
            </div>

            <div className="pt-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    บันทึกหรือเหตุผลการแก้ไข/อนุมัติ (แสดงในประวัติและแจ้งเตือนพนักงาน)
                </label>
                {isUnlocked ? (
                    <textarea 
                        rows={2}
                        placeholder="ระบุเหตุผลในการแก้ไขหรือบันทึกเพิ่มเติมเพื่อให้พนักงานทราบ เช่น มีการปรับแก้เวลาตามบันทึกสแกนนิ้วมือ..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 bg-white rounded-xl text-sm outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 leading-relaxed resize-none shadow-sm"
                        id="admin-note-textarea"
                    />
                ) : (
                    <div className="w-full px-4 py-3 border-2 border-slate-100 bg-slate-50/75 text-slate-400 rounded-xl text-xs font-medium min-h-[50px] shadow-inner select-none cursor-not-allowed italic">
                        {adminNote || 'ไม่มีบันทึกเพิ่มเติม (คลิก "ปรับปรุงเวลา" ด้านบนเพื่อเพิ่มข้อความ)'}
                    </div>
                )}
            </div>

            {/* 4. Real-Time OT Adjustment Diff Visualizer */}
            {isUnlocked && (
                <div className="bg-white border border-indigo-100/60 rounded-xl p-3.5 space-y-2.5 shadow-sm animate-fade-in">
                    {!isModified ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-50/50 py-1.5 px-2.5 rounded-lg border border-emerald-100/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>✓ ข้อมูลตรงตามที่พนักงานยื่นขอ</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">เปรียบเทียบข้อมูลก่อน-หลังแก้ไข (Live Diff)</span>
                            
                            <div className="space-y-1.5 divide-y divide-slate-50">
                                {isTimeModified && (
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <span className="text-slate-500 font-medium">เวลาปฏิบัติงาน:</span>
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <span className="text-slate-400 text-[11px]">{originalStartTime || '-'} - {originalEndTime || '-'} (เดิม)</span>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                            <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md text-[11px]">{editStartTime || '-'} - {editEndTime || '-'}</span>
                                        </div>
                                    </div>
                                )}
                                
                                {isHoursModified && (
                                    <div className="flex items-center justify-between text-xs pt-1.5">
                                        <span className="text-slate-500 font-medium">จำนวนชั่วโมงอนุมัติ:</span>
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <span className="text-slate-400 text-[11px]">{originalOtHours || '0'} ชม. (เดิม)</span>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                            <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md text-[11px]">{editOtHours || '0'} ชม.</span>
                                            {hoursDiffText && (
                                                <span className={`${hoursDiffStyle} text-[10px] font-extrabold`}>{hoursDiffText}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TimePickerModals embedded in Admin Panel */}
            {isUnlocked && (
                <>
                    <TimePickerModal 
                        isOpen={isStartTimeOpen}
                        onClose={() => setIsStartTimeOpen(false)}
                        onSelect={handleStartTimeSelect}
                        initialTime={editStartTime || '18:00'}
                        title="เลือกเวลาเริ่มปฏิบัติงาน OT"
                    />
                    <TimePickerModal 
                        isOpen={isEndTimeOpen}
                        onClose={() => setIsEndTimeOpen(false)}
                        onSelect={handleEndTimeSelect}
                        initialTime={editEndTime || '21:30'}
                        title="เลือกเวลาสิ้นสุดปฏิบัติงาน OT"
                    />
                </>
            )}
        </div>
    );
};

export default AdminOtAdjustment;

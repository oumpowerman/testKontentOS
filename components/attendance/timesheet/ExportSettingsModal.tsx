import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Eye, Download, Check, Monitor, Smartphone } from 'lucide-react';
import { createPortal } from 'react-dom';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';

import { useExportState } from './hooks/useExportState';
import { generateAndDownloadCSV } from './utils/csvGenerator';
import ExportConfigPanel from './components/ExportConfigPanel';
import SpreadsheetPreview from './components/SpreadsheetPreview';

interface ExportSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dateRange: Date[];
    filteredAndGroupedUsers: Record<string, User[]>;
    logs: AttendanceLog[];
    leaveRequests: any[];
    getEffectiveDayStatus: (date: Date) => { status: 'WORK_DAY' | 'WEEKEND' | 'HOLIDAY'; source: string; desc: string };
    workConfig: { startTime: string; buffer: number };
    viewMode: 'WEEK' | 'MONTH';
    onExportSuccess?: (filename: string) => void;
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { duration: 0.3 }
    },
    exit: { 
        opacity: 0,
        transition: { duration: 0.25 }
    }
};

const modalVariants = {
    hidden: { scale: 0.95, opacity: 0, y: 40 },
    visible: { 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 28 }
    },
    exit: { 
        scale: 0.95, 
        opacity: 0, 
        y: 40, 
        transition: { duration: 0.25, ease: "easeInOut" as const } 
    }
};

const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({
    isOpen,
    onClose,
    dateRange,
    filteredAndGroupedUsers,
    logs,
    leaveRequests,
    getEffectiveDayStatus,
    workConfig,
    viewMode,
    onExportSuccess
}) => {
    const {
        cellFormat,
        setCellFormat,
        showWorkedDays,
        setShowWorkedDays,
        showLateDays,
        setShowLateDays,
        showLeaveDays,
        setShowLeaveDays,
        showEmail,
        setShowEmail,
        holidayFormat,
        setHolidayFormat,
        activeTab,
        setActiveTab,
        configOptions
    } = useExportState();

    const [isExported, setIsExported] = useState(false);
    const [exportedFilename, setExportedFilename] = useState('');

    // Reset status when the modal is opened
    React.useEffect(() => {
        if (isOpen) {
            setIsExported(false);
            setExportedFilename('');
        }
    }, [isOpen]);

    const handleDownload = () => {
        const filename = generateAndDownloadCSV(
            dateRange,
            filteredAndGroupedUsers,
            logs,
            leaveRequests,
            getEffectiveDayStatus,
            workConfig,
            configOptions,
            viewMode
        );
        
        setExportedFilename(filename);
        setIsExported(true);
        if (onExportSuccess) {
            onExportSuccess(filename);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={backdropVariants}
                    onClick={onClose}
                >
                    <motion.div 
                        className="bg-white rounded-[32px] shadow-2xl border border-slate-100 md:max-w-5xl md:w-full md:h-[85vh] md:max-h-[720px] w-full max-h-[92vh] flex flex-col overflow-hidden"
                        variants={modalVariants}
                        onClick={e => e.stopPropagation()}
                    >
                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                            {isExported ? (
                                <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                            ) : (
                                <Settings className="w-5 h-5 animate-spin-slow text-emerald-600" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                {isExported ? 'ส่งออกรายงาน Timesheet สำเร็จ 🎉' : 'ตั้งค่าส่งออกรายงาน Timesheet'}
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold uppercase tracking-wider">{viewMode}</span>
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                {isExported ? 'ไฟล์รายงานถูกเตรียมและเริ่มดาวน์โหลดโดยระบบเรียบร้อยแล้ว' : 'จัดระเบียบตารางและรูปแบบข้อมูลให้พร้อมสำหรับการอัปโหลดเข้าโปรแกรม Payroll'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {!isExported ? (
                        <motion.div 
                            key="setup-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            {/* Tab Switcher for Mobile */}
                            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 md:hidden shrink-0">
                                <button 
                                    onClick={() => setActiveTab('settings')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        activeTab === 'settings' 
                                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>⚙️ ตั้งค่า (Settings)</span>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('preview')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        activeTab === 'preview' 
                                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>📊 ตารางจำลอง (Preview)</span>
                                </button>
                            </div>

                            {/* Main Content Body */}
                            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 bg-slate-50/10">
                                {/* Left Column: Settings Controllers */}
                                <div className={`md:col-span-5 ${activeTab === 'settings' ? 'block' : 'hidden md:block'}`}>
                                    <ExportConfigPanel 
                                        cellFormat={cellFormat}
                                        setCellFormat={setCellFormat}
                                        showWorkedDays={showWorkedDays}
                                        setShowWorkedDays={setShowWorkedDays}
                                        showLateDays={showLateDays}
                                        setShowLateDays={setShowLateDays}
                                        showLeaveDays={showLeaveDays}
                                        setShowLeaveDays={setShowLeaveDays}
                                        showEmail={showEmail}
                                        setShowEmail={setShowEmail}
                                        holidayFormat={holidayFormat}
                                        setHolidayFormat={setHolidayFormat}
                                        onTriggerDownload={handleDownload}
                                        onClose={onClose}
                                    />
                                </div>

                                {/* Right Column: Google Sheets Spreadsheet Visual Preview */}
                                <div className={`md:col-span-7 ${activeTab === 'preview' ? 'block' : 'hidden md:block'}`}>
                                    <SpreadsheetPreview 
                                        cellFormat={cellFormat}
                                        showWorkedDays={showWorkedDays}
                                        showLateDays={showLateDays}
                                        showLeaveDays={showLeaveDays}
                                        showEmail={showEmail}
                                        holidayFormat={holidayFormat}
                                    />
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                <button 
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    onClick={handleDownload}
                                    className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium tracking-wider transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-emerald-600/15"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>เริ่มสร้างและดาวน์โหลดไฟล์รายงาน CSV</span>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="success-view"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-center items-center min-h-[400px] bg-white text-center"
                        >
                            <div className="max-w-2xl w-full mx-auto space-y-7">
                                {/* Success Icon Animation */}
                                <div className="flex flex-col items-center">
                                    <motion.div 
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                        className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-xl shadow-emerald-500/10 mb-4"
                                    >
                                        <Check className="w-10 h-10 stroke-[3]" />
                                    </motion.div>
                                    <h4 className="text-xl font-bold text-slate-800">ส่งออกข้อมูลเสร็จสมบูรณ์แล้ว! 📥</h4>
                                    <p className="text-xs text-slate-500 font-semibold mt-1">ไฟล์ดาวน์โหลดจะแสดงในแถบเมนูดาวน์โหลดของเบราว์เซอร์คุณโดยอัตโนมัติ</p>
                                </div>

                                {/* File Details Card (Glassmorphic look) */}
                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-5 flex items-center gap-4 text-left shadow-sm">
                                    <div className="p-3.5 bg-white rounded-2xl border border-emerald-100/80 text-emerald-600 shrink-0 shadow-sm">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">ชื่อไฟล์ที่ดาวน์โหลดล่าสุด</p>
                                        <p className="text-xs font-bold text-slate-700 truncate mt-0.5 select-all" title={exportedFilename}>
                                            {exportedFilename || 'timesheet_report.csv'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-slate-400 mt-1">ประเภทไฟล์: CSV Spreadsheet • รูปแบบตาราง {viewMode === 'WEEK' ? 'รายสัปดาห์ (Weekly)' : 'รายเดือน (Monthly)'}</p>
                                    </div>
                                </div>

                                {/* Browser Download Guide Map */}
                                <div className="space-y-3.5 text-left">
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">💡 แนะนำวิธีเปิดและตรวจสอบไฟล์ดาวน์โหลดของคุณ:</h5>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Desktop Guide */}
                                        <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex gap-3.5">
                                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl border border-indigo-100 shrink-0 h-10 w-10 flex items-center justify-center">
                                                <Monitor className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700">สำหรับหน้าต่างคอมพิวเตอร์</p>
                                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                                    ตรวจสอบในโฟลเดอร์ <strong className="text-indigo-600 font-bold">"Downloads"</strong> ในเครื่องของคุณ หรือกดปุ่มลัด <strong className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1 py-0.5 rounded text-[10px] font-bold">Ctrl + J</strong> (สำหรับ Windows/Linux) หรือ <strong className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1 py-0.5 rounded text-[10px] font-bold">Cmd + Option + L</strong> (บน Mac)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mobile Guide */}
                                        <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex gap-3.5">
                                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl border border-indigo-100 shrink-0 h-10 w-10 flex items-center justify-center">
                                                <Smartphone className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700">สำหรับมือถือ / แท็บเล็ต</p>
                                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                                    ไฟล์จะถูกเปิดดูหรือบันทึกไว้ในแอปพลิเคชันหลักของเครื่องทันที เช่น แอป <strong className="text-indigo-600 font-bold">"ไฟล์" (Files)</strong> บน iOS หรือโฟลเดอร์ดาวน์โหลดบน Android
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action button to close */}
                                <div className="pt-2 border-t border-slate-100/80 flex justify-end">
                                    <button 
                                        onClick={onClose}
                                        className="px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-slate-900/10"
                                    >
                                        ตกลง, รับทราบ 👌
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ExportSettingsModal;

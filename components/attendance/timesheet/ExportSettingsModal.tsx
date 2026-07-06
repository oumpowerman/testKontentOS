import React from 'react';
import { motion } from 'framer-motion';
import { X, Settings, Eye, Download } from 'lucide-react';
import { createPortal } from 'react-dom';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';

import { useExportState } from './hooks/useExportState';
import { generateAndDownloadCSV } from './utils/csvGenerator';
import ExportConfigPanel from './components/ExportConfigPanel';
import SpreadsheetPreview from './components/SpreadsheetPreview';

interface ExportSettingsModalProps {
    onClose: () => void;
    dateRange: Date[];
    filteredAndGroupedUsers: Record<string, User[]>;
    logs: AttendanceLog[];
    leaveRequests: any[];
    getEffectiveDayStatus: (date: Date) => { status: 'WORK_DAY' | 'WEEKEND' | 'HOLIDAY'; source: string; desc: string };
    workConfig: { startTime: string; buffer: number };
    viewMode: 'WEEK' | 'MONTH';
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: { scale: 0.98, opacity: 0, y: 15 },
    visible: { 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transition: { type: "spring" as const, damping: 28, stiffness: 320 }
    },
    exit: { scale: 0.98, opacity: 0, y: 10, transition: { duration: 0.15 } }
};

const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({
    onClose,
    dateRange,
    filteredAndGroupedUsers,
    logs,
    leaveRequests,
    getEffectiveDayStatus,
    workConfig,
    viewMode
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

    const handleDownload = () => {
        generateAndDownloadCSV(
            dateRange,
            filteredAndGroupedUsers,
            logs,
            leaveRequests,
            getEffectiveDayStatus,
            workConfig,
            configOptions,
            viewMode
        );
        onClose();
    };

    return createPortal(
        <motion.div 
            className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            onClick={onClose}
        >
            <motion.div 
                className="bg-white rounded-[32px] shadow-2xl border border-slate-100 max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden"
                variants={modalVariants}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                            <Settings className="w-5 h-5 animate-spin-slow text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                ตั้งค่าส่งออกรายงาน Timesheet
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold uppercase tracking-wider">{viewMode}</span>
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">จัดระเบียบตารางและรูปแบบข้อมูลให้พร้อมสำหรับการอัปโหลดเข้าโปรแกรม Payroll</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

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
                        className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-emerald-600/15"
                    >
                        <Download className="w-4 h-4" />
                        <span>เริ่มสร้างและดาวน์โหลดไฟล์รายงาน CSV</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default ExportSettingsModal;

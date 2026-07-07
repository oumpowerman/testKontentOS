import React from 'react';
import { 
    FileText, Layout, UserCheck, Clock, Calendar, Mail, Sparkles, Download
} from 'lucide-react';
import { ExportConfigOptions } from '../utils/csvGenerator';

interface ExportConfigPanelProps {
    cellFormat: 'detailed' | 'summary';
    setCellFormat: (format: 'detailed' | 'summary') => void;
    showWorkedDays: boolean;
    setShowWorkedDays: (show: boolean) => void;
    showLateDays: boolean;
    setShowLateDays: (show: boolean) => void;
    showLeaveDays: boolean;
    setShowLeaveDays: (show: boolean) => void;
    showEmail: boolean;
    setShowEmail: (show: boolean) => void;
    holidayFormat: 'text' | 'blank';
    setHolidayFormat: (format: 'text' | 'blank') => void;
    onTriggerDownload: () => void;
    onClose: () => void;
}

const ExportConfigPanel: React.FC<ExportConfigPanelProps> = ({
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
    onTriggerDownload,
    onClose
}) => {
    return (
        <div className="space-y-5">
            {/* Section 1: Workday Format (Segmented Control) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">รูปแบบข้อมูลในเซลล์ (Cell Format)</h4>
                </div>
                
                {/* Segmented Controller Slider */}
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 relative z-0">
                    <button 
                        onClick={() => setCellFormat('detailed')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative z-10 ${
                            cellFormat === 'detailed' 
                                ? 'bg-white text-slate-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        แบบละเอียด (Detailed)
                    </button>
                    <button 
                        onClick={() => setCellFormat('summary')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative z-10 ${
                            cellFormat === 'summary' 
                                ? 'bg-white text-slate-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        แบบรหัสย่อ (Summary Code)
                    </button>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {cellFormat === 'detailed' 
                        ? '💡 แนะนำสำหรับการตรวจสอบโดย HR: แสดงเวลาสแกนเข้า-ออก และระบุสาเหตุอย่างละเอียด เช่น "08:30-17:30 (สาย)"' 
                        : '💡 แนะนำสำหรับโปรแกรมเงินเดือน: แสดงรหัสย่อมาตรฐาน เช่น O (ปกติ), L (สาย), A (ขาด), W (WFH), V (ลา), H (หยุด) สะดวกต่อการใช้สูตรคำนวณเงินเดือน'
                    }
                </p>
            </div>

            {/* Section 2: Columns Selection (Toggle Switch Style) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Layout className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">คอลัมน์รายงานเสริม (Columns Settings)</h4>
                </div>

                <div className="space-y-3">
                    {/* Toggle 1 */}
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                            <div className={`p-1 rounded-md ${showWorkedDays ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <UserCheck className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">วันทำงานจริง (Worked Days)</span>
                                <span className="text-[10px] text-slate-400">สรุปจำนวนวันทำงานทั้งหมดในช่วงนั้น</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowWorkedDays(!showWorkedDays)}
                            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${showWorkedDays ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${showWorkedDays ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Toggle 2 */}
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                            <div className={`p-1 rounded-md ${showLateDays ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">จำนวนวันมาสาย (Late Days)</span>
                                <span className="text-[10px] text-slate-400">สรุปจำนวนครั้งสแกนเข้าสายสะสม</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowLateDays(!showLateDays)}
                            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${showLateDays ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${showLateDays ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Toggle 3 */}
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                            <div className={`p-1 rounded-md ${showLeaveDays ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">จำนวนวันลาสะสม (Leave Days)</span>
                                <span className="text-[10px] text-slate-400">นับสรุปจำนวนวันที่ได้รับการอนุมัติใบลา</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowLeaveDays(!showLeaveDays)}
                            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${showLeaveDays ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${showLeaveDays ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Toggle 4 */}
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                            <div className={`p-1 rounded-md ${showEmail ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Mail className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">อีเมลพนักงาน (Employee Email)</span>
                                <span className="text-[10px] text-slate-400">ใช้จับคู่คีย์บัญชีผู้ใช้ในระบบอื่น</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowEmail(!showEmail)}
                            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${showEmail ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${showEmail ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 3: Holiday Format */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">วันหยุดสัปดาห์ / วันหยุดพิเศษ (Holiday Treatment)</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button 
                        type="button"
                        onClick={() => setHolidayFormat('text')}
                        className={`py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all ${
                            holidayFormat === 'text' 
                                ? 'bg-white text-slate-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        แสดงข้อมูล / รหัสหยุด
                    </button>
                    <button 
                        type="button"
                        onClick={() => setHolidayFormat('blank')}
                        className={`py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all ${
                            holidayFormat === 'blank' 
                                ? 'bg-white text-slate-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        ปล่อยช่องว่าง (Blank)
                    </button>
                </div>
            </div>

            {/* Thailand Excel encoding Warning */}
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-950">
                <div className="p-1 bg-white rounded-lg shadow-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                    <h5 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">รองรับภาษาไทยใน Microsoft Excel 100%</h5>
                    <p className="text-[10px] text-emerald-700/95 leading-relaxed">
                        เข้ารหัสแบบ UTF-8 BOM อัตโนมัติ ป้องกันปัญหาอักษรต่างดาวเมื่อเปิดไฟล์รายงานใน Excel ทุกรุ่น
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExportConfigPanel;

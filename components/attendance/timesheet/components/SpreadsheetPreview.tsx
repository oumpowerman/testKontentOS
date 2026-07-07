import React from 'react';
import { Eye, Info } from 'lucide-react';

interface SpreadsheetPreviewProps {
    cellFormat: 'detailed' | 'summary';
    showWorkedDays: boolean;
    showLateDays: boolean;
    showLeaveDays: boolean;
    showEmail: boolean;
    holidayFormat: 'text' | 'blank';
}

const SpreadsheetPreview: React.FC<SpreadsheetPreviewProps> = ({
    cellFormat,
    showWorkedDays,
    showLateDays,
    showLeaveDays,
    showEmail,
    holidayFormat
}) => {
    // Mock Sample Data for the Excel Spreadsheet Preview
    const sampleEmployees = [
        { name: "ณัฐพงษ์ แก้วมณี", dept: "บัญชีและการเงิน", level: "Lvl 2", email: "nattapong@organization.com", stats: { w: 4, l: 1, v: 0 } },
        { name: "พัชราภา มีสุข", dept: "พัฒนาเทคโนโลยี", level: "Lvl 1", email: "patcharapa@organization.com", stats: { w: 3, l: 0, v: 1 } },
        { name: "สมชาย แสนดี", dept: "ทรัพยากรบุคคล", level: "Lvl 3", email: "somchai@organization.com", stats: { w: 5, l: 0, v: 0 } }
    ];

    const getSampleCellContent = (index: number, dayIdx: number) => {
        // Monday, Tuesday, Wednesday, Thursday, Friday
        if (cellFormat === 'summary') {
            if (index === 0) { // Nattapong
                const days = ['L', 'O', 'O', 'O', 'H'];
                return days[dayIdx] === 'H' && holidayFormat === 'blank' ? '' : days[dayIdx];
            }
            if (index === 1) { // Patcharapa
                const days = ['O', 'V', 'O', 'O', 'H'];
                return days[dayIdx] === 'H' && holidayFormat === 'blank' ? '' : days[dayIdx];
            }
            // Somchai
            const days = ['O', 'O', 'O', 'O', 'H'];
            return days[dayIdx] === 'H' && holidayFormat === 'blank' ? '' : days[dayIdx];
        } else {
            // Detailed Format
            if (index === 0) { // Nattapong
                const days = ['09:35-18:30 (สาย)', '08:45-18:00', '08:50-18:05', '08:55-18:10', 'วันหยุด'];
                if (days[dayIdx] === 'วันหยุด') {
                    return holidayFormat === 'blank' ? '' : 'หยุด: วันสิ้นปี';
                }
                return days[dayIdx];
            }
            if (index === 1) { // Patcharapa
                const days = ['08:50-18:00', 'ลาป่วย', '08:45-18:10', '08:55-18:00', 'วันหยุด'];
                if (days[dayIdx] === 'วันหยุด') {
                    return holidayFormat === 'blank' ? '' : 'หยุด: วันสิ้นปี';
                }
                return days[dayIdx];
            }
            // Somchai
            const days = ['08:40-18:00', '08:45-18:00', '08:45-18:05', '08:50-18:00', 'วันหยุด'];
            if (days[dayIdx] === 'วันหยุด') {
                return holidayFormat === 'blank' ? '' : 'หยุด: วันสิ้นปี';
            }
            return days[dayIdx];
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            {/* Title of preview */}
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" /> ตัวอย่างไฟล์ที่จะได้รับ (Excel Simulation Live View)
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ตอบสนองแบบ Real-Time
                </span>
            </div>

            {/* Spreadsheet Table Container */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-lg flex flex-col overflow-hidden min-h-[300px]">
                
                {/* Excel Top Command Bar (Mock) */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-slate-400 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="text-[11px] font-bold text-slate-500 ml-2 font-mono">timesheet_export.xlsx</span>
                    </div>
                    <div className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold select-none">
                        Sheet 1
                    </div>
                </div>

                {/* Spreadsheet Table Sheet */}
                <div className="overflow-auto max-h-[320px]">
                    <table className="w-full text-left border-collapse select-none">
                        <thead>
                            {/* A, B, C, D Header Guide */}
                            <tr className="bg-slate-100 border-b border-slate-200 text-center font-mono text-[10px] text-slate-400 shrink-0 select-none">
                                <th className="w-8 border-r border-slate-200 font-normal p-0.5 bg-slate-50"></th>
                                <th className="border-r border-slate-200 font-normal p-0.5">A</th>
                                <th className="border-r border-slate-200 font-normal p-0.5">B</th>
                                <th className="border-r border-slate-200 font-normal p-0.5">C</th>
                                {showEmail && <th className="border-r border-slate-200 font-normal p-0.5">D</th>}
                                <th className="border-r border-slate-200 font-normal p-0.5">D</th>
                                <th className="border-r border-slate-200 font-normal p-0.5">E</th>
                                <th className="border-r border-slate-200 font-normal p-0.5">F</th>
                                <th className="border-r border-slate-200 font-normal p-0.5">G</th>
                                <th className="border-r border-slate-200 font-normal p-0.5">H</th>
                                {showWorkedDays && <th className="border-r border-slate-200 font-normal p-0.5">I</th>}
                                {showLateDays && <th className="border-r border-slate-200 font-normal p-0.5">J</th>}
                                {showLeaveDays && <th className="border-r border-slate-200 font-normal p-0.5">K</th>}
                            </tr>

                            {/* Real CSV Header Row */}
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                                <td className="border-r border-slate-200 text-center font-mono text-[9px] text-slate-400 bg-slate-50">1</td>
                                <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap">ชื่อพนักงาน</th>
                                <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap">แผนก/ตำแหน่ง</th>
                                <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap">ระดับ (Level)</th>
                                {showEmail && <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap">อีเมลพนักงาน</th>}
                                <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap text-center">จ. (06 ก.ค.)</th>
                                <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap text-center">อ. (07 ก.ค.)</th>
                                <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap text-center">พ. (08 ก.ค.)</th>
                                <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap text-center">พฤ. (09 ก.ค.)</th>
                                <th className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap text-center">ศ. (10 ก.ค.)</th>
                                {showWorkedDays && <th className="px-3 py-2 border-r border-slate-200 text-emerald-700 bg-emerald-50/50 text-center whitespace-nowrap">วันทำงานจริง</th>}
                                {showLateDays && <th className="px-3 py-2 border-r border-slate-200 text-amber-700 bg-amber-50/50 text-center whitespace-nowrap">วันสาย</th>}
                                {showLeaveDays && <th className="px-3 py-2 border-r border-slate-200 text-blue-700 bg-blue-50/50 text-center whitespace-nowrap">วันลา</th>}
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-slate-600">
                            {sampleEmployees.map((emp, idx) => (
                                <tr key={emp.name} className="border-b border-slate-100 hover:bg-slate-50/40">
                                    <td className="border-r border-slate-200 text-center font-mono text-[9px] text-slate-400 bg-slate-50">{idx + 2}</td>
                                    <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-800 whitespace-nowrap">{emp.name}</td>
                                    <td className="px-3 py-2.5 border-r border-slate-200 whitespace-nowrap">{emp.dept}</td>
                                    <td className="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-500 text-center whitespace-nowrap">{emp.level}</td>
                                    
                                    {showEmail && (
                                        <td className="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-400 text-xs whitespace-nowrap">{emp.email}</td>
                                    )}

                                    {/* Monday - Friday */}
                                    {[0, 1, 2, 3, 4].map((dayIdx) => {
                                        const cellContent = getSampleCellContent(idx, dayIdx);
                                        
                                        // Dynamic Style Classes for the preview
                                        let cellStyle = "text-center whitespace-nowrap border-r border-slate-200 ";
                                        if (cellFormat === 'summary') {
                                            if (cellContent === 'O') cellStyle += "text-emerald-600 bg-emerald-50/30 font-bold";
                                            else if (cellContent === 'L') cellStyle += "text-amber-600 bg-amber-50/30 font-bold";
                                            else if (cellContent === 'V') cellStyle += "text-blue-600 bg-blue-50/30 font-bold";
                                            else if (cellContent === 'A') cellStyle += "text-red-600 bg-red-50/30 font-bold";
                                            else if (cellContent === 'H') cellStyle += "text-slate-400 bg-slate-100/50";
                                        } else {
                                            if (cellContent.includes('สาย')) cellStyle += "text-amber-600 bg-amber-50/20";
                                            else if (cellContent.includes('ลา')) cellStyle += "text-blue-600 bg-blue-50/20";
                                            else if (cellContent.includes('หยุด')) cellStyle += "text-slate-400 bg-slate-50 font-normal";
                                            else if (cellContent === '—') cellStyle += "text-slate-300";
                                            else cellStyle += "text-emerald-700 bg-emerald-50/10";
                                        }

                                        return (
                                            <td key={dayIdx} className={`px-3 py-2.5 ${cellStyle}`}>
                                                {cellContent || <span className="text-slate-200">—</span>}
                                            </td>
                                        );
                                    })}

                                    {/* Stats Columns */}
                                    {showWorkedDays && (
                                        <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-700 bg-emerald-50/10 whitespace-nowrap">
                                            {emp.stats.w} วัน
                                        </td>
                                    )}
                                    {showLateDays && (
                                        <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-700 bg-amber-50/10 whitespace-nowrap">
                                            {emp.stats.l > 0 ? `${emp.stats.l} ครั้ง` : '0'}
                                        </td>
                                    )}
                                    {showLeaveDays && (
                                        <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold text-slate-700 bg-blue-50/10 whitespace-nowrap">
                                            {emp.stats.v > 0 ? `${emp.stats.v} วัน` : '0'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Spreadsheet Bottom Helper (Mock) */}
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-400 shrink-0 font-medium">
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">🟢 READY TO DEPLOY</span>
                    <span className="h-3 w-[1px] bg-slate-200" />
                    <span>แถวพนักงานทั้งหมดในระบบจะถูกสร้างตามฟอร์แมตจำลองนี้</span>
                </div>
            </div>

            {/* Extra Hint Info */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 flex items-start gap-2.5 text-slate-500">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                    <strong>แนะนำการนำเข้าซอฟต์แวร์ Payroll:</strong> หากต้องการนำเข้าซอฟต์แวร์เงินเดือนชั้นนำต่าง ๆ ให้ปรับรูปแบบเป็น <strong className="font-semibold text-slate-700">แบบรหัสย่อ (Summary Code)</strong> และติ๊กเลือกคอลัมน์สรุปตามที่ระบบปลายทางระบุไว้เพื่อความรวดเร็วและถูกต้องสูงสุด
                </p>
            </div>
        </div>
    );
};

export default SpreadsheetPreview;

import React from 'react';

interface ReportSettingsSectionProps {
    delimiter: ',' | ';';
    setDelimiter: (val: ',' | ';') => void;
    useBOM: boolean;
    setUseBOM: (val: boolean) => void;
}

export const ReportSettingsSection: React.FC<ReportSettingsSectionProps> = ({
    delimiter,
    setDelimiter,
    useBOM,
    setUseBOM
}) => {
    return (
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left pl-1">
                ⚙️ ตัวตั้งค่าพิเศษสำหรับนักบัญชีระดับองค์กร (Report Settings)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delimiter */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 flex flex-col justify-center gap-3">
                    <div className="text-left">
                        <h5 className="text-xs font-bold text-slate-700">อักขระระบุคั่นข้อมูล (CSV Delimiter)</h5>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                            โปรแกรมบัญชีส่วนใหญ่และ TigerSoft มักรองรับ Comma ( , ) แต่ในกรณี ERP ใหญ่ๆ บางที่อาจระบุใช้ Semicolon ( ; )
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setDelimiter(',')}
                            className={`flex-1 py-2 px-3 text-xs font-bold border rounded-xl transition-all ${
                                delimiter === ','
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            Comma ( , )
                        </button>
                        <button
                            type="button"
                            onClick={() => setDelimiter(';')}
                            className={`flex-1 py-2 px-3 text-xs font-bold border rounded-xl transition-all ${
                                delimiter === ';'
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            Semicolon ( ; )
                        </button>
                    </div>
                </div>

                {/* Thai characters safety */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 flex items-center justify-between gap-4">
                    <div className="text-left space-y-1">
                        <h5 className="text-xs font-bold text-slate-700">ตัวอ่านรหัสภาษาไทย (UTF-8 BOM)</h5>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            เมื่อเปิดใช้ระบบนี้ รหัสภาษาไทยจะถูกจัดเก็บในรูปแบบ Byte Order Mark (BOM) อัตโนมัติ ป้องกันปัญหาภาษาไทยแสดงผลเป็นคำต่างดาวเมื่อดับเบิ้ลคลิกไฟล์บน Microsoft Excel
                        </p>
                    </div>
                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={() => setUseBOM(!useBOM)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors outline-none focus:ring-2 focus:ring-indigo-300 ${
                                useBOM ? 'bg-indigo-500' : 'bg-slate-200'
                            }`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                useBOM ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

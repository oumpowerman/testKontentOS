import React from 'react';
import { BarChart3, Database, Calendar, Coins, Check } from 'lucide-react';

interface DatasetSelectorSectionProps {
    datasetType: 'SUMMARY' | 'RAW_CLOCKS' | 'LEAVES' | 'OVERTIME';
    setDatasetType: (type: 'SUMMARY' | 'RAW_CLOCKS' | 'LEAVES' | 'OVERTIME') => void;
}

export const DatasetSelectorSection: React.FC<DatasetSelectorSectionProps> = ({
    datasetType,
    setDatasetType
}) => {
    return (
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left pl-1">
                📑 เลือกประเภทรายงานคีย์หลักสำหรับบัญชี (Select Dataset Type)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card A: Summary */}
                <button
                    type="button"
                    onClick={() => setDatasetType('SUMMARY')}
                    className={`p-6 rounded-[2rem] border text-left transition-all relative flex gap-5 group hover:shadow-xl ${
                        datasetType === 'SUMMARY'
                            ? 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-500 shadow-md shadow-indigo-50'
                            : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                >
                    <div className={`p-3.5 rounded-2xl shrink-0 ${
                        datasetType === 'SUMMARY' ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-500'
                    }`}>
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h5 className="font-bold text-sm text-slate-800">รายงานสรุปเวลาทำงาน (Attendance Summary)</h5>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            สรุปภาพรวมรายเดือนของพนักงาน: วันทำงาน สาย ลา ขาดงาน สะสมชั่วโมงทั้งหมด และประเมินเกรดประสิทธิภาพแยกบุคคล
                        </p>
                    </div>
                    {datasetType === 'SUMMARY' && (
                        <div className="absolute top-4 right-4 p-1 bg-indigo-500 rounded-full text-white">
                            <Check className="w-3.5 h-3.5" />
                        </div>
                    )}
                </button>

                {/* Card B: Raw Clocks */}
                <button
                    type="button"
                    onClick={() => setDatasetType('RAW_CLOCKS')}
                    className={`p-6 rounded-[2rem] border text-left transition-all relative flex gap-5 group hover:shadow-xl ${
                        datasetType === 'RAW_CLOCKS'
                            ? 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-500 shadow-md shadow-indigo-50'
                            : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                >
                    <div className={`p-3.5 rounded-2xl shrink-0 ${
                        datasetType === 'RAW_CLOCKS' ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-500'
                    }`}>
                        <Database className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h5 className="font-bold text-sm text-slate-800">บันทึกเวลาตอกบัตรดิบ (Raw Clocks Audit Trail)</h5>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            ตารางข้อมูลตอกบัตรเช็คอิน-เช็คเอาท์รายวัน รวมพิกัด สถานที่ทำงาน (WFH/Onsite) บันทึกตอกบัตรดิบ และฟีลด์โน้ตพนักงาน
                        </p>
                    </div>
                    {datasetType === 'RAW_CLOCKS' && (
                        <div className="absolute top-4 right-4 p-1 bg-indigo-500 rounded-full text-white">
                            <Check className="w-3.5 h-3.5" />
                        </div>
                    )}
                </button>

                {/* Card C: Leaves */}
                <button
                    type="button"
                    onClick={() => setDatasetType('LEAVES')}
                    className={`p-6 rounded-[2rem] border text-left transition-all relative flex gap-5 group hover:shadow-xl ${
                        datasetType === 'LEAVES'
                            ? 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-500 shadow-md shadow-indigo-50'
                            : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                >
                    <div className={`p-3.5 rounded-2xl shrink-0 ${
                        datasetType === 'LEAVES' ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-500'
                    }`}>
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h5 className="font-bold text-sm text-slate-800">รายงานประวัติการลา (Leaves & Absences)</h5>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            บันทึกรายการลาหยุดเชิงลึกทุกประเภท (ลาป่วย, กิจ, พักร้อน) วันเวลาเริ่มต้น-สิ้นสุด จำนวนชั่วโมงลาจริง และเหตุผลประกอบคำขอ
                        </p>
                    </div>
                    {datasetType === 'LEAVES' && (
                        <div className="absolute top-4 right-4 p-1 bg-indigo-500 rounded-full text-white">
                            <Check className="w-3.5 h-3.5" />
                        </div>
                    )}
                </button>

                {/* Card D: Overtime */}
                <button
                    type="button"
                    onClick={() => setDatasetType('OVERTIME')}
                    className={`p-6 rounded-[2rem] border text-left transition-all relative flex gap-5 group hover:shadow-xl ${
                        datasetType === 'OVERTIME'
                            ? 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-500 shadow-md shadow-indigo-50'
                            : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                >
                    <div className={`p-3.5 rounded-2xl shrink-0 ${
                        datasetType === 'OVERTIME' ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-500'
                    }`}>
                        <Coins className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h5 className="font-bold text-sm text-slate-800">รายงานค่าล่วงเวลาและโอที (OT & Payroll)</h5>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            สวรรค์ของนักบัญชี! สรุปชั่วโมงโอที คัดแยกเป็นอัตราคูณรายช่วง (1.5x, 2.0x, 3.0x) ยอดจ่ายค่าล่วงเวลาสะสม และการตรวจสอบบัตรสแกนจริง
                        </p>
                    </div>
                    {datasetType === 'OVERTIME' && (
                        <div className="absolute top-4 right-4 p-1 bg-indigo-500 rounded-full text-white">
                            <Check className="w-3.5 h-3.5" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

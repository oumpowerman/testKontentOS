import React from 'react';
import { ShieldCheck, History } from 'lucide-react';

export interface ExportAuditLog {
    id: string;
    timestamp: string;
    datasetType: string;
    dateScope: string;
    filters: string;
    format: string;
    status: string;
}

interface AuditLogsTabProps {
    auditLogs: ExportAuditLog[];
    onClearLogs: () => void;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({
    auditLogs,
    onClearLogs
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-left">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-500" /> สมุดบันทึกกิจกรรมส่งออกข้อมูลด้านบัญชี (Audit Trail)
                    </h4>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                        บันทึกกิจกรรมดาวน์โหลดเพื่อความปลอดภัยของข้อมูลพนักงานและมาตรฐาน Data Governance
                    </p>
                </div>
                {auditLogs.length > 0 && (
                    <button
                        onClick={onClearLogs}
                        className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl transition-colors"
                    >
                        ล้างประวัติทั้งหมด
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 overflow-hidden shadow-sm">
                {auditLogs.length > 0 ? (
                    <div className="divide-y divide-slate-100 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="py-4 px-6">วัน/เวลาสแกนดาวน์โหลด</th>
                                    <th className="py-4 px-6">ประเภทชุดข้อมูล</th>
                                    <th className="py-4 px-6">ช่วงเวลาที่รายงานอ้างอิง</th>
                                    <th className="py-4 px-6">ตัวกรองพนักงาน</th>
                                    <th className="py-4 px-6">รูปแบบพอร์แมต</th>
                                    <th className="py-4 px-6 text-center">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-slate-600">
                                {auditLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="py-4 px-6 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                                        <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">{log.datasetType}</td>
                                        <td className="py-4 px-6 text-indigo-600 whitespace-nowrap">{log.dateScope}</td>
                                        <td className="py-4 px-6 text-slate-500 max-w-xs truncate" title={log.filters}>{log.filters}</td>
                                        <td className="py-4 px-6 text-[10px] font-mono text-slate-400">{log.format}</td>
                                        <td className="py-4 px-6 text-center whitespace-nowrap">
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-16 text-center flex flex-col items-center justify-center text-slate-400">
                        <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-300">
                            <History className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">ยังไม่มีประวัติการส่งออกข้อมูล</p>
                        <p className="text-[10px] text-slate-400 mt-1">จะเริ่มบันทึกเมื่อเจ้าหน้าที่ฝ่ายบุคคลกดส่งออกรายงานในรอบปัจจุบัน</p>
                    </div>
                )}
            </div>
        </div>
    );
};

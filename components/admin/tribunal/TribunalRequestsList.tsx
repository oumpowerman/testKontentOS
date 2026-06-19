import React from 'react';
import { TribunalReport, User } from '../../../types';
import { Scale, Inbox, User as UserIcon, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

interface TribunalRequestsListProps {
    filteredReports: TribunalReport[];
    allUsers: User[];
    selectedReport: TribunalReport | null;
    setSelectedReport: (report: TribunalReport) => void;
}

const TribunalRequestsList: React.FC<TribunalRequestsListProps> = ({
    filteredReports,
    allUsers,
    selectedReport,
    setSelectedReport
}) => {
    
    const getUserName = (uid: string) => {
        return allUsers.find(u => u.id === uid)?.name || 'ผู้ใช้งานภายนอก';
    };

    const getUserPhoto = (uid: string) => {
        return allUsers.find(u => u.id === uid)?.avatarUrl;
    };

    const getCategoryDetails = (catId: string) => {
        const list: Record<string, { label: string; color: string; severity: string }> = {
            toilet: { label: '🚽 สุขา', color: 'bg-slate-100 text-slate-700 border-slate-200/50', severity: 'LOW' },
            kitchen: { label: '🍽️ ของกิน/ครัว', color: 'bg-amber-50 text-amber-700 border-amber-200/50', severity: 'MEDIUM' },
            behavior: { label: '🗣️ พฤติกรรม', color: 'bg-orange-50 text-orange-700 border-orange-200/50', severity: 'HIGH' },
            property: { label: '🔨 ของพัง', color: 'bg-rose-50 text-rose-700 border-rose-200/50', severity: 'CRITICAL' },
            other: { label: '📝 อื่นๆ', color: 'bg-slate-100 text-slate-700 border-slate-200/50', severity: 'LOW' }
        };
        return list[catId] || { label: `🏷️ ${catId}`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200/50', severity: 'LOW' };
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'REJECTED':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">
            {/* List Feed header */}
            <div className="bg-slate-50/50 hover:bg-slate-50 border-b p-3 flex items-center justify-between text-[11px] h-12 shrink-0">
                <span className="text-slate-400 font-bold ml-2">บัญชีฟ้องร้องทั้งหมด ({filteredReports.length} คดี)</span>
            </div>

            {/* List Feed core body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                        <Inbox className="w-10 h-10 text-slate-300 mb-2" />
                        <h4 className="text-xs text-slate-700 font-bold">ไม่มีรายการคำร้องตามเงื่อนไขที่เลือก</h4>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                            ระบบพร้อมดำเนินงานและติดตามสรุปข้อขัดแย้งจากแบบร้องเรียนของทีมเรียลไทม์อย่างโปร่งใสตามหลักเกณฑ์
                        </p>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const reporterName = report.is_anonymous ? 'สมาชิกไม่ประสงค์ออกนาม' : getUserName(report.reporter_id);
                        const reporterPhoto = report.is_anonymous ? null : getUserPhoto(report.reporter_id);
                        const targetName = report.target_id ? getUserName(report.target_id) : null;
                        const targetPhoto = report.target_id ? getUserPhoto(report.target_id) : null;
                        const cat = getCategoryDetails(report.category);

                        return (
                            <div
                                key={report.id}
                                onClick={() => setSelectedReport(report)}
                                className={`p-4 transition-all duration-200 cursor-pointer text-left block border-l-4 ${
                                    selectedReport?.id === report.id
                                        ? 'bg-indigo-50/50 border-indigo-500 shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border-l-transparent'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Present reporter avatar */}
                                    {reporterPhoto ? (
                                        <img 
                                            src={reporterPhoto} 
                                            alt="" 
                                            className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-3xs shrink-0"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs shrink-0 font-bold">
                                            {report.is_anonymous ? '🕵️' : reporterName.charAt(0)}
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1.5">
                                            <h4 className="text-xs text-slate-800 font-bold truncate">
                                                {reporterName}
                                            </h4>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getStatusStyles(report.status)} font-bold`}>
                                                {report.status}
                                            </span>
                                        </div>

                                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                                            <Clock className="w-3 h-3" />
                                            {new Date(report.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>

                                        {/* Target User */}
                                        {targetName && (
                                            <div className="mt-2 flex items-center gap-1.5 p-1 px-2 border border-rose-100 bg-rose-50/50 rounded-lg max-w-fit">
                                                <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                                                <span className="text-[10px] text-rose-800 font-semibold truncate max-w-[120px]">
                                                    คดีฟ้อง: <strong className="font-extrabold">{targetName}</strong>
                                                </span>
                                            </div>
                                        )}

                                        {/* Core description block */}
                                        <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed italic bg-slate-50 p-1.5 border border-slate-100/70 rounded-lg">
                                            "{report.description}"
                                        </p>

                                        {/* Row containing category badge */}
                                        <div className="mt-2.5 flex items-center justify-between">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${cat.color}`}>
                                                {cat.label}
                                            </span>
                                            <div className="flex items-center text-[10px] text-slate-450 hover:text-indigo-600 transition-colors">
                                                ดูคำชี้แจงเต็มตัว
                                                <ArrowRight className="w-3 h-3 ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TribunalRequestsList;

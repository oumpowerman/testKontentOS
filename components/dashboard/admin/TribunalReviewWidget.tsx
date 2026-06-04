import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gavel, SlidersHorizontal, ShieldAlert, AlertTriangle, ExternalLink, Scale, Sparkles } from 'lucide-react';
import { useTribunal } from '../../../hooks/useTribunal';
import { useTeam } from '../../../hooks/useTeam';
import { TribunalReport } from '../../../types';
import AdminTribunalReviewModal from '../../admin/AdminTribunalReviewModal';

interface TribunalReviewWidgetProps {
    currentUser: any;
}

const TribunalReviewWidget: React.FC<TribunalReviewWidgetProps> = ({ currentUser }) => {
    const { getReports } = useTribunal(currentUser);
    const { allUsers: users } = useTeam();
    const [reports, setReports] = useState<TribunalReport[]>([]);
    const [isCtrlOpen, setIsCtrlOpen] = useState(false);

    const fetchPendingReports = async () => {
        try {
            const data = await getReports('PENDING');
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching dashboard pending reports:', error);
        }
    };

    // Load pending reports on mount and when modal closes/submits
    useEffect(() => {
        fetchPendingReports();
    }, [isCtrlOpen]);

    // Intelligence mapping for widget summary
    const metrics = useMemo(() => {
        const total = reports.length;
        const critical = reports.filter(r => r.category === 'property' || r.category === 'behavior').length;
        const warning = reports.filter(r => r.category === 'toilet' || r.category === 'kitchen' || r.category === 'other').length;
        
        const reportersCount: Record<string, number> = {};
        reports.forEach(r => {
            const matchedUser = users.find(u => u.id === r.reporter_id);
            const name = r.is_anonymous ? 'นิรนาม' : (matchedUser?.name || 'พนักงาน');
            reportersCount[name] = (reportersCount[name] || 0) + 1;
        });

        let topReporter = 'ไม่มี';
        let maxVal = 0;
        Object.entries(reportersCount).forEach(([name, val]) => {
            if (val > maxVal) {
                maxVal = val;
                topReporter = `${name} (${val} เรื่อง)`;
            }
        });

        return { total, critical, warning, topReporter };
    }, [reports, users]);

    const hasPending = reports.length > 0;

    // Rich Categories Translation & Aesthetic Map
    const categoryStyles: Record<string, { label: string; bg: string; text: string; border: string }> = {
        kitchen: { label: '🧼 ความสะอาดห้องครัว', bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200/40' },
        toilet: { label: '🚽 ความสะอาดห้องน้ำ', bg: 'bg-cyan-50 text-cyan-700', text: 'text-cyan-700', border: 'border-cyan-200/40' },
        property: { label: '🔨 ทรัพย์สินเสียหาย', bg: 'bg-rose-50 text-rose-700', text: 'text-rose-700', border: 'border-rose-200/40' },
        behavior: { label: '🚷 พฤติกรรมไม่เหมาะ', bg: 'bg-red-50 text-red-700', text: 'text-red-700', border: 'border-red-200/40' },
        other: { label: '📌 ความผิดทั่วไป', bg: 'bg-slate-50 text-slate-600', text: 'text-slate-600', border: 'border-slate-200/40' }
    };

    return (
        <div id="tribunal-review-widget" className={`rounded-3xl border p-6 space-y-5 relative overflow-hidden text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-md ${
            hasPending 
                ? 'bg-gradient-to-br from-rose-50/60 via-purple-50/40 to-violet-50/30 border-rose-100 shadow-sm shadow-rose-100/20' 
                : 'bg-white border-slate-100 shadow-2xs'
        }`}>
            {/* Ambient dynamic pulsing crimson glow indicator */}
            {hasPending && (
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-rose-200/15 to-violet-200/10 blur-3xl pointer-events-none rounded-full" />
            )}

            {/* Subtle giant back banner gavel icon that knocks elegantly on loop when pending */}
            <div className="absolute -top-1 -right-1 p-3 opacity-[0.03] pointer-events-none select-none">
                <motion.div
                    animate={hasPending ? {
                        rotate: [0, -15, 8, -15, 0],
                        scale: [1, 1.05, 0.95, 1.05, 1],
                    } : {}}
                    transition={{
                        repeat: Infinity,
                        duration: 5,
                        ease: "easeInOut"
                    }}
                >
                    <Gavel className="w-24 h-24 text-rose-500" />
                </motion.div>
            </div>

            {/* Widget layout top Header */}
            <div className="flex items-center justify-between gap-3 relative z-10 text-left">
                <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-2xl shrink-0 transition-all duration-500 flex items-center justify-center ${
                        hasPending 
                            ? 'bg-rose-100 text-rose-600 border border-rose-200/20 shadow-2xs' 
                            : 'bg-slate-50 text-slate-400 border border-slate-100/50'
                    }`}>
                        <Scale className={`w-4.5 h-4.5 ${hasPending ? 'animate-pulse' : ''}`} />
                    </span>
                    <div className="text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base md:text-lg text-slate-800 font-bold tracking-tight">ศูนย์ศาลตัดสินเวรยาม</h3>
                            {hasPending && (
                                <span className="bg-rose-100 text-rose-800 text-[8.5px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-0.5 border border-rose-200/50 shadow-2xs">
                                    <Sparkles className="w-2 h-2 text-rose-500" /> ศาลร้อน
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">คำร้องละเว้นหน้าที่เวรยามและการตัดสินโทษ</p>
                    </div>
                </div>

                <div className="shrink-0">
                    <span className={`h-6 px-3 text-[10px] rounded-full flex items-center justify-center transition-all duration-500 font-semibold ${
                        hasPending
                            ? 'bg-rose-100 text-rose-700 border border-rose-200/50 animate-pulse'
                            : 'bg-slate-50 border border-slate-100 text-slate-400 font-medium'
                    }`}>
                        {hasPending ? `คดีค้าง ${reports.length} เรื่อง` : 'ศาลสงบเรียบร้อย'}
                    </span>
                </div>
            </div>

            {/* Micro Dashboard Insights row */}
            <div className="grid grid-cols-2 gap-2.5 text-left relative z-10">
                <div className={`p-3 rounded-2xl border transition-all duration-500 ${
                    hasPending && metrics.critical > 0
                        ? 'bg-rose-50/65 border-rose-150'
                        : 'bg-slate-50/40 border-slate-100/50'
                }`}>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1 ${
                        hasPending && metrics.critical > 0 ? 'text-rose-500' : 'text-slate-455'
                    }`}>
                        <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" /> ร้ายแรง/วิกฤต
                    </span>
                    <p className={`text-sm mt-0.5 font-bold ${
                        hasPending && metrics.critical > 0 ? 'text-rose-600' : 'text-slate-700'
                    }`}>{metrics.critical} เรื่อง</p>
                    <p className="text-[8.5px] text-slate-450 font-medium mt-0.5">พฤติกรรมขัดกฎค่อนข้างรุนแรง</p>
                </div>
                
                <div className={`p-3 rounded-2xl border transition-all duration-500 min-w-0 ${
                    hasPending
                        ? 'bg-violet-50/50 border-violet-150'
                        : 'bg-slate-50/40 border-slate-100/50'
                }`}>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className={`w-3 h-3 shrink-0 ${hasPending ? 'text-violet-500' : 'text-slate-400'}`} /> รายงานบ่อยที่สุด
                    </span>
                    <p className={`text-xs mt-0.5 truncate font-bold ${
                        hasPending ? 'text-violet-950' : 'text-slate-650'
                    }`}>{metrics.topReporter}</p>
                    <p className="text-[8.5px] text-slate-455 font-medium mt-0.5">สถิติคดีสะสมสะกิดพฤติกรรม</p>
                </div>
            </div>

            {/* Real-Time Tribunal Incidents Feed - Only shown when there are pending incidents */}
            {hasPending && (
                <div className="relative z-10 space-y-2 pt-1 border-t border-dashed border-rose-100/50">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-violet-950 font-semibold tracking-wide uppercase">รายการคดีที่รอดุลยพินิจ</span>
                        <span className="text-[9px] text-slate-400 font-medium">แสดงล่าสุด {Math.min(reports.length, 2)} เรื่อง</span>
                    </div>

                    <div className="space-y-2">
                        {reports.slice(0, 2).map((rep) => {
                            const matchedTarget = users.find(u => u.id === rep.target_id);
                            const styleObj = categoryStyles[rep.category] || categoryStyles.other;

                            return (
                                <div 
                                    key={rep.id} 
                                    onClick={() => setIsCtrlOpen(true)}
                                    className="p-3 bg-white/90 rounded-2xl border border-rose-100/40 hover:bg-white hover:border-rose-250/55 transition-all duration-300 cursor-pointer text-left space-y-1.5 shadow-2xs flex flex-col justify-between"
                                >
                                    {/* Category Pill and Target info */}
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold tracking-wide border uppercase shrink-0 ${styleObj.bg} ${styleObj.border}`}>
                                            {styleObj.label}
                                        </span>
                                        <div className="flex items-center gap-1 min-w-0">
                                            <span className="text-[8.5px] text-slate-400 font-semibold shrink-0">จำเลย:</span>
                                            {matchedTarget?.avatarUrl ? (
                                                <img 
                                                    src={matchedTarget.avatarUrl} 
                                                    alt={matchedTarget.name} 
                                                    className="w-4.5 h-4.5 rounded-full object-cover ring-1 ring-rose-100 shrink-0" 
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-4.5 h-4.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[8px] flex items-center justify-center shrink-0">
                                                    {matchedTarget?.name?.slice(0, 1) || 'จ'}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-rose-700 font-semibold truncate max-w-[70px]">{matchedTarget?.name || 'นิรนาม'}</span>
                                        </div>
                                    </div>

                                    {/* Complaint Description Description Snippet */}
                                    <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50">
                                        <p className="text-[9px] text-slate-650 italic font-medium line-clamp-1">
                                            "{rep.description || 'ไม่มีรายละเอียดพฤติการณ์เพิ่มเติม'}"
                                        </p>
                                    </div>

                                    {/* Reporter & Metadata */}
                                    <div className="flex items-center justify-between text-[8px] text-slate-400 font-semibold pt-0.5">
                                        <span>ผู้ยื่นร้อง: {rep.is_anonymous ? '🤫 นิรนามกระซิบข่าว' : '🔍 ยื่นร้องโดยเปิดเผย'}</span>
                                        <span>
                                            {new Date(rep.created_at).toLocaleDateString('th-TH', { 
                                                day: 'numeric', 
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Launch Command center overlay CTA button */}
            <div className="relative z-10 pt-1">
                <motion.button 
                    whileHover={{ scale: 1.02, y: -0.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCtrlOpen(true)}
                    className={`w-full py-2.5 rounded-2xl text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-all duration-300 font-semibold text-center focus:outline-none ${
                        hasPending 
                            ? 'bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 text-white shadow-xs' 
                            : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> 
                    {hasPending 
                        ? `เปิดห้องพิจารณาไต่สวนคดี (${reports.length})` 
                        : 'เปิดประตูสู่ทำเนียบคดีศาล'
                    }
                    <ExternalLink className="w-3 h-3 opacity-70" />
                </motion.button>
            </div>

            {/* Interactive Full Administrative Modal */}
            <AdminTribunalReviewModal 
                isOpen={isCtrlOpen} 
                onClose={() => setIsCtrlOpen(false)} 
                currentUser={currentUser} 
                allUsers={users}
            />
        </div>
    );
};

export default TribunalReviewWidget;

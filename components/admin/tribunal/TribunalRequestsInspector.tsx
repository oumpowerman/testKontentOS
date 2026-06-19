import React, { useState, useEffect } from 'react';
import { TribunalReport, User } from '../../../types';
import { 
    Scale, AlertCircle, FileText, Sparkles, User as UserIcon, ShieldAlert, 
    AlertTriangle, MessageSquare, Check, X, ExternalLink, RefreshCw, Zap
} from 'lucide-react';
import { useGameConfig } from '../../../context/GameConfigContext';

interface TribunalRequestsInspectorProps {
    selectedReport: TribunalReport | null;
    allUsers: User[];
    onResolve: (reportId: string, decision: 'APPROVE' | 'REJECT', feedback: string) => Promise<void>;
    isProcessing: boolean;
    setSelectedReport: (report: TribunalReport | null) => void;
}

const TribunalRequestsInspector: React.FC<TribunalRequestsInspectorProps> = ({
    selectedReport,
    allUsers,
    onResolve,
    isProcessing,
    setSelectedReport
}) => {
    const { config } = useGameConfig();
    const [feedback, setFeedback] = useState('');
    const [isApplying, setIsApplying] = useState<'APPROVE' | 'REJECT' | null>(null);

    const recruitmentRules = [
        'พบพฤติกรรมลืมเวร หรือส่งเวรไม่สะอาดจริง มีสิทธิ์หักพลังตามกฎออฟฟิศ',
        'พิจารณาหลักฐานรูปถ่าย/ไฟล์ก่อนลงมือปรับบทบัญญัติ',
        'การฟ้องเท็จจงใจแกล้งเพื่อน จะส่งผลย้อนหักพลังผู้ฟ้อง (-15 HP)'
    ];

    const quickFeedbackTemplates = [
        'หลักฐานชัดเจน มีการละเลยตารางเวรจริง อนุมัติการปรับโทษและมอบรางวัลแก่ผู้ส่งเรื่อง ⚖️',
        'ภาพมีน้ำหนักค่อนข้างน้อย แต่ถือว่าเป็นการสอดส่อง พฤติกรรมไม่ได้ร้ายแรงจนต้องหักแต้ม ปัดตกแต่แจ้งเตือนส่วนกลางกลุ่ม',
        'หลักฐานไม่เพียงพอสมตามข้อความร้องเรียน ตรวจสอบประวัตินอกกลุ่มแล้วไม่ใช่เรื่องเจตนาละเลียด ปัดตกคำร้อง',
        'ถือเป็นการฟ้องเท็จหรือกลั่นแกล้งเพื่อนร่วมงานโดยไม่มีมูลความจริง ระบบทำการตัดพลัง HP ผู้ร้องตามวินัยบริษัท'
    ];

    // Reset feedback on report change
    useEffect(() => {
        setFeedback('');
        setIsApplying(null);
    }, [selectedReport]);

    if (!selectedReport) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 h-full">
                <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                    <Scale className="w-6 h-6 animate-spin-slow" />
                </div>
                <h3 className="text-xs text-slate-700 font-bold">เลือกรายการศาลพิจารณาด้านซ้าย</h3>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed text-center">
                    ระบบจะเปิดแฟ้มดุลพิจารณา ตรวจสอบมูลคดีความ หลักฐานกล้องและข้อความประกอบ เพื่อให้แอดมินดำเนินการตัดสินปรับ HP/Points ได้อย่างรวดเร็ว
                </p>
            </div>
        );
    }

    const reporter = allUsers.find(u => u.id === selectedReport.reporter_id);
    const target = selectedReport.target_id ? allUsers.find(u => u.id === selectedReport.target_id) : null;

    const reporterName = selectedReport.is_anonymous ? 'สมาชิกไม่ประสงค์ออกนาม (Anonymous)' : (reporter?.name || 'Unknown User');
    const targetName = target?.name || 'ผู้ร่วมงานภายนอก / Unknown';

    const getCategoryDetails = (catId: string) => {
        const list: Record<string, { label: string; text: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; color: string }> = {
            toilet: { label: '🚽 สุขา', text: 'สุขาออฟฟิศไม่สะอาด ลืมเช็ดถู หรือทำสกปรก', severity: 'LOW', color: 'bg-slate-100 text-slate-700 border-slate-200' },
            kitchen: { label: '🍽️ ของกิน/ครัว', text: 'ครัวเลอะเทอะ ลืมล้างชาม หรือกินหกไม่ช่วยเช็ด', severity: 'MEDIUM', color: 'bg-amber-100 text-amber-700 border-amber-250' },
            behavior: { label: '🗣️ พฤติกรรม', text: 'ใช้วาจาในที่สาธารณะไม่เหมะ ลืมลงทะเบียนบันทึกเวลา หรือป่วนทีม', severity: 'HIGH', color: 'bg-orange-100 text-orange-700 border-orange-250' },
            property: { label: '🔨 ของพัง', text: 'สร้างความเสียหายต่อเครื่องใช้ เฟอร์นิเจอร์ หรืออุปกรณ์ไฟฟ้า', severity: 'CRITICAL', color: 'bg-rose-100 text-rose-700 border-rose-250' },
            other: { label: '📝 อื่นๆ', text: 'อื่นๆ นอกเหนือการจัดหมวดหมู่ระบบศาล', severity: 'LOW', color: 'bg-slate-150 text-slate-600 border-slate-200' }
        };
        return list[catId] || { label: catId, text: '', severity: 'LOW', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    };

    const cat = getCategoryDetails(selectedReport.category);
    
    // Read live tribunal configuration parameters from state or game config context
    const tCfg = config?.TRIBUNAL_CONFIG || {
        reward_hp: 10,
        reward_points: 50,
        penalty_hp: 20,
        false_report_penalty_hp: 15
    };

    const handleActionClick = async (decision: 'APPROVE' | 'REJECT') => {
        setIsApplying(decision);
        await onResolve(selectedReport.id, decision, feedback || 'ดำเนินการตัดสินโดยผู้ดูแลระบบศาลวินัย');
        setIsApplying(null);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/30 overflow-hidden">
            {/* Header section specifying detail index */}
            <div className="p-5 border-b bg-white flex items-center justify-between shrink-0">
                <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-indigo-500 font-bold block">CASE RECORD NO: {selectedReport.id.substring(0, 8).toUpperCase()}</span>
                    <h3 className="text-xs text-slate-800 font-bold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> แฟ้มพิจารณาสำนวนวินัย (Tribunal Inspector)
                    </h3>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded border ${
                    selectedReport.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200/50' : 
                    selectedReport.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-250/50 animate-pulse' : 
                    'bg-rose-50 text-rose-600 border-rose-200/50'
                } font-bold`}>
                    • คดี{selectedReport.status === 'PENDING' ? 'กำลังสืบพยาน' : selectedReport.status === 'APPROVED' ? 'ลงทัณฑ์เรียบร้อย' : 'ปัดหลักฐานทิ้ง'}
                </span>
            </div>

            {/* Core scroll content space */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* Visual relationship panel: reporter -> target */}
                <div className="bg-white border text-left p-4 rounded-3xl shadow-3xs flex flex-col sm:flex-row items-center gap-4 justify-between">
                    {/* Reporter card block */}
                    <div className="flex items-center gap-2 text-left w-full sm:w-auto">
                        {selectedReport.is_anonymous ? (
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shadow-3xs">
                                🕵️
                            </div>
                        ) : reporter?.avatarUrl ? (
                            <img src={reporter.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-250" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                                {reporterName.charAt(0)}
                            </div>
                        )}
                        <div>
                            <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">ผู้เปิดแฟ้มฟ้อง</span>
                            <h4 className="text-xs text-slate-850 font-bold">{reporterName}</h4>
                            <p className="text-[9px] text-slate-400">Position: {reporter?.position || 'Creative'}</p>
                        </div>
                    </div>

                    {/* Arrow center icon */}
                    <div className="text-slate-300 font-extrabold text-sm hidden sm:block">➔</div>

                    {/* Target card block */}
                    <div className="flex items-center gap-2 p-2 relative bg-rose-50/50 border border-rose-100 rounded-2xl text-left w-full sm:w-auto">
                        {target?.avatarUrl ? (
                            <img src={target.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-rose-200" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-500 text-xs font-bold">
                                {targetName.charAt(0)}
                            </div>
                        )}
                        <div>
                            <span className="text-[8px] uppercase font-bold text-rose-500 tracking-wider">ผู้ถูกยื่นเรื่องประพฤติ</span>
                            <h4 className="text-xs text-rose-950 font-bold">{targetName}</h4>
                            <p className="text-[9px] text-rose-450">Level {target?.level || 1} • HP: {target?.hp ?? 100}/{target?.maxHp || 100}</p>
                        </div>
                    </div>
                </div>

                {/* Categories description info */}
                <div className="bg-white border rounded-3xl p-4 space-y-2.5 shadow-3xs text-left">
                    <div className="flex justify-between items-center">
                        <span className={`font-bold px-2.5 py-0.5 rounded-lg border text-[10px] ${cat.color}`}>{cat.label}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">ระดับวินัย: {cat.severity} Severity</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 italic bg-slate-50/40 p-3 border border-slate-100 rounded-xl leading-relaxed">
                        "{selectedReport.description}"
                    </p>
                    <span className="text-[9px] text-slate-450 block italic">"{cat.text}"</span>
                </div>

                {/* Linked evidence block */}
                {selectedReport.evidence_url && (
                    <div className="bg-white border rounded-3xl p-4 space-y-2 shadow-3xs text-left">
                        <h4 className="text-[11px] text-slate-800 font-bold flex items-center gap-1">
                            📂 ลิงก์แฟ้มหลักฐานที่ใช้ชี้ความจริง (Drive Artifacts)
                        </h4>
                        <a 
                            href={selectedReport.evidence_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 p-2.5 bg-indigo-50/50 text-indigo-600 rounded-xl text-[11px] font-bold hover:bg-indigo-100/50 transition-colors border border-indigo-100"
                        >
                            <span className="truncate max-w-[280px]">ลิงก์แนบแนก: {selectedReport.evidence_url}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                        </a>
                    </div>
                )}

                {/* Gamification Simulator logic */}
                <div className="bg-white border rounded-3xl p-5 space-y-3 shadow-3xs text-left">
                    <h4 className="text-[11px] text-slate-850 flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-indigo-500" />
                        สมดุลระบบคิดคำนวณการลงตรายารรางวัล (Gamification Mechanics)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                        {/* If resolve as APPROVED */}
                        <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">🟢 หากอนุมัติฟ้องร้อง (Approve)</span>
                            <div className="text-[10px] text-slate-600 space-y-1">
                                <p>• ผู้ฟ้องร้องคดี: <strong className="text-emerald-700 font-bold">ได้รับ +{tCfg.reward_hp} HP , +{tCfg.reward_points} แต้ม JP</strong></p>
                                <p>• ผู้ถูกฟ้องร้อง: <strong className="text-rose-700 font-bold">ได้รับโทษหัก -{tCfg.penalty_hp} HP</strong></p>
                            </div>
                        </div>

                        {/* If resolve as REJECTED */}
                        <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-2xl space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-rose-600 tracking-wider">🔴 หากตีตกพยานเท็จ (Reject)</span>
                            <div className="text-[10px] text-slate-600 space-y-1">
                                <p>• ผู้ส่งเรื่องเท็จ: <strong className="text-rose-700 font-bold">ถูกหักโทษ -{tCfg.false_report_penalty_hp} HP (ฟ้องเท็จ)</strong></p>
                                <p>• ผู้ถูกฟ้องร้อง: <strong className="text-slate-500">ไม่มีผลกระทบใดๆ เพิ่มเติม</strong></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form feedback decision core block */}
                <div className="space-y-2 text-left">
                    <h4 className="text-[11px] text-slate-500 flex items-center gap-1 font-bold">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        บันทึกแนบเหตุผลตัดสินคดีความ (Admin Verdict Feedback)
                    </h4>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="พิมพ์ส่งเหตุผล หรือให้คำติชมสำหรับกรณีนี้แก่พนักงาน..."
                        className="w-full p-4 bg-white border border-slate-200 rounded-3xl text-xs bg-white text-slate-800 placeholder-slate-400 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[90px] resize-none"
                    />

                    {/* Prebuilt Quick Feedback templates */}
                    <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-450 uppercase tracking-wider font-bold">คำลงลายลักษณ์ด่วน (Admin Quick Feedback Templates)</span>
                        <div className="flex flex-wrap gap-1 text-left">
                            {quickFeedbackTemplates.map((tpl, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setFeedback(tpl)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[9.5px] font-semibold transition-all hover:scale-99"
                                >
                                    แม่พิมพ์ {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Actions control button row */}
            <div className="p-4 border-t bg-white flex items-center justify-between gap-4 shrink-0">
                <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs transition-colors font-bold"
                >
                    พับคำตัดสิน
                </button>

                <div className="flex items-center gap-2">
                    {/* Disapproval / Reject button */}
                    <button
                        onClick={() => handleActionClick('REJECT')}
                        disabled={isProcessing || isApplying !== null || selectedReport.status !== 'PENDING'}
                        className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs transition-all font-bold disabled:opacity-[0.4] active:scale-98"
                    >
                        {isApplying === 'REJECT' ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <X className="w-3.5 h-3.5" />
                        )}
                        คัดค้าน/ฟ้องกลับเท็จ (-{tCfg.false_report_penalty_hp} HP)
                    </button>

                    {/* Approval / Approve button */}
                    <button
                        onClick={() => handleActionClick('APPROVE')}
                        disabled={isProcessing || isApplying !== null || selectedReport.status !== 'PENDING'}
                        className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs transition-all font-bold shadow-sm hover:shadow-emerald-500/10 disabled:opacity-[0.4] active:scale-98"
                    >
                        {isApplying === 'APPROVE' ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Check className="w-3.5 h-3.5" />
                        )}
                        ตัดสินลงดาบอนุมัติฟ้อง (-{tCfg.penalty_hp} HP)
                    </button>
                </div>
            </div>

        </div>
    );
};

export default TribunalRequestsInspector;

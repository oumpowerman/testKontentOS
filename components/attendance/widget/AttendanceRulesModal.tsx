import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Clock, ShieldCheck, AlertTriangle, History, FileText, 
    LogOut, CheckCircle, Zap, MapPin, CalendarHeart, Ghost, 
    TrendingDown, ArrowRightCircle, Sparkles
} from 'lucide-react';
import { useGameConfig } from '../../../context/GameConfigContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { DEFAULT_GAME_CONFIG } from '../../../lib/gameLogic';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// --- Sub-components ---

const StatBadge = ({ type, value }: { type: 'XP' | 'HP' | 'COIN', value: number }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    const prefix = isPositive ? '+' : '';
    
    let colorClass = '';
    if (type === 'XP') colorClass = 'bg-gradient-to-b from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';
    if (type === 'HP') colorClass = isPositive ? 'bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]' : 'bg-gradient-to-b from-rose-50 to-rose-100 text-rose-700 border-rose-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';
    if (type === 'COIN') colorClass = isPositive ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]' : 'bg-gradient-to-b from-orange-50 to-orange-100 text-orange-700 border-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClass} shadow-sm`}>
            {prefix}{value} {type}
        </span>
    );
};

const RuleCard = ({ 
    icon: Icon, 
    title, 
    description, 
    colorTheme, 
    stats,
    delay = 0
}: { 
    icon: any, 
    title: string, 
    description: React.ReactNode, 
    colorTheme: 'emerald' | 'rose' | 'orange' | 'purple' | 'blue' | 'indigo' | 'yellow',
    stats?: { xp?: number, hp?: number, coins?: number },
    delay?: number
}) => {
    const themeMap = {
        emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/60 text-emerald-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(16,185,129,0.1)]',
        rose: 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/60 text-rose-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(244,63,94,0.1)]',
        orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/60 text-orange-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(249,115,22,0.1)]',
        purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/60 text-purple-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(168,85,247,0.1)]',
        blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60 text-blue-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(59,130,246,0.1)]',
        indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200/60 text-indigo-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(99,102,241,0.1)]',
        yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200/60 text-yellow-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(234,179,8,0.1)]',
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.01, y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)" }}
            className="bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/60 border-t-white rounded-2xl p-4 shadow-sm transition-all"
        >
            <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${themeMap[colorTheme]}`}>
                    <Icon className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 text-base drop-shadow-sm">{title}</h3>
                        {stats && (
                            <div className="flex flex-wrap gap-1 justify-end">
                                {stats.xp !== undefined && <StatBadge type="XP" value={stats.xp} />}
                                {stats.hp !== undefined && <StatBadge type="HP" value={stats.hp} />}
                                {stats.coins !== undefined && <StatBadge type="COIN" value={stats.coins} />}
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed font-medium">
                        {description}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const SectionHeader = ({ title, icon: Icon, color }: { title: string, icon: any, color: string }) => (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0 top-0 bg-slate-50/90 backdrop-blur-md py-2 z-10 border-b border-gray-200/60 shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)]">
        <Icon className={`w-5 h-5 ${color} drop-shadow-sm`} />
        <h2 className={`font-bold text-lg ${color} drop-shadow-sm`}>{title}</h2>
    </div>
);

// --- Main Modal ---

const AttendanceRulesModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'DAILY' | 'CORRECTION' | 'SYSTEM'>('DAILY');
    const { config } = useGameConfig();
    const { masterOptions } = useMasterData();

    if (!isOpen) return null;

    // Extract dynamic values
    const rules = config?.ATTENDANCE_RULES || {};
    const penalties = config?.PENALTY_RATES || {};
    const autoJudge = config?.AUTO_JUDGE_CONFIG || {};

    const startTime = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
    const lateBuffer = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER')?.label || '15';
    const minHours = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MIN_HOURS')?.label || '9';

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                    onClick={onClose} 
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 sm:p-8 text-white relative shrink-0 overflow-hidden shadow-[inset_0_-10px_20px_-10px_rgba(0,0,0,0.2)]">
                        {/* Static Background Elements for 3D depth */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-10 -mb-10 blur-2xl" />

                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors z-20 backdrop-blur-md shadow-inner"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-3 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.1)] border border-white/30 relative">
                                <ShieldCheck className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-100 drop-shadow-sm flex items-center gap-2">
                                    คู่มือกฎกติกา
                                </h2>
                                <p className="text-indigo-50 text-sm sm:text-base font-medium opacity-90 drop-shadow-sm">
                                    ระบบลงเวลาและบทลงโทษอัตโนมัติ
                                </p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mt-6 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { id: 'DAILY', label: 'การลงเวลาปกติ', icon: Clock },
                                { id: 'CORRECTION', label: 'การลืม & แก้ไข', icon: History },
                                { id: 'SYSTEM', label: 'ระบบอัตโนมัติ', icon: Zap }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                                        activeTab === tab.id 
                                        ? 'bg-gradient-to-b from-white to-slate-50 text-indigo-600 shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_-2px_0_rgba(0,0,0,0.05)] border border-white/50' 
                                        : 'bg-white/10 text-white hover:bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-transparent'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 sm:p-6 overflow-y-auto overscroll-none bg-slate-50/50 flex-1 relative">
                        
                        {/* Tab 1: DAILY */}
                        {activeTab === 'DAILY' && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                <SectionHeader title="การเข้างาน (Check-in)" icon={Clock} color="text-emerald-600" />
                                <RuleCard 
                                    icon={CheckCircle} colorTheme="emerald" title="เข้างานตรงเวลา" delay={0.1}
                                    stats={{ xp: rules.ON_TIME?.xp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.ON_TIME.xp, coins: rules.ON_TIME?.coins || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.ON_TIME.coins }}
                                    description={
                                        <span>
                                            ตอกบัตรเข้างานก่อนเวลา <span className="font-bold text-emerald-600">{startTime} น.</span> (อนุโลมสายได้ {lateBuffer} นาที) จะได้รับโบนัสความตรงต่อเวลา
                                        </span>
                                    }
                                />
                                <RuleCard 
                                    icon={TrendingDown} colorTheme="orange" title="เข้างานสาย" delay={0.2}
                                    stats={{ hp: rules.LATE?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.LATE.hp }}
                                    description="ตอกบัตรหลังเวลาเริ่มงาน (รวมเวลาผ่อนผันแล้ว) จะถูกหัก HP ทันที"
                                />
                                
                                <SectionHeader title="การขาดงาน (Absence)" icon={AlertTriangle} color="text-rose-600" />
                                <RuleCard 
                                    icon={Ghost} colorTheme="rose" title="ขาดงาน (Absent)" delay={0.3}
                                    stats={{ hp: rules.ABSENT?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.ABSENT.hp, coins: rules.ABSENT?.coins || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.ABSENT.coins }}
                                    description="ไม่มีการตอกบัตรเข้างานในวันที่มีกะงาน ระบบจะลงสถานะขาดงานเมื่อหมดวัน (เช็คย้อนหลังอัตโนมัติ)"
                                />
                                <RuleCard 
                                    icon={ShieldCheck} colorTheme="rose" title="หายตัวไปเลย (No Show)" delay={0.4}
                                    stats={{ hp: rules.NO_SHOW?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.NO_SHOW.hp, coins: rules.NO_SHOW?.coins || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.NO_SHOW.coins }}
                                    description="ขาดงานโดยไม่แจ้งล่วงหน้า หรือติดต่อไม่ได้ ถือเป็นความผิดร้ายแรง"
                                />

                                <SectionHeader title="สถานที่ทำงาน (Locations)" icon={MapPin} color="text-blue-600" />
                                <RuleCard 
                                    icon={MapPin} colorTheme="blue" title="เข้าออฟฟิศ (On-Site)" delay={0.5}
                                    stats={{ xp: rules.SITE?.xp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.SITE.xp, coins: rules.SITE?.coins || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.SITE.coins }}
                                    description="ตอกบัตรเข้าทำงานที่ออฟฟิศ จะได้รับโบนัสพิเศษมากกว่าปกติ"
                                />
                                <RuleCard 
                                    icon={Clock} colorTheme="indigo" title="ชั่วโมงการทำงาน" delay={0.6}
                                    description={
                                        <span>
                                            ต้องทำงานให้ครบ <span className="font-bold text-indigo-600">{minHours} ชั่วโมง</span> ต่อวัน หรือกดออกหลังเวลาเลิกงานที่กำหนด
                                        </span>
                                    }
                                />
                            </motion.div>
                        )}

                        {/* Tab 2: CORRECTION */}
                        {activeTab === 'CORRECTION' && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                <SectionHeader title="การลืมตอกบัตร (Forgot Punches)" icon={LogOut} color="text-purple-600" />
                                <RuleCard 
                                    icon={LogOut} colorTheme="purple" title="ลืมตอกบัตรออกข้ามวัน" delay={0.1}
                                    stats={{ hp: rules.FORGOT_CHECKOUT?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.FORGOT_CHECKOUT.hp }}
                                    description={
                                        <span>
                                            หากเข้างานแต่ <span className="font-bold text-purple-600">ลืมตอกบัตรออกจนข้ามวัน (เลยเที่ยงคืน)</span> ระบบจะทำการหักคะแนนอัตโนมัติฐานสะเพร่า
                                        </span>
                                    }
                                />
                                <RuleCard 
                                    icon={History} colorTheme="emerald" title="ขอคืนคะแนน (Refund)" delay={0.2}
                                    stats={{ hp: rules.CORRECTION_REFUND?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.CORRECTION_REFUND.hp }}
                                    description={
                                        <span>
                                            เมื่อส่งคำขอ "แจ้งเวลาออกย้อนหลัง" และ Admin อนุมัติ จะได้รับคืน <span className="font-bold text-emerald-600">{rules.CORRECTION_REFUND?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.CORRECTION_REFUND.hp} HP</span> (สรุปคือเสีย {Math.abs((rules.FORGOT_CHECKOUT?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.FORGOT_CHECKOUT.hp) + (rules.CORRECTION_REFUND?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.CORRECTION_REFUND.hp))} HP เป็นค่าปรับความสะเพร่า)
                                        </span>
                                    }
                                />

                                <SectionHeader title="เงื่อนไขการส่งคำขอ" icon={FileText} color="text-indigo-600" />
                                <RuleCard 
                                    icon={Clock} colorTheme="orange" title="กฎ 3 วันทำการ (3-Day Rule)" delay={0.3}
                                    description={
                                        <span>
                                            การส่งคำขอแก้ไขเวลา <span className="font-bold text-orange-600">ควรทำภายใน 3 วันทำการ</span> เพื่อรับสิทธิ์คืน HP หากเกินกำหนดจะยังสามารถส่งได้เพื่อความถูกต้องของชั่วโมงทำงาน แต่จะไม่มีการคืน HP/คะแนน
                                        </span>
                                    }
                                />
                                <RuleCard 
                                    icon={ArrowRightCircle} colorTheme="blue" title="การคืนคะแนนขาดงาน" delay={0.4}
                                    stats={{ hp: Math.abs(rules.ABSENT_REFUND?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.ABSENT_REFUND.hp) }}
                                    description={
                                        <span>
                                            หากถูกระบบหัก HP จากการขาดงาน แต่ต่อมาส่งคำขอแก้เวลาเข้างานและได้รับการอนุมัติ ระบบจะคืน HP ให้ <span className="font-bold text-blue-600">{Math.abs(rules.ABSENT_REFUND?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.ABSENT_REFUND.hp)} HP</span> (สรุปคือเสีย {Math.abs((rules.ABSENT?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.ABSENT.hp) + (rules.ABSENT_REFUND?.hp || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES.ABSENT_REFUND.hp))} HP เป็นค่าปรับความล่าช้าในการแจ้ง)
                                        </span>
                                    }
                                />
                            </motion.div>
                        )}

                        {/* Tab 3: SYSTEM */}
                        {activeTab === 'SYSTEM' && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                <SectionHeader title="ระบบผู้คุมกฎ (Auto-Judge)" icon={Zap} color="text-yellow-600" />
                                
                                <RuleCard 
                                    icon={AlertTriangle} colorTheme="rose" title="ยกเลิกคำขออัตโนมัติ (Auto-Reject)" delay={0.1}
                                    description={
                                        <span>
                                            คำขอแก้ไขเวลาที่ค้างอยู่ในระบบ <span className="font-bold text-rose-600">นานเกิน 7 วัน</span> โดยที่ Admin ยังไม่ได้ตรวจสอบ ระบบจะทำการยกเลิกอัตโนมัติ กรุณาติดตามผลกับ Admin
                                        </span>
                                    }
                                />
                                
                                <RuleCard 
                                    icon={FileText} colorTheme="indigo" title="การบันทึกประวัติ (Audit Trail)" delay={0.2}
                                    description={
                                        <span>
                                            ทุกการแก้ไขสถานะจาก "ขาดงาน" เป็น "มาทำงาน" ระบบจะประทับตรา <span className="font-bold text-indigo-600">[ORIGINALLY: ABSENT]</span> ไว้ในบันทึกเสมอ เพื่อความโปร่งใส
                                        </span>
                                    }
                                />

                                <RuleCard 
                                    icon={CalendarHeart} colorTheme="emerald" title="การลา (Leaves)" delay={0.3}
                                    description="การลาป่วย ลากิจ หรือลาพักร้อนที่ได้รับการอนุมัติ จะไม่ถูกหักคะแนนใดๆ และถือเป็นวันทำงานที่มีสิทธิ์ได้รับอนุญาต"
                                />

                                <RuleCard 
                                    icon={Zap} colorTheme="orange" title="การละเลยเวรทำความสะอาด" delay={0.4}
                                    stats={{ hp: -(autoJudge.negligence_penalty_hp || 20) }}
                                    description={
                                        <span>
                                            หากปล่อยเวรทิ้งไว้จนเวรรอบใหม่มาถึง (เกิน {autoJudge.negligence_threshold_days || 1} วัน) ระบบจะหักคะแนนฐาน <span className="font-bold text-orange-600">"เพิกเฉยต่อหน้าที่"</span> และเคลียร์เวรเก่าทิ้งอัตโนมัติ
                                        </span>
                                    }
                                />
                            </motion.div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-6 border-t border-gray-200/60 bg-white shrink-0 relative z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                        <button 
                            onClick={onClose}
                            className="w-full py-3.5 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-[0_4px_15px_rgba(79,70,229,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 border border-indigo-700/50"
                        >
                            <CheckCircle className="w-5 h-5 drop-shadow-sm" />
                            <span className="drop-shadow-sm">รับทราบและเข้าใจกฎกติกา</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default AttendanceRulesModal;


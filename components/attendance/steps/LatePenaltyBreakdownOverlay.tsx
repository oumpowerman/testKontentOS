import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ArrowRight, Heart, Activity, ShieldAlert, Zap } from 'lucide-react';
import { useGameConfig } from '../../../context/GameConfigContext';
import { useUserSession } from '../../../context/UserSessionContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { DEFAULT_GAME_CONFIG } from '../../../lib/gameLogic';
import { BRAND_CONFIG } from '../../../config/brand';

// 1 = โหมดเดิม (แสดงหลอดเลือด HP / คำนวณพลังชีวิตจาก 100 เหลือ 0 / แสดงคำเตือนตัวละครตาย)
// 2 = โหมดใหม่ (ซ่อนหลอดเลือด HP / เน้นแสดงจำนวนคะแนนโทษที่โดนหักสะสม เพื่อรองรับระบบเริ่มต้นที่ 0 และสะสมติดลบ)
const HP_DISPLAY_MODE = 2 as number; // สลับเป็น 1 หรือ 2 ได้ตามต้องการ

interface LatePenaltyBreakdownOverlayProps {
    startTime: string;
    lateMinutes: number;
    onConfirm: () => void;
    onGoBack: () => void;
}

const LatePenaltyBreakdownOverlay: React.FC<LatePenaltyBreakdownOverlayProps> = ({
    startTime,
    lateMinutes,
    onConfirm,
    onGoBack,
}) => {
    const { config } = useGameConfig();
    const { currentUserProfile } = useUserSession();
    const { masterOptions } = useMasterData();

    // Safely get penalty rates and attendance rules
    const penalties = config?.PENALTY_RATES || DEFAULT_GAME_CONFIG.PENALTY_RATES;
    const attendanceRules = config?.ATTENDANCE_RULES || DEFAULT_GAME_CONFIG.ATTENDANCE_RULES;

    const lateModeDynamic = penalties.LATE_MODE_DYNAMIC !== undefined ? penalties.LATE_MODE_DYNAMIC : 0;
    const baseFlatPenalty = Math.abs(attendanceRules?.LATE?.hp !== undefined ? attendanceRules.LATE.hp : 5);
    
    const interval = penalties.HP_PENALTY_LATE_INTERVAL || 10;
    const rate = penalties.HP_PENALTY_LATE_RATE || 1;

    // Retrieve 4-stage late rule configurations dynamically
    const cfg4 = React.useMemo(() => {
        if (!masterOptions || masterOptions.length === 0) {
            return (BRAND_CONFIG as any).fourStageLateConfig || {
                stage1MaxMins: 5,
                stage2MaxMins: 30,
                stage3MaxMins: 60,
                stage4BaseHp: 300,
                hpPerMinuteRate: 1
            };
        }
        const stage1MaxOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE1_MAX');
        const stage2MaxOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE2_MAX');
        const stage3MaxOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE3_MAX');
        const stage4BaseHpOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE4_BASE_HP');
        const hpPerMinuteRateOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_HP_PER_MINUTE');

        return {
            stage1MaxMins: stage1MaxOpt ? Number(stage1MaxOpt.label) : 5,
            stage2MaxMins: stage2MaxOpt ? Number(stage2MaxOpt.label) : 30,
            stage3MaxMins: stage3MaxOpt ? Number(stage3MaxOpt.label) : 60,
            stage4BaseHp: stage4BaseHpOpt ? Number(stage4BaseHpOpt.label) : 300,
            hpPerMinuteRate: hpPerMinuteRateOpt ? Number(hpPerMinuteRateOpt.label) : 1
        };
    }, [masterOptions]);

    const isFourStageActive = React.useMemo(() => {
        if (!masterOptions || masterOptions.length === 0) {
            return (BRAND_CONFIG as any).enableFourStageLateRules ?? true;
        }
        const enableOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'ENABLE_FOUR_STAGE_LATE');
        return enableOpt ? enableOpt.label === 'true' : ((BRAND_CONFIG as any).enableFourStageLateRules ?? true);
    }, [masterOptions]);

    // Calculate penalty value based on 4-stage rules if active
    let penaltyValue = 0;

    if (isFourStageActive) {
        const activeRate = penalties.HP_PENALTY_LATE_RATE || cfg4.hpPerMinuteRate || 1;

        if (lateMinutes <= (cfg4.stage1MaxMins || 5)) {
            penaltyValue = 0;
        } else if (lateMinutes <= (cfg4.stage2MaxMins || 30)) {
            penaltyValue = lateMinutes * activeRate;
        } else if (lateMinutes <= (cfg4.stage3MaxMins || 60)) {
            penaltyValue = lateMinutes * activeRate;
        } else {
            const basePenalty = cfg4.stage4BaseHp || 300;
            penaltyValue = basePenalty + (lateMinutes * activeRate);
        }
    } else {
        penaltyValue = lateModeDynamic === 1 
            ? Math.ceil(lateMinutes / interval) * rate 
            : baseFlatPenalty;
    }

    // HP levels
    const currentHp = currentUserProfile?.hp ?? 100;
    const maxHp = currentUserProfile?.maxHp ?? 100;
    const predictedHp = currentHp - penaltyValue; // Support negative values

    // Clamped values for visual progress bar percentages to prevent CSS bugs
    const visualCurrentHp = Math.max(0, Math.min(maxHp, currentHp));
    const visualPredictedHp = Math.max(0, Math.min(maxHp, predictedHp));

    const currentHpPercent = (visualCurrentHp / maxHp) * 100;
    const predictedHpPercent = (visualPredictedHp / maxHp) * 100;
    const damagePercent = currentHpPercent - predictedHpPercent;

    // Get current time string
    const currentTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md flex flex-col justify-between p-6 overflow-y-auto"
        >
            <div className="flex-1 flex flex-col justify-center space-y-5 my-auto max-w-md mx-auto w-full">
                {/* Header Icon */}
                <div className="flex flex-col items-center text-center space-y-2">
                    <motion.div 
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                        className="bg-rose-50 p-3.5 rounded-2xl border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm"
                    >
                        <ShieldAlert className="w-8 h-8" />
                    </motion.div>
                    <h3 className="text-lg font-extrabold text-gray-800">สรุปโทษการเข้างานสาย ⏰</h3>
                    <p className="text-xs text-gray-400">โปรดตรวจสอบรายละเอียดการหักแต้มวินัยก่อนกดยืนยัน</p>
                </div>

                {/* 1. Lateness Status Card */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">เวลาเริ่มงานของคุณ:</span>
                        <span className="font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">{startTime} น.</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">เวลาเช็คอินปัจจุบัน:</span>
                        <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">{currentTimeStr}</span>
                    </div>
                    <div className="h-[1px] bg-gray-200/60 my-1" />
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" /> ระยะเวลาที่สาย:
                        </span>
                        <span className="text-sm font-black text-rose-600 animate-pulse">สาย {lateMinutes} นาที</span>
                    </div>
                </div>

                {/* 2. Active Penalty Policy Banner */}
                {isFourStageActive ? (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-bl-xl text-[8px] font-bold tracking-wider uppercase">
                            4-Stage Rule Active
                        </div>
                        <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5 mb-1">
                            <Zap className="w-4 h-4 text-red-600 animate-pulse" /> นโยบายคำนวณสายแบบ 4 ระดับ
                        </h4>
                        <p className="text-[11px] text-red-700 leading-normal">
                            ระบบกำลังทำงานในกฎการเข้าสายแบบแบ่งเกณฑ์ตามขั้นสะสมรายนาที เพื่อความเป็นระเบียบและวินัยสูงสุด
                        </p>
                    </div>
                ) : (
                    lateModeDynamic === 1 ? (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 bg-purple-500 text-white rounded-bl-xl text-[8px] font-bold tracking-wider uppercase">
                                Dynamic Mode
                            </div>
                            <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5 mb-1">
                                <Zap className="w-4 h-4 text-purple-600" /> นโยบายหักคะแนนรายนาทีจริง
                            </h4>
                            <p className="text-[11px] text-purple-700 leading-normal">
                                ยิ่งสายมาก ยิ่งโดนหักมาก โดยระบบจะคำนวณหัก <span className="font-bold text-purple-900">{rate} HP ทุกๆ {interval} นาที</span> ที่มาสายจริง
                            </p>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-4 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 bg-blue-600 text-white rounded-bl-xl text-[8px] font-bold tracking-wider uppercase">
                                Flat Mode
                            </div>
                            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                                <Activity className="w-4 h-4 text-blue-600" /> นโยบายหักคะแนนคงที่
                            </h4>
                            <p className="text-[11px] text-blue-700 leading-normal">
                                ระบบจะหักคะแนนคงที่ทันทีเมื่อตรวจพบว่าสาย โดยไม่สนใจจำนวนนาทีที่เกิน <span className="font-bold text-blue-900">(-{baseFlatPenalty} HP ต่อครั้ง)</span>
                            </p>
                        </div>
                    )
                )}

                {/* 3. Detailed Calculation */}
                {isFourStageActive ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 text-left">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">วิเคราะห์สูตรคำนวณ (กฎ 4 ขั้น)</span>
                        <div className="space-y-1.5 text-xs text-gray-600">
                            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                                <span className={lateMinutes <= (cfg4.stage1MaxMins || 5) ? "font-bold text-emerald-600" : ""}>🟢 1 - {cfg4.stage1MaxMins || 5} นาที (ขั้น 1):</span>
                                <span className={lateMinutes <= (cfg4.stage1MaxMins || 5) ? "font-bold text-emerald-600 font-mono" : "font-mono text-gray-400"}>หัก 0 HP</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                                <span className={(lateMinutes >= ((cfg4.stage1MaxMins || 5) + 1) && lateMinutes <= (cfg4.stage2MaxMins || 30)) ? "font-bold text-amber-600" : ""}>🟡 {(cfg4.stage1MaxMins || 5) + 1} - {cfg4.stage2MaxMins || 30} นาที (ขั้น 2):</span>
                                <span className={(lateMinutes >= ((cfg4.stage1MaxMins || 5) + 1) && lateMinutes <= (cfg4.stage2MaxMins || 30)) ? "font-bold text-amber-600 font-mono" : "font-mono text-gray-400"}>หักนาทีละ {cfg4.hpPerMinuteRate || 1} HP</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                                <span className={(lateMinutes >= ((cfg4.stage2MaxMins || 30) + 1) && lateMinutes <= (cfg4.stage3MaxMins || 60)) ? "font-bold text-orange-600" : ""}>🟠 {(cfg4.stage2MaxMins || 30) + 1} - {cfg4.stage3MaxMins || 60} นาที (ขั้น 3):</span>
                                <span className={(lateMinutes >= ((cfg4.stage2MaxMins || 30) + 1) && lateMinutes <= (cfg4.stage3MaxMins || 60)) ? "font-bold text-orange-600 font-mono" : "font-mono text-gray-400"}>หักนาทีละ {cfg4.hpPerMinuteRate || 1} HP + ชดเชยเวลา</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                                <span className={lateMinutes >= ((cfg4.stage3MaxMins || 60) + 1) ? "font-bold text-red-600 animate-pulse" : ""}>🔴 {((cfg4.stage3MaxMins || 60) + 1)} นาทีขึ้นไป (ขั้น 4):</span>
                                <span className={lateMinutes >= ((cfg4.stage3MaxMins || 60) + 1) ? "font-bold text-red-600 font-mono" : "font-mono text-gray-400"}>ปรับ {cfg4.stage4BaseHp || 300} HP + นาทีละ {cfg4.hpPerMinuteRate || 1} HP</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex justify-between font-bold text-gray-800 font-mono text-xs">
                                <span>คำนวณจริง (สาย {lateMinutes} นาที):</span>
                                <span className="text-rose-600 font-black">-{penaltyValue} HP</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 text-left">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">สมการคำนวณผลลัพธ์</span>
                        {lateModeDynamic === 1 ? (
                            <div className="space-y-1.5 font-mono text-xs">
                                <div className="flex justify-between text-gray-500">
                                    <span>สูตร: ปัดขึ้น(นาทีสาย / ช่วงนาที) * อัตรา</span>
                                    <span className="text-purple-600">Math.ceil(M / {interval}) * {rate}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-700">
                                    <span>คำนวณจริง: ปัดขึ้น({lateMinutes} / {interval}) * {rate}</span>
                                    <span className="text-rose-600">-{penaltyValue} HP</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1.5 font-mono text-xs">
                                <div className="flex justify-between text-gray-500">
                                    <span>สูตร: อัตราคงที่สำหรับสถานะสาย</span>
                                    <span className="text-blue-600">Flat Rate</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-700">
                                    <span>คำนวณจริง: โทษสายคงที่</span>
                                    <span className="text-rose-600">-{penaltyValue} HP</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. HP Damage Preview (RPG Style / Penalty Accumulator) */}
                <div className="bg-rose-50/40 border border-rose-100/60 rounded-2xl p-4 space-y-3">
                    {HP_DISPLAY_MODE === 1 ? (
                        // === [โหมด 1: แบบแสดงหลอดเลือดเดิม] ===
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                    <Heart className="w-4 h-4 text-red-500 fill-red-500" /> ผลกระทบต่อพลังชีวิต (HP)
                                </span>
                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                                    <span className="text-gray-500">{currentHp}</span>
                                    <span className="text-rose-500">➔ -{penaltyValue}</span>
                                    {predictedHp <= 0 ? (
                                        <span className="text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 animate-bounce">
                                            💀 {predictedHp} HP
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                            {predictedHp} HP
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* RPG HP bar visualization */}
                            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                                {/* Shaded/Damage animation bar */}
                                <div 
                                    style={{ width: `${currentHpPercent}%` }} 
                                    className="absolute top-0 left-0 h-full bg-rose-300 rounded-full transition-all duration-500" 
                                />
                                {/* Solid Remaining Health bar */}
                                <div 
                                    style={{ width: `${predictedHpPercent}%` }} 
                                    className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-500" 
                                />
                                {/* Text inside the bar */}
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-gray-800 drop-shadow-sm font-mono z-10">
                                    HP: {predictedHp} / {maxHp}
                                </span>
                            </div>
                            {predictedHp <= 0 ? (
                                <span className="block text-[10px] text-center text-rose-600 font-extrabold animate-pulse">
                                    ⚠️ คำเตือน: พลังชีวิตของท่านหมดลงแล้ว! ตัวละครจะอยู่ในสถานะหมดสภาพ (Defeated)
                                </span>
                            ) : (
                                <span className="block text-[10px] text-center text-red-500/80 font-medium">
                                    *หาก HP ของท่านหมดเป็น 0 ตัวละครจะเสียชีวิตและสูญเสียคะแนนสะสมบางส่วน!
                                </span>
                            )}
                        </>
                    ) : (
                        // === [โหมด 2: แบบใหม่ซ่อนหลอดเลือด เน้นติดลบคะแนนสะสม] ===
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" /> โทษหักคะแนนวินัยสะสม
                                </span>
                                <div className="flex items-center gap-1.5 font-mono text-sm font-black text-rose-600">
                                    <span>หัก {penaltyValue} แต้ม</span>
                                </div>
                            </div>
                            
                            <div className="h-[1px] bg-rose-200/40 my-1" />
                            
                            <span className="block text-[10.5px] text-center text-rose-700 font-medium leading-relaxed bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                                📌 โทษหักคะแนนนี้จะถูกหักสะสมเข้าไปยังประวัติวินัยการเช็คอินโดยอัตโนมัติ เพื่อประเมินผลงานประจำสัปดาห์
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 pt-4 border-t border-gray-100 bg-white space-y-2.5 max-w-md mx-auto w-full">
                <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onConfirm}
                    className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>กดยอมรับโทษ และเช็คอินต่อ</span>
                    <ArrowRight className="w-4 h-4" />
                </motion.button>
                
                <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onGoBack}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                    ย้อนกลับไปเปลี่ยนประเภทงาน
                </motion.button>
            </div>
        </motion.div>
    );
};

export default LatePenaltyBreakdownOverlay;

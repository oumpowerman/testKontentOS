import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap } from 'lucide-react';

interface CommandCenterStatsDeskProps {
    riskColor: string;
    riskLabel: string;
    contentPercent: number;
    taskPercent: number;
    isNudging: boolean;
    onTriggerNudge: () => void;
}

export const CommandCenterStatsDesk: React.FC<CommandCenterStatsDeskProps> = ({
    riskColor,
    riskLabel,
    contentPercent,
    taskPercent,
    isNudging,
    onTriggerNudge,
}) => {
    return (
        <div className="p-4 md:p-5 border-b border-slate-200/50 bg-white/70">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                ความเสี่ยงสะสมระบบ (System Health Index)
            </div>

            {/* Risk Badge card */}
            <div className={`p-3 rounded-2xl border flex flex-col gap-2.5 transition-all ${riskColor}`}>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide">สถานะปัจจุบัน</span>
                    <span className="text-[11px] font-bold">{riskLabel}</span>
                </div>

                {/* Segmented mini progress bar ratio */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
                        <span>คอนเทนต์ {contentPercent}%</span>
                        <span>งานทั่วไป {taskPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div 
                            className="h-full bg-purple-500 transition-all duration-500" 
                            style={{ width: `${contentPercent}%` }} 
                        />
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${taskPercent}%` }} 
                        />
                    </div>
                </div>
            </div>

            {/* Dispatch / Nudge Action Trigger desk */}
            <div className="mt-4">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onTriggerNudge}
                    disabled={isNudging}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isNudging ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    )}
                    {isNudging ? 'กำลังส่งข้อมูลแจ้งเตือน...' : 'เร่งด่วน! ส่งพิกัดแจ้งเตือนสมาชิก (Nudge)'}
                </motion.button>
                <p className="text-[9px] text-slate-400 font-semibold mt-1.5 text-center leading-normal">
                    เมื่อกด ระบบจะส่งพิกัดแจ้งเตือนงานค้างทั้งหมดไปยัง Line Notify และช่องทางติดต่อหลักของแผนกทันที
                </p>
            </div>
        </div>
    );
};

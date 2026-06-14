
import React from 'react';
import { Skull, Ban, ArrowRight } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import { Duty, ViewMode } from '../../../../types';

interface AbandonedStateProps {
    abandonedDuty: Duty;
    onFixNegligence?: (duty: Duty) => void;
    onNavigate: (view: ViewMode) => void;
}

const AbandonedState: React.FC<AbandonedStateProps> = ({ abandonedDuty, onFixNegligence, onNavigate }) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysIgnored = differenceInCalendarDays(today, new Date(abandonedDuty.date));

    return (
        <div className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl h-full flex flex-col justify-between items-center text-center group border-4 border-red-500/35 animate-in fade-in">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-900/40 rounded-full blur-3xl animate-pulse"></div>

            <div className="relative z-10 flex flex-col items-center gap-5 w-full my-auto">
                <div className="w-16 h-16 bg-red-950/80 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-red-500/50 shadow-inner shrink-0 relative animate-pulse">
                    <Skull className="w-8 h-8 text-red-500" />
                    <div className="absolute -top-2.5 -right-2.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-slate-950">
                        {daysIgnored} DAYS
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-red-500/20">
                            <Ban className="w-3.5 h-3.5 text-red-500" /> Neglected Duty
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-rose-100 mb-2 leading-none">
                        ทิ้งเวรมา {daysIgnored} วันแล้ว!
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold max-w-[240px] leading-relaxed">
                        คุณลืมทำเวรติดต่อกันหลายวัน หากเพิกเฉยต่อเวรครั้งหน้า ระบบความปลอดภัยกิลด์จะเปิดการลงทัณฑ์
                    </p>
                </div>
            </div>

            <button 
                onClick={() => onFixNegligence ? onFixNegligence(abandonedDuty) : onNavigate('DUTY')}
                className="relative z-10 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-900/20 transition-all active:scale-95 w-full text-center border-t border-red-400"
            >
                ยอมรับผิดและเคลียร์ <ArrowRight className="w-4 h-4"/>
            </button>
        </div>
    );
};

export default AbandonedState;


import React from 'react';
import { Ghost, Skull, ShieldAlert, HeartOff } from 'lucide-react';
import { ViewMode } from '../../../../types';

interface DeadStateProps {
    onNavigate: (view: ViewMode) => void;
}

const DeadState: React.FC<DeadStateProps> = ({ onNavigate }) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl h-full flex flex-col justify-between items-center text-center group border-4 border-slate-800 animate-in fade-in zoom-in-95 duration-500">
            {/* Dark Atmosphere */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-800/30 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-950/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center gap-5 w-full my-auto">
                <div className="w-20 h-20 bg-slate-900/80 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border-2 border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] shrink-0 relative animate-[bounce_3s_infinite]">
                    <Ghost className="w-10 h-10 text-red-500 opacity-80" />
                    <div className="absolute -bottom-2 -right-2 bg-slate-800 text-red-500 p-1.5 rounded-xl border border-slate-600 shadow-lg">
                        <HeartOff className="w-4 h-4" />
                    </div>
                </div>
                
                <div className="flex flex-col items-center animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/20 shadow-sm flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> DECEASED (0 HP)
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-2">
                        คุณเสียชีวิตแล้ว... 👻
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-[240px]">
                        แต้ม HP หมดเกลี้ยง! สิทธิ์การทำเควสและเข้าเวรถูกระงับชั่วคราว กรุณาติดต่อหัวหน้ากิลด์เพื่อขอชุบชีวิต
                    </p>
                </div>
            </div>

            <button 
                onClick={() => onNavigate('LEADERBOARD')}
                className="relative z-10 flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-sm transition-all active:scale-95 border border-slate-700 w-full text-center"
            >
                <Skull className="w-4 h-4 text-red-400"/> ดูทำเนียบผู้กล้า
            </button>
        </div>
    );
};

export default DeadState;


import React from 'react';
import { Ghost, Skull, ShieldAlert, HeartOff } from 'lucide-react';
import { ViewMode } from '../../../../types';

interface DeadStateProps {
    onNavigate: (view: ViewMode) => void;
}

const DeadState: React.FC<DeadStateProps> = ({ onNavigate }) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl h-full flex flex-col justify-center group border-4 border-slate-800/50 animate-in fade-in zoom-in-95 duration-500">
            {/* Dark Atmosphere */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-800/30 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="w-20 h-20 bg-slate-900/80 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border-2 border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] shrink-0 relative">
                        <Ghost className="w-10 h-10 text-slate-400 opacity-60 animate-bounce duration-[3000ms]" />
                        <div className="absolute -bottom-1 -right-1 bg-slate-800 text-slate-300 p-1.5 rounded-xl border border-slate-600 shadow-lg">
                            <HeartOff className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-slate-700 shadow-sm flex items-center gap-1.5">
                                <ShieldAlert className="w-3 h-3" /> Status: DECEASED (0 HP)
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold tracking-tighter leading-none mb-1.5 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
                            คุณเสียชีวิตแล้ว... 👻
                        </h3>
                        <p className="text-slate-400 text-sm font-medium leading-tight max-w-[280px]">
                            แต้ม HP ของคุณหมดลงแล้ว ระบบระงับหน้าที่ชั่วคราว <br/>
                            <span className="text-indigo-400/80">กรุณาติดต่อ Admin เพื่อขอชุบชีวิตครับ</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-48">
                    <button 
                        onClick={() => onNavigate('LEADERBOARD')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-sm transition-all active:scale-95 border border-slate-700/50 backdrop-blur-sm"
                    >
                        <Skull className="w-4 h-4 opacity-70"/> ดูทำเนียบผู้กล้า
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeadState;

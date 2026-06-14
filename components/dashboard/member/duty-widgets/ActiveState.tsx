
import React from 'react';
import { Gamepad2, Sparkles, ArrowRight } from 'lucide-react';
import { Duty, User, ViewMode } from '../../../../types';

interface ActiveStateProps {
    myDuty: Duty;
    onNavigate: (view: ViewMode) => void;
}

const ActiveState: React.FC<ActiveStateProps> = ({ myDuty, onNavigate }) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-500 rounded-[2.5rem] p-8 text-white shadow-lg shadow-orange-100 h-full flex flex-col justify-between items-center text-center group border-4 border-white animate-in fade-in">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

            <div className="relative z-10 flex flex-col items-center gap-5 w-full my-auto">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner shrink-0 scale-105">
                    <Gamepad2 className="w-9 h-9 text-white drop-shadow-md animate-pulse" />
                </div>

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-yellow-400 text-yellow-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center border border-yellow-300/40">
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-950" /> Daily Quest
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 leading-none">
                        ภารกิจของคุณวันนี้!
                    </h3>
                    <p className="text-orange-50 text-xs font-bold bg-black/10 px-4 py-2 rounded-xl border border-white/10 max-w-[240px] truncate">
                        {myDuty.title}
                    </p>
                </div>
            </div>

            <button 
                onClick={() => onNavigate('DUTY')}
                className="relative z-10 flex items-center justify-center gap-2 px-6 py-4 bg-white text-orange-600 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-orange-50 transition-all active:scale-95 w-full text-center"
            >
                🚀 ส่งภารกิจ <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default ActiveState;

import React from 'react';
import { RacetrackActiveUser } from '../types';

interface RaceTrackCompactTop3Props {
    checkedInRacers: RacetrackActiveUser[];
}

export const RaceTrackCompactTop3: React.FC<RaceTrackCompactTop3Props> = ({ checkedInRacers }) => {
    return (
        <div className="lg:col-span-3 border-2 border-slate-900 bg-[#f8f9fa] rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-center min-h-[145px] relative z-20 overflow-hidden">
            {/* Background subtle retro grid accent */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
            
            <div className="flex items-center justify-between gap-2 mb-3 relative z-10 border-b-2 border-slate-900 pb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm select-none">🏆</span>
                    <span className="font-sans text-[11px] font-black text-slate-800 uppercase tracking-wider">
                        ผู้มาถึงออฟฟิศเร็วที่สุด 3 อันดับแรกวันนี้
                    </span>
                </div>
                <span className="font-mono text-[9px] font-bold text-slate-400 uppercase select-none">Top 3 Early Birds</span>
            </div>

            {checkedInRacers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 bg-white border-2 border-dashed border-slate-200 rounded-xl relative z-10">
                    <span className="text-xl mb-1 select-none">💤</span>
                    <span className="font-sans text-[10px] text-slate-400 font-bold">ยังไม่มีผู้เช็คอินในระบบของวันนี้</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                    {checkedInRacers.slice(0, 3).map((racer, index) => {
                        const rankBg = index === 0 ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                     : index === 1 ? 'bg-slate-100 text-slate-950 border-slate-300'
                                     : 'bg-orange-100 text-orange-950 border-orange-300';
                        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                        
                        return (
                            <div 
                                key={`compact-top-${racer.user.id}`}
                                className="flex items-center gap-3 p-3 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-50 border-2 border-slate-900 flex items-center justify-center text-2xl shrink-0 select-none shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                                    {racer.user.emoji || '🏃'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[8px] font-black px-1 py-0.2 rounded border ${rankBg} leading-none`}>
                                            {rankEmoji} อันดับที่ {index + 1}
                                        </span>
                                        <span className="text-[10px] font-mono text-emerald-600 font-black shrink-0">{racer.checkInTime}</span>
                                    </div>
                                    <h4 className="font-sans text-xs font-black text-slate-900 truncate mt-1">
                                        {racer.user.name}
                                    </h4>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

import React from 'react';
import { RacetrackActiveUser } from '../types';

interface RacerTooltipProps {
    racer: RacetrackActiveUser;
    safeIndex: number;
    pctPosition: number; // either startPct or targetPct
    bottomY: number; // the bottom value of the racer
}

export const RacerTooltip: React.FC<RacerTooltipProps> = ({ racer, safeIndex, pctPosition, bottomY }) => {
    const isNearTop = bottomY > 95;
    
    // Horizontal shifting to prevent clipping on the left/right screen edges
    const horizontalStyle = pctPosition < 30 
        ? { left: '0%', transform: 'none' } 
        : pctPosition > 70 
            ? { right: '0%', left: 'auto', transform: 'none' } 
            : { left: '50%', transform: 'translateX(-50%)' };

    // Vertical shifting to prevent clipping at the top
    const verticalStyle = isNearTop
        ? { top: '100%', marginTop: '8px' }
        : { bottom: '100%', marginBottom: '8px' };

    const combinedStyle = { ...horizontalStyle, ...verticalStyle };

    return (
        <div 
            className="absolute hidden group-hover:flex items-center gap-2.5 bg-white text-slate-800 p-2.5 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-slate-100/90 pointer-events-none z-[10000] whitespace-nowrap w-max min-w-max"
            style={combinedStyle}
        >
            {racer.user.avatarUrl ? (
                <img 
                    src={racer.user.avatarUrl} 
                    alt={racer.user.name} 
                    className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-sm" 
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-sans text-xs font-black text-slate-400">
                    {racer.user.name.charAt(0).toUpperCase()}
                </div>
            )}
            <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[10px] font-black text-slate-800 tracking-tight">{racer.user.name}</span>
                    {racer.isCheckedIn && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono text-[7px] font-black border border-amber-500/20">
                            #{racer.checkInOrder}
                        </span>
                    )}
                </div>
                <span className="text-[8.5px] text-slate-400 font-bold mt-1">
                    {racer.isCheckedIn 
                        ? `ลู่วิ่งที่: ${safeIndex + 1} | บันทึกเช็คอิน: ${racer.checkInTime} น.`
                        : `ยังไม่ได้ลงเวลา (ลู่วิ่งที่ ${safeIndex + 1})`
                    }
                </span>
            </div>
        </div>
    );
};

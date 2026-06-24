import React from 'react';
import { RacetrackActiveUser } from '../types';
import { getPositionGroup } from '../utils';

interface RacerTooltipProps {
    racer: RacetrackActiveUser;
    safeIndex: number;
    pctPosition: number; // either startPct or targetPct
    bottomY: number; // the bottom value of the racer
}

const getLeaveLabel = (type: string) => {
    switch (type) {
        case 'SICK': return 'ลาป่วย 🤒';
        case 'VACATION': return 'ลาพักร้อน ✈️';
        case 'PERSONAL': return 'ลากิจ 💼';
        case 'EMERGENCY': return 'ลาฉุกเฉิน 🚨';
        case 'WFH': return 'ทำงานที่บ้าน 🏠';
        case 'UNPAID': return 'ลาไม่รับค่าจ้าง 🔇';
        default: return 'ขอลาหยุด ⏳';
    }
};

export const RacerTooltip: React.FC<RacerTooltipProps> = ({ racer, safeIndex, pctPosition, bottomY }) => {
    const isNearTop = racer.isCheckedIn ? false : (bottomY > 95);
    
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

    const group = getPositionGroup(racer.user.position);

    return (
        <div 
            className="absolute hidden group-hover:flex flex-col gap-2 bg-white text-slate-800 p-3 rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.18)] border-2 border-slate-900 pointer-events-none z-[10000] whitespace-nowrap w-max min-w-[210px]"
            style={combinedStyle}
        >
            <div className="flex items-center gap-2.5">
                {racer.user.avatarUrl ? (
                    <img 
                        src={racer.user.avatarUrl} 
                        alt={racer.user.name} 
                        className="w-10 h-10 rounded-xl object-cover border-2 border-slate-900 shadow-sm" 
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-slate-900 flex items-center justify-center font-sans text-xs font-black text-slate-500 shadow-sm">
                        {racer.user.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-xs font-black text-slate-900 tracking-tight">{racer.user.name}</span>
                        {racer.isCheckedIn && (
                            <span className="px-1.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono text-[7.5px] font-black border border-indigo-700 shadow-sm">
                                #{racer.checkInOrder}
                            </span>
                        )}
                    </div>
                    {/* Position / Section Tag */}
                    <div className="flex items-center gap-1 mt-1">
                        <span className={`px-1.5 py-0.2 rounded font-sans text-[7.5px] font-black border leading-none ${group.textStyles}`}>
                            {group.emoji} {group.name}
                        </span>
                        {racer.user.position && (
                            <span className="text-[7.5px] text-slate-500 font-bold max-w-[80px] truncate">
                                • {racer.user.position}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Interactive Banners inside Tooltip for status highlights */}
            <div className="flex flex-col gap-1 border-t border-dashed border-slate-200 pt-2 text-left">
                <span className="text-[8.5px] text-slate-500 font-extrabold flex items-center justify-between">
                    <span>ลู่วิ่งแผนกที่: {safeIndex + 1}</span>
                    <span className="font-mono text-slate-450 font-black">LANE #{safeIndex + 1}</span>
                </span>
                
                <span className="text-[8.5px] text-slate-700 font-bold mt-0.5">
                    ⏱️ บันทึกวันนี้: {' '}
                    <span className="font-black text-slate-900">
                        {racer.isCheckedIn 
                            ? `เช็คอินเมื่อ ${racer.checkInTime} น.`
                            : `ยังไม่ได้เช็คอิน`
                        }
                    </span>
                </span>

                {/* Leaves Highlights */}
                {racer.activeLeave && (
                    <div className={`mt-1 text-[8px] font-extrabold px-2 py-1 rounded-xl flex flex-col gap-0.5 border ${
                        racer.activeLeave.status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                            : 'bg-amber-50 text-amber-700 border-amber-250'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                                📬 {getLeaveLabel(racer.activeLeave.type)}
                            </span>
                            <span className="text-[6.5px] px-1 py-0.2 rounded font-mono uppercase bg-white/65 shadow-sm">
                                {racer.activeLeave.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                            </span>
                        </div>
                        {racer.activeLeave.reason && (
                            <span className="text-[7.5px] text-slate-505 italic line-clamp-1">
                                "{racer.activeLeave.reason}"
                            </span>
                        )}
                    </div>
                )}

                {/* Late Check-in Highlight */}
                {racer.isCheckedIn && racer.status === 'LATE' && (
                    <div className="mt-1 text-[8px] font-black px-2 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 animate-pulse">
                        <span className="text-xs">⏱️</span>
                        <div className="flex flex-col">
                            <span>มาสายเกินกำหนดเวลา</span>
                            <span className="text-[6.5px] text-rose-500 font-bold leading-tight">บันทึกอยู่ในประวัติใบเตือน</span>
                        </div>
                    </div>
                )}

                {/* Action Required Highlight */}
                {racer.isCheckedIn && racer.status === 'ACTION_REQUIRED' && (
                    <div className="mt-1 text-[8px] font-black px-2 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-255 flex items-center gap-1.5">
                        <span className="text-xs">⚠️</span>
                        <div className="flex flex-col">
                            <span>ข้อมูลเวลาผิดปกติ!</span>
                            <span className="text-[6.5px] text-orange-500 font-bold leading-tight">โปรดติดต่อ HR เพื่อชี้แจงแก้ไข</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

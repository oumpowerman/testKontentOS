import React from 'react';
import { RacetrackActiveUser } from './types';

interface RaceTrackHeaderProps {
    checkedInRacers: RacetrackActiveUser[];
}

export const RaceTrackHeader: React.FC<RaceTrackHeaderProps> = ({ checkedInRacers }) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2 mb-4">
            <div className="flex items-center gap-2">
                <span className="text-lg">🏃‍♂️</span>
                <div>
                    <h3 className="font-sans font-black text-slate-900 text-sm tracking-wide uppercase">สนามเดินสายลงเวลาประจำวัน</h3>
                    <p className="text-[10px] text-slate-500 font-bold">พนักงานเข้างานคนแรกนอนรอที่เส้นชัยเดอะวินเนอร์!</p>
                </div>
            </div>
            {checkedInRacers.length > 0 && (
                <div className="px-2.5 py-0.5 border border-slate-900 rounded-full text-[10px] text-slate-900 font-black flex items-center gap-1.5">
                    <span>👑</span>
                    <span>{checkedInRacers[0].user.name} นำร่องคนแรกวันนี้!</span>
                </div>
            )}
        </div>
    );
};

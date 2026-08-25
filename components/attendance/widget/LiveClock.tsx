import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Heart } from 'lucide-react';
import { BRAND_CONFIG } from '../../../config/brand';

interface LiveClockProps {
    hp?: number;
}

const LiveClock: React.FC<LiveClockProps> = ({ hp }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getHpBadge = (val: number) => {
        const hpMode = BRAND_CONFIG.hpDisplayMode ?? 1;
        const isFriendlyMode = hpMode === 2;
        const label = isFriendlyMode ? `${val}` : `${val} HP`;

        if (val >= 80) {
            return {
                className: "bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm",
                icon: <Heart className="w-3 h-3 fill-emerald-500 text-emerald-500 animate-pulse" />,
                label
            };
        } else if (val >= 31) {
            return {
                className: "bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm",
                icon: <Heart className="w-3 h-3 fill-amber-500 text-amber-500" />,
                label
            };
        } else if (val > 0) {
            return {
                className: "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm",
                icon: <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />,
                label
            };
        } else {
            if (isFriendlyMode) {
                return {
                    className: "bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm",
                    icon: <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />,
                    label
                };
            } else {
                return {
                    className: "bg-slate-900 text-red-400 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-bounce px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5",
                    icon: <span className="text-[10px]">💀</span>,
                    label
                };
            }
        }
    };

    const hpValue = hp !== undefined ? hp : 100;
    const badge = getHpBadge(hpValue);
    const showHp = BRAND_CONFIG.showLiveClockHpMode !== 2;

    return (
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span>ลงเวลาทำงาน</span>
                    {showHp && (
                        <div className={`${badge.className} inline-flex items-center`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                        </div>
                    )}
                </h3>
                <p className="text-gray-400 text-xs mt-1 font-mono">
                    {format(time, 'EEEE, d MMM yyyy')}
                </p>
            </div>
            <div className="text-right">
                <p className="text-3xl font-bold text-gray-800 tracking-tight font-mono">
                    {format(time, 'HH:mm')}
                    <span className="text-sm text-gray-400 ml-1">{format(time, 'ss')}</span>
                </p>
            </div>
        </div>
    );
};

export default LiveClock;

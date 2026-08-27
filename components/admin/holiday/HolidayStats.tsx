import React from 'react';
import { CalendarDays, Sunset, Coffee } from 'lucide-react';

interface HolidayStatsProps {
    totalCount: number;
    monthStats: { name: string; count: number; label?: string };
    typeBreakdown: { label: string; count: number };
    onCurrentMonthClick?: () => void;
}

const HolidayStats: React.FC<HolidayStatsProps> = ({ totalCount, monthStats, typeBreakdown, onCurrentMonthClick }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/70 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shrink-0">
                    <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">วันหยุดทั้งหมด</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-slate-800">{totalCount}</span>
                        <span className="text-xs text-slate-500 font-bold">วัน / ปี</span>
                    </div>
                </div>
            </div>

            <div 
                onClick={onCurrentMonthClick}
                className="bg-white border border-slate-200/70 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md cursor-pointer hover:border-amber-400/80 active:scale-98 transition-all duration-300"
            >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 shrink-0">
                    <Sunset className="w-6 h-6" />
                </div>
                <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {monthStats.label || "เดือนหยุดพักผ่อนมากที่สุด"}
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-black text-slate-800">{monthStats.name}</span>
                        {monthStats.count > 0 && (
                            <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-full">
                                {monthStats.count} วัน
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200/70 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600 shrink-0">
                    <Coffee className="w-6 h-6" />
                </div>
                <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">ประเภทวันหยุดเด่น</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-black text-slate-800 truncate max-w-[150px]">{typeBreakdown.label}</span>
                        {typeBreakdown.count > 0 && (
                            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {typeBreakdown.count} วัน
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidayStats;

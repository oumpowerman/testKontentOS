
import React, { useEffect } from 'react';
import { Users, Clock, HeartPulse, BarChart3, UserX } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { User } from '../../../types';

interface CounterProps {
    value: number;
    decimals?: number;
}

const Counter: React.FC<CounterProps> = ({ value, decimals = 0 }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => latest.toFixed(decimals));

    useEffect(() => {
        const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
        return controls.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
};

interface DashboardStatsProps {
    totalCheckins: number;
    totalLates: number;
    lateRate: number;
    totalAbsents: number;
    totalLeaves: number;
    activeUsersCount: number;
    activeFilter?: 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
    onFilterChange?: (filter: 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE') => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
    totalCheckins,
    totalLates,
    lateRate,
    totalAbsents,
    totalLeaves,
    activeUsersCount,
    activeFilter = 'ALL',
    onFilterChange
}) => {
    const isDimmed = (filter: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE') => {
        return activeFilter !== 'ALL' && activeFilter !== filter;
    };

    const isActive = (filter: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE') => {
        return activeFilter === filter;
    };

    const handleCardClick = (filter: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE') => {
        if (onFilterChange) {
            onFilterChange(activeFilter === filter ? 'ALL' : filter);
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Check-ins Card */}
            <div 
                onClick={() => handleCardClick('PRESENT')}
                className={`bg-indigo-50 p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-300 ${
                    isActive('PRESENT') 
                        ? 'border-indigo-400 ring-4 ring-indigo-500/10 opacity-100 scale-[1.02]' 
                        : isDimmed('PRESENT')
                            ? 'border-transparent opacity-50 hover:opacity-100'
                            : 'border-indigo-100 opacity-100'
                }`}
            >
                <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Total Check-ins</p>
                    <h3 className="text-3xl font-black text-indigo-900"><Counter value={totalCheckins} /></h3>
                </div>
                <div className={`p-3 rounded-xl transition-all ${isActive('PRESENT') ? 'bg-indigo-500 text-white shadow-inner' : 'bg-white text-indigo-500 shadow-sm'}`}><Users className="w-6 h-6"/></div>
            </div>

            {/* Late Arrivals Card */}
            <div 
                onClick={() => handleCardClick('LATE')}
                className={`bg-orange-50 p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-300 ${
                    isActive('LATE') 
                        ? 'border-orange-400 ring-4 ring-orange-500/10 opacity-100 scale-[1.02]' 
                        : isDimmed('LATE')
                            ? 'border-transparent opacity-50 hover:opacity-100'
                            : 'border-orange-100 opacity-100'
                }`}
            >
                <div>
                    <p className="text-[10px] font-bold text-orange-400 uppercase">Late Arrivals</p>
                    <h3 className="text-3xl font-black text-orange-900">
                        <Counter value={totalLates} /> <span className="text-xs text-orange-400 font-bold">(<Counter value={lateRate} decimals={lateRate % 1 === 0 ? 0 : 1} />%)</span>
                    </h3>
                </div>
                <div className={`p-3 rounded-xl transition-all ${isActive('LATE') ? 'bg-orange-500 text-white shadow-inner' : 'bg-white text-orange-500 shadow-sm'}`}><Clock className="w-6 h-6"/></div>
            </div>

            {/* Total Absents Card */}
            <div 
                onClick={() => handleCardClick('ABSENT')}
                className={`bg-red-50 p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-300 ${
                    isActive('ABSENT') 
                        ? 'border-red-400 ring-4 ring-red-500/10 opacity-100 scale-[1.02]' 
                        : isDimmed('ABSENT')
                            ? 'border-transparent opacity-50 hover:opacity-100'
                            : 'border-red-100 opacity-100'
                }`}
            >
                <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase">Total Absents</p>
                    <h3 className="text-3xl font-black text-red-900"><Counter value={totalAbsents} /></h3>
                </div>
                <div className={`p-3 rounded-xl transition-all ${isActive('ABSENT') ? 'bg-red-500 text-white shadow-inner' : 'bg-white text-red-500 shadow-sm'}`}><UserX className="w-6 h-6"/></div>
            </div>

            {/* Total Leaves Card */}
            <div 
                onClick={() => handleCardClick('LEAVE')}
                className={`bg-pink-50 p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-300 ${
                    isActive('LEAVE') 
                        ? 'border-pink-400 ring-4 ring-pink-500/10 opacity-100 scale-[1.02]' 
                        : isDimmed('LEAVE')
                            ? 'border-transparent opacity-50 hover:opacity-100'
                            : 'border-pink-100 opacity-100'
                }`}
            >
                <div>
                    <p className="text-[10px] font-bold text-pink-400 uppercase">Total Leaves</p>
                    <h3 className="text-3xl font-black text-pink-900"><Counter value={totalLeaves} /></h3>
                </div>
                <div className={`p-3 rounded-xl transition-all ${isActive('LEAVE') ? 'bg-pink-500 text-white shadow-inner' : 'bg-white text-pink-500 shadow-sm'}`}><HeartPulse className="w-6 h-6"/></div>
            </div>
        </div>
    );
};

export default DashboardStats;

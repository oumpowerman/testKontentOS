import React from 'react';
import { motion } from 'framer-motion';

interface UrgentTasksStatsProps {
    id?: string;
    stats: {
        overdue: number;
        today: number;
        upcoming: number;
    };
    activeFilter: 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON';
    onToggleFilter: (filter: 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON') => void;
}

export const UrgentTasksStats: React.FC<UrgentTasksStatsProps> = ({
    id = "urgent-tasks-stats-container",
    stats,
    activeFilter,
    onToggleFilter,
}) => {
    return (
        <div id={id} className="grid grid-cols-3 gap-4 relative z-10">
            <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                id="btn-filter-overdue"
                onClick={() => onToggleFilter('OVERDUE')}
                className={`rounded-2xl p-3 border text-center transition-all cursor-pointer ${activeFilter === 'OVERDUE' ? 'bg-red-100 border-red-300 ring-4 ring-red-500/10' : 'bg-red-50/50 border-white/60 hover:border-red-200'}`}
            >
                <span className={`block text-3xl font-black leading-none mb-1 ${stats.overdue > 0 ? 'text-red-500' : 'text-slate-300'}`}>{stats.overdue}</span>
                <span className="text-[10px] text-red-500 uppercase font-black tracking-widest">Overdue</span>
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                id="btn-filter-today"
                onClick={() => onToggleFilter('TODAY')}
                className={`rounded-2xl p-3 border text-center transition-all cursor-pointer ${activeFilter === 'TODAY' ? 'bg-orange-100 border-orange-300 ring-4 ring-orange-500/10' : 'bg-orange-50/50 border-white/60 hover:border-orange-200'}`}
            >
                <span className="block text-3xl font-black text-orange-500 leading-none mb-1">{stats.today}</span>
                <span className="text-[10px] text-orange-500 uppercase font-black tracking-widest">Today</span>
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                id="btn-filter-soon"
                onClick={() => onToggleFilter('SOON')}
                className={`rounded-2xl p-3 border text-center transition-all cursor-pointer ${activeFilter === 'SOON' ? 'bg-yellow-100 border-yellow-300 ring-4 ring-yellow-500/10' : 'bg-yellow-50/50 border-white/60 hover:border-yellow-200'}`}
            >
                <span className="block text-3xl font-black text-yellow-500 leading-none mb-1">{stats.upcoming}</span>
                <span className="text-[10px] text-yellow-600 uppercase font-black tracking-widest">Soon</span>
            </motion.button>
        </div>
    );
};

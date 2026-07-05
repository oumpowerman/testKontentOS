import React from 'react';
import { motion } from 'framer-motion';
import { Filter, Clock, UserX, HeartPulse, Zap } from 'lucide-react';

export type FilterType = 'ALL' | 'LATE' | 'ABSENT' | 'LEAVE' | 'OT';

interface DetailModalFilterGridProps {
    activeFilter: FilterType;
    setActiveFilter: (filter: FilterType) => void;
    isScrolled: boolean;
    stats: {
        present: number;
        late: number;
        absent: number;
        leaves: number;
        otHours: number;
    };
}

export const DetailModalFilterGrid: React.FC<DetailModalFilterGridProps> = ({
    activeFilter,
    setActiveFilter,
    isScrolled,
    stats
}) => {
    return (
        <motion.div 
            animate={{ 
                marginTop: isScrolled ? '12px' : '24px' 
            }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-5 gap-2"
        >
            {/* ALL Button */}
            <motion.button 
                onClick={() => setActiveFilter('ALL')}
                animate={{
                    padding: isScrolled ? '6px 4px' : '10px 4px',
                    borderRadius: isScrolled ? '1.0rem' : '1.5rem'
                }}
                transition={{ duration: 0.3 }}
                className={`transition-all flex flex-col items-center justify-center border-2 ${
                    activeFilter === 'ALL' 
                        ? 'bg-white border-indigo-200 shadow-md' 
                        : 'bg-white/40 border-transparent hover:bg-white/60'
                }`}
            >
                <div className="flex items-center gap-1">
                    <Filter className={`w-3.5 h-3.5 ${activeFilter === 'ALL' ? 'text-indigo-500' : 'text-slate-400'}`} />
                    {isScrolled && (
                        <span className={`text-xs font-black ${activeFilter === 'ALL' ? 'text-slate-800' : 'text-slate-400'}`}>
                            {stats.present}
                        </span>
                    )}
                </div>
                {!isScrolled && (
                    <>
                        <span className={`text-base font-black ${activeFilter === 'ALL' ? 'text-slate-800' : 'text-slate-400'}`}>{stats.present}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">All Days</span>
                    </>
                )}
            </motion.button>

            {/* LATE Button */}
            <motion.button 
                onClick={() => setActiveFilter('LATE')}
                animate={{
                    padding: isScrolled ? '6px 4px' : '10px 4px',
                    borderRadius: isScrolled ? '1.0rem' : '1.5rem'
                }}
                transition={{ duration: 0.3 }}
                className={`transition-all flex flex-col items-center justify-center border-2 ${
                    activeFilter === 'LATE' 
                        ? 'bg-amber-50 border-amber-200 shadow-md' 
                        : 'bg-white/40 border-transparent hover:bg-amber-50/50'
                }`}
            >
                <div className="flex items-center gap-1">
                    <Clock className={`w-3.5 h-3.5 ${activeFilter === 'LATE' ? 'text-amber-500' : 'text-amber-300'}`} />
                    {isScrolled && (
                        <span className={`text-xs font-black ${activeFilter === 'LATE' ? 'text-amber-600' : 'text-amber-300'}`}>
                            {stats.late}
                        </span>
                    )}
                </div>
                {!isScrolled && (
                    <>
                        <span className={`text-base font-black ${activeFilter === 'LATE' ? 'text-amber-600' : 'text-amber-300'}`}>{stats.late}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Late</span>
                    </>
                )}
            </motion.button>

            {/* ABSENT Button */}
            <motion.button 
                onClick={() => setActiveFilter('ABSENT')}
                animate={{
                    padding: isScrolled ? '6px 4px' : '10px 4px',
                    borderRadius: isScrolled ? '1.0rem' : '1.5rem'
                }}
                transition={{ duration: 0.3 }}
                className={`transition-all flex flex-col items-center justify-center border-2 ${
                    activeFilter === 'ABSENT' 
                        ? 'bg-rose-50 border-rose-200 shadow-md' 
                        : 'bg-white/40 border-transparent hover:bg-rose-50/50'
                }`}
            >
                <div className="flex items-center gap-1">
                    <UserX className={`w-3.5 h-3.5 ${activeFilter === 'ABSENT' ? 'text-rose-500' : 'text-rose-300'}`} />
                    {isScrolled && (
                        <span className={`text-xs font-black ${activeFilter === 'ABSENT' ? 'text-rose-600' : 'text-rose-300'}`}>
                            {stats.absent}
                        </span>
                    )}
                </div>
                {!isScrolled && (
                    <>
                        <span className={`text-base font-black ${activeFilter === 'ABSENT' ? 'text-rose-600' : 'text-rose-300'}`}>{stats.absent}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Absent</span>
                    </>
                )}
            </motion.button>

            {/* LEAVE Button */}
            <motion.button 
                onClick={() => setActiveFilter('LEAVE')}
                animate={{
                    padding: isScrolled ? '6px 4px' : '10px 4px',
                    borderRadius: isScrolled ? '1.0rem' : '1.5rem'
                }}
                transition={{ duration: 0.3 }}
                className={`transition-all flex flex-col items-center justify-center border-2 ${
                    activeFilter === 'LEAVE' 
                        ? 'bg-sky-50 border-sky-200 shadow-md' 
                        : 'bg-white/40 border-transparent hover:bg-sky-50/50'
                }`}
            >
                <div className="flex items-center gap-1">
                    <HeartPulse className={`w-3.5 h-3.5 ${activeFilter === 'LEAVE' ? 'text-sky-500' : 'text-sky-300'}`} />
                    {isScrolled && (
                        <span className={`text-xs font-black ${activeFilter === 'LEAVE' ? 'text-sky-600' : 'text-sky-300'}`}>
                            {stats.leaves}
                        </span>
                    )}
                </div>
                {!isScrolled && (
                    <>
                        <span className={`text-base font-black ${activeFilter === 'LEAVE' ? 'text-sky-600' : 'text-sky-300'}`}>{stats.leaves}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Leave</span>
                    </>
                )}
            </motion.button>

            {/* OT Button */}
            <motion.button 
                onClick={() => setActiveFilter('OT')}
                animate={{
                    padding: isScrolled ? '6px 4px' : '10px 4px',
                    borderRadius: isScrolled ? '1.0rem' : '1.5rem'
                }}
                transition={{ duration: 0.3 }}
                className={`transition-all flex flex-col items-center justify-center border-2 ${
                    activeFilter === 'OT' 
                        ? 'bg-purple-50 border-purple-200 shadow-md' 
                        : 'bg-white/40 border-transparent hover:bg-purple-50/50'
                }`}
            >
                <div className="flex items-center gap-1">
                    <Zap className={`w-3.5 h-3.5 ${activeFilter === 'OT' ? 'text-purple-500' : 'text-purple-300'}`} />
                    {isScrolled && (
                        <span className={`text-xs font-black ${activeFilter === 'OT' ? 'text-purple-600' : 'text-purple-300'}`}>
                            {stats.otHours.toFixed(1)}
                        </span>
                    )}
                </div>
                {!isScrolled && (
                    <>
                        <span className={`text-base font-black ${activeFilter === 'OT' ? 'text-purple-600' : 'text-purple-300'}`}>
                            {stats.otHours > 0 ? `${stats.otHours.toFixed(1)}` : '0'}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">OT (Hrs)</span>
                    </>
                )}
            </motion.button>
        </motion.div>
    );
};

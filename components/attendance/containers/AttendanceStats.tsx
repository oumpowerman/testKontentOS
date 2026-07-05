
import React, { useState } from 'react';
import { useAttendanceStats } from '../../../hooks/attendance/useAttendanceStats';
import { AttendanceStats as StatsType } from '../../../types/attendance';
import { TrendingUp, Clock, Calendar, AlertCircle, ChevronDown, ChevronUp, Hourglass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceDetailCards from './AttendanceDetailCards';

interface AttendanceStatsProps {
    userId: string;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ userId }) => {
    const { stats, isStatsLoading } = useAttendanceStats(userId);
    const [activeDetail, setActiveDetail] = useState<'LATE' | 'ON_TIME' | 'STREAK' | 'HOURS' | null>(null);

    if (isStatsLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>)}
    </div>;

    const statItems = [
        { key: 'STREAK', label: 'Streak', value: `${stats.currentStreak} วัน`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
        { key: 'HOURS', label: 'ชั่วโมงงาน', value: `${stats.totalHours} ชม.`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
        { key: 'LATE', label: 'มาสาย', value: `${stats.lateDays} ครั้ง`, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
        { key: 'ON_TIME', label: 'มาตรงเวลา', value: `${stats.onTimeDays} วัน`, icon: Calendar, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    const toggleDetail = (key: string) => {
        if (activeDetail === key) {
            setActiveDetail(null);
        } else {
            setActiveDetail(key as any);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statItems.map((item, idx) => (
                    <motion.button 
                        key={idx} 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleDetail(item.key)}
                        className={`
                            p-4 rounded-[2rem] border transition-all flex items-center gap-4 relative group text-left
                            ${activeDetail === item.key 
                                ? `bg-white ${item.border} shadow-xl ring-4 ring-indigo-50/50` 
                                : 'bg-white/60 backdrop-blur-md border-gray-100 shadow-sm hover:bg-white hover:shadow-md'
                            }
                        `}
                    >
                        <div className={`p-3 rounded-2xl ${item.bg} shadow-sm group-hover:scale-110 transition-transform`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{item.label}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xl font-black text-slate-800 tracking-tight">{item.value}</p>
                                {item.key === 'STREAK' && stats.hasPendingStreakRequest && (
                                    <div 
                                        className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200/60 px-1.5 py-0.5 rounded-full text-[9px] font-bold animate-pulse"
                                        title="อยู่ระหว่างรอพิจารณาคำร้องเพื่อรักษา Streak"
                                    >
                                        <Hourglass className="w-2.5 h-2.5 shrink-0" />
                                        <span>Pending</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`absolute top-4 right-4 transition-transform duration-300 ${activeDetail === item.key ? 'rotate-180' : ''}`}>
                            <ChevronDown className={`w-4 h-4 ${activeDetail === item.key ? 'text-indigo-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
                        </div>
                    </motion.button>
                ))}
            </div>

            <AnimatePresence>
                {activeDetail && (
                    <AttendanceDetailCards 
                        logs={stats.monthlyLogs || []} 
                        type={activeDetail} 
                        onClose={() => setActiveDetail(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttendanceStats;

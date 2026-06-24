
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GraduationCap, UserPlus, CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';

interface CounterProps {
    value: number;
}

const Counter: React.FC<CounterProps> = ({ value }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(count, value, { duration: 1, ease: "easeOut" });
        return controls.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
};

interface StatCardProps {
    label: string;
    count: number;
    icon: React.ElementType;
    color: string;
    description: string;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ label, count, icon: Icon, color, description, onClick }) => (
    <div 
        onClick={onClick}
        className={`relative overflow-hidden p-3.5 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-indigo-500/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 group min-h-[7rem] md:h-32 flex flex-col justify-between ${onClick ? 'cursor-pointer' : ''}`}
    >
        {/* Decorative Background Glow */}
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform duration-700 group-hover:scale-150 bg-${color}-500`} />
        
        <div className="flex justify-between items-start relative z-10 gap-2">
            <div className="space-y-0.5 min-w-0">
                <span className="text-xs md:text-[16px] font-kanit font-bold uppercase tracking-normal md:tracking-widest text-gray-400 block truncate">{label}</span>
                <p className="text-[10px] md:text-[12px] font-kanit font-medium text-gray-400/80 italic truncate">{description}</p>
            </div>
            <div className={`p-1.5 md:p-2.5 rounded-xl md:rounded-2xl bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-sm group-hover:rotate-12 transition-transform duration-500 shrink-0`}>
                <Icon className="w-4 h-4" />
            </div>
        </div>
        
        <div className="relative z-10 flex items-baseline gap-1 mt-2 md:mt-0">
            <span className="text-2xl md:text-4xl font-black text-gray-800 tracking-tighter">
                <Counter value={count} />
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase ml-1">คน</span>
        </div>
    </div>
));

interface InternStatsGridProps {
    stats: {
        applied: number;
        interview: number;
        accepted: number;
        rejected: number;
        total: number;
    };
    isLoading?: boolean;
    onStatClick?: (status: any) => void;
    currentFilterLabel?: string;
}

const InternStatsGrid: React.FC<InternStatsGridProps> = ({ stats, isLoading, onStatClick, currentFilterLabel }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    return (
        <div className="space-y-3">
            {/* Toggle Bar */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg shadow-indigo-500/5 hover:bg-white/80 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors duration-300 ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">สถิติภาพรวมอัจฉริยะ</h3>
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                            {currentFilterLabel || 'ตัวกรองปัจจุบัน'} • รวม {stats.total} รายการ
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 mr-2">
                        {[
                            { color: 'bg-indigo-400', val: stats.applied },
                            { color: 'bg-amber-400', val: stats.interview },
                            { color: 'bg-emerald-400', val: stats.accepted }
                        ].map((dot, i) => dot.val > 0 && (
                            <div key={i} className={`w-2 h-2 rounded-full border border-white ${dot.color}`} />
                        ))}
                    </div>
                    <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-indigo-600 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 pt-1 pb-2">
                            {/* Stats Grid */}
                            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ${isLoading ? 'opacity-50 blur-[2px]' : 'opacity-100 blur-0'}`}>
                                <StatCard 
                                    label="ผู้สมัครใหม่" 
                                    count={stats.applied} 
                                    icon={UserPlus} 
                                    color="indigo" 
                                    description="ตามเงื่อนไขการกรอง"
                                    onClick={() => onStatClick?.('APPLIED')}
                                />
                                <StatCard 
                                    label="รอสัมภาษณ์" 
                                    count={stats.interview} 
                                    icon={Clock} 
                                    color="amber" 
                                    description="นัดหมายสัมภาษณ์แล้ว"
                                    onClick={() => onStatClick?.('INTERVIEW_SCHEDULED')}
                                />
                                <StatCard 
                                    label="รับเข้าฝึกงาน" 
                                    count={stats.accepted} 
                                    icon={CheckCircle2} 
                                    color="emerald" 
                                    description="ตามเงื่อนไขการกรอง"
                                    onClick={() => onStatClick?.('ACCEPTED')}
                                />
                                <StatCard 
                                    label="ไม่ผ่านการคัดเลือก" 
                                    count={stats.rejected} 
                                    icon={XCircle} 
                                    color="rose" 
                                    description="ตามเงื่อนไขการกรอง"
                                    onClick={() => onStatClick?.('REJECTED')}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(InternStatsGrid);

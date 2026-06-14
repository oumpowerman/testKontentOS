import React from 'react';
import { X, ChevronLeft, ChevronRight, BatteryCharging } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { th } from 'date-fns/locale';

interface WorkloadHeaderProps {
    currentDate: Date;
    setCurrentDate: (date: Date | ((prev: Date) => Date)) => void;
    weekStart: Date;
    weekEnd: Date;
    onClose: () => void;
}

const WorkloadHeader: React.FC<WorkloadHeaderProps> = ({
    currentDate,
    setCurrentDate,
    weekStart,
    weekEnd,
    onClose
}) => {
    // Get Buddhist year for Thai representation
    const buddhistYear = (d: Date) => d.getFullYear() + 543;

    // Fully Thai formatted range
    const formattedRange = `${format(weekStart, 'd MMM', { locale: th })} - ${format(weekEnd, 'd MMM', { locale: th })} พ.ศ. ${buddhistYear(weekEnd)}`;

    return (
        <div className="bg-slate-900 text-white p-6 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 relative">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                    <BatteryCharging className="w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">ตัวชี้วัดปริมาณงาน</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Workload Monitor — ตรวจสุขภาพการจัดสรรกำลังทีม</p>
                </div>
            </div>

            {/* Date Swiper Selector */}
            <div className="flex items-center gap-3 bg-white/10 p-1.5 rounded-2xl border border-white/10 w-full md:w-auto justify-between md:justify-start">
                <button 
                    onClick={() => setCurrentDate(prev => addWeeks(prev, -1))} 
                    className="p-2 hover:bg-white/15 active:scale-90 rounded-xl transition-all text-white"
                    title="สัปดาห์ก่อนหน้า"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-xs font-extrabold min-w-[170px] text-center text-yellow-400 tracking-tight select-none">
                    {formattedRange}
                </div>
                <button 
                    onClick={() => setCurrentDate(prev => addWeeks(prev, 1))} 
                    className="p-2 hover:bg-white/15 active:scale-90 rounded-xl transition-all text-white"
                    title="สัปดาห์ถัดไป"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Close Button */}
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 md:static p-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 active:scale-95 rounded-full transition-all text-slate-400"
                title="ปิด"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default WorkloadHeader;

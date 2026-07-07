import React, { useEffect } from 'react';
import { Briefcase, Clock, Moon } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

type RequestCategory = 'ALL' | 'LEAVE' | 'LATE_FORGOT' | 'OT';

interface CounterProps {
    value: number;
}

const Counter: React.FC<CounterProps> = ({ value }) => {
    const count = useMotionValue(value);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
        return controls.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
};

interface ApprovalCategorySelectorProps {
    counts: {
        LEAVE: number;
        LATE_FORGOT: number;
        OT: number;
    };
    activeCategory: RequestCategory;
    onCategoryClick: (cat: 'LEAVE' | 'LATE_FORGOT' | 'OT') => void;
    isCategoryDimmed: (cat: 'LEAVE' | 'LATE_FORGOT' | 'OT') => boolean;
}

export const ApprovalCategorySelector: React.FC<ApprovalCategorySelectorProps> = ({
    counts,
    activeCategory,
    onCategoryClick,
    isCategoryDimmed
}) => {
    const isCategoryActive = (cat: 'LEAVE' | 'LATE_FORGOT' | 'OT') => {
        return activeCategory === cat;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* General Leaves Card */}
            <div 
                onClick={() => onCategoryClick('LEAVE')}
                className={`bg-rose-50/70 p-4 md:p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-300 ${
                    isCategoryActive('LEAVE') 
                        ? 'border-rose-400 ring-4 ring-rose-500/10 opacity-100 scale-[1.02]' 
                        : isCategoryDimmed('LEAVE')
                            ? 'border-transparent opacity-40 hover:opacity-100'
                            : 'border-rose-100/80 opacity-100'
                }`}
                id="category-card-leave"
            >
                <div className="space-y-1">
                    <p className="text-xs md:text-sm font-semibold text-rose-600 uppercase tracking-wider">การลาและขอ WFH ทั้งหมด</p>
                    <h3 className="text-2xl md:text-3xl font-black text-rose-950 mt-1">
                        <Counter value={counts.LEAVE} />
                    </h3>
                </div>
                <div className={`p-2.5 md:p-3 rounded-xl transition-all shrink-0 ${isCategoryActive('LEAVE') ? 'bg-rose-500 text-white shadow-inner' : 'bg-white text-rose-500 shadow-sm'}`}>
                    <Briefcase className="w-5 h-5 md:w-6 md:h-6" />
                </div>
            </div>

            {/* Late & Missed Punch Card */}
            <div 
                onClick={() => onCategoryClick('LATE_FORGOT')}
                className={`bg-amber-50/70 p-4 md:p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-300 ${
                    isCategoryActive('LATE_FORGOT') 
                        ? 'border-amber-400 ring-4 ring-amber-500/10 opacity-100 scale-[1.02]' 
                        : isCategoryDimmed('LATE_FORGOT')
                            ? 'border-transparent opacity-40 hover:opacity-100'
                            : 'border-amber-100/80 opacity-100'
                }`}
                id="category-card-late-forgot"
            >
                <div className="space-y-1">
                    <p className="text-xs md:text-sm font-semibold text-amber-600 uppercase tracking-wider">เข้าสาย / ลืมบันทึกเวลา</p>
                    <h3 className="text-2xl md:text-3xl font-black text-amber-950 mt-1">
                        <Counter value={counts.LATE_FORGOT} />
                    </h3>
                </div>
                <div className={`p-2.5 md:p-3 rounded-xl transition-all shrink-0 ${isCategoryActive('LATE_FORGOT') ? 'bg-amber-500 text-white shadow-inner' : 'bg-white text-amber-500 shadow-sm'}`}>
                    <Clock className="w-5 h-5 md:w-6 md:h-6" />
                </div>
            </div>

            {/* Overtime Requests Card */}
            <div 
                onClick={() => onCategoryClick('OT')}
                className={`bg-indigo-50/70 p-4 md:p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-300 ${
                    isCategoryActive('OT') 
                        ? 'border-indigo-400 ring-4 ring-indigo-500/10 opacity-100 scale-[1.02]' 
                        : isCategoryDimmed('OT')
                            ? 'border-transparent opacity-40 hover:opacity-100'
                            : 'border-indigo-100/80 opacity-100'
                }`}
                id="category-card-ot"
            >
                <div className="space-y-1">
                    <p className="text-xs md:text-sm font-semibold text-indigo-600 uppercase tracking-wider">เวลาทำงานล่วงเวลา (OT)</p>
                    <h3 className="text-2xl md:text-3xl font-black text-indigo-950 mt-1">
                        <Counter value={counts.OT} />
                    </h3>
                </div>
                <div className={`p-2.5 md:p-3 rounded-xl transition-all shrink-0 ${isCategoryActive('OT') ? 'bg-indigo-500 text-white shadow-inner' : 'bg-white text-indigo-500 shadow-sm'}`}>
                    <Moon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
            </div>
        </div>
    );
};

export default ApprovalCategorySelector;

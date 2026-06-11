import React from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';

interface CommandCenterHeaderProps {
    totalPendingTasks: number;
    onResetFilters: () => void;
    onClose: () => void;
}

export const CommandCenterHeader: React.FC<CommandCenterHeaderProps> = ({
    totalPendingTasks,
    onResetFilters,
    onClose,
}) => {
    return (
        <div className="bg-white px-4 py-4 md:px-6 md:py-5 border-b border-slate-200/60 relative overflow-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
            {/* Background decorative glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
            
            {/* Primary Branding Brand/Logo Area */}
            <div className="flex items-center gap-2.5 sm:gap-3 relative z-10">
                <span className="p-2 sm:p-3 bg-red-50 text-red-500 rounded-2xl border border-red-100 shadow-sm animate-pulse">
                    <ShieldAlert className="w-5 h-5 sm:w-6 h-6" />
                </span>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-extrabold text-base sm:text-lg md:text-xl text-slate-800 tracking-tight">
                            ศูนย์บัญชาการงานค้างทีม
                        </h2>
                        <span className="text-[10px] sm:text-xs bg-red-100/80 text-red-600 px-2 py-0.5 rounded-full font-extrabold">
                            {totalPendingTasks} งานค้าง
                        </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5">
                        รวมงานชิ้นที่ยังทำไม่เสร็จสิ้น เจาะลึกรายสื่อและรายบุคคล
                    </p>
                </div>
            </div>

            {/* Quick action controllers */}
            <div className="flex items-center gap-2 sm:gap-3 relative z-10 self-end sm:self-auto shrink-0">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onResetFilters}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-indigo-100 transition-all cursor-pointer shadow-sm"
                >
                    ล้างเงื่อนไข
                </motion.button>
                <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full transition-all cursor-pointer"
                    id="btn-close-command-center"
                >
                    <X className="w-4 h-4 sm:w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

import React from 'react';
import { X, Calendar, History as HistoryIcon, Timer, AlertTriangle, Clock } from 'lucide-react';
import { User as UserType } from '../../../types';
import { formatWorkload } from './workloadConstants';

interface WorkloadHeaderProps {
    currentUser: UserType;
    totalHours: number;
    activeTasksCount: number;
    overdueCount: number;
    todayCount: number;
    onOpenHistory?: () => void;
    onClose: () => void;
}

const WorkloadHeader: React.FC<WorkloadHeaderProps> = ({
    currentUser,
    totalHours,
    activeTasksCount,
    overdueCount,
    todayCount,
    onOpenHistory,
    onClose
}) => {
    return (
        <div className="px-4 md:px-8 py-4 md:py-6 bg-indigo-600 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="w-40 h-40" /></div>
            
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-0.5 md:p-1 bg-white/20 rounded-full border border-white/30">
                        <img src={currentUser.avatarUrl} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover bg-white" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-3xl font-bold">สวัสดี, {currentUser.name.split(' ')[0]}! 👋</h2>
                        <p className="text-indigo-100 text-xs md:text-base font-medium mt-0.5 md:mt-1">นี่คือรายการงานที่ค้างอยู่ของคุณ</p>
                    </div>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                    {onOpenHistory && (
                        <button 
                            onClick={onOpenHistory}
                            className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white group"
                            title="ดูประวัติการทำงาน"
                        >
                            <HistoryIcon className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-[-45deg] transition-transform" />
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 md:p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white">
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-2 md:gap-4 mt-4 md:mt-6 overflow-x-auto scrollbar-hide pb-2">
                 {/* Total Hours Badge */}
                <div className="flex items-center gap-2 bg-indigo-500/80 px-4 py-2 rounded-xl border border-indigo-400 backdrop-blur-md text-white whitespace-nowrap">
                    <Timer className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-kanit font-bold">Total Load: {formatWorkload(totalHours)}</span>
                </div>

                <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md whitespace-nowrap">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
                    <span className="text-sm font-kanit font-bold">{activeTasksCount} Active Tasks</span>
                </div>
                {overdueCount > 0 && (
                    <div className="flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-xl border border-red-400 backdrop-blur-md text-white whitespace-nowrap">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-kanit font-bold">{overdueCount} งานล่าช้า</span>
                    </div>
                )}
                {todayCount > 0 && (
                    <div className="flex items-center gap-2 bg-orange-500/80 px-4 py-2 rounded-xl border border-orange-400 backdrop-blur-md text-white whitespace-nowrap">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-bold">{todayCount} ส่งวันนี้</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkloadHeader;

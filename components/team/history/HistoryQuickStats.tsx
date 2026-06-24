import React from 'react';
import { Zap, Target, Clock, AlertTriangle, RotateCcw, BarChart3, Star } from 'lucide-react';

interface HistoryQuickStatsProps {
    stats: {
        totalXp: number;
        totalTasks: number;
        completedTasks: number;
        totalHours: number;
        overdueTasks: number;
        revertCount: number;
        difficultyCounts: {
            EASY: number;
            MEDIUM: number;
            HARD: number;
        };
    };
    isCollapsed?: boolean;
}

const HistoryQuickStats: React.FC<HistoryQuickStatsProps> = ({ stats, isCollapsed }) => {
    const successRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

    const mainStats = [
        { 
            label: 'งานทั้งหมด', 
            value: stats.totalTasks, 
            unit: 'งาน',
            icon: <BarChart3 className="w-5 h-5 text-indigo-500" />, 
            smallIcon: <BarChart3 className="w-4 h-4 text-indigo-500" />,
            sub: 'งานทั้งหมดในระบบ',
            color: 'bg-indigo-50'
        },
        { 
            label: 'ชั่วโมงงาน', 
            value: stats.totalHours, 
            unit: 'ชม.',
            icon: <Clock className="w-5 h-5 text-blue-500" />, 
            smallIcon: <Clock className="w-4 h-4 text-blue-500" />,
            sub: 'เวลาที่ใช้โดยประมาณ',
            color: 'bg-blue-50'
        },
        { 
            label: 'Glory ทั้งหมด', 
            value: stats.totalXp.toLocaleString(), 
            unit: 'XP',
            icon: <Zap className="w-5 h-5 text-amber-500" />, 
            smallIcon: <Zap className="w-4 h-4 text-amber-500" />,
            sub: 'ค่าประสบการณ์ที่ได้รับ',
            color: 'bg-amber-50'
        },
        { 
            label: 'อัตราสำเร็จ', 
            value: successRate, 
            unit: '%',
            icon: <Target className="w-5 h-5 text-emerald-500" />, 
            smallIcon: <Target className="w-4 h-4 text-emerald-500" />,
            sub: 'อัตราการทำงานสำเร็จ',
            color: 'bg-emerald-50'
        },
    ];

    if (isCollapsed) {
        return (
            <div className="bg-white/40 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 overflow-hidden">
                {/* Left group: Main stats with scroll on mobile */}
                <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar pb-2 md:pb-0 border-b md:border-b-0 border-slate-200/50 md:flex-1 w-full">
                    {mainStats.map((item) => (
                        <div key={item.label} className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className={`p-1.5 sm:p-2 ${item.color} rounded-lg sm:rounded-xl`}>
                                {item.smallIcon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 font-mono leading-none mb-1 uppercase tracking-tight">{item.label}</span>
                                <div className="flex items-baseline gap-0.5 sm:gap-1">
                                    <span className="text-sm sm:text-lg font-bold text-slate-800 tabular-nums">{item.value}</span>
                                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-400">{item.unit}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block h-10 w-px bg-slate-200" />

                {/* Right group: difficulty and alerts */}
                <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 shrink-0 w-full md:w-auto">
                    {/* Difficulty Levels */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">ง่าย</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700">{stats.difficultyCounts.EASY}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[9px] font-bold text-amber-500 uppercase tracking-tighter">ปานกลาง</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700">{stats.difficultyCounts.MEDIUM}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[9px] font-bold text-rose-500 uppercase tracking-tighter">ยาก</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-700">{stats.difficultyCounts.HARD}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:py-1.5 bg-rose-50 text-rose-600 rounded-lg sm:rounded-xl border border-rose-100" title="งานล่าช้า">
                             <AlertTriangle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                             <span className="text-[9px] sm:text-[10px] font-bold tabular-nums">{stats.overdueTasks}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:py-1.5 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl border border-amber-100" title="งานถูกส่งกลับ">
                             <RotateCcw className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                             <span className="text-[9px] sm:text-[10px] font-bold tabular-nums">{stats.revertCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const alerts = [
        {
            label: 'งานล่าช้า',
            value: stats.overdueTasks,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: 'text-rose-500 bg-rose-50 border-rose-100'
        },
        {
            label: 'งานถูกส่งกลับ',
            value: stats.revertCount,
            icon: <RotateCcw className="w-4 h-4" />,
            color: 'text-amber-600 bg-amber-50 border-amber-100'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Primary Metrics Grid (2 columns on mobile, 4 columns on large screens) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {mainStats.map((item) => (
                    <div 
                        key={item.label}
                        className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className={`p-1.5 sm:p-2.5 ${item.color} rounded-xl sm:rounded-2xl transition-transform group-hover:scale-110`}>
                                {item.icon}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    {item.label}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-baseline gap-0.5 sm:gap-1">
                            <div className="text-base sm:text-3xl font-bold text-slate-800 tracking-tight">{item.value}</div>
                            <div className="text-[9px] sm:text-xs font-bold text-slate-400">{item.unit}</div>
                        </div>
                        <div className="text-[8px] sm:text-[10px] font-medium text-slate-400 mt-0.5 sm:mt-1 uppercase tracking-wider block truncate">{item.sub}</div>
                    </div>
                ))}
            </div>

            {/* Secondary Insights & Difficulty Breakdown */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                {/* Difficulty Breakdown */}
                <div className="flex-1 bg-slate-50/50 p-4 rounded-2xl sm:rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm self-start sm:self-auto">
                        <Star className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">ระดับความยาก</span>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8 px-2 sm:px-4 flex-1">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ง่าย</span>
                            <span className="text-lg font-bold text-emerald-500">{stats.difficultyCounts.EASY}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ปานกลาง</span>
                            <span className="text-lg font-bold text-amber-500">{stats.difficultyCounts.MEDIUM}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ยาก</span>
                            <span className="text-lg font-bold text-rose-500">{stats.difficultyCounts.HARD}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Alerts */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {alerts.map((alert) => (
                        <div key={alert.label} className={`flex-1 flex items-center gap-3 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl sm:rounded-[2rem] border ${alert.color} shadow-sm group hover:shadow-md transition-all`}>
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                {alert.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest leading-none mb-1">{alert.label}</span>
                                <span className="text-xl font-bold leading-none">{alert.value} <span className="text-[10px] font-bold opacity-60 uppercase ml-0.5">รายการ</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HistoryQuickStats;

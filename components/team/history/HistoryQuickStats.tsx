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
            label: 'Total Scope', 
            value: stats.totalTasks, 
            unit: 'งาน',
            icon: <BarChart3 className="w-5 h-5 text-indigo-500" />, 
            smallIcon: <BarChart3 className="w-4 h-4 text-indigo-500" />,
            sub: 'งานทั้งหมดในระบบ',
            color: 'bg-indigo-50'
        },
        { 
            label: 'Productivity', 
            value: stats.totalHours, 
            unit: 'ชม.',
            icon: <Clock className="w-5 h-5 text-blue-500" />, 
            smallIcon: <Clock className="w-4 h-4 text-blue-500" />,
            sub: 'เวลาที่ใช้โดยประมาณ',
            color: 'bg-blue-50'
        },
        { 
            label: 'Total Glory', 
            value: stats.totalXp.toLocaleString(), 
            unit: 'XP',
            icon: <Zap className="w-5 h-5 text-amber-500" />, 
            smallIcon: <Zap className="w-4 h-4 text-amber-500" />,
            sub: 'ค่าประสบการณ์ที่ได้รับ',
            color: 'bg-amber-50'
        },
        { 
            label: 'Precision', 
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
            <div className="bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-white shadow-sm flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-8 px-4">
                    {mainStats.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 shrink-0">
                            <div className={`p-2 ${item.color} rounded-xl`}>
                                {item.smallIcon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 font-mono leading-none mb-1 uppercase tracking-tight">{item.label}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-slate-800 tabular-nums">{item.value}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{item.unit}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="h-10 w-px bg-slate-200" />

                <div className="flex items-center gap-6 px-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Easy</span>
                            <span className="text-sm font-bold text-slate-700">{stats.difficultyCounts.EASY}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Medium</span>
                            <span className="text-sm font-bold text-slate-700">{stats.difficultyCounts.MEDIUM}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter">Hard</span>
                            <span className="text-sm font-bold text-slate-700">{stats.difficultyCounts.HARD}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                             <AlertTriangle className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-bold tabular-nums">{stats.overdueTasks}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                             <RotateCcw className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-bold tabular-nums">{stats.revertCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const alerts = [
        {
            label: 'Overdue',
            value: stats.overdueTasks,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: 'text-rose-500 bg-rose-50 border-rose-100'
        },
        {
            label: 'Reverts',
            value: stats.revertCount,
            icon: <RotateCcw className="w-4 h-4" />,
            color: 'text-amber-600 bg-amber-50 border-amber-100'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mainStats.map((item) => (
                    <div 
                        key={item.label}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 ${item.color} rounded-2xl transition-transform group-hover:scale-110`}>
                                {item.icon}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    {item.label}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-baseline gap-1">
                            <div className="text-3xl font-bold text-slate-800 tracking-tight">{item.value}</div>
                            <div className="text-xs font-bold text-slate-400">{item.unit}</div>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{item.sub}</div>
                    </div>
                ))}
            </div>

            {/* Secondary Insights & Difficulty Breakdown */}
            <div className="flex flex-wrap gap-4 items-stretch">
                {/* Difficulty Breakdown */}
                <div className="flex-1 min-w-[300px] bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100 flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Star className="w-4 h-4 text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Difficulty Levels</span>
                    </div>
                    
                    <div className="flex items-center gap-8 px-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Easy</span>
                            <span className="text-lg font-bold text-emerald-500">{stats.difficultyCounts.EASY}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Medium</span>
                            <span className="text-lg font-bold text-amber-500">{stats.difficultyCounts.MEDIUM}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hard</span>
                            <span className="text-lg font-bold text-rose-500">{stats.difficultyCounts.HARD}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Alerts */}
                <div className="flex gap-3">
                    {alerts.map((alert) => (
                        <div key={alert.label} className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] border ${alert.color} shadow-sm group hover:shadow-md transition-all`}>
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                {alert.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest leading-none mb-1">{alert.label}</span>
                                <span className="text-xl font-bold leading-none">{alert.value} <span className="text-[10px] font-bold opacity-60 uppercase ml-0.5">Alerts</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HistoryQuickStats;

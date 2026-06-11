import React from 'react';
import { motion } from 'framer-motion';
import { Filter, LayoutTemplate, CheckSquare } from 'lucide-react';

interface UrgentTasksFilterTabsProps {
    id?: string;
    selectedType: 'ALL' | 'CONTENT' | 'TASK';
    onChangeType: (type: 'ALL' | 'CONTENT' | 'TASK') => void;
    contentCount: number;
    taskCount: number;
    allCount: number;
}

export const UrgentTasksFilterTabs: React.FC<UrgentTasksFilterTabsProps> = ({
    id = "urgent-tasks-filter-tabs",
    selectedType,
    onChangeType,
    contentCount,
    taskCount,
    allCount,
}) => {
    const tabs = [
        { id: 'ALL' as const, label: 'ทั้งหมด', icon: Filter, count: allCount, color: 'text-slate-600' },
        { id: 'CONTENT' as const, label: 'คอนเทนต์', icon: LayoutTemplate, count: contentCount, color: 'text-purple-600' },
        { id: 'TASK' as const, label: 'งานทั่วไป', icon: CheckSquare, count: taskCount, color: 'text-blue-600' }
    ];

    return (
        <div id={id} className="flex justify-center w-full px-6 mb-4 relative z-10">
            <div className="flex bg-slate-100/60 backdrop-blur-md p-1 rounded-full border border-white/50 shadow-inner w-full max-w-md relative overflow-hidden">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = selectedType === tab.id;
                    return (
                        <button
                            key={tab.id}
                            id={`tab-btn-${tab.id.toLowerCase()}`}
                            onClick={() => onChangeType(tab.id)}
                            className="flex-1 relative py-2 rounded-full flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer select-none"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-segmented-tab"
                                    className={`absolute inset-0 rounded-full shadow-sm border border-white/45 ${tab.id === 'ALL' ? 'bg-white' : tab.id === 'CONTENT' ? 'bg-purple-50' : 'bg-blue-50'}`}
                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-400'}`} />
                                <span className={isActive ? 'text-slate-800 font-extrabold' : 'text-slate-500 font-medium'}>
                                    {tab.label}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isActive 
                                    ? (tab.id === 'CONTENT' ? 'bg-purple-200/60 text-purple-700' : tab.id === 'TASK' ? 'bg-blue-200/60 text-blue-700' : 'bg-slate-200 text-slate-700') 
                                    : 'bg-slate-200/50 text-slate-500'
                                }`}>
                                    {tab.count}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

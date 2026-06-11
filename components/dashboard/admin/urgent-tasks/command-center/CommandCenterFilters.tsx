import React, { useState, useMemo } from 'react';
import { 
    Search, LayoutTemplate, CheckSquare, SlidersHorizontal, 
    AlertTriangle, Clock, Calendar, X, ChevronDown, ChevronUp 
} from 'lucide-react';

interface CommandCenterFiltersProps {
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    selectedType: 'ALL' | 'CONTENT' | 'TASK';
    onSelectedTypeChange: (type: 'ALL' | 'CONTENT' | 'TASK') => void;
    timeFilter: 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON' | 'NORMAL';
    onTimeFilterChange: (filter: 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON' | 'NORMAL') => void;
    totalCount: number;
    contentCount: number;
    taskCount: number;
    overdueCount: number;
    todayCount: number;
    soonCount: number;
}

export const CommandCenterFilters: React.FC<CommandCenterFiltersProps> = ({
    searchQuery,
    onSearchQueryChange,
    selectedType,
    onSelectedTypeChange,
    timeFilter,
    onTimeFilterChange,
    totalCount,
    contentCount,
    taskCount,
    overdueCount,
    todayCount,
    soonCount,
}) => {
    const [isCollapsedMobile, setIsCollapsedMobile] = useState(true);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim()) count++;
        if (selectedType !== 'ALL') count++;
        if (timeFilter !== 'ALL') count++;
        return count;
    }, [searchQuery, selectedType, timeFilter]);

    return (
        <div className="bg-white/80 border-b border-slate-100 px-4 py-2 bg-slate-50/50 md:bg-white/80 md:px-6 md:py-3.5 flex flex-col gap-2 md:gap-3 shrink-0 transition-all">
            {/* Mobile Header Toggle, click to expand/collapse */}
            <div 
                onClick={() => setIsCollapsedMobile(!isCollapsedMobile)}
                className="md:hidden flex items-center justify-between cursor-pointer py-1.5 select-none"
            >
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span>ตัวกรองและการค้นหา</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-extrabold">
                    <span>{isCollapsedMobile ? 'แตะระบุตัวกรอง' : 'ซ่อนตัวกรอง'}</span>
                    {isCollapsedMobile ? <ChevronDown className="w-4 h-4 font-extrabold" /> : <ChevronUp className="w-4 h-4 font-extrabold" />}
                </div>
            </div>

            {/* Collapsible Portion */}
            <div className={`flex-col gap-3 ${isCollapsedMobile ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center w-full">
                    {/* Search Bar Input */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="พิมพ์ชื่อแบรนด์, งาน, หรือผู้รับผิดชอบ..."
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            className="w-full text-xs font-bold pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-slate-200 hover:border-slate-300 rounded-xl transition-all outline-none text-slate-800"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => onSearchQueryChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200/50 hover:bg-slate-200 w-4 h-4 rounded-full flex items-center justify-center p-0 cursor-pointer"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>

                    {/* Segmented Type Switchers */}
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 w-full md:w-auto">
                        <button 
                            onClick={() => onSelectedTypeChange('ALL')}
                            className={`flex-1 md:flex-none text-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedType === 'ALL' 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            ทั้งหมด ({totalCount})
                        </button>
                        <button 
                            onClick={() => onSelectedTypeChange('CONTENT')}
                            className={`flex-1 md:flex-none text-center px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                selectedType === 'CONTENT' 
                                    ? 'bg-purple-100 text-purple-700 shadow-sm' 
                                    : 'text-slate-500 hover:text-purple-600'
                            }`}
                        >
                            <LayoutTemplate className="w-3.5 h-3.5" />
                            คอนเทนต์ ({contentCount})
                        </button>
                        <button 
                            onClick={() => onSelectedTypeChange('TASK')}
                            className={`flex-1 md:flex-none text-center px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                selectedType === 'TASK' 
                                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                                    : 'text-slate-500 hover:text-blue-600'
                            }`}
                        >
                            <CheckSquare className="w-3.5 h-3.5" />
                            งานทั่วไป ({taskCount})
                        </button>
                    </div>
                </div>

                {/* Horizontal Scrollable Time Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden md:block" />
                    <button 
                        onClick={() => onTimeFilterChange('ALL')}
                        className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                            timeFilter === 'ALL' 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                                : 'bg-white text-slate-500 border-slate-200'
                        }`}
                    >
                        วันไหนก็ได้
                    </button>
                    <button 
                        onClick={() => onTimeFilterChange('OVERDUE')}
                        className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                            timeFilter === 'OVERDUE' 
                                ? 'bg-red-500 text-white border-red-500 shadow-sm' 
                                : 'bg-red-50/50 text-red-600 border-red-100 hover:bg-red-50'
                        }`}
                    >
                        <AlertTriangle className="w-3 h-3" />
                        เลยดีดไลน์ ({overdueCount})
                    </button>
                    <button 
                        onClick={() => onTimeFilterChange('TODAY')}
                        className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                            timeFilter === 'TODAY' 
                                ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
                                : 'bg-orange-50/50 text-orange-600 border-orange-100 hover:bg-orange-50'
                        }`}
                    >
                        <Clock className="w-3 h-3" />
                        ส่งวันนี้ ({todayCount})
                    </button>
                    <button 
                        onClick={() => onTimeFilterChange('SOON')}
                        className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                            timeFilter === 'SOON' 
                                ? 'bg-yellow-500 text-slate-900 border-yellow-500 shadow-sm' 
                                : 'bg-yellow-50/50 text-yellow-700 border-yellow-100 hover:bg-yellow-50'
                        }`}
                    >
                        <Calendar className="w-3 h-3" />
                        ส่งใน 2 วัน ({soonCount})
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Search, Calendar, ChevronLeft, ChevronRight, Filter, Clock, CheckCircle2, Inbox, ArrowRight, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import FilterDropdown from '../../common/FilterDropdown';
import CustomDatePicker from '../../common/CustomDatePicker';

interface HistoryFilterBarProps {
    filters: {
        startDate: Date;
        endDate: Date;
        status: string;
        search?: string;
    };
    tempSearch: string;
    onSearchChange: (val: string) => void;
    onApplySearch: () => void;
    onSetFilters: (filters: any) => void;
    onShiftMonth: (direction: number) => void;
    onSetPage: (page: number) => void;
    presets: { label: string; onClick: () => void }[];
}

const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
    filters,
    tempSearch,
    onSearchChange,
    onApplySearch,
    onSetFilters,
    onShiftMonth,
    onSetPage,
    presets
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const statusOptions = [
        { key: 'TODO', label: 'ค้างงาน (TODO)', icon: <Inbox className="w-4 h-4" /> },
        { key: 'DOING', label: 'กำลังทำ (DOING)', icon: <Clock className="w-4 h-4" /> },
        { key: 'DONE', label: 'เสร็จสิ้น (DONE)', icon: <CheckCircle2 className="w-4 h-4" /> },
    ];

    const handleStartDateChange = (date: Date | null) => {
        if (!date) return;
        onSetFilters({ ...filters, startDate: date });
        onSetPage(0);
    };

    const handleEndDateChange = (date: Date | null) => {
        if (!date) return;
        onSetFilters({ ...filters, endDate: date });
        onSetPage(0);
    };

    return (
        <div className="border-b border-indigo-50 bg-white/80 backdrop-blur-xl flex flex-col sticky top-0 z-20 overflow-visible shrink-0 transition-all shadow-sm">
            {/* Main Action Bar - Always Visible */}
            <div className="p-6 flex items-center gap-4">
                {/* Search Bar - Modern & Accessible */}
                <div className="flex items-center gap-3 bg-white px-6 py-3.5 rounded-[2rem] border-2 border-indigo-50 shadow-[0_4px_12px_rgba(99,102,241,0.03),inset_0_2px_4px_rgba(255,255,255,1)] flex-1 focus-within:ring-4 focus-within:ring-indigo-500/5 focus-within:border-indigo-100 transition-all group">
                    <Search className="w-5 h-5 text-indigo-200 group-focus-within:text-indigo-400" />
                    <input 
                        type="text"
                        placeholder="หาชื่อสคริปต์หรือหัวข้อที่ทำไปแล้ว..."
                        className="text-sm bg-transparent outline-none w-full font-bold text-slate-600 placeholder:text-indigo-200/80"
                        value={tempSearch}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onApplySearch()}
                    />
                    {tempSearch && (
                        <button 
                            onClick={onApplySearch} 
                            className="text-[10px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-md active:scale-95"
                        >
                            Search
                        </button>
                    )}
                </div>

                <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block" />

                {/* Status Quick Access (Always visible in minimal form) */}
                <div className="w-48 hidden lg:block">
                    <FilterDropdown
                        label="สถานะงาน"
                        options={statusOptions}
                        value={filters.status}
                        onChange={(val) => {
                            onSetFilters({ ...filters, status: val });
                            onSetPage(0);
                        }}
                        activeColorClass="bg-indigo-50 text-indigo-600 border-indigo-200"
                        icon={<Filter className="w-4 h-4" />}
                        placeholder="สถานะทั้งหมด"
                    />
                </div>

                {/* Toggle Button */}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center gap-3 px-5 py-3.5 rounded-[1.5rem] border transition-all ${
                        isExpanded 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-200' 
                        : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50 shadow-sm'
                    }`}
                >
                    <Settings2 className={`w-4 h-4 ${isExpanded ? 'animate-spin-slow' : ''}`} />
                    <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                        {isExpanded ? 'Hide Options' : 'Filters & Presets'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/30 border-t border-indigo-50"
                    >
                        {/* Quick Presets Row */}
                        <div className="px-8 py-4 flex gap-2.5 overflow-x-auto no-scrollbar border-b border-white/50">
                            <span className="flex items-center text-[10px] font-bold text-indigo-300 uppercase tracking-widest mr-2 shrink-0">
                                Smart Presets:
                            </span>
                            {presets.map((preset) => (
                                <button 
                                    key={preset.label}
                                    onClick={preset.onClick}
                                    className="whitespace-nowrap px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-white border border-slate-100 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex flex-wrap items-center gap-6">
                                {/* Date Picker Row - Precise Range Control */}
                                <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm flex-1">
                                    <div className="flex items-center gap-2 px-4">
                                        <Calendar className="w-5 h-5 text-indigo-400" />
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                            Time Range
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex-1 min-w-[140px]">
                                            <CustomDatePicker 
                                                selected={filters.startDate}
                                                onChange={handleStartDateChange}
                                                placeholderText="เริ่มต้น"
                                            />
                                        </div>
                                        
                                        <ArrowRight className="w-4 h-4 text-indigo-200 shrink-0" />

                                        <div className="flex-1 min-w-[140px]">
                                            <CustomDatePicker 
                                                selected={filters.endDate}
                                                onChange={handleEndDateChange}
                                                placeholderText="สิ้นสุด"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Month Navigator */}
                                <div className="flex items-center gap-4 bg-white/60 p-3 rounded-[2rem] border border-white shadow-sm px-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Navigation</span>
                                        <span className="text-xs font-bold text-slate-600 tabular-nums">
                                            {format(filters.startDate, 'MMMM yyyy', { locale: th })}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 bg-indigo-50/50 p-1 rounded-2xl border border-indigo-100/50">
                                        <button 
                                            onClick={() => onShiftMonth(-1)}
                                            className="p-2 bg-white hover:bg-white rounded-xl text-indigo-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => onShiftMonth(1)}
                                            className="p-2 bg-white hover:bg-white rounded-xl text-indigo-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HistoryFilterBar;

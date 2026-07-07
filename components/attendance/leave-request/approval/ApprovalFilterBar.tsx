import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';
import { motion, AnimatePresence } from 'framer-motion';

type HistoryFilter = 'ALL' | 'APPROVED' | 'REJECTED';

interface ApprovalFilterBarProps {
    filterStatus: 'PENDING' | 'HISTORY';
    setFilterStatus: (status: 'PENDING' | 'HISTORY') => void;
    historySubFilter: HistoryFilter;
    setHistorySubFilter: (subFilter: HistoryFilter) => void;
    pendingCount: number;
    
    // Month/Year / Custom Range props
    isMonthFilterEnabled: boolean;
    setIsMonthFilterEnabled: (val: boolean) => void;
    isCustomRangeEnabled: boolean;
    setIsCustomRangeEnabled: (val: boolean) => void;
    selectedMonth: number;
    selectedYear: number;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    customRange: { start: Date; end: Date } | null;
    setIsDatePickerOpen: (val: boolean) => void;
    setCurrentPage: (page: number) => void;
    setActiveCategory: (cat: any) => void;
}

export const ApprovalFilterBar: React.FC<ApprovalFilterBarProps> = ({
    filterStatus,
    setFilterStatus,
    historySubFilter,
    setHistorySubFilter,
    pendingCount,
    isMonthFilterEnabled,
    setIsMonthFilterEnabled,
    isCustomRangeEnabled,
    setIsCustomRangeEnabled,
    selectedMonth,
    selectedYear,
    handlePrevMonth,
    handleNextMonth,
    customRange,
    setIsDatePickerOpen,
    setCurrentPage,
    setActiveCategory
}) => {
    const getThaiMonthYearLabel = (month: number, year: number) => {
        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${months[month]} ${year + 543}`;
    };

    const formatThaiRange = (start: Date, end: Date) => {
        const months = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const startDay = start.getDate();
        const startMonth = months[start.getMonth()];
        const startYear = start.getFullYear() + 543;

        const endDay = end.getDate();
        const endMonth = months[end.getMonth()];
        const endYear = end.getFullYear() + 543;

        return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    };

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-fit shadow-sm">
                    <button 
                        onClick={() => { setFilterStatus('PENDING'); setCurrentPage(1); setActiveCategory('ALL'); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 outline-none cursor-pointer ${filterStatus === 'PENDING' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        id="tab-pending-btn"
                    >
                        รออนุมัติ 
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === 'PENDING' ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                            {pendingCount}
                        </span>
                    </button>
                    <button 
                        onClick={() => { setFilterStatus('HISTORY'); setCurrentPage(1); setActiveCategory('ALL'); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all outline-none cursor-pointer ${filterStatus === 'HISTORY' ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        id="tab-history-btn"
                    >
                        ประวัติย้อนหลัง
                    </button>
                </div>

                {filterStatus === 'HISTORY' && (
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 w-fit shadow-sm">
                        <button 
                            onClick={() => { setHistorySubFilter('ALL'); setCurrentPage(1); setActiveCategory('ALL'); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all outline-none cursor-pointer ${historySubFilter === 'ALL' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            id="sub-filter-all-btn"
                        >
                            ทั้งหมด
                        </button>
                        <button 
                            onClick={() => { setHistorySubFilter('APPROVED'); setCurrentPage(1); setActiveCategory('ALL'); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all outline-none cursor-pointer ${historySubFilter === 'APPROVED' ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                            id="sub-filter-approved-btn"
                        >
                            อนุมัติแล้ว
                        </button>
                        <button 
                            onClick={() => { setHistorySubFilter('REJECTED'); setCurrentPage(1); setActiveCategory('ALL'); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all outline-none cursor-pointer ${historySubFilter === 'REJECTED' ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                            id="sub-filter-rejected-btn"
                        >
                            ไม่อนุมัติ
                        </button>
                    </div>
                )}
            </div>

            {/* Month/Year and Custom Range Filter for History */}
            <AnimatePresence initial={false}>
                {filterStatus === 'HISTORY' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ 
                            height: 'auto', 
                            opacity: 1, 
                            marginTop: 16
                        }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-gray-500">กรองประวัติ:</span>
                                
                                {/* Monthly Filter Button */}
                                <button
                                    onClick={() => {
                                        setIsMonthFilterEnabled(true);
                                        setIsCustomRangeEnabled(false);
                                        setCurrentPage(1);
                                        setActiveCategory('ALL');
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer ${
                                        (isMonthFilterEnabled && !isCustomRangeEnabled)
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50 shadow-sm' 
                                            : 'bg-gray-50 text-gray-400 border-gray-200/60 hover:text-gray-600'
                                    }`}
                                    id="filter-monthly-btn"
                                >
                                    {(isMonthFilterEnabled && !isCustomRangeEnabled) ? '✓ รายเดือน' : 'รายเดือน'}
                                </button>

                                {/* Custom Range Button */}
                                <button
                                    onClick={() => setIsDatePickerOpen(true)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer flex items-center gap-1.5 ${
                                        isCustomRangeEnabled 
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50 shadow-sm' 
                                            : 'bg-gray-50 text-gray-400 border-gray-200/60 hover:text-gray-600'
                                    }`}
                                    id="filter-custom-range-btn"
                                >
                                    <span>📅 {isCustomRangeEnabled ? '✓ เลือกช่วงวันที่' : 'เลือกช่วงวันที่'}</span>
                                </button>

                                {/* Show All Button */}
                                <button
                                    onClick={() => {
                                        setIsMonthFilterEnabled(false);
                                        setIsCustomRangeEnabled(false);
                                        setCurrentPage(1);
                                        setActiveCategory('ALL');
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer ${
                                        (!isMonthFilterEnabled && !isCustomRangeEnabled)
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50 shadow-sm' 
                                            : 'bg-gray-50 text-gray-400 border-gray-200/60 hover:text-gray-600'
                                    }`}
                                    id="filter-show-all-btn"
                                >
                                    {(!isMonthFilterEnabled && !isCustomRangeEnabled) ? '✓ แสดงทั้งหมด' : 'แสดงทั้งหมด'}
                                </button>
                            </div>

                            {isMonthFilterEnabled && !isCustomRangeEnabled && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrevMonth}
                                        className="p-1.5 rounded-xl hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer outline-none"
                                        id="prev-month-btn"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-black text-gray-700 min-w-[120px] text-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200/50 font-mono">
                                        {getThaiMonthYearLabel(selectedMonth, selectedYear)}
                                    </span>
                                    <button
                                        onClick={handleNextMonth}
                                        className="p-1.5 rounded-xl hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer outline-none"
                                        id="next-month-btn"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {isCustomRangeEnabled && customRange && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>ช่วงวันที่: <span className="font-bold">{formatThaiRange(customRange.start, customRange.end)}</span></span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApprovalFilterBar;

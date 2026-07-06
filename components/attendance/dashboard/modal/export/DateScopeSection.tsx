import React, { useState } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterDropdown from '../../../../common/FilterDropdown';
import DatePickerModal from '../../../../ui/DatePickerModal';
import MultiDatePickerModal from '../../../../ui/MultiDatePickerModal';

interface DateScopeSectionProps {
    dateMode: 'MONTH' | 'CUSTOM';
    setDateMode: (mode: 'MONTH' | 'CUSTOM') => void;
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    customStart: string;
    setCustomStart: (date: string) => void;
    customEnd: string;
    setCustomEnd: (date: string) => void;
}

export const DateScopeSection: React.FC<DateScopeSectionProps> = ({
    dateMode,
    setDateMode,
    selectedMonth,
    setSelectedMonth,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd
}) => {
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isEndOpen, setIsEndOpen] = useState(false);
    const [isRangeOpen, setIsRangeOpen] = useState(false);

    // Generates past 6 months including current for FilterDropdown options
    const monthOptions = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const val = format(d, 'yyyy-MM');
        const label = format(d, 'MMMM yyyy', { locale: th });
        return { key: val, label };
    });

    const formatThaiDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), 'dd MMM yyyy', { locale: th });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left pl-1">
                📅 กำหนดช่วงเวลาประมวลผลข้อมูล (Date Scope)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Date Selector Segment */}
                <div className="md:col-span-4 bg-white p-1.5 rounded-2xl border border-slate-200/80 flex">
                    <button
                        type="button"
                        onClick={() => setDateMode('MONTH')}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                            dateMode === 'MONTH'
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        รายเดือน (Monthly)
                    </button>
                    <button
                        type="button"
                        onClick={() => setDateMode('CUSTOM')}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                            dateMode === 'CUSTOM'
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        เลือกช่วงเวลาเอง (Custom)
                    </button>
                </div>

                {/* Actual inputs (Refactored to custom pickers & FilterDropdown) */}
                <div className="md:col-span-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-h-[58px]">
                    <AnimatePresence mode="wait">
                        {dateMode === 'MONTH' ? (
                            <motion.div
                                key="monthly-picker"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="w-full max-w-xs"
                            >
                                <FilterDropdown
                                    label="เลือกเดือน"
                                    options={monthOptions}
                                    value={selectedMonth}
                                    onChange={setSelectedMonth}
                                    showAllOption={false}
                                    clearable={false}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="custom-picker"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="flex flex-wrap items-center gap-2 w-full"
                            >
                                {/* Start Date Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsStartOpen(true)}
                                    className="flex-1 min-w-[130px] p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl text-xs font-bold text-slate-700 text-left flex items-center gap-2.5 transition-all shadow-sm active:scale-98"
                                >
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <div className="truncate">
                                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">วันเริ่มต้น</span>
                                        <span>{formatThaiDate(customStart)}</span>
                                    </div>
                                </button>

                                <span className="text-xs text-slate-400 font-bold px-1">ถึง</span>

                                {/* End Date Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsEndOpen(true)}
                                    className="flex-1 min-w-[130px] p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl text-xs font-bold text-slate-700 text-left flex items-center gap-2.5 transition-all shadow-sm active:scale-98"
                                >
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <div className="truncate">
                                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">วันสิ้นสุด</span>
                                        <span>{formatThaiDate(customEnd)}</span>
                                    </div>
                                </button>

                                {/* Multi Range Picker Action Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsRangeOpen(true)}
                                    className="p-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5 shrink-0"
                                    title="เปิดตัวเลือกปฏิทินช่วงวันล่วงหน้าระดับสูง"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>เลือกช่วงวัน</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals Portals */}
            {isStartOpen && (
                <DatePickerModal
                    isOpen={isStartOpen}
                    onClose={() => setIsStartOpen(false)}
                    selectedDate={new Date(customStart)}
                    onSelect={(date) => {
                        setCustomStart(format(date, 'yyyy-MM-dd'));
                        setIsStartOpen(false);
                    }}
                />
            )}

            {isEndOpen && (
                <DatePickerModal
                    isOpen={isEndOpen}
                    onClose={() => setIsEndOpen(false)}
                    selectedDate={new Date(customEnd)}
                    onSelect={(date) => {
                        setCustomEnd(format(date, 'yyyy-MM-dd'));
                        setIsEndOpen(false);
                    }}
                />
            )}

            {isRangeOpen && (
                <MultiDatePickerModal
                    isOpen={isRangeOpen}
                    onClose={() => setIsRangeOpen(false)}
                    initialStartDate={new Date(customStart)}
                    initialEndDate={new Date(customEnd)}
                    onConfirm={(start, end) => {
                        setCustomStart(format(start, 'yyyy-MM-dd'));
                        setCustomEnd(format(end, 'yyyy-MM-dd'));
                        setIsRangeOpen(false);
                    }}
                />
            )}
        </div>
    );
};

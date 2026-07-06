
import React, { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import DatePickerModal from '../../../ui/DatePickerModal';
import MultiDatePickerModal from '../../../ui/MultiDatePickerModal';

interface Props {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    minDate?: Date;
    maxDate?: Date;
    workingDaysCount?: number;
}

const StandardLeaveInputs: React.FC<Props> = ({ startDate, setStartDate, endDate, setEndDate, minDate, maxDate, workingDaysCount }) => {
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isMultiOpen, setIsMultiOpen] = useState(false);
    
    const [leaveMode, setLeaveMode] = useState<'single' | 'multiple'>(() => {
        if (startDate && endDate && startDate !== endDate) {
            return 'multiple';
        }
        return 'single';
    });

    const daysCount = startDate && endDate ? differenceInDays(new Date(endDate), new Date(startDate)) + 1 : 0;
    const selectedStartDate = startDate ? new Date(startDate) : undefined;
    const selectedEndDate = endDate ? new Date(endDate) : undefined;

    const formatThaiDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = date.getDate();
        const months = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year + 543}`; // Thai year (พ.ศ.)
    };

    return (
        <div className="space-y-4">
            <label className="block text-[13px] font-kanit font-medium text-gray-400 uppercase ml-1 tracking-widest flex justify-between">
                <span>ช่วงเวลาที่ลา (Period)</span>
                {workingDaysCount !== undefined && workingDaysCount > 0 ? (
                    <span className="text-indigo-500 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs animate-fade-in">
                        {workingDaysCount} วันทำงาน
                    </span>
                ) : (
                    daysCount > 0 && (
                        <span className="text-indigo-500 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs">
                            {daysCount} วันปฏิทิน
                        </span>
                    )
                )}
            </label>

            {/* Segmented Control / Toggle */}
            <div className="p-1 bg-gray-100/80 rounded-2xl border border-gray-200/40 flex relative">
                <button
                    type="button"
                    onClick={() => {
                        setLeaveMode('single');
                        if (startDate) {
                            setEndDate(startDate);
                        }
                    }}
                    className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 ${
                        leaveMode === 'single' ? 'text-indigo-700 font-extrabold' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {leaveMode === 'single' && (
                        <motion.div
                            layoutId="active-mode-pill"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 -z-10"
                            transition={{ type: 'spring', duration: 0.4 }}
                        />
                    )}
                    ลา 1 วัน
                </button>
                <button
                    type="button"
                    onClick={() => setLeaveMode('multiple')}
                    className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 ${
                        leaveMode === 'multiple' ? 'text-indigo-700 font-extrabold' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {leaveMode === 'multiple' && (
                        <motion.div
                            layoutId="active-mode-pill"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 -z-10"
                            transition={{ type: 'spring', duration: 0.4 }}
                        />
                    )}
                    ลาหลายวัน
                </button>
            </div>

            {/* Dynamic Inputs Display */}
            {leaveMode === 'single' ? (
                <button
                    id="single-date-picker-trigger"
                    type="button"
                    onClick={() => setIsStartOpen(true)}
                    className="w-full bg-white border border-gray-200/80 rounded-3xl p-4 flex items-center justify-between text-left transition-all hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/30 active:scale-98"
                >
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">วันที่ลา (Date)</span>
                        <span className="text-sm font-bold text-gray-700 mt-0.5">
                            {startDate ? formatThaiDate(startDate) : 'เลือกวันที่ลา'}
                        </span>
                    </div>
                    <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" />
                </button>
            ) : (
                <button
                    id="multi-date-picker-trigger"
                    type="button"
                    onClick={() => setIsMultiOpen(true)}
                    className="w-full bg-white border border-gray-200/80 rounded-3xl p-4 flex items-center justify-between text-left transition-all hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/30 active:scale-98"
                >
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ช่วงวันที่ลา (Date Range)</span>
                        <span className="text-sm font-bold text-gray-700 mt-0.5">
                            {startDate && endDate ? (
                                <span className="flex items-center gap-2">
                                    <span>เริ่ม {formatThaiDate(startDate)}</span>
                                    <span className="text-indigo-400 font-normal">→</span>
                                    <span>สิ้นสุด {formatThaiDate(endDate)}</span>
                                </span>
                            ) : (
                                'เลือกช่วงวันเริ่มต้นและสิ้นสุด'
                            )}
                        </span>
                    </div>
                    <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" />
                </button>
            )}

            {/* DatePicker Modals */}
            <DatePickerModal
                isOpen={isStartOpen}
                onClose={() => setIsStartOpen(false)}
                selectedDate={selectedStartDate}
                onSelect={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : '';
                    setStartDate(dateStr);
                    setEndDate(dateStr); // For single day, start = end
                }}
                minDate={minDate}
                maxDate={maxDate}
            />

            <MultiDatePickerModal
                isOpen={isMultiOpen}
                onClose={() => setIsMultiOpen(false)}
                initialStartDate={selectedStartDate}
                initialEndDate={selectedEndDate}
                onConfirm={(start, end) => {
                    setStartDate(start.toISOString().split('T')[0]);
                    setEndDate(end.toISOString().split('T')[0]);
                }}
                minDate={minDate}
                maxDate={maxDate}
            />
        </div>
    );
};

export default StandardLeaveInputs;

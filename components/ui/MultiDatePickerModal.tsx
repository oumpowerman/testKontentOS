import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Calendar, Info, Check } from 'lucide-react';
import { useMasterData } from '../../hooks/useMasterData';
import { useUserSession } from '../../context/UserSessionContext';
import { format, startOfDay, isBefore, isAfter, isSameDay } from 'date-fns';

interface MultiDatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (startDate: Date, endDate: Date) => void;
    initialStartDate?: Date;
    initialEndDate?: Date;
    minDate?: Date;
}

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const MultiDatePickerModal: React.FC<MultiDatePickerModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialStartDate,
    initialEndDate,
    minDate
}) => {
    // Selection state
    const [rangeStart, setRangeStart] = useState<Date | null>(initialStartDate || null);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEndDate || null);
    
    // View state
    const [viewDate, setViewDate] = useState<Date>(() => initialStartDate || new Date());
    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

    const { annualHolidays, calendarExceptions } = useMasterData();
    const { currentUserProfile } = useUserSession();

    // Reset selection & view date when modal opens
    useEffect(() => {
        if (isOpen) {
            setRangeStart(initialStartDate || null);
            setRangeEnd(initialEndDate || null);
            setViewDate(initialStartDate || new Date());
            setHoveredDay(null);
        }
    }, [isOpen, initialStartDate, initialEndDate]);

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth(); // 0-11

    // Helper to get number of days in the month
    const daysInMonth = useMemo(() => {
        return new Date(viewYear, viewMonth + 1, 0).getDate();
    }, [viewYear, viewMonth]);

    // Helper to get the weekday index of the first day of the month
    const firstDayIndex = useMemo(() => {
        return new Date(viewYear, viewMonth, 1).getDay();
    }, [viewYear, viewMonth]);

    // Generate years for dropdown selector (Current Year - 5 to + 5)
    const yearsRange = useMemo(() => {
        const currentY = new Date().getFullYear();
        const yearsList: number[] = [];
        for (let i = currentY - 5; i <= currentY + 5; i++) {
            yearsList.push(i);
        }
        return yearsList;
    }, []);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewDate(new Date(viewYear, parseInt(e.target.value), 1));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewDate(new Date(parseInt(e.target.value), viewMonth, 1));
    };

    // Evaluate date type and properties (for working days check & colors)
    const getDayInfo = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Level 1: Exceptions
        const exception = calendarExceptions?.find((e: any) => e.date === dateStr);
        if (exception) {
            if (exception.type === 'HOLIDAY') {
                return {
                    type: 'exception-holiday' as const,
                    color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-300/30 hover:bg-amber-100',
                    badge: 'bg-amber-500',
                    label: exception.description || 'วันหยุดพิเศษ (จากระบบ)',
                    isWorking: false
                };
            } else if (exception.type === 'WORK_DAY') {
                return {
                    type: 'exception-work' as const,
                    color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/30 hover:bg-emerald-100',
                    badge: 'bg-emerald-500',
                    label: exception.description || 'วันทำงานพิเศษ (จากระบบ)',
                    isWorking: true
                };
            }
        }

        // Level 2: Annual Holiday
        const holiday = annualHolidays?.find((h: any) => 
            h.isActive && h.day === date.getDate() && h.month === (date.getMonth() + 1)
        );
        if (holiday) {
            return {
                type: 'annual-holiday' as const,
                color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-300/30 hover:bg-rose-100',
                badge: 'bg-rose-500',
                label: holiday.name || 'วันหยุดประจำปี',
                isWorking: false
            };
        }

        // Level 3: User's schedule
        const userWorkDays = currentUserProfile?.workDays || [1, 2, 3, 4, 5];
        const isWeeklyWorkday = userWorkDays.includes(date.getDay());
        if (!isWeeklyWorkday) {
            return {
                type: 'weekly-off' as const,
                color: 'bg-gray-50 text-gray-400 hover:bg-gray-100',
                badge: 'bg-gray-400',
                label: 'วันหยุดประจำสัปดาห์',
                isWorking: false
            };
        }

        // Normal Workday
        return {
            type: 'normal-work' as const,
            color: 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-gray-100',
            badge: 'bg-indigo-500',
            label: 'วันทำงานปกติ',
            isWorking: true
        };
    };

    // Calculate details for range
    const rangeDetails = useMemo(() => {
        const start = rangeStart;
        const end = rangeEnd || (rangeStart && hoveredDay && isAfter(hoveredDay, rangeStart) ? hoveredDay : null);
        
        if (!start || !end) return null;

        let current = startOfDay(start);
        const finalEnd = startOfDay(end);
        let workingDaysCount = 0;
        let totalDaysCount = 0;
        let weeklyOffsCount = 0;
        let annualHolidaysCount = 0;
        let specialHolidaysCount = 0;

        let limit = 0;
        while (current.getTime() <= finalEnd.getTime() && limit < 366) {
            limit++;
            totalDaysCount++;
            const dayInfo = getDayInfo(current);
            if (dayInfo.isWorking) {
                workingDaysCount++;
            } else {
                if (dayInfo.type === 'weekly-off') {
                    weeklyOffsCount++;
                } else if (dayInfo.type === 'annual-holiday') {
                    annualHolidaysCount++;
                } else if (dayInfo.type === 'exception-holiday') {
                    specialHolidaysCount++;
                }
            }
            current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
        }

        return {
            workingDaysCount,
            totalDaysCount,
            weeklyOffsCount,
            annualHolidaysCount,
            specialHolidaysCount
        };
    }, [rangeStart, rangeEnd, hoveredDay, annualHolidays, calendarExceptions, currentUserProfile]);

    // Handle day click
    const handleDayClick = (date: Date) => {
        const clickedDate = startOfDay(date);

        if (!rangeStart) {
            setRangeStart(clickedDate);
            setRangeEnd(null);
        } else if (rangeStart && !rangeEnd) {
            if (isBefore(clickedDate, rangeStart)) {
                // If clicked date is before start date, reset start date to this clicked date
                setRangeStart(clickedDate);
            } else {
                setRangeEnd(clickedDate);
            }
        } else {
            // Click 3: reset and start a new selection
            setRangeStart(clickedDate);
            setRangeEnd(null);
        }
    };

    // Render calendar days
    const daysArray = useMemo(() => {
        const arr = [];
        
        // Pad days from previous month
        for (let i = 0; i < firstDayIndex; i++) {
            arr.push(null);
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            arr.push(new Date(viewYear, viewMonth, i));
        }

        return arr;
    }, [viewYear, viewMonth, daysInMonth, firstDayIndex]);

    const formatThaiDate = (date: Date) => {
        const day = date.getDate();
        const month = THAI_MONTHS[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year + 543}`;
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div
                    id="multi-date-picker-overlay"
                    className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        id="multi-date-picker-modal-card"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">เลือกช่วงเวลาที่ลา</h3>
                                    <p className="text-xs text-gray-500">กรุณาเลือกวันเริ่มต้นและวันสิ้นสุด</p>
                                </div>
                            </div>
                            <button
                                id="close-multi-date-picker"
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Controls (Month/Year selectors) */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between space-x-2 bg-white shrink-0">
                            <button
                                id="multi-prev-month-btn"
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 rounded-xl border border-gray-100 text-gray-600 transition-all hover:scale-105 active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center space-x-2">
                                <select
                                    id="multi-month-select"
                                    value={viewMonth}
                                    onChange={handleMonthChange}
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                >
                                    {THAI_MONTHS.map((m, index) => (
                                        <option key={m} value={index}>{m}</option>
                                    ))}
                                </select>

                                <select
                                    id="multi-year-select"
                                    value={viewYear}
                                    onChange={handleYearChange}
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                >
                                    {yearsRange.map((y) => (
                                        <option key={y} value={y}>พ.ศ. {y + 543}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                id="multi-next-month-btn"
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-gray-100 rounded-xl border border-gray-100 text-gray-600 transition-all hover:scale-105 active:scale-95"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Calendar Body (Grid) */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Days of week header */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {WEEKDAYS.map((day, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-xs font-bold py-1.5 ${
                                            idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-indigo-500' : 'text-gray-400'
                                        }`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-y-1.5 gap-x-0">
                                {daysArray.map((date, index) => {
                                    if (!date) {
                                        return <div key={`empty-${index}`} className="aspect-square" />;
                                    }

                                    const startOfDate = startOfDay(date);
                                    
                                    // Range calculations
                                    const isStart = rangeStart ? isSameDay(startOfDate, rangeStart) : false;
                                    const isEnd = rangeEnd ? isSameDay(startOfDate, rangeEnd) : false;
                                    
                                    // Active preview end is either rangeEnd or hoveredDay (if valid)
                                    const activeEnd = rangeEnd || (rangeStart && hoveredDay && isAfter(hoveredDay, rangeStart) ? hoveredDay : null);
                                    const isInRange = rangeStart && activeEnd && isAfter(startOfDate, rangeStart) && isBefore(startOfDate, activeEnd);

                                    // Check constraints if needed, none for now but keep clean
                                    const isTooEarly = minDate ? isBefore(startOfDate, startOfDay(minDate)) : false;
                                    const isDisabled = isTooEarly;

                                    const dayInfo = getDayInfo(date);

                                    // Rounding calculations for connected range
                                    let roundedClasses = "rounded-2xl";
                                    if (isInRange) {
                                        const isSunday = date.getDay() === 0;
                                        const isSaturday = date.getDay() === 6;
                                        const isDayAfterStart = rangeStart && isSameDay(startOfDate, new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + 1));
                                        const isDayBeforeEnd = activeEnd && isSameDay(startOfDate, new Date(activeEnd.getFullYear(), activeEnd.getMonth(), activeEnd.getDate() - 1));

                                        if (isSunday || isDayAfterStart) {
                                            roundedClasses = "rounded-l-2xl rounded-r-none";
                                        } else if (isSaturday || isDayBeforeEnd) {
                                            roundedClasses = "rounded-r-2xl rounded-l-none";
                                        } else {
                                            roundedClasses = "rounded-none";
                                        }
                                    } else if (isStart && activeEnd) {
                                        // Start date has range connection to the right
                                        roundedClasses = "rounded-l-2xl rounded-r-none";
                                    } else if (isEnd && rangeStart) {
                                        // End date has range connection to the left
                                        roundedClasses = "rounded-r-2xl rounded-l-none";
                                    }

                                    return (
                                        <div 
                                            key={`day-${date.getDate()}`}
                                            className={`relative py-0.5 ${isInRange ? 'bg-indigo-50/50' : ''} ${isStart && activeEnd ? 'bg-indigo-50/20 rounded-l-2xl' : ''} ${isEnd && rangeStart ? 'bg-indigo-50/20 rounded-r-2xl' : ''}`}
                                        >
                                            <button
                                                id={`multi-day-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => handleDayClick(date)}
                                                onMouseEnter={() => rangeStart && !rangeEnd && setHoveredDay(startOfDate)}
                                                onMouseLeave={() => setHoveredDay(null)}
                                                className={`
                                                    relative w-full aspect-square flex flex-col items-center justify-center text-sm font-bold transition-all duration-150
                                                    ${isDisabled 
                                                        ? 'bg-gray-50 text-gray-300 opacity-40 cursor-not-allowed border-dashed border border-gray-100' 
                                                        : (isStart || isEnd)
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 z-10 rounded-2xl'
                                                            : isInRange
                                                                ? `bg-indigo-50 text-indigo-700 ${roundedClasses} border-y border-indigo-100`
                                                                : dayInfo.color
                                                    }
                                                `}
                                            >
                                                <span>{date.getDate()}</span>
                                                
                                                {/* Small color dot under day number */}
                                                {!isDisabled && !isStart && !isEnd && !isInRange && (
                                                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dayInfo.badge}`} />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Live Working Days Panel */}
                            <div className="mt-5 p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col space-y-2 min-h-[5rem]">
                                {rangeStart && rangeDetails ? (
                                    <div>
                                        <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                                            <span>สรุปข้อมูลช่วงที่เลือก</span>
                                            <span className="text-indigo-600 font-extrabold normal-case">
                                                {rangeDetails.totalDaysCount} วันปฏิทิน
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-baseline space-x-2 text-indigo-900">
                                            <span className="text-[13px] font-bold">จำนวนวันทำงานจริง:</span>
                                            <span className="text-xl font-black text-indigo-600 font-sans">
                                                {rangeDetails.workingDaysCount}
                                            </span>
                                            <span className="text-[13px] font-bold">วัน</span>
                                        </div>

                                        <div className="mt-2 text-[11px] text-gray-500 leading-relaxed space-y-1 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
                                            <p className="font-bold text-gray-700 flex items-center gap-1.5">
                                                <Info className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>รายละเอียดวันหยุดในช่วงนี้:</span>
                                            </p>
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pl-5 mt-1 text-gray-500">
                                                <span>• วันหยุดสุดสัปดาห์:</span>
                                                <span className="font-semibold text-right text-gray-700">{rangeDetails.weeklyOffsCount} วัน</span>
                                                <span>• วันหยุดประจำปี:</span>
                                                <span className="font-semibold text-right text-gray-700">{rangeDetails.annualHolidaysCount} วัน</span>
                                                <span>• วันหยุดพิเศษ/อื่นๆ:</span>
                                                <span className="font-semibold text-right text-gray-700">{rangeDetails.specialHolidaysCount} วัน</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : rangeStart ? (
                                    <div className="flex items-start space-x-2.5 py-1">
                                        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                                        <div className="text-xs text-gray-600 leading-relaxed">
                                            <p className="font-bold text-gray-800">วันเริ่มต้นที่เลือก:</p>
                                            <p className="mt-0.5 text-gray-700 font-semibold">{formatThaiDate(rangeStart)}</p>
                                            <p className="mt-1 text-gray-400">กรุณาคลิกเลือก <span className="text-indigo-500 font-bold">"วันสิ้นสุด"</span> บนปฏิทิน</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start space-x-2.5 py-1">
                                        <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                        <div className="text-xs text-gray-400 leading-relaxed">
                                            <p className="font-bold text-gray-500">ยังไม่ได้เลือกช่วงวัน</p>
                                            <p className="mt-0.5">กรุณาคลิกเลือกวันเริ่มต้น แล้วจึงเลือกวันสิ้นสุดที่ต้องการลา</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                            <button
                                id="multi-cancel-btn"
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3.5 px-4 rounded-2xl text-sm transition-all hover:bg-gray-100 active:scale-98"
                            >
                                ยกเลิก
                            </button>
                            <button
                                id="multi-confirm-btn"
                                type="button"
                                disabled={!rangeStart || !rangeEnd}
                                onClick={() => {
                                    if (rangeStart && rangeEnd) {
                                        const startToSelect = new Date(rangeStart);
                                        startToSelect.toISOString = () => {
                                            const y = startToSelect.getFullYear();
                                            const m = String(startToSelect.getMonth() + 1).padStart(2, '0');
                                            const d = String(startToSelect.getDate()).padStart(2, '0');
                                            return `${y}-${m}-${d}T00:00:00.000Z`;
                                        };
                                        startToSelect.toJSON = () => {
                                            return startToSelect.toISOString();
                                        };

                                        const endToSelect = new Date(rangeEnd);
                                        endToSelect.toISOString = () => {
                                            const y = endToSelect.getFullYear();
                                            const m = String(endToSelect.getMonth() + 1).padStart(2, '0');
                                            const d = String(endToSelect.getDate()).padStart(2, '0');
                                            return `${y}-${m}-${d}T00:00:00.000Z`;
                                        };
                                        endToSelect.toJSON = () => {
                                            return endToSelect.toISOString();
                                        };

                                        onConfirm(startToSelect, endToSelect);
                                        onClose();
                                    }
                                }}
                                className={`flex-1 font-bold py-3.5 px-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-md ${
                                    (!rangeStart || !rangeEnd)
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                }`}
                            >
                                <Check className="w-4 h-4" />
                                ยืนยันช่วงวัน
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default MultiDatePickerModal;

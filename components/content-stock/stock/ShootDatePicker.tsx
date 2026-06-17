import React, { useRef, useState, useEffect, useMemo } from 'react';
import { CheckSquare, Square, CalendarDays, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameMonth, addMonths, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import th from 'date-fns/locale/th';

interface ShootDatePickerProps {
    filterHasShootDate: boolean;
    setFilterHasShootDate: (val: boolean) => void;
    filterShootDateStart: string;
    setFilterShootDateStart: (val: string) => void;
    filterShootDateEnd: string;
    setFilterShootDateEnd: (val: string) => void;
}

export const ShootDatePicker: React.FC<ShootDatePickerProps> = React.memo(({
    filterHasShootDate,
    setFilterHasShootDate,
    filterShootDateStart,
    setFilterShootDateStart,
    filterShootDateEnd,
    setFilterShootDateEnd
}) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(new Date());
    const datePickerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
            setIsDatePickerOpen(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleDateClick = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (!filterShootDateStart || (filterShootDateStart && filterShootDateEnd)) {
            setFilterShootDateStart(dateStr);
            setFilterShootDateEnd('');
        } else {
            if (dateStr < filterShootDateStart) {
                setFilterShootDateEnd(filterShootDateStart);
                setFilterShootDateStart(dateStr);
            } else {
                setFilterShootDateEnd(dateStr);
            }
        }
    };

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewMonth));
        const end = endOfWeek(endOfMonth(viewMonth));
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);

    const handleClearDate = () => {
        setFilterShootDateStart('');
        setFilterShootDateEnd('');
    };

    return (
        <motion.div layout className="flex items-center gap-2">
            <button 
                onClick={() => setFilterHasShootDate(!filterHasShootDate)}
                className={`
                    flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all active:scale-95 whitespace-nowrap
                    ${filterHasShootDate ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}
                `}
            >
                {filterHasShootDate ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span className="text-xs font-black uppercase tracking-wider">Shoot Date</span>
            </button>

            <AnimatePresence mode="popLayout">
                {filterHasShootDate && (
                    <motion.div 
                        layout
                        initial={{ opacity: 0, x: -20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto' }}
                        exit={{ opacity: 0, x: -20, width: 0 }}
                        transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
                        className="relative flex items-center" 
                        ref={datePickerRef}
                    >
                        <button 
                            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            className={`
                                flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all min-w-[200px] whitespace-nowrap mr-2
                                ${isDatePickerOpen ? 'border-indigo-500 ring-4 ring-indigo-50 bg-white' : 'border-gray-200 bg-gray-50/50 hover:border-indigo-300'}
                            `}
                        >
                            <CalendarDays className={`w-4 h-4 ${filterShootDateStart ? 'text-indigo-500' : 'text-gray-400'}`} />
                            <span className="text-xs font-bold text-gray-700">
                                {filterShootDateStart && filterShootDateEnd 
                                    ? `${format(parseISO(filterShootDateStart), 'd MMM', { locale: th })} - ${format(parseISO(filterShootDateEnd), 'd MMM yy', { locale: th })}`
                                    : filterShootDateStart 
                                        ? format(parseISO(filterShootDateStart), 'd MMM yy', { locale: th })
                                        : 'เลือกช่วงเวลา'}
                            </span>
                            {(filterShootDateStart || filterShootDateEnd) && (
                                <div 
                                    onClick={(e) => { e.stopPropagation(); handleClearDate(); }}
                                    className="ml-auto p-1 hover:bg-red-50 rounded-full text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {isDatePickerOpen && (
                                <>
                                    {/* Mobile Background Backdrop Overlay */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.4 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setIsDatePickerOpen(false)}
                                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[55] md:hidden"
                                    />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                        className="fixed md:absolute bottom-4 left-4 right-4 md:bottom-auto md:top-full md:left-0 md:right-auto md:inset-x-auto mt-2 md:w-[320px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 z-[60] overflow-hidden origin-bottom md:origin-top-left"
                                    >
                                        <div className="flex justify-between items-center mb-6 px-1">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">เลือกช่วงเวลาถ่ายทำ</span>
                                            <button onClick={() => setIsDatePickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-4 h-4" /></button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <button onClick={() => setViewMonth(prev => addMonths(prev, -1))} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
                                            <span className="text-sm font-black text-gray-700">{format(viewMonth, 'MMMM yyyy', { locale: th })}</span>
                                            <button onClick={() => setViewMonth(prev => addMonths(prev, 1))} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronRight className="w-4 h-4" /></button>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                                                <div key={day} className="text-[10px] font-black text-gray-300 text-center py-1 uppercase">{day}</div>
                                            ))}
                                            {calendarDays.map((date, i) => {
                                                const dateStr = format(date, 'yyyy-MM-dd');
                                                const isSelected = (filterShootDateStart === dateStr) || (filterShootDateEnd === dateStr);
                                                const isInRange = filterShootDateStart && filterShootDateEnd && isWithinInterval(date, { 
                                                    start: startOfDay(parseISO(filterShootDateStart)), 
                                                    end: endOfDay(parseISO(filterShootDateEnd)) 
                                                });
                                                const isCurrentMonth = isSameMonth(date, viewMonth);

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleDateClick(date)}
                                                        className={`
                                                            relative h-9 w-full flex items-center justify-center text-xs font-bold rounded-xl transition-all
                                                            ${!isCurrentMonth ? 'text-gray-200' : 'text-gray-600 hover:bg-indigo-50'}
                                                            ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md z-10' : ''}
                                                            ${isInRange && !isSelected ? 'bg-indigo-50 text-indigo-600 rounded-none first:rounded-l-xl last:rounded-r-xl' : ''}
                                                        `}
                                                    >
                                                        {format(date, 'd')}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

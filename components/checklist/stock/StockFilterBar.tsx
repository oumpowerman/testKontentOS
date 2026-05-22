
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, CheckSquare, ListFilter, Layout, Calendar, Trash2, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Square, Film, Landmark, BarChart3, Tags } from 'lucide-react';
import { Channel, MasterOption, Task } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameMonth, addMonths, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import th from 'date-fns/locale/th';
import FilterDropdown from '../../common/FilterDropdown';
import MultiSelectFilter from '../../common/MultiSelectFilter';

interface StockFilterBarProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterChannel: string[];
    setFilterChannel: React.Dispatch<React.SetStateAction<string[]>>;
    filterFormat: string[];
    setFilterFormat: React.Dispatch<React.SetStateAction<string[]>>;
    filterPillar: string[];
    setFilterPillar: React.Dispatch<React.SetStateAction<string[]>>;
    filterCategory: string[];
    setFilterCategory: React.Dispatch<React.SetStateAction<string[]>>;
    filterStatuses: string[];
    setFilterStatuses: React.Dispatch<React.SetStateAction<string[]>>;
    contentSubTab?: 'ACTIVE' | 'ARCHIVE';
    
    // Updated for Range
    filterHasShootDate: boolean;
    setFilterHasShootDate: (val: boolean) => void;
    filterShootDateStart: string;
    setFilterShootDateStart: (val: string) => void;
    filterShootDateEnd: string;
    setFilterShootDateEnd: (val: string) => void;

    showStockOnly: boolean;
    setShowStockOnly: (val: boolean) => void;
    clearFilters: () => void;
    
    // Data
    channels: Channel[];
    masterOptions: MasterOption[];
    tasks: Task[];
}

const StockFilterBar: React.FC<StockFilterBarProps> = React.memo(({
    searchQuery, setSearchQuery,
    filterChannel, setFilterChannel,
    filterFormat, setFilterFormat,
    filterPillar, setFilterPillar,
    filterCategory, setFilterCategory,
    filterStatuses, setFilterStatuses,
    contentSubTab = 'ACTIVE',
    
    filterHasShootDate, setFilterHasShootDate,
    filterShootDateStart, setFilterShootDateStart,
    filterShootDateEnd, setFilterShootDateEnd,

    showStockOnly, setShowStockOnly,
    clearFilters,
    channels, masterOptions,
    tasks
}) => {
    // Local state for debouncing search input
    const [localSearch, setLocalSearch] = useState(searchQuery);
    
    // Sync local state if parent prop changes externally (e.g. clear filters)
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== searchQuery) {
                setSearchQuery(localSearch);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, setSearchQuery, searchQuery]);

    // Tag Auto-Suggest States
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const allTags = useMemo(() => {
        const counts: Record<string, number> = {};
        tasks.forEach((task) => {
            if (Array.isArray(task.tags)) {
                task.tags.forEach((tag: string) => {
                    const trimmed = tag.trim();
                    if (trimmed) {
                        counts[trimmed] = (counts[trimmed] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [tasks]);

    // Helper to extract tag typing context
    const currentTagTypeMatch = localSearch.match(/#(\S*)$/);
    const filterKeyword = currentTagTypeMatch ? currentTagTypeMatch[1].toLowerCase() : '';

    const filteredTags = useMemo(() => {
        if (!currentTagTypeMatch) {
            return allTags.slice(0, 12);
        }
        return allTags.filter(tag => tag.name.toLowerCase().includes(filterKeyword));
    }, [allTags, currentTagTypeMatch, filterKeyword]);

    const handleTagSuggestionClick = (tagName: string) => {
        const tagTypeMatch = localSearch.match(/#(\S*)$/);
        if (tagTypeMatch) {
            const startIndex = localSearch.lastIndexOf('#');
            const cleanPrefix = localSearch.substring(0, startIndex);
            setLocalSearch(`${cleanPrefix}#${tagName} `);
        } else {
            const prefix = localSearch.trim() ? `${localSearch.trim()} ` : '';
            setLocalSearch(`${prefix}#${tagName} `);
        }
    };

    // Close suggestion box when clicking outside search area
    useEffect(() => {
        function handleSearchClickOutside(event: MouseEvent) {
          if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
          }
        }
        document.addEventListener("mousedown", handleSearchClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleSearchClickOutside);
        };
    }, [searchContainerRef]);

    // Calendar State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(new Date());
    const datePickerRef = useRef<HTMLDivElement>(null);

    // Derive Options with useMemo for Performance
    const formatOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder),
    [masterOptions]);

    const pillarOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder),
    [masterOptions]);

    const categoryOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder),
    [masterOptions]);

    const statusOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder),
    [masterOptions]);

    const toggleStatusFilter = (status: string) => {
        setFilterStatuses(prev => 
            prev.includes(status) 
            ? prev.filter(s => s !== status) 
            : [...prev, status]
        );
    };

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
      }, [datePickerRef]);

    const hasActiveFilters = searchQuery || filterChannel.length > 0 || filterFormat.length > 0 || filterPillar.length > 0 || filterCategory.length > 0 || filterStatuses.length > 0 || filterHasShootDate || filterShootDateStart || filterShootDateEnd;

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
        <motion.div 
            layout
            className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200/60 flex flex-col xl:flex-row gap-4 relative z-50 transition-all hover:shadow-md"
        >
            
            {/* Left: Search & Date Range */}
            <motion.div layout className="flex flex-col sm:flex-row gap-3 flex-1 items-stretch">
                {/* Search */}
                <motion.div layout className="relative flex-1 group" ref={searchContainerRef}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ชื่อ, หมายเหตุ หรือพิมพ์ # ตามด้วยแท็ก..." 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full h-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 focus:bg-white outline-none text-sm font-bold text-gray-700 transition-all placeholder:font-normal placeholder:text-gray-400 min-h-[50px]"
                    />
                    {localSearch && (
                        <button onClick={() => setLocalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Autocomplete suggestions dropdown */}
                    <AnimatePresence>
                        {showSuggestions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                className="absolute top-full left-0 mt-2 w-full max-w-[420px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-[100] overflow-hidden text-left"
                            >
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-500 uppercase tracking-widest">
                                        <Tags className="w-3.5 h-3.5" />
                                        <span>คำอธิบายค้นหาด้วย # (Hashtags)</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowSuggestions(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <p className="text-[11px] text-gray-500 font-medium mb-4 leading-relaxed">
                                    💡 <span className="font-extrabold text-indigo-600">ทิปค้นหาด้วย #:</span> เพียงพิมพ์เครื่องหมาย <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">#</code> ตามด้วยข้อความ (เช่น <code className="bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded font-mono font-bold">#Vlog</code>) เพื่อเจาะจงค้นหาแท็ก หรือสามารถคลิกเลือกจากแท็กยอดนิยมด้านล่างนี้ได้เลย!
                                </p>

                                {filteredTags.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black tracking-wider text-gray-400 uppercase">
                                            {currentTagTypeMatch ? 'แท็กที่ตรงกับสระค้นหา' : 'แท็กยอดนิยมในระบบ'}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                            {filteredTags.map((tag, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleTagSuggestionClick(tag.name)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100/60 font-black text-xs transition-all duration-200 active:scale-95 group/btn"
                                                >
                                                    <span>#{tag.name}</span>
                                                    <span className="text-[10px] font-bold text-indigo-400 group-hover/btn:text-indigo-200 bg-white/70 group-hover/btn:bg-white/20 px-1.5 py-0.5 rounded-md">
                                                        {tag.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-xs text-gray-400 font-bold">ไม่พบแท็กที่ค้นหา</p>
                                        <p className="text-[10px] text-gray-400 mt-1">ลองพิมพ์สัญลักษณ์ # เพื่อดูรายการแท็กทั้งหมด</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Shoot Date Checkbox & Range Picker */}
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
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full left-0 mt-2 w-[320px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 z-[60]"
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
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            {/* Right: Dropdowns & Actions */}
            <motion.div layout className="flex flex-wrap gap-2 items-center">
                
                {/* Format Filter */}
                <motion.div layout>
                    <MultiSelectFilter 
                        label="Format"
                        values={filterFormat}
                        options={formatOptions}
                        onChange={setFilterFormat}
                        icon={<Film className="w-4 h-4" />}
                        activeColorClass="bg-pink-50 border-pink-200 text-pink-700 shadow-sm ring-2 ring-pink-100 ring-offset-1"
                    />
                </motion.div>

                {/* Pillar Filter */}
                <motion.div layout>
                    <MultiSelectFilter 
                        label="Pillar"
                        values={filterPillar}
                        options={pillarOptions}
                        onChange={setFilterPillar}
                        icon={<Landmark className="w-4 h-4" />}
                        activeColorClass="bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-2 ring-blue-100 ring-offset-1"
                    />
                </motion.div>

                {/* Category Filter */}
                <motion.div layout>
                    <MultiSelectFilter 
                        label="Category"
                        values={filterCategory}
                        options={categoryOptions}
                        onChange={setFilterCategory}
                        icon={<Tags className="w-4 h-4" />}
                        activeColorClass="bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm ring-2 ring-emerald-100 ring-offset-1"
                    />
                </motion.div>

                {/* Status Multi-Select Filter - Hidden in Archive */}
                {contentSubTab === 'ACTIVE' && (
                    <motion.div layout>
                        <MultiSelectFilter 
                            label="สถานะ"
                            values={filterStatuses}
                            options={statusOptions}
                            onChange={setFilterStatuses}
                            icon={<BarChart3 className="w-4 h-4" />}
                        />
                    </motion.div>
                )}

                <motion.div layout className="w-px h-8 bg-gray-200 mx-1 hidden xl:block"></motion.div>

                {/* Stock Toggle */}
                <motion.button
                    layout
                    onClick={() => setShowStockOnly(!showStockOnly)}
                    className={`
                        px-4 py-3 rounded-2xl text-sm font-bold transition-all border flex items-center whitespace-nowrap active:scale-95
                        ${showStockOnly 
                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 ring-2 ring-orange-100 ring-offset-1' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}
                    `}
                    title={showStockOnly ? "แสดงทั้งหมด" : "แสดงเฉพาะ Stock"}
                >
                    {showStockOnly ? <Layout className="w-4 h-4 mr-2 fill-white/20" /> : <ListFilter className="w-4 h-4 mr-2" />}
                    {showStockOnly ? 'Stock Only' : 'All Items'}
                </motion.button>

                {/* Clear All */}
                <AnimatePresence>
                    {hasActiveFilters && (
                        <motion.button 
                            layout
                            initial={{ opacity: 0, scale: 0.5, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.5, x: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={clearFilters}
                            className="p-3 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-2xl transition-all shadow-sm active:scale-90"
                            title="ล้างตัวกรองทั้งหมด"
                        >
                            <Trash2 className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
});

export default StockFilterBar;

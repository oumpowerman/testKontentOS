import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MasterOption } from '../../types';
import { useAnnualHolidays } from '../../hooks/useAnnualHolidays';
import { 
    Search, SlidersHorizontal, LayoutGrid, List, Loader2
} from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import FilterDropdown from '../common/FilterDropdown';

// Import modular components & utilities
import { MONTHS, HOLIDAY_TYPES, getHolidayTypeInfo, Holiday } from './holiday/holidayTypes';
import HolidayStats from './holiday/HolidayStats';
import HolidayForm from './holiday/HolidayForm';
import HolidayGridView from './holiday/HolidayGridView';
import HolidayListView from './holiday/HolidayListView';

interface AnnualHolidayManagerProps {
    masterOptions: MasterOption[];
}

const AnnualHolidayManager: React.FC<AnnualHolidayManagerProps> = ({ masterOptions }) => {
    const { annualHolidays, isLoading, addHoliday, updateHoliday, deleteHoliday } = useAnnualHolidays();
    const { showAlert } = useGlobalDialog();
    
    // Form State
    const [newName, setNewName] = useState('');
    const [newDay, setNewDay] = useState(1);
    const [newMonth, setNewMonth] = useState(1);
    const [newTypeKey, setNewTypeKey] = useState('ANNUAL'); // Default to Annual Holiday
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

    // Display View state (Monthly Grid vs. Compact List)
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

    const eventTypeOptions = useMemo(() => {
        return masterOptions.filter(o => o.type === 'EVENT_TYPE' && o.isActive);
    }, [masterOptions]);

    // Format months for the filter dropdown
    const monthFilterOptions = useMemo(() => {
        return [
            { key: 'ALL', label: 'ทุกเดือน 📅' },
            ...MONTHS.map(m => ({
                key: String(m.num),
                label: m.name
            }))
        ];
    }, []);

    const typeFilterOptions = useMemo(() => {
        const base = [
            { key: 'ALL', label: 'ทุกประเภท 🌟' },
            ...HOLIDAY_TYPES.map(t => ({
                key: t.key,
                label: t.label
            }))
        ];

        // Ensure other custom master EVENT_TYPEs are included
        eventTypeOptions.forEach(opt => {
            if (!base.some(b => b.key === opt.key)) {
                base.push({
                    key: opt.key,
                    label: opt.label
                });
            }
        });

        return base;
    }, [eventTypeOptions]);

    const handleStartEdit = (holiday: Holiday) => {
        setEditingId(holiday.id);
        setNewName(holiday.name);
        setNewDay(holiday.day);
        setNewMonth(holiday.month);
        setNewTypeKey(holiday.typeKey || holiday.type_key || 'ANNUAL');
        
        const formElement = document.getElementById('holiday-form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewName('');
        setNewDay(1);
        setNewMonth(1);
        setNewTypeKey('ANNUAL');
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newTypeKey) {
            await showAlert('กรุณากรอกชื่อและเลือกประเภทวันหยุดครับ', 'ข้อมูลไม่ครบถ้วน');
            return;
        }

        // Check for duplicates (except the currently edited holiday)
        const duplicate = (annualHolidays as Holiday[]).find(
            h => h.day === newDay && h.month === newMonth && h.id !== editingId
        );

        if (duplicate) {
            const typeInfo = getHolidayTypeInfo(duplicate.typeKey || duplicate.type_key || 'ANNUAL', eventTypeOptions);
            await showAlert(
                `มีวันหยุดชื่อ "${duplicate.name}" (${typeInfo.label}) ลงทะเบียนไว้ในวันนี้แล้ว หากต้องการเปลี่ยนแปลงข้อมูล กรุณาค้นหาเพื่อแก้ไขหรือลบวันหยุดนี้จากตาราง (Grid) หรือรายการ (List) ด้านขวาได้เลยครับ ✨`,
                '⚠️ วันที่นี้ถูกระบุเป็นวันหยุดไว้แล้วครับ'
            );
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateHoliday(editingId, newName, newDay, newMonth, newTypeKey);
                handleCancelEdit();
            } else {
                await addHoliday(newName, newDay, newMonth, newTypeKey);
                setNewName('');
                setNewDay(1);
                setNewMonth(1);
                setNewTypeKey('ANNUAL');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtered lists
    const filteredHolidays = useMemo<Holiday[]>(() => {
        return (annualHolidays as Holiday[]).filter(holiday => {
            const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesMonth = selectedMonthFilter === 'ALL' || String(holiday.month) === selectedMonthFilter;
            const matchesType = selectedTypeFilter === 'ALL' || holiday.typeKey === selectedTypeFilter;
            return matchesSearch && matchesMonth && matchesType;
        }).sort((a, b) => {
            if (a.month !== b.month) return a.month - b.month;
            return a.day - b.day;
        });
    }, [annualHolidays, searchTerm, selectedMonthFilter, selectedTypeFilter]);

    // Analytics: Dynamic stats for chosen or current month
    const monthStats = useMemo(() => {
        let targetMonthNum: number;
        let label = "วันหยุดประจำเดือน";

        if (selectedMonthFilter === 'ALL') {
            targetMonthNum = new Date().getMonth() + 1; // 1-indexed (1-12)
            label = "วันหยุดเดือนปัจจุบัน";
        } else {
            targetMonthNum = parseInt(selectedMonthFilter, 10);
            label = "วันหยุดประจำเดือน";
        }

        const found = MONTHS.find(m => m.num === targetMonthNum);
        const count = annualHolidays.filter(h => h.month === targetMonthNum).length;

        return {
            name: found ? found.name : '-',
            count: count,
            label: label
        };
    }, [annualHolidays, selectedMonthFilter]);

    // Active month based on selectedMonthFilter
    const activeMonthNum = useMemo(() => {
        if (selectedMonthFilter === 'ALL') {
            return new Date().getMonth() + 1; // 1-indexed (1-12)
        }
        return parseInt(selectedMonthFilter, 10);
    }, [selectedMonthFilter]);

    // Analytics: Holiday type distribution
    const typeBreakdown = useMemo(() => {
        const counts: Record<string, number> = {};
        annualHolidays.forEach(h => {
            counts[h.typeKey] = (counts[h.typeKey] || 0) + 1;
        });
        let maxType = '';
        let maxCount = 0;
        Object.entries(counts).forEach(([type, count]) => {
            if (count > maxCount) {
                maxCount = count;
                maxType = type;
            }
        });
        
        const typeInfo = getHolidayTypeInfo(maxType, eventTypeOptions);
        return {
            label: typeInfo.label,
            count: maxCount
        };
    }, [annualHolidays, eventTypeOptions]);

    const handleScrollToCurrentMonth = () => {
        const currentMonthNum = new Date().getMonth() + 1; // 1-12
        if (viewMode !== 'GRID') {
            setViewMode('GRID');
        }
        setTimeout(() => {
            const targetElement = document.getElementById(`holiday-month-grid-${currentMonthNum}`);
            if (targetElement) {
                targetElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 100);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Stats Overview */}
            <HolidayStats 
                totalCount={annualHolidays.length}
                monthStats={monthStats}
                typeBreakdown={typeBreakdown}
                onCurrentMonthClick={handleScrollToCurrentMonth}
            />

            {/* Split layout workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Side: Create / Edit Holiday Form Panel */}
                <div className="lg:col-span-4">
                    <HolidayForm 
                        editingId={editingId}
                        newName={newName}
                        setNewName={setNewName}
                        newDay={newDay}
                        setNewDay={setNewDay}
                        newMonth={newMonth}
                        setNewMonth={setNewMonth}
                        newTypeKey={newTypeKey}
                        setNewTypeKey={setNewTypeKey}
                        onCancelEdit={handleCancelEdit}
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        eventTypeOptions={eventTypeOptions}
                        annualHolidays={annualHolidays}
                    />
                </div>

                {/* Right Side: Search, Filter dropdowns & Grid/List Visualizations */}
                <div className="lg:col-span-8 space-y-4">
                    
                    {/* Header Controls, Search & Filter row */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-5 shadow-sm space-y-4">
                        
                        {/* Title & View Toggle */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                                    <span>วันหยุดประจำปี</span>
                                    <span className="text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                                        ผลลัพธ์ {filteredHolidays.length} วัน
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">ค้นหาและกรองข้อมูลเพื่อความสะดวกในการจัดการ</p>
                            </div>

                            {/* View Toggle Buttons */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/40 select-none">
                                <button
                                    onClick={() => setViewMode('GRID')}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        viewMode === 'GRID'
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    ตารางรายเดือน
                                </button>
                                <button
                                    onClick={() => setViewMode('LIST')}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        viewMode === 'LIST'
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <List className="w-3.5 h-3.5" />
                                    รายการเรียงแถว
                                </button>
                            </div>
                        </div>

                        {/* Search Input and FilterDropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
                            {/* Search */}
                            <div className="sm:col-span-4 relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                    <Search className="w-4 h-4" />
                                </span>
                                <input 
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3.5 text-xs font-bold border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 focus:border-indigo-500 bg-slate-50/50"
                                    placeholder="ค้นชื่อวันหยุด..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Month Filter Dropdown */}
                            <div className="sm:col-span-4">
                                <FilterDropdown 
                                    label="เลือกเดือน"
                                    options={monthFilterOptions}
                                    value={selectedMonthFilter}
                                    onChange={setSelectedMonthFilter}
                                    showAllOption={false}
                                    clearable={false}
                                    align="left"
                                    placeholder="ทุกเดือน"
                                />
                            </div>

                            {/* Type Filter Dropdown */}
                            <div className="sm:col-span-4">
                                <FilterDropdown 
                                    label="เลือกประเภท"
                                    options={typeFilterOptions}
                                    value={selectedTypeFilter}
                                    onChange={setSelectedTypeFilter}
                                    showAllOption={false}
                                    clearable={false}
                                    align="right"
                                    placeholder="ทุกประเภท"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Display of Holidays lists according to selected view mode */}
                    <div className="relative">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                <span className="text-xs font-bold text-slate-400">กำลังโหลดรายการวันหยุด...</span>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {viewMode === 'GRID' ? (
                                    <motion.div
                                        key="grid"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <HolidayGridView 
                                            holidays={filteredHolidays}
                                            onEdit={handleStartEdit}
                                            onDelete={deleteHoliday}
                                            editingId={editingId}
                                            eventTypeOptions={eventTypeOptions}
                                            activeMonthNum={activeMonthNum}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <HolidayListView 
                                            holidays={filteredHolidays}
                                            onEdit={handleStartEdit}
                                            onDelete={deleteHoliday}
                                            editingId={editingId}
                                            eventTypeOptions={eventTypeOptions}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AnnualHolidayManager;

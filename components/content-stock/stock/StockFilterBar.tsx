import React, { useMemo } from 'react';
import { ListFilter, Layout, Trash2, Film, Landmark, BarChart3 } from 'lucide-react';
import { Channel, MasterOption, Task } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import MultiSelectFilter from '../../common/MultiSelectFilter';

// Import our new modular components
import { SearchWithSuggestions } from './SearchWithSuggestions';
import { ShootDatePicker } from './ShootDatePicker';
import { ActiveFilterChipsRow } from './ActiveFilterChipsRow';

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
    // Derive Options with useMemo for Performance
    const formatOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [masterOptions]);

    const pillarOptions = useMemo(() => {
        const base = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive);
        const filtered = filterChannel.length === 0 
            ? base 
            : base.filter(o => !o.parentKey || filterChannel.includes(o.parentKey));
            
        return filtered.map(o => {
            if (o.parentKey) {
                const channel = channels.find(c => c.id === o.parentKey);
                if (channel) {
                    return {
                        ...o,
                        label: `${o.label} (${channel.name})`
                    };
                }
            }
            return o;
        }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [masterOptions, channels, filterChannel]);

    const categoryOptions = useMemo(() => {
        const base = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive);
        const filtered = filterChannel.length === 0 
            ? base 
            : base.filter(o => !o.parentKey || filterChannel.includes(o.parentKey));
            
        return filtered.map(o => {
            if (o.parentKey) {
                const channel = channels.find(c => c.id === o.parentKey);
                if (channel) {
                    return {
                        ...o,
                        label: `${o.label} (${channel.name})`
                    };
                }
            }
            return o;
        }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [masterOptions, channels, filterChannel]);

    const statusOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [masterOptions]);

    const hasActiveFilters = useMemo(() => {
        return searchQuery || 
               filterChannel.length > 0 || 
               filterFormat.length > 0 || 
               filterPillar.length > 0 || 
               filterCategory.length > 0 || 
               filterStatuses.length > 0 || 
               filterHasShootDate || 
               filterShootDateStart || 
               filterShootDateEnd;
    }, [
        searchQuery, filterChannel, filterFormat, filterPillar, 
        filterCategory, filterStatuses, filterHasShootDate, 
        filterShootDateStart, filterShootDateEnd
    ]);

    return (
        <motion.div 
            layout
            className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200/60 flex flex-col gap-3.5 relative z-50 transition-all hover:shadow-md"
        >
            <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center w-full">
                {/* Left: Search & Date Range */}
                <motion.div layout className="flex flex-col sm:flex-row gap-3 flex-1 items-stretch">
                    {/* Search Component */}
                    <SearchWithSuggestions 
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        tasks={tasks}
                    />

                    {/* Shoot Date Picker Component */}
                    <ShootDatePicker 
                        filterHasShootDate={filterHasShootDate}
                        setFilterHasShootDate={setFilterHasShootDate}
                        filterShootDateStart={filterShootDateStart}
                        setFilterShootDateStart={setFilterShootDateStart}
                        filterShootDateEnd={filterShootDateEnd}
                        setFilterShootDateEnd={setFilterShootDateEnd}
                    />
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
                            icon={<BarChart3 className="w-4 h-4" />} // Note: Category originally used 'Tags' / 'BarChart3' interchangeably, checking original code we retain visual parity
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
            </div>

            {/* Active Filter Chips Summary Row */}
            <ActiveFilterChipsRow 
                filterChannel={filterChannel}
                setFilterChannel={setFilterChannel}
                filterFormat={filterFormat}
                setFilterFormat={setFilterFormat}
                filterPillar={filterPillar}
                setFilterPillar={setFilterPillar}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filterStatuses={filterStatuses}
                setFilterStatuses={setFilterStatuses}
                filterHasShootDate={filterHasShootDate}
                setFilterHasShootDate={setFilterHasShootDate}
                filterShootDateStart={filterShootDateStart}
                setFilterShootDateStart={setFilterShootDateStart}
                filterShootDateEnd={filterShootDateEnd}
                setFilterShootDateEnd={setFilterShootDateEnd}
                channels={channels}
                masterOptions={masterOptions}
            />
        </motion.div>
    );
});

export default StockFilterBar;

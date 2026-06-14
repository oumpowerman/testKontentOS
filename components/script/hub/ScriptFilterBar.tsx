
import React, { useState, useEffect, useRef } from 'react';
import { Filter, ChevronDown, LayoutGrid, List, User as UserIcon, X, Check, MonitorPlay, Search, Users, Activity, ArrowDownAZ, ArrowUpAZ, Calendar, Trash2, Sparkles, Tag, Loader2, Hash, CheckCircle, Eye, Layers } from 'lucide-react';
import { Channel, User, MasterOption } from '../../../types';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import ChannelFilter from './ChannelFilter';
import CreatorFilter from './CreatorFilter';
import TagFilter from './TagFilter';
import ScriptCategoryFilter from './ScriptCategoryFilter';

import { ScriptHubMode } from './ScriptModeSwitcher';

interface ScriptFilterBarProps {
    layoutMode: 'GRID' | 'LIST';
    setLayoutMode: (mode: 'GRID' | 'LIST') => void;
    
    // Search
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    
    // Filters (Arrays now)
    filterOwner: string[];
    setFilterOwner: (val: string[]) => void;
    filterChannel: string[];
    setFilterChannel: (val: string[]) => void;
    filterCategory: string;
    setFilterCategory: (val: string) => void;
    filterTags: string[];
    setFilterTags: (val: string[]) => void;

    // NEW: Status & Sort
    filterStatus: string[];
    setFilterStatus: (val: string[]) => void;
    sortOrder: 'ASC' | 'DESC';
    setSortOrder: (val: 'ASC' | 'DESC') => void;

    // Deep Search
    isDeepSearch: boolean;
    setIsDeepSearch: (val: boolean) => void;

    // Data
    users: User[];
    channels: Channel[];
    masterOptions: MasterOption[];
    mode?: ScriptHubMode; // NEW
}

// Define correct Script Lifecycle Statuses with styling
export const SCRIPT_STATUS_OPTIONS = [
    { key: 'ALL', label: 'ทุกสถานะ (All)', icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    { key: 'DRAFT', label: 'Draft (ร่าง)', icon: List, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: 'REVIEW', label: 'Review (รอตรวจ)', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'FINAL', label: 'Final (สมบูรณ์)', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'SHOOTING', label: 'Shooting (ถ่ายทำ)', icon: MonitorPlay, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { key: 'DONE', label: 'Done (เสร็จสิ้น)', icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' }
];

const ScriptFilterBar: React.FC<ScriptFilterBarProps> = React.memo(({
    layoutMode, setLayoutMode,
    searchQuery, setSearchQuery,
    filterOwner, setFilterOwner,
    filterChannel, setFilterChannel,
    filterCategory, setFilterCategory,
    filterTags, setFilterTags,
    filterStatus, setFilterStatus,
    sortOrder, setSortOrder,
    isDeepSearch, setIsDeepSearch,
    users, channels, masterOptions,
    mode = 'HUB'
}) => {
    const isStudio = mode === 'STUDIO';
    // Local state for debouncing search input
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const statusRef = useRef<HTMLDivElement>(null);
    
    // Sync local state if parent prop changes externally (e.g. back button or URL change)
    useEffect(() => {
        // Only update local state if it's different from the prop AND we're not currently typing
        // This prevents the "jumping" or "clearing" effect when navigating back
        if (searchQuery !== localSearch) {
            setLocalSearch(searchQuery);
        }
    }, [searchQuery]);

    // Close status dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounce effect: Sync localSearch to parent searchQuery
    useEffect(() => {
        // If they are already the same, no need to set a timeout
        if (localSearch === searchQuery) return;

        const handler = setTimeout(() => {
            setSearchQuery(localSearch);
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, setSearchQuery, searchQuery]);

    const scriptCategoryOptions = React.useMemo(() => {
        const base = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive);
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

    const toggleFilter = (id: string, currentList: string[], setList: (l: string[]) => void) => {
        if (currentList.includes(id)) {
            setList(currentList.filter(x => x !== id));
        } else {
            setList([...currentList, id]);
        }
    };

    const clearOwner = () => setFilterOwner([]);
    const clearChannel = () => setFilterChannel([]);
    const clearTags = () => setFilterTags([]);

    return (
        <div className="flex flex-col gap-4 p-1">
            <style>{`
                .premium-3d-container {
                    background: ${isStudio 
                        ? 'linear-gradient(135deg, rgba(245, 243, 255, 0.8) 0%, rgba(239, 246, 255, 0.7) 100%)' 
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.7) 100%)'};
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 
                        0 10px 25px -5px rgba(0, 0, 0, 0.05),
                        0 8px 10px -6px rgba(0, 0, 0, 0.03),
                        inset 0 1px 1px 0 rgba(255, 255, 255, 0.8);
                }
            `}</style>
            
            {/* Filter Section (Chips) - Animated Expansion with Framer Motion */}
            <LayoutGroup>
                <AnimatePresence>
                    {isFilterExpanded && (
                        <motion.div 
                            layout
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
                            className="flex flex-col gap-3 px-1 overflow-hidden"
                        >
                            {/* 1. Channel Filter Row (New Component) */}
                            <ChannelFilter 
                                channels={channels}
                                selectedIds={filterChannel}
                                onToggle={(id) => toggleFilter(id, filterChannel, setFilterChannel)}
                                onClear={clearChannel}
                            />

                            {/* 2. Writer Filter Row (New Component) */}
                            <CreatorFilter 
                                users={users}
                                channels={channels}
                                selectedIds={filterOwner}
                                onToggle={(id) => toggleFilter(id, filterOwner, setFilterOwner)}
                                onClear={clearOwner}
                            />

                            {/* 3. Category Filter Row */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Layers className="w-3 h-3" /> Category Filter
                                </div>
                                <ScriptCategoryFilter
                                    categories={scriptCategoryOptions}
                                    value={filterCategory}
                                    onChange={setFilterCategory}
                                />
                            </div>

                            {/* 4. Smart Tag Filter Row */}
                            <TagFilter 
                                selectedTags={filterTags}
                                onToggle={(tag) => toggleFilter(tag, filterTags, setFilterTags)}
                                onClear={clearTags}
                                // Pass current context for smart counting
                                filterOwner={filterOwner}
                                filterChannel={filterChannel}
                                filterCategory={filterCategory}
                                filterStatus={filterStatus}
                                searchQuery={searchQuery}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </LayoutGroup>

            {/* Top Bar: Search & Layout Toggle - Moved to BOTTOM */}
            <div className="premium-3d-container p-2.5 rounded-[1.5rem] sticky top-2 z-[50] flex flex-col lg:flex-row gap-3 lg:gap-4 items-center transition-all duration-500 hover:shadow-xl">
                <div className="flex-1 w-full relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className={`w-4.5 h-4.5 text-gray-400 transition-colors ${isStudio ? 'group-focus-within:text-violet-500' : 'group-focus-within:text-indigo-500'}`} />
                    </div>
                    <input 
                        type="text" 
                        placeholder={isDeepSearch ? "ค้นหาคำในเนื้อหาบทสคริปต์..." : "ค้นหาสคริปต์ (ชื่อ, แท็ก)..."} 
                        className={`w-full pl-11 pr-12 py-2.5 bg-white/50 border rounded-xl focus:ring-4 outline-none transition-all text-sm font-black text-gray-700 placeholder:text-gray-400/80 shadow-inner ${isDeepSearch ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-400' : (isStudio ? 'border-violet-200 focus:ring-violet-500/10 focus:border-violet-300' : 'border-gray-200/60 focus:ring-indigo-500/10 focus:border-indigo-300')}`}
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                    />
                    
                    {/* Deep Search Toggle Button inside Input */}
                    <button
                        onClick={() => setIsDeepSearch(!isDeepSearch)}
                        className={`
                            absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-300 flex items-center gap-1.5
                            ${isDeepSearch 
                                ? 'bg-rose-500 text-white shadow-md scale-105' 
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            }
                        `}
                        title={isDeepSearch ? "ปิดโหมดค้นหาในเนื้อหาบท" : "เปิดโหมดค้นหาในเนื้อหาบท (Deep Search)"}
                    >
                        <Sparkles className={`w-3.5 h-3.5 ${isDeepSearch ? 'animate-pulse' : ''}`} />
                        {isDeepSearch && <span className="text-[10px] font-black pr-1">DEEP</span>}
                    </button>
                </div>
                
                {/* Right Side Controls Group */}
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 w-full lg:w-auto">
                    {/* Filter Toggle Button */}
                    <button 
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        className={`
                            flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-500 border shadow-sm
                            ${isFilterExpanded 
                                ? (isStudio ? 'bg-violet-600 text-white border-violet-500 shadow-violet-200' : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-200') 
                                : (isStudio ? 'bg-white text-gray-600 border-gray-200 hover:border-violet-200 hover:text-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600')
                            }
                        `}
                    >
                        <Filter className={`w-3.5 h-3.5 sm:w-4 h-4 ${isFilterExpanded ? 'animate-pulse' : ''}`} />
                        <span className="inline">FILTERS</span>
                        {(filterOwner.length > 0 || filterChannel.length > 0 || filterTags.length > 0 || (filterCategory && filterCategory !== 'ALL')) && (
                            <span className={`
                                flex items-center justify-center w-4 h-4 sm:w-5 h-5 rounded-full text-[9px] sm:text-[10px] font-black
                                ${isFilterExpanded ? 'bg-white text-indigo-600' : (isStudio ? 'bg-violet-600 text-white' : 'bg-indigo-600 text-white')}
                            `}>
                                {filterOwner.length + filterChannel.length + filterTags.length + (filterCategory !== 'ALL' ? 1 : 0)}
                            </span>
                        )}
                    </button>

                    <div className="hidden sm:block w-px h-8 bg-gray-200/60 mx-0.5"></div>

                    {/* Sort Toggle */}
                    <button 
                        onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
                        className={`
                            p-2.5 rounded-xl transition-all duration-500 border shadow-sm active:scale-95
                            ${sortOrder === 'DESC' 
                                ? (isStudio ? 'bg-white text-violet-600 border-violet-100 hover:bg-violet-50' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50') 
                                : (isStudio ? 'bg-gradient-to-br from-violet-500 to-blue-600 text-white border-transparent shadow-md' : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-transparent shadow-md')
                            }
                        `}
                        title={sortOrder === 'DESC' ? 'ล่าสุดไปเก่าสุด' : 'เก่าสุดไปล่าสุด'}
                    >
                         {sortOrder === 'DESC' ? <ArrowDownAZ className="w-4 h-4 sm:w-4.5 h-4.5" /> : <ArrowUpAZ className="w-4 h-4 sm:w-4.5 h-4.5" />}
                    </button>

                    {/* Status Dropdown */}
                    <div className="relative flex-1 sm:flex-none" ref={statusRef}>
                        <button 
                            onClick={() => setIsStatusOpen(!isStatusOpen)}
                            className={`
                                w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black border transition-all duration-500 shadow-sm
                                ${!filterStatus.includes('ALL')
                                    ? (isStudio ? 'bg-gradient-to-br from-violet-50 to-white text-violet-700 border-violet-200 ring-4 ring-violet-50/50' : 'bg-gradient-to-br from-indigo-50 to-white text-indigo-700 border-indigo-200 ring-4 ring-indigo-50/50') 
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/10'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                {(() => {
                                    const selected = SCRIPT_STATUS_OPTIONS.filter(o => filterStatus.includes(o.key));
                                    if (selected.length === 0 || filterStatus.includes('ALL')) {
                                        return (
                                            <>
                                                <Activity className="w-3.5 h-3.5 sm:w-4 h-4 text-slate-500 shrink-0" />
                                                <span className="truncate max-w-[80px] sm:max-w-[100px]">ทุกสถานะ</span>
                                            </>
                                        );
                                    }
                                    return (
                                        <>
                                            <span className="truncate max-w-[80px] sm:max-w-[100px]">{selected.map(s => s.label.split(' ')[0]).join(', ')}</span>
                                        </>
                                    );
                                })()}
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${isStatusOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                        </button>

                        {isStatusOpen && (
                            <div className="absolute bottom-full mb-2 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] p-1.5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                                <div className="px-3 py-2 mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เลือกสถานะสคริปต์</span>
                                </div>
                                {SCRIPT_STATUS_OPTIONS.map(opt => {
                                    const Icon = opt.icon;
                                    const isSelected = filterStatus.includes(opt.key);
                                    return (
                                        <button
                                            key={opt.key}
                                            onClick={() => {
                                                if (opt.key === 'ALL') {
                                                    setFilterStatus(['ALL']);
                                                } else {
                                                    const next = filterStatus.includes('ALL') 
                                                        ? [opt.key] 
                                                        : filterStatus.includes(opt.key)
                                                            ? filterStatus.filter(k => k !== opt.key)
                                                            : [...filterStatus, opt.key];
                                                    setFilterStatus(next.length === 0 ? ['ALL'] : next);
                                                }
                                            }}
                                            className={`
                                                w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200
                                                ${filterStatus.includes(opt.key)
                                                    ? `${opt.bg} ${opt.color} shadow-sm ring-1 ${opt.border}` 
                                                    : 'text-slate-600 hover:bg-slate-50 hover:pl-4'
                                                }
                                            `}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isSelected ? opt.border : 'bg-slate-50 border-slate-100'}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-xs flex-1 text-left">{opt.label}</span>
                                            {isSelected && <Check className="w-4 h-4" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-8 bg-gray-200/60 mx-1"></div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100/50 backdrop-blur-sm p-1 rounded-xl shrink-0 border border-gray-200/60 shadow-inner">
                        <button 
                            onClick={() => setLayoutMode('GRID')} 
                            className={`p-2 rounded-lg transition-all duration-500 ${layoutMode === 'GRID' ? (isStudio ? 'bg-white shadow-md text-violet-600 scale-110 ring-1 ring-black/5' : 'bg-white shadow-md text-indigo-600 scale-110 ring-1 ring-black/5') : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                        >
                            <LayoutGrid className="w-4.5 h-4.5" />
                        </button>
                        <button 
                            onClick={() => setLayoutMode('LIST')} 
                            className={`p-2 rounded-lg transition-all duration-500 ${layoutMode === 'LIST' ? (isStudio ? 'bg-white shadow-md text-violet-600 scale-110 ring-1 ring-black/5' : 'bg-white shadow-md text-indigo-600 scale-110 ring-1 ring-black/5') : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                        >
                            <List className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ScriptFilterBar;

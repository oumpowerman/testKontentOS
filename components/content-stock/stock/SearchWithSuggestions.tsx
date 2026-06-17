import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Search, X, Tags } from 'lucide-react';
import { Task } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchWithSuggestionsProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    tasks: Task[];
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = React.memo(({
    searchQuery,
    setSearchQuery,
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
    const [filteredTags, setFilteredTags] = useState<{ name: string; count: number }[]>([]);
    const [isSearchingTags, setIsSearchingTags] = useState(false);
    const [searchSpeedMs, setSearchSpeedMs] = useState('0ms');

    // Helper to extract tag typing context
    const currentTagTypeMatch = useMemo(() => localSearch.match(/#(\S*)$/), [localSearch]);
    const filterKeyword = useMemo(() => currentTagTypeMatch ? currentTagTypeMatch[1].toLowerCase() : '', [currentTagTypeMatch]);

    // Fast server-side fetching routine (Enterprise Design Pattern)
    useEffect(() => {
        let isCurrent = true;
        
        async function fetchTags() {
            if (!showSuggestions) return;

            setIsSearchingTags(true);
            try {
                const response = await fetch(`/api/tags?q=${encodeURIComponent(filterKeyword)}&limit=15`);
                if (!response.ok) throw new Error('API query failed');
                const data = await response.json();
                
                if (isCurrent && data.success) {
                    setFilteredTags(data.tags || []);
                    setSearchSpeedMs(data.speedMs || '0ms');
                }
            } catch (err) {
                console.warn('Server tags API query failed, falling back to local calculation:', err);
                
                if (isCurrent) {
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
                    const allLocalTags = Object.entries(counts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count);

                    if (!currentTagTypeMatch) {
                        setFilteredTags(allLocalTags.slice(0, 12));
                    } else {
                        setFilteredTags(allLocalTags.filter(tag => tag.name.toLowerCase().includes(filterKeyword)));
                    }
                    setSearchSpeedMs('<1ms (offline fallback)');
                }
            } finally {
                if (isCurrent) {
                    setIsSearchingTags(false);
                }
            }
        }

        const fetchDebounce = setTimeout(() => {
            fetchTags();
        }, 80); // Lightweight 80ms keystroke debounce specifically for tag suggestions

        return () => {
            isCurrent = false;
            clearTimeout(fetchDebounce);
        };
    }, [filterKeyword, showSuggestions, currentTagTypeMatch, tasks]);

    // Automatically sync when client alters/creates task tags
    useEffect(() => {
        fetch('/api/tags/sync', { method: 'POST' }).catch(() => {});
    }, [tasks.length]);

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
    }, []);

    return (
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
                    <>
                        {/* Mobile Background Backdrop Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSuggestions(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            className="fixed md:absolute bottom-4 left-4 right-4 md:bottom-auto md:top-full md:left-0 md:right-auto md:inset-x-auto mt-2 md:w-full md:max-w-[420px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-[100] overflow-hidden text-left origin-bottom md:origin-top-left"
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

                            {isSearchingTags ? (
                                <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                                    <p className="text-[10px] text-gray-400 font-bold">กำลังประมวลผลดัชนีเซิร์ฟเวอร์...</p>
                                </div>
                            ) : filteredTags.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-black tracking-wider text-gray-400 uppercase">
                                        <span>{currentTagTypeMatch ? 'แท็กที่ตรงกับการค้นหา' : 'แท็กยอดนิยมในระบบ'}</span>
                                        <span className="text-emerald-500 font-mono text-[9px] bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100/50 flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                                            ⚡ Server Index: {searchSpeedMs}
                                        </span>
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
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

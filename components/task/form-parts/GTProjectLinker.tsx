
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link as LinkIcon, Search, LayoutTemplate, X, Unlink, ChevronRight, Layers, Loader2, ChevronDown, Check, Layout, ExternalLink } from 'lucide-react';
import { Task, Status, Channel, MasterOption } from '../../../types';
import { STATUS_COLORS } from '../../../constants';
import { supabase } from '../../../lib/supabase';

interface Props {
    projectId: string;
    setProjectId: (id: string) => void;
    projects: Task[]; // Still kept as cache/fallback
    channels: Channel[];
    masterOptions: MasterOption[]; // Added for Format Filter
    onOpenTask?: (task: Task) => void;
}

const PAGE_SIZE = 20;

const GTProjectLinker: React.FC<Props> = ({ projectId, setProjectId, projects, channels = [], masterOptions = [], onOpenTask }) => {
    const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    
    // Filters
    const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
    const [selectedFormat, setSelectedFormat] = useState<string>('ALL');

    // UI State for Dropdown
    const [isFormatOpen, setIsFormatOpen] = useState(false);
    const formatDropdownRef = useRef<HTMLDivElement>(null);
    
    // Async State
    const [remoteProjects, setRemoteProjects] = useState<Task[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [resolvedParent, setResolvedParent] = useState<Task | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Derive Format Options
    const formatOptions = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'FORMAT' && o.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [masterOptions]);

    // Click Outside Handler for Dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
                setIsFormatOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 1. Resolve Parent Logic (Cache-First, then Network)
    useEffect(() => {
        if (!projectId) {
            setResolvedParent(null);
            return;
        }

        const cached = projects.find(p => p.id === projectId);
        if (cached) {
            setResolvedParent(cached);
        } else {
            const fetchSingle = async () => {
                const { data } = await supabase
                    .from('contents')
                    .select('id, title, status, content_formats')
                    .eq('id', projectId)
                    .single();
                
                if (data) {
                    setResolvedParent({
                        ...data,
                        contentFormats: data.content_formats || []
                    } as unknown as Task);
                }
            };
            fetchSingle();
        }
    }, [projectId, projects]);

    // 2. Fetch Logic (Re-usable)
    const fetchProjects = async (currentPage: number, isLoadMore: boolean = false) => {
        if (!isLoadMore) setIsSearching(true);
        else setIsLoadingMore(true);

        try {
            let query = supabase
                .from('contents')
                .select('id, title, status, channel_id, created_at, content_formats')
                .order('created_at', { ascending: false });

            // Apply Filters
            if (projectSearch.trim()) {
                query = query.ilike('title', `%${projectSearch.trim()}%`);
            }
            if (selectedChannel !== 'ALL') {
                query = query.eq('channel_id', selectedChannel);
            }
            if (selectedFormat !== 'ALL') {
                query = query.overlaps('content_formats', [selectedFormat]);
            }

            // Pagination Range
            const from = (currentPage - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to);

            const { data, error } = await query;
            
            if (!error && data) {
                const mapped = data.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    status: d.status,
                    channelId: d.channel_id,
                    contentFormats: d.content_formats || [],
                    createdAt: d.created_at
                })) as unknown as Task[];
                
                if (isLoadMore) {
                    setRemoteProjects(prev => [...prev, ...mapped]);
                } else {
                    setRemoteProjects(mapped);
                }

                // Check if we reached the end
                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    };

    // 3. Search Trigger (Debounced)
    useEffect(() => {
        if (!isProjectPickerOpen) return;
        
        const timer = setTimeout(() => {
            setPage(1); // Reset page on filter change
            fetchProjects(1, false);
        }, 300);

        return () => clearTimeout(timer);
    }, [isProjectPickerOpen, projectSearch, selectedChannel, selectedFormat]);

    // 4. Load More Handler
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProjects(nextPage, true);
    };

    const currentFormatLabel = selectedFormat === 'ALL' 
        ? 'All Formats' 
        : formatOptions.find(f => f.key === selectedFormat)?.label || selectedFormat;

    // Helper to get Format Label
    const getFormatLabel = (key: string) => {
        return formatOptions.find(f => f.key === key)?.label || key;
    };

    // Helper to get Status Label
    const getStatusLabel = (status: string) => {
        const option = masterOptions.find(o => o.type === 'STATUS' && o.key === status);
        return option ? option.label : status.replace(/_/g, ' '); 
    };

    const handleViewContent = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (resolvedParent && onOpenTask) {
            onOpenTask(resolvedParent);
        }
    };

    return (
        <div className="space-y-3">
             <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center ml-1">
                <LinkIcon className="w-3 h-3 mr-1.5" /> Project Association
            </label>
           
            {resolvedParent ? (
                // --- LINKED STATE (Card) ---
                <div 
                    onClick={handleViewContent}
                    className="relative group overflow-hidden bg-gradient-to-r from-indigo-50 to-white p-1 rounded-[1.5rem] border-2 border-indigo-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 cursor-pointer"
                >
                    <div className="flex items-center p-3 gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                            <LayoutTemplate className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Linked to Parent</p>
                                <ExternalLink className="w-3 h-3 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h4 className="font-bold text-indigo-900 text-md truncate group-hover:text-indigo-600 transition-colors">{resolvedParent.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase ${STATUS_COLORS[resolvedParent.status as Status] || 'bg-gray-100 text-gray-500'}`}>
                                    {getStatusLabel(resolvedParent.status)}
                                </span>
                                {resolvedParent.contentFormats && resolvedParent.contentFormats.length > 0 && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded border border-purple-100 bg-purple-50 text-purple-600 font-bold uppercase">
                                        {getFormatLabel(resolvedParent.contentFormats[0])}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setProjectId(''); }} 
                            className="w-9 h-9 rounded-xl bg-white border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-all shadow-sm active:scale-95 z-10"
                            title="ยกเลิกการเชื่อมโยง (Unlink)"
                        >
                            <Unlink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                // --- UNLINKED STATE (Button) ---
                <button
                    type="button"
                    onClick={() => setIsProjectPickerOpen(true)}
                    className="group w-full py-4 px-4 border-2 border-dashed border-indigo-200/70 bg-indigo-50/30 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 transition-all hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm active:scale-95"
                >
                    <div className="p-2 bg-white rounded-full text-indigo-400 shadow-sm group-hover:scale-110 transition-transform">
                        <Search className="w-5 h-5" />
                    </div>
                    <span className="text-md font-medium text-indigo-400 group-hover:text-indigo-600">
                        เลือกโปรเจกต์หลัก (Select Parent Project)
                    </span>
                </button>
            )}

            {/* --- PROJECT PICKER MODAL --- */}
            {isProjectPickerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-indigo-100">
                        
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-indigo-50 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shrink-0 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            
                            <div className="relative z-10">
                                <h3 className="font-black text-xl flex items-center gap-2">
                                    <Layers className="w-6 h-6 text-indigo-200" /> เลือกโปรเจกต์
                                </h3>
                                <p className="text-indigo-100 text-xs font-medium mt-1">Live Search from Database</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsProjectPickerOpen(false)} 
                                className="relative z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Filters & Search */}
                        <div className="p-5 bg-white border-b border-gray-100 space-y-4 shadow-sm relative z-20">
                            
                            {/* Filter Row */}
                            <div className="flex gap-2 overflow-visible">
                                 {/* Channel Filter Chips (Scrollable) */}
                                 <div className="flex-1 overflow-x-auto pb-1 scrollbar-hide flex gap-2">
                                     <button 
                                        type="button"
                                        onClick={() => setSelectedChannel('ALL')}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all ${selectedChannel === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                     >
                                         All Channels
                                     </button>
                                     {(channels || []).map(c => (
                                         <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedChannel(c.id)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all ${selectedChannel === c.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                         >
                                            {c.name}
                                         </button>
                                     ))}
                                 </div>

                                 {/* Format Filter (Custom Dropdown) */}
                                 <div className="relative shrink-0" ref={formatDropdownRef}>
                                     <button 
                                        type="button"
                                        onClick={() => setIsFormatOpen(!isFormatOpen)}
                                        className={`
                                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all
                                            ${isFormatOpen || selectedFormat !== 'ALL' 
                                                ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}
                                        `}
                                     >
                                        <Layout className="w-3 h-3" />
                                        <span className="truncate max-w-[80px]">{currentFormatLabel}</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform ${isFormatOpen ? 'rotate-180' : ''}`} />
                                     </button>

                                     {isFormatOpen && (
                                         <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-1 animate-in fade-in zoom-in-95 max-h-[200px] overflow-y-auto">
                                             <button 
                                                type="button"
                                                onClick={() => { setSelectedFormat('ALL'); setIsFormatOpen(false); }}
                                                className={`w-full  text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${selectedFormat === 'ALL' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                             >
                                                All Formats
                                                {selectedFormat === 'ALL' && <Check className="w-3 h-3" />}
                                             </button>
                                             {formatOptions.map(f => (
                                                 <button
                                                    key={f.key}
                                                    type="button"
                                                    onClick={() => { setSelectedFormat(f.key); setIsFormatOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${selectedFormat === f.key ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                                 >
                                                    {f.label}
                                                    {selectedFormat === f.key && <Check className="w-3 h-3" />}
                                                 </button>
                                             ))}
                                         </div>
                                     )}
                                 </div>
                            </div>

                            {/* Search Input */}
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />}
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="พิมพ์เพื่อค้นหา..." 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-sm font-bold text-gray-700 transition-all bg-gray-50 focus:bg-white"
                                    value={projectSearch}
                                    onChange={e => setProjectSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Projects List */}
                        <div className="overflow-y-auto flex-1 p-4 space-y-2 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-indigo-100">
                            {isSearching && remoteProjects.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-50">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                                    <p className="text-gray-400 font-bold text-sm">กำลังค้นหา...</p>
                                </div>
                            ) : remoteProjects.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-50">
                                    <LayoutTemplate className="w-12 h-12 text-gray-300 mb-2" />
                                    <p className="text-gray-400 font-bold text-sm">ไม่พบโปรเจกต์</p>
                                </div>
                            ) : (
                                <>
                                    {remoteProjects.map(proj => (
                                        <button 
                                            key={proj.id} 
                                            type="button"
                                            onClick={() => { setProjectId(proj.id); setIsProjectPickerOpen(false); }}
                                            className="w-full text-left p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group relative overflow-hidden"
                                        >
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                                    <LayoutTemplate className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-indigo-700 transition-colors max-w-[200px]">{proj.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase border ${STATUS_COLORS[proj.status as Status] || 'bg-gray-100 text-gray-500'}`}>
                                                            {getStatusLabel(proj.status)}
                                                        </span>
                                                        {proj.contentFormats && proj.contentFormats.length > 0 && (
                                                            <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase border bg-purple-50 text-purple-600 border-purple-100">
                                                                {getFormatLabel(proj.contentFormats[0])}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="relative z-10 text-gray-300 group-hover:text-indigo-500 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                            
                                            {/* Hover Effect BG */}
                                            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        </button>
                                    ))}

                                    {/* Load More Button */}
                                    {hasMore && (
                                        <button 
                                            type="button"
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                            className="w-full py-3 mt-2 rounded-xl border border-gray-200 text-gray-500 font-bold text-xs hover:bg-gray-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                                            {isLoadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GTProjectLinker;

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Task, Channel, MasterOption } from '../types';
import { 
    Search, Package, GripVertical, Calendar, Archive, X, 
    LayoutTemplate, SlidersHorizontal, Video, Sparkles,
    ChevronDown, Loader2
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import StockFilterModal from './stock/StockFilterModal';
import { supabase } from '../lib/supabase';

interface StockSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[]; // For drag sync lookups from calendar
    channels: Channel[];
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
    onMoveTask?: (task: Task) => void;
}

const mapSupabaseToTask = (data: any, type: 'CONTENT' | 'TASK' = 'CONTENT'): Task => {
    const startDateVal = data.start_date || data.startDate;
    const endDateVal = data.end_date || data.endDate;

    let platforms = [];
    if (Array.isArray(data.target_platform)) {
        platforms = data.target_platform;
    } else if (data.target_platform) {
        platforms = [data.target_platform];
    }

    const reviews = (data.task_reviews || []).map((r: any) => ({
        id: r.id,
        taskId: r.content_id || r.task_id, 
        round: r.round,
        scheduledAt: new Date(r.scheduled_at),
        reviewerId: r.reviewer_id,
        status: r.status,
        feedback: r.feedback,
        isCompleted: r.is_completed
    }));

    return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        type: type, 
        status: data.status,
        priority: type === 'TASK' ? data.priority : undefined,
        tags: data.tags || [],
        pillar: data.pillar,
        contentFormats: data.content_formats || [],
        category: data.category,
        remark: data.remark,
        startDate: new Date(startDateVal || data.created_at),
        endDate: new Date(endDateVal || data.created_at),
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        channelId: data.channel_id || data.channelId,
        targetPlatforms: platforms,
        scheduledTime: data.scheduled_time || data.scheduledTime,
        isUnscheduled: data.is_unscheduled ?? data.isUnscheduled ?? false,
        assigneeIds: data.assignee_ids || data.assigneeIds || [],
        ideaOwnerIds: data.idea_owner_ids || data.ideaOwnerIds || [],
        editorIds: data.editor_ids || data.editorIds || [],
        assets: data.assets || [],
        reviews: reviews.sort((a: any, b: any) => a.round - b.round),
        logs: [], 
        performance: data.performance || undefined,
        difficulty: data.difficulty || 'MEDIUM',
        estimatedHours: data.estimated_hours || 0,
        assigneeType: data.assignee_type || 'TEAM',
        targetPosition: data.target_position,
        caution: data.caution,
        importance: data.importance,
        publishedLinks: data.published_links || {},
        shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
        shootLocation: data.shoot_location || undefined,
        shootTripId: data.shoot_trip_id || undefined,
        shootTimeStart: data.shoot_time_start || undefined,
        shootTimeEnd: data.shoot_time_end || undefined,
        shootNotes: data.shoot_notes || undefined,
        localPath: data.local_path || undefined,
        driveLabel: data.drive_label || undefined,
        isInShootQueue: data.is_in_shoot_queue || data.isInShootQueue || false,
        isSoftFinished: data.is_soft_finished || data.isSoftFinished || false,
        contentId: data.content_id,
        showOnBoard: data.show_on_board,
        parentContentTitle: data.contents?.title,
        roadmapId: data.roadmap_id,
        scriptId: data.script_id,
        sla_revert_count: data.sla_revert_count,
        is_penalized: data.is_penalized,
        last_penalized_at: data.last_penalized_at ? new Date(data.last_penalized_at) : undefined,
    } as any;
};

const StockSidePanel: React.FC<StockSidePanelProps> = ({
    isOpen,
    onClose,
    tasks,
    channels,
    masterOptions,
    onEditTask,
    onMoveTask
}) => {
    // --- Local States ---
    const [searchQuery, setSearchQuery] = useState('');
    const [dragCounter, setDragCounter] = useState(0);
    const isDragOver = dragCounter > 0;
    
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        channels: [] as string[],
        statuses: [] as string[],
        formats: [] as string[],
        pillars: [] as string[],
        categories: [] as string[],
        shootDateStart: '',
        shootDateEnd: ''
    });

    const [localStockTasks, setLocalStockTasks] = useState<Task[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [fetchingTasks, setFetchingTasks] = useState(false);

    // --- Derived Data ---
    const statusOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder), 
    [masterOptions]);

    const matchesFilters = useCallback((t: Task) => {
        if (t.type !== 'CONTENT') return false;
        if (!t.isUnscheduled) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            const matchTitle = t.title.toLowerCase().includes(query);
            const matchDesc = (t.description || '').toLowerCase().includes(query);
            if (!matchTitle && !matchDesc) return false;
        }

        if (filters.channels.length > 0 && !filters.channels.includes(t.channelId || '')) return false;
        if (filters.statuses.length > 0 && !filters.statuses.includes(t.status as string)) return false;
        if (filters.formats.length > 0) {
            const formats = t.contentFormats || [];
            if (!filters.formats.some(f => formats.includes(f))) return false;
        }
        if (filters.pillars.length > 0 && !filters.pillars.includes(t.pillar || '')) return false;
        if (filters.categories.length > 0 && !filters.categories.includes(t.category || '')) return false;

        if (filters.shootDateStart) {
            if (!t.shootDate) return false;
            const taskDate = startOfDay(new Date(t.shootDate));
            const start = startOfDay(new Date(filters.shootDateStart));
            
            if (filters.shootDateEnd) {
                const end = endOfDay(new Date(filters.shootDateEnd));
                if (!isWithinInterval(taskDate, { start, end })) return false;
            } else {
                if (taskDate < start) return false;
            }
        }

        return true;
    }, [searchQuery, filters]);

    // --- Dynamic fetching ---
    const fetchStockTasks = useCallback(async (isFirstPage: boolean) => {
        if (!isOpen) return;
        setFetchingTasks(true);
        const currentPage = isFirstPage ? 1 : page;
        const limitNum = 20;
        const offset = (currentPage - 1) * limitNum;

        try {
            let query = supabase
                .from('contents')
                .select(`
                    id, title, description, status, pillar, category, content_formats, tags,
                    start_date, end_date, channel_id, created_at, updated_at, is_unscheduled, remark, scheduled_time,
                    target_platform, assignee_ids, idea_owner_ids, editor_ids, shoot_trip_id,
                    shoot_date, is_in_shoot_queue, is_soft_finished, sla_revert_count,
                    task_reviews(id, round, status, is_completed),
                    content_analytics(id, platform),
                    sponsorship_details(is_sponsored, deal_value, requirements, payment_status, is_paid, invoice_url, client_id)
                `)
                .eq('is_unscheduled', true);

            if (searchQuery) {
                const queryStr = searchQuery.trim();
                query = query.or(`title.ilike.%${queryStr}%,description.ilike.%${queryStr}%`);
            }

            if (filters.channels.length > 0) {
                query = query.in('channel_id', filters.channels);
            }
            if (filters.statuses.length > 0) {
                query = query.in('status', filters.statuses);
            }
            if (filters.formats.length > 0) {
                query = query.overlaps('content_formats', filters.formats);
            }
            if (filters.pillars.length > 0) {
                query = query.in('pillar', filters.pillars);
            }
            if (filters.categories.length > 0) {
                query = query.in('category', filters.categories);
            }
            if (filters.shootDateStart) {
                query = query.gte('shoot_date', filters.shootDateStart);
            }
            if (filters.shootDateEnd) {
                query = query.lte('shoot_date', filters.shootDateEnd);
            }

            query = query.order('created_at', { ascending: false });
            query = query.range(offset, offset + limitNum - 1);

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                const mappedData = data.map(d => mapSupabaseToTask(d));
                setLocalStockTasks(prev => isFirstPage ? mappedData : [...prev, ...mappedData]);
                setHasMore(mappedData.length === limitNum);
                setPage(currentPage + 1);
            }
        } catch (err) {
            console.error('Error fetching stock tasks:', err);
        } finally {
            setFetchingTasks(false);
        }
    }, [isOpen, page, searchQuery, filters]);

    // Initial load & Filter trigger
    useEffect(() => {
        if (isOpen) {
            fetchStockTasks(true);
        } else {
            setLocalStockTasks([]);
            setPage(1);
            setHasMore(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, searchQuery, filters]);

    // Realtime Database Linkage
    useEffect(() => {
        if (!isOpen) return;

        const subChannel = supabase
            .channel('stock-side-panel-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contents' },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newRecord = payload.new;
                        if (newRecord.is_unscheduled) {
                            const task = mapSupabaseToTask(newRecord, 'CONTENT');
                            if (matchesFilters(task)) {
                                setLocalStockTasks(prev => {
                                    if (prev.some(t => t.id === task.id)) return prev;
                                    return [task, ...prev];
                                });
                            }
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const newRecord = payload.new;
                        const task = mapSupabaseToTask(newRecord, 'CONTENT');

                        if (!newRecord.is_unscheduled) {
                            setLocalStockTasks(prev => prev.filter(t => t.id !== task.id));
                        } else {
                            if (matchesFilters(task)) {
                                setLocalStockTasks(prev => {
                                    const exists = prev.some(t => t.id === task.id);
                                    if (exists) {
                                        return prev.map(t => t.id === task.id ? task : t);
                                    } else {
                                        return [task, ...prev];
                                    }
                                });
                            } else {
                                setLocalStockTasks(prev => prev.filter(t => t.id !== task.id));
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setLocalStockTasks(prev => prev.filter(t => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subChannel);
        };
    }, [isOpen, matchesFilters]);

    // --- Helpers ---
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('source', 'ContentStock'); 
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('opacity-50');
    };

    const handleGlobalDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setDragCounter(prev => prev + 1);
    };

    const handleGlobalDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragCounter(prev => Math.max(0, prev - 1));
    };

    const handleGlobalDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleGlobalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragCounter(0);
        const taskId = e.dataTransfer.getData("taskId");
        const source = e.dataTransfer.getData("source");
        
        if (taskId && source !== "ContentStock") {
            const task = tasks.find(t => t.id === taskId);
            if (task && onMoveTask) {
                onMoveTask({
                    ...task,
                    isUnscheduled: true
                });
            }
        }
    };

    const getChannelInfo = (id?: string) => channels.find(c => c.id === id);

    // Calculate active filters count
    const activeFilterCount = 
        filters.channels.length + 
        filters.statuses.length + 
        filters.formats.length + 
        filters.pillars.length + 
        filters.categories.length + 
        (filters.shootDateStart ? 1 : 0);

    if (!isOpen) return null;

    return (
        <>
            <div 
                onDragEnter={handleGlobalDragEnter}
                onDragOver={handleGlobalDragOver}
                onDragLeave={handleGlobalDragLeave}
                onDrop={handleGlobalDrop}
                className={`w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl animate-in slide-in-from-right duration-300 z-40 relative transition-all duration-300 ${isDragOver ? 'ring-4 ring-indigo-500/20 bg-indigo-50/5' : ''}`}
            >
                {/* Drag Return to Stock Overlay */}
                {isDragOver && (
                    <div className="absolute inset-0 bg-indigo-50/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50 pointer-events-none animate-in fade-in duration-250">
                        <div className="absolute inset-4 border-2 border-dashed border-indigo-400 rounded-[2rem] flex flex-col items-center justify-center p-4">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-indigo-100 mb-4 animate-bounce">
                                <Archive className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h4 className="font-bold text-indigo-900 text-sm">วางที่นี่เพื่อเก็บเข้าคลัง</h4>
                            <p className="text-[11px] text-indigo-600/70 font-bold mt-1 max-w-[200px]">ปล่อยแผ่นงานลงที่นี่เพื่อยกเลิกเวลานัดหมายลงตาราง</p>
                        </div>
                    </div>
                )}
                
                {/* 1. Fixed Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-20">
                    <div className="flex items-center gap-2 text-indigo-900">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                            <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-md leading-none">คลังงาน</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Content Stock</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[24px] text-center">
                            {localStockTasks.length}
                        </span>
                        <button onClick={onClose} className="p-1.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 2. Control Deck (Search & Command Center Trigger) */}
                <div className="p-4 border-b border-gray-100 bg-white z-10 space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ, รายละเอียด..." 
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-200 rounded-xl text-xs font-bold text-gray-700 outline-none transition-all placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Trigger Button */}
                    <button 
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeFilterCount > 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}
                    >
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>ตัวกรองขั้นสูง (Equalizer)</span>
                        </div>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px] font-black min-w-[20px] text-center flex items-center gap-1">
                                <Sparkles className="w-2 h-2" /> {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* 3. Scrollable List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-gray-200">
                    {localStockTasks.length === 0 && !fetchingTasks ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center select-none">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Archive className="w-10 h-10 opacity-30" />
                            </div>
                            <p className="text-md font-kanit font-bold text-gray-500">ไม่พบงานในคลัง</p>
                            <p className="text-[14px] mt-1 text-gray-400 max-w-[200px]">ลองปรับตัวกรอง หรือเพิ่มงานใหม่และเลือก "Stock Mode"</p>
                        </div>
                    ) : (
                        localStockTasks.map(task => {
                            const channel = getChannelInfo(task.channelId);
                            const statusOption = statusOptions.find(o => o.key === task.status);
                            const statusLabel = statusOption ? statusOption.label : task.status;
                            const statusColor = statusOption ? statusOption.color : 'bg-gray-100 text-gray-500';
                            
                            const hasShootDate = !!task.shootDate;
                            
                            return (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => onEditTask(task)}
                                    className="group relative bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all overflow-hidden"
                                >
                                    {/* Hover Indicator Strip */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 group-hover:bg-indigo-500 transition-colors"></div>
                                    
                                    <div className="flex gap-3 pl-2">
                                        {/* Drag Handle & Icon */}
                                        <div className="mt-1 text-gray-300 group-hover:text-indigo-400 flex flex-col items-center gap-1 shrink-0">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            {/* Tags Row */}
                                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                                {channel && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${channel.color}`}>
                                                        {channel.name}
                                                    </span>
                                                )}
                                                {hasShootDate && (
                                                    <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 flex items-center">
                                                        <Video className="w-2.5 h-2.5 mr-1" />
                                                        {format(new Date(task.shootDate!), 'd MMM')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-sm font-bold text-gray-700 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors mb-2">
                                                {task.title}
                                            </h4>
                                            
                                            {/* Footer Row */}
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                                    {task.contentFormats && task.contentFormats.length > 0 ? (
                                                        <span className="bg-gray-100 px-1.5 rounded">{task.contentFormats[0]}</span>
                                                    ) : (
                                                        <>
                                                            <LayoutTemplate className="w-3 h-3" />
                                                            <span>Content</span>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColor}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="pt-2 pb-4">
                            <button 
                                onClick={() => fetchStockTasks(false)}
                                disabled={fetchingTasks}
                                className="w-full py-3 px-4 bg-white border border-dashed border-gray-300 rounded-2xl text-xs font-bold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
                            >
                                {fetchingTasks ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>กำลังโหลดข้อมูล...</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                        <span>โหลดงานในคลังเพิ่มเติม</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. Footer Hint */}
                <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-[10px] text-indigo-600 text-center font-bold flex items-center justify-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    ลากการ์ดไปวางในปฏิทินเพื่อลงตาราง
                </div>
            </div>

            {/* Filter Modal V4 */}
            <StockFilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                channels={channels}
                masterOptions={masterOptions}
                filters={filters}
                onApply={setFilters}
            />
        </>
    );
};

export default StockSidePanel;

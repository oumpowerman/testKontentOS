
import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Task } from '../types';

interface UseContentStockProps {
    page: number;
    pageSize: number;
    searchQuery: string;
    filters: {
        channelId: string;
        format: string[];
        pillar: string[];
        category: string[];
        statuses: string[];
        showStockOnly: boolean;
        onlyOverdue?: boolean;
        hasShootDate?: boolean;
        shootDateStart?: string; // Changed to Start
        shootDateEnd?: string;   // Changed to End
        contentSubTab?: 'ACTIVE' | 'ARCHIVE';
    };
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
}

export const useContentStock = ({ page, pageSize, searchQuery, filters, sortConfig }: UseContentStockProps) => {
    const [contents, setContents] = useState<Task[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Track IDs that have been optimistically added to totalCount to prevent double-counting
    const trackedAddedIds = useRef(new Set<string>());

    const pageRef = useRef(page);
    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    // Refs to access current state inside stable useEffect for Realtime
    const searchRef = useRef(searchQuery);
    const filtersRef = useRef(filters);
    
    // Update Refs when props change
    useEffect(() => {
        searchRef.current = searchQuery;
        filtersRef.current = filters;
    }, [searchQuery, filters]);

    const mapSupabaseToTask = useCallback((data: any): Task => ({
        id: data.id,
        type: 'CONTENT',
        title: data.title,
        description: data.description || '',
        status: data.status,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        createdAt: new Date(data.created_at),
        channelId: data.channel_id,
        // Safety: Ensure arrays are never null
        tags: Array.isArray(data.tags) ? data.tags : [],
        
        targetPlatforms: Array.isArray(data.target_platform) ? data.target_platform : [],
        pillar: data.pillar,
        contentFormats: data.content_formats || [],
        category: data.category,
        scheduledTime: data.scheduled_time || data.scheduledTime,
        isUnscheduled: data.is_unscheduled,
        
        assigneeIds: Array.isArray(data.assignee_ids) ? data.assignee_ids : [],
        ideaOwnerIds: Array.isArray(data.idea_owner_ids) ? data.idea_owner_ids : [],
        editorIds: Array.isArray(data.editor_ids) ? data.editor_ids : [],
        
        remark: data.remark,
        assets: Array.isArray(data.assets) ? data.assets : [],
        
        assigneeType: data.assignee_type || 'TEAM',
        difficulty: data.difficulty || 'MEDIUM',
        estimatedHours: data.estimated_hours || 0,
        caution: data.caution,
        importance: data.importance,
        publishedLinks: data.published_links || {},
        shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
        shootLocation: data.shoot_location,
        localPath: data.local_path,
        driveLabel: data.drive_label,
        isInShootQueue: data.is_in_shoot_queue || false,
        hasAnalytics: !!data.content_analytics && (Array.isArray(data.content_analytics) ? data.content_analytics.length > 0 : !!data.content_analytics.id),
        
        reviews: Array.isArray(data.task_reviews) ? data.task_reviews.map((r: any) => ({
             id: r.id, taskId: r.content_id, round: r.round, scheduledAt: new Date(r.scheduled_at), 
             reviewerId: r.reviewer_id, status: r.status, feedback: r.feedback, isCompleted: r.is_completed
        })) : [],
        logs: []
    }), []);

    // --- SMART HYDRATION LOGIC ---
    const checkDoesItMatchFilters = useCallback((task: Task, currentFilters = filters) => {
        const currentSearch = searchQuery.toLowerCase();

        // Search Match
        if (currentSearch) {
            const titleMatch = (task.title || '').toLowerCase().includes(currentSearch);
            const remarkMatch = (task.remark || '').toLowerCase().includes(currentSearch);
            const locMatch = (task.shootLocation || '').toLowerCase().includes(currentSearch);
            if (!titleMatch && !remarkMatch && !locMatch) return false;
        }

        // Filter Match
        if (currentFilters.channelId !== 'ALL' && task.channelId !== currentFilters.channelId) return false;
        
        if (currentFilters.format.length > 0) {
            const taskFormats = task.contentFormats || [];
            const hasMatch = taskFormats.some(f => currentFilters.format.includes(f));
            if (!hasMatch) return false;
        }
        
        if (currentFilters.pillar.length > 0 && (!task.pillar || !currentFilters.pillar.includes(task.pillar))) return false;
        if (currentFilters.category.length > 0 && (!task.category || !currentFilters.category.includes(task.category))) return false;
        
        // 2.1 Content Tab: Active vs Archive Invariant
        const isArchive = currentFilters.contentSubTab === 'ARCHIVE';
        const currentStatus = (task.status || '').toUpperCase();
        const isTerminalStatus = currentStatus.includes('DONE') || ['PUBLISHED', 'FINAL', 'POSTED', 'DONE'].some(s => currentStatus === s || currentStatus.startsWith(s + ' '));
        
        if (currentFilters.onlyOverdue) {
            // Overdue Analytics Match: MUST be explicitly scheduled (false) AND terminal AND > 7 days AND no analytics
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const endDateObj = task.endDate ? (task.endDate instanceof Date ? task.endDate : new Date(task.endDate)) : null;
            const isActuallyOverdue = 
                task.isUnscheduled === false && 
                isTerminalStatus && 
                !task.hasAnalytics && 
                endDateObj && 
                endDateObj <= sevenDaysAgo;
            
            if (!isActuallyOverdue) return false;
            
            // Status override check if specific status selected
            if (currentFilters.statuses.length > 0 && !currentFilters.statuses.includes(task.status as any)) return false;
        } else {
            if (isArchive) {
                if (!isTerminalStatus) return false;
            } else {
                // Active Tab case
                if (isTerminalStatus) return false;
                // Additional status filter if any
                if (currentFilters.statuses.length > 0 && !currentFilters.statuses.includes(task.status as any)) return false;
            }
        }

        if (currentFilters.showStockOnly && !task.isUnscheduled) return false;

        // Shoot Date Filter
        if (currentFilters.hasShootDate && !task.shootDate) return false;

        // Shoot Date Range Match
        if (task.shootDate) {
             const taskShootStr = format(task.shootDate, 'yyyy-MM-dd');
             if (currentFilters.shootDateStart && taskShootStr < currentFilters.shootDateStart) return false;
             if (currentFilters.shootDateEnd && taskShootStr > currentFilters.shootDateEnd) return false;
        } else {
             // If filter is active but task has no date, hide it? 
             // Usually yes, if searching for specific date range.
             if (currentFilters.shootDateStart || currentFilters.shootDateEnd) return false;
        }

        return true;
    }, [filters, searchQuery]);

    const fetchContents = useCallback(async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            let query = supabase
                .from('contents')
                .select(`*, task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, content_id), content_analytics(id)`, { count: 'exact' });

            // 1. Search
            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,remark.ilike.%${searchQuery}%,shoot_location.ilike.%${searchQuery}%`);
            }

            // 2. Filters
            if (filters.channelId !== 'ALL') query = query.eq('channel_id', filters.channelId);
            
            if (filters.format.length > 0) {
                // Use overlaps for array column
                query = query.overlaps('content_formats', filters.format);
            }
            
            if (filters.pillar.length > 0) query = query.in('pillar', filters.pillar);
            if (filters.category.length > 0) query = query.in('category', filters.category);
            
            // 2.1 Content Tab: Active vs Archive
            if (filters.onlyOverdue) {
                // 2.3 Overdue Analytics Filter overrides standard Status/Tab logic
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                query = query
                    .or('status.ilike.%DONE%,status.eq.PUBLISHED,status.eq.FINAL,status.eq.POSTED')
                    .lte('end_date', sevenDaysAgo.toISOString())
                    .eq('is_unscheduled', false);

                // If specific statuses were selected AND onlyOverdue is on, 
                // we should respect them but stay within terminal statuses
                if (filters.statuses.length > 0) {
                    query = query.in('status', filters.statuses);
                }
            } else if (filters.contentSubTab === 'ARCHIVE') {
                query = query.ilike('status', '%DONE%');
            } else {
                // Default to ACTIVE: show everything EXCEPT statuses containing 'DONE'
                query = query.not('status', 'ilike', '%DONE%');
                
                // If statuses are selected in the Active tab, apply them
                if (filters.statuses.length > 0) {
                    query = query.in('status', filters.statuses);
                }
            }
            
            // 2.2 Shoot Date Range Filter
            if (filters.hasShootDate) {
                query = query.not('shoot_date', 'is', null);
            }

            // 3. Sort
            if (sortConfig) {
                const sortKeyMap: Record<string, string> = {
                    'title': 'title', 
                    'status': 'status', 
                    'date': 'end_date', 
                    'publishDate': 'end_date',
                    'shootDate': 'shoot_date',
                    'remark': 'remark',
                    'shortNote': 'remark',
                    'ideaOwner': 'idea_owner_ids',
                    'editor': 'editor_ids',
                    'helper': 'assignee_ids',
                    'createdAt': 'created_at'
                };
                const dbKey = sortKeyMap[sortConfig.key] || 'created_at';
                
                // Special handling: Only group by is_unscheduled when explicitly sorting by publish date columns
                const isPublishDateSort = sortConfig.key === 'publishDate' || sortConfig.key === 'date';
                if (isPublishDateSort) {
                    query = query.order('is_unscheduled', { ascending: true });
                }

                // Use nullsFirst: false to keep items without dates at the bottom for date sorts
                query = query.order(dbKey, { 
                    ascending: sortConfig.direction === 'asc',
                    nullsFirst: false 
                });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // 4. Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            if (data) {
                const mapped = data.map(mapSupabaseToTask);
                // Since we can't filter by virtual 'has_analytics' on the server easily without a column/view,
                // we apply the filter again in memory to ensure accuracy for the 'onlyOverdue' mode.
                const filtered = mapped.filter(item => checkDoesItMatchFilters(item, filters));
                
                setContents(filtered);
                setTotalCount(filters.onlyOverdue ? filtered.length : (count || 0));
                // Reset tracked IDs since we have a fresh baseline from server
                trackedAddedIds.current.clear();
            }
        } catch (err) {
            console.error('Fetch content stock failed:', err);
        } finally {
            if (!isBackground) setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [page, pageSize, searchQuery, filters, sortConfig, mapSupabaseToTask, checkDoesItMatchFilters]);

    // Initial Fetch
    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    // Ref to access fetch function in realtime callback if needed
    const fetchContentsRef = useRef(fetchContents);
    useEffect(() => {
        fetchContentsRef.current = fetchContents;
    }, [fetchContents]);

    const handleRealtimeUpdate = useCallback(async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('contents')
                .select(`*, task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, content_id), content_analytics(id)`)
                .eq('id', id)
                .single();

            if (error || !data) return; 

            const fullTask = mapSupabaseToTask(data);
            const isMatch = checkDoesItMatchFilters(fullTask);

            if (isMatch) {
                // If it's a match, we should check if it's already in the list
                // If not, it's a new item (INSERT or moved into view), so increment totalCount
                setContents(prevList => {
                    const exists = prevList.some(item => item.id === id);
                    if (!exists && !trackedAddedIds.current.has(id)) {
                        setTotalCount(prev => prev + 1);
                        trackedAddedIds.current.add(id);
                    }
                    
                    if (exists) {
                        return prevList.map(item => item.id === id ? fullTask : item);
                    } else if (pageRef.current === 1) {
                        return [fullTask, ...prevList];
                    }
                    return prevList;
                });
            } else {
                // If it no longer matches filters, remove it and decrement count if it was there
                setContents(prevList => {
                    const exists = prevList.some(item => item.id === id);
                    if (exists || trackedAddedIds.current.has(id)) {
                        setTotalCount(prev => Math.max(0, prev - 1));
                        trackedAddedIds.current.delete(id);
                        return prevList.filter(item => item.id !== id);
                    }
                    return prevList;
                });
            }

        } catch (err) {
            console.error("Smart Hydration Error:", err);
        }
    }, [mapSupabaseToTask]);

    const triggerCountRefresh = useCallback(() => {
        // Background refresh to update total counts
        fetchContentsRef.current(true); 
    }, []);

    // Manual Update Function (Bridge for Global State Sync)
    const updateLocalItem = useCallback((task: Task, isDelete: boolean = false) => {
        // Immediate update without DB fetch (Optimistic from Global State)
        setContents(prevList => {
            const exists = prevList.some(item => item.id === task.id);
            
            if (isDelete) {
                if (exists || trackedAddedIds.current.has(task.id)) {
                    setTotalCount(prev => Math.max(0, prev - 1));
                    trackedAddedIds.current.delete(task.id);
                    return prevList.filter(item => item.id !== task.id);
                }
                return prevList;
            }

            const isMatch = checkDoesItMatchFilters(task);

            if (isMatch) {
                if (exists) {
                     return prevList.map(item => item.id === task.id ? task : item);
                }
                
                // Handle Addition: If it matches filters and doesn't exist locally,
                // we only increment totalCount if we haven't tracked it yet.
                if (!trackedAddedIds.current.has(task.id)) {
                    setTotalCount(prev => prev + 1);
                    trackedAddedIds.current.add(task.id);
                }
                
                // We only add it to the top if we are on page 1 (Page 1 Guard).
                if (pageRef.current === 1) {
                    return [task, ...prevList];
                }
                
                return prevList;
            } else {
                // Handle Filter Mismatch: Remove from local list if it was there
                // and decrement the total count since it no longer matches the current view
                if (exists || trackedAddedIds.current.has(task.id)) {
                    setTotalCount(prev => Math.max(0, prev - 1));
                    trackedAddedIds.current.delete(task.id);
                    return prevList.filter(item => item.id !== task.id);
                }
                return prevList;
            }
        });
    }, []);

    // Realtime Subscription
    useEffect(() => {
        let refreshTimeout: ReturnType<typeof setTimeout>;
        const debouncedCountRefresh = () => {
            clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(() => {
                triggerCountRefresh();
            }, 2000); 
        };

        const channel = supabase
            .channel('realtime-content-stock-smart-v3')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contents' },
                async (payload) => {
                    const eventType = payload.eventType;
                    const newRec = payload.new as any;
                    const oldRec = payload.old as any;
                    
                    console.log(`[Realtime] Event: ${eventType} on table 'contents'`);

                    if (eventType === 'UPDATE' || eventType === 'INSERT') {
                        await handleRealtimeUpdate(newRec.id);
                        if (eventType === 'INSERT') debouncedCountRefresh();
                    } else if (eventType === 'DELETE') {
                        console.log(`[Realtime] Deleting item: ${oldRec.id}`);
                        setContents(prev => prev.filter(item => item.id !== oldRec.id));
                        debouncedCountRefresh();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            clearTimeout(refreshTimeout);
        };
    }, [handleRealtimeUpdate, triggerCountRefresh]);

    const toggleShootQueue = async (id: string, currentStatus: boolean): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('contents')
                .update({ is_in_shoot_queue: !currentStatus })
                .eq('id', id);
            
            if (error) throw error;
            
            // Optimistic update
            setContents(prev => prev.map(item => item.id === id ? { ...item, isInShootQueue: !currentStatus } : item));
            return true;
        } catch (err) {
            console.error('Toggle shoot queue failed:', err);
            return false;
        }
    };

    return { contents, totalCount, isLoading, isRefreshing, fetchContents, updateLocalItem, toggleShootQueue };
};

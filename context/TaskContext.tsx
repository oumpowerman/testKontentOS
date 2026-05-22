
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task, ReviewSession, TaskType } from '../types';
import { addMonths, endOfMonth, format } from 'date-fns';

// Helper to replace startOfMonth
const getStartOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

interface TaskContextType {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    dateRange: { start: Date; end: Date };
    setDateRange: React.Dispatch<React.SetStateAction<{ start: Date; end: Date }>>;
    isFetching: boolean;
    isAllLoaded: boolean;
    fetchTasks: (forceFull?: boolean) => Promise<void>;
    fetchAllTasks: () => void;
    checkAndExpandRange: (targetDate: Date) => void;
    fetchSubTasks: (contentId: string) => Promise<Task[]>;
    fetchTaskById: (id: string, type: TaskType) => Promise<Task | null>;
    fetchSubTasksCount: (contentId: string) => Promise<number>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const isFetchingRef = useRef(false);
    const isInitialLoadRef = useRef(true);
    const [isAllLoaded, setIsAllLoaded] = useState(false);

    // 🚀 FIX ISSUE 4: Local Caching to mitigate range expansion delays
    useEffect(() => {
        try {
            const cached = localStorage.getItem('tasks_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                const revived = parsed.map((t: any) => ({
                    ...t,
                    startDate: new Date(t.startDate),
                    endDate: new Date(t.endDate),
                    createdAt: new Date(t.createdAt),
                    updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
                    shootDate: t.shootDate ? new Date(t.shootDate) : undefined,
                    reviews: t.reviews?.map((r: any) => ({
                        ...r, 
                        scheduledAt: new Date(r.scheduledAt)
                    }))
                }));
                setTasks(revived);
                console.log('📦 [TaskContext] Loaded tasks from local cache');
            }
        } catch (e) {
            console.warn('⚠️ [TaskContext] Failed to load tasks cache', e);
        }
    }, []);

    useEffect(() => {
        if (tasks.length > 0) {
            const timeoutId = setTimeout(() => {
                try {
                    localStorage.setItem('tasks_cache', JSON.stringify(tasks));
                } catch (e) {
                    console.warn('⚠️ [TaskContext] Failed to save tasks cache (Quota exceeded?)', e);
                }
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [tasks]);

    // --- Date Windowing State ---
    // Default: Load 3 months back and 3 months forward
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
        start: addMonths(getStartOfMonth(new Date()), -3),
        end: addMonths(endOfMonth(new Date()), 3)
    });

    // Map Raw DB Data to Unified Task Type (Shared Logic)
    const mapSupabaseToTask = useCallback((data: any, type: 'CONTENT' | 'TASK', isPartial = false): Task => {
        const startDateVal = data.start_date || data.startDate;
        const endDateVal = data.end_date || data.endDate;

        let platforms = [];
        if (Array.isArray(data.target_platform)) {
            platforms = data.target_platform;
        } else if (data.target_platform) {
            platforms = [data.target_platform];
        }

        const reviews: ReviewSession[] = (data.task_reviews || []).map((r: any) => ({
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
            startDate: new Date(startDateVal),
            endDate: new Date(endDateVal),
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
            reviews: reviews.sort((a, b) => a.round - b.round),
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
            scriptId: data.script_id, // Map script_id correctly here
            sla_revert_count: data.sla_revert_count,
            is_penalized: data.is_penalized,
            last_penalized_at: data.last_penalized_at ? new Date(data.last_penalized_at) : undefined,
            hasAnalytics: !!data.content_analytics && (Array.isArray(data.content_analytics) ? data.content_analytics.length > 0 : !!data.content_analytics.id),
            analyticsStatus: (() => {
                if (!data.content_analytics) return 'NONE';
                const rows = Array.isArray(data.content_analytics) ? data.content_analytics : [data.content_analytics];
                const filledPlatforms = rows.map((r: any) => r.platform).filter(Boolean);
                if (filledPlatforms.length === 0) return 'NONE';
                if (platforms.length === 0) return 'COMPLETE';
                const allMatched = platforms.every((p: string) => filledPlatforms.includes(p));
                return allMatched ? 'COMPLETE' : 'PARTIAL';
            })(),
            sponsorship: data.sponsorship_details ? (() => {
                const s = Array.isArray(data.sponsorship_details) ? data.sponsorship_details[0] : data.sponsorship_details;
                if (!s) return undefined;
                return {
                    taskId: data.id,
                    isSponsored: s.is_sponsored,
                    dealValue: s.deal_value || 0,
                    requirements: s.requirements,
                    paymentStatus: s.payment_status,
                    isPaid: s.is_paid,
                    invoiceUrl: s.invoice_url,
                    clientId: s.client_id
                };
            })() : undefined,
            _isPartial: isPartial
        } as any;
    }, []);

    const fetchTasks = useCallback(async (forceFull = false) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        // Prevent spinner flickering on background refresh
        // Only show spinner if we have no tasks yet (initial load)
        if (isInitialLoadRef.current) setIsFetching(true); 
        
        const startStr = dateRange.start.toISOString();
        const endStr = dateRange.end.toISOString();
        
        // Calculate 2 months ago for stock filtering
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const stockLimitStr = twoMonthsAgo.toISOString();

        // 🚀 STRATEGY: Select only essential fields for Board/Calendar (Reduce payload size by ~70%)
        const contentFields = `
            id, title, description, status, pillar, category, content_formats, 
            start_date, end_date, channel_id, created_at, updated_at, is_unscheduled, remark, scheduled_time,
            target_platform, assignee_ids, idea_owner_ids, editor_ids, shoot_trip_id,
            shoot_date, is_in_shoot_queue, is_soft_finished, sla_revert_count, 
            task_reviews(id, round, status, is_completed),
            content_analytics(id, platform),
            sponsorship_details(is_sponsored, deal_value, requirements, payment_status, is_paid, invoice_url, client_id)
        `.replace(/\s+/g, '');

        const taskFields = `
            id, title, status, priority, start_date, end_date, created_at, updated_at, 
            assignee_ids, content_id, show_on_board, target_position, roadmap_id, 
            sla_revert_count, difficulty, assignee_type, estimated_hours, scheduled_time,
            contents(title), task_reviews(id, round, status, is_completed)
        `.replace(/\s+/g, '');

        try {
            let contentsQuery = supabase
                .from('contents')
                .select(contentFields);
            
            let tasksQuery = supabase
                .from('tasks')
                .select(taskFields);

            if (!isAllLoaded) {
                // Optimized query: (Unscheduled AND created within 2 months) OR (Scheduled within date range)
                contentsQuery = contentsQuery.or(`and(is_unscheduled.eq.true,created_at.gte.${stockLimitStr}),and(end_date.gte.${startStr},start_date.lte.${endStr})`);
                tasksQuery = tasksQuery.or(`and(content_id.is.null,created_at.gte.${stockLimitStr}),and(end_date.gte.${startStr},start_date.lte.${endStr})`).or('content_id.is.null,show_on_board.eq.true');
            } else {
                tasksQuery = tasksQuery.or('content_id.is.null,show_on_board.eq.true');
            }

            // 🚀 FIX ISSUE 2: Concurrent Fetching (Promise.all)
            const [contentsResult, tasksResult] = await Promise.all([
                contentsQuery,
                tasksQuery
            ]);

            let newTasks: Task[] = [];
            
            if (contentsResult.error) console.warn("Contents fetch warning:", contentsResult.error.message);
            else if (contentsResult.data) {
                newTasks = [...newTasks, ...contentsResult.data.map(d => mapSupabaseToTask(d, 'CONTENT', !forceFull))];
            }

            if (tasksResult.error) console.warn("Tasks fetch warning:", tasksResult.error.message);
            else if (tasksResult.data) {
                newTasks = [...newTasks, ...tasksResult.data.map(d => mapSupabaseToTask(d, 'TASK', !forceFull))];
            }

            setTasks(newTasks);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsFetching(false);
            isFetchingRef.current = false;
            isInitialLoadRef.current = false;
        }
    }, [dateRange, isAllLoaded, mapSupabaseToTask]);

    const fetchSubTasks = useCallback(async (contentId: string): Promise<Task[]> => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('content_id', contentId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data ? data.map(d => mapSupabaseToTask(d, 'TASK')) : [];
        } catch (err) {
            console.error('Fetch sub-tasks failed', err);
            return [];
        }
    }, [mapSupabaseToTask]);

    const fetchSubTasksCount = useCallback(async (contentId: string): Promise<number> => {
        try {
            const { count, error } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('content_id', contentId);

            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('Fetch sub-tasks count failed', err);
            return 0;
        }
    }, []);

    const fetchTaskById = useCallback(async (id: string, type: TaskType): Promise<Task | null> => {
        try {
            const table = type === 'TASK' ? 'tasks' : 'contents';
            let query = supabase.from(table).select(
                type === 'TASK' 
                    ? `*, contents (title), task_reviews(*)` 
                    : `*, task_reviews(*), content_analytics(id, platform), sponsorship_details(*)`
            ).eq('id', id).maybeSingle();
            
            const { data, error } = await query;
            if (error) throw error;
            
            return data ? mapSupabaseToTask(data, type) : null;
        } catch (err) {
            console.error(`[TaskContext] Failed to fetch single ${type}:`, err);
            return null;
        }
    }, [mapSupabaseToTask]);

    const checkAndExpandRange = useCallback((targetDate: Date) => {
        if (isAllLoaded) return; 
        const target = new Date(targetDate);
        let needsUpdate = false;
        let newStart = dateRange.start;
        let newEnd = dateRange.end;

        if (target < dateRange.start) {
            newStart = addMonths(getStartOfMonth(target), -1);
            needsUpdate = true;
        }
        if (target > dateRange.end) {
            newEnd = addMonths(endOfMonth(target), 1);
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`Expanding data range: ${format(newStart, 'yyyy-MM')} to ${format(newEnd, 'yyyy-MM')}`);
            setDateRange({ start: newStart, end: newEnd });
        }
    }, [dateRange, isAllLoaded]);

    const fetchAllTasks = useCallback(async () => {
        if (isAllLoaded) return;
        setIsAllLoaded(true);
    }, [isAllLoaded]);

    // Trigger fetch when dateRange or isAllLoaded changes
    useEffect(() => {
        fetchTasks();
    }, [dateRange, isAllLoaded, fetchTasks]);

    // --- REALTIME CONNECTION (SINGLE INSTANCE) ---
    useEffect(() => {
        // fetchTasks(); // Disable initial fetchTasks on mount - managed by useTaskManager
        console.log('🔌 [TaskContext] Connecting to Realtime...');

        const handleIncrementalUpdate = (payload: any, type: 'TASK' | 'CONTENT') => {
            if (payload.eventType === 'INSERT') {
                // For INSERT, we fetch the full record to get joins (like contents.title)
                // But we only fetch the specific record to avoid full reload
                const fetchSingle = async () => {
                    const table = type === 'TASK' ? 'tasks' : 'contents';
                    let query = supabase.from(table).select(
                        type === 'TASK' 
                            ? `*, contents (title), task_reviews(*)` 
                            : `*, task_reviews(*), content_analytics(id, platform), sponsorship_details(*)`
                    ).eq('id', payload.new.id).maybeSingle();
                    
                    const { data } = await query;
                    if (data) {
                        const newTask = mapSupabaseToTask(data, type);
                        setTasks(prev => {
                            if (prev.some(t => t.id === newTask.id)) return prev;
                            return [...prev, newTask];
                        });
                    }
                };
                fetchSingle();
            } else if (payload.eventType === 'UPDATE') {
                // 🚀 FIX ISSUE 1: Fetch single record on UPDATE to preserve joined data
                const fetchSingle = async () => {
                    const table = type === 'TASK' ? 'tasks' : 'contents';
                    let query = supabase.from(table).select(
                        type === 'TASK' 
                            ? `*, contents (title), task_reviews(*)` 
                            : `*, task_reviews(*), content_analytics(id, platform), sponsorship_details(*)`
                    ).eq('id', payload.new.id).maybeSingle();
                    
                    const { data } = await query;
                    if (data) {
                        const updatedTask = mapSupabaseToTask(data, type);
                        setTasks(prev => {
                            const exists = prev.some(t => t.id === updatedTask.id);
                            if (exists) {
                                return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
                            } else {
                                const isScheduledInRange = updatedTask.startDate && updatedTask.endDate && 
                                    updatedTask.endDate >= dateRange.start && updatedTask.startDate <= dateRange.end;
                                if (isScheduledInRange || !updatedTask.isUnscheduled) {
                                    return [...prev, updatedTask];
                                }
                                return prev;
                            }
                        });
                    }
                };
                fetchSingle();
            } else if (payload.eventType === 'DELETE') {
                setTasks(prev => prev.filter(t => t.id !== payload.old.id));
            }
        };

        const channel = supabase
            .channel('global-tasks-channel-main') // Unique channel for Context
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (p) => handleIncrementalUpdate(p, 'TASK'))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, (p) => handleIncrementalUpdate(p, 'CONTENT'))
            // 🚀 FIX ISSUE 3: Targeted update instead of full fetchTasks() avalanche
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, (payload) => {
                const newRecord = payload.new as { task_id?: string; content_id?: string };
                const oldRecord = payload.old as { task_id?: string; content_id?: string };
                const taskId = newRecord?.task_id || newRecord?.content_id || oldRecord?.task_id || oldRecord?.content_id;
                if (!taskId) return;
                
                setTasks(prev => {
                    const existing = prev.find(t => t.id === taskId);
                    if (!existing) return prev;
                    
                    const type = existing.type;
                    const table = type === 'TASK' ? 'tasks' : 'contents';
                    
                    supabase.from(table).select(
                        type === 'TASK' ? `*, contents (title), task_reviews(*)` : `*, task_reviews(*), content_analytics(id, platform)`
                    ).eq('id', taskId).maybeSingle().then(({ data }) => {
                        if (data) {
                            const updatedTask = mapSupabaseToTask(data, type);
                            setTasks(current => current.map(t => t.id === updatedTask.id ? updatedTask : t));
                        }
                    });
                    return prev;
                });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'content_analytics' }, (payload) => {
                const newRecord = payload.new as { content_id?: string };
                const oldRecord = payload.old as { content_id?: string };
                const contentId = newRecord?.content_id || oldRecord?.content_id;
                if (!contentId) return;

                // When analytics change, re-fetch the content to update hasAnalytics status
                supabase.from('contents').select(`*, task_reviews(*), content_analytics(id, platform)`).eq('id', contentId).maybeSingle().then(({ data }) => {
                    if (data) {
                        const updatedTask = mapSupabaseToTask(data, 'CONTENT');
                        setTasks(current => current.map(t => t.id === updatedTask.id ? updatedTask : t));
                    }
                });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [TaskContext] Realtime Connected!');
                    if (!isInitialLoadRef.current) {
                        console.log('🔄 [TaskContext] Re-syncing tasks...');
                        fetchTasks();
                    }
                }
            });

        return () => { 
            console.log('🔌 [TaskContext] Disconnecting...');
            supabase.removeChannel(channel); 
        };
    }, [fetchTasks, mapSupabaseToTask]); // Added mapSupabaseToTask to dependencies

    return (
        <TaskContext.Provider value={{
            tasks, setTasks,
            dateRange, setDateRange,
            isFetching, isAllLoaded,
            fetchTasks, fetchAllTasks, checkAndExpandRange, fetchSubTasks, fetchTaskById, fetchSubTasksCount
        }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) throw new Error('useTaskContext must be used within a TaskProvider');
    return context;
};

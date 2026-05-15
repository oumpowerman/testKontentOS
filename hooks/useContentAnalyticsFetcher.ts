import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ContentAnalytics, Task } from '../types';
import { mapSupabaseToAnalytics } from '../services/analyticsService';
import { startOfMonth, endOfMonth, subDays, isAfter } from 'date-fns';

export interface ContentWithAnalytics extends Task {
    analytics?: ContentAnalytics[];
}

export const useContentAnalyticsFetcher = () => {
    const [data, setData] = useState<ContentWithAnalytics[]>([]);
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // We'll manage filters here except searchTerm which is purely frontend
    const [platformFilter, setPlatformFilter] = useState('ALL');
    const [channelFilter, setChannelFilter] = useState(() => localStorage.getItem('defaultAnalyticsChannel') || 'ALL');
    const [timeRange, setTimeRange] = useState('CURRENT_MONTH'); // Default to current month

    const fetchAnalyticsData = useCallback(async () => {
        setIsLoading(true);
        try {
            let startDate: Date | null = null;
            let endDate: Date | null = null;

            if (timeRange === 'CURRENT_MONTH') {
                startDate = startOfMonth(new Date());
                endDate = endOfMonth(new Date());
            } else if (timeRange !== 'ALL') {
                const days = parseInt(timeRange);
                startDate = subDays(new Date(), days);
                endDate = new Date();
            }

            // 1. Fetch content tasks
            let contentsQuery = supabase
                .from('contents')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply specific filters to contents
            if (channelFilter !== 'ALL') {
                contentsQuery = contentsQuery.eq('channel_id', channelFilter);
            }

            if (startDate) {
                const startStr = startDate.toISOString();
                contentsQuery = contentsQuery.or(`end_date.gte.${startStr},created_at.gte.${startStr}`);
            }
            if (endDate) {
                const endStr = endDate.toISOString();
                contentsQuery = contentsQuery.or(`end_date.lte.${endStr},created_at.lte.${endStr}`);
            }

            const { data: contentsRaw, error: contentsError } = await contentsQuery;
            if (contentsError) throw contentsError;

            // Optional: Filter by platform early if needed, or leave to frontend
            // Since target_platform is JSONB, it's easier to filter on frontend

            // 2. Fetch analytics only for these contents
            const contentIds = (contentsRaw || []).map(c => c.id);
            
            let analyticsQuery = supabase
                .from('content_analytics')
                .select('*')
                .order('captured_at', { ascending: true });

            if (contentIds.length > 0) {
                // Chunk queries if contentIds is very large (>1000), but standard supabse IN limit is okay up to ~500-1000
                analyticsQuery = analyticsQuery.in('content_id', contentIds);
            } else if (startDate) {
                analyticsQuery = analyticsQuery.gte('captured_at', startDate.toISOString());
            }

            const { data: analyticsRaw, error: analyticsError } = await analyticsQuery;
            if (analyticsError) throw analyticsError;

            const mappedAnalytics = (analyticsRaw || []).map(a => mapSupabaseToAnalytics(a));

            // Merge and Map data
            const enrichedData = (contentsRaw || []).map((content: any) => {
                const mappedContent: Task = {
                    id: content.id,
                    title: content.title,
                    description: content.description || '',
                    status: content.status,
                    type: 'CONTENT',
                    startDate: content.start_date ? new Date(content.start_date) : new Date(),
                    endDate: content.end_date ? new Date(content.end_date) : new Date(),
                    channelId: content.channel_id,
                    targetPlatforms: content.target_platform || [],
                    isUnscheduled: content.is_unscheduled,
                    ideaOwnerIds: content.idea_owner_ids || [],
                    editorIds: content.editor_ids || [],
                    assigneeIds: content.assignee_ids || [],
                    performance: content.performance,
                    // ... other fields as needed
                } as any;

                return {
                    ...mappedContent,
                    analytics: mappedAnalytics.filter(a => a.contentId === content.id)
                };
            });

            setData(enrichedData as any);

            // Fetch pending tasks independently of the timeRange and channel filter
            // 4. Calculate pending tasks (from 30 days ago to 7 days ago)
            const sevenDaysAgo = subDays(new Date(), 7);
            const thirtyDaysAgo = subDays(new Date(), 30);
            
            let pendingContentsQuery = supabase
                .from('contents')
                .select('*')
                .eq('is_unscheduled', false)
                .gte('end_date', thirtyDaysAgo.toISOString())
                .lte('end_date', sevenDaysAgo.toISOString());
            
            // Note: We deliberately DO NOT apply channelFilter here
            // so pending tasks are global warnings
            
            const { data: pendingContentsRaw, error: pendingError } = await pendingContentsQuery;
            if (pendingError) {
                console.error("Pending contents query error:", pendingError);
            }
            
            let pending: Task[] = [];
            if (pendingContentsRaw && pendingContentsRaw.length > 0) {
                // Filter statuses in-memory to handle variations in case
                const doneContents = pendingContentsRaw.filter(c => {
                    const currentStatus = (c.status || '').toUpperCase();
                    return currentStatus.includes('DONE') || 
                           ['PUBLISHED', 'FINAL', 'POSTED', 'COMPLETE', 'COMPLETED'].includes(currentStatus);
                });

                if (doneContents.length > 0) {
                    const pendingIds = doneContents.map(c => c.id);
                    // Get their analytics to see if any have been answered
                    const { data: pendingAnalyticsRaw } = await supabase
                        .from('content_analytics')
                        .select('content_id, platform')
                        .in('content_id', pendingIds);
                    
                    const answeredKeys = new Set((pendingAnalyticsRaw || []).map(a => `${a.content_id}_${a.platform}`));
                    
                    // Map to Task and split missing platforms
                    doneContents.forEach(content => {
                        const platforms = content.target_platform && content.target_platform.length > 0 ? content.target_platform : [(content as any).platform || 'OTHER'];
                        
                        platforms.forEach((pt: string) => {
                            if (!answeredKeys.has(`${content.id}_${pt}`)) {
                                pending.push({
                                    id: content.id,
                                    title: content.title,
                                    description: content.description || '',
                                    status: content.status,
                                    type: 'CONTENT' as any,
                                    tags: content.tags || [],
                                    startDate: content.start_date ? new Date(content.start_date) : new Date(),
                                    endDate: content.end_date ? new Date(content.end_date) : new Date(),
                                    channelId: content.channel_id,
                                    targetPlatforms: content.target_platform || [],
                                    displayPlatform: pt, // Set displayPlatform so they save individually
                                    isUnscheduled: content.is_unscheduled,
                                    ideaOwnerIds: content.idea_owner_ids || [],
                                    editorIds: content.editor_ids || [],
                                    assigneeIds: content.assignee_ids || [],
                                    performance: content.performance,
                                } as any);
                            }
                        });
                    });

                    pending.sort((a, b) => {
                        const timeA = a.endDate ? new Date(a.endDate).getTime() : 0;
                        const timeB = b.endDate ? new Date(b.endDate).getTime() : 0;
                        return timeB - timeA;
                    });
                }
            }

            setPendingTasks(pending as any);

        } catch (error) {
            console.error('Fetch Analytics Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [channelFilter, timeRange]);

    useEffect(() => {
        fetchAnalyticsData();
    }, [fetchAnalyticsData]);

    return {
        data,
        pendingTasks,
        isLoading,
        platformFilter,
        setPlatformFilter,
        channelFilter,
        setChannelFilter,
        timeRange,
        setTimeRange,
        refetch: fetchAnalyticsData
    };
};

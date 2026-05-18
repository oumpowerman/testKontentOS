import { supabase } from '../lib/supabase';
import { ContentAnalytics } from '../types';

export const mapSupabaseToAnalytics = (data: any): ContentAnalytics => ({
    id: data.id,
    contentId: data.content_id,
    platform: data.platform,
    capturedAt: new Date(data.captured_at),
    views: data.views || 0,
    likes: data.likes || 0,
    comments: data.comments || 0,
    shares: data.shares || 0,
    saves: data.saves || 0,
    retentionRate: data.retention_rate,
    avgWatchTime: data.avg_watch_time,
    reach: data.reach,
    isAiExtracted: data.is_ai_extracted || false,
    rawAiData: data.raw_ai_data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
});

export const fetchAnalyticsForContent = async () => {
    const { data, error } = await supabase
        .from('content_analytics')
        .select('*')
        .order('captured_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSupabaseToAnalytics);
};

export const saveContentAnalytics = async (analytics: Partial<ContentAnalytics>) => {
    const payload = {
        content_id: analytics.contentId,
        platform: analytics.platform,
        captured_at: analytics.capturedAt?.toISOString() || new Date().toISOString(),
        views: analytics.views,
        likes: analytics.likes,
        comments: analytics.comments,
        shares: analytics.shares,
        saves: analytics.saves,
        reach: analytics.reach,
        retention_rate: analytics.retentionRate,
        avg_watch_time: analytics.avgWatchTime,
        is_ai_extracted: analytics.isAiExtracted,
        raw_ai_data: analytics.rawAiData
    };

    const { data: analyticsData, error: analyticsError } = await supabase
        .from('content_analytics')
        .insert(payload)
        .select()
        .maybeSingle();

    if (analyticsError) throw analyticsError;
    if (!analyticsData) throw new Error('Failed to save analytics: No data returned');

    return mapSupabaseToAnalytics(analyticsData);
};

export const fetchTasksByPillar = async (
    pillar: string, 
    options: { 
        page?: number; 
        limit?: number; 
        channelId?: string; 
        startDate?: string; 
        endDate?: string; 
    } = {}
) => {
    const { page = 1, limit = 10, channelId, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    // SaaS-Optimized Query: Join with content_analytics to get the LATEST engagement metrics
    // We only select the minimal fields needed for the list to keep it lightweight.
    let query = supabase
        .from('contents')
        .select(`
            id, title, end_date, category, pillar, channel_id, target_platform, status,
            content_analytics(views, likes, comments, shares, captured_at)
        `, { count: 'exact' })
        .eq('pillar', pillar)
        .order('end_date', { ascending: false })
        .range(offset, offset + limit - 1);

    if (channelId && channelId !== 'ALL') {
        query = query.eq('channel_id', channelId);
    }

    if (startDate) {
        query = query.gte('end_date', startDate);
    }
    if (endDate) {
        query = query.lte('end_date', endDate);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        tasks: (data || []).map(content => {
            // Pick the latest analytics snapshot from the join
            const latestStats = Array.isArray(content.content_analytics) 
                ? content.content_analytics.sort((a: any, b: any) => 
                    new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
                  )[0] 
                : null;

            return {
                id: content.id,
                title: content.title,
                endDate: content.end_date ? new Date(content.end_date) : null,
                category: content.category,
                performance: latestStats || { views: 0, likes: 0, comments: 0, shares: 0 },
                pillar: content.pillar,
                channelId: content.channel_id,
                targetPlatforms: content.target_platform || [],
                type: 'CONTENT',
                status: content.status || 'DONE'
            } as any;
        }),
        total: count || 0
    };
};

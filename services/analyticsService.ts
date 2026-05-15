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
        .single();

    if (analyticsError) throw analyticsError;

    return mapSupabaseToAnalytics(analyticsData);
};

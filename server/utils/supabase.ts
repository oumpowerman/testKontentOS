import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || 'https://xgsvxgsrasznszvpysat.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IInhnc3Z4Z3NyYXN6bnN6dnB5c2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzI0NTgsImV4cCI6MjA5ODgwODQ1OH0.2TLqHFHnKQGuoCpBnYjORYbEfARsmhW-zauZ01bqQHM';

export const serverSupabase = createClient(supabaseUrl, supabaseAnonKey);

export const isTaskCompletedServer = (status: string): boolean => {
    if (!status) return false;
    const s = status.trim().toUpperCase();
    if (s === 'DONE' || s === 'APPROVE' || s === 'PASSED') return true;
    const COMPLETION_KEYWORDS = [
        'COMPLETE', 'SUCCESS', 'PUBLISH', 'POSTED', 
        'FINISH', 'CLOSED', 'ARCHIVE', 'FINAL', 'DONE',
        'APPROVED', 'VERIFIED', 'ACCEPTED', 'PASS'
    ];
    return COMPLETION_KEYWORDS.some(k => s.includes(k));
};

export const mapDbToTaskServer = (data: any, type: 'CONTENT' | 'TASK'): any => {
    const startDateVal = data.start_date || data.startDate || data.created_at;
    const endDateVal = data.end_date || data.endDate || data.created_at;

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
        scheduledAt: r.scheduled_at,
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
        startDate: startDateVal,
        endDate: endDateVal,
        createdAt: data.created_at,
        updatedAt: data.updated_at || undefined,
        channelId: data.channel_id,
        targetPlatforms: platforms,
        scheduledTime: data.scheduled_time,
        isUnscheduled: data.is_unscheduled ?? false,
        assigneeIds: data.assignee_ids || [],
        ideaOwnerIds: data.idea_owner_ids || [],
        editorIds: data.editor_ids || [],
        assets: data.assets || [],
        reviews: reviews.sort((a: any, b: any) => (a.round || 0) - (b.round || 0)),
        logs: [], 
        performance: data.performance || undefined,
        difficulty: data.difficulty || 'MEDIUM',
        estimatedHours: data.estimated_hours || 0,
        assigneeType: data.assignee_type || 'TEAM',
        targetPosition: data.target_position,
        caution: data.caution,
        importance: data.importance,
        publishedLinks: data.published_links || {},
        shootDate: data.shoot_date || undefined,
        shootLocation: data.shoot_location || undefined,
        shootTripId: data.shoot_trip_id || undefined,
        shootTimeStart: data.shoot_time_start || undefined,
        shootTimeEnd: data.shoot_time_end || undefined,
        shootNotes: data.shoot_notes || undefined,
        localPath: data.local_path || undefined,
        driveLabel: data.drive_label || undefined,
        isInShootQueue: data.is_in_shoot_queue || false,
        isSoftFinished: data.is_soft_finished || false,
        contentId: data.content_id,
        showOnBoard: data.show_on_board,
        parentContentTitle: data.contents?.title,
        roadmapId: data.roadmap_id,
        scriptId: data.script_id,
        sla_revert_count: data.sla_revert_count,
        is_penalized: data.is_penalized,
        last_penalized_at: data.last_penalized_at || undefined,
    };
};

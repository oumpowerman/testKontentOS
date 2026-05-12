
import { supabase } from '../lib/supabase';
import { Task, ReviewSession } from '../types';

export const taskService = {
  // Shared mapper for Task/Content
  mapToTask(data: any, type: 'CONTENT' | 'TASK'): Task {
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
        channelId: data.channel_id || data.channelId,
        targetPlatforms: platforms,
        isUnscheduled: data.is_unscheduled || data.isUnscheduled,
        assigneeIds: data.assignee_ids || data.assigneeIds || [],
        ideaOwnerIds: data.idea_owner_ids || data.ideaOwnerIds || [],
        editorIds: data.editor_ids || data.editorIds || [],
        assets: data.assets || [],
        reviews: reviews.sort((a, b) => a.round - b.round),
        logs: [], 
        performance: type === 'TASK' ? data.performance || undefined : undefined,
        difficulty: type === 'TASK' ? data.difficulty || 'MEDIUM' : undefined,
        estimatedHours: type === 'TASK' ? data.estimated_hours || 0 : undefined,
        assigneeType: type === 'TASK' ? data.assignee_type || 'TEAM' : undefined,
        targetPosition: data.target_position,
        caution: type === 'TASK' ? data.caution : undefined,
        importance: type === 'TASK' ? data.importance : undefined,
        publishedLinks: data.published_links || {},
        shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
        shootLocation: data.shoot_location || undefined,
        contentId: data.content_id,
        showOnBoard: data.show_on_board,
        parentContentTitle: data.contents?.title
    };
  },

  async getContents(startDate: string, endDate: string, isAllLoaded: boolean = false) {
    let query = supabase
        .from('contents')
        .select(`*, task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, content_id)`);
    
    if (!isAllLoaded) {
        query = query.or(`is_unscheduled.eq.true,and(end_date.gte.${startDate},start_date.lte.${endDate})`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(d => this.mapToTask(d, 'CONTENT'));
  },

  async getTasks(startDate: string, endDate: string, isAllLoaded: boolean = false) {
    let query = supabase.from('tasks').select(`*, contents (title)`);
    
    if (!isAllLoaded) {
        query = query.gte('end_date', startDate).lte('start_date', endDate);
    }
    // Filter out sub-tasks that shouldn't be on board (unless explicitly set)
    query = query.or('content_id.is.null,show_on_board.eq.true');

    const { data, error } = await query;
    if (error) throw error;
    return data.map(d => this.mapToTask(d, 'TASK'));
  },

  async getSubTasks(contentId: string) {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(d => this.mapToTask(d, 'TASK'));
  },

  async createTask(task: Partial<Task>, type: 'CONTENT' | 'TASK') {
     const table = type === 'CONTENT' ? 'contents' : 'tasks';
     // Note: In a real refactor, payload construction would happen here.
     // For now, we assume the caller passes the DB-ready payload or we map it.
     // To keep this safe, we'll let the hook handle mapping for now and just use this as a wrapper.
     // Ideally, the payload mapping should be moved here in Phase 3.
  },
  
  async updateTask(id: string, updates: any, type: 'CONTENT' | 'TASK') {
      const table = type === 'CONTENT' ? 'contents' : 'tasks';
      const { error } = await supabase.from(table).update(updates).eq('id', id);
      if (error) throw error;
      return true;
  },

  async deleteTask(id: string, type: 'CONTENT' | 'TASK') {
      const table = type === 'CONTENT' ? 'contents' : 'tasks';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
  }
};

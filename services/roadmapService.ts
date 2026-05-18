
import { supabase } from '../lib/supabase';

export type TaskStatus = 'Planned' | 'Ongoing' | 'Done' | 'Delayed';

export interface RoadmapTask {
  id: string;
  no: number;
  initiative: string;
  category: string;
  status: TaskStatus;
  progress: number; // 0-100
  buffer: string; // e.g., "2d"
  milestone?: string;
  start_week: number; // 1-52
  duration_weeks: number;
  effort?: number; // 1-5
  impact?: number; // 1-5
  dependencies?: string[]; // IDs of tasks this task depends on
  original_start_week?: number; // Baseline tracking
  original_duration_weeks?: number; // Baseline tracking
  created_at?: string;
  updated_at?: string;
}

export const ROADMAP_CATEGORIES = ['TikTok', 'System', 'Marketing', 'Other'];

export const roadmapService = {
  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('roadmap_categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data as { id: string, name: string, color: string }[];
  },

  async addCategory(name: string, color: string = '#818CF8') {
    const { data, error } = await supabase
      .from('roadmap_categories')
      .insert([{ name, color }])
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Failed to create category: No data returned');
    return data;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('roadmap_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Tasks
  async getTasks() {
    const { data, error } = await supabase
      .from('roadmap_tasks')
      .select('*')
      .order('no', { ascending: true });
    
    if (error) throw error;
    return data as RoadmapTask[];
  },

  async createTask(task: Omit<RoadmapTask, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('roadmap_tasks')
      .insert([task])
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create task: No data returned');
    return data as RoadmapTask;
  },

  async updateTask(id: string, updates: Partial<RoadmapTask>) {
    const { data, error } = await supabase
      .from('roadmap_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to update task: Not found or no data returned');
    return data as RoadmapTask;
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('roadmap_tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  subscribeToChanges(callback: () => void) {
    return supabase
      .channel('roadmap_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roadmap_tasks' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roadmap_categories' }, callback)
      .subscribe();
  }
};

export const timelineUtils = {
  getQuarter(monthIndex: number) {
    return `ไตรมาส ${Math.floor(monthIndex / 3) + 1}`;
  },

  getMonthName(monthIndex: number) {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[monthIndex % 12];
  },

  getCurrentWeekIndex() {
    const now = new Date();
    return this.getWeekIndexFromDate(now);
  },

  getWeekIndexFromDate(date: Date) {
    const month = date.getMonth();
    const day = date.getDate();
    // Simplified week calculation to match 4-weeks-per-month grid
    // Every month is exactly 4 weeks (28 days visually)
    const weekInMonth = Math.min(Math.floor((day - 1) / 7) + 1, 4);
    return (month * 4) + weekInMonth;
  },

  getDateFromWeekIndex(weekIndex: number) {
    const month = Math.floor((weekIndex - 1) / 4);
    const weekInMonth = ((weekIndex - 1) % 4) + 1;
    const day = ((weekInMonth - 1) * 7) + 1;
    // We assume 2026 for now as per previous context
    return new Date(2026, month, day);
  },

  getTimelineConfig(tasks: RoadmapTask[] = []) {
    const now = new Date();
    const currentMonthGlobal = now.getMonth(); 
    const currentYear = now.getFullYear();
    
    // Default range: 2 months back, 5 months ahead
    let startMonthOffset = -2;
    let endMonthOffset = 4;

    // Expand based on tasks if they fall outside the default range
    if (tasks.length > 0) {
      tasks.forEach(t => {
        // Task start/end are absolute simplified week indices (month * 4 + week)
        const startMonth = Math.floor((t.start_week - 1) / 4);
        const endMonth = Math.floor((t.start_week + t.duration_weeks - 1) / 4);
        
        const sOffset = startMonth - currentMonthGlobal;
        const eOffset = endMonth - currentMonthGlobal;
        
        if (sOffset < startMonthOffset) startMonthOffset = sOffset - 1; // 1 month buffer
        if (eOffset > endMonthOffset) endMonthOffset = eOffset + 1; // 1 month buffer
      });
    }

    const monthsToShow = [];
    for (let i = startMonthOffset; i <= endMonthOffset; i++) {
        const mOffset = currentMonthGlobal + i;
        const m = (mOffset + 1200) % 12; // Handle negative offsets correctly
        const yearOffset = Math.floor(mOffset / 12);
        const year = currentYear + yearOffset;
        monthsToShow.push({
            index: m,
            name: this.getMonthName(m),
            quarter: this.getQuarter(m),
            year: year,
            start_week: (mOffset * 4) + 1 
        });
    }
    return monthsToShow;
  }
};

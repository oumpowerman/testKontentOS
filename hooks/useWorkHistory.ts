import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface WorkHistoryFilters {
    startDate: Date;
    endDate: Date;
    status: string;
    search?: string;
}

export const useWorkHistory = (userId: string | undefined, isOpen: boolean) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const pageSize = 20;

    const [filters, setFilters] = useState<WorkHistoryFilters>({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
        status: 'ALL',
    });

    // Map Raw DB Data to Unified Task Type
    const mapToTask = useCallback((data: any): Task => {
        return {
            ...data,
            id: data.id,
            title: data.title,
            description: data.description || '',
            status: data.status,
            priority: data.priority,
            startDate: data.start_date ? new Date(data.start_date) : new Date(),
            endDate: data.end_date ? new Date(data.end_date) : new Date(),
            createdAt: data.created_at ? new Date(data.created_at) : undefined,
            updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
            assigneeIds: data.assignee_ids || [],
            difficulty: data.difficulty || 'MEDIUM',
            estimatedHours: data.estimated_hours || 0,
            channelId: data.channel_id,
            category: data.category,
            assets: data.assets || [],
            performance: data.performance || undefined,
            sla_revert_count: data.sla_revert_count || 0,
        } as Task;
    }, []);

    // 1. Fetch total count (Lightweight request)
    const fetchTotalCount = useCallback(async () => {
        if (!userId) return;
        try {
            let query = supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .contains('assignee_ids', [userId]);

            if (filters.status !== 'ALL') {
                query = query.eq('status', filters.status);
            }

            if (filters.startDate && filters.endDate) {
                query = query
                    .gte('created_at', filters.startDate.toISOString())
                    .lte('created_at', filters.endDate.toISOString());
            }
            
            const { count, error } = await query;
            
            if (error) throw error;
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Error fetching total task count:', err);
        }
    }, [userId, filters.status, filters.startDate, filters.endDate]);

    // 2. Fetch paginated data
    const fetchTasks = useCallback(async () => {
        if (!userId || !isOpen) return;
        setLoading(true);
        try {
            let query = supabase
                .from('tasks')
                .select('*')
                .contains('assignee_ids', [userId])
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (filters.startDate && filters.endDate) {
                query = query
                    .gte('created_at', filters.startDate.toISOString())
                    .lte('created_at', filters.endDate.toISOString());
            }

            if (filters.status !== 'ALL') {
                query = query.eq('status', filters.status);
            }

            if (filters.search) {
                query = query.ilike('title', `%${filters.search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            
            const mappedTasks = (data || []).map(mapToTask);
            setTasks(mappedTasks);
        } catch (err) {
            console.error('Error fetching work history:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, isOpen, filters, page, mapToTask]);

    useEffect(() => {
        if (isOpen) {
            fetchTotalCount();
        }
    }, [isOpen, fetchTotalCount]);

    useEffect(() => {
        if (isOpen) {
            fetchTasks();
        }
    }, [isOpen, fetchTasks]);

    return {
        tasks,
        totalCount,
        loading,
        page,
        setPage,
        filters,
        setFilters,
        refresh: fetchTasks
    };
};

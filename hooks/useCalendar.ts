
import React, { useState, useEffect, useCallback } from 'react';
import { addMonths, endOfMonth, endOfWeek, isSameDay } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Task, ChipConfig, FilterType } from '../types';
import { DEFAULT_CHIPS } from '../constants';

interface UseCalendarProps {
    tasks: Task[];
    userId?: string;
    onMoveTask: (task: Task) => void;
}

export const useCalendar = ({ tasks, userId, onMoveTask }: UseCalendarProps) => {
    // --- Navigation State ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExpanded, setIsExpanded] = useState(false);

    // --- Filter State ---
    const [viewMode, setViewMode] = useState<'CONTENT' | 'TASK'>('CONTENT');
    const [filterChannelId, setFilterChannelId] = useState<string>('ALL');
    
    const [activeChipIds, setActiveChipIds] = useState<string[]>([]);
    
    const [customChips, setCustomChips] = useState<ChipConfig[]>([]);

    const [showFilters, setShowFilters] = useState(true);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    // --- Fetch Custom Chips from DB ---
    const fetchCustomChips = useCallback(async () => {
        if (!userId) return;
        try {
            // 1. Fetch existing filters
            const { data, error } = await supabase
                .from('smart_filters')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            // 2. If NO filters exist, SEED the default ones into DB
            if (data && data.length === 0) {
                const seedData = DEFAULT_CHIPS.map(chip => ({
                    id: chip.id,
                    user_id: userId,
                    label: chip.label,
                    type: chip.type,
                    value: chip.value,
                    color_theme: chip.colorTheme,
                    scope: chip.scope || 'CONTENT',
                    mode: chip.mode || 'INCLUDE'
                }));

                const { error: seedError } = await supabase
                    .from('smart_filters')
                    .insert(seedData);

                if (seedError) throw seedError;

                // Set state to default chips immediately after seeding
                setCustomChips(DEFAULT_CHIPS);
                return;
            }

            // 3. If filters exist, use them as the Source of Truth
            if (data) {
                const dbChips: ChipConfig[] = data.map(d => ({
                    id: d.id,
                    label: d.label,
                    type: d.type as FilterType,
                    value: d.value,
                    colorTheme: d.color_theme,
                    scope: d.scope,
                    mode: d.mode
                }));

                setCustomChips(dbChips);
            }
        } catch (err) {
            console.error('Failed to fetch/seed smart filters:', err);
        }
    }, [userId]);

    useEffect(() => {
        fetchCustomChips();
    }, [fetchCustomChips]);

    useEffect(() => {
        setActiveChipIds([]);
        setShowFilters(true);
    }, [viewMode]);

    const nextMonth = useCallback(() => setCurrentDate(prev => addMonths(prev, 1)), []);
    const prevMonth = useCallback(() => setCurrentDate(prev => addMonths(prev, -1)), []);
    const goToToday = useCallback(() => setCurrentDate(new Date()), []);

    const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day; 
        date.setDate(diff);
        date.setHours(0,0,0,0);
        return date;
    };
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = getStartOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    // Helper: Check if task matches chip criteria
    const checkMatch = (t: Task, chip: ChipConfig) => {
        switch (chip.type) {
            case 'CHANNEL': return t.channelId === chip.value;
            case 'FORMAT': {
                const formats = t.contentFormats || [];
                return formats.includes(chip.value);
            }
            case 'STATUS': return t.status === chip.value;
            case 'PILLAR': return t.pillar === chip.value;
            case 'CATEGORY': return t.category === chip.value;
            default: return false;
        }
    };

    // Memoize Filter Logic with Exclusion Support
    const filterTasks = useCallback((tasksToFilter: Task[]) => {
        let filtered = tasksToFilter.filter(t => t.type === viewMode);

        if (activeChipIds.length > 0 && Array.isArray(customChips)) {
            // Get all active chip objects
            const activeChips = customChips.filter(c => activeChipIds.includes(c.id));
            
            // Separate into Include and Exclude lists
            const excludeChips = activeChips.filter(c => c.mode === 'EXCLUDE');
            const includeChips = activeChips.filter(c => c.mode !== 'EXCLUDE'); // Default to INCLUDE if undefined

            filtered = filtered.filter(t => {
                // 1. Exclusion Logic: If matches ANY exclude chip -> HIDE IT
                if (excludeChips.length > 0) {
                    const shouldExclude = excludeChips.some(chip => checkMatch(t, chip));
                    if (shouldExclude) return false;
                }

                // 2. Inclusion Logic: If there are include chips, MUST match AT LEAST ONE
                // If no include chips selected (only exclude selected), show everything remaining.
                if (includeChips.length > 0) {
                    const isIncluded = includeChips.some(chip => checkMatch(t, chip));
                    if (!isIncluded) return false;
                }

                return true;
            });
        }
        return filtered;
    }, [viewMode, activeChipIds, customChips]);

    const getTasksForDay = useCallback((day: Date) => {
        return tasks.filter(task => isSameDay(day, task.endDate) && !task.isUnscheduled);
    }, [tasks]);

    const saveChip = async (chip: ChipConfig) => {
        if (!userId) return;

        // Optimistic Update
        setCustomChips(prev => {
            const current = Array.isArray(prev) ? prev : [];
            if (current.find(c => c.id === chip.id)) {
                return current.map(c => c.id === chip.id ? chip : c);
            } else {
                return [...current, chip];
            }
        });

        try {
            const { error } = await supabase
                .from('smart_filters')
                .upsert({
                    id: chip.id,
                    user_id: userId,
                    label: chip.label,
                    type: chip.type,
                    value: chip.value,
                    color_theme: chip.colorTheme,
                    scope: chip.scope || 'CONTENT',
                    mode: chip.mode || 'INCLUDE',
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
        } catch (err) {
            console.error('Failed to save smart filter:', err);
        }
    };

    const deleteChip = async (id: string) => {
        if (!userId) return;

        // Optimistic Update
        setCustomChips(prev => (Array.isArray(prev) ? prev : []).filter(c => c.id !== id));
        setActiveChipIds(prev => prev.filter(cId => cId !== id));

        try {
            const { error } = await supabase
                .from('smart_filters')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            if (error) throw error;
        } catch (err) {
            console.error('Failed to delete smart filter:', err);
        }
    };

    const toggleChip = (id: string) => {
        if (id === 'ALL') {
            setActiveChipIds([]);
        } else {
            setActiveChipIds(prev => 
                prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
            );
        }
    };

    // Memoize Drag Handlers
    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = "move";

        // Set JSON data for Workbox
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const dragData = {
                title: task.title,
                type: task.type, // 'CONTENT' or 'TASK'
                content_id: task.id
            };
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        }
    }, [tasks]);

    const handleDragOver = useCallback((e: React.DragEvent, day: Date) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
        // Optimized: Only update state if date actually changes
        setDragOverDate(prev => (!prev || !isSameDay(day, prev)) ? day : prev);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetDate: Date) => {
        e.preventDefault();
        setDragOverDate(null);
        
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId) return;

        const taskToMove = tasks.find(t => t.id === taskId);
        
        // ALLOW DROP IF: 
        // 1. Task exists AND
        // 2. Dates are different OR Task was Unscheduled (Stock)
        if (taskToMove) {
             const isDifferentDate = !isSameDay(taskToMove.endDate, targetDate);
             const wasUnscheduled = taskToMove.isUnscheduled;

             if (isDifferentDate || wasUnscheduled) {
                const updatedTask = { 
                    ...taskToMove, 
                    startDate: targetDate, 
                    endDate: targetDate,
                    isUnscheduled: false // IMPORTANT: Always schedule it upon drop
                };
                onMoveTask(updatedTask);
             }
        }
    }, [tasks, onMoveTask]);

    return {
        currentDate,
        viewMode,
        filterChannelId,
        activeChipIds,
        customChips: Array.isArray(customChips) ? customChips : [],
        isExpanded,
        showFilters,
        dragOverDate,
        isManageModalOpen,
        
        startDate,
        endDate,

        setViewMode,
        setFilterChannelId,
        toggleChip,
        setIsExpanded,
        setIsManageModalOpen,

        nextMonth,
        prevMonth,
        goToToday,
        filterTasks,
        getTasksForDay,
        saveChip,
        deleteChip,
        handleDragStart,
        handleDragOver,
        handleDrop,
        setDragOverDate 
    };
};

import { useMemo, useState } from 'react';
import { isToday, addDays, isBefore } from 'date-fns';
import { Task, Channel, User } from '../../../../types';
import { isTaskCompleted } from '../../../../constants';

export type FilterType = 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON';

interface UseUrgentTasksProps {
    tasks: Task[];
    channels: Channel[];
    users: User[];
    viewScope: 'ALL' | 'ME';
    currentUser: User;
}

export const useUrgentTasks = ({
    tasks,
    channels,
    users,
    viewScope,
    currentUser,
}: UseUrgentTasksProps) => {
    const [selectedType, setSelectedType] = useState<'ALL' | 'CONTENT' | 'TASK'>('ALL');
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

    // --- Filter and Sort Logic ---
    const { displayTasks, stats, counts, channelsWithPending, assigneesWithPending } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter: Active Tasks & Scope
        const scopeActiveTasks = tasks.filter(t => {
            // Must not be done & not unscheduled
            if (t.isUnscheduled || isTaskCompleted(t.status as string)) return false;

            // Scope Check
            if (viewScope === 'ME') {
                const isAssignee = t.assigneeIds?.includes(currentUser.id);
                const isOwner = t.ideaOwnerIds?.includes(currentUser.id);
                const isEditor = t.editorIds?.includes(currentUser.id);
                if (!isAssignee && !isOwner && !isEditor) return false;
            }
            return true;
        });

        // Tab count calculations (before filtering by selectedType)
        const allCount = scopeActiveTasks.length;
        const contentCount = scopeActiveTasks.filter(t => t.type === 'CONTENT').length;
        const taskCount = scopeActiveTasks.filter(t => t.type === 'TASK').length;

        // Channel-grouped counts for active content
        const channelCounts: Record<string, number> = {};
        scopeActiveTasks.filter(t => t.type === 'CONTENT').forEach(t => {
            if (t.channelId) {
                channelCounts[t.channelId] = (channelCounts[t.channelId] || 0) + 1;
            }
        });
        const channelsWithPendingList = Object.entries(channelCounts)
            .map(([chId, count]) => {
                const ch = channels.find(c => c.id === chId);
                return { channel: ch, count, id: chId };
            })
            .filter(item => item.channel)
            .sort((a, b) => b.count - a.count);

        // Assignee-grouped counts for active tasks
        const assigneeCounts: Record<string, number> = {};
        scopeActiveTasks.filter(t => t.type === 'TASK').forEach(t => {
            t.assigneeIds?.forEach(uid => {
                if (uid) {
                    assigneeCounts[uid] = (assigneeCounts[uid] || 0) + 1;
                }
            });
        });
        const assigneesWithPendingList = Object.entries(assigneeCounts)
            .map(([uid, count]) => {
                const u = users.find(user => user.id === uid);
                return { user: u, count, id: uid };
            })
            .filter(item => item.user)
            .sort((a, b) => b.count - a.count);

        // Filter active tasks by tab selection (Types)
        const typeFilteredTasks = scopeActiveTasks.filter(t => {
            if (selectedType === 'CONTENT') return t.type === 'CONTENT';
            if (selectedType === 'TASK') return t.type === 'TASK';
            return true;
        });

        // Categorize for Stats based on typeFilteredTasks
        let overdueCount = 0;
        let todayCount = 0;
        let upcomingCount = 0; // Next 2 days

        typeFilteredTasks.forEach(t => {
            const endDate = new Date(t.endDate);
            endDate.setHours(0, 0, 0, 0);

            if (isBefore(endDate, today)) overdueCount++;
            else if (isToday(endDate)) todayCount++;
            else if (isBefore(endDate, addDays(today, 3))) upcomingCount++;
        });

        // Apply Primary Active Filter (Stats filter: OVERDUE, TODAY, SOON)
        let filteredByStatsAndType = typeFilteredTasks;
        if (activeFilter === 'OVERDUE') {
            filteredByStatsAndType = typeFilteredTasks.filter(t => {
                const d = new Date(t.endDate); d.setHours(0,0,0,0);
                return isBefore(d, today);
            });
        } else if (activeFilter === 'TODAY') {
            filteredByStatsAndType = typeFilteredTasks.filter(t => {
                const d = new Date(t.endDate); d.setHours(0,0,0,0);
                return isToday(d);
            });
        } else if (activeFilter === 'SOON') {
            filteredByStatsAndType = typeFilteredTasks.filter(t => {
                const d = new Date(t.endDate); d.setHours(0,0,0,0);
                return !isBefore(d, today) && !isToday(d) && isBefore(d, addDays(today, 3));
            });
        }

        // Apply Interactive Channel filter (if selected)
        if (selectedChannelId) {
            filteredByStatsAndType = filteredByStatsAndType.filter(t => t.channelId === selectedChannelId);
        }

        // Apply Interactive Assignee filter (if selected)
        if (selectedAssigneeId) {
            filteredByStatsAndType = filteredByStatsAndType.filter(t => t.assigneeIds?.includes(selectedAssigneeId));
        }

        // Sort based on Priority Rule (Overdue > Urgent Priority > Date)
        const smartSorted = [...filteredByStatsAndType].sort((a, b) => {
            const dateA = new Date(a.endDate).getTime();
            const dateB = new Date(b.endDate).getTime();
            
            // 1. Overdue comes first
            const isOverdueA = dateA < today.getTime();
            const isOverdueB = dateB < today.getTime();
            if (isOverdueA && !isOverdueB) return -1;
            if (!isOverdueA && isOverdueB) return 1;

            // 2. Urgent Priority
            if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
            if (a.priority !== 'URGENT' && b.priority === 'URGENT') return 1;

            // 3. Date Ascending
            return dateA - dateB;
        });

        const isDefaultView = activeFilter === 'ALL' && !selectedChannelId && !selectedAssigneeId;
        const finalDisplayList = isDefaultView ? smartSorted.slice(0, 5) : smartSorted;

        return {
            displayTasks: finalDisplayList,
            stats: { overdue: overdueCount, today: todayCount, upcoming: upcomingCount, total: typeFilteredTasks.length },
            counts: { allCount, contentCount, taskCount },
            channelsWithPending: channelsWithPendingList,
            assigneesWithPending: assigneesWithPendingList
        };
    }, [tasks, viewScope, currentUser, activeFilter, selectedType, selectedChannelId, selectedAssigneeId, channels, users]);

    const toggleFilter = (type: FilterType) => {
        if (activeFilter === type) {
            setActiveFilter('ALL');
        } else {
            setActiveFilter(type);
        }
    };

    const handleTypeChange = (type: 'ALL' | 'CONTENT' | 'TASK') => {
        setSelectedType(type);
        // Reset sub filters when switching types to keep a fresh look
        setActiveFilter('ALL');
        setSelectedChannelId(null);
        setSelectedAssigneeId(null);
    };

    return {
        selectedType,
        activeFilter,
        setActiveFilter,
        isHelpOpen,
        setIsHelpOpen,
        selectedChannelId,
        setSelectedChannelId,
        selectedAssigneeId,
        setSelectedAssigneeId,
        displayTasks,
        stats,
        counts,
        channelsWithPending,
        assigneesWithPending,
        toggleFilter,
        handleTypeChange,
    };
};

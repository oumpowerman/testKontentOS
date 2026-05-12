
import { WeeklyQuest, Task, Platform } from '../types';
import { isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';

/**
 * Unified logic to check if a task matches a quest's criteria.
 * This ensures consistency across all widgets and hooks.
 */
export const isTaskMatchingQuest = (task: Task, quest: WeeklyQuest): boolean => {
    if (quest.questType === 'MANUAL') return false;
    
    // 1. Basic Validity
    if (!task.endDate || task.isUnscheduled) return false;

    // 2. Date Range Check (Timezone Safe)
    const qStart = startOfDay(new Date(quest.weekStartDate));
    const qEnd = endOfDay(quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6));
    
    const taskDate = new Date(task.endDate);
    const inRange = isWithinInterval(taskDate, { start: qStart, end: qEnd });
    if (!inRange) return false;

    // 3. Channel Match
    if (quest.channelId && task.channelId !== quest.channelId) return false;

    // 4. Status Match
    // Logic: If targetStatus is set, match ONLY that. If not set, match 'DONE'.
    const targetStatus = quest.targetStatus || 'DONE';
    if (task.status !== targetStatus) return false;

    // 5. Platform Match
    if (quest.targetPlatform) {
        if (quest.targetPlatform === 'ALL') {
            // Match any task that has at least one platform OR is explicitly marked ALL
            const hasPlatforms = (task.targetPlatforms && task.targetPlatforms.length > 0);
            if (!hasPlatforms) return false;
        } else {
            const hasSpecific = task.targetPlatforms?.includes(quest.targetPlatform as Platform);
            const hasAll = task.targetPlatforms?.includes('ALL');
            if (!hasSpecific && !hasAll) return false;
        }
    }

    // 6. Format Match (Multi-format support)
    if (quest.targetFormat && quest.targetFormat.length > 0) {
        const taskFormats = task.contentFormats || [];
        const hasMatch = taskFormats.some(f => quest.targetFormat?.includes(f));
        if (!hasMatch) return false;
    }

    return true;
};

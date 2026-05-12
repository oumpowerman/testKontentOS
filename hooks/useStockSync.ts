
import { useEffect, useMemo } from 'react';
import { Task } from '../types';

/**
 * Hybrid Sync Hook V2 (Smart Deep Check) - Optimized for Performance
 * Watches for changes in the global `tasks` state and syncs to local pagination.
 * Uses a Map for O(1) lookups to handle tens of thousands of tasks efficiently.
 */
export const useStockSync = (
    globalTasks: Task[],
    paginatedContents: Task[],
    updateLocalItem: (task: Task, isDelete?: boolean) => void,
    jumpToPage1?: () => void
) => {
    // Create a Map of global tasks for O(1) lookup
    // This runs only when globalTasks changes
    const globalTasksMap = useMemo(() => {
        const map = new Map<string, Task>();
        for (const task of globalTasks) {
            map.set(task.id, task);
        }
        return map;
    }, [globalTasks]);

    useEffect(() => {
        // Guard: If globalTasks is empty but we haven't checked if it's still loading, 
        // we might accidentally delete everything. 
        if (globalTasks.length === 0) {
            // If we have local items but global is empty, it MIGHT be a real deletion of all items,
            // but more likely it's just loading. We skip sync to be safe.
            return;
        }

        // 1. Sync Updates & Deletions (Iterate Local List)
        paginatedContents.forEach(localTask => {
            const globalMatch = globalTasksMap.get(localTask.id);
            
            if (globalMatch) {
                // --- Deep Comparison Helpers ---
                const arraysDiff = (a: any[] = [], b: any[] = []) => {
                    if (a.length !== b.length) return true;
                    const sortedA = [...a].sort();
                    const sortedB = [...b].sort();
                    return JSON.stringify(sortedA) !== JSON.stringify(sortedB);
                };

                const dateDiff = (a: Date | undefined, b: Date | undefined) => {
                    if (!a && !b) return false;
                    if (!a || !b) return true;
                    return new Date(a).getTime() !== new Date(b).getTime();
                };

                // --- Comprehensive Change Detection ---
                const hasChanged = 
                    globalMatch.title !== localTask.title || 
                    globalMatch.status !== localTask.status ||
                    globalMatch.channelId !== localTask.channelId ||
                    globalMatch.remark !== localTask.remark ||
                    globalMatch.contentFormat !== localTask.contentFormat ||
                    globalMatch.pillar !== localTask.pillar ||
                    globalMatch.category !== localTask.category ||
                    globalMatch.isUnscheduled !== localTask.isUnscheduled ||
                    globalMatch.localPath !== localTask.localPath ||
                    globalMatch.driveLabel !== localTask.driveLabel ||
                    globalMatch.shootLocation !== localTask.shootLocation ||
                    globalMatch.isInShootQueue !== localTask.isInShootQueue ||
                    globalMatch.isSoftFinished !== localTask.isSoftFinished ||
                    globalMatch.difficulty !== localTask.difficulty ||
                    globalMatch.estimatedHours !== localTask.estimatedHours ||
                    globalMatch.caution !== localTask.caution ||
                    globalMatch.importance !== localTask.importance ||
                    JSON.stringify(globalMatch.publishedLinks) !== JSON.stringify(localTask.publishedLinks) ||
                    dateDiff(globalMatch.endDate, localTask.endDate) ||
                    dateDiff(globalMatch.shootDate, localTask.shootDate) ||
                    arraysDiff(globalMatch.contentFormats, localTask.contentFormats) ||
                    arraysDiff(globalMatch.ideaOwnerIds, localTask.ideaOwnerIds) ||
                    arraysDiff(globalMatch.editorIds, localTask.editorIds) ||
                    arraysDiff(globalMatch.assigneeIds, localTask.assigneeIds) ||
                    arraysDiff(globalMatch.targetPlatforms, localTask.targetPlatforms) ||
                    arraysDiff(globalMatch.tags, localTask.tags);

                if (hasChanged) {
                     console.log(`[StockSync] Updating local item: ${localTask.id}`);
                     updateLocalItem(globalMatch);
                }
            }
            // Logic for deleting items not in globalTasks was removed because globalTasks 
            // is a sliding window cache (TaskContext) and may not contain all paginated items.
        });

        // 2. Sync Additions (Iterate Global List)
        const now = new Date().getTime();
        globalTasks.forEach(globalTask => {
            if (globalTask.type === 'CONTENT') {
                const existsLocally = paginatedContents.some(t => t.id === globalTask.id);
                if (!existsLocally) {
                    const createdAt = globalTask.createdAt ? new Date(globalTask.createdAt).getTime() : 0;
                    
                    // Heuristic: If created in the last 2 minutes, or if it has NO createdAt (optimistic),
                    // we try to add it. updateLocalItem will check if it matches current filters.
                    const isNew = !globalTask.createdAt || (now - createdAt < 120000);
                    
                    if (isNew) {
                        console.log(`[StockSync] Adding new global item to local: ${globalTask.id}`);
                        updateLocalItem(globalTask);
                        
                        // --- SMART JUMP ---
                        // If the task has NO createdAt, it means it was just created OPTIMISTICALLY 
                        // by the current user. We should jump to page 1.
                        if (!globalTask.createdAt && jumpToPage1) {
                            console.log(`[StockSync] Actor detected! Jumping to Page 1.`);
                            jumpToPage1();
                        }
                    }
                }
            }
        });
    }, [globalTasksMap, paginatedContents, updateLocalItem, globalTasks, jumpToPage1]);
};

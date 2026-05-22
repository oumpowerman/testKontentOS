
import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { MergedQueueItem } from '../components/checklist/stock/queue/types';

interface ShootQueueContextType {
    queueItems: MergedQueueItem[];
    lastFingerprint: string | null;
    isLoading: boolean;
    setQueueItems: (items: MergedQueueItem[]) => void;
    refreshQueue: (includeScripts: boolean) => Promise<void>;
    checkAndRefreshIfNeeded: (includeScripts: boolean) => Promise<void>;
    updateLocalItem: (id: string, updates: Partial<MergedQueueItem>) => void;
    removeItemLocally: (id: string) => void;
}

const ShootQueueContext = createContext<ShootQueueContextType | undefined>(undefined);

export const ShootQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [queueItems, setQueueItemsState] = useState<MergedQueueItem[]>([]);
    const [lastFingerprint, setLastFingerprint] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Refs to keep track of current state in async functions
    const itemsRef = useRef<MergedQueueItem[]>([]);

    const setQueueItems = useCallback((items: MergedQueueItem[]) => {
        setQueueItemsState(items);
        itemsRef.current = items;
        
        // Generate a simple fingerprint based on IDs and their updated_at if possible
        // For now, we'll use a combination of length and ID join
        const fingerprint = items.map(i => i.id).join('|') + items.length;
        setLastFingerprint(fingerprint);
    }, []);

    const fetchQueueData = useCallback(async (includeScripts: boolean) => {
        // 1. Fetch Contents in Queue
        const { data: contents, error: contentError } = await supabase
            .from('contents')
            .select('*')
            .eq('is_in_shoot_queue', true)
            .order('sort_order', { ascending: true });

        if (contentError) throw contentError;

        let merged: MergedQueueItem[] = (contents || []).map(c => ({
            id: c.id,
            type: 'CONTENT',
            title: c.title,
            status: c.status,
            isSoftFinished: !!c.is_soft_finished,
            shootLocation: c.shoot_location,
            shootTimeStart: c.shoot_time_start,
            shootTimeEnd: c.shoot_time_end,
            shootNotes: c.shoot_notes,
            channelId: c.channel_id,
            sort_order: c.sort_order || 0,
            item: {
                id: c.id,
                type: 'CONTENT',
                title: c.title,
                description: c.description || '',
                status: c.status,
                startDate: new Date(c.start_date),
                endDate: new Date(c.end_date),
                channelId: c.channel_id,
                isInShootQueue: true,
                isSoftFinished: !!c.is_soft_finished,
            } as any
        }));

        // 2. Fetch Scripts in Queue if enabled
        if (includeScripts) {
            const { data: scripts, error: scriptError } = await supabase
                .from('scripts')
                .select('id, title, status, is_soft_finished, shoot_location, shoot_time_start, shoot_time_end, shoot_notes, channel_id, content_id, sort_order, contents(title)')
                .eq('is_in_shoot_queue', true)
                .order('sort_order', { ascending: true });

            if (scriptError) throw scriptError;

            (scripts || []).forEach(s => {
                const existingContentIndex = merged.findIndex(m => m.id === s.content_id);
                
                if (existingContentIndex !== -1) {
                    merged[existingContentIndex].scriptId = s.id;
                } else {
                    merged.push({
                        id: s.id,
                        type: 'SCRIPT',
                        title: s.title,
                        status: s.status,
                        isSoftFinished: !!s.is_soft_finished,
                        shootLocation: s.shoot_location,
                        shootTimeStart: s.shoot_time_start,
                        shootTimeEnd: s.shoot_time_end,
                        shootNotes: s.shoot_notes,
                        channelId: s.channel_id,
                        contentId: s.content_id,
                        sort_order: s.sort_order || 0,
                        item: {
                            id: s.id,
                            title: s.title,
                            status: s.status,
                            contentId: s.content_id,
                            isInShootQueue: true,
                            isSoftFinished: !!s.is_soft_finished,
                        } as any
                    });
                }
            });
        }

        merged.sort((a, b) => a.sort_order - b.sort_order);
        return merged;
    }, []);

    const refreshQueue = useCallback(async (includeScripts: boolean) => {
        setIsLoading(true);
        try {
            const data = await fetchQueueData(includeScripts);
            setQueueItems(data);
        } catch (err) {
            console.error('Context refresh queue failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchQueueData, setQueueItems]);

    // Smart Refresh: Checks if the queue summary (count/max update) changed
    const checkAndRefreshIfNeeded = useCallback(async (includeScripts: boolean) => {
        if (itemsRef.current.length === 0) {
            return refreshQueue(includeScripts);
        }

        try {
            // Quick check: total count of items in queue
            const { count: contentCount } = await supabase
                .from('contents')
                .select('id', { count: 'exact', head: true })
                .eq('is_in_shoot_queue', true);

            const { count: scriptCount } = await supabase
                .from('scripts')
                .select('id', { count: 'exact', head: true })
                .eq('is_in_shoot_queue', true);

            const totalCurrent = (contentCount || 0) + (scriptCount || 0);
            
            // If count changed or we don't have scripts but should, refresh
            if (totalCurrent !== itemsRef.current.length) {
                console.log(`[ShootQueueContext] Fingerprint mismatch (Count: ${itemsRef.current.length} -> ${totalCurrent}), refreshing...`);
                return refreshQueue(includeScripts);
            }
            
            // Optional: More deep check with timestamps could be added here
            // For now, count is a great "Cheap" Egress check
            console.log('[ShootQueueContext] Data is still fresh, avoiding full fetch.');

        } catch (err) {
            console.error('Context smart refresh check failed:', err);
            // Fallback to full refresh on error to be safe
            refreshQueue(includeScripts);
        }
    }, [refreshQueue]);

    const updateLocalItem = useCallback((id: string, updates: Partial<MergedQueueItem>) => {
        setQueueItemsState(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }, []);

    const removeItemLocally = useCallback((id: string) => {
        setQueueItemsState(prev => prev.filter(item => item.id !== id));
    }, []);

    const value = useMemo(() => ({
        queueItems,
        lastFingerprint,
        isLoading,
        setQueueItems,
        refreshQueue,
        checkAndRefreshIfNeeded,
        updateLocalItem,
        removeItemLocally
    }), [queueItems, lastFingerprint, isLoading, setQueueItems, refreshQueue, checkAndRefreshIfNeeded, updateLocalItem, removeItemLocally]);

    return (
        <ShootQueueContext.Provider value={value}>
            {children}
        </ShootQueueContext.Provider>
    );
};

export const useShootQueueContext = () => {
    const context = useContext(ShootQueueContext);
    if (context === undefined) {
        throw new Error('useShootQueueContext must be used within a ShootQueueProvider');
    }
    return context;
};

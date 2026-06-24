import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WorkboxItem } from '../types/features';
import { User } from '../types/core';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface WorkboxContextType {
    items: WorkboxItem[];
    isLoading: boolean;
    isDragging: boolean;
    setIsDragging: (value: boolean) => void;
    addItem: (item: Partial<WorkboxItem>) => Promise<void>;
    updateItem: (id: string, updates: Partial<WorkboxItem>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    clearCompleted: () => Promise<void>;
    reorderItems: (newItems: WorkboxItem[]) => Promise<void>;
    refresh: () => Promise<void>;
    isDocked: boolean;
    setIsDocked: (value: boolean) => void;
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}

const WorkboxContext = createContext<WorkboxContextType | undefined>(undefined);

export const WorkboxProvider: React.FC<{ children: React.ReactNode; currentUser: User | null }> = ({ children, currentUser }) => {
    const [items, setItems] = useState<WorkboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isDocked, setIsDockedState] = useState<boolean>(() => {
        const saved = localStorage.getItem('workbox_docked');
        return saved ? saved === 'true' : false;
    });
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const setIsDocked = (value: boolean) => {
        setIsDockedState(value);
        localStorage.setItem('workbox_docked', String(value));
    };
    const isReorderingRef = useRef(false);
    const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { showToast } = useToast();

    const fetchWorkbox = useCallback(async () => {
        if (!currentUser?.id) {
            setItems([]);
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('workbox_items')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('order_index', { ascending: true });

            if (error) {
                if (error.code !== 'PGRST205') {
                    showToast('ไม่สามารถโหลด WorkBox ได้', 'error');
                }
                throw error;
            }
            setItems(data || []);
        } catch (err: any) {
            console.error('Error fetching workbox:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.id, showToast]);

    useEffect(() => {
        fetchWorkbox();

        if (!currentUser?.id) return;

        const channel = supabase
            .channel(`workbox_global_${currentUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workbox_items',
                    filter: `user_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    // Skip updates if we are currently reordering locally
                    if (isReorderingRef.current) return;

                    if (payload.eventType === 'INSERT') {
                        const newItem = payload.new as WorkboxItem;
                        setItems(prev => {
                            if (prev.some(i => i.id === newItem.id)) return prev;
                            return [...prev, newItem].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedItem = payload.new as WorkboxItem;
                        setItems(prev => prev.map(item => 
                            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
                        ).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
                    } else if (payload.eventType === 'DELETE') {
                        setItems(prev => prev.filter(item => item.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id, fetchWorkbox]);

    const addItem = async (item: Partial<WorkboxItem>) => {
        if (!currentUser?.id) return;
        
        // --- DUPLICATE CHECK ---
        const isDuplicate = items.some(existingItem => {
            // 1. If it's a content item, check by content_id
            if (item.content_id && existingItem.content_id === item.content_id) {
                return true;
            }
            
            // 2. If it's a manual checklist/task (no content_id), check by title (case-insensitive)
            // Only check if both have titles and no content_id
            if (!item.content_id && !existingItem.content_id && item.title && existingItem.title) {
                return existingItem.title.trim().toLowerCase() === item.title.trim().toLowerCase();
            }
            
            return false;
        });

        if (isDuplicate) {
            showToast('รายการนี้มีอยู่ใน WorkBox แล้ว ⚠️', 'warning');
            return;
        }
        
        const tempId = crypto.randomUUID();
        const optimisticItem: WorkboxItem = {
            id: tempId,
            user_id: currentUser.id,
            title: item.title || 'Untitled',
            description: item.description || '',
            type: item.type || 'CHECKLIST',
            content_id: item.content_id,
            is_completed: false,
            order_index: items.length,
            created_at: new Date().toISOString(),
            progress: 0,
            notes: '',
            meta: {}
        };

        setItems(prev => [...prev, optimisticItem]);

        try {
            const { error } = await supabase.from('workbox_items').insert([{
                user_id: currentUser.id,
                title: optimisticItem.title,
                description: optimisticItem.description,
                type: optimisticItem.type,
                content_id: optimisticItem.content_id,
                is_completed: false,
                order_index: optimisticItem.order_index,
                progress: 0,
                notes: '',
                meta: {}
            }]);
            
            if (error) throw error;
        } catch (err: any) {
            console.error('Error adding to workbox:', err);
            setItems(prev => prev.filter(i => i.id !== tempId));
            showToast('ไม่สามารถเพิ่มเข้า WorkBox ได้', 'error');
        }
    };

    const updateItem = async (id: string, updates: Partial<WorkboxItem>) => {
        const previousItems = [...items];
        setItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));

        try {
            const { error } = await supabase
                .from('workbox_items')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            setItems(previousItems);
            showToast('ไม่สามารถอัปเดตรายการได้', 'error');
        }
    };

    const deleteItem = async (id: string) => {
        const previousItems = [...items];
        setItems(prev => prev.filter(item => item.id !== id));

        try {
            const { error } = await supabase
                .from('workbox_items')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            setItems(previousItems);
            showToast('ไม่สามารถลบรายการได้', 'error');
        }
    };

    const clearCompleted = async () => {
        if (!currentUser?.id) return;
        try {
            const { error } = await supabase
                .from('workbox_items')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('is_completed', true);
            if (error) throw error;
            fetchWorkbox();
        } catch (err: any) {
            showToast('ไม่สามารถล้างรายการได้', 'error');
        }
    };

    const reorderItems = async (newItems: WorkboxItem[]) => {
        // 1. Set local state immediately for snappy UI
        setItems(newItems);
        
        // 2. Set reordering lock to ignore incoming Supabase updates for a moment
        isReorderingRef.current = true;

        // 3. Debounce the DB sync to prevent spamming
        if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
        
        reorderTimeoutRef.current = setTimeout(async () => {
            try {
                // Prepare minimal update payload
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    user_id: currentUser?.id,
                    order_index: index,
                    // We must include required fields for upsert if they aren't handled by DB defaults
                    title: item.title,
                    type: item.type
                }));

                const { error } = await supabase
                    .from('workbox_items')
                    .upsert(updates, { onConflict: 'id' });

                if (error) throw error;
            } catch (err: any) {
                console.error('Error reordering workbox:', err);
                showToast('ไม่สามารถบันทึกลำดับใหม่ได้', 'error');
                fetchWorkbox(); // Revert to server state on error
            } finally {
                // Release lock after a short delay to ensure DB state has propagated
                setTimeout(() => {
                    isReorderingRef.current = false;
                }, 1000);
            }
        }, 500); // 500ms debounce
    };

    return (
        <WorkboxContext.Provider value={{ 
            items, 
            isLoading, 
            isDragging, 
            setIsDragging, 
            addItem, 
            updateItem, 
            deleteItem, 
            clearCompleted,
            reorderItems,
            refresh: fetchWorkbox,
            isDocked,
            setIsDocked,
            isOpen,
            setIsOpen
        }}>
            {children}
        </WorkboxContext.Provider>
    );
};

export const useWorkboxContext = () => {
    const context = useContext(WorkboxContext);
    if (context === undefined) {
        throw new Error('useWorkboxContext must be used within a WorkboxProvider');
    }
    return context;
};

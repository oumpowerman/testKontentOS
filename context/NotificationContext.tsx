
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { User, AppNotification, GameLog } from '../types';

interface NotificationContextType {
    notifications: any[];
    gameLogs: any[];
    leaveRequests: any[];
    deadlineRequests: any[];
    isLoading: boolean;
    markAsRead: () => Promise<void>;
    markNotificationAsRead: (id: string) => Promise<void>;
    dismissNotification: (id: string) => Promise<void>;
    refreshData: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ currentUser: User | null, children: React.ReactNode }> = ({ currentUser, children }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [gameLogs, setGameLogs] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [deadlineRequests, setDeadlineRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Refs for memory management and sync
    const isInitialLoadRef = useRef(true);
    const lastUserRef = useRef<string | null>(null);

    // 1. Initial Fetch & Re-sync Logic
    const fetchAllData = useCallback(async (isSilent = false) => {
        if (!currentUser?.id) return;
        if (!isSilent) setIsLoading(true);

        try {
            // Fetch Notifications (Personal)
            const notifLimit = currentUser.role === 'ADMIN' ? 100 : 50;
            const { data: notifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(notifLimit); 

            // Fetch Game Logs (Scope based on Role)
            let logsQuery = supabase.from('game_logs').select('*');
            
            if (currentUser.role !== 'ADMIN') {
                logsQuery = logsQuery.eq('user_id', currentUser.id);
            }
            
            const logLimit = currentUser.role === 'ADMIN' ? 250 : 100;
            const { data: logs } = await logsQuery
                .order('created_at', { ascending: false })
                .limit(logLimit); 

            if (notifs) setNotifications(notifs);
            if (logs) setGameLogs(logs);

            // Fetch Leave Requests (if ADMIN)
            if (currentUser.role === 'ADMIN') {
                const [leavesRes, deadlinesRes] = await Promise.all([
                    supabase
                        .from('leave_requests')
                        .select(`*, profiles:profiles!leave_requests_user_id_fkey(full_name)`)
                        .eq('status', 'PENDING'),
                    supabase
                        .from('task_deadline_requests')
                        .select(`
                            id, task_id, requested_by, new_deadline, reason, status, created_at,
                            profiles:requested_by (full_name, avatar_url),
                            tasks:task_id (title)
                        `)
                        .eq('status', 'PENDING')
                        .order('created_at', { ascending: false })
                ]);
                
                if (leavesRes.data) setLeaveRequests(leavesRes.data);
                if (deadlinesRes.data) {
                    const mappedDeadlines = deadlinesRes.data.map(req => {
                        const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                        const task = Array.isArray(req.tasks) ? req.tasks[0] : req.tasks;
                        return {
                            ...req,
                            taskId: req.task_id, // Add CamelCase mapping
                            newDeadline: new Date(req.new_deadline),
                            createdAt: new Date(req.created_at),
                            user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined,
                            taskTitle: task?.title
                        };
                    });
                    setDeadlineRequests(mappedDeadlines);
                }
            }
            
        } catch (err) {
            console.error("NotificationProvider Fetch Error:", err);
        } finally {
            setIsLoading(false);
            isInitialLoadRef.current = false;
        }
    }, [currentUser?.id, currentUser?.role]);

    // 2. Real-time Subscription Logic
    useEffect(() => {
        if (!currentUser?.id) return;

        // Only fetch if user changed or it's the first time
        if (lastUserRef.current !== currentUser.id) {
            lastUserRef.current = currentUser.id;
            isInitialLoadRef.current = true;
            fetchAllData();
        }

        const isAdmin = currentUser.role === 'ADMIN';

        // Single Channel for all real-time updates
        const channel = supabase
            .channel(`notification-hub-${currentUser.id}`)
            // Listen to Notifications (Always personal)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'notifications', 
                filter: `user_id=eq.${currentUser.id}` 
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setNotifications(prev => [payload.new, ...prev].slice(0, 50));
                } else if (payload.eventType === 'UPDATE') {
                    setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
                } else if (payload.eventType === 'DELETE') {
                    setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                }
            })
            // Listen to Game Logs (Scope based on Role)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'game_logs',
                filter: isAdmin ? undefined : `user_id=eq.${currentUser.id}`
            }, (payload) => {
                setGameLogs(prev => {
                    if (prev.some(l => l.id === payload.new.id)) return prev;
                    return [payload.new, ...prev].slice(0, 100);
                });
            });

        // Add Leave Requests and Deadline Requests listener for Admins
        if (isAdmin) {
            channel.on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'leave_requests' 
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    // Re-fetch only the new one to get the join data (profiles)
                    supabase
                        .from('leave_requests')
                        .select(`*, profiles:profiles!leave_requests_user_id_fkey(full_name)`)
                        .eq('id', payload.new.id)
                        .single()
                        .then(({ data }) => {
                            if (data && data.status === 'PENDING') {
                                setLeaveRequests(prev => [data, ...prev]);
                            }
                        });
                } else if (payload.eventType === 'UPDATE') {
                    if (payload.new.status !== 'PENDING') {
                        setLeaveRequests(prev => prev.filter(r => r.id !== payload.new.id));
                    } else {
                        // Update existing or fetch if not in list
                        setLeaveRequests(prev => {
                            if (prev.some(r => r.id === payload.new.id)) {
                                return prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r);
                            }
                            return prev;
                        });
                    }
                } else if (payload.eventType === 'DELETE') {
                    setLeaveRequests(prev => prev.filter(r => r.id !== payload.old.id));
                }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'task_deadline_requests'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    supabase
                        .from('task_deadline_requests')
                        .select(`
                            id, task_id, requested_by, new_deadline, reason, status, created_at,
                            profiles:requested_by (full_name, avatar_url),
                            tasks:task_id (title)
                        `)
                        .eq('id', payload.new.id)
                        .single()
                        .then(({ data }) => {
                            if (data && data.status === 'PENDING') {
                                const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
                                const task = Array.isArray(data.tasks) ? data.tasks[0] : data.tasks;
                                const mapped = {
                                    ...data,
                                    taskId: data.task_id, // Add CamelCase mapping
                                    newDeadline: new Date(data.new_deadline),
                                    createdAt: new Date(data.created_at),
                                    user: profile ? { name: profile.full_name, avatarUrl: profile.avatar_url } : undefined,
                                    taskTitle: task?.title
                                };
                                setDeadlineRequests(prev => [mapped, ...prev]);
                            }
                        });
                } else if (payload.eventType === 'UPDATE') {
                    if (payload.new.status !== 'PENDING') {
                        setDeadlineRequests(prev => prev.filter(r => r.id !== payload.new.id));
                    } else {
                        setDeadlineRequests(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
                    }
                } else if (payload.eventType === 'DELETE') {
                    setDeadlineRequests(prev => prev.filter(r => r.id !== payload.old.id));
                }
            });
        }

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                if (isInitialLoadRef.current) {
                    isInitialLoadRef.current = false;
                } else {
                    // Silent re-sync on reconnect
                    fetchAllData(true);
                }
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id, currentUser?.role, fetchAllData]);

    // Polling Fallback specifically for Admins to sync deadline & leave requests from database silently in background
    useEffect(() => {
        if (!currentUser?.id || currentUser.role !== 'ADMIN') return;
        
        const interval = setInterval(() => {
            fetchAllData(true); // Silent re-sync without displaying the blocking loading spinner
        }, 15000); 
        
        return () => clearInterval(interval);
    }, [currentUser?.id, currentUser?.role, fetchAllData]);

    // 3. Actions
    const markAsRead = async () => {
        if (!currentUser) return;
        const now = new Date().toISOString();
        
        // Optimistic Update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        try {
            await Promise.all([
                supabase.from('profiles').update({ last_read_notification_at: now }).eq('id', currentUser.id),
                supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false)
            ]);
        } catch (err) {
            console.error("Mark as read error:", err);
        }
    };

    const markNotificationAsRead = async (id: string) => {
        if (!currentUser) return;
        
        // Robust localStorage cache fallback
        try {
            const acknowledgedIds = JSON.parse(localStorage.getItem('acknowledged_notification_ids') || '[]');
            if (!acknowledgedIds.includes(id)) {
                acknowledgedIds.push(id);
                localStorage.setItem('acknowledged_notification_ids', JSON.stringify(acknowledgedIds));
            }
        } catch (e) {
            console.warn("Failed to save acknowledged notification to localStorage:", e);
        }

        // Optimistic Update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        } catch (err) {
            console.error("Mark notification as read error:", err);
        }
    };

    const dismissNotification = async (id: string) => {
        // Optimistically remove from local state
        if (id.startsWith('leave_')) {
            const leaveId = id.replace('leave_', '');
            setLeaveRequests(prev => prev.filter(r => r.id !== leaveId));
        } else if (id.startsWith('deadline_')) {
            const deadlineId = id.replace('deadline_', '');
            setDeadlineRequests(prev => prev.filter(r => r.id !== deadlineId));
        } else {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }

        // Persistent removal (only for DB-stored notifications)
        if (!id.includes('_')) { 
            const { error } = await supabase.from('notifications').delete().eq('id', id);
            if (error) {
                console.error("dismissNotification DB Error:", error);
                // Re-add to local state if DB deletion failed? Optional but safer for UI consistency
                // setNotifications(prev => [itemToRemove, ...prev]);
            } else {
                console.log(`[NotificationContext] Notification ${id} deleted from DB`);
            }
        }
    };

    const value = useMemo(() => ({ 
        notifications, 
        gameLogs, 
        leaveRequests,
        deadlineRequests,
        isLoading, 
        markAsRead, 
        markNotificationAsRead,
        dismissNotification,
        refreshData: () => fetchAllData(true)
    }), [notifications, gameLogs, leaveRequests, deadlineRequests, isLoading, markAsRead, markNotificationAsRead, dismissNotification, fetchAllData]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};

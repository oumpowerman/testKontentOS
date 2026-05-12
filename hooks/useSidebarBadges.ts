
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { format } from 'date-fns';

export interface SidebarBadges {
    qualityGate: number;
    feedback: number;
    memberApproval: number;
    myDuty: number;
    attendanceApproval: number;
    financeTrip: number; // NEW: Finance Trip Badge
}

export const useSidebarBadges = (currentUser: User) => {
    const [badges, setBadges] = useState<SidebarBadges>({
        qualityGate: 0,
        feedback: 0,
        memberApproval: 0,
        myDuty: 0,
        attendanceApproval: 0,
        financeTrip: 0 // Init
    });

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchBadges = useCallback(async () => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'ADMIN';
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        try {
            // 1. Quality Gate Logic (Pending Reviews)
            // Users only need qg if they are involved or admin
            let qgCount = 0;
            const { data: qgData } = await supabase
                .from('task_reviews')
                .select('id, task:tasks(assignee_ids), content:contents(assignee_ids, idea_owner_ids, editor_ids)', { count: 'exact', head: false })
                .eq('status', 'PENDING');
            
            if (qgData) {
                if (isAdmin) {
                    qgCount = qgData.length;
                } else {
                    qgCount = qgData.filter((r: any) => {
                         const t = r.task;
                         const c = r.content;
                         return (t?.assignee_ids || []).includes(currentUser.id) || 
                                (c?.assignee_ids || []).includes(currentUser.id) || 
                                (c?.idea_owner_ids || []).includes(currentUser.id) ||
                                (c?.editor_ids || []).includes(currentUser.id);
                    }).length;
                }
            }

            // 2. Feedback Logic (Admin Only)
            let fbCount = 0;
            if (isAdmin) {
                const { count } = await supabase
                    .from('feedbacks')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING');
                fbCount = count || 0;
            }

            // 3. Member Approval (Admin Only)
            let maCount = 0;
            if (isAdmin) {
                const { count } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_approved', false);
                maCount = count || 0;
            }

            // 4. My Duty (Personal)
            const { count: dutyCount } = await supabase.from('duties')
                .select('id', { count: 'exact', head: true })
                .eq('assignee_id', currentUser.id)
                .eq('date', todayStr)
                .eq('is_done', false);

            // 5. Attendance Approval (Admin Only)
            let leaveCount = 0;
            if (isAdmin) {
                const { count } = await supabase
                    .from('leave_requests')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING');
                leaveCount = count || 0;
            }

            // 6. Finance Trip Detection (Admin Only)
            let tripCount = 0;
            if (isAdmin) {
                const { data: unlinkedData } = await supabase
                    .from('contents')
                    .select('shoot_date, shoot_location')
                    .is('shoot_trip_id', null)
                    .not('shoot_date', 'is', null)
                    .not('shoot_location', 'is', null);
                
                if (unlinkedData) {
                    const groups = new Set<string>();
                    unlinkedData.forEach((c: any) => {
                        const date = c.shoot_date ? c.shoot_date.split('T')[0] : '';
                        const loc = c.shoot_location ? c.shoot_location.trim().toLowerCase() : '';
                        if (date && loc) {
                            groups.add(`${date}_${loc}`);
                        }
                    });
                    tripCount = groups.size;
                }
            }

            setBadges({
                qualityGate: qgCount,
                feedback: fbCount,
                memberApproval: maCount,
                myDuty: dutyCount || 0,
                attendanceApproval: leaveCount,
                financeTrip: tripCount
            });

        } catch (err) {
            console.error("Error fetching sidebar badges:", err);
        }
    }, [currentUser, currentUser?.role, currentUser?.id]);

    const debouncedRefresh = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            fetchBadges();
        }, 2000); // 2 seconds debounce
    }, [fetchBadges]);

    // Realtime Subscriptions
    useEffect(() => {
        fetchBadges();
        const isAdmin = currentUser.role === 'ADMIN';

        // Base Channel for common events
        const channel = supabase.channel(`sidebar-badges-${currentUser.id}`)
            // Shared: Task Reviews (everyone needs to know if their task needs review)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, debouncedRefresh)
            // Shared: Duties (Filtered to CURRENT USER only to prevent mass noise)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'duties',
                filter: `assignee_id=eq.${currentUser.id}` 
            }, debouncedRefresh);
        
        // Admin-Only Channels: Separate noise for regular users
        if (isAdmin) {
            channel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, debouncedRefresh)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedRefresh)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, debouncedRefresh)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, debouncedRefresh)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'shoot_trips' }, debouncedRefresh);
        }

        channel.subscribe();

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            supabase.removeChannel(channel);
        };
    }, [currentUser.id, currentUser.role, debouncedRefresh, fetchBadges]);

    return { badges };
};

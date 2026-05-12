import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, ViewMode } from '../types';
import NotificationPill from './NotificationPill';
import { format, subDays } from 'date-fns';

interface SidebarBadgeProps {
    view?: ViewMode;
    currentUser: User;
    collapsed?: boolean;
    count?: number; // Manual override
}

const SidebarBadge: React.FC<SidebarBadgeProps> = ({ view, currentUser, collapsed, count: manualCount }) => {
    const [internalCount, setInternalCount] = useState(0);
    const isAdmin = currentUser.role === 'ADMIN';

    const displayCount = manualCount !== undefined ? manualCount : internalCount;

    useEffect(() => {
        // If manual count is provided, we don't need to fetch
        if (manualCount !== undefined) return;
        if (!view) return;

        const fetchCount = async () => {
            if (!currentUser) return;
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            try {
                switch (view) {
                    case 'QUALITY_GATE': {
                        const { data } = await supabase
                            .from('task_reviews')
                            .select('id, task:tasks(assignee_ids), content:contents(assignee_ids, idea_owner_ids, editor_ids)')
                            .eq('status', 'PENDING');
                        
                        if (data) {
                            if (isAdmin) {
                                setInternalCount(data.length);
                            } else {
                                const filtered = data.filter((r: any) => {
                                    const t = r.task;
                                    const c = r.content;
                                    return (t?.assignee_ids || []).includes(currentUser.id) || 
                                           (c?.assignee_ids || []).includes(currentUser.id) || 
                                           (c?.idea_owner_ids || []).includes(currentUser.id) ||
                                           (c?.editor_ids || []).includes(currentUser.id);
                                });
                                setInternalCount(filtered.length);
                            }
                        }
                        break;
                    }
                    case 'FEEDBACK': {
                        if (isAdmin) {
                            const { count: fbCount } = await supabase
                                .from('feedbacks')
                                .select('id', { count: 'exact', head: true })
                                .eq('status', 'PENDING');
                            setInternalCount(fbCount || 0);
                        }
                        break;
                    }
                    case 'TEAM': {
                        if (isAdmin) {
                            const { count: maCount } = await supabase
                                .from('profiles')
                                .select('id', { count: 'exact', head: true })
                                .eq('is_approved', false);
                            setInternalCount(maCount || 0);
                        }
                        break;
                    }
                    case 'DUTY': {
                        const { count: dutyCount } = await supabase
                            .from('duties')
                            .select('id', { count: 'exact', head: true })
                            .eq('assignee_id', currentUser.id)
                            .eq('date', todayStr)
                            .eq('is_done', false);
                        setInternalCount(dutyCount || 0);
                        break;
                    }
                    case 'ATTENDANCE': {
                        if (isAdmin) {
                            const { count: leaveCount } = await supabase
                                .from('leave_requests')
                                .select('id', { count: 'exact', head: true })
                                .eq('status', 'PENDING');
                            setInternalCount(leaveCount || 0);
                        }
                        break;
                    }
                    case 'FINANCE': {
                        if (isAdmin) {
                             const { data: unlinkedData } = await supabase
                                .from('contents')
                                .select('shoot_date, shoot_location')
                                .is('shoot_trip_id', null)
                                .not('shoot_date', 'is', null)
                                .not('shoot_location', 'is', null);
                             
                             if (unlinkedData) {
                                 const groups = new Set();
                                 unlinkedData.forEach((c: any) => {
                                     const date = c.shoot_date?.split('T')[0];
                                     const loc = c.shoot_location?.trim().toLowerCase();
                                     if (date && loc) groups.add(`${date}_${loc}`);
                                 });
                                 setInternalCount(groups.size);
                             }
                        }
                        break;
                    }
                    case 'DASHBOARD': {
                        const { count: overdueCount } = await supabase
                            .from('tasks')
                            .select('id', { count: 'exact', head: true })
                            .contains('assignee_ids', [currentUser.id])
                            .lt('end_date', todayStr)
                            .not('status', 'eq', 'COMPLETED');
                        setInternalCount(overdueCount || 0);
                        break;
                    }
                    case 'KPI': {
                        if (isAdmin) {
                            const monthKey = format(new Date(), 'yyyy-MM');
                            const { count: kpiCount } = await supabase
                                .from('kpi_records')
                                .select('id', { count: 'exact', head: true })
                                .eq('month_key', monthKey)
                                .eq('status', 'PENDING');
                            setInternalCount(kpiCount || 0);
                        }
                        break;
                    }
                    case 'WIKI': {
                        const threshold = subDays(new Date(), 2).toISOString();
                        const { count: wikiCount } = await supabase
                            .from('wiki_articles')
                            .select('id', { count: 'exact', head: true })
                            .gt('updated_at', threshold);
                        setInternalCount(wikiCount || 0);
                        break;
                    }
                    case 'CHAT': {
                        // 1. Get last read time from DB (Source of Truth)
                        const lastRead = currentUser.lastReadChatAt || new Date(0);
            
                        // 2. Count messages created AFTER last read
                        const { count, error } = await supabase
                            .from('team_messages')
                            .select('*', { count: 'exact', head: true })
                            .gt('created_at', lastRead.toISOString())
                            .neq('user_id', currentUser.id); // Don't count own messages
            
                        if (!error) {
                            setInternalCount(count || 0);
                        }
                        break;
                    }
                    default:
                        setInternalCount(0);
                }
            } catch (err) {
                console.error(`Error fetching badge for ${view}:`, err);
            }
        };

        fetchCount();

        // Setup Real-time based on view
        const tables: string[] = [];
        if (view) {
            switch (view) {
                case 'QUALITY_GATE': tables.push('task_reviews'); break;
                case 'FEEDBACK': tables.push('feedbacks'); break;
                case 'TEAM': tables.push('profiles'); break;
                case 'DUTY': tables.push('duties'); break;
                case 'ATTENDANCE': tables.push('leave_requests'); break;
                case 'FINANCE': tables.push('contents'); break;
                case 'DASHBOARD': tables.push('tasks'); break;
                case 'KPI': tables.push('kpi_records'); break;
                case 'WIKI': tables.push('wiki_articles'); break;
                case 'CHAT': tables.push('team_messages'); break;
            }
        }

        if (tables.length > 0) {
            const channels = tables.map(table => {
                return supabase.channel(`badge-${view}-${table}-${currentUser.id}`)
                    .on('postgres_changes', { event: '*', schema: 'public', table }, fetchCount)
                    .subscribe();
            });
            
            return () => { 
                channels.forEach(ch => supabase.removeChannel(ch));
            };
        }
    }, [view, currentUser.id, isAdmin, manualCount]);

    useEffect(() => {
        const handleRead = () => {
            if (view === 'CHAT') setInternalCount(0);
        };
        window.addEventListener('juijui-chat-read', handleRead);
        return () => window.removeEventListener('juijui-chat-read', handleRead);
    }, [view]);

    if (displayCount === 0) return null;

    let colorClass = undefined;
    if (view === 'DASHBOARD') colorClass = 'bg-red-500';
    if (view === 'WIKI') colorClass = 'bg-emerald-500';

    return <NotificationPill count={displayCount} collapsed={collapsed} className={colorClass} />;
};

export default SidebarBadge;

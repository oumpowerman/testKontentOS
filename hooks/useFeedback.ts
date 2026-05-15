
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FeedbackItem, FeedbackType, FeedbackStatus, User, FeedbackComment } from '../types';
import { useToast } from '../context/ToastContext';

export const useFeedback = (currentUser: User) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({ shoutouts: 0, ideas: 0, totalEngagement: 0 });
    const { showToast } = useToast();

    const fetchFeedbacks = async (options: {
        page?: number;
        limit?: number;
        status?: FeedbackStatus | 'PENDING_REJECTED';
        type?: FeedbackType | 'ALL';
        search?: string;
        sort?: 'NEWEST' | 'OLDEST' | 'VOTES';
    } = {}) => {
        const { 
            page = 1, 
            limit = 6, 
            status = 'APPROVED', 
            type = 'ALL', 
            search = '', 
            sort = 'NEWEST' 
        } = options;

        setIsLoading(true);
        
        try {
            // 1. Fetch Stats (Parallel for performance)
            const [pendingRes, shoutoutRes, ideaRes, engagementRes] = await Promise.all([
                supabase.from('feedbacks').select('*', { count: 'exact', head: true }).or('status.eq.PENDING,status.eq.REJECTED'),
                supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED').eq('type', 'SHOUTOUT'),
                supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED').eq('type', 'IDEA'),
                supabase.from('feedbacks').select('id').eq('status', 'APPROVED') // We'll estimate engagement or skip for now if too heavy
            ]);
            
            setPendingCount(pendingRes.count || 0);
            setStats(prev => ({
                ...prev,
                shoutouts: shoutoutRes.count || 0,
                ideas: ideaRes.count || 0
            }));

            // 2. Build Base Query
            let query = supabase
                .from('feedbacks')
                .select(`
                    *,
                    profiles!user_id (full_name, avatar_url),
                    feedback_votes (user_id),
                    feedback_comments (id),
                    feedback_reposts (user_id)
                `, { count: 'exact' });

            // 3. Filters
            if (status === 'PENDING_REJECTED') {
                query = query.or('status.eq.PENDING,status.eq.REJECTED');
            } else {
                query = query.eq('status', status);
            }

            if (type !== 'ALL') {
                query = query.eq('type', type);
            }

            if (search) {
                query = query.ilike('content', `%${search}%`);
            }

            // 4. Sorting
            if (sort === 'VOTES') {
                // Since vote_count is not a native column, we'd ideally sort by it.
                // If it's not a column, we have to sort locally or use a view/function.
                // For now, let's sort by created_at first, then we might have to do some magic if we want server-side vote sorting.
                // Most Enterprise setups have a cached count.
                query = query.order('created_at', { ascending: false });
            } else if (sort === 'OLDEST') {
                query = query.order('created_at', { ascending: true });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // 5. Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            if (data) {
                const mapped: FeedbackItem[] = data.map((item: any) => {
                    const votes = item.feedback_votes || [];
                    const comments = item.feedback_comments || [];
                    const reposts = item.feedback_reposts || [];
                    
                    const hasVoted = votes.some((v: any) => v.user_id === currentUser.id);
                    const hasReposted = reposts.some((r: any) => r.user_id === currentUser.id);
                    
                    return {
                        id: item.id,
                        type: item.type as FeedbackType,
                        content: item.content,
                        status: item.status as FeedbackStatus,
                        isAnonymous: item.is_anonymous,
                        createdAt: new Date(item.created_at),
                        voteCount: votes.length,
                        hasVoted: hasVoted,
                        commentCount: comments.length,
                        repostCount: reposts.length,
                        hasReposted: hasReposted,
                        targetUserId: item.target_user_id,
                        creatorName: !item.is_anonymous && item.profiles ? item.profiles.full_name : undefined,
                        creatorAvatar: !item.is_anonymous && item.profiles ? item.profiles.avatar_url : undefined
                    };
                });

                // Extra step for Sorting by Votes if sort === 'VOTES' (since it's manual)
                // Note: Server-side sorting by a calculated count is better via a DB View,
                // but let's stick to this for now if we can't change DB.
                let finalData = mapped;
                if (sort === 'VOTES') {
                    finalData = [...mapped].sort((a, b) => b.voteCount - a.voteCount);
                }

                setFeedbacks(finalData);
                setTotalCount(count || 0);
            }
        } catch (err: any) {
            console.error('Fetch feedback failed:', err);
            showToast('ดึงข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // We still want realtime for the current context
    // In an Enterprise setup, usually we use React Query for this.
    // For now, let's provide fetchFeedbacks and let the view call it.
    
    // We can still listen for changes to trigger a refresh of the count or current page
    useEffect(() => {
        const channel = supabase.channel('realtime-feedbacks-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, () => {
                // Silent refresh counts? 
                // We'll let the component decide when to re-fetch based on interactions
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const submitFeedback = async (content: string, type: FeedbackType, isAnonymous: boolean, targetUserId?: string) => {
        try {
            const payload = {
                content,
                type,
                is_anonymous: isAnonymous,
                user_id: currentUser.id,
                target_user_id: targetUserId,
                status: 'PENDING',
                vote_count: 0
            };

            const { error } = await supabase.from('feedbacks').insert(payload);
            if (error) throw error;

            // --- NOTIFY ADMINS ---
            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
            if (admins && admins.length > 0) {
                 const notifTitle = type === 'ISSUE' ? '🚨 รายงานปัญหา (Private)' : '💡 ความคิดเห็นใหม่';
                 const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'INFO',
                    title: notifTitle,
                    message: `${isAnonymous ? 'Anonymous' : currentUser.name}: ${content.substring(0, 50)}...`,
                    is_read: false,
                    link_path: 'FEEDBACK'
                }));
                await supabase.from('notifications').insert(notifications);
            }

            showToast('ส่งความคิดเห็นแล้ว! รอแอดมินตรวจสอบครับ 📨', 'success');
            return true;
        } catch (err: any) {
            showToast('ส่งไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const toggleVote = async (id: string, currentStatus: boolean) => {
        // 1. Optimistic Update (เปลี่ยนหน้าเว็บทันที)
        setFeedbacks(prev => prev.map(f => {
            if (f.id === id) {
                return {
                    ...f,
                    hasVoted: !currentStatus,
                    voteCount: currentStatus ? f.voteCount - 1 : f.voteCount + 1
                };
            }
            return f;
        }));

        try {
            if (currentStatus) {
                // UI says Voted -> Remove Vote
                const { error } = await supabase.from('feedback_votes').delete().eq('feedback_id', id).eq('user_id', currentUser.id);
                if (error) throw error;
            } else {
                // UI says Not Voted -> Add Vote
                const { error } = await supabase.from('feedback_votes').insert({ feedback_id: id, user_id: currentUser.id });
                
                // Handle Duplicate Key Error (Race Condition or Sync Issue)
                if (error) {
                    if (error.code === '23505') {
                        console.warn("Vote exists (Sync Issue), toggling OFF instead.");
                        // If insert fails because it exists, perform DELETE instead
                        await supabase.from('feedback_votes').delete().eq('feedback_id', id).eq('user_id', currentUser.id);
                        
                        // Force refresh to correct the count if optimistic update was wrong direction
                        fetchFeedbacks(); 
                    } else {
                        throw error;
                    }
                }
            }
        } catch (err: any) {
            console.error('Toggle vote error:', err);
            // Revert optimistic update on error (Rollback)
            setFeedbacks(prev => prev.map(f => {
                if (f.id === id) {
                    return {
                        ...f,
                        hasVoted: currentStatus, // Revert to original
                        voteCount: currentStatus ? f.voteCount + 1 : f.voteCount - 1 // Revert count
                    };
                }
                return f;
            }));
            showToast('ทำรายการไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateStatus = async (id: string, status: FeedbackStatus) => {
        // 1. Optimistic Update
        const previousFeedbacks = [...feedbacks];
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));

        try {
            const { error } = await supabase.from('feedbacks').update({ status }).eq('id', id);
            if (error) throw error;
            
            showToast(`อัปเดตสถานะเป็น ${status} แล้ว`, 'success');
        } catch (err: any) {
            console.error('Update status failed:', err);
            setFeedbacks(previousFeedbacks); // Rollback
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteFeedback = async (id: string) => {
        // 1. Optimistic Delete
        const previousFeedbacks = [...feedbacks];
        setFeedbacks(prev => prev.filter(f => f.id !== id));

        try {
            const { error } = await supabase.from('feedbacks').delete().eq('id', id);
            if (error) throw error;
            
            showToast('ลบเรียบร้อย', 'info');
        } catch (err: any) {
            console.error('Delete feedback failed:', err);
            setFeedbacks(previousFeedbacks); // Rollback
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const fetchComments = async (feedbackId: string): Promise<FeedbackComment[]> => {
        try {
            const { data, error } = await supabase
                .from('feedback_comments')
                .select(`
                    *,
                    profiles!user_id (full_name, avatar_url)
                `)
                .eq('feedback_id', feedbackId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return (data || []).map((c: any) => ({
                id: c.id,
                feedbackId: c.feedback_id,
                userId: c.user_id,
                content: c.content,
                createdAt: new Date(c.created_at),
                user: c.profiles ? { name: c.profiles.full_name, avatarUrl: c.profiles.avatar_url } : undefined
            }));
        } catch (err) {
            console.error('Fetch comments failed:', err);
            return [];
        }
    };

    const submitComment = async (feedbackId: string, content: string) => {
        try {
            const { error } = await supabase.from('feedback_comments').insert({
                feedback_id: feedbackId,
                user_id: currentUser.id,
                content
            });

            if (error) throw error;
            showToast('ส่งคอมเมนต์แล้ว!', 'success');
            return true;
        } catch (err: any) {
            showToast('ส่งคอมเมนต์ไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const toggleRepost = async (id: string, currentStatus: boolean) => {
        // Optimistic
        setFeedbacks(prev => prev.map(f => {
            if (f.id === id) {
                return {
                    ...f,
                    hasReposted: !currentStatus,
                    repostCount: currentStatus ? f.repostCount - 1 : f.repostCount + 1
                };
            }
            return f;
        }));

        try {
            if (currentStatus) {
                await supabase.from('feedback_reposts').delete().eq('feedback_id', id).eq('user_id', currentUser.id);
            } else {
                await supabase.from('feedback_reposts').insert({ feedback_id: id, user_id: currentUser.id });
            }
        } catch (err) {
            console.error('Toggle repost failed:', err);
            fetchFeedbacks(); // Revert
        }
    };

    return {
        feedbacks,
        totalCount,
        pendingCount,
        stats,
        isLoading,
        submitFeedback,
        toggleVote,
        updateStatus,
        deleteFeedback,
        fetchComments,
        submitComment,
        toggleRepost,
        fetchFeedbacks
    };
};

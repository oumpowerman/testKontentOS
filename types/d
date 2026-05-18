
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Goal, User } from '../types';
import { useToast } from '../context/ToastContext';

export const useGoals = (currentUser: User) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchGoals = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('goals')
                .select(`
                    *,
                    goal_owners (user_id),
                    goal_boosts (user_id)
                `)
                .eq('is_archived', false)
                .order('deadline', { ascending: true });

            if (error) throw error;

            if (data) {
                setGoals(data.map((g: any) => ({
                    id: g.id,
                    title: g.title,
                    platform: g.platform,
                    currentValue: g.current_value,
                    targetValue: g.target_value,
                    deadline: new Date(g.deadline),
                    channelId: g.channel_id,
                    isArchived: g.is_archived,
                    rewardXp: g.reward_xp || 500,
                    rewardCoin: g.reward_coin || 100,
                    isRedeemed: g.is_redeemed || false,
                    extensionCount: g.extension_count || 0,
                    owners: g.goal_owners?.map((o: any) => o.user_id) || [],
                    boosts: g.goal_boosts?.map((b: any) => b.user_id) || []
                })));
            }
        } catch (err: any) {
            console.error('Fetch goals error:', err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime Subscription
    useEffect(() => {
        fetchGoals();

        const channel = supabase
            .channel('realtime-goals')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goals' },
                () => fetchGoals()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goal_owners' },
                () => fetchGoals()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'goal_boosts' },
                () => fetchGoals()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addGoal = async (goal: Omit<Goal, 'id' | 'owners' | 'boosts'>) => {
        try {
            const payload = {
                title: goal.title,
                platform: goal.platform,
                current_value: goal.currentValue,
                target_value: goal.targetValue,
                deadline: goal.deadline.toISOString(),
                channel_id: goal.channelId || null,
                is_archived: false,
                reward_xp: goal.rewardXp,
                reward_coin: goal.rewardCoin
            };

            const { data, error } = await supabase.from('goals').insert(payload).select().single();
            if (error) throw error;
            
            showToast('สร้างเป้าหมายใหม่สำเร็จ 🎯', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + (err.message || 'Unknown error'), 'error');
        }
    };

    // NEW: Full Update Function
    const updateGoal = async (goal: Goal) => {
        try {
            const payload = {
                title: goal.title,
                platform: goal.platform,
                current_value: goal.currentValue,
                target_value: goal.targetValue,
                deadline: goal.deadline.toISOString(),
                channel_id: goal.channelId || null,
                reward_xp: goal.rewardXp,
                reward_coin: goal.rewardCoin
            };

            const { error } = await supabase
                .from('goals')
                .update(payload)
                .eq('id', goal.id);

            if (error) throw error;

            // Optimistic Update
            setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
            showToast('แก้ไขเป้าหมายเรียบร้อย ✨', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateGoalValue = async (id: string, currentValue: number) => {
        try {
            const goal = goals.find(g => g.id === id);
            if (!goal) return;

            const wasCompleted = goal.currentValue >= goal.targetValue;
            const isNowCompleted = currentValue >= goal.targetValue;

            setGoals(prev => prev.map(g => g.id === id ? { ...g, currentValue } : g));
            await supabase.from('goals').update({ current_value: currentValue }).eq('id', id);
            
            // Auto-Reward Logic
            if (!wasCompleted && isNowCompleted && goal.owners.length > 0) {
                // Check if it was completed after deadline
                const now = new Date();
                const isLate = now > goal.deadline;
                
                // Reward Calculation Logic
                let multiplier = 1.0;
                if (isLate) {
                    multiplier = goal.isRedeemed ? 0.3 : 0.5; // If it's redeemed, 0.3. If just late, 0.5.
                }

                const finalXp = Math.round((goal.rewardXp || 0) * multiplier);
                const finalCoin = Math.round((goal.rewardCoin || 0) * multiplier);

                // Reward each owner
                for (const userId of goal.owners) {
                    const { data: profile } = await supabase.from('profiles').select('xp, coins').eq('id', userId).maybeSingle();
                    if (profile) {
                        await supabase.from('profiles').update({
                            xp: (profile.xp || 0) + finalXp,
                            coins: (profile.coins || 0) + finalCoin
                        }).eq('id', userId);
                    }
                }
                
                const rewardMessage = isLate 
                    ? `ภารกิจสำเร็จ (ล่าช้า: ได้รับรางวัลลดลง)! 🏆 +${finalXp} XP, +${finalCoin} Coins`
                    : `ยินดีด้วย! เป้าหมายสำเร็จและจ่ายรางวัลให้ทีมแล้ว 🏆 +${finalXp} XP, +${finalCoin} Coins`;
                
                showToast(rewardMessage, isLate ? 'info' : 'success');
            } else {
                showToast('อัปเดตยอดล่าสุดแล้ว! 📈', 'success');
            }
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    };

    const redeemGoal = async (id: string) => {
        try {
            const { error } = await supabase.from('goals').update({ is_redeemed: true }).eq('id', id);
            if (error) throw error;
            
            setGoals(prev => prev.map(g => g.id === id ? { ...g, isRedeemed: true } : g));
            showToast('ปลดล็อกคภารกิจเพื่อกู้หน้าคืน! (พยายามเข้า รางวัลจะลดลงเหลือ 30%) 🛡️', 'success');
        } catch (err: any) {
            showToast('ขอคืนชีพไม่สำเร็จ', 'error');
        }
    };

    const deleteGoal = async (id: string) => {
        // Confirm logic moved to UI component (GoalView)
        try {
            await supabase.from('goals').delete().eq('id', id);
            showToast('ลบเป้าหมายแล้ว', 'info');
        } catch(err: any) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    // --- New Features ---
    const toggleOwner = async (goalId: string, userId: string, isCurrentlyOwner: boolean) => {
        // Optimistic Update
        const previousGoals = [...goals];
        setGoals(prev => prev.map(g => {
            if (g.id === goalId) {
                const newOwners = isCurrentlyOwner 
                    ? g.owners.filter(uid => uid !== userId)
                    : [...g.owners, userId];
                return { ...g, owners: newOwners };
            }
            return g;
        }));

        try {
            if (isCurrentlyOwner) {
                // Remove
                const { error } = await supabase
                    .from('goal_owners')
                    .delete()
                    .eq('goal_id', goalId)
                    .eq('user_id', userId);
                if (error) throw error;
            } else {
                // Add
                const { error } = await supabase
                    .from('goal_owners')
                    .insert({ goal_id: goalId, user_id: userId });
                
                // Handle unique constraint if user somehow joins twice
                if (error && error.code !== '23505') throw error;
                
                if (!error) {
                    showToast('เข้าร่วมทีมสำเร็จ! 🤝', 'success');
                }
            }
        } catch (err: any) {
            console.error('Toggle owner error:', err);
            // Rollback on error
            setGoals(previousGoals);
            showToast('ไม่สามารถเปลี่ยนสถานะทีมได้ในขณะนี้', 'error');
        }
    };

    const toggleBoost = async (goalId: string, isCurrentlyBoosted: boolean) => {
        // Optimistic Update
        const previousGoals = [...goals];
        setGoals(prev => prev.map(g => {
            if (g.id === goalId) {
                const newBoosts = isCurrentlyBoosted 
                    ? g.boosts.filter(uid => uid !== currentUser.id)
                    : [...g.boosts, currentUser.id];
                return { ...g, boosts: newBoosts };
            }
            return g;
        }));

        try {
            if (isCurrentlyBoosted) {
                const { error } = await supabase
                    .from('goal_boosts')
                    .delete()
                    .eq('goal_id', goalId)
                    .eq('user_id', currentUser.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('goal_boosts')
                    .insert({ goal_id: goalId, user_id: currentUser.id });
                
                // If error is 23505 (unique constraint), it means it's already boosted, 
                // which is fine for a toggle that was intended to boost.
                if (error && error.code !== '23505') throw error;
                
                if (!error) {
                    showToast('ส่งพลังเชียร์แล้ว! 🔥', 'success');
                }
            }
        } catch (err: any) {
            console.error('Toggle boost error:', err);
            // Rollback on error
            setGoals(previousGoals);
            showToast('ไม่สามารถส่งพลังเชียร์ได้ในขณะนี้', 'error');
        }
    };

    const requestExtension = async (goalId: string, reason: string) => {
        try {
            // In a real app, this would create a record in goal_deadline_requests
            // For now, we will simulate by sending a notification to admins
            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
            if (admins && admins.length > 0) {
                 const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'APPROVAL_REQ',
                    title: '📅 คำขอขยายเวลาเป้าหมาย',
                    message: `ขอขยายเวลาเป้าหมาย ภารกิจ: ${reason}`,
                    related_id: goalId,
                    is_read: false,
                    link_path: 'GOALS'
                }));
                await supabase.from('notifications').insert(notifications);
            }
            showToast('ส่งคำขอขยายเวลาให้แอดมินแล้ว! 📨', 'success');
            return true;
        } catch (err: any) {
            showToast('ขอขยายเวลาไม่สำเร็จ', 'error');
            return false;
        }
    };

    return {
        goals,
        isLoading,
        addGoal,
        updateGoal, // Exported
        updateGoalValue,
        deleteGoal,
        toggleOwner,
        toggleBoost,
        redeemGoal,
        requestExtension,
        refreshGoals: fetchGoals
    };
};

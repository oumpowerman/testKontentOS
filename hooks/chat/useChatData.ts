
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChatMessage, User } from '../../types';

const PAGE_SIZE = 20;

export const useChatData = (currentUser: User | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const mapMessage = (data: any): ChatMessage => ({
        id: data.id,
        createdAt: new Date(data.created_at),
        content: data.content,
        userId: data.user_id,
        isBot: data.is_bot,
        messageType: data.message_type || 'TEXT',
        user: data.profiles ? {
            id: data.profiles.id,
            name: data.profiles.full_name,
            avatarUrl: data.profiles.avatar_url,
            role: data.profiles.role,
            position: data.profiles.position,
            email: data.profiles.email,
            isApproved: true,
            isActive: true,
            xp: data.profiles.xp || 0,
            level: data.profiles.level || 1,
            availablePoints: data.profiles.available_points || 0,
            hp: data.profiles.hp || 100,
            maxHp: data.profiles.max_hp || 100,
            deathCount: data.profiles.death_count || 0,
            workStatus: data.profiles.work_status || 'ONLINE',
            status: data.profiles.status || 'ACTIVE'
        } : undefined
    });

    const fetchMessages = async (offset = 0) => {
        try {
            if (offset === 0) setIsLoading(true);
            else setIsLoadingMore(true);

            const { data, error } = await supabase
                .from('team_messages')
                .select(`*, profiles (id, full_name, avatar_url, role, position, email, xp, level, available_points, hp, max_hp, death_count, work_status, status)`)
                .order('created_at', { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            if (error) throw error;

            if (data) {
                const mappedMessages = data.map(mapMessage).reverse();
                if (offset === 0) {
                    setMessages(mappedMessages);
                } else {
                    setMessages(prev => [...mappedMessages, ...prev]);
                }
                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                }
            }
        } catch (err) {
            console.error('Fetch chat failed', err);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchMessages(messages.length);
        }
    };

    useEffect(() => {
        if (!currentUser?.id) return;

        // Use a shared channel name for all users to ensure consistent real-time updates
        const channel = supabase.channel('room:team-chat')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'team_messages' 
            }, async (payload) => {
                // Fetch full message with profile to ensure we have all data for mapping
                const { data, error } = await supabase
                    .from('team_messages')
                    .select(`*, profiles (*)`)
                    .eq('id', payload.new.id)
                    .maybeSingle();
                
                if (data && !error) {
                    const newMessage = mapMessage(data);
                    setMessages(prev => {
                        // Prevent duplicates (especially for the sender who already has an optimistic update)
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            })
            .on('postgres_changes', { 
                event: 'DELETE', 
                schema: 'public', 
                table: 'team_messages' 
            }, (payload) => {
                setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            })
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'team_messages' 
            }, async (payload) => {
                const { data, error } = await supabase
                    .from('team_messages')
                    .select(`*, profiles (*)`)
                    .eq('id', payload.new.id)
                    .maybeSingle();
                
                if (data && !error) {
                    const updatedMessage = mapMessage(data);
                    setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to real-time chat');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id]);

    useEffect(() => { fetchMessages(0); }, []);

    return { messages, setMessages, isLoading, isLoadingMore, hasMore, loadMore, mapMessage };
};

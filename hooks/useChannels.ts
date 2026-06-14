
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Channel } from '../types';
import { useToast } from '../context/ToastContext';

export const useChannels = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const { showToast } = useToast();

    const fetchChannels = async () => {
        try {
            // Order by created_at to keep list stable
            const { data, error } = await supabase
                .from('channels')
                .select('*')
                .order('created_at', { ascending: true });
                
            if (error) throw error;
            if (data) {
                // Ensure platforms is an array
                setChannels(data.map((c:any) => ({
                    ...c,
                    platforms: Array.isArray(c.platforms) ? c.platforms : ['OTHER'],
                    logoUrl: c.logo_url // Map DB to Type
                })));
            }
        } catch (err) { console.error('Fetch channels failed', err); }
    };

    // Realtime Subscription
    useEffect(() => {
        // fetchChannels(); // Disable initial fetchChannels on mount - managed by useTaskManager

        const channel = supabase
            .channel('realtime-channels')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'channels' },
                () => {
                    fetchChannels();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAddChannel = async (channel: Channel, file?: File): Promise<boolean> => {
        try {
            const finalId = channel.id || crypto.randomUUID();
            let logoUrl = null;

            // 1. Upload Logo if present
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `channel-logo-${finalId}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                logoUrl = data.publicUrl;
            }
            
            const payload = {
                id: finalId,
                name: channel.name,
                description: channel.description || '', 
                color: channel.color,
                platforms: channel.platforms, 
                logo_url: logoUrl
            };

            const { error } = await supabase.from('channels').insert(payload);
            
            if (error) {
                console.error("Supabase Error (Insert Channel):", error);
                throw error;
            }
            await fetchChannels(); 
            showToast('เพิ่มแบรนด์ใหม่สำเร็จ 🎉', 'success');
            return true;
        } catch (dbError: any) {
            console.error(dbError);
            showToast('บันทึกไม่สำเร็จ: ' + (dbError.message || 'Unknown DB error'), 'error');
            return false;
        }
    };

    const handleUpdateChannel = async (updatedChannel: Channel, file?: File): Promise<boolean> => {
         try {
             let logoUrl = updatedChannel.logoUrl;

             // 1. Upload new logo if present
             if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `channel-logo-${updatedChannel.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                logoUrl = data.publicUrl;
             }

             const payload = {
                name: updatedChannel.name,
                description: updatedChannel.description || '',
                color: updatedChannel.color,
                platforms: updatedChannel.platforms,
                logo_url: logoUrl
            };

            const { error } = await supabase.from('channels').update(payload).eq('id', updatedChannel.id);
            
            if (error) throw error;
            await fetchChannels();
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (dbError: any) {
             console.error("Supabase Error (Update Channel):", dbError);
            showToast('อัปเดตไม่สำเร็จ: ' + (dbError.message || ''), 'error');
            return false;
        }
    };

    const handleDeleteChannel = async (channelId: string): Promise<boolean> => {
        try {
            const { error } = await supabase.from('channels').delete().eq('id', channelId);
            if (error) throw error;
            showToast('ลบแบรนด์สำเร็จ 🗑️', 'warning');
            return true;
        } catch (dbError) {
            showToast('ลบไม่สำเร็จ', 'error');
            return false;
        }
    };

    return {
        channels,
        fetchChannels,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel
    };
};

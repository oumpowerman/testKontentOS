
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MeetingLog, MeetingCategory } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { format, isValid } from 'date-fns';

export const useMeetings = () => {
    const [meetings, setMeetings] = useState<MeetingLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    // Helper to map DB object to MeetingLog type
    const mapMeeting = (m: any): MeetingLog => ({
        id: m.id,
        title: m.title,
        date: m.date ? new Date(m.date) : new Date(),
        startTime: m.start_time || '',
        endTime: m.end_time || '',
        content: m.content || '',
        sheets: m.sheets || [],
        decisions: m.decisions || '',
        category: (m.category as MeetingCategory) || 'GENERAL',
        attendees: m.attendees || [],
        attendance: m.attendance || {},
        tags: m.tags || [],
        agenda: m.agenda || [], 
        assets: m.assets || [],
        referenceMeetingId: m.reference_meeting_id || undefined,
        createdAt: new Date(m.created_at),
        updatedAt: new Date(m.updated_at),
        authorId: m.author_id
    });

    const fetchMeetings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('meeting_logs')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                setMeetings(data.map(mapMeeting));
            }
        } catch (err: any) {
            console.error('Fetch meetings failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
        const channel = supabase.channel('realtime-meetings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_logs' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMeetings(prev => {
                        if (prev.some(m => m.id === payload.new.id)) return prev;
                        return [mapMeeting(payload.new), ...prev].sort((a, b) => {
                            const dateA = new Date(a.date).getTime();
                            const dateB = new Date(b.date).getTime();
                            return dateB - dateA;
                        });
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setMeetings(prev => prev.map(m => m.id === payload.new.id ? mapMeeting(payload.new) : m));
                } else if (payload.eventType === 'DELETE') {
                    setMeetings(prev => prev.filter(m => m.id !== payload.old.id));
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const createMeeting = async (title: string, date: Date, userId: string, extra?: Partial<MeetingLog>) => {
        try {
            const dateStr = format(date, 'yyyy-MM-dd');

            const payload = {
                title,
                date: dateStr,
                start_time: extra?.startTime || '09:00',
                end_time: extra?.endTime || '10:00',
                content: extra?.content || '',
                decisions: extra?.decisions || '',
                author_id: userId,
                category: extra?.category || 'GENERAL',
                attendees: extra?.attendees || [],
                attendance: extra?.attendance || {},
                tags: extra?.tags || [],
                agenda: extra?.agenda || [],
                assets: extra?.assets || [],
                reference_meeting_id: extra?.referenceMeetingId || null
            };

            const { data, error } = await supabase.from('meeting_logs').insert(payload).select().single();
            if (error) throw error;
            
            if (data) {
                const newMeeting = mapMeeting(data);
                setMeetings(prev => [newMeeting, ...prev]);
            }

            showToast('สร้างห้องประชุมใหม่แล้ว 📝', 'success');
            return data.id;
        } catch (err: any) {
            showToast('สร้างไม่สำเร็จ: ' + err.message, 'error');
            return null;
        }
    };

    const updateMeeting = async (id: string, updates: Partial<MeetingLog>) => {
        try {
            const payload: any = {
                updated_at: new Date().toISOString()
            };
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.content !== undefined) payload.content = updates.content;
            if (updates.sheets !== undefined) payload.sheets = updates.sheets;
            if (updates.decisions !== undefined) payload.decisions = updates.decisions;
            if (updates.startTime !== undefined) payload.start_time = updates.startTime;
            if (updates.endTime !== undefined) payload.end_time = updates.endTime;
            if (updates.attendance !== undefined) payload.attendance = updates.attendance;
            
            // Fix Date update with validation
            if (updates.date) {
                const d = new Date(updates.date);
                if (isValid(d)) {
                    payload.date = format(d, 'yyyy-MM-dd');
                }
            }
            
            if (updates.attendees !== undefined) payload.attendees = updates.attendees;
            if (updates.tags !== undefined) payload.tags = updates.tags;
            if (updates.category !== undefined) payload.category = updates.category;
            if (updates.referenceMeetingId !== undefined) payload.reference_meeting_id = updates.referenceMeetingId;
            
            if (updates.agenda !== undefined) payload.agenda = updates.agenda;
            if (updates.assets !== undefined) payload.assets = updates.assets;

            const { error } = await supabase.from('meeting_logs').update(payload).eq('id', id);
            if (error) throw error;
            
            // Optimistic update
            setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));

        } catch (err: any) {
            console.error(err);
            showToast('บันทึกไม่สำเร็จ', 'error');
        }
    };

    const deleteMeeting = async (id: string) => {
        // Fix: Replaced native confirm with showConfirm
        const confirmed = await showConfirm('ยืนยันการลบบันทึกนี้ใช่หรือไม่?', 'ลบบันทึกการประชุม');
        if(!confirmed) return;
        try {
            const { error } = await supabase.from('meeting_logs').delete().eq('id', id);
            if (error) throw error;
            
            // Optimistic update
            setMeetings(prev => prev.filter(m => m.id !== id));
            showToast('ลบเรียบร้อย', 'info');
        } catch (err) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    return {
        meetings,
        isLoading,
        createMeeting,
        updateMeeting,
        deleteMeeting
    };
};

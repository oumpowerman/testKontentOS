
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { MeetingLog, MeetingCategory, User } from '../types';
import { useToast } from './ToastContext';
import { useGlobalDialog } from './GlobalDialogContext';
import { format, isValid, startOfMonth, endOfMonth } from 'date-fns';

interface MeetingContextType {
    meetings: MeetingLog[];
    historyMeetings: MeetingLog[];
    isLoading: boolean;
    isHistoryLoading: boolean;
    hasMore: boolean;
    historyHasMore: boolean;
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    fetchMeetingDetail: (id: string) => Promise<void>;
    loadMoreMeetings: () => Promise<void>;
    loadMoreHistory: () => Promise<void>;
    createMeeting: (title: string, date: Date, userId: string, extra?: Partial<MeetingLog>) => Promise<string | null>;
    updateMeeting: (id: string, updates: Partial<MeetingLog>) => Promise<void>;
    deleteMeeting: (id: string) => Promise<void>;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [meetings, setMeetings] = useState<MeetingLog[]>([]);
    const [historyMeetings, setHistoryMeetings] = useState<MeetingLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [historyHasMore, setHistoryHasMore] = useState(false);
    const [page, setPage] = useState(0);
    const [historyPage, setHistoryPage] = useState(0);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const PAGE_SIZE = 20;

    // Map DB to Type with Partial Support (Ensures robust CamelCase to SnakeCase mapping)
    const mapMeeting = useCallback((m: any): MeetingLog => ({
        id: m.id,
        title: m.title,
        date: m.date ? new Date(m.date) : new Date(),
        startTime: m.start_time || '',
        endTime: m.end_time || '',
        content: m.content, // Nullable if partial
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
        authorId: m.author_id,
        isPartial: m.content === undefined || m.content === null
    }), []);

    // Fetch Metadata list for a specific month with Pagination
    const fetchMeetingsByMonth = useCallback(async (targetDate: Date, currentPage: number) => {
        if (currentPage === 0) setIsLoading(true);
        try {
            const startStr = format(startOfMonth(targetDate), 'yyyy-MM-dd');
            const endStr = format(endOfMonth(targetDate), 'yyyy-MM-dd');

            // PARTIAL FETCH: Exclude heavy content fields initially
            const { data, error } = await supabase
                .from('meeting_logs')
                .select('id, title, date, start_time, end_time, category, attendees, attendance, tags, author_id, created_at, updated_at, reference_meeting_id')
                .gte('date', startStr)
                .lte('date', endStr)
                .order('date', { ascending: false })
                .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

            if (error) throw error;

            if (data) {
                const mapped = data.map(mapMeeting);
                if (currentPage === 0) {
                    setMeetings(mapped);
                } else {
                    setMeetings(prev => [...prev, ...mapped]);
                }
                setHasMore(data.length === PAGE_SIZE);
            }
        } catch (err: any) {
            console.error('Fetch meetings failed:', err);
            showToast('โหลดรายการประชุมไม่สำเร็จ', 'error');
        } finally {
            if (currentPage === 0) setIsLoading(false);
        }
    }, [mapMeeting, showToast]);

    // Load More helper for external calls
    const loadMoreMeetings = useCallback(async () => {
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchMeetingsByMonth(currentMonth, nextPage);
    }, [page, currentMonth, fetchMeetingsByMonth]);

    // Fetch Global History with Pagination (Ignores month, strictly past meetings)
    const fetchHistoryMeetings = useCallback(async (currentPage: number) => {
        if (currentPage === 0) setIsHistoryLoading(true);
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            
            const { data, error } = await supabase
                .from('meeting_logs')
                .select('id, title, date, start_time, end_time, category, attendees, attendance, tags, author_id, created_at, updated_at, reference_meeting_id')
                .lt('date', todayStr) // Only past meetings
                .order('date', { ascending: false })
                .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

            if (error) throw error;

            if (data) {
                const mapped = data.map(mapMeeting);
                if (currentPage === 0) {
                    setHistoryMeetings(mapped);
                } else {
                    setHistoryMeetings(prev => [...prev, ...mapped]);
                }
                setHistoryHasMore(data.length === PAGE_SIZE);
            }
        } catch (err: any) {
            console.error('Fetch history failed:', err);
        } finally {
            if (currentPage === 0) setIsHistoryLoading(false);
        }
    }, [mapMeeting]);

    const loadMoreHistory = useCallback(async () => {
        const nextPage = historyPage + 1;
        setHistoryPage(nextPage);
        await fetchHistoryMeetings(nextPage);
    }, [historyPage, fetchHistoryMeetings]);

    // Fetch Full Detail when needed
    const fetchMeetingDetail = useCallback(async (id: string) => {
        const existing = meetings.find(m => m.id === id);
        if (existing && !existing.isPartial) return; // Already have full data

        try {
            const { data, error } = await supabase
                .from('meeting_logs')
                .select('content, sheets, decisions, agenda, assets')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setMeetings(prev => prev.map(m => m.id === id ? { 
                    ...m, 
                    ...data, 
                    isPartial: false 
                } : m));
            }
        } catch (err) {
            console.error('Fetch meeting detail failed:', err);
        }
    }, [meetings]);

    useEffect(() => {
        setPage(0); // Reset page on month change
        fetchMeetingsByMonth(currentMonth, 0);

        // Initial history fetch
        if (historyMeetings.length === 0) {
            fetchHistoryMeetings(0);
        }
        
        // Real-time subscription (Context-based)
        const channel = supabase.channel('realtime-meetings-context')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_logs' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newMeetingDate = new Date(payload.new.date);
                    const isSameMonth = format(newMeetingDate, 'MM-yyyy') === format(currentMonth, 'MM-yyyy');
                    
                    if (isSameMonth) {
                        setMeetings(prev => {
                            if (prev.some(m => m.id === payload.new.id)) return prev;
                            return [mapMeeting(payload.new), ...prev].sort((a, b) => b.date.getTime() - a.date.getTime());
                        });
                    }
                } else if (payload.eventType === 'UPDATE') {
                    setMeetings(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...mapMeeting(payload.new), isPartial: m.isPartial } : m));
                } else if (payload.eventType === 'DELETE') {
                    setMeetings(prev => prev.filter(m => m.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentMonth, fetchMeetingsByMonth, mapMeeting]);

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
                const isSameMonth = format(date, 'MM-yyyy') === format(currentMonth, 'MM-yyyy');
                if (isSameMonth) {
                    setMeetings(prev => [newMeeting, ...prev]);
                }
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
            const payload: any = { updated_at: new Date().toISOString() };
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.content !== undefined) payload.content = updates.content;
            if (updates.sheets !== undefined) payload.sheets = updates.sheets;
            if (updates.decisions !== undefined) payload.decisions = updates.decisions;
            if (updates.startTime !== undefined) payload.start_time = updates.startTime;
            if (updates.endTime !== undefined) payload.end_time = updates.endTime;
            if (updates.attendance !== undefined) payload.attendance = updates.attendance;
            
            if (updates.date) {
                const d = new Date(updates.date);
                if (isValid(d)) payload.date = format(d, 'yyyy-MM-dd');
            }
            
            if (updates.attendees !== undefined) payload.attendees = updates.attendees;
            if (updates.tags !== undefined) payload.tags = updates.tags;
            if (updates.category !== undefined) payload.category = updates.category;
            if (updates.referenceMeetingId !== undefined) payload.reference_meeting_id = updates.referenceMeetingId;
            if (updates.agenda !== undefined) payload.agenda = updates.agenda;
            if (updates.assets !== undefined) payload.assets = updates.assets;

            const { error } = await supabase.from('meeting_logs').update(payload).eq('id', id);
            if (error) throw error;
            
            setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
        } catch (err: any) {
            console.error(err);
            showToast('บันทึกไม่สำเร็จ', 'error');
        }
    };

    const deleteMeeting = async (id: string) => {
        const confirmed = await showConfirm('ยืนยันการลบบันทึกนี้ใช่หรือไม่?', 'ลบบันทึกการประชุม');
        if(!confirmed) return;
        try {
            const { error } = await supabase.from('meeting_logs').delete().eq('id', id);
            if (error) throw error;
            setMeetings(prev => prev.filter(m => m.id !== id));
            showToast('ลบเรียบร้อย', 'info');
        } catch (err) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    const value = useMemo(() => ({
        meetings,
        historyMeetings,
        isLoading,
        isHistoryLoading,
        hasMore,
        historyHasMore,
        currentMonth,
        setCurrentMonth,
        fetchMeetingDetail,
        loadMoreMeetings,
        loadMoreHistory,
        createMeeting,
        updateMeeting,
        deleteMeeting
    }), [meetings, historyMeetings, isLoading, isHistoryLoading, hasMore, historyHasMore, currentMonth, fetchMeetingDetail, loadMoreMeetings, loadMoreHistory]);

    return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
};

export const useMeetingContext = () => {
    const context = useContext(MeetingContext);
    if (!context) throw new Error('useMeetingContext must be used within MeetingProvider');
    return context;
};

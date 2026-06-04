
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarHighlight } from '../types';
import { useToast } from '../context/ToastContext';
import { endOfMonth, format, addDays } from 'date-fns';
import { useMasterData } from './useMasterData';

export const useCalendarHighlights = (currentDate: Date) => {
    const [highlights, setHighlights] = useState<CalendarHighlight[]>([]);
    const { showToast } = useToast();
    const { annualHolidays } = useMasterData();
    const latestFetchId = useRef(0);

    const fetchHighlights = useCallback(async () => {
        const fetchId = ++latestFetchId.current;
        // Fetch a bit wider range to ensure smooth transition (prev/next month days)
        const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const start = format(addDays(startOfCurrentMonth, -7), 'yyyy-MM-dd');
        const end = format(addDays(endOfMonth(currentDate), 14), 'yyyy-MM-dd');

        try {
            // 1. Fetch Specific Overrides
            const { data: specificData, error: specificError } = await supabase
                .from('calendar_highlights')
                .select('*')
                .gte('date', start)
                .lte('date', end);

            if (specificError) throw specificError;

            // 2. Fetch Annual Holidays (All) - Now from Context
            const annualData = annualHolidays.filter(h => h.isActive);

            // 3. Merge Logic
            const combined: CalendarHighlight[] = [];
            const specificMap = new Map<string, boolean>();

            // Add Specific first
            if (specificData) {
                specificData.forEach((h: any) => {
                    const [yStr, mStr, dStr] = h.date.split('-');
                    const dLocal = new Date(Number(yStr), Number(mStr) - 1, Number(dStr));
                    combined.push({
                        id: h.id,
                        date: dLocal,
                        typeKey: h.type_key,
                        note: h.note
                    });
                    specificMap.set(h.date, true); // Key as 'YYYY-MM-DD'
                });
            }

            // Add Annuals (Expand to current view year)
            if (annualData) {
                const startObj = new Date(start);
                const endObj = new Date(end);
                // Determine relevant years (start year and end year)
                const years = new Set([startObj.getFullYear(), endObj.getFullYear()]);

                annualData.forEach((rule: any) => {
                    years.forEach(year => {
                        // Create date for this year
                        const d = new Date(year, rule.month - 1, rule.day);
                        // Fix JS Date overflow (e.g. Feb 30 -> Mar 2) if data is bad, but assume valid
                        
                        // Check if valid date for this month (e.g. leap year check for Feb 29)
                        if (d.getMonth() !== rule.month - 1) return; // Invalid date skipped

                        const dStr = format(d, 'yyyy-MM-dd');

                        // Only add if within view range AND NOT overridden by specific highlight
                        if (d >= startObj && d <= endObj && !specificMap.has(dStr)) {
                            combined.push({
                                id: `annual-${rule.id}-${year}`,
                                date: d,
                                typeKey: rule.typeKey,
                                note: rule.name
                            });
                        }
                    });
                });
            }

            if (fetchId === latestFetchId.current) {
                setHighlights(combined);
            }

        } catch (err) {
            console.error('Fetch highlights error:', err);
        }
    }, [currentDate, annualHolidays]);

    // Set up Realtime subscription (Optimized)
    useEffect(() => {
        fetchHighlights();

        const channel = supabase
            .channel('realtime-calendar-highlights-v2')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_highlights' }, () => fetchHighlights())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchHighlights]);

    const setHighlight = async (date: Date, typeKey: string, note?: string) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Optimistic UI Update
        setHighlights(prev => {
            // Remove existing highlight for this date if any
            const others = prev.filter(h => format(h.date, 'yyyy-MM-dd') !== dateStr);
            return [...others, {
                id: `temp-${Date.now()}`,
                date: date,
                typeKey: typeKey,
                note: note
            }];
        });

        try {
            // Upsert based on unique constraint (date)
            // This overrides any annual holiday because we check 'calendar_highlights' first
            const { error } = await supabase
                .from('calendar_highlights')
                .upsert({
                    date: dateStr,
                    type_key: typeKey,
                    note: note
                }, { onConflict: 'date' });

            if (error) throw error;
            showToast('บันทึกไฮไลท์เรียบร้อย 🎨', 'success');
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            fetchHighlights(); // Revert on error
        }
    };

    const removeHighlight = async (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Optimistic UI Update
        setHighlights(prev => prev.filter(h => format(h.date, 'yyyy-MM-dd') !== dateStr));

        try {
            const { error } = await supabase
                .from('calendar_highlights')
                .delete()
                .eq('date', dateStr);

            if (error) throw error;
            showToast('ลบไฮไลท์แล้ว', 'info');
            // Note: If an annual holiday exists on this day, it will reappear after refresh/realtime update
            // because we removed the specific override. This is expected behavior.
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            fetchHighlights(); // Revert on error
        }
    };

    return {
        highlights,
        setHighlight,
        removeHighlight,
        refreshHighlights: fetchHighlights
    };
};

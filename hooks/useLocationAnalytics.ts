
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, isWithinInterval, subDays, differenceInCalendarDays } from 'date-fns';
import { LocationStat } from '../types';

import { useMasterData } from './useMasterData';

export type DateRangeType = 'THIS_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'ALL_TIME' | 'CUSTOM';

export const useLocationAnalytics = (rangeType: DateRangeType, customStart?: Date, customEnd?: Date) => {
    const { masterOptions } = useMasterData();
    const [rawData, setRawData] = useState<any[]>([]);
    const [masterLocations, setMasterLocations] = useState<{label: string, color: string}[]>([]); // Store Master Location Data
    const [isLoading, setIsLoading] = useState(true);

    // Calculate effective date range
    const dateRange = useMemo(() => {
        const now = new Date();
        let start = new Date(0); // Epoch for ALL_TIME
        let end = endOfMonth(now);

        if (rangeType === 'THIS_MONTH') {
            start = startOfMonth(now);
        } else if (rangeType === 'LAST_3_MONTHS') {
            start = subDays(now, 90);
        } else if (rangeType === 'THIS_YEAR') {
            start = new Date(now.getFullYear(), 0, 1);
        } else if (rangeType === 'CUSTOM' && customStart && customEnd) {
            start = customStart;
            end = customEnd;
        }
        return { start, end };
    }, [rangeType, customStart, customEnd]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Content Usage
            const { data, error } = await supabase
                .from('contents')
                .select('id, title, shoot_date, shoot_location, status, content_formats')
                .not('shoot_location', 'is', null)
                .not('shoot_date', 'is', null)
                .order('shoot_date', { ascending: false });

            if (error) throw error;
            setRawData(data || []);

        } catch (err) {
            console.error("Fetch location stats failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const locs = masterOptions
            .filter(opt => opt.type === 'SHOOT_LOCATION' && opt.isActive)
            .map(m => ({ label: m.label, color: m.color || '#6366f1' }));
        setMasterLocations(locs);
    }, [masterOptions]);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('realtime-location-v7-unified')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, () => fetchData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const locationStats = useMemo(() => {
        const stats: Record<string, LocationStat> = {};
        const now = new Date();

        // 1. Initialize with Master Locations
        masterLocations.forEach(loc => {
            const normalizeKey = loc.label.trim().toLowerCase();
            stats[normalizeKey] = {
                name: loc.label, // Keep original casing from Master
                color: loc.color,
                totalVisits: 0,
                totalClips: 0,
                lastVisit: null,
                freshnessScore: 100,
                saturationLevel: 'FRESH',
                isRegistered: true, // Mark as Official
                visits: {}
            };
        });

        // 2. Process Actual Usage
        rawData.forEach(item => {
            if (!item.shoot_location) return;
            
            const locName = item.shoot_location.trim();
            const normalizeKey = locName.toLowerCase();
            const itemDate = new Date(item.shoot_date);

            // If not in master (Unregistered/Legacy), create entry
            if (!stats[normalizeKey]) {
                stats[normalizeKey] = {
                    name: locName, // Use casing from content
                    totalVisits: 0,
                    totalClips: 0,
                    lastVisit: null,
                    freshnessScore: 100,
                    saturationLevel: 'FRESH',
                    isRegistered: false, // Mark as Unregistered
                    visits: {}
                };
            }

            // Calculate Stats ONLY for items within Selected Range
            const isInRange = rangeType === 'ALL_TIME' || isWithinInterval(itemDate, { start: dateRange.start, end: dateRange.end });
            
            if (isInRange) {
                const dateStr = format(itemDate, 'yyyy-MM-dd');
                if (!stats[normalizeKey].visits[dateStr]) {
                    stats[normalizeKey].visits[dateStr] = { date: itemDate, clips: [] };
                    stats[normalizeKey].totalVisits += 1;
                }
                stats[normalizeKey].visits[dateStr].clips.push({
                    id: item.id, 
                    title: item.title, 
                    status: item.status, 
                    format: item.content_formats && item.content_formats.length > 0 ? item.content_formats[0] : null
                });
                stats[normalizeKey].totalClips += 1;
            }

            // Track Last Visit (Global context for freshness)
            if (!stats[normalizeKey].lastVisit || itemDate > stats[normalizeKey].lastVisit!) {
                stats[normalizeKey].lastVisit = itemDate;
            }
        });

        // 3. Calculate "Freshness" & "Saturation"
        const results = Object.values(stats);
        
        results.forEach(stat => {
            if (!stat.lastVisit) return;
            
            const daysSinceLast = differenceInCalendarDays(now, stat.lastVisit);
            
            let score = Math.min(100, daysSinceLast * 2); 
            
            // Saturation Label
            if (daysSinceLast < 7) stat.saturationLevel = 'BURNOUT'; // Just went there this week!
            else if (daysSinceLast < 30) stat.saturationLevel = 'OVERUSED'; // Went there this month
            else if (daysSinceLast < 60) stat.saturationLevel = 'USED';
            else stat.saturationLevel = 'FRESH'; // Haven't been there in 2 months
            
            stat.freshnessScore = score;
        });

        // 4. Final Filter: Only return locations that have visits in the selected range
        return results.filter(s => s.totalVisits > 0);

    }, [rawData, masterLocations, dateRange, rangeType]);

    return { locationStats, isLoading, refresh: fetchData };
};

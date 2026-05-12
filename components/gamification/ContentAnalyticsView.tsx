
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Task, ContentAnalytics, PlatformMetrics, AnalyticsSummary } from '../../types';
import { fetchAnalyticsForContent, mapSupabaseToAnalytics } from '../../services/analyticsService';
import { useChannels } from '../../hooks/useChannels';
import { subDays, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Modular Components
import AnalyticsHeader from '../analytics/dashboard/AnalyticsHeader';
import AnalyticsStatsGrid from '../analytics/dashboard/AnalyticsStatsGrid';
import AnalyticsCharts from '../analytics/dashboard/AnalyticsCharts';
import AnalyticsListTable from '../analytics/dashboard/AnalyticsListTable';
import PendingActionsAlert from '../analytics/dashboard/PendingActionsAlert';
import AnalyticsEntryModal from './AnalyticsEntryModal';
import TaskModal from '../TaskModal';
import { useTeam } from '../../hooks/useTeam';
import { useTasks } from '../../hooks/useTasks';

interface ContentWithAnalytics extends Task {
    analytics?: ContentAnalytics[];
}

const ContentAnalyticsView: React.FC = () => {
    const { channels } = useChannels();
    const { allUsers: users } = useTeam();
    const { handleSaveTask, handleDeleteTask } = useTasks();
    const [data, setData] = useState<ContentWithAnalytics[]>([]);
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [platformFilter, setPlatformFilter] = useState('ALL');
    const [channelFilter, setChannelFilter] = useState('ALL');
    const [timeRange, setTimeRange] = useState('90'); // Default to 90 days
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [detailTask, setDetailTask] = useState<Task | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Calculate cutoff date based on timeRange
            const cutoffDate = timeRange === 'ALL' ? null : subDays(new Date(), parseInt(timeRange));
            
            // 1. Fetch contents with fallback date logic
            // We'll query by posted_at OR created_at depending on what's available
            let contentsQuery = supabase
                .from('contents')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (cutoffDate) {
                // If we don't have posted_at yet, we use created_at as a proxy for the content's timeline
                // But we allow filtering by posted_at if the user has started filling it in
                contentsQuery = contentsQuery.or(`posted_at.gte.${cutoffDate.toISOString()},created_at.gte.${cutoffDate.toISOString()}`);
            }

            const { data: contents, error: contentError } = await contentsQuery;

            if (contentError) throw contentError;

            // 2. Fetch analytics only for the fetched contents or within the time range
            // To be efficient, we fetch analytics captured in the last active period 
            // OR specifically linked to these contents
            const contentIds = (contents || []).map(c => c.id);
            
            let analyticsQuery = supabase
                .from('content_analytics')
                .select('*')
                .order('captured_at', { ascending: true });

            if (contentIds.length > 0 && contentIds.length < 500) {
                analyticsQuery = analyticsQuery.in('content_id', contentIds);
            } else if (cutoffDate) {
                // Fallback for many contents: fetch recent analytics
                analyticsQuery = analyticsQuery.gte('captured_at', cutoffDate.toISOString());
            }

            const { data: analyticsRaw, error: analyticsError } = await analyticsQuery;
            if (analyticsError) throw analyticsError;
            
            const analytics = (analyticsRaw || []).map(data => mapSupabaseToAnalytics(data));

            // 3. Merge and Map data
            const enrichedData = (contents || []).map((content: any) => {
                // Inline mapping similar to TaskContext to ensure camelCase and correct types
                const mappedContent: Task = {
                    id: content.id,
                    title: content.title,
                    description: content.description || '',
                    status: content.status,
                    priority: content.priority || 'MEDIUM',
                    type: 'CONTENT',
                    startDate: content.start_date ? new Date(content.start_date) : new Date(),
                    endDate: content.end_date ? new Date(content.end_date) : new Date(),
                    channelId: content.channel_id,
                    targetPlatforms: content.target_platform || [],
                    isUnscheduled: content.is_unscheduled, // MUST include this
                    ideaOwnerIds: content.idea_owner_ids || [],
                    editorIds: content.editor_ids || [],
                    assigneeIds: content.assignee_ids || [],
                    performance: content.performance,
                    // ... other fields as needed for the view
                } as any;

                return {
                    ...mappedContent,
                    analytics: analytics.filter(a => a.contentId === content.id)
                };
            });

            // 4. Scan for pending entries (Targeting the 7-day reporting threshold)
            const sevenDaysAgo = subDays(new Date(), 7);
            const fortyFiveDaysAgo = subDays(new Date(), 45); // Keep a generous backlog
            
            const pending = enrichedData.filter((item: any) => {
                // Triple-Check: Must be scheduled and in terminal status (Posted/Done)
                const currentStatus = (item.status || '').toUpperCase();
                const isActuallyPosted = !item.isUnscheduled && (
                    currentStatus.includes('DONE') || 
                    ['PUBLISHED', 'FINAL', 'POSTED', 'COMPLETE', 'COMPLETED'].includes(currentStatus)
                );
                if (!isActuallyPosted) return false;

                const publishDate = item.endDate;
                const hasAnalytics = item.analytics && item.analytics.length > 0;
                
                // Show items that have reached the 7-day mark but are not too old to be irrelevant
                // Logic: publishDate <= sevenDaysAgo AND publishDate >= fortyFiveDaysAgo
                const isReachedReportingMark = publishDate && !isAfter(publishDate, sevenDaysAgo);
                const isNotTooOld = publishDate && isAfter(publishDate, fortyFiveDaysAgo);
                
                return isReachedReportingMark && isNotTooOld && !hasAnalytics;
            }).sort((a, b) => {
                // "ยิ่งเป็น 7 วันพอดียิ่งสำคัญมากสุด" (The closer it is to exactly 7 days, the higher the priority)
                // Since we already filtered for age >= 7 days (date <= sevenDaysAgo),
                // the most recent date is the one closest to the 7-day mark.
                const timeA = a.endDate ? new Date(a.endDate).getTime() : 0;
                const timeB = b.endDate ? new Date(b.endDate).getTime() : 0;
                return timeB - timeA; // Descending order = most recent first
            });

            setData(enrichedData as any);
            setPendingTasks(pending as any);
        } catch (error) {
            console.error('Fetch Analytics Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
            const itemPlatform = (item as any).platform || (item.targetPlatforms?.[0] || 'ALL');
            const matchesPlatform = platformFilter === 'ALL' || itemPlatform === platformFilter;
            const matchesChannel = channelFilter === 'ALL' || item.channelId === channelFilter;
            return matchesSearch && matchesPlatform && matchesChannel;
        });
    }, [data, searchTerm, platformFilter, channelFilter]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, platformFilter, channelFilter]);

    // Paginated Data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage]);

    const statsSummary: AnalyticsSummary = useMemo(() => {
        let totalViews = 0, totalLikes = 0, totalShares = 0, totalComments = 0, totalSaves = 0;
        let totalInteraction = 0;
        const platformBreakdown: Record<string, PlatformMetrics> = {};

        filteredData.forEach(item => {
            const latest = item.analytics?.[item.analytics.length - 1];
            if (latest) {
                const v = latest.views || 0;
                const l = latest.likes || 0;
                const s = latest.shares || 0;
                const c = latest.comments || 0;
                const sv = latest.saves || 0;
                const interaction = l + s + c + sv;

                totalViews += v;
                totalLikes += l;
                totalShares += s;
                totalInteraction += interaction;

                const p = latest.platform || 'OTHER';
                if (!platformBreakdown[p]) {
                    platformBreakdown[p] = { platform: p, views: 0, engagement: 0, contentCount: 0, avgEngagementRate: 0 };
                }
                platformBreakdown[p].views += v;
                platformBreakdown[p].engagement += interaction;
                platformBreakdown[p].contentCount += 1;
            }
        });

        const avgER = totalViews > 0 ? (totalInteraction / totalViews) * 100 : 0;

        return { 
            totalViews, 
            totalLikes, 
            totalShares, 
            totalEngagement: totalInteraction,
            totalInteraction,
            avgEngagementRate: avgER,
            avgRetention: 0, 
            platformBreakdown 
        };
    }, [filteredData]);

    const chartData = useMemo(() => {
        return filteredData.slice(0, 10).map(item => {
            const latest = item.analytics?.[item.analytics.length - 1];
            return {
                name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
                views: latest?.views || 0,
            };
        });
    }, [filteredData]);

    const platformDistribution = useMemo(() => {
        return Object.entries(statsSummary.platformBreakdown).map(([name, metrics]) => ({
            name,
            value: metrics.views
        }));
    }, [statsSummary]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <div className="relative">
                    <div className="w-16 h-16 border-2 border-indigo-600/20 rounded-full"></div>
                    <div className="w-16 h-16 border-t-2 border-indigo-600 rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#fdfdfe] p-6 sm:p-10 space-y-10">
            <AnalyticsHeader 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                platformFilter={platformFilter}
                setPlatformFilter={setPlatformFilter}
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                channels={channels}
            />

            <AnimatePresence>
                {pendingTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <PendingActionsAlert 
                            pendingTasks={pendingTasks} 
                            onAction={(task) => setDetailTask(task)} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-800 tracking-tight">ข้อมูลสรุปประสิทธิภาพรวม</h2>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                        อัปเดตล่าสุด: วันนี้, {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </div>
                </div>
                <AnalyticsStatsGrid summary={statsSummary as any} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">เมทริกซ์การเติบโตเชิงลึก</h2>
                    </div>
                    <AnalyticsCharts 
                        chartData={chartData} 
                        platformDistribution={platformDistribution} 
                    />
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-slate-800 tracking-tight">ทะเบียนประวัติประสิทธิภาพรายรายการ</h2>
                </div>
                <AnalyticsListTable 
                    data={paginatedData} 
                    channels={channels} 
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredData.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    totalItems={filteredData.length}
                />
            </div>

            {selectedTask && (
                <AnalyticsEntryModal 
                    content={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onSave={() => {
                        fetchData(); // Refresh on save
                    }}
                />
            )}

            {detailTask && (
                <TaskModal 
                    isOpen={!!detailTask}
                    onClose={() => setDetailTask(null)}
                    initialData={detailTask}
                    channels={channels}
                    users={users}
                    onSave={async (t) => {
                        await handleSaveTask(t, detailTask);
                        fetchData();
                    }}
                    onUpdate={async (t) => {
                        await handleSaveTask(t, detailTask);
                        fetchData();
                    }}
                    onDelete={async (id) => {
                        await handleDeleteTask(id);
                        setDetailTask(null);
                        fetchData();
                    }}
                    initialContentTab="INSIGHT"
                />
            )}
        </div>
    );
};

export default ContentAnalyticsView;

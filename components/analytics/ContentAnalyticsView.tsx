
import React, { useState, useEffect, useMemo } from 'react';
import { Task, PlatformMetrics, AnalyticsSummary } from '../../types';
import { useChannels } from '../../hooks/useChannels';
import { motion, AnimatePresence } from 'framer-motion';

// Modular Components
import AnalyticsHeader from './dashboard/AnalyticsHeader';
import AnalyticsStatsGrid from './dashboard/AnalyticsStatsGrid';
import AnalyticsCharts from './dashboard/AnalyticsCharts';
import AnalyticsListTable from './dashboard/AnalyticsListTable';
import PendingActionsAlert from './dashboard/PendingActionsAlert';
import AnalyticsEntryModal from './AnalyticsEntryModal';
import TaskModal from '../TaskModal';
import { useTeam } from '../../hooks/useTeam';
import { useTasks } from '../../hooks/useTasks';
import { useContentAnalyticsFetcher } from '../../hooks/useContentAnalyticsFetcher';

const ContentAnalyticsView: React.FC = () => {
    const { channels, fetchChannels } = useChannels();
    const { allUsers: users } = useTeam();
    const { handleSaveTask, handleDeleteTask } = useTasks();
    
    useEffect(() => {
        if (channels.length === 0) {
            fetchChannels();
        }
    }, [channels.length]);
    
    // Use our new custom hook for fetching and state management
    const {
        data,
        pendingTasks,
        isLoading,
        platformFilter,
        setPlatformFilter,
        channelFilter,
        setChannelFilter,
        timeRange,
        setTimeRange,
        refetch
    } = useContentAnalyticsFetcher();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [detailTask, setDetailTask] = useState<Task | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredData = useMemo(() => {
        const flattened: any[] = [];
        data.forEach(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesChannel = channelFilter === 'ALL' || item.channelId === channelFilter;
            
            if (matchesSearch && matchesChannel) {
                const platforms = item.targetPlatforms && item.targetPlatforms.length > 0 ? item.targetPlatforms : [(item as any).platform || 'OTHER'];
                
                platforms.forEach((pt: string) => {
                    const matchesPlatform = platformFilter === 'ALL' || pt === platformFilter;
                    if (matchesPlatform) {
                        const platformAnalytics = (item as any).analytics?.filter((a: any) => a.platform === pt) || [];
                        flattened.push({
                            ...item,
                            displayPlatform: pt,
                            analytics: platformAnalytics
                        });
                    }
                });
            }
        });
        return flattened;
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
            const arr = (item as any).analytics;
            // Get the latest analytics for this specific platform
            const latest = arr && arr.length > 0 ? arr[arr.length - 1] : null;
            
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
                
                const p = item.displayPlatform;
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
            totalComments,
            totalSaves,
            totalEngagement: totalInteraction,
            totalInteraction,
            avgEngagementRate: avgER,
            avgRetention: 0, 
            platformBreakdown,
            totalAnalyzed: filteredData.length
        };
    }, [filteredData]);

    const chartData = useMemo(() => {
        // Only include those with actual analytics data, sorted by views
        const withAnalytics = filteredData.filter(item => {
            const arr = (item as any).analytics;
            return arr && arr.length > 0;
        });
        
        withAnalytics.sort((a, b) => {
            const latestA = (a as any).analytics[(a as any).analytics.length - 1];
            const latestB = (b as any).analytics[(b as any).analytics.length - 1];
            return (latestB?.views || 0) - (latestA?.views || 0);
        });

        return withAnalytics.slice(0, 10).map(item => {
            const latest = (item as any).analytics?.[(item as any).analytics.length - 1];
            return {
                name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
                views: latest?.views || 0,
                engagement: latest ? (latest.likes + latest.comments + latest.shares + latest.saves) : 0,
            };
        });
    }, [filteredData]);

    const platformDistribution = useMemo(() => {
        return Object.entries(statsSummary.platformBreakdown).map(([name, metrics]) => ({
            name,
            value: metrics.views
        }));
    }, [statsSummary]);

    if (isLoading && data.length === 0) {
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
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">ข้อมูลสรุปประสิทธิภาพรวม</h2>
                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm border border-indigo-100 uppercase tracking-wide">
                            อิงจาก {statsSummary.totalAnalyzed} คอนเทนต์
                        </div>
                    </div>
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
                    onRowClick={setSelectedTask}
                />
            </div>

            {selectedTask && (
                <AnalyticsEntryModal 
                    content={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onSave={() => {
                        refetch(); // Refresh on save
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
                        refetch();
                    }}
                    onUpdate={async (t) => {
                        await handleSaveTask(t, detailTask);
                        refetch();
                    }}
                    onDelete={async (id) => {
                        await handleDeleteTask(id);
                        setDetailTask(null);
                        refetch();
                    }}
                    initialContentTab="INSIGHT"
                />
            )}
        </div>
    );
};

export default ContentAnalyticsView;

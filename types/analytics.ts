import { User } from './core';

export interface ContentAnalytics {
    id: string;
    contentId: string;
    platform: string;
    capturedAt: Date;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    retentionRate?: number; // percentage 0-100
    avgWatchTime?: number; // seconds
    reach?: number;
    engagementRate?: number; // Calculated field
    isAiExtracted: boolean;
    rawAiData?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface PlatformMetrics {
    platform: string;
    views: number;
    engagement: number;
    contentCount: number;
    avgEngagementRate: number;
}

export interface AnalyticsSummary {
    totalViews: number;
    totalLikes?: number;
    totalShares?: number;
    totalComments?: number;
    totalSaves?: number;
    totalEngagement?: number;
    totalInteraction: number;
    avgEngagementRate: number;
    avgRetention: number;
    avgWatchTime?: number;
    platformBreakdown: Record<string, PlatformMetrics>;
    growthRate?: number;
    channelBenchmarks?: {
        avgViews: number;
        avgER: number;
    };
    topPerformingPlatform?: string;
    totalInteractions?: number;
    totalAnalyzed?: number;
}

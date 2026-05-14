
import { User } from './core';

export type TaskType = 'CONTENT' | 'TASK';
export type Status = 'TODO' | 'DOING' | 'DONE' | 'BLOCKED' | 'IDEA' | 'SCRIPT' | 'SHOOTING' | 'EDIT_CLIP' | 'FEEDBACK' | 'EDIT_DRAFT_1' | 'FEEDBACK_1' | 'EDIT_DRAFT_2' | 'APPROVE' | 'WAITING' | 'REVISE' | 'FINAL' | string;
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Platform = 'YOUTUBE' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'OTHER' | 'ALL';
export type ContentPillar = 'ENTERTAINMENT' | 'EDUCATION' | 'LIFESTYLE' | 'PROMO' | 'REALTIME' | 'COMEDY' | 'STREET' | 'DEEP_TALK' | 'BEHIND' | 'FAN_INTERACTION' | 'OTHER' | string;
export type ContentFormat = 'SHORT_FORM' | 'LONG_FORM' | 'PICTURE' | 'ALBUM' | 'REELS' | 'STORY' | 'POST_H' | 'OTHER' | string;
export type AssetCategory = 'SCRIPT' | 'THUMBNAIL' | 'VIDEO_DRAFT' | 'INVOICE' | 'REF' | 'LINK' | 'OTHER';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ReviewStatus = 'PENDING' | 'PASSED' | 'REVISE' | 'EXPIRED';
export type AssigneeType = 'TEAM' | 'INDIVIDUAL';
export type FilterType = 'STATUS' | 'FORMAT' | 'CHANNEL' | 'PILLAR' | 'CATEGORY';

export interface Channel {
    id: string;
    name: string;
    description?: string;
    color: string;
    platforms: Platform[];
    logoUrl?: string;
    platform?: Platform; // Legacy
}

export interface TaskPerformance {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    revenue: number;
    reflection: string;
}

export interface TaskAsset {
    id: string;
    name: string;
    url: string;
    type: 'LINK' | 'FILE';
    category: AssetCategory;
    createdAt: Date;
}

export interface ReviewSession {
    id: string;
    taskId: string;
    round: number;
    scheduledAt: Date;
    reviewerId?: string | null;
    status: ReviewStatus;
    feedback?: string;
    isCompleted: boolean;
    task?: Task;

    // --- NEW: Detailed Review Tracking (Single Source of Truth) ---
    submissionNotes?: string;
    qualityScore?: number;        // 1-5 or 1-100
    feedbackCategories?: string[]; // e.g., ["Visual", "Audio", "Content"]
    submissionAssetUrl?: string;  // Snapshot of the specific file being reviewed
    manualBonus?: number;         // Manual adjustment given during review
}

export interface TaskLog {
    id: string;
    taskId: string;
    userId?: string;
    action: string;
    details: string;
    reason?: string;
    createdAt: Date;
    user?: { name: string; avatarUrl: string };
}

export interface DeadlineRequest {
    id: string;
    taskId: string;
    requestedBy: string;
    newDeadline: Date;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
    user?: { name: string; avatarUrl: string };
}

export interface Task {
    id: string;
    type: TaskType;
    title: string;
    description: string;
    status: Status | string;
    priority?: Priority;
    tags: string[];
    startDate: Date;
    endDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
    
    // Content specific
    channelId?: string;
    targetPlatforms?: Platform[];
    pillar?: ContentPillar | string;
    contentFormats?: (ContentFormat | string)[]; // New multi-format support
    category?: string;
    isUnscheduled?: boolean;
    
    // People
    assigneeIds: string[];
    ideaOwnerIds?: string[];
    editorIds?: string[];
    assigneeType?: AssigneeType;
    
    // Details
    remark?: string;
    assets?: TaskAsset[];
    reviews?: ReviewSession[];
    logs?: TaskLog[];
    deadlineRequests?: DeadlineRequest[];
    
    // Gamification & Meta
    difficulty?: Difficulty;
    estimatedHours?: number;
    performance?: TaskPerformance;
    
    // New fields
    targetPosition?: string;
    caution?: string;
    importance?: string;
    publishedLinks?: Record<string, string>;
    
    // Production
    shootDate?: Date;
    shootLocation?: string;
    shootTripId?: string; // New
    shootTimeStart?: string; // New
    shootTimeEnd?: string;   // New
    shootNotes?: string;     // New
    isInShootQueue?: boolean;
    isSoftFinished?: boolean;
    localPath?: string;
    driveLabel?: string;

    // Sub-tasks
    contentId?: string; 
    showOnBoard?: boolean;
    parentContentTitle?: string;
    roadmapId?: string;

    // Script Link (General Task)
    scriptId?: string;

    // SLA Penalty
    sla_revert_count?: number;
    is_penalized?: boolean;
    last_penalized_at?: Date;
    hasAnalytics?: boolean;
}

export interface ChipConfig {
    id: string;
    label: string;
    type: FilterType;
    value: string;
    colorTheme: string;
    scope?: 'CONTENT' | 'TASK';
    mode?: 'INCLUDE' | 'EXCLUDE';
}

export interface MasterOption {
    id: string;
    type: string; 
    key: string;
    label: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    isDefault?: boolean;
    parentKey?: string;
    description?: string; // Added description field
    progressValue?: number;
}

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt: Date;
    user?: User;
}

export interface StorageConfig {
    id: string;
    label: string;
    currentLetter: string;
    description?: string;
    updatedAt: Date;
}

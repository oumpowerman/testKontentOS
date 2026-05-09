
import { User, ViewMode } from './core';
import { TaskAsset, FilterType } from './task';

// --- KPI TYPES ---
export interface IndividualGoal {
    id: string;
    userId: string;
    monthKey: string;
    title: string;
    targetValue: number;
    actualValue: number;
    unit: string;
}

export interface KPIConfig {
    id: string;
    roleTarget: string;
    weightOkr: number;
    weightBehavior: number;
    weightAttendance: number;
    penaltyLate: number;
    penaltyAbsent: number;
    penaltyMissedDuty: number;
    isActive: boolean;
}

export interface KPIStats {
    taskCompleted: number;
    taskOverdue: number;
    attendanceLate: number;
    attendanceAbsent: number;
    dutyAssigned: number;
    dutyMissed: number; // Abandoned or Penalized
}

export interface DisciplineAuditLog {
    id: string;
    type: 'LATE' | 'ABSENT' | 'TASK_OVERDUE' | 'MISSED_DUTY';
    date: Date;
    title: string;
    detail?: string;
    penalty?: number;
}

export interface KPIRecord {
    id: string;
    userId: string;
    evaluatorId: string;
    monthKey: string;
    scores: Record<string, number>; // Manager Scores
    selfScores?: Record<string, number>; // Self Scores
    feedback: string; // Legacy
    managerFeedback?: string;
    selfFeedback?: string;
    selfReflectionPride?: string;
    selfReflectionImprovement?: string;
    developmentPlan?: string;
    status: 'DRAFT' | 'WAITING_SELF' | 'FINAL' | 'PAID';
    totalScore: number;
    maxScore: number;
    updatedAt: Date;
    statsSnapshot?: KPIStats;
    finalScoreBreakdown?: {
        okrScore: number;     // Weighted
        behaviorScore: number; // Weighted
        attendanceScore: number; // Weighted
    };
}

// --- IDP ---
export interface IDPSubGoal {
    id: string;
    title: string;
    isDone: boolean;
}

export interface IDPItem {
    id: string;
    userId: string;
    monthKey: string;
    topic: string;
    actionPlan: string;
    status: 'TODO' | 'DONE';
    progress: number;
    category?: string;
    targetDate?: Date;
    orderIndex?: number;
    subGoals?: IDPSubGoal[];
}

// --- PEER REVIEW ---
export interface PeerReview {
    id: string;
    fromUserId: string;
    toUserId: string;
    monthKey: string;
    message: string;
    badge: 'TEAMWORK' | 'HELPFUL' | 'CREATIVE' | 'LEADERSHIP' | 'FUN';
    createdAt: Date;
    fromUser?: { name: string; avatarUrl: string };
}

// ... (Existing types below: SCRIPT, CHECKLIST, etc.) ...
// --- SCRIPT ---
export type ScriptType = 'MONOLOGUE' | 'DIALOGUE';
export type ScriptStatus = 'DRAFT' | 'REVIEW' | 'FINAL' | 'SHOOTING' | 'DONE';

export interface ScriptSheet {
    id: string;
    title: string;
    content: string;
}

export interface ScriptSummary {
    id: string;
    title: string;
    status: ScriptStatus;
    version: number;
    authorId: string;
    contentId?: string;
    createdAt: Date;
    updatedAt: Date;
    author?: { name: string; avatarUrl: string };
    ideaOwnerId?: string;
    ideaOwner?: { name: string; avatarUrl: string };
    linkedTaskTitle?: string;
    estimatedDuration: number;
    scriptType: ScriptType;
    isInShootQueue: boolean;
    isSoftFinished?: boolean;
    shootLocation?: string;   // New
    shootTimeStart?: string; // New
    shootTimeEnd?: string;   // New
    shootNotes?: string;     // New
    channelId?: string;
    category?: string;
    tags: string[];
    objective?: string;
    lockedBy?: string;
    lockedAt?: Date;
    locker?: { name: string; avatarUrl: string };
    shareToken?: string;
    isPublic?: boolean;
    isPersonal?: boolean;
    sheets?: ScriptSheet[];
}

export interface Script extends ScriptSummary {
    content: string;
    characters?: string[];
    document_state?: string; // Base64 encoded Yjs state
}

export interface LabSequenceItem {
    id: string; // Unique ID for DnD
    scriptId?: string; // Original script ID if it's a script block
    type: 'SCRIPT' | 'BRIDGE';
    title: string;
    content: string;
    activeSheetId?: string;
    sheets?: ScriptSheet[];
}

export interface ScriptComment {
    id: string;
    scriptId: string;
    userId: string;
    content: string;
    selectedText?: string;
    highlightId?: string;
    status: 'OPEN' | 'RESOLVED';
    createdAt: Date;
    user?: {
        name: string;
        avatarUrl: string;
    };
}

// --- CHECKLIST & ASSETS ---
export interface ChecklistItem {
    id: string;
    text: string;
    isChecked: boolean;
    categoryId: string;
}

export interface ChecklistPreset {
    id: string;
    name: string;
    items: { text: string; categoryId: string }[];
}

export type AssetCondition = 'GOOD' | 'REPAIR' | 'DAMAGED' | 'LOST' | 'WRITE_OFF';
export type AssetGroup = 'PRODUCTION' | 'OFFICE' | 'IT';
export type InventoryType = 'FIXED' | 'CONSUMABLE'; // NEW TYPE

export interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    imageUrl?: string;
    
    // Type Distinction
    itemType: InventoryType;
    
    // Grouping for Stacks (New)
    groupLabel?: string; 

    // Extended Asset Registry Fields (For Fixed Assets)
    purchasePrice?: number;
    purchaseDate?: Date;
    serialNumber?: string;
    warrantyExpire?: Date;
    condition?: AssetCondition;
    currentHolderId?: string;
    assetGroup?: AssetGroup;
    
    // New Fields for Supplies (Consumables)
    quantity: number;
    unit?: string;
    minThreshold?: number;
    maxCapacity?: number;
    
    // New Field for Tagging
    tags?: string[];

    // Joined Fields
    holder?: { name: string; avatarUrl: string };

    // Metadata
    createdAt?: Date;
}

// --- MEETING ---
export type MeetingCategory = 'GENERAL' | 'PROJECT' | 'CRISIS' | 'CREATIVE' | 'HR';

export interface MeetingAgendaItem {
    id: string;
    topic: string;
    duration?: number;
    isCompleted: boolean;
}

export interface MeetingNoteSheet {
    id: string;
    title: string;
    content: string;
}

export interface MeetingLog {
    id: string;
    title: string;
    date: Date;
    startTime?: string; // HH:mm
    endTime?: string;   // HH:mm
    content: string;
    sheets?: MeetingNoteSheet[];
    decisions?: string; 
    category: MeetingCategory; 
    attendees: string[];
    attendance?: Record<string, 'INVITED' | 'CONFIRMED' | 'DECLINED' | 'PRESENT' | 'ABSENT'>;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    agenda?: MeetingAgendaItem[];
    assets?: TaskAsset[];
    referenceMeetingId?: string;
}

// --- FEEDBACK ---
export type FeedbackType = 'IDEA' | 'ISSUE' | 'SHOUTOUT';
export type FeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FeedbackComment {
    id: string;
    feedbackId: string;
    userId: string;
    content: string;
    createdAt: Date;
    user?: { name: string; avatarUrl: string };
}

export interface FeedbackItem {
    id: string;
    type: FeedbackType;
    content: string;
    status: FeedbackStatus;
    isAnonymous: boolean;
    createdAt: Date;
    voteCount: number;
    hasVoted: boolean;
    creatorName?: string;
    creatorAvatar?: string;
    commentCount: number;
    repostCount: number;
    hasReposted: boolean;
    targetUserId?: string;
}

// --- DUTY ---
export type PenaltyStatus = 'NONE' | 'AWAITING_TRIBUNAL' | 'LATE_COMPLETED' | 'ACCEPTED_FAULT' | 'ABANDONED' | 'EXCUSED' | 'UNDER_REVIEW';

export interface Duty {
    id: string;
    title: string;
    assigneeId: string;
    date: Date;
    isDone: boolean;
    proofImageUrl?: string;
    isPenalized?: boolean; 
    penaltyStatus?: PenaltyStatus;
    appealReason?: string;
    appealProofUrl?: string;
    
    // New fields for Negligence Protocol
    abandonedAt?: Date; 
    clearedBySystem?: boolean;
}

export interface DutyConfig {
    dayOfWeek: number;
    requiredPeople: number;
    taskTitles: string[];
}

export interface DutySwap {
    id: string;
    requestorId: string;
    targetDutyId: string;
    ownDutyId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    requestor?: { name: string; avatarUrl: string };
    targetDuty?: { title: string; date: string; assigneeId: string };
    ownDuty?: { title: string; date: string; assigneeId: string };
}

// --- WIKI ---
export type WikiNodeType = 'FOLDER' | 'PAGE';

export interface WikiNode {
    id: string;
    parentId: string | null; // null for root nodes
    title: string;
    description?: string;
    content?: string; // Only for PAGE type
    type: WikiNodeType;
    icon?: string; // Lucide icon name or emoji
    color?: string; // Tailwind color class
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface WikiArticle {
    id: string;
    title: string;
    category: string;
    content: string;
    targetRoles?: string[];
    createdAt: Date;
    lastUpdated: Date;
    isPinned: boolean;
    coverImage?: string;
    helpfulCount?: number;
    createdBy?: string;
    updatedBy?: string;
    author?: { name: string; avatarUrl: string };
    lastEditor?: { name: string; avatarUrl: string };
}

// --- SYSTEM ---
export interface NotificationPreferences {
    newAssignments: boolean;
    upcomingDeadlines: boolean;
    taskCompletions: boolean;
    systemUpdates: boolean;
    emailAlerts: boolean;
}

export interface AppNotification {
    id: string;
    type: 'OVERDUE' | 'UPCOMING' | 'REVIEW' | 'INFO' | 'NEW_ASSIGNMENT' | 'APPROVAL_REQ' | 'GAME_REWARD' | 'GAME_PENALTY' | 'SYSTEM_LOCK_PENALTY'; // Added SYSTEM_LOCK_PENALTY
    title: string;
    message: string;
    taskId?: string;
    date: Date;
    isRead: boolean;
    actionLink?: string; // Optional link for navigation
    user?: { name: string; avatarUrl: string; id?: string }; // Who this notification is about (for Admin)
    // This Metadata field is CRITICAL for the new Popover design
    metadata?: {
        hp?: number;
        xp?: number;
        coins?: number;
        badge?: string;
        [key: string]: any;
    };
}

export interface ChatMessage {
    id: string;
    content: string;
    userId: string | null;
    isBot: boolean;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'TASK_CREATED';
    createdAt: Date;
    user?: User;
}

export interface DashboardConfig {
    id: string;
    key: string;
    label: string;
    icon?: string;
    colorTheme?: string;
    statusKeys?: string[];
    filterType?: FilterType;
    sortOrder: number;
}

export interface BackupOptions {
    tasks: boolean;
    contents: boolean;
    chats: boolean;
    profiles: boolean;
}

export interface StorageStats {
    usedBytes: number;
    fileBytes: number; 
    dbBytes: number;   
    fileCount: number;
    limitBytes: number;
}

export interface MenuGroup {
    id: string;
    title: string;
    icon: any; 
    items: { view: ViewMode; label: string; icon: any }[];
    adminOnly?: boolean;
    totalBadge?: number; // Aggregated badge count
}

export interface CalendarHighlight {
    id: string;
    date: Date;
    typeKey: string;
    note?: string;
}

export interface AnnualHoliday {
    id: string;
    name: string;
    day: number;
    month: number;
    typeKey: string;
    isActive: boolean;
}

// --- INTERN MANAGEMENT ---
export type InternStatus = 'APPLIED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEWED' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface InternCandidate {
    id: string;
    fullName: string;
    nickname?: string;
    email: string;
    phoneNumber: string;
    university: string;
    faculty?: string;
    academicYear?: string;
    portfolioUrl: string;
    resumeUrl?: string;
    otherUrl?: string;
    avatarUrl: string;
    gender: Gender;
    position: string;
    source?: string;
    startDate: Date;
    endDate: Date;
    durationDays?: number;
    applicationDate?: Date;
    status: InternStatus;
    interviewDate: Date | null;
    notes: string;
    createdAt: Date;
    createdBy: string;
}

// --- WORKBOX ---
export interface WorkboxItem {
    id: string;
    user_id: string;
    content_id?: string; // Reference to ContentStock if applicable
    title: string;
    description?: string;
    type: 'CONTENT' | 'CHECKLIST' | 'TASK';
    is_completed: boolean;
    order_index: number;
    created_at: string;
    // New fields for details
    progress?: number; 
    notes?: string;
    meta?: {
        assignees?: { userId: string; name: string; progress: number }[];
        [key: string]: any;
    };
}

export interface Greeting {
    id: string;
    text: string;
    category?: string;
    isActive: boolean;
}

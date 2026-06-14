
export type Role = 'ADMIN' | 'MEMBER';
export type WorkStatus = 'ONLINE' | 'BUSY' | 'SICK' | 'VACATION' | 'MEETING';
export type ViewMode = 'DASHBOARD' | 'CALENDAR' | 'TEAM' | 'CHAT' | 'ContentStock' | 'CHECKLIST' | 'CHANNELS' | 'SCRIPT_HUB' | 'MEETINGS' | 'DUTY' | 'QUALITY_GATE' | 'KPI' | 'FEEDBACK' | 'MASTER_DATA' | 'WEEKLY' | 'GOALS' | 'WIKI' | 'SYSTEM_GUIDE' | 'ATTENDANCE' | 'FINANCE' | 'LEADERBOARD' | 'ASSETS' | 'NEXUS' | 'ROADMAP' | 'ANALYTICS' | 'ULTIMATE_WORKROOM';

export type EmploymentType = 'INTERN' | 'PROBATION' | 'FULL_TIME';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'DEATH';

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    avatarUrl: string;
    position: string;
    phoneNumber?: string;
    bio?: string;
    feeling?: string;
    isApproved: boolean;
    isActive: boolean;
    status: UserStatus;
    xp: number;
    level: number;
    availablePoints: number;
    hp: number;
    maxHp: number;
    deathCount: number;
    hpDepletedAt?: Date | null;
    workStatus: WorkStatus;
    leaveStartDate?: Date | null;
    leaveEndDate?: Date | null;
    // New Fields for Persistent Notifications
    lastReadChatAt?: Date;
    lastReadNotificationAt?: Date;
    
    // HR Fields
    employmentType?: EmploymentType;
    startDate?: Date;
    workDays?: number[]; // [0=Sun, 1=Mon, ..., 6=Sat]
    
    // Payroll V5
    baseSalary?: number;
    bankAccount?: string;
    bankName?: string;
    ssoIncluded?: boolean;
    taxType?: string;

    // Gamification
    equippedFrameId?: string;
    ownedFrameIds?: string[];
    equippedBgId?: string;
    ownedBgIds?: string[];

    // Background Wave option
    waveBgEnabled?: boolean;
    ultimateWorkroomEnabled?: boolean;

    // Notification
    lineUserId?: string;
    createdAt?: Date;
    emoji?: string;
}

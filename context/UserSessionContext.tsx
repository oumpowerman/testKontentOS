import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, WorkStatus } from '../types';
import { useToast } from './ToastContext';
import { useGlobalDialog } from './GlobalDialogContext';
import { subDays, format } from 'date-fns';
import { mapAttendanceLog } from '../hooks/attendance/shared';
import { calculateLevel } from '../lib/gameLogic';

interface UserSessionContextType {
    isReady: boolean;
    currentUserProfile: User | null;
    allUsers: User[];
    activeUsers: User[];
    attendanceLogs: any[];
    leaveRequests: any[];
    
    // Auth Actions
    fetchProfile: () => Promise<User | null>;
    updateProfile: (updates: Partial<User>, avatarFile?: File) => Promise<boolean>;
    
    // Data Actions
    refreshAttendance: () => Promise<void>;
    refreshLeaves: () => Promise<void>;
    
    // Team Actions
    fetchTeamMembers: () => Promise<void>;
    approveMember: (userId: string) => Promise<void>;
    removeMember: (userId: string) => Promise<void>;
    toggleUserStatus: (userId: string, currentStatus: boolean) => Promise<void>;
    updateMember: (userId: string, updates: any) => Promise<boolean>;
    adjustStatsLocally: (userId: string, adjustments: { hp?: number, xp?: number, points?: number }) => void;
    setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

// --- MAPPERS (Pure functions outside the component for maximum stability) ---
const mapProfileToUser = (data: any): User => ({
    id: data.id,
    email: data.email,
    name: data.full_name || 'Unknown User',
    role: data.role,
    avatarUrl: data.avatar_url || '',
    position: data.position || 'Member',
    phoneNumber: data.phone_number || '',
    bio: data.bio || '',
    feeling: data.feeling || '',
    isApproved: data.is_approved,
    isActive: data.is_active !== false,
    status: data.status || (data.is_active !== false ? 'ACTIVE' : 'INACTIVE'),
    xp: data.xp || 0,
    level: data.level || 1,
    availablePoints: data.available_points || 0,
    hp: data.hp ?? 100,
    maxHp: data.max_hp || 100,
    deathCount: data.death_count || 0,
    hpDepletedAt: data.hp_depleted_at ? new Date(data.hp_depleted_at) : null,
    workStatus: (data.work_status as WorkStatus) || 'ONLINE',
    leaveStartDate: data.leave_start_date ? new Date(data.leave_start_date) : null,
    leaveEndDate: data.leave_end_date ? new Date(data.leave_end_date) : null,
    lastReadChatAt: data.last_read_chat_at ? new Date(data.last_read_chat_at) : new Date(0),
    lastReadNotificationAt: data.last_read_notification_at ? new Date(data.last_read_notification_at) : new Date(0),
    workDays: data.work_days || [1, 2, 3, 4, 5],
    baseSalary: data.base_salary || 0,
    bankAccount: data.bank_account || '',
    bankName: data.bank_name || '',
    ssoIncluded: data.sso_included !== false,
    taxType: data.tax_type || 'WHT_3',
    lineUserId: data.line_user_id || '',
    equippedFrameId: data.equipped_frame_id || '',
    ownedFrameIds: data.owned_frame_ids || [],
    startDate: data.start_date ? new Date(data.start_date) : undefined,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    waveBgEnabled: data.wave_bg_enabled !== false,
    ultimateWorkroomEnabled: data.ultimate_workroom_enabled !== false
});

const mapDBToUserUpdates = (u: any): Partial<User> => {
    const updates: Partial<User> = {};
    if ('full_name' in u) updates.name = u.full_name;
    if ('role' in u) updates.role = u.role;
    if ('avatar_url' in u) updates.avatarUrl = u.avatar_url;
    if ('position' in u) updates.position = u.position;
    if ('phone_number' in u) updates.phoneNumber = u.phone_number;
    if ('bio' in u) updates.bio = u.bio;
    if ('feeling' in u) updates.feeling = u.feeling;
    if ('is_approved' in u) updates.isApproved = u.is_approved;
    if ('is_active' in u) updates.isActive = u.is_active;
    if ('status' in u) updates.status = u.status;
    if ('xp' in u) updates.xp = u.xp;
    if ('level' in u) updates.level = u.level;
    if ('available_points' in u) updates.availablePoints = u.available_points;
    if ('hp' in u) updates.hp = u.hp;
    if ('max_hp' in u) updates.maxHp = u.max_hp;
    if ('death_count' in u) updates.deathCount = u.death_count;
    if ('hp_depleted_at' in u) updates.hpDepletedAt = u.hp_depleted_at ? new Date(u.hp_depleted_at) : null;
    if ('work_status' in u) updates.workStatus = u.work_status;
    if ('work_days' in u) updates.workDays = u.work_days;
    if ('base_salary' in u) updates.baseSalary = u.base_salary;
    if ('bank_account' in u) updates.bankAccount = u.bank_account;
    if ('bank_name' in u) updates.bankName = u.bank_name;
    if ('sso_included' in u) updates.ssoIncluded = u.sso_included;
    if ('tax_type' in u) updates.taxType = u.tax_type;
    if ('line_user_id' in u) updates.lineUserId = u.line_user_id;
    if ('equipped_frame_id' in u) updates.equippedFrameId = u.equipped_frame_id;
    if ('owned_frame_ids' in u) updates.ownedFrameIds = u.owned_frame_ids;
    if ('wave_bg_enabled' in u) updates.waveBgEnabled = u.wave_bg_enabled;
    if ('ultimate_workroom_enabled' in u) updates.ultimateWorkroomEnabled = u.ultimate_workroom_enabled;
    if ('start_date' in u) updates.startDate = u.start_date ? new Date(u.start_date) : undefined;
    if ('last_read_chat_at' in u) updates.lastReadChatAt = u.last_read_chat_at ? new Date(u.last_read_chat_at) : new Date(0);
    if ('last_read_notification_at' in u) updates.lastReadNotificationAt = u.last_read_notification_at ? new Date(u.last_read_notification_at) : new Date(0);
    return updates;
};

const mapLeaveRequest = (data: any) => ({
    id: data.id,
    userId: data.user_id,
    type: data.type,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    reason: data.reason,
    attachmentUrl: data.attachment_url,
    status: data.status,
    approverId: data.approver_id,
    createdAt: new Date(data.created_at),
    rejectionReason: data.rejection_reason
});

export const UserSessionProvider: React.FC<{ sessionUser: any, children: React.ReactNode }> = ({ sessionUser, children }) => {
    const [isReady, setIsReady] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const activeUsers = React.useMemo(() => allUsers.filter(u => u.isActive), [allUsers]);
    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    
    const { showToast } = useToast();
    const { showConfirm, showAlert } = useGlobalDialog();

    // --- INITIAL BATCH FETCH ---
    const fetchInitialData = useCallback(async () => {
        if (!sessionUser?.id) return;

        try {
            const today = new Date();
            const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
            const sixtyDaysAgo = format(subDays(today, 60), 'yyyy-MM-dd');

            // 1. Hybrid Fetching Strategy:
            // - Fetch minimal data for EVERYONE (to support history/lookup)
            // - Fetch full data for ACTIVE users
            // - Fetch full data for CURRENT user
            
            const [minProfilesRes, activeProfilesRes, currentProfileRes] = await Promise.all([
                supabase.from('profiles').select('id, full_name, avatar_url, is_active, role, position, start_date').order('full_name', { ascending: true }),
                supabase.from('profiles').select('*').eq('is_active', true),
                supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()
            ]);

            if (minProfilesRes.error) throw minProfilesRes.error;
            if (activeProfilesRes.error) throw activeProfilesRes.error;
            if (currentProfileRes.error) throw currentProfileRes.error;

            const minimalData = minProfilesRes.data || [];
            const activeData = activeProfilesRes.data || [];
            const currentData = currentProfileRes.data;

            if (minimalData) {
                // Merge data: Active full data overwrites minimal data
                const userMap = new Map<string, any>();
                
                minimalData.forEach(p => userMap.set(p.id, p));
                activeData.forEach(p => userMap.set(p.id, p));
                if (currentData) userMap.set(currentData.id, currentData);

                const mergedData = Array.from(userMap.values());
                const mappedUsers = mergedData.map(mapProfileToUser);
                
                setAllUsers(mappedUsers);
                
                const current = mappedUsers.find(u => u.id === sessionUser.id);
                if (current) {
                    setCurrentUserProfile(current);
                    
                    // 2. Fetch attendance and leaves based on role
                    const isAdmin = current.role === 'ADMIN';
                    
                    let attendanceQuery = supabase.from('attendance_logs').select('*').gte('date', thirtyDaysAgo);
                    let leavesQuery = supabase.from('leave_requests').select('*').gte('end_date', sixtyDaysAgo);

                    if (!isAdmin) {
                        attendanceQuery = attendanceQuery.eq('user_id', sessionUser.id);
                        leavesQuery = leavesQuery.eq('user_id', sessionUser.id);
                    }

                    const [attendanceRes, leavesRes] = await Promise.all([
                        attendanceQuery,
                        leavesQuery
                    ]);

                    if (attendanceRes.data) setAttendanceLogs(attendanceRes.data.map(mapAttendanceLog));
                    if (leavesRes.data) setLeaveRequests(leavesRes.data.map(mapLeaveRequest));
                }
            }

        } catch (error) {
            console.error("Error fetching initial user session data:", error);
        } finally {
            setIsReady(true);
        }
    }, [sessionUser?.id, showToast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // --- REALTIME SUBSCRIPTIONS ---
    useEffect(() => {
        if (!sessionUser?.id || !currentUserProfile) return;

        const isAdmin = currentUserProfile.role === 'ADMIN';
        let isInitialSubscription = true;

        // Single Channel for all user session updates
        const channel = supabase.channel(`user-session-hub-${sessionUser.id}`)
            // 1. Profiles (Handles both currentUser and allUsers)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newUser = mapProfileToUser(payload.new);
                    setAllUsers(prev => {
                        if (prev.some(u => u.id === newUser.id)) return prev;
                        return [...prev, newUser];
                    });
                    showToast(`มีสมาชิกใหม่สมัครเข้ามา: ${newUser.name}`, 'info');
                } 
                else if (payload.eventType === 'UPDATE') {
                    const updates = mapDBToUserUpdates(payload.new);
                    setAllUsers(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...updates } : u));
                    
                    if (payload.new.id === sessionUser.id) {
                        setCurrentUserProfile(prev => prev ? { ...prev, ...updates } : null);
                    }
                } 
                else if (payload.eventType === 'DELETE') {
                    setAllUsers(prev => prev.filter(u => u.id !== payload.old.id));
                }
            })
            // 2. Attendance Logs (Scope based on Role)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance_logs', 
                filter: isAdmin ? undefined : `user_id=eq.${sessionUser.id}` 
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setAttendanceLogs(prev => {
                        if (prev.some(log => log.id === payload.new.id)) return prev;
                        return [...prev, mapAttendanceLog(payload.new)];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setAttendanceLogs(prev => prev.map(log => log.id === payload.new.id ? mapAttendanceLog(payload.new) : log));
                } else if (payload.eventType === 'DELETE') {
                    setAttendanceLogs(prev => prev.filter(log => log.id !== payload.old.id));
                }
            })
            // 3. Leave Requests (Scope based on Role)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'leave_requests', 
                filter: isAdmin ? undefined : `user_id=eq.${sessionUser.id}` 
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setLeaveRequests(prev => {
                        if (prev.some(req => req.id === payload.new.id)) return prev;
                        return [mapLeaveRequest(payload.new), ...prev];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setLeaveRequests(prev => prev.map(req => req.id === payload.new.id ? mapLeaveRequest(payload.new) : req));
                } else if (payload.eventType === 'DELETE') {
                    setLeaveRequests(prev => prev.filter(req => req.id !== payload.old.id));
                }
            });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                if (isInitialSubscription) {
                    isInitialSubscription = false;
                    // Initial fetch already handled by useEffect mount
                } else {
                    // Re-sync on reconnect to ensure data integrity
                    console.log('🔄 UserSession: Re-syncing on reconnect...');
                    fetchInitialData();
                }
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionUser?.id, currentUserProfile?.role, isReady, fetchInitialData, showToast]);

    // --- AUTH ACTIONS (From useAuth) ---
    const fetchProfile = async () => {
        // Since we are realtime, we can just return the current state.
        // If strict refetch is needed, we could do it here, but returning state is faster.
        return currentUserProfile;
    };

    const updateProfile = async (updates: Partial<User>, avatarFile?: File) => {
        if (!currentUserProfile) return false;
        try {
            const payload: any = {};
            if (updates.name !== undefined) payload.full_name = updates.name;
            if (updates.position !== undefined) payload.position = updates.position;
            if (updates.bio !== undefined) payload.bio = updates.bio; 
            if (updates.feeling !== undefined) payload.feeling = updates.feeling; 
            if (updates.phoneNumber !== undefined) payload.phone_number = updates.phoneNumber;
            if (updates.workStatus !== undefined) payload.work_status = updates.workStatus;
            if (updates.leaveStartDate !== undefined) payload.leave_start_date = updates.leaveStartDate ? updates.leaveStartDate.toISOString() : null;
            if (updates.leaveEndDate !== undefined) payload.leave_end_date = updates.leaveEndDate ? updates.leaveEndDate.toISOString() : null;
            if (updates.lineUserId !== undefined) payload.line_user_id = updates.lineUserId;
            if (updates.equippedFrameId !== undefined) payload.equipped_frame_id = updates.equippedFrameId;
            if (updates.ownedFrameIds !== undefined) payload.owned_frame_ids = updates.ownedFrameIds;
            if (updates.waveBgEnabled !== undefined) payload.wave_bg_enabled = updates.waveBgEnabled;
            if (updates.ultimateWorkroomEnabled !== undefined) payload.ultimate_workroom_enabled = updates.ultimateWorkroomEnabled;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${currentUserProfile.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                payload.avatar_url = urlData.publicUrl;
            }

            const { error } = await supabase.from('profiles').update(payload).eq('id', currentUserProfile.id);
            if (error) throw error;
            
            // Optimistic update
            setCurrentUserProfile(prev => prev ? ({ ...prev, ...updates, avatarUrl: payload.avatar_url || prev.avatarUrl }) : null);
            return true;
        } catch (err: any) {
            console.error('Update profile failed:', err);
            showAlert('เกิดข้อผิดพลาด: ' + err.message);
            return false;
        }
    };

    // --- DATA ACTIONS ---
    const refreshAttendance = async () => {
        if (!sessionUser?.id || !currentUserProfile) return;
        try {
            const today = new Date();
            const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
            const isAdmin = currentUserProfile.role === 'ADMIN';

            let query = supabase.from('attendance_logs').select('*').gte('date', thirtyDaysAgo);
            if (!isAdmin) query = query.eq('user_id', sessionUser.id);

            const { data, error } = await query;
            if (error) throw error;
            if (data) setAttendanceLogs(data.map(mapAttendanceLog));
        } catch (error) {
            console.error("Error refreshing attendance:", error);
        }
    };

    const refreshLeaves = async () => {
        if (!sessionUser?.id || !currentUserProfile) return;
        try {
            const today = new Date();
            const sixtyDaysAgo = format(subDays(today, 60), 'yyyy-MM-dd');
            const isAdmin = currentUserProfile.role === 'ADMIN';

            let query = supabase.from('leave_requests').select('*').gte('end_date', sixtyDaysAgo);
            if (!isAdmin) query = query.eq('user_id', sessionUser.id);

            const { data, error } = await query;
            if (error) throw error;
            if (data) setLeaveRequests(data.map(mapLeaveRequest));
        } catch (error) {
            console.error("Error refreshing leaves:", error);
        }
    };

    // --- TEAM ACTIONS (From useTeam) ---
    const fetchTeamMembers = async () => {
        // Handled by initial fetch and realtime
    };

    const approveMember = async (userId: string) => {
        try {
            const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
            if (error) throw error;
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isApproved: true } : u));
            showToast('อนุมัติสมาชิกเรียบร้อย! 🎉', 'success');
        } catch (err: any) {
            showToast('อนุมัติไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const removeMember = async (userId: string) => {
        const confirmed = await showConfirm('แน่ใจนะครับว่าจะลบสมาชิกคนนี้?', 'ลบสมาชิกออกจากทีม');
        if(!confirmed) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;
            setAllUsers(prev => prev.filter(u => u.id !== userId));
            showToast('ลบสมาชิกออกจากทีมแล้ว', 'warning');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', userId);
            if (error) throw error;
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: newStatus } : u));
            showToast(newStatus ? 'เปิดใช้งาน User แล้ว ✅' : 'พักงาน User ชั่วคราว 💤', 'info');
        } catch (err: any) {
            showToast('อัปเดตสถานะไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateMember = async (userId: string, updates: any) => {
        try {
            const payload: any = {};
            if (updates.name) payload.full_name = updates.name;
            if (updates.position) payload.position = updates.position;
            if (updates.role) payload.role = updates.role;
            if (updates.workDays) payload.work_days = updates.workDays;
            if (updates.baseSalary !== undefined) payload.base_salary = updates.baseSalary;
            if (updates.bankAccount !== undefined) payload.bank_account = updates.bankAccount;
            if (updates.bankName !== undefined) payload.bank_name = updates.bankName;
            if (updates.ssoIncluded !== undefined) payload.sso_included = updates.ssoIncluded;
            if (updates.taxType !== undefined) payload.tax_type = updates.taxType;

            const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
            if (error) throw error;
            
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
            showToast('อัปเดตข้อมูลสมาชิกสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            showToast('อัปเดตล้มเหลว: ' + err.message, 'error');
            return false;
        }
    };

    const adjustStatsLocally = (userId: string, adjustments: { hp?: number, xp?: number, points?: number }) => {
        setAllUsers(prev => prev.map(u => {
            if (u.id === userId) {
                const newHp = adjustments.hp !== undefined ? Math.min(u.maxHp, Math.max(0, u.hp + adjustments.hp)) : u.hp;
                const newXp = adjustments.xp !== undefined ? Math.max(0, u.xp + adjustments.xp) : u.xp;
                const newPoints = adjustments.points !== undefined ? Math.max(0, u.availablePoints + adjustments.points) : u.availablePoints;
                
                // Recalculate level optimistically
                const newLevel = calculateLevel(newXp);
                
                return { ...u, hp: newHp, xp: newXp, availablePoints: newPoints, level: newLevel };
            }
            return u;
        }));
    };

    // Refresh data on day change (Optimized)
    useEffect(() => {
        const checkDayChange = () => {
            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd');
            const lastChecked = localStorage.getItem('last_attendance_check_date');
            
            if (lastChecked && lastChecked !== todayStr) {
                console.log('Day changed, refreshing attendance data...');
                fetchInitialData();
            }
            localStorage.setItem('last_attendance_check_date', todayStr);
            return todayStr;
        };

        // 1. Initial check
        checkDayChange();

        // 2. Schedule next check at exactly midnight
        let timeoutId: NodeJS.Timeout;
        const scheduleMidnightCheck = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 1, 0); // Tomorrow at 00:00:01
            const msUntilMidnight = midnight.getTime() - now.getTime();
            
            timeoutId = setTimeout(() => {
                checkDayChange();
                scheduleMidnightCheck(); // Reschedule for next day
            }, msUntilMidnight);
        };
        scheduleMidnightCheck();

        // 3. Check when user returns to the tab (covers sleep/wake)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkDayChange();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchInitialData]);

    const value = React.useMemo(() => ({
        isReady,
        currentUserProfile,
        allUsers,
        activeUsers,
        attendanceLogs,
        leaveRequests,
        fetchProfile,
        updateProfile,
        refreshAttendance,
        refreshLeaves,
        fetchTeamMembers,
        approveMember,
        removeMember,
        toggleUserStatus,
        updateMember,
        adjustStatsLocally,
        setAllUsers
    }), [
        isReady, currentUserProfile, allUsers, attendanceLogs, leaveRequests,
        fetchProfile, updateProfile, fetchTeamMembers, approveMember,
        removeMember, toggleUserStatus, updateMember, adjustStatsLocally
    ]);

    return (
        <UserSessionContext.Provider value={value}>
            {children}
        </UserSessionContext.Provider>
    );
};

export const useUserSession = () => {
    const context = useContext(UserSessionContext);
    if (context === undefined) {
        throw new Error('useUserSession must be used within a UserSessionProvider');
    }
    return context;
};

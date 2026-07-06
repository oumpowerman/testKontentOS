import { supabase } from '../lib/supabase';
import { LeaveRequest, LeaveType, RequestStatus } from '../types/attendance';

export const attendanceService = {
    /**
     * Fetches combined standard leave requests and dedicated OT requests.
     */
    async fetchCombinedRequests(
        userId?: string,
        options: { all?: boolean; isAdmin?: boolean } = {}
    ): Promise<LeaveRequest[]> {
        let query = supabase
            .from('leave_requests')
            .select(`
                *,
                profiles:profiles!leave_requests_user_id_fkey (id, full_name, avatar_url, position)
            `)
            .order('created_at', { ascending: false });
        
        if (!options.all && userId) {
            query = query.eq('user_id', userId);
        }

        const { data: leaveData, error: leaveError } = await query;
        if (leaveError) throw leaveError;

        const leaves: LeaveRequest[] = (leaveData || []).map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            type: r.type,
            startDate: new Date(r.start_date),
            endDate: new Date(r.end_date),
            reason: r.reason,
            attachmentUrl: r.attachment_url,
            status: r.status as RequestStatus,
            approverId: r.approver_id,
            createdAt: new Date(r.created_at),
            rejectionReason: r.rejection_reason,
            user: r.profiles ? {
                id: r.profiles.id,
                name: r.profiles.full_name,
                avatarUrl: r.profiles.avatar_url,
                position: r.profiles.position
            } : undefined
        }));

        // Fetch dedicated OT requests
        let ots: LeaveRequest[] = [];
        if (options.all && options.isAdmin) {
            const { data: otData, error: otError } = await supabase
                .from('ot_requests')
                .select(`
                    *,
                    profiles:profiles!ot_requests_user_id_fkey (id, full_name, avatar_url, position)
                `)
                .order('created_at', { ascending: false });

            if (otError) throw otError;

            if (otData) {
                ots = otData.map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    type: 'OVERTIME' as LeaveType,
                    startDate: new Date(r.date + 'T' + r.start_time),
                    endDate: new Date(r.date + 'T' + r.end_time),
                    reason: `[OT:${r.duration_hours}hr] ${r.reason}`,
                    status: r.status as RequestStatus,
                    createdAt: new Date(r.created_at),
                    rejectionReason: r.rejection_reason,
                    user: r.profiles ? {
                        id: r.profiles.id,
                        name: r.profiles.full_name,
                        avatarUrl: r.profiles.avatar_url,
                        position: r.profiles.position
                    } : undefined
                }));
            }
        } else if (userId) {
            const { data: otData, error: otError } = await supabase
                .from('ot_requests')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (otError) throw otError;

            if (otData) {
                ots = otData.map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    type: 'OVERTIME' as LeaveType,
                    startDate: new Date(r.date + 'T' + r.start_time),
                    endDate: new Date(r.date + 'T' + r.end_time),
                    reason: `[OT:${r.duration_hours}hr] ${r.reason}`,
                    status: r.status as RequestStatus,
                    createdAt: new Date(r.created_at),
                    rejectionReason: r.rejection_reason,
                    user: undefined // Will be matched with current user at hooks layer if needed
                }));
            }
        }

        // Return combined list, sorted descending by creation date
        const combined = [...leaves, ...ots];
        combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return combined;
    },

    /**
     * Inserts a new leave request.
     */
    async insertLeaveRequest(payload: {
        user_id: string;
        type: string;
        start_date: string;
        end_date: string;
        reason: string;
        attachment_url: string | null;
        status: string;
    }) {
        const { data, error } = await supabase
            .from('leave_requests')
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Inserts a new OT request.
     */
    async insertOtRequest(payload: {
        user_id: string;
        date: string;
        start_time: string;
        end_time: string;
        duration_hours: number;
        reason: string;
        type: string;
        computed_payout: number;
        base_salary_at_time: number;
        status: string;
    }) {
        const { data, error } = await supabase
            .from('ot_requests')
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Updates an OT request status (APPROVED / REJECTED) and associated variables.
     */
     async updateOtRequestStatus(
        id: string,
        status: 'APPROVED' | 'REJECTED',
        updateFields: {
            duration_hours?: number;
            computed_payout?: number;
            approved_by: string;
            approved_at: string;
            rejection_reason?: string;
            start_time?: string;
            end_time?: string;
        }
    ) {
        const { data, error } = await supabase
            .from('ot_requests')
            .update({
                status,
                ...updateFields,
                // Map camelCase if needed, but db expects snake_case:
                duration_hours: updateFields.duration_hours,
                computed_payout: updateFields.computed_payout,
                approved_by: updateFields.approved_by,
                approved_at: updateFields.approved_at,
                rejection_reason: updateFields.rejection_reason,
                start_time: updateFields.start_time,
                end_time: updateFields.end_time
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Updates a standard leave request status (APPROVED / REJECTED).
     */
    async updateLeaveRequestStatus(
        id: string,
        status: 'APPROVED' | 'REJECTED',
        updateFields: {
            approver_id: string;
            rejection_reason?: string;
        }
    ) {
        const { data, error } = await supabase
            .from('leave_requests')
            .update({
                status,
                approver_id: updateFields.approver_id,
                rejection_reason: updateFields.rejection_reason
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Fetches standard leave history for a specific user.
     */
    async getUserLeaveHistory(userId: string): Promise<LeaveRequest[]> {
        const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            type: r.type,
            startDate: new Date(r.start_date),
            endDate: new Date(r.end_date),
            reason: r.reason,
            attachmentUrl: r.attachment_url,
            status: r.status as RequestStatus,
            approverId: r.approver_id,
            createdAt: new Date(r.created_at),
            rejectionReason: r.rejection_reason
        }));
    }
};

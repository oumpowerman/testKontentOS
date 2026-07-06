import { useMyRequests } from './useMyRequests';
import { useAdminApprovals } from './useAdminApprovals';

/**
 * Facade hook that delegates to useMyRequests or useAdminApprovals
 * based on the user's view options. Keeps 100% backwards compatibility.
 */
export const useLeaveRequests = (currentUser?: any, options: { all?: boolean } = {}) => {
    const isAdminView = !!(options.all && currentUser?.role === 'ADMIN');

    const myRequests = useMyRequests(currentUser, { enabled: true });
    const adminApprovals = useAdminApprovals(currentUser, { enabled: isAdminView });

    if (isAdminView) {
        return {
            requests: adminApprovals.requests,
            isLoading: adminApprovals.isLoading,
            approveRequest: adminApprovals.approveRequest,
            rejectRequest: adminApprovals.rejectRequest,
            submitRequest: myRequests.submitRequest, // Fallback
            leaveUsage: myRequests.leaveUsage, // Fallback
            pendingUsage: myRequests.pendingUsage, // Fallback
            fetchRequests: adminApprovals.fetchAllRequests
        };
    } else {
        return {
            requests: myRequests.requests,
            isLoading: myRequests.isLoading,
            approveRequest: adminApprovals.approveRequest, // Fallback
            rejectRequest: adminApprovals.rejectRequest, // Fallback
            submitRequest: myRequests.submitRequest,
            leaveUsage: myRequests.leaveUsage,
            pendingUsage: myRequests.pendingUsage,
            fetchRequests: myRequests.fetchMyRequests
        };
    }
};

import { supabase } from '../../lib/supabase';

/**
 * Sends an approval notification to the user.
 */
export async function sendApprovalNotification(userId: string, title: string, message: string, relatedId?: string, metadata?: any) {
    return supabase.from('notifications').insert({
        user_id: userId,
        type: 'INFO',
        title,
        message,
        is_read: false,
        link_path: 'ATTENDANCE',
        related_id: relatedId || null,
        metadata: metadata || null
    });
}

/**
 * Sends a rejection notification to the user.
 */
export async function sendRejectionNotification(userId: string, title: string, message: string, relatedId?: string, metadata?: any) {
    return supabase.from('notifications').insert({
        user_id: userId,
        type: 'INFO',
        title,
        message,
        is_read: false,
        link_path: 'ATTENDANCE',
        related_id: relatedId || null,
        metadata: metadata || null
    });
}

/**
 * Sends an approval/rejection summary notification to the LINE group.
 */
export async function sendGroupSummaryNotification(
    employeeId: string, 
    employeeName: string, 
    requestType: string, 
    adminName: string, 
    statusText: string, 
    reason: string = '',
    relatedId?: string,
    metadata?: any
) {
    let message = `พนักงาน: ${employeeName}\nประเภทคำขอ: ${requestType}\nสถานะ: ${statusText}\nผู้พิจารณา: ${adminName}`;
    if (reason) {
        message += `\nหมายเหตุ: ${reason}`;
    }
    
    return supabase.from('notifications').insert({
        user_id: employeeId,
        type: 'APPROVAL_SUMMARY',
        title: `อัปเดตคำขอ: ${employeeName}`,
        message,
        is_read: false,
        link_path: 'ATTENDANCE',
        related_id: relatedId || null,
        metadata: metadata || null
    });
}

/**
 * Publishes a dynamic status message or bot announcement to the team channel.
 */
export async function publishToTeamChannel(content: string) {
    return supabase.from('team_messages').insert({
        content,
        is_bot: true,
        message_type: 'TEXT',
        user_id: null
    });
}

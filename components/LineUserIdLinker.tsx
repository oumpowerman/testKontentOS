import React, { useEffect, useRef } from 'react';
import { useUserSession } from '../context/UserSessionContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';

export const LineUserIdLinker: React.FC = () => {
    const { currentUserProfile, updateProfile } = useUserSession();
    const { showConfirm, showAlert } = useGlobalDialog();
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (!currentUserProfile || hasProcessed.current) return;

        const params = new URLSearchParams(window.location.search);
        let lineUserId = params.get('line_user_id')?.trim();

        // Fallback to sessionStorage if not found in current URL
        if (!lineUserId) {
            lineUserId = sessionStorage.getItem('pending_line_user_id')?.trim() || undefined;
        }

        if (!lineUserId) return;

        hasProcessed.current = true;

        const handleLinking = async () => {
            const cleanUp = () => {
                // 1. Remove line_user_id parameter from address bar
                const newParams = new URLSearchParams(window.location.search);
                newParams.delete('line_user_id');
                const newSearch = newParams.toString();
                const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
                window.history.replaceState({}, '', newUrl);

                // 2. Clear pending item from sessionStorage so the banner goes away
                sessionStorage.removeItem('pending_line_user_id');
            };

            const incomingId = lineUserId!.trim();

            if (currentUserProfile.lineUserId === incomingId) {
                await showAlert(
                    'บัญชี LINE ID นี้ได้รับการเชื่อมต่อกับระบบ Juijui Planner ของคุณเรียบร้อยแล้ว!',
                    '🔗 เชื่อมต่อเสร็จสิ้น'
                );
                cleanUp();
                return;
            }

            const confirmed = await showConfirm(
                `คุณต้องการเชื่อมต่อบัญชี LINE ID: "${incomingId}" เข้ากับระบบ Juijui Planner ของคุณหรือไม่? เพื่อรับสิทธิ์การแจ้งเตือนงานและการอนุมัติทันใจผ่านไลน์`,
                '🔗 ยืนยันการเชื่อมต่อ LINE'
            );

            if (confirmed) {
                const success = await updateProfile({ lineUserId: incomingId });
                if (success) {
                    await showAlert(
                        'เชื่อมต่อบัญชี LINE สำเร็จ! คุณจะได้รับการแจ้งเตือนแบบ Flex Message ทันทีเมื่อมีการอัปเดตสถิติ งาน หรือการอนุมัติภายในระบบ',
                        '✅ เชื่อมต่อสำเร็จ'
                    );
                }
            }
            
            cleanUp();
        };

        handleLinking();
    }, [currentUserProfile, updateProfile, showConfirm, showAlert]);

    return null;
};

export default LineUserIdLinker;

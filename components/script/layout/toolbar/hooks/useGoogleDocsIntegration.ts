import { useState, useEffect } from 'react';
import { googleDriveService } from '../../../../../services/googleDriveService';
import { useToast } from '../../../../../context/ToastContext';

export const useGoogleDocsIntegration = () => {
    const { showToast } = useToast();
    const [isConnectedToDoc, setIsConnectedToDoc] = useState(false);
    const [isCheckingDoc, setIsCheckingDoc] = useState(true);
    const [showExportConfirm, setShowExportConfirm] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportResult, setExportResult] = useState<{ id: string; name: string; webViewLink: string } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Check connection status on mount
    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            try {
                const statusInfo = await googleDriveService.getStatus();
                if (isMounted) {
                    setIsConnectedToDoc(statusInfo);
                }
            } catch (err) {
                console.error("Failed to check Google Docs connection status", err);
            } finally {
                if (isMounted) {
                    setIsCheckingDoc(false);
                }
            }
        };
        checkStatus();
        return () => {
            isMounted = false;
        };
    }, []);

    // Listen to Google Auth Events from popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                setIsConnectedToDoc(true);
                showToast('เชื่อมต่อ Google Docs สำเร็จเรียบร้อย!', 'success');
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'GOOGLE_AUTH_TIMESTAMP') {
                setIsConnectedToDoc(true);
                showToast('เชื่อมต่อ Google Docs สำเร็จเรียบร้อย!', 'success');
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [showToast]);

    // Google Docs Connection Actions
    const handleConnectGoogle = async () => {
        const width = 600;
        const height = 650;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        
        // Open a blank window synchronously to capture the user gesture context which avoids Safari's popup blocker
        const popup = window.open('about:blank', 'GoogleAuth', `width=${width},height=${height},left=${left},top=${top}`);
        
        if (!popup) {
            showToast('ระบบป๊อปอัปถูกบล็อก กรุณาเปิดสิทธิ์การใช้งานป๊อปอัป (Popup) บนอุปกรณ์ก่อนเชื่อมต่อครับ', 'error');
            return;
        }

        try {
            const url = await googleDriveService.getAuthUrl();
            if (url) {
                popup.location.href = url;
            } else {
                popup.close();
                showToast('ไม่สามารถดึงลิงก์เชื่อมต่อ Google Docs ได้', 'error');
            }
        } catch (err) {
            console.error(err);
            popup.close();
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Docs', 'error');
        }
    };

    const handleExport = async (title: string, content: string) => {
        setShowExportConfirm(false);
        setIsExporting(true);
        try {
            const result = await googleDriveService.exportToGoogleDocs(title || 'Untitled Script', content);
            setExportResult(result);
            setShowSuccessModal(true);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || 'ส่งออกสคริปต์ไปยัง Google Docs ไม่สำเร็จ', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    return {
        isConnectedToDoc,
        setIsConnectedToDoc,
        isCheckingDoc,
        showExportConfirm,
        setShowExportConfirm,
        isExporting,
        exportResult,
        showSuccessModal,
        setShowSuccessModal,
        handleConnectGoogle,
        handleExport
    };
};

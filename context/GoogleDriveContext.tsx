
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from './ToastContext';

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

interface GoogleDriveContextType {
    isReady: boolean;
    isUploading: boolean;
    isAuthenticated: boolean;
    accessToken: string | null;
    login: () => void;
    logout: () => void;
    retry: () => void;
    uploadFileToDrive: (file: File, folderPath?: string[]) => Promise<any>;
    openDrivePicker: (onSelect: (file: any) => void) => void;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || ''; 
const API_KEY = (import.meta as any).env.VITE_GOOGLE_PICKER_API_KEY || ''; 
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const MAIN_FOLDER_NAME = 'Juijui_Uploads';

export const GoogleDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isReady, setIsReady] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchServerToken = async () => {
        try {
            const response = await fetch('/api/auth/google/token');
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data && data.accessToken) {
                        setAccessToken(data.accessToken);
                        return data.accessToken;
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching server token:', error);
        }
        return null;
    };

    const pendingAction = useRef<'PICK' | 'UPLOAD' | null>(null);
    const pendingFile = useRef<File | null>(null);
    const pendingCallback = useRef<((result: any) => void) | null>(null);
    const pendingReject = useRef<((error: any) => void) | null>(null);
    const pendingFolderPath = useRef<string[]>([]);

    const initGoogleScripts = () => {
        if (!CLIENT_ID || !API_KEY) return;

        const loadScript = (src: string) => {
            return new Promise((resolve, reject) => {
                const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
                if (existingScript) {
                    if (existingScript.dataset.loaded === 'true') resolve(true);
                    else {
                        existingScript.addEventListener('load', () => resolve(true));
                        existingScript.addEventListener('error', reject);
                    }
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    script.dataset.loaded = 'true';
                    resolve(true);
                };
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };

        Promise.all([
            loadScript('https://apis.google.com/js/api.js'),
            loadScript('https://accounts.google.com/gsi/client'),
        ]).then(() => {
            if (window.gapi) {
                window.gapi.load('picker', () => setIsReady(true));
            }
            if (window.google?.accounts?.oauth2) {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (response: any) => handleTokenCallback(response),
                });
                setTokenClient(client);
            }
        }).catch(err => {
            console.error("Failed to load Google Scripts", err);
            showToast('ไม่สามารถโหลดระบบ Google Drive ได้ กรุณาตรวจสอบการเชื่อมต่อ', 'error');
        });
    };

    useEffect(() => {
        initGoogleScripts();
        fetchServerToken();

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                fetchServerToken();
            }
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'GOOGLE_AUTH_TIMESTAMP') {
                fetchServerToken();
                // Clean up to avoid multiple triggers
                try { localStorage.removeItem('GOOGLE_AUTH_TIMESTAMP'); } catch(e) {}
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const retry = () => {
        setIsReady(false);
        setTokenClient(null);
        initGoogleScripts();
    };

    const logout = async () => {
        setAccessToken(null);
        try {
            await fetch('/api/auth/google/logout', { method: 'POST' });
        } catch (e) {
            console.error("Logout failed", e);
        }
        showToast('ตัดการเชื่อมต่อ Google Drive แล้ว', 'info');
    };

    const handleTokenCallback = (response: any) => {
        if (response.error !== undefined) {
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive', 'error');
            setIsUploading(false);
            if (pendingReject.current) {
                pendingReject.current(new Error(response.error_description || response.error || 'Auth failed'));
                pendingReject.current = null;
            }
            return;
        }
        
        const token = response.access_token;
        setAccessToken(token);
        showToast('เชื่อมต่อ Google Drive สำเร็จ 🔓', 'success');

        if (pendingAction.current === 'PICK') {
            createPicker(token, pendingCallback.current);
        } else if (pendingAction.current === 'UPLOAD' && pendingFile.current) {
            performUpload(token, pendingFile.current, pendingCallback.current, pendingFolderPath.current, pendingReject.current);
        }
        pendingAction.current = null;
    };

    const login = async () => {
        // 1. Open a placeholder window IMMEDIATELY to satisfy Safari's user-interaction requirement
        const authWindow = window.open('about:blank', 'google_auth', 'width=600,height=700');
        
        if (!authWindow) {
            showToast('กรุณาอนุญาตการเปิดป๊อปอัพในเบราว์เซอร์ของคุณ เพื่อเชื่อมต่อ Google Drive', 'error');
            return;
        }

        // Show a loading message in the placeholder window while fetching the URL
        authWindow.document.write(`
            <html>
                <head>
                    <title>Connecting to Google...</title>
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                            display: flex; flex-direction: column; align-items: center; justify-content: center; 
                            height: 100vh; margin: 0; background: #f9fafb; color: #4b5563; text-align: center;
                        }
                        .spinner { 
                            border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; 
                            width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 16px; 
                        }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        h2 { font-size: 18px; margin: 0 0 8px 0; color: #1f2937; }
                        p { font-size: 14px; margin: 0; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <div class="spinner"></div>
                    <h2>กำลังเชื่อมต่อกับ Google Drive</h2>
                    <p>กรุณารอสักครู่ ระบบกำลังพาคุณไปยังหน้ายืนยันตัวตน...</p>
                </body>
            </html>
        `);

        try {
            // 2. Fetch the actual OAuth URL from our server
            const response = await fetch('/api/auth/google/url');
            const data = await response.json();
            
            if (!response.ok || !data.url) {
                throw new Error(data.error || 'Failed to get auth URL');
            }
            
            // 3. Update the existing window's location to the actual Google Auth URL
            authWindow.location.href = data.url;
        } catch (error: any) {
            console.error('Login error:', error);
            authWindow.close(); // Close the failed window
            showToast(error.message || 'ไม่สามารถเริ่มการเชื่อมต่อได้', 'error');
        }
    };

    const ensureFolder = async (token: string, folderName: string, parentId?: string): Promise<string> => {
        let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        if (parentId) q += ` and '${parentId}' in parents`;
        const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) return searchData.files[0].id;

        const metadata: any = { name: folderName, mimeType: 'application/vnd.google-apps.folder' };
        if (parentId) metadata.parents = [parentId];
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify(metadata)
        });
        const folderData = await createResponse.json();
        return folderData.id;
    };

    const createPicker = (token: string, onSelect: ((file: any) => void) | null) => {
        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes('image/png,image/jpeg,image/heic,image/heif,video/mp4,application/pdf,application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet');
        const picker = new window.google.picker.PickerBuilder()
            .addView(view).setOAuthToken(token).setDeveloperKey(API_KEY)
            .setCallback((data: any) => {
                if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                    const doc = data[window.google.picker.Response.DOCUMENTS][0];
                    if (onSelect) onSelect({
                        id: doc[window.google.picker.Document.ID],
                        name: doc[window.google.picker.Document.NAME],
                        url: doc[window.google.picker.Document.URL],
                        mimeType: doc[window.google.picker.Document.MIME_TYPE],
                        iconUrl: doc[window.google.picker.Document.ICON_URL],
                        thumbnailUrl: doc[window.google.picker.Document.THUMBNAIL_URL]
                    });
                }
            }).build();
        picker.setVisible(true);
    };

    const performUpload = async (token: string, file: File, onComplete: any, folderPath: string[], onError: any) => {
        try {
            let currentParentId = await ensureFolder(token, MAIN_FOLDER_NAME);
            for (const folderName of folderPath) {
                if (currentParentId) currentParentId = await ensureFolder(token, folderName, currentParentId);
            }
            const metadata = { name: file.name, mimeType: file.type, parents: currentParentId ? [currentParentId] : [] };
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', file);
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink,thumbnailLink,name', {
                method: 'POST', headers: new Headers({ 'Authorization': 'Bearer ' + token }), body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const googleError = errorData.error || {};
                const errorMessage = googleError.message || 'Upload failed';
                const errorReason = googleError.errors?.[0]?.reason || 'unknown';
                
                // --- SESSION INTEGRITY: If unauthorized, clear token ---
                if (response.status === 401 || errorReason === 'authError' || errorReason === 'invalid_grant') {
                    setAccessToken(null);
                    showToast('การเชื่อมต่อ Google Drive หมดอายุ กรุณาเข้าสู่ระบบใหม่', 'warning');
                }

                const richError = new Error(errorMessage);
                (richError as any).reason = errorReason;
                (richError as any).details = googleError;
                throw richError;
            }
            
            const data = await response.json();
            await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
                method: 'POST', headers: new Headers({ 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }),
                body: JSON.stringify({ role: 'reader', type: 'anyone' })
            });
            const result = {
                name: data.name, url: data.webViewLink, mimeType: file.type,
                downloadUrl: data.webContentLink, thumbnailUrl: data.thumbnailLink?.replace(/=s\d+$/, '=s1200')
            };
            if (onComplete) onComplete(result);
            showToast(`อัปโหลดไฟล์เรียบร้อย 📂`, 'success');
        } catch (error: any) {
            const msg = error.message ? `: ${error.message}` : '';
            showToast(`อัปโหลดไป Drive ไม่สำเร็จ${msg}`, 'error');
            if (onError) onError(error);
        } finally {
            setIsUploading(false);
            pendingFile.current = null;
            pendingFolderPath.current = [];
            pendingReject.current = null;
        }
    };

    const uploadFileToDrive = (file: File, folderPath: string[] = []): Promise<any> => {
        return new Promise(async (resolve, reject) => {
            if (!isReady || !tokenClient) {
                showToast('Google Drive API ยังไม่พร้อม', 'error');
                return reject(new Error('Not ready'));
            }
            const timeoutId = setTimeout(() => {
                setIsUploading(false);
                reject(new Error('Timeout'));
            }, 60000);
            const onComplete = (res: any) => { clearTimeout(timeoutId); resolve(res); };
            const onError = (err: any) => { clearTimeout(timeoutId); reject(err); };
            if (accessToken) {
                setIsUploading(true);
                performUpload(accessToken, file, onComplete, folderPath, onError);
            } else {
                const token = await fetchServerToken();
                if (token) {
                    setIsUploading(true);
                    performUpload(token, file, onComplete, folderPath, onError);
                } else {
                    pendingAction.current = 'UPLOAD';
                    pendingFile.current = file;
                    pendingCallback.current = onComplete;
                    pendingReject.current = onError;
                    pendingFolderPath.current = folderPath;
                    setIsUploading(true);
                    login();
                }
            }
        });
    };

    const openDrivePicker = async (onSelect: any) => {
        if (!isReady) return showToast('Google Drive API ยังไม่พร้อม', 'error');
        if (accessToken) return createPicker(accessToken, onSelect);
        
        const token = await fetchServerToken();
        if (token) return createPicker(token, onSelect);

        pendingAction.current = 'PICK';
        pendingCallback.current = onSelect;
        login();
    };

    return (
        <GoogleDriveContext.Provider value={{ isReady, isUploading, isAuthenticated: !!accessToken, accessToken, login, logout, retry, uploadFileToDrive, openDrivePicker }}>
            {children}
        </GoogleDriveContext.Provider>
    );
};

export const useGoogleDriveContext = () => {
    const context = useContext(GoogleDriveContext);
    if (context === undefined) throw new Error('useGoogleDriveContext must be used within a GoogleDriveProvider');
    return context;
};

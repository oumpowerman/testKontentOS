
import React, { useState, useEffect } from 'react';
import { User, Task } from '../types';
import { format } from 'date-fns';
import { useTeamChat } from '../hooks/useTeamChat';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { compressImage } from '../lib/imageUtils';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { Loader2 } from 'lucide-react';

// Import Refactored Sub-Components
import ChatHeader from './team-chat/ChatHeader';
import MessageList from './team-chat/MessageList';
import ChatInput from './team-chat/ChatInput';
import ChatSidebar from './team-chat/ChatSidebar';

interface TeamChatProps {
    currentUser: User | null;
    allUsers: User[];
    onAddTask: (task: Task) => void;
}

const TeamChat: React.FC<TeamChatProps> = ({ currentUser, allUsers, onAddTask }) => {
    const { showAlert, showConfirm } = useGlobalDialog();
    // --- State ---
    const [isBotEnabled, setIsBotEnabled] = useState(true);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // --- Hooks ---
    const { messages, isLoading, isLoadingMore, hasMore, loadMore, sendMessage, sendFile, markAsRead } = useTeamChat(currentUser, allUsers, onAddTask, isBotEnabled);
    const { uploadFileToDrive, isReady: isDriveReady, isAuthenticated: isDriveAuthenticated, login: connectDrive } = useGoogleDrive();
    
    // Mark as read on mount
    useEffect(() => {
        markAsRead();
    }, []);

    // --- File Upload Logic ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            if (!isDriveAuthenticated) {
                const confirmConnect = await showConfirm(
                    "เพื่อความปลอดภัยและเก็บไฟล์บน Cloud กรุณาเชื่อมต่อ Google Drive ของคุณก่อนส่งไฟล์ คุณต้องการเชื่อมต่อตอนนี้เลยหรือไม่?",
                    "กรุณาเชื่อมต่อ Google Drive"
                );
                if (confirmConnect) {
                    connectDrive();
                }
                return;
            }

            setIsProcessingFile(true);
            setUploadStatus('กำลังประมวลผลรูป...');

            try {
                // 1. Compression
                let fileToSend = file;
                if (file.type.startsWith('image/')) {
                    setUploadStatus('กำลังย่อรูป...');
                    fileToSend = await compressImage(file);
                }

                // 2. Upload Strategy
                const currentYear = format(new Date(), 'yyyy');
                const currentMonth = format(new Date(), 'MM');
                
                const driveUploader = async (f: File): Promise<string> => {
                    setUploadStatus('กำลังอัปโหลดไป Drive...');
                    const result = await uploadFileToDrive(f, ['Juijui_Assets', 'Chat', currentYear, currentMonth]);
                    return result.thumbnailUrl || result.url;
                };

                // 3. Send
                await sendFile(fileToSend, isDriveReady ? driveUploader : undefined);

            } catch (error: any) {
                console.error("File processing error:", error);
                const errorStr = error?.message || '';
                if (errorStr.includes('unauthorized') || errorStr.includes('auth') || errorStr.includes('401') || errorStr.includes('token') || errorStr.includes('expire')) {
                    showAlert("การเชื่อมต่อ Google Drive หมดอายุหรือยังไม่ได้รับสิทธิ์ กรุณาเชื่อมต่อใหม่อีกครั้ง", "การเชื่อมต่อผิดพลาด");
                } else {
                    showAlert("เกิดข้อผิดพลาดในการส่งไฟล์: " + errorStr, "ข้อผิดพลาด");
                }
            } finally {
                setIsProcessingFile(false);
                setUploadStatus('');
                // Reset file input is handled inside ChatInput component logic if needed, 
                // but since we pass the event here, we might need a way to clear it there.
                // In this refactor, ChatInput manages the ref reset.
            }
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 p-0 lg:p-6 pb-24 lg:pb-0">
            <div className="flex-1 flex gap-0 lg:gap-6 overflow-hidden h-full">
                
                {/* Main Chat Area */}
                <div className="flex-1 bg-white rounded-none lg:rounded-2xl shadow-none lg:shadow-sm border-0 lg:border border-gray-200 flex flex-col overflow-hidden relative">
                    
                    <ChatHeader 
                        isBotEnabled={isBotEnabled} 
                        setIsBotEnabled={setIsBotEnabled} 
                        allUsers={allUsers} 
                        isSidebarOpen={isSidebarOpen}
                        setIsSidebarOpen={setIsSidebarOpen}
                    />

                    {/* Google Drive Warning Banner */}
                    {!isDriveAuthenticated && (
                        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center justify-between gap-3 text-amber-800 text-xs shrink-0 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">⚠️</span>
                                <span><b>กรุณาเชื่อมต่อ Google Drive:</b> ระบบจำเป็นต้องใช้ Google Drive ของคุณในการเก็บและแสดงรูปภาพในแชต</span>
                            </div>
                            <button 
                                onClick={connectDrive} 
                                className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1 rounded-lg transition-colors shrink-0"
                            >
                                เชื่อมต่อ Google Drive
                            </button>
                        </div>
                    )}

                    <MessageList 
                        messages={messages}
                        currentUser={currentUser}
                        isLoading={isLoading}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        onLoadMore={loadMore}
                    />

                    <ChatInput 
                        onSendMessage={sendMessage}
                        onSendFile={handleFileChange}
                        isProcessingFile={isProcessingFile}
                        uploadStatus={uploadStatus}
                        isBotEnabled={isBotEnabled}
                        isDriveReady={isDriveReady}
                        isDriveAuthenticated={isDriveAuthenticated}
                        onConnectDrive={connectDrive}
                    />

                    {/* Visual Reloading Blur Overlay */}
                    {isProcessingFile && (
                        <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
                            <div className="p-5 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-3 max-w-xs text-center">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                <div className="text-sm font-semibold text-gray-800">กำลังอัปโหลดรูปภาพ</div>
                                <div className="text-xs text-gray-500 animate-pulse">{uploadStatus || 'กรุณารอสักครู่...'}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (Responsive: Inline on desktop, Drawer on mobile/tablet) */}
                <ChatSidebar 
                    isBotEnabled={isBotEnabled}
                    allUsers={allUsers}
                    isOpenMobile={isSidebarOpen}
                    onCloseMobile={() => setIsSidebarOpen(false)}
                />
            </div>
        </div>
    );
};

export default TeamChat;

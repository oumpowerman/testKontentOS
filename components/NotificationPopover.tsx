
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Settings, X, CheckSquare, Zap, Users, Info } from 'lucide-react';
import { AppNotification, Task, ViewMode } from '../types';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { LeaveRequest } from '../types/attendance';
import NotificationList, { NotificationTab } from './notification/NotificationList';

interface NotificationPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: AppNotification[];
    tasks: Task[];
    onOpenTask: (task: Task) => void;
    onOpenSettings: () => void;
    onDismiss?: (id: string) => void;
    onMarkAllRead?: () => void;
    onNavigate: (view: ViewMode) => void; 
    onApproveLeave?: (request: LeaveRequest) => Promise<void>;
    onRejectLeave?: (id: string, reason: string) => Promise<void>;
    leaveRequests?: LeaveRequest[];
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ 
    isOpen, onClose, notifications, tasks, onOpenTask, onOpenSettings, onDismiss, onMarkAllRead, onNavigate,
    onApproveLeave, onRejectLeave, leaveRequests = []
}) => {
    const { showAlert } = useGlobalDialog();
    const [activeTab, setActiveTab] = useState<NotificationTab>('ALL');
    const contentRef = useRef<HTMLDivElement>(null);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleItemClick = (notification: AppNotification) => {
        if (notification.taskId) {
            // Case 1: Open Task
            const task = tasks.find(t => t.id === notification.taskId);
            if (task) {
                onOpenTask(task);
                onClose();
            }
        } else if (notification.actionLink) {
            // Case 2: Navigate to specific module (e.g. FINANCE, ATTENDANCE)
            onNavigate(notification.actionLink as ViewMode);
            onClose();
        } else if (notification.type === 'APPROVAL_REQ') {
             // Default fallback for approval if link is missing
             onNavigate('ATTENDANCE');
             onClose();
        }
    };
    
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        // Optimistic UI: Dismiss immediately for snappiness
        if (onDismiss) onDismiss(id);
        
        setIsActionLoading(id);

        if (id.startsWith('leave_')) {
            const leaveId = id.replace('leave_', '');
            const request = leaveRequests.find(r => r.id === leaveId);
            
            try {
                if (action === 'APPROVE') {
                    if (request && onApproveLeave) {
                        await onApproveLeave(request);
                    }
                } else {
                    if (onRejectLeave) {
                        await onRejectLeave(leaveId, 'Rejected via notification');
                    }
                }
            } catch (err) {
                console.error("Action failed:", err);
            } finally {
                setIsActionLoading(null);
            }
        } else {
            setIsActionLoading(null);
            await showAlert(`${action} Notification ${id} (Mock Action)`);
        }
    };

    if (!isOpen) return null;

    const portalRoot = document.getElementById('portal-root') || document.body;

    // Calc Counts for Badges
    const urgentCount = notifications.filter(n => (n.type === 'OVERDUE' || n.type === 'GAME_PENALTY') && !n.isRead).length;
    const peopleCount = notifications.filter(n => (n.type === 'APPROVAL_REQ') && !n.isRead).length;

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div 
                ref={contentRef}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border-4 border-white ring-1 ring-gray-200"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0 z-20 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg tracking-tight">การแจ้งเตือน</h3>
                            <p className="text-sm text-gray-400 font-medium flex items-center gap-1">
                                {notifications.filter(n => !n.isRead).length} เรื่องใหม่
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {notifications.length > 0 && onMarkAllRead && (
                             <button 
                                onClick={onMarkAllRead}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                title="อ่านทั้งหมด"
                             >
                                 <CheckSquare className="w-5 h-5" />
                             </button>
                        )}
                        <button 
                            onClick={() => { onOpenSettings(); onClose(); }}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-2 bg-white flex gap-2 border-b border-gray-100 shrink-0 z-10 overflow-x-auto scrollbar-hide">
                    <button 
                        onClick={() => setActiveTab('ALL')}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${activeTab === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        ทั้งหมด
                    </button>
                    <button 
                        onClick={() => setActiveTab('URGENT')}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-1 ${activeTab === 'URGENT' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-500'}`}
                    >
                        <Zap className="w-3 h-3" /> ด่วน
                        {urgentCount > 0 && <span className="bg-white text-red-500 text-[9px] px-1.5 rounded-full">{urgentCount}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('PEOPLE')}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-1 ${activeTab === 'PEOPLE' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-500'}`}
                    >
                        <Users className="w-3 h-3" /> คน
                        {peopleCount > 0 && <span className="bg-white text-green-500 text-[9px] px-1.5 rounded-full">{peopleCount}</span>}
                    </button>
                     <button 
                        onClick={() => setActiveTab('SYSTEM')}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-1 ${activeTab === 'SYSTEM' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-500'}`}
                    >
                        <Info className="w-3 h-3" /> ระบบ
                    </button>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2 scrollbar-thin scrollbar-thumb-gray-200">
                    <NotificationList 
                        notifications={notifications}
                        activeTab={activeTab}
                        onItemClick={handleItemClick}
                        onDismiss={onDismiss || (() => {})}
                        onAction={handleAction}
                    />
                </div>
            </div>
        </div>,
        portalRoot
    );
};

export default NotificationPopover;

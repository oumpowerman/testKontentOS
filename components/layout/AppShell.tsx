
import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import MobileNavigation from '../MobileNavigation';
import ConnectionStatus from '../ConnectionStatus';
import { User, ViewMode, TaskType } from '../../types';

interface AppShellProps {
    currentUser: User;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    onLogout: () => void | Promise<void>;
    onEditProfile: () => void;
    onAddTask: (type?: TaskType) => void;
    onOpenTask: (task: any) => void;
    chatUnreadCount: number;
    systemUnreadCount: number;
    isNotificationOpen: boolean;
    onToggleNotification: () => void;
    tasks: any[];
    allUsers: User[];
    children: React.ReactNode;
    onOpenChatAssistant?: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ 
    currentUser, 
    currentView, 
    onNavigate, 
    onLogout, 
    onEditProfile, 
    onAddTask, 
    onOpenTask,
    chatUnreadCount,
    systemUnreadCount,
    isNotificationOpen,
    onToggleNotification,
    tasks,
    allUsers,
    children,
    onOpenChatAssistant
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const isEdgeToEdgeView = [
        'DASHBOARD', 'QUALITY_GATE', 'GOALS', 'SCRIPT_HUB', 'CHECKLIST', 'ContentStock',
        'ANALYTICS', 'FINANCE', 'ATTENDANCE', 'DUTY', 'NEXUS', 'WIKI',
        'CALENDAR', 'WEEKLY', 'TEAM', 'FEEDBACK', 'ASSETS', 'CHANNELS', 'MASTER_DATA', 'SYSTEM_GUIDE', 'CHAT'
    ].includes(currentView);
    
    // Legacy mapping for existing logic
    const isDarkTheme = currentView === 'QUALITY_GATE' || currentView === 'GOALS';

    return (
        <div className={`flex h-[100dvh] overflow-hidden font-sans transition-colors duration-500 ${isDarkTheme ? 'bg-slate-950 text-white' : 'bg-[#f8fafc] text-gray-900'}`}>
            <ConnectionStatus />
            
            {/* Desktop Sidebar */}
            <Sidebar 
                currentUser={currentUser}
                currentView={currentView}
                onNavigate={onNavigate}
                onLogout={onLogout}
                onEditProfile={onEditProfile}
                onAddTask={() => onAddTask()}
                unreadChatCount={chatUnreadCount}
                systemUnreadCount={systemUnreadCount} // Added
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <div className={`flex-1 min-h-0 ${currentView === 'CHAT' ? 'p-0 overflow-hidden flex flex-col' : isEdgeToEdgeView ? 'p-0 overflow-auto scrollbar-hide' : 'p-4 md:p-6 pb-24 lg:pb-6 overflow-auto scrollbar-hide'}`}>
                    {children}
                </div>
            </main>

            {/* Mobile Navigation */}
            <MobileNavigation 
                currentUser={currentUser}
                currentView={currentView}
                onNavigate={onNavigate}
                onAddTask={onAddTask}
                onLogout={onLogout}
                onEditProfile={onEditProfile}
                onOpenTask={onOpenTask}
                unreadChatCount={chatUnreadCount}
                tasks={tasks}
                users={allUsers}
                onOpenChatAssistant={onOpenChatAssistant}
            />
        </div>
    );
};

export default AppShell;

import React from 'react';
import { User, ViewMode } from '../../types';
import SidebarBadge from '../SidebarBadge';

interface MobileNavItemProps {
    item: {
        view: ViewMode;
        icon: React.ComponentType<{ className?: string }>;
        label: string;
    };
    isActive: boolean;
    isDarkTheme: boolean;
    color: string;
    currentUser: User;
    unreadChatCount?: number;
    onClick: () => void;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({
    item,
    isActive,
    isDarkTheme,
    color,
    currentUser,
    unreadChatCount,
    onClick,
}) => {
    const Icon = item.icon;

    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center p-1.5 min-[360px]:p-2 rounded-2xl border transition-all relative group active:scale-95 h-18 min-[360px]:h-20
                ${isActive 
                    ? isDarkTheme ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/40' : 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : isDarkTheme ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md'}
            `}
        >
            <div className={`p-1.5 min-[360px]:p-2 rounded-xl mb-1 min-[360px]:mb-1.5 transition-colors ${isActive ? 'bg-white text-indigo-600 shadow-sm' : `${color} bg-opacity-10`}`}>
                <Icon className={`w-5 h-5 min-[360px]:w-5 min-[360px]:h-5 ${isActive ? 'text-indigo-600' : color.replace('bg-', 'text-').replace('/10', '')}`} />
            </div>
            <span className={`text-[9px] min-[360px]:text-[10px] font-bold text-center leading-tight truncate w-full ${isActive ? (isDarkTheme ? 'text-white' : 'text-indigo-700') : (isDarkTheme ? 'text-slate-400' : 'text-gray-500')}`}>
                {item.label}
            </span>
            
            {/* Real-time Badge */}
            <div className="absolute top-1 right-1 min-[360px]:top-1.5 min-[360px]:right-1.5">
                <SidebarBadge 
                    view={item.view} 
                    currentUser={currentUser} 
                    count={item.view === 'CHAT' ? unreadChatCount : undefined}
                />
            </div>
        </button>
    );
};

export default MobileNavItem;

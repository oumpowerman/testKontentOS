
import React from 'react';
import { Bot, Power, Users } from 'lucide-react';
import { User } from '../../types';

interface ChatHeaderProps {
    isBotEnabled: boolean;
    setIsBotEnabled: (enabled: boolean) => void;
    allUsers: User[];
    isSidebarOpen?: boolean;
    setIsSidebarOpen?: (open: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
    isBotEnabled, 
    setIsBotEnabled, 
    allUsers,
    isSidebarOpen = false,
    setIsSidebarOpen 
}) => {
    return (
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-white flex justify-between items-center z-20 shadow-sm shrink-0">
            <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-800 flex items-center gap-1.5 truncate">
                    💬 ห้องแชททีม (Team Space)
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isBotEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                    <p className="text-[11px] sm:text-xs text-gray-400 truncate">
                        {isBotEnabled ? 'Juijui AI กำลังสแตนด์บาย...' : 'Juijui AI ปิดใช้งานอยู่'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                 <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-200">
                    <button onClick={() => setIsBotEnabled(false)} className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 ${!isBotEnabled ? 'bg-white shadow text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Power className="w-3 h-3" /> Off
                    </button>
                    <button onClick={() => setIsBotEnabled(true)} className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 ${isBotEnabled ? 'bg-indigo-600 shadow text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Bot className="w-3 h-3" /> On
                    </button>
                </div>
                <div className="flex -space-x-1.5 hidden md:flex">
                    {allUsers.slice(0, 5).map(u => (
                        <img key={u.id} src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white object-cover" title={u.name} />
                    ))}
                </div>

                {setIsSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`lg:hidden p-2 rounded-xl border transition-all flex items-center justify-center relative ${isSidebarOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        title="ดูสมาชิกและวิธีใช้งาน"
                    >
                        <Users className="w-5 h-5" />
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;

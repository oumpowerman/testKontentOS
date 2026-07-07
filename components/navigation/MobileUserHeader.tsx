import React from 'react';
import { Heart, Trophy, Minimize2, Maximize2, X } from 'lucide-react';
import { User } from '../../types';
import SkinManager from '../dashboard/member/welcome-header/SkinManager';
import { MobileSkinTheme } from './MobileSkinThemes';

interface MobileUserHeaderProps {
    currentUser: User;
    isFullscreen: boolean;
    isIOS: boolean;
    toggleFullScreen: () => void;
    onClose: () => void;
    onEditProfile: () => void;
    activeSkinTheme: MobileSkinTheme;
    progressPercent: number;
    getStatusColor: (status: string) => string;
}

const MobileUserHeader: React.FC<MobileUserHeaderProps> = ({
    currentUser,
    isFullscreen,
    isIOS,
    toggleFullScreen,
    onClose,
    onEditProfile,
    activeSkinTheme,
    progressPercent,
    getStatusColor,
}) => {
    return (
        <div className={`${activeSkinTheme.cardBg} p-4 pb-6 min-[375px]:p-6 min-[375px]:pb-8 rounded-b-[2.5rem] min-[375px]:rounded-b-[3rem] shadow-2xl relative overflow-hidden shrink-0 transition-all duration-300`}>
            {/* Ambient Blur Circles */}
            <div className={`absolute top-0 right-0 w-64 h-64 ${activeSkinTheme.blur1Color} rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none`}></div>
            <div className={`absolute bottom-0 left-0 w-48 h-48 ${activeSkinTheme.blur2Color} rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none`}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4 min-[375px]:mb-6">
                    <div className="flex items-center gap-3 min-[375px]:gap-4 active:opacity-80 transition-opacity min-w-0" onClick={onEditProfile}>
                        <div className="relative">
                            <SkinManager user={currentUser} mode="avatar">
                                <img 
                                    src={currentUser.avatarUrl} 
                                    className="w-full h-full object-cover" 
                                    alt={currentUser.name} 
                                    referrerPolicy="no-referrer" 
                                />
                            </SkinManager>
                            <div className={`absolute bottom-0.5 right-0.5 ${getStatusColor(currentUser.workStatus || 'ONLINE')} w-3.5 h-3.5 min-[375px]:w-4 min-[375px]:h-4 rounded-full border-2 border-slate-900 z-[50]`}></div>
                        </div>
                        <div className="min-w-0">
                            <h2 className={`text-base min-[375px]:text-xl font-black tracking-tight truncate max-w-[110px] min-[360px]:max-w-[140px] min-[400px]:max-w-[180px] min-[500px]:max-w-none ${activeSkinTheme.titleColor}`}>
                                {currentUser.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] min-[375px]:text-xs font-bold border rounded-lg backdrop-blur-sm truncate ${activeSkinTheme.badgeBg} px-2 py-0.5`}>
                                    {currentUser.position}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 min-[375px]:gap-2 ml-2 flex-shrink-0">
                        <button 
                            onClick={toggleFullScreen}
                            className={`p-2 rounded-full transition-colors ${activeSkinTheme.headerBtnClass} ${isIOS ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4 min-[375px]:w-5 min-[375px]:h-5" /> : <Maximize2 className="w-4 h-4 min-[375px]:w-5 min-[375px]:h-5" />}
                        </button>
                        <button 
                            onClick={onClose} 
                            className={`p-2 rounded-full transition-colors ${activeSkinTheme.headerBtnClass}`}
                        >
                            <X className="w-4 h-4 min-[375px]:w-5 min-[375px]:h-5" />
                        </button>
                    </div>
                </div>

                {/* Mini Stats Bar */}
                <div className="flex gap-2.5 min-[375px]:gap-3">
                    <div className={`flex-1 ${activeSkinTheme.badgeBg} rounded-2xl p-2 min-[375px]:p-3 backdrop-blur-md border shadow-inner`}>
                        <div className={`flex justify-between items-center text-[9px] min-[375px]:text-[10px] font-bold ${activeSkinTheme.statLabelColor} mb-1`}>
                            <span className="flex items-center">
                                <Heart className={`w-3 h-3 mr-1 ${currentUser.hp <= 0 ? 'text-red-600 animate-pulse' : 'text-red-400'} fill-current`} /> 
                                HP
                            </span>
                            <span className={currentUser.hp < 0 ? 'text-red-400 font-black' : ''}>{currentUser.hp}/{currentUser.maxHp}</span>
                        </div>
                        <div className={`h-1 ${activeSkinTheme.hpBg} rounded-full overflow-hidden`}>
                            <div 
                                className={`h-full transition-all duration-500 ${currentUser.hp <= 0 ? 'bg-red-700' : activeSkinTheme.hpFill}`} 
                                style={{ width: `${Math.max(0, Math.min(100, (currentUser.hp / (currentUser.maxHp || 100)) * 100))}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className={`flex-1 ${activeSkinTheme.badgeBg} rounded-2xl p-2 min-[375px]:p-3 backdrop-blur-md border shadow-inner`}>
                        <div className={`flex justify-between items-center text-[9px] min-[375px]:text-[10px] font-bold ${activeSkinTheme.statLabelColor} mb-1`}>
                            <span className="flex items-center">
                                <Trophy className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" /> 
                                Lv.{currentUser.level}
                            </span>
                            <span>{progressPercent.toFixed(0)}%</span>
                        </div>
                        <div className={`h-1 ${activeSkinTheme.xpBg} rounded-full overflow-hidden`}>
                            <div 
                                className={`h-full ${activeSkinTheme.xpFill} rounded-full transition-all duration-500`} 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileUserHeader;

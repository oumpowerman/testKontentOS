
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutGrid, Calendar as CalendarIcon, MessageCircle, Menu, X, 
    Film, ClipboardList, BookOpen, ScanEye, Coffee, Target, TrendingUp, 
    LogOut, BarChart3, Megaphone, FileText, Presentation, Settings2, 
    Database, Users, Terminal, User as UserIcon, Shield, Trophy, Heart, Crown, Clock,
    Maximize2, Minimize2, Monitor, DollarSign, Briefcase, Clapperboard, Building2, ShieldCheck, Share2,
    Plus, Hash, ArrowRight, ArrowLeft, Search, ChevronRight, Inbox, Sparkles, Bot, ChevronUp
} from 'lucide-react';
import { User, ViewMode, TaskType, MenuGroup, Task } from '../types';
import { useMobileBackHandler } from '../hooks/useMobileBackHandler';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useWorkboxContext } from '../context/WorkboxContext';
import SidebarBadge from './SidebarBadge';
import CommandPalette from '../components/ui/CommandPalette';
import { useMasterDataContext } from '../context/MasterDataContext';
import SkinManager from './dashboard/member/welcome-header/SkinManager';
import { MOBILE_SKIN_THEMES } from './navigation/MobileSkinThemes';
import MobileUserHeader from './navigation/MobileUserHeader';
import MobileNavItem from './navigation/MobileNavItem';


interface MobileNavigationProps {
    currentUser: User;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    onAddTask: (type?: TaskType) => void;
    onLogout: () => void;
    onEditProfile: () => void;
    onOpenTask: (task: Task) => void;
    unreadChatCount: number;
    tasks: Task[];
    users: User[];
    onOpenChatAssistant?: () => void;
}

// --- Menu Configuration (Synced with Sidebar) ---
const MOBILE_MENU_GROUPS: MenuGroup[] = [
  {
    id: 'WORKSPACE',
    title: 'Workspace',
    icon: Briefcase,
    items: [
      { view: 'DASHBOARD', label: 'ภาพรวม', icon: LayoutGrid },
      { view: 'CALENDAR', label: 'ปฏิทิน', icon: CalendarIcon },
      { view: 'CHAT', label: 'แชททีม', icon: MessageCircle },
      { view: 'TEAM', label: 'ทีมงาน', icon: Users },
      { view: 'NEXUS', label: 'Nexus Hub', icon: Share2 },
      { view: 'WEEKLY', label: 'ภารกิจ', icon: Target },
      { view: 'GOALS', label: 'เป้าหมาย', icon: TrendingUp },
    ]
  },
  {
    id: 'PRODUCTION',
    title: 'Production',
    icon: Clapperboard,
    items: [
      { view: 'SCRIPT_HUB', label: 'เขียนบท', icon: FileText },
      { view: 'MEETINGS', label: 'ประชุม', icon: Presentation },
      { view: 'ContentStock', label: 'คลังคลิป', icon: Film },
      { view: 'CHECKLIST', label: 'จัดเป๋า', icon: ClipboardList },
    ]
  },
  {
    id: 'OFFICE',
    title: 'Office',
    icon: Building2,
    items: [
      { view: 'ATTENDANCE', label: 'ลงเวลา', icon: Clock },
      { view: 'LEADERBOARD', label: 'Hall of Fame', icon: Crown },
      { view: 'DUTY', label: 'เวรวันนี้', icon: Coffee },
      { view: 'KPI', label: 'ประเมินผล', icon: BarChart3 },
      { view: 'FEEDBACK', label: 'Voice', icon: Megaphone },
      { view: 'WIKI', label: 'คู่มือ', icon: BookOpen },
      { view: 'ASSETS', label: 'ทรัพย์สิน', icon: Monitor }, // Added
      { view: 'FINANCE', label: 'บัญชี', icon: DollarSign }, // Added
    ]
  },
  {
    id: 'ADMIN',
    title: 'Admin Zone',
    icon: ShieldCheck,
    adminOnly: true,
    items: [
      { view: 'QUALITY_GATE', label: 'ห้องตรวจ', icon: ScanEye },
      { view: 'CHANNELS', label: 'ช่องทาง', icon: Settings2 },
      { view: 'MASTER_DATA', label: 'ตั้งค่าระบบ', icon: Database },
      { view: 'SYSTEM_GUIDE', label: 'Logic', icon: Terminal },
    ]
  }
];

interface MobileMenuButtonProps {
    view: ViewMode;
    icon: any;
    label: string;
    color: string;
    currentView: ViewMode;
    onNavigate: (v: ViewMode) => void;
    currentUser: User;
    unreadChatCount: number;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ 
    view, icon: Icon, label, color, currentView, onNavigate, currentUser, unreadChatCount 
}) => {
    const isActive = currentView === view;
    return (
        <button
            onClick={() => onNavigate(view)}
            className={`
                flex flex-col items-center justify-center p-2 rounded-2xl border transition-all relative group active:scale-95 h-20
                ${isActive 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md'}
            `}
        >
            <div className={`p-2 rounded-xl mb-1.5 transition-colors ${isActive ? 'bg-white text-indigo-600 shadow-sm' : `${color} bg-opacity-10`}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : color.replace('bg-', 'text-').replace('/10', '')}`} />
            </div>
            <span className={`text-[10px] font-bold text-center leading-tight truncate w-full ${isActive ? 'text-indigo-700' : 'text-gray-500'}`}>{label}</span>
            
            {/* Real-time Badge */}
            <div className="absolute top-1.5 right-1.5">
                <SidebarBadge 
                    view={view} 
                    currentUser={currentUser} 
                    count={view === 'CHAT' ? unreadChatCount : undefined}
                />
            </div>
        </button>
    );
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
    currentUser, currentView, onNavigate, onAddTask, onLogout, onEditProfile, onOpenTask, unreadChatCount, tasks, users, onOpenChatAssistant 
}) => {
    const { showAlert } = useGlobalDialog();
    const { isDocked, setIsOpen, items: workboxItems } = useWorkboxContext();
    const workboxItemsCount = workboxItems.length;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    // --- SIDEBAR CONFIG INTEGRATION ---
    const { masterOptions } = useMasterDataContext();

    const activeViews = useMemo(() => {
      const config = masterOptions.find(o => o.type === 'SIDEBAR_CONFIG' && o.key === 'ACTIVE_MENUS');
      if (!config) return null;
      try {
        return JSON.parse(config.label) as string[];
      } catch (e) {
        console.error("Failed to parse sidebar config", e);
        return null;
      }
    }, [masterOptions]);

    const filteredMenuGroups = useMemo(() => {
      if (!activeViews || activeViews.length === 0) return MOBILE_MENU_GROUPS;
      return MOBILE_MENU_GROUPS.map(group => {
        const visibleItems = group.items.filter(item => activeViews.includes(item.view));
        return {
          ...group,
          items: visibleItems
        };
      }).filter(group => group.items.length > 0);
    }, [activeViews]);
    const [activePanel, setActivePanel] = useState<'MENU' | 'SEARCH'>('MENU');
    const containerRef = React.useRef<HTMLDivElement>(null);
    
    // Bottom Dock remains always visible
    const isDockVisible = true;

    // Theme Logic
    const isDarkTheme = currentView === 'QUALITY_GATE' || currentView === 'GOALS';
    
    const themeClasses = {
        dock: isDarkTheme ? 'bg-slate-950/90 border-white/10 ring-white/5' : 'bg-white/95 border-white/50 ring-black/5',
        dockItemIdle: isDarkTheme ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
        dockItemActive: isDarkTheme ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'bg-indigo-600 text-white shadow-md shadow-indigo-200',
        menuDrawer: isDarkTheme ? 'bg-slate-950' : 'bg-[#f8fafc]',
        menuHeader: isDarkTheme ? 'bg-slate-900' : 'bg-slate-900', // Both are dark, but could be different
        menuFooter: isDarkTheme ? 'bg-slate-950 border-white/5' : 'bg-white border-gray-100',
        groupTitle: isDarkTheme ? 'text-slate-500' : 'text-gray-400',
        divider: isDarkTheme ? 'bg-white/5' : 'bg-gray-200'
    };
    
    // Hooks
    useMobileBackHandler(isMenuOpen, () => {
        if (activePanel === 'SEARCH') {
            setActivePanel('MENU');
        } else {
            setIsMenuOpen(false);
        }
    });

    useEffect(() => {
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement || 
                           !!(document as any).webkitFullscreenElement || 
                           !!(document as any).mozFullScreenElement;
            setIsFullscreen(isFull);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        };
    }, []);

    const handleNavigateAndClose = (view: ViewMode) => {
        onNavigate(view);
        setIsMenuOpen(false);
    };

    const handleDragEnd = (e: any, info: any) => {
        const threshold = 30; // Reduced threshold
        const velocityThreshold = 300; // Reduced velocity threshold
        
        if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
            if (activePanel === 'MENU') setActivePanel('SEARCH');
        } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
            if (activePanel === 'SEARCH') setActivePanel('MENU');
        }
    };

    const toggleFullScreen = async () => {
        const doc = window.document as any;
        const docEl = doc.documentElement as any;

        try {
            const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

            if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
                if (requestFullScreen) {
                    await requestFullScreen.call(docEl);
                    setIsFullscreen(true);
                }
            } else {
                if (cancelFullScreen) {
                    await cancelFullScreen.call(doc);
                    setIsFullscreen(false);
                }
            }
        } catch (err) {
            console.warn("Fullscreen toggle error:", err);
            if (isIOS) showAlert("บน iOS กรุณาใช้เมนู Share > 'Add to Home Screen' เพื่อใช้งานเต็มจอครับ", "คำแนะนำ");
        }
    };

    // Calculate Level Progress
    const nextLevelXP = currentUser.level * 1000;
    const progressPercent = Math.min(((currentUser.xp % 1000) / 1000) * 100, 100);

    const skinId = (currentUser as any).equippedFrameId || 'default';
    const activeSkinTheme = MOBILE_SKIN_THEMES[skinId] || MOBILE_SKIN_THEMES['default'];

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'ONLINE': return 'bg-green-500';
            case 'BUSY': return 'bg-red-500';
            case 'SICK': return 'bg-orange-500';
            case 'VACATION': return 'bg-blue-500';
            case 'MEETING': return 'bg-purple-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <>
            {/* --- BOTTOM DOCK (Floating with Collapsible Sliding Animation) --- */}
            <motion.div 
                animate={{ y: isDockVisible ? 0 : '120%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="fixed bottom-0 left-0 right-0 z-30 p-3 pb-safe-area lg:hidden pointer-events-none mobile-nav-dock"
            >
                <div className={`backdrop-blur-xl border shadow-[0_8px_30px_rgb(0,0,0,0.15)] rounded-[2rem] p-1.5 flex items-center justify-between pointer-events-auto gap-1 max-w-sm mx-auto ring-1 ${themeClasses.dock}`}>
                    {[
                        { view: 'DASHBOARD', icon: LayoutGrid, label: 'Home' },
                        { view: 'CALENDAR', icon: CalendarIcon, label: 'Plan' },
                        { view: 'CHAT', icon: MessageCircle, label: 'Chat' },
                        { view: 'TEAM', icon: Users, label: 'Team' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.view;

                        return (
                            <button
                                key={item.view}
                                onClick={() => onNavigate(item.view as ViewMode)}
                                className={`
                                    relative flex-1 flex flex-col items-center justify-center h-[56px] rounded-[1.5rem] transition-all duration-300
                                    ${isActive ? themeClasses.dockItemActive : themeClasses.dockItemIdle}
                                `}
                            >
                                <Icon className={`w-6 h-6 mb-0.5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
                                <div className="absolute top-1.5 right-1.5">
                                    <SidebarBadge 
                                        view={item.view as ViewMode} 
                                        currentUser={currentUser} 
                                        count={item.view === 'CHAT' ? unreadChatCount : undefined}
                                    />
                                </div>
                            </button>
                        );
                    })}
                    
                    <div className={`w-px h-8 ${themeClasses.divider} mx-1`}></div>

                    <motion.button
                        onTap={() => {
                            setActivePanel('MENU');
                            setIsMenuOpen(true);
                        }}
                        onPanEnd={(_, info) => {
                            if (info.offset.y < -30) {
                                setActivePanel('SEARCH');
                                setIsMenuOpen(true);
                            }
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            relative flex-1 flex flex-col items-center justify-center h-[56px] rounded-[1.5rem] transition-all duration-300
                            ${isMenuOpen ? 'bg-gray-800 text-white' : themeClasses.dockItemIdle}
                        `}
                    >
                        <Menu className="w-6 h-6 mb-0.5" />
                        <span className="text-[9px] font-bold">Menu</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* --- FULL SCREEN MENU DRAWER --- */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className={`fixed inset-0 z-[9999] ${themeClasses.menuDrawer} lg:hidden flex flex-col h-[100dvh]`}
                    >
                        
                        {/* Header: User Profile & Stats */}
                        <MobileUserHeader
                            currentUser={currentUser}
                            isFullscreen={isFullscreen}
                            isIOS={isIOS}
                            toggleFullScreen={toggleFullScreen}
                            onClose={() => setIsMenuOpen(false)}
                            onEditProfile={onEditProfile}
                            activeSkinTheme={activeSkinTheme}
                            progressPercent={progressPercent}
                            getStatusColor={getStatusColor}
                        />


                    {/* Main Content Area (Swipable Panels) */}
                    <div className="flex-1 overflow-hidden relative" ref={containerRef} style={{ touchAction: 'pan-y' }}>
                        <motion.div 
                            className="flex h-full w-[200%]"
                            animate={{ x: activePanel === 'MENU' ? 0 : '-50%' }}
                            transition={{ type: 'spring', damping: 35, stiffness: 350, mass: 0.5 }}
                            drag="x"
                            dragDirectionLock
                            dragConstraints={containerRef}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}
                        >
                            {/* PANEL 1: MENU GRID */}
                            <div className="w-1/2 h-full overflow-y-auto p-4 min-[375px]:p-5 pb-32 space-y-6 min-[375px]:space-y-8 scrollbar-hide">
                                {isDocked && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setIsOpen(true);
                                            setIsMenuOpen(false); // Close mobile navigation drawer
                                        }}
                                        className={`
                                            w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden group/btn
                                            ${isDarkTheme 
                                                ? 'bg-indigo-600/20 border-indigo-500/20 text-indigo-200' 
                                                : 'bg-indigo-50 border-indigo-100 text-indigo-700'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={`p-2 rounded-xl transition-colors duration-300 ${isDarkTheme ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white text-indigo-600 shadow-sm'}`}>
                                                <Inbox className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <h5 className="text-sm font-black tracking-tight">กล่องเก็บงาน (WorkBox)</h5>
                                                <p className={`text-[10px] ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-500'} font-bold`}>สลับสับเปลี่ยนหรือฝากงานได้รวดเร็ว</p>
                                            </div>
                                        </div>
                                        {workboxItemsCount > 0 && (
                                            <div className="flex items-center gap-1 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm relative z-10">
                                                <span>{workboxItemsCount} รายการ</span>
                                            </div>
                                        )}
                                    </motion.button>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (onOpenChatAssistant) {
                                            onOpenChatAssistant();
                                        }
                                        setIsMenuOpen(false); // Close mobile navigation drawer
                                    }}
                                    className={`
                                        w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden group/btn
                                        ${isDarkTheme 
                                            ? 'bg-purple-600/20 border-purple-500/20 text-purple-200' 
                                            : 'bg-purple-50 border-purple-100 text-purple-700'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`p-2 rounded-xl transition-colors duration-300 ${isDarkTheme ? 'bg-purple-500/20 text-purple-300' : 'bg-white text-purple-600 shadow-sm'}`}>
                                            <Bot className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <h5 className="text-sm font-black tracking-tight flex items-center gap-1">
                                                ผู้ช่วย Juijui Bot (AI) <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                            </h5>
                                            <p className={`text-[10px] ${isDarkTheme ? 'text-purple-400' : 'text-purple-500'} font-bold`}>สั่งงาน สร้างโปรเจกต์ หรือพูดคุยสอบถาม 🤖</p>
                                        </div>
                                    </div>
                                </motion.button>

                                {filteredMenuGroups.map((group) => {
                                    if (group.adminOnly && currentUser.role !== 'ADMIN') return null;
                                    return (
                                        <div key={group.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <h4 className={`text-[10px] min-[375px]:text-xs font-black ${themeClasses.groupTitle} uppercase tracking-widest mb-3 pl-1 flex items-center gap-2`}>
                                                {React.createElement(group.icon, { className: "w-3.5 h-3.5" })}
                                                {group.title}
                                                <div className={`h-px ${themeClasses.divider} flex-1 ml-2`}></div>
                                            </h4>
                                            <div className="grid grid-cols-3 min-[360px]:grid-cols-4 gap-2 min-[360px]:gap-3">
                                                {group.items.map((item) => {
                                                    let color = 'bg-gray-200';
                                                    if (group.id === 'WORKSPACE') color = 'bg-blue-500';
                                                    if (group.id === 'PRODUCTION') color = 'bg-pink-500';
                                                    if (group.id === 'OFFICE') color = 'bg-emerald-500';
                                                    if (group.id === 'ADMIN') color = 'bg-slate-600';

                                                    const isActive = currentView === item.view;

                                                    return (
                                                        <MobileNavItem
                                                            key={item.view}
                                                            item={item}
                                                            isActive={isActive}
                                                            isDarkTheme={isDarkTheme}
                                                            color={color}
                                                            currentUser={currentUser}
                                                            unreadChatCount={unreadChatCount}
                                                            onClick={() => handleNavigateAndClose(item.view)}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PANEL 2: SEARCH / COMMAND PALETTE */}
                            <div className={`w-1/2 h-full flex flex-col ${isDarkTheme ? 'bg-slate-950' : 'bg-white'}`}>
                                <CommandPalette 
                                    currentUser={currentUser}
                                    tasks={tasks}
                                    menuGroups={filteredMenuGroups}
                                    onNavigate={onNavigate}
                                    onAddTask={onAddTask}
                                    onEditProfile={onEditProfile}
                                    onLogout={onLogout}
                                    onOpenTask={onOpenTask}
                                    onClose={() => setIsMenuOpen(false)}
                                    isActive={isMenuOpen && activePanel === 'SEARCH'}
                                    isDarkTheme={isDarkTheme}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Footer Actions (Static) */}
                    <div className={`p-4 ${themeClasses.menuFooter} flex items-center justify-between pb-safe-area shrink-0`}>
                        {/* Pagination & Swipe Hint */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-2">
                            {/* Swipe Hint Text */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activePanel}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className={`flex items-center gap-1.5 text-[9px] min-[360px]:text-[10px] font-black ${isDarkTheme ? 'text-slate-600' : 'text-gray-400'} uppercase tracking-[0.2em]`}
                                >
                                    {activePanel === 'MENU' ? (
                                        <>
                                            <span>Swipe Left for Search</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </>
                                    ) : (
                                        <>
                                            <ArrowLeft className="w-3 h-3" />
                                            <span>Swipe Right for Menu</span>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Pagination Dots */}
                            <div className="flex items-center gap-1.5 h-1.5">
                                <motion.div 
                                    animate={{ 
                                        width: activePanel === 'MENU' ? 24 : 6,
                                        backgroundColor: activePanel === 'MENU' ? '#4f46e5' : '#e2e8f0'
                                    }}
                                    className="h-full rounded-full transition-colors duration-300"
                                />
                                <motion.div 
                                    animate={{ 
                                        width: activePanel === 'SEARCH' ? 24 : 6,
                                        backgroundColor: activePanel === 'SEARCH' ? '#4f46e5' : '#e2e8f0'
                                    }}
                                    className="h-full rounded-full transition-colors duration-300"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={onLogout}
                            className="p-3 bg-red-400/10 text-red-500 rounded-2xl active:scale-95 transition-all shrink-0"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default MobileNavigation;

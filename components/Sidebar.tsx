
import React, { useState, useMemo } from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Users, MessageCircle, Target, TrendingUp, Coffee, ScanEye, Film, ClipboardList, BookOpen, Settings2, Database, Briefcase, ShieldCheck, LogOut, Edit, Sparkles, BarChart3, Megaphone, FileText, Presentation, ChevronDown, ChevronRight, Building2, Clapperboard, Terminal, Clock, DollarSign, Crown, Monitor, Share2, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ViewMode, MenuGroup } from '../types';
import SidebarBadge from './SidebarBadge';
import NotificationPill from './NotificationPill';
import AIStatusBadge from './common/AIStatusBadge';
import { useMasterDataContext } from '../context/MasterDataContext';

interface SidebarProps {
  currentUser: User;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  onEditProfile: () => void;
  onAddTask: () => void;
  unreadChatCount: number;
  systemUnreadCount?: number; 
  isCollapsed: boolean;
  onToggleCollapse: (val: boolean) => void;
  onLogoTrigger?: () => void;
}


// Menu Groups Definition
export const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'WORKSPACE',
    title: 'Workspace',
    icon: Briefcase,
    items: [
      { view: 'DASHBOARD', label: 'ภาพรวม', icon: LayoutGrid },
      { view: 'ROADMAP', label: 'แผนงาน', icon: Map },
      { view: 'CALENDAR', label: 'ปฏิทิน & บอร์ด', icon: CalendarIcon }, 
      { view: 'CHAT', label: 'ห้องแชท', icon: MessageCircle },
      { view: 'TEAM', label: 'ทีมงาน', icon: Users },
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
      { view: 'MEETINGS', label: 'ห้องประชุม', icon: Presentation },
      { view: 'ContentStock', label: 'คลังคลิป', icon: Film },
      { view: 'ANALYTICS', label: 'วิเคราะห์ข้อมูล', icon: BarChart3 },
      { view: 'CHECKLIST', label: 'จัดเป๋า', icon: ClipboardList },
    ]
  },
  {
    id: 'OFFICE',
    title: 'Office',
    icon: Building2,
    items: [
      { view: 'ATTENDANCE', label: 'ลงเวลาทำงาน', icon: Clock },
      { view: 'LEADERBOARD', label: 'Hall of Fame', icon: Crown }, 
      { view: 'DUTY', label: 'ตารางเวร', icon: Coffee },
      { view: 'KPI', label: 'ประเมินผล', icon: BarChart3 }, 
      { view: 'FEEDBACK', label: 'Voice of Team', icon: Megaphone },
      { view: 'WIKI', label: 'คู่มือ', icon: BookOpen },
      { view: 'ASSETS', label: 'ทะเบียนทรัพย์สิน', icon: Monitor },
      { view: 'FINANCE', label: 'ระบบบัญชี', icon: DollarSign },
    ]
  },
  {
    id: 'ADMIN',
    title: 'Admin',
    icon: ShieldCheck,
    adminOnly: true,
    items: [
      { view: 'QUALITY_GATE', label: 'ห้องตรวจงาน', icon: ScanEye },
      { view: 'CHANNELS', label: 'จัดการช่องทาง', icon: Settings2 },
      { view: 'MASTER_DATA', label: 'ตั้งค่าระบบ', icon: Database },
      { view: 'SYSTEM_GUIDE', label: 'คู่มือระบบ (Logic)', icon: Terminal }, 
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, 
  currentView, 
  onNavigate, 
  onLogout, 
  onEditProfile, 
  unreadChatCount,
  systemUnreadCount = 0,
  isCollapsed,
  onToggleCollapse,
  onLogoTrigger
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  
  // --- SECRET SIDEBAR CONTROL CENTER EASTER EGG ---
  const { masterOptions } = useMasterDataContext();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

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
    if (!activeViews || activeViews.length === 0) return MENU_GROUPS;
    return MENU_GROUPS.map(group => {
      const visibleItems = group.items.filter(item => activeViews.includes(item.view));
      return {
        ...group,
        items: visibleItems
      };
    }).filter(group => group.items.length > 0);
  }, [activeViews]);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      setClickCount(1);
      setLastClickTime(now);
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 5) {
        setClickCount(0);
        onLogoTrigger?.();
      }
    }
  };

  // Theme Logic
  const isDarkTheme = currentView === 'QUALITY_GATE' || currentView === 'GOALS';
  
  // Dynamic seasonal theme detection
  const [activeBgTheme, setActiveBgTheme] = React.useState<string>(() => {
    return (window as any).__activeBackgroundTheme || (currentUser as any).equippedBgId || 'bg-pastel-wave';
  });

  React.useEffect(() => {
    const handleBgChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.theme) {
        setActiveBgTheme(detail.theme);
      }
    };
    window.addEventListener('app-background-changed', handleBgChange);
    return () => {
      window.removeEventListener('app-background-changed', handleBgChange);
    };
  }, []);

  const seasonStyle = useMemo(() => {
    // If not in the main DASHBOARD view, default to the elegant neutral/glassmorphic theme
    if (currentView !== 'DASHBOARD') {
      return {
        aside: isDarkTheme
          ? 'bg-slate-950/20 backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]'
          : 'bg-white/20 backdrop-blur-2xl border-r border-white/30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
        logoArea: isDarkTheme ? 'from-white/3 via-white/1 to-transparent' : 'from-indigo-500/4 via-indigo-500/1 to-transparent',
        footer: isDarkTheme ? 'border-t border-white/5 bg-transparent' : 'border-t border-slate-200/50 bg-transparent',
        userCard: isDarkTheme 
          ? 'hover:bg-white/5 hover:border-white/10 hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.05)]' 
          : 'hover:bg-indigo-500/5 hover:border-indigo-500/10 hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]',
        text: isDarkTheme ? 'text-slate-200/90' : 'text-slate-800/90',
        subtext: isDarkTheme ? 'text-slate-400/80' : 'text-slate-500/80',
        itemIdle: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-600 hover:text-indigo-700',
        itemActive: isDarkTheme ? 'text-indigo-300' : 'text-indigo-700',
        itemActiveColor: isDarkTheme ? 'text-indigo-300' : 'text-indigo-600',
        activeIcon: isDarkTheme ? 'text-indigo-300' : 'text-indigo-600',
        idleIcon: isDarkTheme ? 'text-slate-400 group-hover/btn:text-indigo-300' : 'text-slate-400 group-hover/btn:text-indigo-600',
        activePill: isDarkTheme ? 'bg-indigo-500/20 border border-indigo-400/20' : 'bg-indigo-50 border border-indigo-100',
        activeBar: isDarkTheme ? 'bg-indigo-400' : 'bg-indigo-500',
        hoverBg: isDarkTheme ? 'bg-white/5' : 'bg-slate-100',
        groupHeader: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-500 hover:text-indigo-600',
        brandAccentBg: 'bg-indigo-500',
        brandAccentText: 'text-indigo-500',
        brandAccentGradient: 'from-indigo-500/50',
        iconBg: isDarkTheme 
          ? 'bg-white/5 border border-white/10 text-slate-200 backdrop-blur-md shadow-sm hover:bg-white/10' 
          : 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 backdrop-blur-md shadow-sm hover:bg-indigo-500/10'
      };
    }

    switch (activeBgTheme) {
      case 'season-summer':
      case 'bg-season-summer':
        return {
          aside: 'bg-sky-50/15 backdrop-blur-3xl border-r border-sky-500/20 shadow-[4px_0_24px_rgba(14,165,233,0.05)]',
          logoArea: 'from-sky-400/5 via-sky-400/2 to-transparent',
          footer: 'border-t border-sky-500/10 bg-transparent',
          userCard: 'hover:bg-sky-500/10 hover:border-sky-500/20 hover:shadow-[0_4px_20px_-4px_rgba(14,165,233,0.15)]',
          text: 'text-sky-950 font-bold',
          subtext: 'text-sky-900/80 font-medium',
          iconBg: 'bg-sky-500/10 border border-sky-500/20 text-sky-600 backdrop-blur-md shadow-sm hover:bg-sky-500/15',
          itemIdle: 'text-sky-800/80 hover:text-sky-950 hover:bg-sky-500/5 font-semibold',
          itemActive: 'text-sky-950 font-black',
          itemActiveColor: 'text-sky-600',
          activeIcon: 'text-sky-600',
          idleIcon: 'text-sky-700/60 group-hover/btn:text-sky-600',
          activePill: 'bg-sky-500/10 border border-sky-500/20',
          activeBar: 'bg-sky-500',
          hoverBg: 'bg-sky-500/5',
          groupHeader: 'text-sky-800/70 hover:text-sky-950',
          brandAccentBg: 'bg-sky-500',
          brandAccentText: 'text-sky-600',
          brandAccentGradient: 'from-sky-500/50'
        };
      case 'season-snow':
      case 'bg-season-snow':
        return {
          aside: 'bg-white/10 backdrop-blur-3xl border-r border-white/20 shadow-[4px_0_24px_rgba(255,255,255,0.05)]',
          logoArea: 'from-white/15 via-sky-300/5 to-transparent',
          footer: 'border-t border-white/10 bg-transparent',
          userCard: 'hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.15)]',
          text: 'text-white font-bold',
          subtext: 'text-sky-200/80 font-medium',
          iconBg: 'bg-white/10 border border-white/20 text-white backdrop-blur-md hover:bg-white/20',
          itemIdle: 'text-sky-100/80 hover:text-white hover:bg-white/10 font-semibold',
          itemActive: 'text-white font-extrabold',
          itemActiveColor: 'text-white',
          activeIcon: 'text-white',
          idleIcon: 'text-sky-200/50 group-hover/btn:text-white',
          activePill: 'bg-white/15 border border-white/25 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md',
          activeBar: 'bg-white',
          hoverBg: 'bg-white/5',
          groupHeader: 'text-sky-200/50 hover:text-white',
          brandAccentBg: 'bg-sky-300',
          brandAccentText: 'text-sky-300',
          brandAccentGradient: 'from-sky-300/50'
        };
      case 'season-rain':
      case 'bg-season-rain':
        return {
          aside: 'bg-slate-950/15 backdrop-blur-3xl border-r border-slate-500/40 shadow-[4px_0_24px_rgba(0,0,0,0.25)]',
          logoArea: 'from-slate-500/15 via-slate-500/5 to-transparent',
          footer: 'border-t border-slate-600/40 bg-transparent',
          userCard: 'hover:bg-slate-800/40 hover:border-slate-700/50 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]',
          text: 'text-white font-bold',
          subtext: 'text-slate-300/80 font-medium',
          iconBg: 'bg-white/10 border border-white/15 text-white backdrop-blur-md hover:bg-white/15',
          itemIdle: 'text-slate-300/80 hover:text-white hover:bg-white/5 font-semibold',
          itemActive: 'text-white font-extrabold',
          itemActiveColor: 'text-white',
          activeIcon: 'text-white',
          idleIcon: 'text-slate-350 group-hover/btn:text-white',
          activePill: 'bg-white/10 border border-white/10 shadow-md backdrop-blur-md',
          activeBar: 'bg-white',
          hoverBg: 'bg-white/5',
          groupHeader: 'text-slate-100/70 hover:text-white',
          brandAccentBg: 'bg-slate-300',
          brandAccentText: 'text-slate-300',
          brandAccentGradient: 'from-slate-300/30'
        };
      case 'season-autumn':
      case 'bg-season-autumn':
        return {
          aside: 'bg-orange-50/15 backdrop-blur-3xl border-r border-orange-500/20 shadow-[4px_0_24px_rgba(249,115,22,0.05)]',
          logoArea: 'from-orange-400/5 via-orange-400/2 to-transparent',
          footer: 'border-t border-orange-500/10 bg-transparent',
          userCard: 'hover:bg-orange-500/10 hover:border-orange-500/20 hover:shadow-[0_4px_20px_-4px_rgba(249,115,22,0.15)]',
          text: 'text-orange-950 font-bold',
          subtext: 'text-orange-900/80 font-medium',
          iconBg: 'bg-orange-500/10 border border-orange-500/20 text-orange-600 backdrop-blur-md shadow-sm hover:bg-orange-500/15',
          itemIdle: 'text-orange-800/80 hover:text-orange-950 hover:bg-orange-500/5 font-semibold',
          itemActive: 'text-orange-950 font-black',
          itemActiveColor: 'text-orange-600',
          activeIcon: 'text-orange-600',
          idleIcon: 'text-orange-700/60 group-hover/btn:text-orange-600',
          activePill: 'bg-orange-500/10 border border-orange-500/20',
          activeBar: 'bg-orange-500',
          hoverBg: 'bg-orange-500/5',
          groupHeader: 'text-orange-800/70 hover:text-orange-950',
          brandAccentBg: 'bg-orange-500',
          brandAccentText: 'text-orange-600',
          brandAccentGradient: 'from-orange-500/50'
        };
      default:
        return {
          aside: isDarkTheme
            ? 'bg-slate-950/20 backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]'
            : 'bg-white/20 backdrop-blur-2xl border-r border-white/30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
          logoArea: isDarkTheme ? 'from-white/3 via-white/1 to-transparent' : 'from-indigo-500/4 via-indigo-500/1 to-transparent',
          footer: isDarkTheme ? 'border-t border-white/5 bg-transparent' : 'border-t border-slate-200/50 bg-transparent',
          userCard: isDarkTheme 
            ? 'hover:bg-white/5 hover:border-white/10 hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.05)]' 
            : 'hover:bg-indigo-500/5 hover:border-indigo-500/10 hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]',
          text: isDarkTheme ? 'text-slate-200/90' : 'text-slate-800/90',
          subtext: isDarkTheme ? 'text-slate-400/80' : 'text-slate-500/80',
          itemIdle: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-600 hover:text-indigo-700',
          itemActive: isDarkTheme ? 'text-indigo-300' : 'text-indigo-700',
          itemActiveColor: isDarkTheme ? 'text-indigo-300' : 'text-indigo-600',
          activeIcon: isDarkTheme ? 'text-indigo-300' : 'text-indigo-600',
          idleIcon: isDarkTheme ? 'text-slate-400 group-hover/btn:text-indigo-300' : 'text-slate-400 group-hover/btn:text-indigo-600',
          activePill: isDarkTheme ? 'bg-indigo-500/20 border border-indigo-400/20' : 'bg-indigo-50 border border-indigo-100',
          activeBar: isDarkTheme ? 'bg-indigo-400' : 'bg-indigo-500',
          hoverBg: isDarkTheme ? 'bg-white/5' : 'bg-slate-100',
          groupHeader: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-500 hover:text-indigo-600',
          brandAccentBg: 'bg-indigo-500',
          brandAccentText: 'text-indigo-500',
          brandAccentGradient: 'from-indigo-500/50',
          iconBg: isDarkTheme 
            ? 'bg-white/5 border border-white/10 text-slate-200 backdrop-blur-md shadow-sm hover:bg-white/10' 
            : 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 backdrop-blur-md shadow-sm hover:bg-indigo-500/10'
        };
    }
  }, [activeBgTheme, isDarkTheme, currentView]);

  const themeClasses = {
      aside: seasonStyle.aside,
      text: seasonStyle.text,
      subtext: seasonStyle.subtext,
      groupHeader: seasonStyle.groupHeader,
      itemIdle: seasonStyle.itemIdle,
      itemActive: seasonStyle.itemActive,
      itemActiveColor: seasonStyle.itemActiveColor,
      activeIcon: seasonStyle.activeIcon,
      idleIcon: seasonStyle.idleIcon,
      activePill: seasonStyle.activePill,
      activeBar: seasonStyle.activeBar,
      hoverBg: seasonStyle.hoverBg,
      brandAccentBg: seasonStyle.brandAccentBg,
      brandAccentText: seasonStyle.brandAccentText,
      brandAccentGradient: seasonStyle.brandAccentGradient,
      footer: seasonStyle.footer,
      userCard: seasonStyle.userCard,
      logoArea: seasonStyle.logoArea,
      iconBg: seasonStyle.iconBg
  };

  // State for Accordion
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
      'WORKSPACE': true,
      'PRODUCTION': true,
      'OFFICE': false,
      'ADMIN': false
  });

  const toggleGroup = (groupId: string) => {
      setExpandedGroups(prev => ({
          ...prev,
          [groupId]: !prev[groupId]
      }));
  };

  const handleMenuItemClick = (view: ViewMode) => {
      onNavigate(view);
  };

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
    <aside 
      onMouseEnter={() => onToggleCollapse(false)}
      onMouseLeave={() => onToggleCollapse(true)}
      className={`
        hidden lg:flex flex-col h-full ${themeClasses.aside} shrink-0 z-50 sidebar-transition relative
        ${isCollapsed ? 'w-[88px] sidebar-collapsed' : 'w-[280px] sidebar-expanded'}
      `}
    >
      {/* 1. Brand Logo Area */}
      <div onClick={handleLogoClick} className={`flex items-center bg-gradient-to-b ${themeClasses.logoArea} overflow-hidden cursor-pointer select-none ${isCollapsed ? 'px-5 py-8 justify-center' : 'px-8 py-8'}`}>
        <motion.div 
          initial={{ rotate: -10, scale: 0.9, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`
            ${themeClasses.iconBg} rounded-2xl flex items-center justify-center shrink-0 sidebar-icon relative overflow-hidden group transition-all duration-300
            ${isCollapsed ? 'w-12 h-12' : 'w-12 h-12 mr-4'}
          `}
        >
          <Sparkles className="w-7 h-7 stroke-[2.5px] relative z-10 transition-transform duration-300 group-hover:scale-110" />
          <motion.div 
            animate={{ 
              x: ['-100%', '200%'],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              ease: "linear" 
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          />
        </motion.div>
        
        {!isCollapsed && (
          <div className="sidebar-item-text">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                }
              }}
              className="flex items-center"
            >
              {"Kontent".split('').map((char, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 5 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className={`text-xl font-black ${themeClasses.text} tracking-tight leading-none font-inter drop-shadow-sm`}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex items-center gap-1.5 mt-1"
            >
              <div className={`h-[2px] w-4 ${themeClasses.brandAccentBg} rounded-full`} />
              <p className={`text-[10px] font-black ${themeClasses.brandAccentText} tracking-[0.3em] uppercase font-inter`}>OS</p>
              <div className={`h-[2px] flex-1 bg-gradient-to-r ${themeClasses.brandAccentGradient} to-transparent rounded-full`} />
            </motion.div>
          </div>
        )}
      </div>

      {/* 2. Menu Area */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-4 scrollbar-hide">
        {filteredMenuGroups.map((group) => {
          if (group.adminOnly && !isAdmin) return null;
          
          const isExpanded = expandedGroups[group.id];
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="mb-6">
              {/* Group Header */}
              {!isCollapsed ? (
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-6 py-2 ${themeClasses.groupHeader} transition-all group/header`}
                >
                    <div className="flex items-center gap-3">
                        <GroupIcon className="w-4 h-4 opacity-70" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] sidebar-item-text">
                          {group.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 sidebar-item-text">
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </div>
                </button>
              ) : (
                <div className="w-full flex justify-center py-2 text-slate-200 relative group/icon">
                   {/* Divider or Mini Icon when collapsed */}
                   <div className="w-10 h-px bg-slate-100"></div>
                   
                   {/* Tooltip for Group Name (Optional Enhancement) */}
                   <div className="absolute left-full ml-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/icon:opacity-100 pointer-events-none whitespace-nowrap z-50">
                       {group.title}
                   </div>
                </div>
              )}

              {/* Group Items */}
              <div className={`overflow-hidden transition-all duration-500 ${isCollapsed || isExpanded ? 'max-h-[800px]' : 'max-h-0'}`}>
                  <div className={`space-y-1.5 mt-2 ${isCollapsed ? 'px-3' : 'px-4'}`}>
                    {group.items.map((item) => {
                      const isActive = currentView === item.view;
                      const Icon = item.icon;

                      return (
                        <motion.button
                          key={item.view}
                          whileHover={{ x: isCollapsed ? 0 : 4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleMenuItemClick(item.view)}
                          className={`
                            w-full flex items-center rounded-2xl transition-all duration-300 relative group/btn overflow-hidden
                            ${isCollapsed ? 'justify-center py-3.5' : 'px-4 py-3'}
                            ${isActive ? themeClasses.itemActive : themeClasses.itemIdle}
                          `}
                          title={isCollapsed ? item.label : ''}
                        >
                          {/* Active Background Pill */}
                          {isActive && (
                            <motion.div 
                                layoutId="active-pill"
                                className={`absolute inset-0 z-0 ${themeClasses.activePill} shadow-sm`}
                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                            />
                          )}

                          {/* Active Indicator Bar */}
                          {isActive && (
                            <motion.div 
                                layoutId="active-bar"
                                className={`absolute left-0 top-1/4 bottom-1/4 w-1 ${themeClasses.activeBar} rounded-r-full z-10`}
                                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            />
                          )}

                          {/* Hover Background (When not active) */}
                          {!isActive && (
                            <div className={`absolute inset-0 z-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 ${themeClasses.hoverBg}`} />
                          )}

                          <div className={`relative shrink-0 z-10 transition-colors duration-300 ${isActive ? themeClasses.itemActiveColor : ''}`}>
                                <Icon className={`sidebar-icon ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? themeClasses.activeIcon : themeClasses.idleIcon}`} />
                                
                                {isCollapsed && (
                                     <div className="absolute -top-1.5 -right-1.5">
                                         <SidebarBadge 
                                            view={item.view as ViewMode} 
                                            currentUser={currentUser} 
                                            collapsed={true} 
                                            count={item.view === 'CHAT' ? unreadChatCount : undefined}
                                         />
                                     </div>
                                )}
                          </div>
                          
                          <span className={`sidebar-item-text flex-1 text-left text-sm font-bold tracking-tight ml-3.5 relative z-10 transition-colors duration-300 ${isActive ? themeClasses.itemActiveColor : ''}`}>
                             {item.label}
                          </span>
                          
                          {!isCollapsed && (
                             <div className="sidebar-item-text ml-auto relative z-10">
                                <SidebarBadge 
                                    view={item.view as ViewMode} 
                                    currentUser={currentUser} 
                                    count={item.view === 'CHAT' ? unreadChatCount : undefined}
                                />
                             </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2.5 AI Status Area */}
      <div className={`px-4 py-2 mb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <AIStatusBadge collapsed={isCollapsed} />
      </div>

      {/* 3. User Footer */}
      <div className={`${themeClasses.footer} p-4 transition-all`}>
        <div 
          className={`flex items-center rounded-[1.25rem] ${themeClasses.userCard} transition-all cursor-pointer group border border-transparent ${isCollapsed ? 'justify-center p-1' : 'gap-3 p-2.5'}`} 
          onClick={onEditProfile}
        >
          <div className="relative shrink-0 sidebar-icon">
            <img src={currentUser.avatarUrl} alt="User" className={`${isCollapsed ? 'w-12 h-12' : 'w-10 h-10'} rounded-full object-cover border-2 ${isDarkTheme ? 'border-white/10' : 'border-white'} shadow-sm`} />
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(currentUser.workStatus || 'ONLINE')} border-2 ${isDarkTheme ? 'border-slate-900' : 'border-white'} rounded-full`}></div>
          </div>
          
          <div className="sidebar-item-text flex-1 min-w-0">
            <p className={`text-sm font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'} truncate`}>{currentUser.name}</p>
            <p className="text-xs font-bold text-indigo-500 truncate uppercase tracking-tighter opacity-80">{currentUser.position || 'Member'}</p>
          </div>
          
          {!isCollapsed && (
            <div className="sidebar-item-text">
                <Edit className={`w-3.5 h-3.5 ${isDarkTheme ? 'text-slate-600' : 'text-slate-300'} group-hover:text-indigo-500`} />
            </div>
          )}
        </div>
        
        <button 
          onClick={onLogout}
          className={`
            w-full flex items-center justify-center gap-2 font-black transition-all uppercase tracking-[0.2em]
            ${isCollapsed ? 'mt-4 py-3 text-red-300 hover:text-red-500' : `mt-4 py-3 text-[10px] ${isDarkTheme ? 'text-slate-600 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'} rounded-xl`}
          `}
          title={isCollapsed ? 'ลงชื่อออก' : ''}
        >
          <LogOut className={`${isCollapsed ? 'w-6 h-6' : 'w-3.5 h-3.5'}`} /> 
          <span className="sidebar-item-text">ลงชื่อออก</span>
        </button>
      </div>
      
    </aside>
  );
};

export default Sidebar;

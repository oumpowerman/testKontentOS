
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, MasterOption, ViewMode } from '../types';
import AdminDashboard from './dashboard/AdminDashboard';
import MemberDashboard from './dashboard/MemberDashboard';
import { LayoutDashboard, UserCircle, Sparkles } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onNavigateToCalendar: () => void;
  onNavigate: (view: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number; 
  onEditProfile: () => void;
  masterOptions?: MasterOption[];
  onRefreshMasterData?: () => Promise<void>;
  onRefreshProfile?: () => Promise<any>;
  onFetchAllData?: () => void;
  isFetching?: boolean;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const isAdmin = props.currentUser.role === 'ADMIN';
  const [viewMode, setViewMode] = useState<'ADMIN' | 'MEMBER'>(isAdmin ? 'ADMIN' : 'MEMBER');
  const [isHovered, setIsHovered] = useState(false);

  const renderDashboard = () => {
    if (viewMode === 'ADMIN' && isAdmin) {
      return <AdminDashboard {...props} />;
    }

    return (
      <MemberDashboard 
        {...props} 
        masterOptions={props.masterOptions || []} 
        onNavigate={props.onNavigate}
        onRefreshProfile={props.onRefreshProfile}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-full relative">
      {isAdmin && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsHovered(!isHovered);
            }}
            animate={{ 
              width: isHovered ? 260 : 44,
              height: 44,
              borderRadius: isHovered ? "16px" : "9999px"
            }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto flex items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] ring-1 ring-black/5 overflow-hidden cursor-pointer"
          >
            <AnimatePresence mode="wait">
              {!isHovered ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center justify-center w-full h-full"
                  title="Hover/Tap to switch role"
                >
                  {viewMode === 'ADMIN' ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm">
                      <LayoutDashboard size={16} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white shadow-sm">
                      <UserCircle size={16} />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-1 p-1 w-full h-full"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode('ADMIN');
                    }}
                    className={`relative flex-1 h-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-black rounded-xl transition-all duration-300 z-10 ${
                      viewMode === 'ADMIN' ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {viewMode === 'ADMIN' && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <LayoutDashboard size={14} className="relative z-20" />
                    <span className="relative z-20">Admin</span>
                    {viewMode === 'ADMIN' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 z-30"
                      >
                        <Sparkles size={8} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                      </motion.div>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode('MEMBER');
                    }}
                    className={`relative flex-1 h-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-black rounded-xl transition-all duration-300 z-10 ${
                      viewMode === 'MEMBER' ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {viewMode === 'MEMBER' && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 rounded-xl shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <UserCircle size={14} className="relative z-20" />
                    <span className="relative z-20">Member</span>
                    {viewMode === 'MEMBER' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 z-30"
                      >
                        <Sparkles size={8} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                      </motion.div>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;

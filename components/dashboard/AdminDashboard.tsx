
import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Task, Channel, User, MasterOption } from '../../types';
import TaskCategoryModal from '../TaskCategoryModal';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import WorkloadModal from '../workload/WorkloadModal';
import AppBackground from '../common/AppBackground';

// Import Sub-components
import DashboardHeader from './admin/DashboardHeader';
import StatCardsGrid from './admin/StatCardsGrid';
import UrgentTasksWidget from './admin/UrgentTasksWidget';
import WorkloadChart from './admin/WorkloadChart';
import DutyRosterWidget from './admin/DutyRosterWidget';
import AttendanceComparisonWidget from './admin/AttendanceComparisonWidget';
import AdminDeadlineRequests from '../admin/AdminDeadlineRequests';
import TribunalReviewWidget from './admin/TribunalReviewWidget';

interface DashboardProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onNavigateToCalendar: () => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  onEditProfile: () => void;
  masterOptions?: MasterOption[];
  onRefreshMasterData?: () => Promise<void>;
  onFetchAllData?: () => void;
  isFetching?: boolean;
}

const AdminDashboard: React.FC<DashboardProps> = ({ 
    tasks, 
    channels, 
    users, 
    currentUser, 
    onEditTask, 
    onNavigateToCalendar, 
    onOpenSettings,
    onOpenNotifications,
    unreadCount = 0,
    masterOptions = []
}) => {
  
  const getCurrentSeason = () => {
      const month = new Date().getMonth();
      if (month >= 2 && month <= 4) return 'season-summer';
      if (month >= 5 && month <= 9) return 'season-rain';
      if (month >= 10 && month <= 11) return 'season-autumn';
      return 'season-snow';
  };

  const [currentSeason, setCurrentSeason] = useState<'season-summer' | 'season-rain' | 'season-snow' | 'season-autumn'>(getCurrentSeason());

  const {
      timeRange, setTimeRange,
      customDays, setCustomDays,
      viewScope, setViewScope,
      configLoading,
      currentTheme,
      cardStats,
      chartData,
      progressPercentage,
      getTimeRangeLabel,
      attendanceToday,
      attendanceYesterday
  } = useDashboardStats(tasks, currentUser);

  const [modalOpen, setModalOpen] = useState(false);
  const [isWorkloadOpen, setIsWorkloadOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTasks, setModalTasks] = useState<Task[]>([]);
  const [modalTheme, setModalTheme] = useState('blue');

  const handleCardClick = (title: string, tasks: Task[], theme: string) => {
    setModalTitle(title);
    const sortedTasks = [...tasks].sort((a, b) => {
        const timeA = new Date(a.endDate).getTime();
        const timeB = new Date(b.endDate).getTime();
        return timeA - timeB;
    });
    setModalTasks(sortedTasks);
    setModalTheme(theme);
    setModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12 }
    }
  };

  return (
    <AppBackground 
      theme={currentSeason} 
      pattern="dots" 
      className="p-4 md:p-8 min-h-screen"
    >
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 pb-24 relative"
      >
        {/* 1. Header Section */}
        <motion.div variants={itemVariants}>
          <DashboardHeader 
              currentUser={currentUser}
              currentThemeName={currentTheme.name}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              customDays={customDays}
              setCustomDays={setCustomDays}
              viewScope={viewScope}
              setViewScope={setViewScope}
              onOpenSettings={onOpenSettings}
              onOpenNotifications={onOpenNotifications} 
              unreadCount={unreadCount}
              getTimeRangeLabel={getTimeRangeLabel}
              onOpenWorkload={() => setIsWorkloadOpen(true)}
              currentSeason={currentSeason}
              onSeasonChange={setCurrentSeason}
          />
        </motion.div>

        {/* 2. Stats Grid (Themed) */}
        <motion.div variants={itemVariants}>
          <StatCardsGrid 
              stats={cardStats}
              loading={configLoading}
              currentTheme={currentTheme}
              onCardClick={handleCardClick}
              timeRangeLabel={getTimeRangeLabel()}
          />
        </motion.div>

        {/* 3. Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Urgent Tasks */}
          <motion.div variants={itemVariants} className="xl:col-span-2 space-y-8">
              <UrgentTasksWidget 
                  tasks={tasks}
                  channels={channels}
                  users={users}
                  masterOptions={masterOptions}
                  currentUser={currentUser}
                  viewScope={viewScope}
                  onEditTask={onEditTask}
                  onNavigateToCalendar={onNavigateToCalendar}
              />
          </motion.div>

          {/* Right Column: Widgets */}
          <div className="xl:col-span-1 space-y-8 flex flex-col">
            <motion.div variants={itemVariants} className="flex-shrink-0">
               <AdminDeadlineRequests currentUser={currentUser} users={users} tasks={tasks} />
            </motion.div>

            <motion.div variants={itemVariants} className="flex-shrink-0">
               <TribunalReviewWidget currentUser={currentUser} />
            </motion.div>

            <motion.div variants={itemVariants} className="flex-shrink-0">
               <AttendanceComparisonWidget 
                  todayStats={attendanceToday}
                  yesterdayStats={attendanceYesterday}
                  users={users}
               />
            </motion.div>

            <motion.div variants={itemVariants}>
              <WorkloadChart 
                  chartData={chartData}
                  progressPercentage={progressPercentage}
                  timeRangeLabel={getTimeRangeLabel()}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <DutyRosterWidget users={users} />
            </motion.div>
          </div>
        </div>

        <TaskCategoryModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          tasks={modalTasks}
          channels={channels}
          onEditTask={onEditTask}
          colorTheme={modalTheme}
        />

        <WorkloadModal 
          isOpen={isWorkloadOpen}
          onClose={() => setIsWorkloadOpen(false)}
          tasks={tasks}
          users={users}
          currentUser={currentUser}
          onOpenTask={onEditTask}
        />
      </motion.div>
    </AppBackground>
  );
};

export default AdminDashboard;
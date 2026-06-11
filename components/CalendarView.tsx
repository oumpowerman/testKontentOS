
import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { Minimize2, Loader2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, Status, MasterOption, TaskType } from '../types';
import MentorTip from './MentorTip';
import TaskCategoryModal from './TaskCategoryModal';
import { useCalendar } from '../hooks/useCalendar';
import CalendarHeader from './CalendarHeader';
import CalendarSecondaryHeader from './calendar/CalendarSecondaryHeader';
import SmartFilterModal from './SmartFilterModal';
import BoardView from './BoardView';
import CalendarGrid from './calendar/CalendarGrid';
import WeeklyView from './calendar/WeeklyView';
import { useCalendarHighlights } from '../hooks/useCalendarHightlights';
import DayHighlightModal from './calendar/DayHightlightModal';
import StockSidePanel from './StockSidePanel';
import DelayModal from './DelayModal';
import AppBackground, { BackgroundTheme } from './common/AppBackground';
import MobileLandscapeWrapper from './common/MobileLandscapeWrapper';
import { useGlobalDialog } from '../context/GlobalDialogContext';
export type TaskDisplayMode = 'MINIMAL' | 'DOT' | 'EMOJI' | 'FULL';
export type CalendarViewType = 'MONTH' | 'WEEK';

interface CalendarViewProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
  masterOptions?: MasterOption[];
  onSelectTask: (task: Task) => void;
  onSelectDate: (date: Date, type?: TaskType) => void;
  onMoveTask: (task: Task) => void; 
  onDelayTask?: (taskId: string, newDate: Date, reason: string) => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number; 
  onAddTask: (status: Status, type?: TaskType) => void;
  onUpdateStatus: (task: Task, newStatus: Status) => void;
  onRangeChange?: (targetDate: Date) => void; 
  isFetching?: boolean; 
  onToggleWorkbox?: () => void;
  isWorkboxOpen?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
    tasks, 
    channels, 
    users, 
    currentUser,
    masterOptions = [],
    onSelectTask, 
    onSelectDate, 
    onMoveTask, 
    onDelayTask, 
    onOpenSettings,
    onOpenNotifications,
    unreadCount = 0,
    onAddTask,
    onUpdateStatus,
    onRangeChange,
    isFetching = false,
    onToggleWorkbox,
    isWorkboxOpen
}) => {
  const {
      currentDate,
      viewMode, setViewMode,
      filterChannelId, setFilterChannelId,
      activeChipIds, toggleChip, toggleFilters, customChips,
      isExpanded, setIsExpanded,
      showFilters,
      startDate, endDate,
      nextMonth, prevMonth,
      nextWeek, prevWeek,
      goToToday,
      filterTasks, getTasksForDay,
      saveChip, deleteChip,
      handleDragStart, handleDragOver, handleDrop: internalHandleDrop, setDragOverDate, dragOverDate,
      isManageModalOpen, setIsManageModalOpen
  } = useCalendar({ 
      tasks, 
      userId: currentUser.id,
      onMoveTask: (t) => handleMoveAttempt(t) 
  });

  // --- Delay Logic ---
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [pendingDelayTask, setPendingDelayTask] = useState<Task | null>(null);

  const handleMoveAttempt = (updatedTask: Task) => {
      // const originalTask = tasks.find(t => t.id === updatedTask.id);
      
      // If moving to a LATER date (Delay)
      // if (originalTask && !originalTask.isUnscheduled && updatedTask.endDate > originalTask.endDate) {
      //     setPendingDelayTask(updatedTask);
      //     setDelayModalOpen(true);
      // } else {
          // Just a normal move (earlier or same day or from stock)
          onMoveTask(updatedTask);
      // }
  };

  const confirmDelay = (reason: string) => {
      if (pendingDelayTask && onDelayTask) {
          onDelayTask(pendingDelayTask.id, pendingDelayTask.endDate, reason);
          setDelayModalOpen(false);
          setPendingDelayTask(null);
      }
  };

  // --- Highlights Logic ---
  const { highlights, setHighlight, removeHighlight } = useCalendarHighlights(currentDate);
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [selectedHighlightDate, setSelectedHighlightDate] = useState<Date | null>(null);

  const [displayMode, setDisplayMode] = useState<'CALENDAR' | 'BOARD'>('CALENDAR');
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

  // --- View Density State ---
  const [taskDisplayMode, setTaskDisplayMode] = useState<TaskDisplayMode>('EMOJI');

  // --- Stock Panel State ---
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [calendarViewType, setCalendarViewType] = useState<CalendarViewType>('MONTH');

  // --- Mobile Landscape State ---
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  const { showAlert } = useGlobalDialog();

  useEffect(() => {
    if (isExpanded) {
      document.body.classList.add('calendar-focus-mode');
    } else {
      document.body.classList.remove('calendar-focus-mode');
    }
    return () => {
      document.body.classList.remove('calendar-focus-mode');
    };
  }, [isExpanded]);

  // Trigger Range Change when month changes
  useEffect(() => {
      if (onRangeChange) {
          onRangeChange(currentDate);
      }
  }, [currentDate, onRangeChange]);

  // Auto-close stock panel when switching to TASK mode
  useEffect(() => {
      if (viewMode === 'TASK' && isStockOpen) {
          setIsStockOpen(false);
      }
  }, [viewMode, isStockOpen]);

  // --- MEMOIZATION: Pre-calculate filtered tasks for the view (Used ONLY for Board View now) ---
  const filteredTasksForView = useMemo(() => {
      const filteredByView = filterTasks(tasks);
      // Also filter by date range for Board View to keep it synced with Calendar
      return filteredByView.filter(t => 
        !t.isUnscheduled && 
        t.endDate >= startDate && 
        t.endDate <= endDate
      );
  }, [tasks, viewMode, activeChipIds, customChips, startDate, endDate]); 

  const handleDayClick = (day: Date, dayTasks: Task[]) => {
      setSelectedDayDate(day);
      setSelectedDayTasks(dayTasks); 
      setIsListModalOpen(true);
  };

  const handleDayContextMenu = (day: Date) => {
      setSelectedHighlightDate(day);
      setHighlightModalOpen(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      setDragOverDate(null);
  };


  const bgTheme = useMemo(() => {
    const themes: BackgroundTheme[] = [
      'pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-purple', 'pastel-orange', 'pastel-yellow', 'pastel-teal'
    ];
    return themes[Math.floor(Math.random() * themes.length)];
  }, []);

  const containerClasses = isExpanded 
    ? "relative min-h-screen overflow-x-hidden p-2 md:p-6 pb-16 animate-in zoom-in-95 duration-300" 
    : "relative z-10 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 md:pb-24 overflow-x-hidden";

  return (
    <AppBackground 
      theme={bgTheme} 
      pattern="dots" 
      className={isExpanded ? "p-2 md:p-6 min-h-screen" : "p-4 md:p-8 min-h-screen"}
    >
      <div className={containerClasses}>
        {isExpanded && (
           <button 
             onClick={() => setIsExpanded(false)}
             className="absolute top-4 right-4 p-2.5 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full z-50 shadow-lg border border-gray-200 transition-all hover:scale-110 active:scale-95"
             title="ย่อหน้าจอ"
           >
               <Minimize2 className="w-6 h-6" />
           </button>
        )}

        {isFetching && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] bg-white/90 backdrop-blur border border-indigo-100 shadow-xl px-4 py-2 rounded-full flex items-center gap-2 animate-in slide-in-from-top-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-xs font-bold text-indigo-800">กำลังโหลดข้อมูลเพิ่มเติม...</span>
            </div>
        )}

        
        <div className={`
          isolate transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] 
          ${isExpanded 
            ? 'sticky top-0 z-50 mb-6 max-w-[1920px] mx-auto rounded-b-2xl md:rounded-b-[2.5rem] bg-white/95 backdrop-blur-xl border-b border-white/60 shadow-md' 
            : 'relative z-30 rounded-[2.5rem]'
          }
        `}>
           {!isExpanded && displayMode === 'CALENDAR' && (
                <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                <>
                    <div className="absolute -top-0 -right-10 w-48 md:w-72 h-48 md:h-72 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-2xl opacity-50 pointer-events-none mix-blend-multiply transition-all duration-1000"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 md:w-64 h-40 md:h-64 bg-gradient-to-tr from-emerald-200/40 to-teal-200/40 rounded-full blur-2xl opacity-50 pointer-events-none mix-blend-multiply transition-all duration-1000"></div>
                </>
               </div>
           )}

           <CalendarHeader 
              currentDate={currentDate || new Date()} 
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
              prevMonth={calendarViewType === 'WEEK' ? prevWeek : prevMonth}
              nextMonth={calendarViewType === 'WEEK' ? nextWeek : nextMonth}
              goToToday={goToToday}
              showFilters={showFilters}
              onToggleFilters={toggleFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              activeChipIds={activeChipIds} 
              toggleChip={toggleChip}
              customChips={customChips || []} 
              setIsManageModalOpen={setIsManageModalOpen}
              onOpenSettings={onOpenSettings}
              onOpenNotifications={onOpenNotifications}
              unreadCount={unreadCount}
              filterChannelId={filterChannelId}
              setFilterChannelId={setFilterChannelId}
              channels={channels}
              onSelectDate={(date, type) => {
                  const targetType = type || viewMode; 
                  onSelectDate(date, targetType); 
              }}
              displayMode={displayMode}
              setDisplayMode={setDisplayMode}
              taskDisplayMode={taskDisplayMode}
              setTaskDisplayMode={setTaskDisplayMode}
              isStockOpen={isStockOpen}
              onToggleStock={() => {
                  if (viewMode === 'TASK') {
                      showAlert(
                          'ฟีเจอร์ "คลังเก็บเนื้อหา" จะใช้งานได้เฉพาะในโหมด Content เท่านั้น เพื่อช่วยให้คุณดึงไอเดียมาวางแผนลงตารางได้สะดวกขึ้น',
                          'เปิดหน้าต่างคลังไม่ได้'
                      );
                      return;
                  }
                  setIsStockOpen(!isStockOpen);
              }}
              isMobileLandscape={isMobileLandscape}
              onToggleMobileLandscape={() => setIsMobileLandscape(!isMobileLandscape)}
              onToggleWorkbox={onToggleWorkbox}
              isWorkboxOpen={isWorkboxOpen}
              calendarViewType={calendarViewType}
              setCalendarViewType={setCalendarViewType}
           />

           <CalendarSecondaryHeader 
              show={showFilters}
              users={users}
              onClose={toggleFilters}
              activeChipIds={activeChipIds}
              toggleChip={toggleChip}
              customChips={customChips || []}
              channels={channels}
              onManageFilters={() => setIsManageModalOpen(true)}
              unreadCount={unreadCount}
              onOpenNotifications={onOpenNotifications}
              onOpenSettings={onOpenSettings}
              onToggleWorkbox={onToggleWorkbox}
              onToggleStock={() => {
                  if (viewMode === 'TASK') {
                      showAlert(
                          'ฟีเจอร์ "คลังเก็บเนื้อหา" จะใช้งานได้เฉพาะในโหมด Content เท่านั้น',
                          'เปิดหน้าต่างคลังไม่ได้'
                      );
                      return;
                  }
                  setIsStockOpen(!isStockOpen);
              }}
              isWorkboxOpen={!!isWorkboxOpen}
              isStockOpen={isStockOpen}
              taskDisplayMode={taskDisplayMode}
              setTaskDisplayMode={setTaskDisplayMode}
              isExpanded={isExpanded}
           />
        </div>

        <MobileLandscapeWrapper
            isActive={isMobileLandscape}
            onClose={() => setIsMobileLandscape(false)}
          >
        <div className={`relative z-20 hover:z-[45] transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex ${isExpanded ? 'h-full max-w-[1920px] mx-auto' : 'min-h-[600px]'}`}>
          
          {/* Main Content Area */}
          <div className={`
              flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] 
              ${isStockOpen ? 'mr-4' : 'mr-0'}
          `}>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={`${displayMode}-${viewMode}-${calendarViewType}`}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
                  className="h-full"
                >
                    {displayMode === 'CALENDAR' ? (
                        calendarViewType === 'MONTH' ? (
                            <CalendarGrid 
                                startDate={startDate}
                                endDate={endDate}
                                currentDate={currentDate || new Date()}
                                isExpanded={isExpanded || isMobileLandscape} // Force expanded mode in landscape
                                dragOverDate={dragOverDate}
                                viewMode={viewMode}
                                taskDisplayMode={taskDisplayMode}
                                activeChipIds={activeChipIds}
                                customChips={customChips || []}
                                highlights={highlights}
                                masterOptions={masterOptions}
                                channels={channels}
                                getTasksForDay={getTasksForDay}
                                filterTasks={filterTasks}
                                onDayClick={handleDayClick}
                                onDayContextMenu={handleDayContextMenu}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={internalHandleDrop}
                                onTaskDragStart={handleDragStart}
                                onTaskClick={onSelectTask}
                            />
                        ) : (
                            <WeeklyView 
                                currentDate={currentDate || new Date()}
                                viewMode={viewMode}
                                taskDisplayMode={taskDisplayMode}
                                getTasksForDay={getTasksForDay}
                                filterTasks={filterTasks}
                                channels={channels}
                                masterOptions={masterOptions}
                                onTaskClick={onSelectTask}
                                onSelectDate={onSelectDate}
                                isLandscape={isMobileLandscape}
                                allTasks={tasks}
                                onMoveTask={handleMoveAttempt}
                                onDayClick={handleDayClick}
                            />
                        )
                    ) : (
                        <div 
                            key="board-view" 
                            className={`h-full ${isExpanded ? 'h-[90vh]' : ''}`}
                        >
                            <BoardView 
                                tasks={filteredTasksForView}
                                channels={channels}
                                users={users}
                                masterOptions={masterOptions}
                                viewMode={viewMode}
                                onEditTask={onSelectTask}
                                onAddTask={(status) => onAddTask(status, viewMode)} 
                                onUpdateStatus={onUpdateStatus}
                                onOpenSettings={onOpenSettings}
                            />
                        </div>
                    )}
                </motion.div>
              </AnimatePresence>
          </div>

          {/* Stock Side Panel (Animated Slide) - Hidden in Mobile Landscape to save space */}
          {!isMobileLandscape && (
              <div 
                  className={`
                      shrink-0 hidden lg:block sticky top-24 self-start h-[calc(100vh-120px)]
                      transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
                      overflow-hidden

                      rounded-3xl
                      border border-white/50
                      bg-white/40
                      backdrop-blur-xl
                      shadow-[0_10px_40px_rgba(0,0,0,0.08)]

                      ${isStockOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10'}
                  `}
              >
                   <div className="w-80 h-full rounded-3xl overflow-hidden">
                       <StockSidePanel 
                          isOpen={isStockOpen}
                          onClose={() => setIsStockOpen(false)}
                          tasks={tasks}
                          channels={channels}
                          masterOptions={masterOptions}
                          onEditTask={onSelectTask}
                          onMoveTask={handleMoveAttempt}
                       />
                   </div>
              </div>
          )}
        </div>
        </MobileLandscapeWrapper>
        {/* Mobile Stock Panel Overlay (If Open on Mobile & Not Landscape) */}
        {isStockOpen && !isMobileLandscape && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsStockOpen(false)}>
                 <div 
                    className="
                        absolute right-2 top-2 bottom-2 w-80
                        rounded-3xl
                        border border-white/50
                        bg-white/80
                        backdrop-blur-2xl
                        shadow-[0_20px_60px_rgba(0,0,0,0.18)]
                        animate-in slide-in-from-right duration-300
                        overflow-hidden
                    "
                    onClick={e => e.stopPropagation()}
                 >
                      <StockSidePanel 
                          isOpen={isStockOpen}
                          onClose={() => setIsStockOpen(false)}
                          tasks={tasks}
                          channels={channels}
                          masterOptions={masterOptions}
                          onEditTask={onSelectTask}
                          onMoveTask={handleMoveAttempt}
                      />
                 </div>
            </div>
        )}

        {/* Modals */}
        <TaskCategoryModal 
              isOpen={isListModalOpen}
              onClose={() => setIsListModalOpen(false)}
              title={`รายการวันที่ ${format(selectedDayDate, 'd MMM yyyy')}`}
              tasks={selectedDayTasks}
              channels={channels}
              masterOptions={masterOptions}
              onEditTask={onSelectTask}
              colorTheme={viewMode === 'CONTENT' ? 'blue' : 'green'}
        />

        <SmartFilterModal 
            isOpen={isManageModalOpen}
            onClose={() => setIsManageModalOpen(false)}
            chips={customChips || []} 
            channels={channels}
            masterOptions={masterOptions} 
            users={users}
            onSave={saveChip}
            onDelete={deleteChip}
        />
        
        <DayHighlightModal 
            isOpen={highlightModalOpen}
            onClose={() => setHighlightModalOpen(false)}
            date={selectedHighlightDate}
            masterOptions={masterOptions}
            currentHighlightType={highlights.find(h => selectedHighlightDate && isSameDay(h.date, selectedHighlightDate))?.typeKey}
            onSave={(typeKey, note) => selectedHighlightDate && setHighlight(selectedHighlightDate, typeKey, note)}
            onRemove={() => selectedHighlightDate && removeHighlight(selectedHighlightDate)}
        />

        {pendingDelayTask && (
            <DelayModal 
                isOpen={delayModalOpen}
                onClose={() => {
                    setDelayModalOpen(false);
                    setPendingDelayTask(null);
                }}
                onConfirm={confirmDelay}
                taskTitle={pendingDelayTask.title}
                oldDate={tasks.find(t => t.id === pendingDelayTask.id)?.endDate || new Date()}
                newDate={pendingDelayTask.endDate}
            />
        )}
      </div>
    </AppBackground>
  );
};

export default CalendarView;

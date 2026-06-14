
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { Loader2, Layout, Plus, X } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';
import { 
  RoadmapTask, 
  timelineUtils,
  roadmapService,
  ROADMAP_CATEGORIES
} from '../../services/roadmapService';

import RoadmapTaskModal from './RoadmapTaskModal';
import RoadmapHeader from './RoadmapHeader';
import RoadmapTimeline from './RoadmapTimeline';
import RoadmapTaskItem from './RoadmapTaskItem';
import GeneralTaskForm from '../task/GeneralTaskForm';
import { useTaskContext } from '../../context/TaskContext';
import { useUserSession } from '../../context/UserSessionContext';
import { useMasterDataContext } from '../../context/MasterDataContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useChannels } from '../../hooks/useChannels';
import { useTasks } from '../../hooks/useTasks';
import { Task } from '../../types';

const RoadmapView: React.FC = () => {
  const { showConfirm } = useGlobalDialog();
  const { tasks: allTasks } = useTaskContext();
  const { currentUserProfile, activeUsers } = useUserSession();
  const { masterOptions } = useMasterDataContext();
  const { channels } = useChannels();
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [categories, setCategories] = useState<{name: string, id: string, color?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sortMode, setSortMode] = useState<'manual' | 'timeline'>('manual');

  // Execution Task Modal State
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [selectedExecTask, setSelectedExecTask] = useState<Task | null>(null);
  const [execInitialData, setExecInitialData] = useState<Partial<Task> | null>(null);

  const { handleSaveTask: handleSaveExecOp, handleDeleteTask: handleDeleteExecutionTask } = useTasks(() => setIsExecModalOpen(false));



  // Timeline Config
  const timelineConfig = useMemo(() => timelineUtils.getTimelineConfig(tasks), [tasks]);
  const realTodayWeek = useMemo(() => timelineUtils.getCurrentWeekIndex(), []);
  const [cursorWeek, setCursorWeek] = useState(realTodayWeek);

  // Sync cursor when realTodayWeek changes or tasks load
  useEffect(() => {
    setCursorWeek(timelineUtils.getCurrentWeekIndex());
  }, [tasks.length]);

  const timelineStartWeek = timelineConfig[0]?.start_week || 1;
  const totalWeeks = useMemo(() => timelineConfig.length * 4, [timelineConfig]);

  // Handle Cursor Dragging
  const [isDragging, setIsDragging] = useState(false);

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget;
    const x = e.clientX - rect.left + container.scrollLeft;
    
    // Sidebar Width + borders
    const sidebarWidth = 822;
    const relativeX = x - sidebarWidth;
    
    if (relativeX < 0) {
      setCursorWeek(timelineStartWeek);
      return;
    }
    
    const weekIdx = Math.floor(relativeX / 40);
    const targetWeek = timelineStartWeek + weekIdx;
    
    // Limit within the dynamic window
    if (targetWeek >= timelineStartWeek && targetWeek < timelineStartWeek + totalWeeks) {
      setCursorWeek(targetWeek);
    }
  };

  // Initial Fetch
  const fetchData = async () => {
    try {
      const [taskData, catData] = await Promise.all([
        roadmapService.getTasks(),
        roadmapService.getCategories()
      ]);
      setTasks(taskData);
      setCategories(catData.map(c => ({ name: c.name, id: c.id, color: c.color })));
    } catch (error) {
      console.error('Failed to fetch roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const subscription = roadmapService.subscribeToChanges(() => fetchData());
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const list = [...tasks]
      .filter(t => {
        const matchCategory = filter === 'All' || t.category === filter;
        const matchSearch = t.initiative.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
      });

    if (sortMode === 'timeline') {
      return list.sort((a, b) => a.start_week - b.start_week);
    }
    
    return list.sort((a, b) => (a.no || 0) - (b.no || 0));
  }, [tasks, filter, searchTerm, sortMode]);

  const handleReorder = async (newOrder: RoadmapTask[]) => {
    // Only allow reorder in manual mode and when no filtering is active
    if (sortMode !== 'manual' || filter !== 'All' || searchTerm) {
      // Just update local state for the current view if filtering
      setTasks(prev => {
        const otherTasks = prev.filter(t => !newOrder.find(nt => nt.id === t.id));
        return [...newOrder, ...otherTasks].sort((a, b) => (a.no || 0) - (b.no || 0));
      });
      return;
    }

    setTasks(prev => {
      const otherTasks = prev.filter(t => !newOrder.find(nt => nt.id === t.id));
      const reordered = newOrder.map((task, idx) => ({ ...task, no: idx + 1 }));
      return [...reordered, ...otherTasks].sort((a, b) => (a.no || 0) - (b.no || 0));
    });

    // Persist to DB
    try {
      await Promise.all(newOrder.map((task, idx) => 
        roadmapService.updateTask(task.id, { no: idx + 1 })
      ));
    } catch (error) {
      console.error('Failed to save reorder:', error);
    }
  };

  const handleEditTask = (task: RoadmapTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (savedTask: RoadmapTask) => {
    try {
      if (selectedTask) {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === savedTask.id ? { ...t, ...savedTask } : t));
        setIsModalOpen(false);
        await roadmapService.updateTask(savedTask.id, savedTask);
      } else {
        const nextNo = tasks.length > 0 ? Math.max(...tasks.map(t => t.no)) + 1 : 1;
        const { id, ...newTask } = savedTask;
        const payload = { 
          ...newTask, 
          no: nextNo,
          original_start_week: newTask.start_week,
          original_duration_weeks: newTask.duration_weeks
        };
        setIsModalOpen(false);
        const created = await roadmapService.createTask(payload);
        setTasks(prev => [...prev.filter(t => t.id !== id), created]);
      }
    } catch (error) {
      console.error('Save failed:', error);
      fetchData(); // Rollback/Resync
    }
  };

  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const initiativeName = taskToDelete?.initiative || 'โครงการนี้';
    const confirmed = await showConfirm(
      `คุณต้องการลบโครงการ "${initiativeName}" ใช่หรือไม่? งานปฏิบัติการหลักทั้งหมดที่เชื่อมกับ Roadmap นี้จะไม่สามารถอ้างอิงได้อีกต่อไป และการลบจะไม่สามารถย้อนกลับได้`,
      'ยืนยันการลบโครงการ'
    );
    
    if (!confirmed) return;

    try {
      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== id));
      setIsModalOpen(false);
      await roadmapService.deleteTask(id);
    } catch (error) {
      console.error('Delete failed:', error);
      fetchData(); // Rollback/Resync
    }
  };

  const handleAddExecTask = (roadmapId: string, initiative: string, startDate: Date, endDate: Date) => {
    setExecInitialData({
      title: `[${initiative}] `,
      roadmapId,
      startDate,
      endDate,
    });
    setSelectedExecTask(null);
    setIsExecModalOpen(true);
  };

  const handleEditExecTask = (task: Task) => {
    setSelectedExecTask(task);
    setExecInitialData(null);
    setIsExecModalOpen(true);
  };

  const handleSaveExecution = async (task: Task) => {
    await handleSaveExecOp(task, selectedExecTask);
    setIsExecModalOpen(false);
  };

  // --- Insight Dashboard Calculations (E) ---
  const insights = useMemo(() => {
    const ongoing = tasks.filter(t => t.status === 'Ongoing').length;
    const highImpact = tasks.filter(t => (t.impact || 0) >= 4).length;
    const delayed = tasks.filter(t => t.status === 'Delayed').length;
    
    // Resource Peak (C)
    const weekLoad: Record<number, number> = {};
    tasks.forEach(t => {
      for (let w = t.start_week; w < t.start_week + t.duration_weeks; w++) {
        weekLoad[w] = (weekLoad[w] || 0) + 1;
      }
    });
    const peakLoad = Math.max(0, ...Object.values(weekLoad));
    
    return { ongoing, highImpact, delayed, peakLoad };
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold tracking-[0.3em] uppercase text-indigo-600/60 ml-1">{BRAND_CONFIG.name.toUpperCase()}</p>
          <p className="text-xs font-medium text-slate-400">กำลังซิงค์ข้อมูลโครงการ...</p>
        </div>
      </div>
    );
  }
  const sidebarWidth = 822;
  const cursorLeftOffset = (cursorWeek - timelineStartWeek) * 40;

  return (
    <div className={`flex flex-col h-full bg-white text-slate-900 select-none ${isFullScreen ? 'fixed inset-0 z-[100]' : ''}`}>
      {!isFullScreen ? (
        <>
          <RoadmapHeader 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filter={filter}
            onFilterChange={setFilter}
            categories={categories.map(c => c.name)}
            onAddNew={handleAddNew}
            onToggleFullScreen={() => setIsFullScreen(true)}
            sortMode={sortMode}
            onToggleSort={() => setSortMode(prev => prev === 'manual' ? 'timeline' : 'manual')}
          />
          
          {/* Insight Dashboard (E) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-10 py-6 bg-slate-50/50">
            {[
              { label: 'โครงการที่ดำเนินการอยู่', value: insights.ongoing, sub: 'Active Projects', icon: '⚡', color: 'text-indigo-600' },
              { label: 'แผนงานที่มีผลกระทบสูง', value: insights.highImpact, sub: 'High Impact', icon: '🔥', color: 'text-emerald-600' },
              { label: 'ภาระงานสูงสุด (ขนาน)', value: insights.peakLoad, sub: 'Peak Capacity', icon: '📊', color: insights.peakLoad > 3 ? 'text-amber-600' : 'text-slate-600' },
              { label: 'โครงการที่ล่าช้า', value: insights.delayed, sub: 'At Risk', icon: '⚠️', color: insights.delayed > 0 ? 'text-rose-600' : 'text-slate-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md animate-in fade-in slide-in-from-top-2" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-3xl">{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.sub}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                    <span className="text-xs font-bold text-slate-400">{stat.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actionable Creator Advice Banner */}
          <div className="px-10 pb-6 bg-slate-50/50 border-b border-slate-100">
            {insights.peakLoad > 3 ? (
              <div className="flex items-center gap-3.5 px-6 py-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl text-xs text-amber-800 animate-in fade-in slide-in-from-top-1 font-medium">
                <span className="text-lg bg-amber-100 p-2 rounded-xl">⚠️</span>
                <div>
                  <p className="font-bold text-amber-900">ตรวจพบการกระจุกตัวของภาระงาน (Creator Hustle Congestion)</p>
                  <p className="text-amber-800/80 mt-0.5">มีโครงการที่รันซ้อนพร้อมกันสูงสุดถึง {insights.peakLoad} แผนงานในบางสัปดาห์ แนะนำให้ลากแบ่งระยะเวลา (Duration) หรือขยับจุดเริ่มต้น เพื่อให้ทีมสคริปต์และทีมตัดต่อมีระยะเวลาพิทช์แบรนด์ที่ดีขึ้น</p>
                </div>
              </div>
            ) : insights.delayed > 0 ? (
              <div className="flex items-center gap-3.5 px-6 py-4 bg-rose-50/70 border border-rose-200/50 rounded-2xl text-xs text-rose-800 animate-in fade-in slide-in-from-top-1 font-medium">
                <span className="text-lg bg-rose-100 p-2 rounded-xl">⚠️</span>
                <div>
                  <p className="font-bold text-rose-900">พบแผนคอนเทนต์สะสมล่าช้า (Delayed Schedule Alert)</p>
                  <p className="text-rose-800/80 mt-0.5">มีโครงการที่เสร็จไม่ทันตารางเดิมอยู่ {insights.delayed} แผนงาน แนะนำให้เปิดโหมด "เรียงตามเวลา" เพื่อจัดลำดับแผนงานสำคัญสุดก่อน หรือปรับขยายบัฟเฟอร์การผลิตในหน้ารายละเอียดของแผนนั้นๆ</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5 px-6 py-4 bg-indigo-50/70 border border-indigo-100/50 rounded-2xl text-xs text-indigo-800 animate-in fade-in slide-in-from-top-1 font-medium">
                <span className="text-lg bg-indigo-100/50 p-2 rounded-xl font-bold">✨</span>
                <div>
                  <p className="font-bold text-indigo-900">สมดุลของตารางเวลาเป็นระเบียบดีเยี่ยม (Healthy Content Pipeline)</p>
                  <p className="text-indigo-800/80 mt-0.5">ขีดความสามารถการรันแผนงานมีความกระจายตัวดี (Peak Concurrency อยู่ที่ {insights.peakLoad} งาน) มั่นใจได้ว่าทุกช่องจะไม่ขาดช่วงโพสต์ และคงความพรีเมียมของชิ้นงานได้ตามเป้า</p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <button 
          onClick={() => setIsFullScreen(false)}
          className="fixed top-6 right-10 z-[60] bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-2xl shadow-xl text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 group"
        >
          <Layout className="w-6 h-6" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">ออกจากการแสดงผลเต็มจอ</span>
        </button>
      )}

      <div 
        className={`flex-1 overflow-auto relative bg-slate-100/30 scrollbar-thin`}
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={() => {
          setIsDragging(false);
          setCursorWeek(realTodayWeek); // Snap back
        }}
        onMouseLeave={() => {
          if (isDragging) {
            setIsDragging(true);
            setCursorWeek(realTodayWeek);
          }
          setIsDragging(false);
        }}
      >
        <div className="inline-block min-w-full">
          <RoadmapTimeline 
            timelineConfig={timelineConfig} 
            currentWeekIndex={cursorWeek} 
          />

          <div className="flex flex-col bg-white relative">
             {/* New wrapper for the grid area to ensure alignment */}
             <div 
               className="absolute inset-0 pointer-events-none"
               style={{ left: sidebarWidth }}
             >
                {/* Red Vertical Line - Cursor Indicator with Spring Snap */}
                <motion.div 
                    animate={{ 
                      left: `${cursorLeftOffset}px`,
                      transition: isDragging ? { type: "tween", duration: 0 } : { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    className={`absolute h-full w-[2px] bg-rose-500 z-[45] pointer-events-none opacity-90 transition-shadow ${isDragging ? 'shadow-[0_0_20px_rgba(244,63,94,0.8)]' : 'shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                >
                    <div 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      className="absolute top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-xl active:scale-125 transition-transform pointer-events-auto cursor-ew-resize hover:bg-rose-500" 
                    />
                    <div className="absolute top-4 left-2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                      สัปดาห์ปัจจุบัน (W{cursorWeek})
                    </div>
                </motion.div>
             </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-48 bg-slate-50/20">
                <div className="w-32 h-32 bg-indigo-50 flex items-center justify-center rounded-full mb-8 animate-pulse">
                  <Layout className="w-16 h-16 text-indigo-200" />
                </div>
                <h3 className="text-3xl font-bold text-slate-700 tracking-tight">ยังไม่มีแผนโครงการในขณะนี้</h3>
                <p className="text-base font-semibold text-slate-400 mt-3 max-w-sm text-center leading-relaxed">
                   {BRAND_CONFIG.projectPlaceholder}
                </p>
                <button 
                  onClick={handleAddNew}
                  className="mt-8 flex items-center gap-3 bg-white border border-slate-200 text-indigo-600 px-8 py-4 rounded-3xl font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  เริ่มต้นสร้างแผนใหม่
                </button>
              </div>
            ) : (
              <Reorder.Group 
                axis="y" 
                values={filteredTasks} 
                onReorder={handleReorder}
                className="flex flex-col"
              >
                {filteredTasks.map((task) => (
                  <Reorder.Item 
                    key={task.id} 
                    value={task}
                    dragListener={sortMode === 'manual'}
                  >
                    <RoadmapTaskItem 
                      task={task}
                      timelineStartWeek={timelineStartWeek}
                      currentWeekIndex={cursorWeek}
                      totalWeeks={totalWeeks}
                      onEdit={handleEditTask}
                      isDraggable={sortMode === 'manual' && filter === 'All' && !searchTerm}
                      categories={categories}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
          
          {/* Capacity Meter (C) */}
          <div className="flex bg-slate-50/80 border-t border-slate-100 items-center">
            <div className={`w-[822px] min-w-[822px] py-3 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 sticky left-0 z-50 bg-slate-100/50 backdrop-blur-sm border-r border-slate-200`}>
              Resource Capacity Check (Concurrency)
            </div>
            <div className="flex flex-1">
              {Array.from({ length: totalWeeks }).map((_, i) => {
                const weekIdx = timelineStartWeek + i;
                const count = tasks.filter(t => weekIdx >= t.start_week && weekIdx < (t.start_week + t.duration_weeks)).length;
                const isOver = count > 3;
                return (
                  <div key={i} className="w-[40px] flex flex-col items-center justify-center py-2 border-r border-slate-100/50">
                    <div className={`w-1 h-3 rounded-full ${isOver ? 'bg-rose-500 animate-pulse' : count > 0 ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                    <span className={`text-[8px] mt-1 font-bold ${isOver ? 'text-rose-500' : 'text-slate-400'}`}>{count > 0 ? count : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

          <div className="flex flex-wrap gap-8 py-4 px-10 bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] shrink-0 z-[50]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ตำแหน่งปัจจุบัน: สัปดาห์ {cursorWeek}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">จุดเริ่มต้นแผนงาน</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สัปดาห์ที่กำลังดำเนินการ (Active)</span>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <RoadmapTaskModal 
            isOpen={isModalOpen}
            task={selectedTask}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            allTasks={tasks}
            executionTasks={allTasks.filter(t => t.roadmapId === selectedTask?.id)}
            users={activeUsers}
            onAddTask={handleAddExecTask}
            onEditTask={handleEditExecTask}
          />
        )}
      </AnimatePresence>

      {/* Execution Task Form Modal */}
      <AnimatePresence>
        {isExecModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExecModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 bg-white">
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedExecTask ? 'แก้ไขงานปฏิบัติงาน' : 'สั่งงานปฏิบัติงานใหม่'}
                </h3>
                <button 
                  onClick={() => setIsExecModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <GeneralTaskForm 
                   initialData={selectedExecTask || (execInitialData as any)}
                   users={activeUsers}
                   masterOptions={masterOptions}
                   channels={channels}
                   currentUser={currentUserProfile || undefined}
                   onSave={handleSaveExecution}
                   onDelete={handleDeleteExecutionTask}
                   onClose={() => setIsExecModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoadmapView;

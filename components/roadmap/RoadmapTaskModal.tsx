
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, PlayCircle, AlertCircle, Save, Trash2, Calendar, LayoutGrid, Tag, Plus, User as UserIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { ROADMAP_CATEGORIES, RoadmapTask, TaskStatus, roadmapService, timelineUtils } from '../../services/roadmapService';
import FilterDropdown from '../common/FilterDropdown';
import { Task, User } from '../../types';
import "react-datepicker/dist/react-datepicker.css";

interface RoadmapTaskModalProps {
  task: RoadmapTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: RoadmapTask) => void;
  onDelete?: (id: string) => void;
  allTasks?: RoadmapTask[];
  executionTasks?: Task[];
  users?: User[];
  onAddTask?: (roadmapId: string, initiative: string, startDate: Date, endDate: Date) => void;
  onEditTask?: (task: Task) => void;
}

const RoadmapTaskModal: React.FC<RoadmapTaskModalProps> = ({ 
  task, isOpen, onClose, onSave, onDelete, allTasks = [], 
  executionTasks = [], users = [], onAddTask, onEditTask 
}) => {
  const [categories, setCategories] = useState<{name: string, color: string, id: string}[]>([]);
  const [newCat, setNewCat] = useState('');
  const [selectedColor, setSelectedColor] = useState('#818CF8');
  const [loading, setLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  
  const [formData, setFormData] = useState<RoadmapTask>({
    id: '',
    no: 0,
    initiative: '',
    category: 'Other',
    status: 'Planned',
    progress: 0,
    buffer: '0d',
    start_week: 1,
    duration_weeks: 1,
    effort: 3,
    impact: 3,
    dependencies: []
  });

  const [startDate, setStartDate] = useState<Date>(new Date());

  useEffect(() => {
    const loadCats = async () => {
      try {
        const data = await roadmapService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Load categories failed', err);
      }
    };
    if (isOpen) {
      loadCats();
      setDeleteMode(false);
      if (task) {
        setFormData({
          ...task,
          effort: task.effort || 3,
          impact: task.impact || 3,
          dependencies: task.dependencies || []
        });
        setStartDate(timelineUtils.getDateFromWeekIndex(task.start_week));
      } else {
        const currentWeek = timelineUtils.getCurrentWeekIndex();
        setFormData({
          id: '',
          no: 0,
          initiative: '',
          category: 'Other',
          status: 'Planned',
          progress: 0,
          buffer: '0d',
          start_week: currentWeek,
          duration_weeks: 1,
          effort: 3,
          impact: 3,
          dependencies: []
        });
        setStartDate(timelineUtils.getDateFromWeekIndex(currentWeek));
      }
    }
  }, [task, isOpen]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      const weekIdx = timelineUtils.getWeekIndexFromDate(date);
      setFormData({ ...formData, start_week: weekIdx });
    }
  };

  const handleAddCategory = async () => {
    if (newCat && !categories.find(c => c.name === newCat)) {
      setLoading(true);
      try {
        const result = await roadmapService.addCategory(newCat, selectedColor);
        setCategories([...categories, result]);
        setFormData({ ...formData, category: newCat });
        setNewCat('');
        setSelectedColor('#818CF8'); // Reset
      } catch (err) {
        console.error('Add category failed', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setLoading(true);
    try {
      await roadmapService.deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
      // If the current task has this category, we might want to reset it or keep as is
      if (formData.category === categories.find(c => c.id === catId)?.name) {
        setFormData({ ...formData, category: 'Other' });
      }
    } catch (err) {
      console.error('Delete category failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white border border-slate-200/60 rounded-[2.5rem] shadow-[0_48px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[calc(100vh-80px)] my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-white">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {task ? 'แก้ไขโครงการ' : 'สร้างโครงการใหม่'}
            </h3>
            <p className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-widest">อัปเดตรายละเอียดข้อมูล Roadmap ของคุณ</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-600 transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-10 py-8 space-y-10 overflow-y-auto custom-slim-scrollbar flex-1 bg-white">
          {/* Initiative Input */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">ชื่อโครงการหลัก (Initiative)</label>
            <div className="relative">
              <input 
                type="text" 
                value={formData.initiative}
                onChange={(e) => setFormData({ ...formData, initiative: e.target.value })}
                placeholder="พิมพ์ชื่อโครงการ เช่น Re-branding Brand Identity..."
                className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl px-6 py-4 text-lg text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 focus:bg-white transition-all font-semibold placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Status Selection Row */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">สถานะโครงการ</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['Planned', 'Ongoing', 'Done', 'Delayed'] as TaskStatus[]).map((status) => {
                const labels: Record<TaskStatus, string> = {
                  Planned: 'แผนงาน',
                  Ongoing: 'กำลังทำ',
                  Done: 'เสร็จสิ้น',
                  Delayed: 'ล่าช้า'
                };
                const isSelected = formData.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`px-4 py-4 rounded-2xl text-sm font-bold transition-all border ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' 
                        : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30'
                    }`}
                  >
                    {labels[status]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Management Row */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">หมวดหมู่โครงการ</label>
              <button 
                onClick={() => setDeleteMode(!deleteMode)}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-all ${deleteMode ? 'bg-rose-500 text-white shadow-sm shadow-rose-100' : 'text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-100'}`}
              >
                {deleteMode ? 'เสร็จสิ้นการจัดการ' : 'จัดการหมวดหมู่'}
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <FilterDropdown
                    label="เลือกหมวดหมู่..."
                    icon={<Tag className="w-5 h-5 text-slate-400" />}
                    options={categories.map(cat => ({ key: cat.name, label: cat.name }))}
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    showAllOption={false}
                    clearable={false}
                  />
                </div>
                <div className="flex gap-3 shrink-0">
                  <input 
                    type="text" 
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="เพิ่มใหม่..."
                    className="w-36 bg-slate-50/50 border border-slate-200/60 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-indigo-500/30 focus:bg-white transition-all font-semibold placeholder:text-slate-300"
                  />
                  <button 
                    disabled={loading || !newCat}
                    onClick={handleAddCategory}
                    className="px-6 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-bold text-sm border border-indigo-100/50"
                    type="button"
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>
              
              {/* Creator-friendly preset dots selector */}
              <div className="flex flex-col gap-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">โค้ดสีหมวดหมู่:</span>
                  {[
                    '#EF4444', // YouTube Red
                    '#E11D48', // TikTok Rose
                    '#D946EF', // Instagram Fuchsia
                    '#8B5CF6', // Podcast Purple
                    '#3B82F6', // Facebook/Tech Blue
                    '#0D9488', // Newsletter Teal
                    '#10B981', // Marketing Emerald
                    '#F59E0B', // Sponsor Gold
                    '#6366F1', // System Indigo
                    '#64748B'  // Other Slate
                  ].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSelectedColor(hex)}
                      className="w-5.5 h-5.5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center relative shadow-sm"
                      style={{ 
                        backgroundColor: hex, 
                        borderColor: selectedColor === hex ? '#4F46E5' : 'transparent' 
                      }}
                      title={hex}
                    >
                      {selectedColor === hex && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
                {newCat && (
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 mt-1">
                    <span>ต้วอย่างป้ายชื่อ:</span>
                    <span 
                      className="px-3 py-1 rounded-full text-[9px] font-bold uppercase border tracking-wider" 
                      style={{ 
                        backgroundColor: `${selectedColor}0b`, 
                        borderColor: `${selectedColor}30`, 
                        color: selectedColor 
                      }}
                    >
                      {newCat}
                    </span>
                  </div>
                )}
              </div>
              
              <AnimatePresence>
                {deleteMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2 p-5 bg-rose-50/20 rounded-2xl border border-dashed border-rose-200 overflow-hidden"
                  >
                    {categories.length === 0 ? (
                      <p className="text-xs font-medium text-rose-400 w-full text-center py-2">ยังไม่มีหมวดหมู่ที่กำหนดเอง</p>
                    ) : (
                      categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-rose-100 shadow-sm animate-in zoom-in-95">
                          <span className="text-xs font-semibold text-slate-600">{cat.name}</span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteCategory(cat.id);
                            }} 
                            className="p-1.5 hover:bg-rose-50 rounded-full text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Strategic Analysis - Effort & Impact */}
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Strategic Analysis (Value Matrix)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Effort */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Effort (ความยาก/ทรัพยากร)</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{formData.effort}/5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, effort: lvl })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        formData.effort === lvl 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'
                      }`}
                    >
                      {lvl === 1 ? 'ง่าย' : lvl === 5 ? 'ยากมาก' : lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Impact (ผลกระทบต่อธุรกิจ)</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{formData.impact}/5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, impact: lvl })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        formData.impact === lvl 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
                      }`}
                    >
                      {lvl === 1 ? 'น้อย' : lvl === 5 ? 'สูงมาก' : lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dependencies (Linkage) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">โครงการที่เกี่ยวข้อง (Dependencies)</label>
            <div className="flex flex-wrap gap-2">
              {allTasks
                .filter(t => t.id !== task?.id)
                .map(t => {
                  const isDep = formData.dependencies?.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const current = formData.dependencies || [];
                        if (isDep) {
                          setFormData({ ...formData, dependencies: current.filter(id => id !== t.id) });
                        } else {
                          setFormData({ ...formData, dependencies: [...current, t.id] });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                        isDep 
                          ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-amber-200 hover:text-amber-600'
                      }`}
                    >
                      {t.initiative}
                    </button>
                  );
                })}
              {allTasks.length <= 1 && (
                <p className="text-xs text-slate-400 italic">ยังไม่มีโครงการอื่นให้เลือกเชื่อมโยง</p>
              )}
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-slate-100">
             <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">ความคืบหน้าโครงการ</label>
                <div className="px-4 py-1 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm shadow-indigo-50">
                  <span className="text-sm font-bold text-indigo-600">{formData.progress}%</span>
                </div>
             </div>
             <div className="relative pt-2 px-1">
               <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-10 pt-4">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">วันที่เริ่มต้นโครงการ</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10">
                  <Calendar className="w-5 h-5" />
                </div>
                <DatePicker
                  selected={startDate}
                  onChange={handleDateChange}
                  dateFormat="dd MMMM yyyy"
                  className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl pl-14 pr-6 py-4 text-base text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 focus:bg-white transition-all font-semibold cursor-pointer"
                  popperClassName="custom-calendar-popper"
                  calendarClassName="custom-calendar"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-tight shadow-sm border border-indigo-100/50">
                  W{formData.start_week}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">ระยะเวลา (สัปดาห์)</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="1" 
                  max="52"
                  value={formData.duration_weeks}
                  onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                  className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl px-6 py-4 text-base text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 focus:bg-white transition-all font-semibold"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none uppercase tracking-tighter">
                  สัปดาห์
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">เป้าหมายและข้อมูลทางเทคนิค</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">บับเฟอร์เวลา (Buffer)</p>
                <input 
                    type="text" 
                    placeholder="เช่น 2d, 1w..."
                    value={formData.buffer}
                    onChange={(e) => setFormData({ ...formData, buffer: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl px-6 py-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500/30 focus:bg-white transition-all font-semibold"
                />
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">เป้าหมายหลัก (Milestone)</p>
                <input 
                    type="text" 
                    placeholder="เป้าหมายที่สำคัญที่สุด..."
                    value={formData.milestone || ''}
                    onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl px-6 py-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500/30 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Execution Tasks (Linked Operations) */}
          {task && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center px-1">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">งานที่มอบหมาย (Execution)</label>
                  <p className="text-[10px] font-medium text-slate-400">งานย่อยสำหรับทีมปฏิบัติงานที่เกี่ยวข้องกับโครงการนี้</p>
                </div>
                <button 
                  onClick={() => {
                    const sDate = timelineUtils.getDateFromWeekIndex(formData.start_week);
                    const eDate = timelineUtils.getDateFromWeekIndex(formData.start_week + formData.duration_weeks);
                    onAddTask?.(task.id, task.initiative, sDate, eDate);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-bold text-xs border border-indigo-100/50"
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  สั่งงานใหม่
                </button>
              </div>
              
              <div className="grid gap-2 max-h-48 overflow-y-auto custom-slim-scrollbar pr-1">
                {executionTasks.length === 0 ? (
                  <div className="py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-4">
                    <LayoutGrid className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">ยังไม่มีการสั่งงานในระบบปฏิบัติงาน</p>
                  </div>
                ) : (
                  executionTasks.map(execTask => (
                    <div 
                      key={execTask.id}
                      onClick={() => onEditTask?.(execTask)}
                      className="group flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all cursor-pointer"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        execTask.status === 'DONE' ? 'bg-emerald-500' : 
                        execTask.status === 'ON_GOING' ? 'bg-indigo-500' : 'bg-slate-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{execTask.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {execTask.assigneeIds.slice(0, 3).map(uid => {
                              const user = users.find(u => u.id === uid);
                              return (
                                <div key={uid} className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center" title={user?.name}>
                                  <UserIcon className="w-2.5 h-2.5 text-slate-400" />
                                </div>
                              );
                            })}
                            {execTask.assigneeIds.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-slate-50 border border-white flex items-center justify-center">
                                <span className="text-[8px] font-bold text-slate-400">+{execTask.assigneeIds.length - 3}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                            {format(execTask.endDate, 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>
                      <AlertCircle className="w-4 h-4 text-slate-200 group-hover:text-indigo-300 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-slate-50/30 flex gap-4 border-t border-slate-100 items-center">
           {task && onDelete && (
             <button 
                onClick={() => onDelete(task.id)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-rose-500 hover:bg-rose-50 font-semibold text-xs transition-all active:scale-95 border border-transparent hover:border-rose-100"
             >
                <Trash2 className="w-4 h-4" />
                ลบข้อมูลโครงการ
             </button>
           )}
           <div className="flex-1" />
           <button 
            onClick={onClose}
            className="px-8 py-3 rounded-xl text-slate-500 hover:text-slate-800 font-semibold text-sm transition-all hover:bg-slate-100"
           >
            ยกเลิก
           </button>
           <button 
            onClick={() => onSave(formData)}
            className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-semibold text-sm shadow-xl shadow-indigo-200 transition-all active:scale-95 border border-indigo-500"
           >
            <Save className="w-4 h-4" />
            บันทึกโครงการ
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RoadmapTaskModal;

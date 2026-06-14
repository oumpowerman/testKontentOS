
import React from 'react';
import { motion } from 'framer-motion';
import { Diamond, GripVertical } from 'lucide-react';
import { RoadmapTask, TaskStatus } from '../../services/roadmapService';

interface RoadmapTaskItemProps {
  task: RoadmapTask;
  timelineStartWeek: number;
  currentWeekIndex: number;
  totalWeeks: number;
  onEdit: (task: RoadmapTask) => void;
  isDraggable?: boolean;
  categories?: any[];
}

// Gorgeous preset creator platforms and sponsorship category themes
const getCategoryDesign = (categoryName: string, categoriesList: any[] = []) => {
  const lowerName = categoryName.toLowerCase().trim();
  
  const presetColors: Record<string, { bg: string, border: string, fill: string, textStyle: React.CSSProperties, pillClass: string }> = {
    youtube: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', fill: '#EF4444', textStyle: { color: '#DC2626' }, pillClass: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100/50' },
    tiktok: { bg: 'rgba(225, 29, 72, 0.08)', border: 'rgba(225, 29, 72, 0.25)', fill: '#E11D48', textStyle: { color: '#E11D48' }, pillClass: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100/50' },
    instagram: { bg: 'rgba(217, 70, 239, 0.08)', border: 'rgba(217, 70, 239, 0.25)', fill: '#D946EF', textStyle: { color: '#C026D3' }, pillClass: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100 hover:bg-fuchsia-100/50' },
    facebook: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', fill: '#3B82F6', textStyle: { color: '#2563EB' }, pillClass: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/50' },
    sponsor: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', fill: '#F59E0B', textStyle: { color: '#D97706' }, pillClass: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50' },
    sponsorship: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', fill: '#F59E0B', textStyle: { color: '#D97706' }, pillClass: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50' },
    brand_deal: { bg: 'rgba(242, 100, 25, 0.08)', border: 'rgba(242, 100, 25, 0.25)', fill: '#f26419', textStyle: { color: '#f26419' }, pillClass: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100/50' },
    marketing: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', fill: '#10B981', textStyle: { color: '#059669' }, pillClass: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50' },
    podcast: { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.25)', fill: '#8B5CF6', textStyle: { color: '#7C3AED' }, pillClass: 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100/50' },
    system: { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.25)', fill: '#6366F1', textStyle: { color: '#4F46E5' }, pillClass: 'bg-indigo-50 text-indigo-500 border-indigo-100 hover:bg-indigo-100/50' },
    operations: { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.25)', fill: '#6366F1', textStyle: { color: '#4F46E5' }, pillClass: 'bg-indigo-50 text-indigo-500 border-indigo-100 hover:bg-indigo-100/50' },
    newsletter: { bg: 'rgba(13, 148, 136, 0.08)', border: 'rgba(13, 148, 136, 0.25)', fill: '#0D9488', textStyle: { color: '#0D9488' }, pillClass: 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100/50' },
    blog: { bg: 'rgba(13, 148, 136, 0.08)', border: 'rgba(13, 148, 136, 0.25)', fill: '#0D9488', textStyle: { color: '#0D9488' }, pillClass: 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100/50' },
    product: { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.25)', fill: '#EC4899', textStyle: { color: '#DB2777' }, pillClass: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100/50' },
    merch: { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.25)', fill: '#EC4899', textStyle: { color: '#DB2777' }, pillClass: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100/50' },
  };

  if (presetColors[lowerName]) return presetColors[lowerName];
  
  for (const key of Object.keys(presetColors)) {
    if (lowerName.includes(key)) {
      return presetColors[key];
    }
  }

  // Find dynamic hex color from config
  const found = categoriesList.find(c => c.name.toLowerCase().trim() === lowerName);
  if (found && found.color) {
    const hex = found.color;
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 129;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 140;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 248;
    
    return {
      bg: `rgba(${r}, ${g}, ${b}, 0.08)`,
      border: `rgba(${r}, ${g}, ${b}, 0.25)`,
      fill: hex,
      textStyle: { color: hex },
      pillClass: '',
      isCustom: true
    };
  }

  // Fallback
  return { bg: 'rgba(71, 85, 105, 0.08)', border: 'rgba(203, 213, 225, 0.3)', fill: '#475569', textStyle: { color: '#475569' }, pillClass: 'bg-slate-50 text-slate-500 border-slate-100' };
};

const CategoryPill = ({ category, design }: { category: string, design: any }) => {
  if (design.isCustom) {
    return (
      <span 
        className="px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-all cursor-default"
        style={{
          backgroundColor: design.bg,
          borderColor: design.border,
          color: design.fill
        }}
      >
        {category}
      </span>
    );
  }
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-all cursor-default ${design.pillClass}`}>
      {category}
    </span>
  );
};

const StatusPill = ({ status }: { status: TaskStatus }) => {
  const colors: Record<TaskStatus, string> = {
    Planned: 'bg-slate-100 text-slate-500 border-slate-200/50',
    Ongoing: 'bg-blue-50 text-blue-600 border-blue-100',
    Done: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Delayed: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  
  const labels: Record<TaskStatus, string> = {
    Planned: 'แผนงาน',
    Ongoing: 'กำลังทำ',
    Done: 'เสร็จสิ้น',
    Delayed: 'ล่าช้า'
  };
  
  return (
    <span className={`px-3 py-1 rounded text-[11px] font-bold border capitalize ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

const RoadmapTaskItem: React.FC<RoadmapTaskItemProps> = ({ 
  task, 
  timelineStartWeek, 
  currentWeekIndex,
  totalWeeks,
  onEdit,
  isDraggable = false,
  categories = []
}) => {
  // 1 week = 40px
  const weekPixel = 40;
  
  // Calculate relative start position in the timeline window
  const relativeStart = task.start_week - timelineStartWeek;
  const leftOffset = relativeStart * weekPixel;
  const width = task.duration_weeks * weekPixel;

  // Render check: If task is completely outside the timeline window, hide it
  const isOutOfWindow = (task.start_week + task.duration_weeks) < timelineStartWeek || task.start_week > (timelineStartWeek + totalWeeks);

  if (isOutOfWindow) return null;

  const scheme = getCategoryDesign(task.category, categories);

  // Highlight check
  const isActive = currentWeekIndex >= task.start_week && currentWeekIndex < (task.start_week + task.duration_weeks);

  return (
    <div className={`flex group hover:bg-slate-50 transition-all border-b border-slate-100 ${isActive ? 'bg-indigo-50/10' : ''}`}>
      {/* Sticky Table Columns - MUST match Timeline Header widths: 48 + 320 + 112 + 96 + 80 + 160 + 5 (borders) + 1 (right border) = 822px */}
      <div className={`flex divide-x divide-slate-100 items-center shrink-0 sticky left-0 z-50 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${isActive ? '!bg-indigo-50/30' : ''}`}>
        <div className={`w-[48px] min-w-[48px] max-w-[48px] py-5 px-2 flex flex-col items-center justify-center ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
          {isDraggable && (
            <GripVertical className="w-3.5 h-3.5 mb-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <span className="text-[12px] font-mono leading-none">{task.no}</span>
        </div>
        <div 
          onClick={() => onEdit(task)}
          className={`w-[320px] min-w-[320px] max-w-[320px] py-5 px-8 cursor-pointer group/title hover:text-indigo-600 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}
        >
          <div className="flex flex-col gap-1.5 overflow-hidden">
            <span className="text-base font-semibold truncate leading-tight">{task.initiative}</span>
            <div className="flex items-center gap-2">
              {/* Value Markers (B) */}
              {task.effort && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200" title={`Effort: ${task.effort}`}>
                  <span className="text-[9px] font-black text-slate-400">E</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <div key={v} className={`w-1.5 h-1.5 rounded-full ${v <= (task.effort || 0) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
              )}
              {task.impact && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100" title={`Impact: ${task.impact}`}>
                  <span className="text-[9px] font-black text-emerald-400">I</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <div key={v} className={`w-1.5 h-1.5 rounded-full ${v <= (task.impact || 0) ? 'bg-emerald-500' : 'bg-emerald-100'}`} />
                    ))}
                  </div>
                </div>
              )}
              {/* Linkage Marker (A) */}
              {(task.dependencies?.length || 0) > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-600" title={`Has ${task.dependencies?.length} dependencies`}>
                  <Diamond className="w-2.5 h-2.5 fill-current" />
                  <span className="text-[9px] font-black">{task.dependencies?.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-[112px] min-w-[112px] max-w-[112px] py-5 px-2 flex justify-center"><CategoryPill category={task.category} design={scheme} /></div>
        <div className="w-[96px] min-w-[96px] max-w-[96px] py-5 px-2 flex justify-center"><StatusPill status={task.status} /></div>
        <div className="w-[80px] min-w-[80px] max-w-[80px] py-5 px-2 text-xs text-center text-slate-400 font-medium italic truncate px-2">{task.buffer}</div>
        <div className="w-[160px] min-w-[160px] max-w-[160px] py-5 px-4 text-xs text-center font-semibold text-slate-500 truncate">{task.milestone || '-'}</div>
      </div>

      {/* Timeline Bar Area */}
      <div className="relative h-14 flex-1 bg-transparent overflow-visible">
        {/* Grid Lines (Columns) */}
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: totalWeeks }).map((_, i) => (
             <div 
                key={i} 
                className={`w-[40px] h-full shrink-0 border-r border-slate-50/50 ${ 
                   (timelineStartWeek + i) === currentWeekIndex ? 'bg-indigo-50/5' : '' 
                }`} 
             />
          ))}
        </div>

        {/* The Strategy Pill / Gantt Bar */}
        <div className="relative h-14 w-full flex items-center">
            {/* Baseline Bar (D) - Only visible on hover or if baseline tracking is fully implemented */}
            {task.original_start_week && (
              <div 
                className="absolute h-4 bg-slate-200/50 border border-slate-300/30 rounded-full z-0 opacity-50"
                style={{
                  left: `${((task.original_start_week || task.start_week) - timelineStartWeek) * weekPixel + 4}px`,
                  width: `${(task.original_duration_weeks || task.duration_weeks) * weekPixel - 8}px`,
                }}
              />
            )}

            <motion.div
                layoutId={`task-${task.id}`}
                animate={{ 
                  scaleY: isActive ? 1.05 : 1,
                  boxShadow: isActive ? `0 10px 25px -5px ${scheme.border}` : '0 1px 3px rgba(0,0,0,0.05)',
                  zIndex: isActive ? 30 : 10,
                  opacity: 1
                }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                whileHover={{ scaleY: 1.1, zIndex: 40 }}
                onClick={() => onEdit(task)}
                className={`absolute h-8 rounded-full flex items-center px-4 cursor-pointer border transition-shadow overflow-hidden shadow-sm`}
                style={{
                  left: `${leftOffset + 4}px`,
                  width: `${width - 8}px`,
                  backgroundColor: '#ffffff',
                  borderColor: isActive ? scheme.fill : scheme.border
                }}
            >
                {/* Progress Fill - More subtle */}
                <div 
                    className="absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-700 rounded-l-full"
                    style={{ 
                        width: `${task.progress}%`,
                        backgroundColor: scheme.fill
                    }}
                />
                
                {/* Simplified Bar with Color Line at top or bottom? No, just keep simple */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: scheme.fill }}
                />

                 {/* Content */}
                <div className="relative z-10 flex items-center justify-between w-full overflow-hidden pl-1">
                  <span className="text-[11px] font-bold uppercase truncate tracking-tight" style={scheme.textStyle}>
                    {task.initiative}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-100" style={scheme.textStyle}>
                      {task.progress}%
                    </span>
                  </div>
                </div>

                {/* Milestone Indicator on Bar - Positioned at the end */}
                {task.milestone && (
                  <div 
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
                    title={`Milestone: ${task.milestone}`}
                  >
                    <div className="p-1 bg-white rounded-full shadow-md border border-slate-100 group-hover:scale-110 transition-transform">
                      <Diamond className="w-3.5 h-3.5 fill-current" style={scheme.textStyle} />
                    </div>
                  </div>
                )}

                {/* Tooltip Content - Moved below to avoid header cutoff */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-slate-900 text-white text-[11px] px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-[150] shadow-2xl font-bold border border-white/10 scale-90 group-hover:scale-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-indigo-300">โครงการ: {task.initiative}</span>
                    <span>ความคืบหน้า: {task.progress}%</span>
                    {task.milestone && <span className="text-rose-300">เป้าหมาย: {task.milestone}</span>}
                  </div>
                  {/* Arrow pointing up */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-t border-white/10" />
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapTaskItem;

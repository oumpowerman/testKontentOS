
import React from 'react';
import { Search, Plus, Filter, Layout, Maximize2, Clock, ListOrdered } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface RoadmapHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  categories: string[];
  onAddNew: () => void;
  onToggleFullScreen: () => void;
  sortMode: 'manual' | 'timeline';
  onToggleSort: () => void;
}

const RoadmapHeader: React.FC<RoadmapHeaderProps> = ({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  categories,
  onAddNew,
  onToggleFullScreen,
  sortMode,
  onToggleSort
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-10 py-8 bg-white border-b border-slate-100 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-2xl cursor-pointer hover:bg-indigo-100 transition-colors" onClick={onToggleFullScreen}>
          <Maximize2 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {BRAND_CONFIG.name} <span className="text-indigo-600">Roadmap</span>
          </h1>
          <p className="text-sm text-slate-400 font-semibold tracking-widest uppercase mt-0.5">การติดตามโครงการเชิงกลยุทธ์</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        {/* Sort Toggle */}
        <button
          onClick={onToggleSort}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all border ${
            sortMode === 'timeline' 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' 
              : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'
          }`}
        >
          {sortMode === 'timeline' ? <Clock className="w-4 h-4" /> : <ListOrdered className="w-4 h-4" />}
          {sortMode === 'timeline' ? 'เรียงตามเวลา' : 'เรียงอิสระ'}
        </button>

        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-100">
          {['ทั้งหมด', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange(cat === 'ทั้งหมด' ? 'All' : cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                (filter === 'All' && cat === 'ทั้งหมด') || filter === cat 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อโครงการ..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/5 w-64 md:w-80 transition-all font-semibold"
          />
        </div>
        
        <button 
          onClick={onAddNew}
          className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-base font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          โครงการใหม่
        </button>
      </div>
    </div>
  );
};

export default RoadmapHeader;


import React, { useState } from 'react';
import { MasterOption } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, PenTool, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

interface StockQuickFiltersProps {
  masterOptions: MasterOption[];
  currentStatuses: string[];
  setStatuses: (statuses: string[]) => void;
  currentTab: 'ACTIVE' | 'ARCHIVE';
  setTab: (tab: 'ACTIVE' | 'ARCHIVE') => void;
  showOnlyOverdue: boolean;
  setShowOnlyOverdue: (show: boolean) => void;
  overdueCount?: number;
}

const StockQuickFilters: React.FC<StockQuickFiltersProps> = ({ 
  masterOptions, 
  currentStatuses, 
  setStatuses,
  currentTab,
  setTab,
  showOnlyOverdue,
  setShowOnlyOverdue,
  overdueCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to find status keys by keyword
  const getKeysByKeywords = (keywords: string[]) => {
    return masterOptions
      .filter(opt => opt.type === 'STATUS')
      .filter(opt => {
        const label = (opt.label || '').toUpperCase();
        const key = (opt.key || '').toUpperCase();
        return keywords.some(kw => label.includes(kw) || key.includes(kw));
      })
      .map(opt => opt.key);
  };

  const PRE_PROD_KEYWORDS = ['IDEA', 'DRAFT', 'SCRIPT'];
  const PRODUCTION_KEYWORDS = ['SHOOT', 'EDIT', 'APPROVE', 'FEEDBACK'];

  const preProdKeys = getKeysByKeywords(PRE_PROD_KEYWORDS);
  const productionKeys = getKeysByKeywords(PRODUCTION_KEYWORDS);

  const toggleGroup = (keys: string[]) => {
    const allSelected = keys.length > 0 && keys.every(k => currentStatuses.includes(k)) && currentStatuses.length === keys.length;
    if (allSelected) {
      setStatuses([]);
    } else {
      setStatuses(keys);
    }
  };

  const isGroupActive = (keys: string[]) => {
    return keys.length > 0 && keys.every(k => currentStatuses.includes(k)) && currentStatuses.length === keys.length;
  };

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 overflow-hidden shadow-sm transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/40 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg group-hover:scale-110 transition-transform">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Quick Filters & Views</span>
        </div>
        <div className="flex items-center gap-3">
          {currentTab === 'ARCHIVE' && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 animate-pulse">
              ARCHIVE ACTIVE
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 flex flex-wrap items-center gap-3">
              {/* Main View Toggle */}
              <button
                onClick={() => setTab(currentTab === 'ACTIVE' ? 'ARCHIVE' : 'ACTIVE')}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all border
                  ${currentTab === 'ARCHIVE' 
                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}
                `}
              >
                <div className={`w-2 h-2 rounded-full ${currentTab === 'ARCHIVE' ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`} />
                {currentTab === 'ARCHIVE' ? 'VIEWING ARCHIVE' : 'OPEN ARCHIVE'}
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              {/* Status Groups */}
              <button
                onClick={() => toggleGroup(preProdKeys)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all
                  ${isGroupActive(preProdKeys) 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 ring-2 ring-amber-500 ring-offset-2' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30'}
                `}
              >
                <PenTool className="w-3.5 h-3.5" />
                PRE-PROD
              </button>

              <button
                onClick={() => toggleGroup(productionKeys)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all
                  ${isGroupActive(productionKeys) 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 ring-2 ring-emerald-500 ring-offset-2' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30'}
                `}
              >
                <Play className="w-3.5 h-3.5" />
                PRODUCTION
              </button>

              <button
                onClick={() => {
                   setShowOnlyOverdue(!showOnlyOverdue);
                   if (!showOnlyOverdue) setStatuses([]); // Clear status filter if focusing on overdue
                }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all
                  ${showOnlyOverdue 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 ring-2 ring-rose-500 ring-offset-2' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/30'}
                `}
              >
                <BarChart3 className={`w-3.5 h-3.5 ${showOnlyOverdue ? 'animate-bounce' : ''}`} />
                <span>ค้างกรอกสถิติ</span>
                {overdueCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${showOnlyOverdue ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'}`}>
                    {overdueCount}
                  </span>
                )}
              </button>

              {(currentStatuses.length > 0 || showOnlyOverdue) && (
                <button
                  onClick={() => {
                    setStatuses([]);
                    setShowOnlyOverdue(false);
                  }}
                  className="px-4 py-2.5 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-tight"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockQuickFilters;

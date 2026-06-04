
import React, { useState } from 'react';
import { MasterOption } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, PenTool, ChevronDown, ChevronUp, BarChart3, HardDrive, Archive } from 'lucide-react';

interface StockQuickFiltersProps {
  masterOptions: MasterOption[];
  currentStatuses: string[];
  setStatuses: (statuses: string[]) => void;
  currentTab: 'ACTIVE' | 'ARCHIVE';
  setTab: (tab: 'ACTIVE' | 'ARCHIVE') => void;
  showOnlyOverdue: boolean;
  setShowOnlyOverdue: (show: boolean) => void;
  overdueCount?: number;
  showOnlyMissingStorage: boolean;
  setShowOnlyMissingStorage: (show: boolean) => void;
  missingStorageCount?: number;
}

const StockQuickFilters: React.FC<StockQuickFiltersProps> = ({ 
  masterOptions, 
  currentStatuses, 
  setStatuses,
  currentTab,
  setTab,
  showOnlyOverdue,
  setShowOnlyOverdue,
  overdueCount = 0,
  showOnlyMissingStorage,
  setShowOnlyMissingStorage,
  missingStorageCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animating, setAnimating] = useState(false);

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

  const PRE_PROD_KEYWORDS = ['IDEA', 'SCRIPT'];
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
    <div className={`bg-white/40 backdrop-blur-md rounded-3xl border shadow-sm transition-all duration-300 ${isExpanded && !animating ? 'overflow-visible' : 'overflow-hidden'} ${!isExpanded && (overdueCount > 0 || missingStorageCount > 0) ? 'border-amber-200 shadow-amber-100/30 shadow-md ring-1 ring-amber-300/20' : 'border-white/60'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/40 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${!isExpanded && (overdueCount > 0 || missingStorageCount > 0) ? 'bg-amber-50' : 'bg-indigo-100'}`}>
            <Zap className={`w-3.5 h-3.5 ${!isExpanded && (overdueCount > 0 || missingStorageCount > 0) ? 'text-amber-500 animate-pulse' : 'text-indigo-600'}`} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 flex flex-wrap items-center gap-2">
            Quick Filters & Views
            {!isExpanded && overdueCount > 0 && (
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-kanit font-medium text-white bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-200"
              >
                <BarChart3 className="w-2.5 h-2.5" />
                ค้างกรอกสถิติ {overdueCount} 🚦
              </motion.span>
            )}
            {!isExpanded && missingStorageCount > 0 && (
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-kanit font-medium text-white bg-amber-600 rounded-full animate-pulse shadow-sm shadow-amber-250"
              >
                <HardDrive className="w-2.5 h-2.5" />
                ค้างเก็บพาร์ท/ไดรฟ์ {missingStorageCount} 💾
              </motion.span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {currentTab === 'ARCHIVE' && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 animate-pulse">
              ARCHIVE ACTIVE
            </span>
          )}
          {!isExpanded && (overdueCount > 0 || missingStorageCount > 0) && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
          <motion.div
            animate={(!isExpanded && (overdueCount > 0 || missingStorageCount > 0)) ? { y: [0, 3, 0] } : {}}
            transition={(!isExpanded && (overdueCount > 0 || missingStorageCount > 0)) ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className={`w-4 h-4 ${(overdueCount > 0 || missingStorageCount > 0) ? 'text-amber-500' : 'text-slate-400'}`} />}
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onAnimationStart={() => setAnimating(true)}
            onAnimationComplete={() => setAnimating(false)}
            className={isExpanded && !animating ? "overflow-visible" : "overflow-hidden"}
          >
            <div className="px-5 pb-5 pt-1 flex flex-wrap items-center gap-3">
              {/* Main View Toggle */}
              <div className="relative group/archive z-20">
                <button
                  id="archive-view-toggle"
                  onClick={() => setTab(currentTab === 'ACTIVE' ? 'ARCHIVE' : 'ACTIVE')}
                  className={`
                    flex items-center justify-center w-[38px] h-[38px] rounded-2xl text-xs font-black transition-all border
                    ${currentTab === 'ARCHIVE' 
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/20' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}
                  `}
                >
                  <Archive className={`w-5 h-5 ${currentTab === 'ARCHIVE' ? 'text-amber-400 animate-pulse' : 'text-slate-400 group-hover/archive:text-indigo-500 transition-colors'}`} />
                </button>
                
                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-0 mb-2.5 px-3 py-2 bg-slate-900 border border-slate-800 w-max max-w-[280px] text-left rounded-xl shadow-xl opacity-0 pointer-events-none group-hover/archive:opacity-100 scale-95 group-hover/archive:scale-100 transition-all duration-200 ease-out">
                  <div className="font-bold text-[10.5px] text-white">
                    {currentTab === 'ARCHIVE' ? '🗄️ ดูงานปัจจุบัน (Active View)' : '📦 ดูคลังที่เสร็จสิ้น (Archive View)'}
                  </div>
                  <div className="text-slate-400 text-[9.5px] font-kanit mt-0.5 leading-relaxed">
                    {currentTab === 'ARCHIVE' ? 'คลิกสลับเพื่อกลับสู่ตารางงานปกติ' : 'คลิกสลับเพื่อเปิดคลังคลิปวิดีโอรูปภาพเก่าเก็บบันทึก'}
                  </div>
                  <div className="absolute top-full left-[19px] -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-slate-900 border-r border-b border-slate-800" />
                </div>
              </div>

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
                   if (!showOnlyOverdue) {
                     setStatuses([]); // Clear status filter if focusing on overdue
                     setShowOnlyMissingStorage(false);
                   }
                }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all
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

              <button
                onClick={() => {
                   setShowOnlyMissingStorage(!showOnlyMissingStorage);
                   if (!showOnlyMissingStorage) {
                     setStatuses([]); // Clear status filter if focusing on missing storage
                     setShowOnlyOverdue(false);
                   }
                }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all
                  ${showOnlyMissingStorage 
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-200 ring-2 ring-amber-600 ring-offset-2' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/30'}
                `}
              >
                <HardDrive className={`w-3.5 h-3.5 ${showOnlyMissingStorage ? 'animate-bounce' : ''}`} />
                <span>ค้างเก็บพาร์ท/ไดรฟ์</span>
                {missingStorageCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${showOnlyMissingStorage ? 'bg-white text-amber-700' : 'bg-amber-600 text-white'}`}>
                    {missingStorageCount}
                  </span>
                )}
              </button>

              {(currentStatuses.length > 0 || showOnlyOverdue || showOnlyMissingStorage) && (
                <button
                  onClick={() => {
                    setStatuses([]);
                    setShowOnlyOverdue(false);
                    setShowOnlyMissingStorage(false);
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

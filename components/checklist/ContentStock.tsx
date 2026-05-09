
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Task, Channel, User, MasterOption } from '../../types';
import { Loader2, Upload, Download, Plus, PackageSearch, Archive, History, Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MentorTip from '../MentorTip';
import { useToast } from '../../context/ToastContext';
import { useContentStock } from '../../hooks/useContentStock';
import NotificationBellBtn from '../NotificationBellBtn';
import { useStockSync } from '../../hooks/useStockSync';
import { parseContentStockCSV } from '../../services/csvService';
import { supabase } from '../../lib/supabase';
import AppBackground, { BackgroundTheme } from '../common/AppBackground';

// Sub-Components
import StockFilterBar from './stock/StockFilterBar';
import StockQuickFilters from './stock/StockQuickFilters';
import StockTable from './stock/StockTable';
import StockInventoryModal from './stock/inventory/StockInventoryModal';
import StockUtilities from './stock/StockUtilities';
import StockCountBadge from './stock/StockCountBadge';
import StockShootQueue from './stock/StockShootQueue';

interface ContentStockProps {
  tasks: Task[]; // Sync Source
  channels: Channel[];
  users: User[];
  masterOptions: MasterOption[];
  onSchedule: (task: Task) => void;
  onEdit: (task: Task) => void;
  onAdd: () => void;
  onOpenSettings: () => void;
  onAddToWorkbox?: (task: Task) => void;
  onEditScript?: (scriptId: string) => void;
}

type SortKey = 'title' | 'status' | 'date' | 'remark' | 'publishDate' | 'shootDate' | 'shortNote' | 'ideaOwner' | 'editor' | 'helper' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

const ContentStock: React.FC<ContentStockProps> = ({ tasks: globalTasks, channels, users, masterOptions, onSchedule, onEdit, onAdd, onOpenSettings, onAddToWorkbox, onEditScript }) => {
  const { showToast } = useToast();

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [filterFormat, setFilterFormat] = useState<string[]>([]);
  const [filterPillar, setFilterPillar] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  
  // Updated: Range Filter
  const [filterHasShootDate, setFilterHasShootDate] = useState(false);
  const [filterShootDateStart, setFilterShootDateStart] = useState('');
  const [filterShootDateEnd, setFilterShootDateEnd] = useState('');
  
  const [showStockOnly, setShowStockOnly] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewTab = (searchParams.get('stockMode') as 'LIST' | 'QUEUE') || 'LIST';
  const contentSubTab = (searchParams.get('stockTab') as 'ACTIVE' | 'ARCHIVE') || 'ACTIVE';

  const setViewTab = (tab: 'LIST' | 'QUEUE') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      // HARD PRESERVE: Never allow view to be stripped in this view
      next.set('view', 'ContentStock');

      if (tab === 'QUEUE') {
        next.set('stockMode', 'QUEUE');
        next.delete('stockTab');
      } else {
        next.delete('stockMode');
      }
      return next;
    }, { replace: true });
  };

  const setContentSubTab = (tab: 'ACTIVE' | 'ARCHIVE' | ((prev: 'ACTIVE' | 'ARCHIVE') => 'ACTIVE' | 'ARCHIVE')) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      // HARD PRESERVE: Never allow view to be stripped in this view
      next.set('view', 'ContentStock');

      const currentTab = (next.get('stockTab') as 'ACTIVE' | 'ARCHIVE') || 'ACTIVE';
      const nextTab = typeof tab === 'function' ? tab(currentTab) : tab;
      
      if (nextTab === 'ARCHIVE') {
        next.set('stockTab', 'ARCHIVE');
      } else {
        next.delete('stockTab');
      }
      return next;
    }, { replace: true });
  };

  // --- Sort States ---
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'createdAt', direction: 'desc' });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- CSV Import State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Reset pagination when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery, filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, sortConfig]);

  // --- MEMOIZED FILTERS (Fixes Infinite Loop) ---
  const filters = useMemo(() => ({
      channelId: filterChannel,
      format: filterFormat,
      pillar: filterPillar,
      category: filterCategory,
      statuses: filterStatuses,
      hasShootDate: filterHasShootDate, // Added
      shootDateStart: filterShootDateStart, // Added
      shootDateEnd: filterShootDateEnd,     // Added
      showStockOnly: showStockOnly,
      contentSubTab: contentSubTab
  }), [filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, contentSubTab]);

  // Transition Effect
  useEffect(() => {
      setIsFiltering(true);
      const timer = setTimeout(() => setIsFiltering(false), 500);
      return () => clearTimeout(timer);
  }, [filters]);

  // --- SERVER SIDE HOOK ---
  const { contents: paginatedTasks, totalCount, isLoading, isRefreshing, fetchContents, updateLocalItem, toggleShootQueue } = useContentStock({
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      searchQuery: searchQuery,
      filters: filters,
      sortConfig: sortConfig
  });

  // --- HYBRID SYNC: Watch Global Tasks ---
  useStockSync(globalTasks, paginatedTasks, updateLocalItem, () => setCurrentPage(1));

  // --- Handle Sorting ---
  const handleSort = (key: SortKey) => {
      setSortConfig(current => {
          if (current && current.key === key) {
              return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
          }
          // Default to desc for date-related columns, asc for others
          const isDateKey = key === 'date' || key === 'publishDate' || key === 'shootDate';
          return { key, direction: isDateKey ? 'desc' : 'asc' };
      });
  };

  const handlePageChange = (newPage: number) => {
      setCurrentPage(newPage);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterChannel('ALL');
    setFilterFormat([]);
    setFilterPillar([]);
    setFilterCategory([]);
    setFilterHasShootDate(false);
    setFilterShootDateStart(''); 
    setFilterShootDateEnd('');
    setFilterStatuses([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
        // Use Service for Parsing
        const newTasksPayload = await parseContentStockCSV(file, users, channels, masterOptions);

        if (newTasksPayload.length > 0) {
            const { error } = await supabase.from('contents').insert(newTasksPayload);
            if (error) throw error;
            showToast(`นำเข้าสำเร็จ ${newTasksPayload.length} รายการ 🎉`, 'success');
            // Jump to Page 1 to see new items
            setCurrentPage(1);
            // Refresh list
            fetchContents();
        } else {
            showToast('ไม่พบข้อมูลในไฟล์ หรือรูปแบบไม่ถูกต้อง', 'warning');
        }
    } catch (err: any) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการนำเข้า: ' + err.message, 'error');
    } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
        const exampleFormat = masterOptions.filter(o => o.type === 'FORMAT').length > 0 ? masterOptions.filter(o => o.type === 'FORMAT')[0].key : "Short Form";
        const headers = ["Content Format","Pillar","Category","Content Topic","Status","Publish Date","Chanel","Owner","IDEA","Edit","Sub","Help","Remark หมายเหตุ","Post"];
        const exampleRow = [`"${exampleFormat}"`,"Education","Review",`"ตัวอย่าง: รีวิวกล้องใหม่"`,`"TODO"`,`"01/01/2024"`,`"Juijui Vlog"`,`"Admin"`,`"รายละเอียด"`,`"Editor"`,`"Support"`,``,`"หมายเหตุ"`,`"TikTok"`].join(",");
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + exampleRow;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `juijui_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  };

  const bgTheme = useMemo(() => {
    const themes: BackgroundTheme[] = [
      'pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-purple', 'pastel-orange', 'pastel-yellow', 'pastel-teal'
    ];
    return themes[Math.floor(Math.random() * themes.length)];
  }, []);

  return (
    <AppBackground theme={bgTheme} pattern="icons" className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 p-4 md:p-8 min-h-screen">
      <div className="relative z-10 space-y-4 animate-in fade-in duration-500 pb-20">
        <MentorTip variant="purple" messages={[
            "มุมมอง List แบบละเอียด ช่วยให้เช็คสถานะงานได้ครบถ้วน", 
            "ใช้ตัวกรอง Status เลือกดูเฉพาะขั้นตอนที่สนใจได้ เช่น ดูเฉพาะ 'Script' และ 'Shooting'", 
            "ใหม่! ระบบ Shoot Queue ช่วยให้คุณจัดคิวถ่ายทำวันนี้ได้ง่ายขึ้น ไม่ว่าจะมีสคริปต์หรือไม่ก็ตาม"
        ]} />

        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white/70 backdrop-blur-2xl pt-6 pb-5 px-6 md:px-8 rounded-[2.5rem] border border-white/80 shadow-2xl shadow-indigo-500/10">
              <div className="flex-1 w-full xl:w-auto min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                      <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center tracking-tight shrink-0">
                          <span className="text-3xl md:text-4xl mr-3 transform group-hover:scale-110 transition-transform">{viewTab === 'LIST' ? '📑' : '🎬'}</span>
                          <span className="truncate">{viewTab === 'LIST' ? 'รายการคอนเทนต์' : 'คิวถ่ายทำวันนี้'}</span>
                          {viewTab === 'LIST' && <StockCountBadge count={totalCount} isLoading={isLoading} />}
                      </h1>

                      {/* Tab Switcher */}
                      <div className="inline-flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner w-full sm:w-auto">
                          <button 
                            onClick={() => {
                              setSearchParams(prev => {
                                const next = new URLSearchParams(prev);
                                next.set('view', 'ContentStock'); // Ensure view is explicitly set/preserved
                                next.delete('stockMode'); // Switch to LIST
                                next.delete('stockTab');  // Default to ACTIVE
                                return next;
                              }, { replace: true });
                            }}
                            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${viewTab === 'LIST' && contentSubTab === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                          >
                            คลังคอนเทนต์
                          </button>
                          <button 
                            onClick={() => setViewTab('QUEUE')}
                            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${viewTab === 'QUEUE' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                          >
                            คิวถ่ายวันนี้
                          </button>
                      </div>
                  </div>

                  {/* Quick Channel Chips */}
                  {viewTab === 'LIST' && (
                    <div className="w-full overflow-x-auto scrollbar-hide -mx-2 px-2 pb-1">
                        <div className="flex items-center gap-2.5 pt-1 flex-nowrap min-w-max pr-4">
                            <button
                                onClick={() => setFilterChannel('ALL')}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border shadow-sm shrink-0 ${filterChannel === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white/90 text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                            >
                                🔥 รวมมิตร (All)
                            </button>
                            {channels.map(ch => {
                                const bgClass = (ch.color || 'bg-slate-100').split(' ')[0].replace('bg-', 'bg-');
                                return (
                                    <button
                                        key={ch.id}
                                        onClick={() => setFilterChannel(ch.id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-2 shadow-sm shrink-0 ${filterChannel === ch.id ? 'ring-2 ring-indigo-500 border-transparent text-slate-800 bg-white ring-offset-2' : 'border-slate-200 hover:border-indigo-300 bg-white/90 text-slate-600 hover:text-indigo-600'}`}
                                    >
                                    <span className={`w-2.5 h-2.5 rounded-full ${bgClass} shadow-sm`}></span>
                                    {ch.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                  )}
              </div>

              {/* Action Side */}
              <div className="flex items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
                  {/* Utilities (Inventory, Import, Template) */}
                  {viewTab === 'LIST' && (
                    <>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                        <StockUtilities 
                            onOpenInventory={() => setIsInventoryModalOpen(true)}
                            onImportClick={() => fileInputRef.current?.click()}
                            onDownloadTemplate={handleDownloadTemplate}
                            isImporting={isImporting}
                        />
                    </>
                  )}

                  {/* Fixed Critical Actions (Add & Notification) */}
                  <div className="flex items-center gap-4 shrink-0 ml-auto xl:ml-0">
                      {/* Premium Pastel Add Button: The "Million Dollar Idea" Entry */}
                      <motion.button
                          whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
                          whileTap={{ scale: 0.95 }}
                          onClick={onAdd}
                          className="
                              relative group flex items-center gap-3 px-7 py-3.5 rounded-[1.5rem]
                              bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400
                              text-white font-bold text-sm tracking-tight
                              shadow-[0_10px_25px_-5px_rgba(165,180,252,0.5)]
                              hover:shadow-[0_20px_40px_-10px_rgba(192,132,252,0.6)]
                              transition-all duration-500 border border-white/30
                              overflow-hidden
                          "
                      >
                          {/* Floating Sparkle Animation */}
                          <motion.div
                              animate={{ 
                                  y: [0, -4, 0],
                                  opacity: [0.5, 1, 0.5]
                              }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute top-1 right-3 pointer-events-none"
                          >
                              <Sparkles className="w-3 h-3 text-white/80" />
                          </motion.div>

                          {/* Shimmer Light effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                          <div className="relative z-10 flex items-center gap-2">
                              <motion.div
                                  animate={{ rotate: [0, 90, 0] }}
                                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                  className="bg-white/20 p-1 rounded-lg backdrop-blur-sm"
                              >
                                  <Plus className="w-5 h-5 stroke-[3.5px]" />
                              </motion.div>
                              <span className="drop-shadow-sm">เพิ่มคอนเทนต์</span>
                          </div>

                          {/* Glow background on hover */}
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.button>

                      <NotificationBellBtn
                          onClick={onOpenSettings}
                          className="flex shrink-0 shadow-sm"
                      />
                  </div>
              </div>
          </div>
        </div>

        {viewTab === 'LIST' ? (
            <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={contentSubTab}
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.01 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="space-y-3"
                    >
                        {/* Quick Filters */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.05 }}
                        >
                            <StockQuickFilters 
                                masterOptions={masterOptions}
                                currentStatuses={filterStatuses}
                                setStatuses={setFilterStatuses}
                                currentTab={contentSubTab}
                                setTab={setContentSubTab}
                            />
                        </motion.div>

                        {/* Filter Bar */}
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5 border border-white/60 p-1 relative z-50"
                        >
                <StockFilterBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterChannel={filterChannel}
                    setFilterChannel={setFilterChannel}
                    filterFormat={filterFormat}
                    setFilterFormat={setFilterFormat}
                    filterPillar={filterPillar}
                    setFilterPillar={setFilterPillar}
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                    filterStatuses={filterStatuses}
                    setFilterStatuses={setFilterStatuses}
                    contentSubTab={contentSubTab}
                    
                    filterHasShootDate={filterHasShootDate}
                    setFilterHasShootDate={setFilterHasShootDate}
                    filterShootDateStart={filterShootDateStart}
                    setFilterShootDateStart={setFilterShootDateStart}
                    filterShootDateEnd={filterShootDateEnd}
                    setFilterShootDateEnd={setFilterShootDateEnd}
                    
                    showStockOnly={showStockOnly}
                    setShowStockOnly={setShowStockOnly}
                    clearFilters={clearFilters}
                    channels={channels}
                    masterOptions={masterOptions}
                />
                </motion.div>

                {/* Table Background & Container */}
                <motion.div 
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/80 overflow-hidden relative"
                >
                    <StockTable
                        isLoading={isLoading || isFiltering}
                        isFiltering={isFiltering}
                        tasks={paginatedTasks}
                        channels={channels}
                        users={users}
                        masterOptions={masterOptions}
                        sortConfig={sortConfig}
                        onSort={(key) => handleSort(key as any)}
                        totalCount={totalCount}
                        currentPage={currentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        onEdit={onEdit}
                        onSchedule={onSchedule}
                        onToggleQueue={toggleShootQueue}
                        onAddToWorkbox={onAddToWorkbox}
                        onEditScript={onEditScript}
                    />

                    {/* Scanning Ray effect during transitions */}
                    <AnimatePresence>
                        {isFiltering && (
                            <motion.div
                                initial={{ top: '-40%' }}
                                animate={{ top: '120%' }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                                className="absolute inset-x-0 h-40 z-50 pointer-events-none flex flex-col items-center"
                            >
                                <div className="w-full h-[2px] bg-indigo-500 shadow-[0_0_20px_2px_rgba(99,102,241,0.6)]" />
                                <div className="w-full h-full bg-gradient-to-b from-indigo-500/10 to-transparent" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    </div>
) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
                <StockShootQueue 
                    channels={channels}
                    users={users}
                    masterOptions={masterOptions}
                    onEditContent={onEdit}
                    onEditScript={onEditScript}
                />
            </div>
        )}

        <StockInventoryModal 
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          masterOptions={masterOptions}
          channels={channels}
        />
      </div>
    </AppBackground>
  );
};

export default ContentStock;

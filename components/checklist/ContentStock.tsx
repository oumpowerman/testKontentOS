
import React, { useMemo } from 'react';
import { Task, Channel, User, MasterOption } from '../../types';
import { Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MentorTip from '../MentorTip';
import { useStockSync } from '../../hooks/useStockSync';
import AppBackground, { BackgroundTheme } from '../common/AppBackground';
import { useContentStockController } from '../../hooks/useContentStockController';

// Sub-Components
import StockFilterBar from './stock/StockFilterBar';
import StockQuickFilters from './stock/StockQuickFilters';
import StockTable from './stock/StockTable';
import StockInventoryModal from './stock/inventory/StockInventoryModal';
import StockUtilities from './stock/StockUtilities';
import StockCountBadge from './stock/StockCountBadge';
import StockShootQueue from './stock/StockShootQueue';
import StockChannelStack from './stock/StockChannelStack';
import AnalyticsEntryModal from '../analytics/AnalyticsEntryModal';
import NotificationBellBtn from '../NotificationBellBtn';

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

const ContentStock: React.FC<ContentStockProps> = ({ tasks: globalTasks, channels, users, masterOptions, onSchedule, onEdit, onAdd, onOpenSettings, onAddToWorkbox, onEditScript }) => {
  const {
      searchQuery, setSearchQuery,
      filterChannel, setFilterChannel,
      filterFormat, setFilterFormat,
      filterPillar, setFilterPillar,
      filterCategory, setFilterCategory,
      filterStatuses, setFilterStatuses,
      filterOnlyOverdue, setFilterOnlyOverdue,
      filterHasShootDate, setFilterHasShootDate,
      filterShootDateStart, setFilterShootDateStart,
      filterShootDateEnd, setFilterShootDateEnd,
      showStockOnly, setShowStockOnly,
      isFiltering,
      isInventoryModalOpen, setIsInventoryModalOpen,
      selectedContentForAnalytics, setSelectedContentForAnalytics,
      viewTab, setViewTab,
      contentSubTab, setContentSubTab,
      sortConfig,
      currentPage, setCurrentPage,
      ITEMS_PER_PAGE,
      fileInputRef,
      isImporting,
      handleFileUpload,
      handleDownloadTemplate,
      clearFilters,
      handleSort,
      paginatedTasks,
      totalCount,
      overdueCount,
      isLoading,
      setSearchParams,
      updateLocalItem,
      toggleShootQueue
  } = useContentStockController({ globalTasks, channels, users, masterOptions });

  // --- HYBRID SYNC: Watch Global Tasks ---
  useStockSync(globalTasks, paginatedTasks, updateLocalItem, () => setCurrentPage(1));

  const bgTheme = useMemo(() => {
    const themes: BackgroundTheme[] = [
      'pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-purple', 'pastel-orange', 'pastel-yellow', 'pastel-teal'
    ];
    return themes[Math.floor(Math.random() * themes.length)];
  }, []);

  return (
    <AppBackground theme={bgTheme} pattern="icons" className="p-4 md:p-8 min-h-screen overflow-x-hidden">
      <div className="relative z-10 space-y-4 animate-in fade-in duration-500 pb-20 max-w-full overflow-x-hidden">
        <MentorTip variant="purple" messages={[
            "มุมมอง List แบบละเอียด ช่วยให้เช็คสถานะงานได้ครบถ้วน", 
            "ใช้ตัวกรอง Status เลือกดูเฉพาะขั้นตอนที่สนใจได้ เช่น ดูเฉพาะ 'Script' และ 'Shooting'", 
            "ใหม่! ระบบ Shoot Queue ช่วยให้คุณจัดคิวถ่ายทำวันนี้ได้ง่ายขึ้น ไม่ว่าจะมีสคริปต์หรือไม่ก็ตาม"
        ]} />

        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white/70 backdrop-blur-2xl pt-6 pb-5 px-6 md:px-8 rounded-[2.5rem] border border-white/80 shadow-2xl shadow-indigo-500/10">
              <div className="flex-1 w-full xl:w-auto min-w-0">
                  <motion.div 
                      layout
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5"
                  >
                      <motion.h1 
                          layout
                          transition={{ type: "spring", stiffness: 300, damping: 28 }}
                          className="text-2xl md:text-3xl font-black text-slate-800 flex items-center tracking-tight shrink-0 overflow-hidden min-h-[44px] relative"
                      >
                          <AnimatePresence mode="popLayout">
                              <motion.span
                                  key={viewTab}
                                  initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                  exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                  className="inline-flex items-center whitespace-nowrap"
                              >
                                  <span className="text-3xl md:text-4xl mr-3 transform group-hover:scale-110 transition-transform">{viewTab === 'LIST' ? '📑' : '🎬'}</span>
                                  <span className="truncate">{viewTab === 'LIST' ? 'รายการคอนเทนต์' : 'คิวถ่ายทำวันนี้'}</span>
                                  <AnimatePresence>
                                      {viewTab === 'LIST' && (
                                          <motion.div
                                              initial={{ width: 0, opacity: 0, scale: 0.8, marginLeft: 0 }}
                                              animate={{ width: "auto", opacity: 1, scale: 1, marginLeft: 8 }}
                                              exit={{ width: 0, opacity: 0, scale: 0.8, marginLeft: 0 }}
                                              transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                              className="inline-flex overflow-hidden"
                                          >
                                              <StockCountBadge count={totalCount} isLoading={isLoading} />
                                          </motion.div>
                                      )}
                                  </AnimatePresence>
                              </motion.span>
                          </AnimatePresence>
                      </motion.h1>

                      {/* Tab Switcher */}
                      <motion.div 
                          layout
                          transition={{ type: "spring", stiffness: 300, damping: 28 }}
                          className="relative inline-flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner w-full sm:w-auto overflow-hidden"
                      >
                          <button 
                            onClick={() => {
                              setSearchParams(prev => {
                                const next = new URLSearchParams(prev);
                                next.set('view', 'ContentStock'); 
                                next.delete('stockMode'); 
                                next.delete('stockTab'); 
                                return next;
                              }, { replace: true });
                            }}
                            className={`relative flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-black transition-colors duration-300 ${viewTab === 'LIST' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            {viewTab === 'LIST' && (
                              <motion.div 
                                layoutId="activeStockTabPill" 
                                transition={{ type: "spring", stiffness: 380, damping: 30 }} 
                                className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/60"
                                style={{ zIndex: 0 }}
                              />
                            )}
                            <span className="relative z-10">คลังคอนเทนต์</span>
                          </button>
                          <button 
                            onClick={() => {
                                setViewTab('QUEUE');
                            }}
                            className={`relative flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-black transition-colors duration-300 ${viewTab === 'QUEUE' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            {viewTab === 'QUEUE' && (
                              <motion.div 
                                layoutId="activeStockTabPill" 
                                transition={{ type: "spring", stiffness: 380, damping: 30 }} 
                                className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/60"
                                style={{ zIndex: 0 }}
                              />
                            )}
                            <span className="relative z-10">คิวถ่ายวันนี้</span>
                          </button>
                      </motion.div>
                  </motion.div>

                  {/* Quick Channel Chips */}
                  {viewTab === 'LIST' && (
                    <div className="pt-2 pb-1">
                      <StockChannelStack 
                        channels={channels}
                        selectedChannelIds={filterChannel}
                        onSelectChannels={setFilterChannel}
                      />
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

        <AnimatePresence mode="wait">
          {viewTab === 'LIST' ? (
            <motion.div 
              key="content-list-tab"
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden w-full"
            >
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
                                showOnlyOverdue={filterOnlyOverdue}
                                setShowOnlyOverdue={setFilterOnlyOverdue}
                                overdueCount={overdueCount}
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
                    tasks={globalTasks}
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
                        isOverdueFilterActive={filterOnlyOverdue}
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
                        onOpenAnalytics={(content) => setSelectedContentForAnalytics(content)}
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
            </motion.div>
          ) : (
            <motion.div
              key="shoot-queue-tab"
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <StockShootQueue 
                  channels={channels}
                  users={users}
                  masterOptions={masterOptions}
                  onEditContent={onEdit}
                  onEditScript={onEditScript}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <StockInventoryModal 
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          masterOptions={masterOptions}
          channels={channels}
        />

        {selectedContentForAnalytics && (
            <AnalyticsEntryModal 
                content={selectedContentForAnalytics as any}
                onClose={() => setSelectedContentForAnalytics(null)}
                onSave={() => {}}
            />
        )}
      </div>
    </AppBackground>
  );
};

export default ContentStock;

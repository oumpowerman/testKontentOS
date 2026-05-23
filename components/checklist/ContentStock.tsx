
import React, { useMemo } from 'react';
import { Task, Channel, User, MasterOption } from '../../types';
import { Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MentorTip from '../MentorTip';
import { useStockSync } from '../../hooks/useStockSync';
import AppBackground, { BackgroundTheme } from '../common/AppBackground';
import { useContentStockController } from '../../hooks/useContentStockController';

// Sub-Components
import StockHeader from './stock/StockHeader.tsx';
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
import { useShootQueueContext } from '../../context/ShootQueueContext';

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

  const { queueItems } = useShootQueueContext();
  const queueCount = queueItems?.length || 0;

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

        {/* Refactored Header Component */}
        <StockHeader 
          viewTab={viewTab}
          setViewTab={setViewTab}
          channels={channels}
          filterChannel={filterChannel}
          setFilterChannel={setFilterChannel}
          totalCount={totalCount}
          isLoading={isLoading}
          queueCount={queueCount}
          fileInputRef={fileInputRef}
          isImporting={isImporting}
          handleFileUpload={handleFileUpload}
          handleDownloadTemplate={handleDownloadTemplate}
          setIsInventoryModalOpen={setIsInventoryModalOpen}
          onAdd={onAdd}
          onOpenSettings={onOpenSettings}
          setSearchParams={setSearchParams}
        />

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
                  onEditContent={(thinTask) => {
                      const fullTask = globalTasks.find(t => t.id === thinTask.id);
                      onEdit(fullTask || thinTask);
                  }}
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

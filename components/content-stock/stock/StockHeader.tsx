import React from 'react';
import { Task, Channel } from '../../../types';
import { Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StockChannelStack from './StockChannelStack';
import StockUtilities from './StockUtilities';
import StockCountBadge from './StockCountBadge';
import NotificationBellBtn from '../../NotificationBellBtn';

interface StockHeaderProps {
  viewTab: 'LIST' | 'QUEUE';
  setViewTab: (tab: 'LIST' | 'QUEUE') => void;
  channels: Channel[];
  filterChannel: string[];
  setFilterChannel: React.Dispatch<React.SetStateAction<string[]>>;
  totalCount: number;
  isLoading: boolean;
  queueCount: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isImporting: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadTemplate: () => void;
  setIsInventoryModalOpen: (open: boolean) => void;
  onAdd: () => void;
  onOpenSettings: () => void;
  setSearchParams: any;
}

const StockHeader: React.FC<StockHeaderProps> = ({
  viewTab,
  setViewTab,
  channels,
  filterChannel,
  setFilterChannel,
  totalCount,
  isLoading,
  queueCount,
  fileInputRef,
  isImporting,
  handleFileUpload,
  handleDownloadTemplate,
  setIsInventoryModalOpen,
  onAdd,
  onOpenSettings,
  setSearchParams
}) => {
  return (
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
            <AnimatePresence mode="wait">
              <motion.span
                key={viewTab}
                initial={{ y: 15, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -15, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center whitespace-nowrap"
              >
                <span className="text-3xl md:text-4xl mr-3 transform group-hover:scale-110 transition-transform">
                  {viewTab === 'LIST' ? '📑' : '🎬'}
                </span>
                <span className="truncate">
                  {viewTab === 'LIST' ? 'รายการคอนเทนต์' : 'คิวถ่ายทำวันนี้'}
                </span>
                {viewTab === 'LIST' && (
                  <div className="inline-flex select-none shrink-0">
                    <StockCountBadge count={totalCount} isLoading={isLoading} />
                  </div>
                )}
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
                setSearchParams((prev: URLSearchParams) => {
                  const next = new URLSearchParams(prev);
                  next.set('view', 'ContentStock'); 
                  next.delete('stockMode'); 
                  next.delete('stockTab'); 
                  return next;
                }, { replace: true });
                setViewTab('LIST');
              }}
              className={`relative flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-black transition-colors duration-300 flex items-center justify-center gap-2 z-10 ${
                viewTab === 'LIST' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {viewTab === 'LIST' && (
                <motion.div 
                  layoutId="activeStockTabPill" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }} 
                  className="absolute inset-0 bg-emerald-50/60 rounded-xl shadow-sm border border-emerald-100/80 z-0"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">คลังคอนเทนต์</span>
            </button>
            <button 
              onClick={() => {
                setViewTab('QUEUE');
              }}
              className={`relative flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-black transition-colors duration-300 flex items-center justify-center gap-2 z-10 ${
                viewTab === 'QUEUE' ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {viewTab === 'QUEUE' && (
                <motion.div 
                  layoutId="activeStockTabPill" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }} 
                  className="absolute inset-0 bg-indigo-50/60 rounded-xl shadow-sm border border-indigo-100 z-0"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                คิวถ่ายวันนี้
                <AnimatePresence>
                  {queueCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="flex items-center justify-center h-5 px-2 min-w-[20px] rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                    >
                      {queueCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
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
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              className="hidden" 
            />
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
          {/* Premium Pastel Add Button */}
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
  );
};

export default StockHeader;

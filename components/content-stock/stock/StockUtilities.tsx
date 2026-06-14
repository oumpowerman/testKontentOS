import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  Download, 
  PackageSearch, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Wrench
} from 'lucide-react';

interface StockUtilitiesProps {
  onOpenInventory: () => void;
  onImportClick: () => void;
  onDownloadTemplate: () => void;
  isImporting: boolean;
}

const StockUtilities: React.FC<StockUtilitiesProps> = ({
  onOpenInventory,
  onImportClick,
  onDownloadTemplate,
  isImporting
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-sm">
                {/* Inventory Analysis */}
                <button
                    onClick={onOpenInventory}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-sm group active:scale-95"
                    title="วิเคราะห์คลังคอนเทนต์"
                >
                    <PackageSearch className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </button>

                {/* Import/Template Group */}
                <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={onImportClick}
                        disabled={isImporting}
                        className="px-3 py-1.5 text-[10px] font-black text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg flex items-center transition-all disabled:opacity-50 active:scale-95"
                    >
                        {isImporting ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Upload className="w-3 h-3 mr-1.5" />} IMPORT
                    </button>
                    <div className="w-[1px] h-3 bg-slate-300 mx-0.5"></div>
                    <button
                        onClick={onDownloadTemplate}
                        className="px-3 py-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg flex items-center transition-all active:scale-95"
                    >
                        <Download className="w-3 h-3 mr-1.5" /> TEMPLATE
                    </button>
                </div>
            </div>

            <button 
                onClick={() => setIsExpanded(false)}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-2xl border border-slate-200 transition-all active:scale-95"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all shadow-sm group active:scale-95"
            >
                <Wrench className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
                <span className="text-[11px] font-black uppercase tracking-tight">Tools</span>
                <ChevronLeft className="ml-1 w-3.5 h-3.5 text-slate-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockUtilities;

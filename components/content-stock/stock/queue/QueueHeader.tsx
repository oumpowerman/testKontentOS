import React from 'react';
import { ListChecks, PlayCircle, LayoutGrid, List, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { QueueViewMode } from './types';

interface QueueHeaderProps {
    includeScripts: boolean;
    setIncludeScripts: (val: boolean) => void;
    viewMode: QueueViewMode;
    setViewMode: (mode: QueueViewMode) => void;
    finishedCount: number;
    isBatchProcessing: boolean;
    onBatchProcess: () => void;
    onSortByTime: () => void;
}

const QueueHeader: React.FC<QueueHeaderProps> = ({
    includeScripts,
    setIncludeScripts,
    viewMode,
    setViewMode,
    finishedCount,
    isBatchProcessing,
    onBatchProcess,
    onSortByTime
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                    <ListChecks className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Checklist ถ่ายทำวันนี้</h2>
                    <p className="text-sm text-gray-500">จัดการรายการที่ต้องถ่ายทำในวันนี้ให้เสร็จสิ้น</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* Sort by Time */}
                <button
                    onClick={onSortByTime}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    title="เรียงตามเวลาที่วางแผนไว้"
                >
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    เรียงตามเวลา
                </button>
                {/* View Switcher */}
                <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setViewMode('GRID')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        title="มุมมองการ์ด"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('TABLE')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'TABLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        title="มุมมองตาราง"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter Switcher */}
                <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200">
                    <button 
                        onClick={() => setIncludeScripts(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${includeScripts ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        รวมสคริปต์จาก Hub
                    </button>
                    <button 
                        onClick={() => setIncludeScripts(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!includeScripts ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        เฉพาะ Content Stock
                    </button>
                </div>

                {/* Batch Action */}
                {finishedCount > 0 && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={onBatchProcess}
                        disabled={isBatchProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
                    >
                        <PlayCircle className="w-4 h-4" />
                        ยืนยันและประมวลผล ({finishedCount})
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default QueueHeader;

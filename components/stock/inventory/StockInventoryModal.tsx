
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, BarChart3, PackageSearch, Loader2, RotateCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Task, MasterOption } from '../../../types';
import InventorySummaryTable from './InventorySummaryTable';
import InventoryDashboard from './InventoryDashboard';

interface StockInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    masterOptions: MasterOption[];
}

const StockInventoryModal: React.FC<StockInventoryModalProps> = ({ isOpen, onClose, masterOptions }) => {
    const [activeTab, setActiveTab] = useState<'STATS' | 'TABLE'>('STATS');
    const [stockTasks, setStockTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchStockData();
        }
    }, [isOpen]);

    const fetchStockData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('contents')
                .select('*')
                .eq('is_unscheduled', true);

            if (error) throw error;

            if (data) {
                const mapped: Task[] = data.map(d => ({
                    id: d.id,
                    title: d.title,
                    pillar: d.pillar,
                    category: d.category,
                    status: d.status,
                    contentFormats: d.content_formats || [],
                    createdAt: d.created_at ? new Date(d.created_at) : undefined
                } as unknown as Task));
                setStockTasks(mapped);
            }
        } catch (err) {
            console.error('Fetch stock inventory failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-6xl bg-gray-50 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-white px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                            <PackageSearch className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Content Inventory Analysis</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">วิเคราะห์คลังคอนเทนต์ (Stock Only)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Refresh Button */}
                        <button
                            onClick={fetchStockData}
                            disabled={isLoading}
                            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                            title="รีเฟรชข้อมูล"
                        >
                            <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Tab Switcher */}
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setActiveTab('STATS')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'STATS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Dashboard
                            </button>
                            <button
                                onClick={() => setActiveTab('TABLE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'TABLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Breakdown
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-8 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-sm">กำลังรวบรวมข้อมูลคลัง...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'STATS' ? (
                                    <InventoryDashboard tasks={stockTasks} masterOptions={masterOptions} />
                                ) : (
                                    <InventorySummaryTable tasks={stockTasks} masterOptions={masterOptions} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white px-8 py-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Total Unscheduled Items: {stockTasks.length}</span>
                    <span>Last Updated: {new Date().toLocaleTimeString()}</span>
                </div>
            </motion.div>
        </div>
    );
};

export default StockInventoryModal;

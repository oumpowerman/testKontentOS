
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Check, GripVertical, Eye, EyeOff } from 'lucide-react';

export type ColumnKey = 'shortNote' | 'status' | 'publishDate' | 'shootDate' | 'ideaOwner' | 'editor' | 'helper';

export interface ColumnConfig {
    key: ColumnKey;
    label: string;
    icon: any;
    defaultVisible: boolean;
}

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
    { key: 'shortNote', label: 'โน้ตย่อ (สรุปสั้นๆ) 📝', icon: GripVertical, defaultVisible: true },
    { key: 'status', label: 'สถานะงาน (ถึงไหนแล้ว) 🚦', icon: GripVertical, defaultVisible: true },
    { key: 'publishDate', label: 'วันลงงาน 📅', icon: GripVertical, defaultVisible: true },
    { key: 'shootDate', label: 'วันถ่าย (ลุยยย) 🎥', icon: GripVertical, defaultVisible: true },
    { key: 'ideaOwner', label: 'คนคิด 💡', icon: GripVertical, defaultVisible: true },
    { key: 'editor', label: 'คนตัด ✂️', icon: GripVertical, defaultVisible: true },
    { key: 'helper', label: 'คนช่วย 🤝', icon: GripVertical, defaultVisible: true },
];

interface StockTableSettingsProps {
    visibleColumns: ColumnKey[];
    columnOrder: ColumnKey[];
    onToggleColumn: (key: ColumnKey) => void;
    onReorderColumns: (newOrder: ColumnKey[]) => void;
    onReset: (type: 'all' | 'minimal') => void;
}

const StockTableSettings: React.FC<StockTableSettingsProps> = ({ 
    visibleColumns, 
    columnOrder,
    onToggleColumn, 
    onReorderColumns,
    onReset 
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const isVisible = (key: ColumnKey) => visibleColumns.includes(key);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-xl transition-all shadow-sm border ${isOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200 hover:text-indigo-600'}`}
                title="ตั้งค่าคอลัมน์"
            >
                <Settings2 className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-50"
                        >
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">การแสดงผลคอลัมน์</h4>
                                <Settings2 className="w-3 h-3 text-gray-300" />
                            </div>

                            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                {columnOrder.map((key) => {
                                    const col = AVAILABLE_COLUMNS.find(c => c.key === key);
                                    if (!col) return null;
                                    
                                    return (
                                        <div
                                            key={key}
                                            className={`group flex items-center gap-2 p-1 rounded-2xl transition-all ${isVisible(key) ? 'bg-indigo-50/50' : 'opacity-60'}`}
                                        >
                                            <div className="p-2 text-gray-300 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-3.5 h-3.5" />
                                            </div>
                                            
                                            <button
                                                onClick={() => onToggleColumn(key)}
                                                className={`flex-1 flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${isVisible(key) ? 'text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isVisible(key) ? <Eye className="w-3.5 h-3.5 text-indigo-500" /> : <EyeOff className="w-3.5 h-3.5 text-gray-300" />}
                                                    {col.label}
                                                </div>
                                                {isVisible(key) && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between gap-2">
                                <button 
                                    onClick={() => onReset('all')}
                                    className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-colors"
                                >
                                    แสดงทั้งหมด
                                </button>
                                <button 
                                    onClick={() => onReset('minimal')}
                                    className="flex-1 py-2 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black hover:bg-gray-100 transition-colors"
                                >
                                    Minimal
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StockTableSettings;

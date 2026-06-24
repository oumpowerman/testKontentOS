import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { 
    X, 
    Trash2, 
    CheckCircle2, 
    Circle, 
    Plus, 
    GripVertical, 
    Package, 
    ClipboardList,
    ChevronRight,
    Inbox,
    FileText,
    BarChart3,
    Users2,
    Save,
    ArrowLeft,
    CheckSquare,
    Pin
} from 'lucide-react';
import { WorkboxItem } from '../../types/features';
import { User } from '../../types/core';
import { useWorkboxContext } from '../../context/WorkboxContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import Skeleton from '../ui/Skeleton';

interface WorkboxPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

const WorkboxItemCard: React.FC<{ 
    item: WorkboxItem; 
    onSelect: () => void;
    onToggle: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
}> = ({ item, onSelect, onToggle, onDelete }) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={dragControls}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileDrag={{ 
                scale: 1.02, 
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                zIndex: 100,
                backgroundColor: "rgb(249 250 251)"
            }}
            className={`
                group flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none
                ${item.is_completed 
                    ? 'bg-gray-50 border-gray-100 opacity-60' 
                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100'
                }
            `}
            onClick={onSelect}
        >
            <button 
                onClick={onToggle}
                className={`transition-colors shrink-0 ${item.is_completed ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'}`}
            >
                {item.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    {item.type === 'CONTENT' ? (
                        <Package className="w-3 h-3 text-indigo-400" />
                    ) : item.type === 'TASK' ? (
                        <CheckSquare className="w-3 h-3 text-emerald-400" />
                    ) : (
                        <ClipboardList className="w-3 h-3 text-amber-400" />
                    )}
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                        {item.type}
                    </span>
                    {item.progress !== undefined && item.progress > 0 && (
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {item.progress}%
                        </span>
                    )}
                </div>
                <h4 className={`text-sm font-bold truncate ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.title}
                </h4>
                {item.notes && (
                    <p className="text-[10px] text-gray-400 truncate italic mt-0.5">
                        {item.notes}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button 
                    onClick={onDelete}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <div 
                    className="p-2 text-gray-300 cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            </div>
        </Reorder.Item>
    );
};

const WorkboxPanel: React.FC<WorkboxPanelProps> = ({ isOpen, onClose, currentUser }) => {
    const { items, isLoading, updateItem, deleteItem, addItem, clearCompleted, reorderItems, isDocked, setIsDocked } = useWorkboxContext();
    const { showConfirm, showAlert } = useGlobalDialog();
    const [newItemTitle, setNewItemTitle] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const selectedItem = items.find(i => i.id === selectedItemId);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim()) return;
        addItem({
            title: newItemTitle,
            type: 'CHECKLIST'
        });
        setNewItemTitle('');
    };

    const completedCount = items.filter(i => i.is_completed).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-100"
                    >
                        {/* Header */}
                        <div className="p-6 border-bottom border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                            <div className="flex items-center gap-3">
                                {selectedItemId ? (
                                    <button 
                                        onClick={() => setSelectedItemId(null)}
                                        className="p-2 hover:bg-white rounded-xl transition-all shadow-sm text-indigo-600"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Inbox className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-[22px] font-bold text-gray-800">
                                        {selectedItemId ? 'รายละเอียดงาน' : 'WorkBox'}
                                    </h2>
                                    <p className="text-sm font-kanit font-bold text-indigo-500 uppercase tracking-wider">
                                        {selectedItemId ? 'แก้ไขข้อมูลเพิ่มเติม' : 'กล่องเก็บงานชั่วคราว'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={async () => {
                                        const nextDocked = !isDocked;
                                        setIsDocked(nextDocked);
                                        if (nextDocked) {
                                            await showAlert('ย้ายกล่องเก็บงาน (WorkBox) ไปไว้ที่แถบข้าง (Sidebar) เรียบร้อยแล้ว! 📦', 'ปักหมุดสำเร็จ');
                                        } else {
                                            await showAlert('ย้ายกล่องเก็บงาน (WorkBox) ออกมาเป็นปุ่มลอยบนหน้าจอเรียบร้อยแล้ว! 📦', 'ยกเลิกการปักหมุดสำเร็จ');
                                        }
                                    }}
                                    className={`p-2 rounded-xl transition-all ${isDocked ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'hover:bg-gray-100 text-gray-400 hover:text-indigo-600'}`}
                                    title={isDocked ? "เลิกปักหมุดแถบข้าง (ลอยบนจอ)" : "ปักหมุดเข้าแถบข้าง (ซ่อนปุ่มลอย)"}
                                >
                                    <Pin className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {selectedItemId && selectedItem ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    {/* Item Title Card */}
                                    <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                                        <div className="flex items-center gap-2 mb-2 opacity-80">
                                            {selectedItem.type === 'CONTENT' ? (
                                                <Package className="w-4 h-4" />
                                            ) : selectedItem.type === 'TASK' ? (
                                                <CheckSquare className="w-4 h-4" />
                                            ) : (
                                                <ClipboardList className="w-4 h-4" />
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{selectedItem.type}</span>
                                        </div>
                                        <h3 className="text-lg font-black leading-tight">{selectedItem.title}</h3>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="w-4 h-4 text-indigo-500" />
                                                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">ความคืบหน้า</span>
                                            </div>
                                            <span className="text-lg font-black text-indigo-600">{selectedItem.progress || 0}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={selectedItem.progress || 0}
                                            onChange={(e) => updateItem(selectedItem.id, { progress: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="grid grid-cols-5 gap-2">
                                            {[0, 25, 50, 75, 100].map(val => (
                                                <button 
                                                    key={val}
                                                    onClick={() => updateItem(selectedItem.id, { progress: val })}
                                                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedItem.progress === val ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                                >
                                                    {val}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-black text-gray-700 uppercase tracking-wider">โน้ตรายละเอียด</span>
                                        </div>
                                        <textarea 
                                            value={selectedItem.notes || ''}
                                            onChange={(e) => updateItem(selectedItem.id, { notes: e.target.value })}
                                            placeholder="พิมพ์รายละเอียดงานที่นี่..."
                                            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                                        />
                                    </div>

                                    {/* Assignee Progress (Mock/Meta) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Users2 className="w-4 h-4 text-emerald-500" />
                                            <span className="text-xs font-black text-gray-700 uppercase tracking-wider">ความคืบหน้าทีม (รายคน)</span>
                                        </div>
                                        <div className="space-y-3">
                                            {(selectedItem.meta?.assignees || [
                                                { userId: '1', name: 'คนคิด', progress: 0 },
                                                { userId: '2', name: 'คนตัด', progress: 0 },
                                                { userId: '3', name: 'คนช่วย', progress: 0 }
                                            ]).map((as: any, idx: number) => (
                                                <div key={as.userId} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                        {as.name[0]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[11px] font-bold text-gray-600">{as.name}</span>
                                                            <span className="text-[10px] font-black text-indigo-500">{as.progress}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${as.progress}%` }}
                                                                className="h-full bg-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {[0, 50, 100].map(p => (
                                                            <button 
                                                                key={p}
                                                                onClick={() => {
                                                                    const newAssignees = [...(selectedItem.meta?.assignees || [
                                                                        { userId: '1', name: 'คนคิด', progress: 0 },
                                                                        { userId: '2', name: 'คนตัด', progress: 0 },
                                                                        { userId: '3', name: 'คนช่วย', progress: 0 }
                                                                    ])];
                                                                    newAssignees[idx] = { ...newAssignees[idx], progress: p };
                                                                    updateItem(selectedItem.id, { meta: { ...selectedItem.meta, assignees: newAssignees } });
                                                                }}
                                                                className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-black transition-all ${as.progress === p ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}
                                                            >
                                                                {p}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Add Quick Item */}
                                    <form onSubmit={handleAddItem} className="relative">
                                        <input 
                                            type="text"
                                            value={newItemTitle}
                                            onChange={(e) => setNewItemTitle(e.target.value)}
                                            placeholder="เพิ่ม Checklist เปล่า..."
                                            className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                                        />
                                        <button 
                                            type="submit"
                                            className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </form>

                                    {/* List */}
                                    <div className="space-y-3">
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <Skeleton className="w-5 h-5 rounded-full" />
                                                    <Skeleton className="flex-1 h-4 rounded" />
                                                </div>
                                            ))
                                        ) : items.length === 0 ? (
                                            <div className="text-center py-12 px-6 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                    <Package className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <p className="text-gray-500 font-bold">ยังไม่มีรายการใน WorkBox</p>
                                                <p className="text-xs text-gray-400 mt-1">ลาก Content จาก Stock มาวางที่นี่ได้เลย!</p>
                                            </div>
                                        ) : (
                                            <Reorder.Group axis="y" values={items} onReorder={reorderItems} className="space-y-3">
                                                {items.map((item) => (
                                                    <WorkboxItemCard 
                                                        key={item.id}
                                                        item={item}
                                                        onSelect={() => setSelectedItemId(item.id)}
                                                        onToggle={(e) => {
                                                            e.stopPropagation();
                                                            updateItem(item.id, { is_completed: !item.is_completed });
                                                        }}
                                                        onDelete={async (e) => {
                                                            e.stopPropagation();
                                                            const confirmed = await showConfirm(`ต้องการลบ "${item.title}" ใช่หรือไม่?`, 'ยืนยันการลบรายการ 🗑️');
                                                            if (confirmed) {
                                                                deleteItem(item.id);
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </Reorder.Group>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-xs font-bold text-gray-500">
                                        เสร็จสิ้น {completedCount} / {items.length} รายการ
                                    </div>
                                    {completedCount > 0 && (
                                        <button 
                                            onClick={async () => {
                                                const confirmed = await showConfirm('ต้องการล้างรายการที่เสร็จแล้วทั้งหมดใช่หรือไม่?', 'ยืนยันการล้างรายการ 🧹');
                                                if (confirmed) {
                                                    clearCompleted();
                                                }
                                            }}
                                            className="text-xs font-black text-rose-500 hover:underline"
                                        >
                                            ล้างรายการที่เสร็จแล้ว
                                        </button>
                                    )}
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    ปิดหน้าต่าง
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default WorkboxPanel;


import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChecklistPreset, InventoryItem } from '../../types';
import { X, Save, Search, Plus, Trash2, Package, LayoutGrid, List, Box, CheckCircle2 } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface PresetEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    preset: ChecklistPreset;
    inventoryItems: InventoryItem[];
    onSave: (id: string, name: string, items: { text: string; categoryId: string }[]) => void;
}

const PresetEditorModal: React.FC<PresetEditorModalProps> = ({ 
    isOpen, onClose, preset, inventoryItems, onSave 
}) => {
    const { showConfirm, showAlert } = useGlobalDialog();
    const [name, setName] = useState(preset.name);
    const [currentItems, setCurrentItems] = useState<{ text: string; categoryId: string }[]>(preset.items || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

    useEffect(() => {
        if(isOpen) {
            setName(preset.name);
            setCurrentItems(preset.items || []);
            setSearchQuery('');
        }
    }, [isOpen, preset]);

    const filteredInventory = useMemo(() => {
        // Return ALL items that match search (or all if empty) AND are not already in the list
        return inventoryItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const alreadyInPreset = currentItems.some(curr => curr.text === item.name);
            return matchesSearch && !alreadyInPreset;
        });
    }, [inventoryItems, searchQuery, currentItems]);

    const handleAddItem = (item: InventoryItem) => {
        setCurrentItems(prev => [...prev, { text: item.name, categoryId: item.categoryId }]);
    };

    const handleRemoveItem = async (index: number) => {
        const item = currentItems[index];
        const confirmed = await showConfirm(`คุณต้องการลบ "${item.text}" ออกจากชุดอุปกรณ์นี้ใช่หรือไม่?`, 'ลบรายการออกจาก Preset');
        if (confirmed) {
            setCurrentItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            await showAlert('กรุณาใส่ชื่อ Preset');
            return;
        }
        onSave(preset.id, name, currentItems);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <div className="flex-1 mr-4">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Preset Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            className="w-full text-2xl font-black text-gray-800 outline-none border-b-2 border-transparent focus:border-indigo-500 transition-colors pb-1 bg-transparent"
                            placeholder="ชื่อชุดอุปกรณ์..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* LEFT: Current Items List */}
                    <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h4 className="font-bold text-gray-700 flex items-center text-sm">
                                <Package className="w-4 h-4 mr-2 text-indigo-600" />
                                รายการในชุด ({currentItems.length})
                            </h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {currentItems.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    ยังไม่มีรายการในชุดนี้ <br/> เลือกจากด้านขวาได้เลย
                                </div>
                            ) : (
                                currentItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl shadow-sm group hover:border-red-200 transition-colors">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
                                            <span className="font-bold text-sm text-gray-700 truncate">{item.text}</span>
                                        </div>
                                        <button onClick={() => handleRemoveItem(idx)} className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Add Items Selection */}
                    <div className="flex-1 flex flex-col bg-white">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                             <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาอุปกรณ์เพื่อเพิ่ม..." 
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl text-sm outline-none transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                                <button 
                                    onClick={() => setViewMode('GRID')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('LIST')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            {filteredInventory.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    ไม่พบอุปกรณ์ที่ค้นหา
                                </div>
                            ) : (
                                viewMode === 'GRID' ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredInventory.map(item => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => handleAddItem(item)}
                                                className="group relative bg-white border border-gray-200 rounded-2xl p-3 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer flex flex-col gap-2"
                                            >
                                                {/* Image Area */}
                                                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center relative">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                                                    ) : (
                                                        <Box className="w-8 h-8 text-gray-300" />
                                                    )}
                                                    
                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-center justify-center">
                                                        <div className="bg-white text-indigo-600 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300">
                                                            <Plus className="w-5 h-5 stroke-[3px]" />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <h5 className="text-xs font-bold text-gray-700 line-clamp-2 leading-tight group-hover:text-indigo-600">{item.name}</h5>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredInventory.map(item => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => handleAddItem(item)}
                                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer group transition-all"
                                            >
                                                <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    ) : (
                                                        <Box className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 flex-1 group-hover:text-indigo-700">{item.name}</span>
                                                <div className="p-1.5 bg-white rounded-full border border-gray-200 text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-200 shadow-sm">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">ยกเลิก</button>
                    <button onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center">
                        <Save className="w-4 h-4 mr-2" /> บันทึกการแก้ไข
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PresetEditorModal;

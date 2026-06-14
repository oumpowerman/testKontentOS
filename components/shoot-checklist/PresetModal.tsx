
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, CheckSquare, Trash2 } from 'lucide-react';
import { ChecklistPreset, InventoryItem } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext'; // Added

interface PresetModalProps {
    isOpen: boolean;
    onClose: () => void;
    presets: ChecklistPreset[];
    inventoryItems: InventoryItem[];
    onAddPreset: (name: string, inventoryIds?: string[]) => void;
    onDeletePreset: (id: string) => void;
}

const PresetModal: React.FC<PresetModalProps> = ({ 
    isOpen, onClose, presets, inventoryItems, onAddPreset, onDeletePreset 
}) => {
    const { showAlert, showConfirm } = useGlobalDialog(); // Destructure
    const [newPresetName, setNewPresetName] = useState('');
    const [selectedInvForPreset, setSelectedInvForPreset] = useState<string[]>([]);

    if (!isOpen) return null;

    const toggleInvForPreset = (id: string) => {
        setSelectedInvForPreset(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreatePreset = () => {
        if (!newPresetName.trim()) {
            showAlert('กรุณาตั้งชื่อ Preset', 'แจ้งเตือน');
            return;
        }
        onAddPreset(newPresetName, selectedInvForPreset);
        setNewPresetName('');
        setSelectedInvForPreset([]);
        onClose(); // Optional: Close after create
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-indigo-600" /> จัดการชุดอุปกรณ์ (Presets)
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Left: Create New */}
                    <div className="w-full md:w-1/2 p-6 border-r border-gray-100 flex flex-col">
                        <h4 className="font-bold text-indigo-700 mb-4">สร้างชุดใหม่</h4>
                        <input type="text" placeholder="ชื่อชุด (เช่น ถ่าย Vlog)" className="w-full px-4 py-2 mb-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
                        
                        <p className="text-xs text-gray-500 mb-2 font-bold uppercase">เลือกอุปกรณ์ ({selectedInvForPreset.length})</p>
                        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1 mb-4 bg-gray-50">
                            {inventoryItems.map(item => {
                                const isSelected = selectedInvForPreset.includes(item.id);
                                return (
                                    <div key={item.id} onClick={() => toggleInvForPreset(item.id)} className={`flex items-center p-2 rounded-lg cursor-pointer text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-white text-gray-700'}`}>
                                        <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${isSelected ? 'border-white' : 'border-gray-400'}`}>
                                            {isSelected && <CheckSquare className="w-3 h-3" />}
                                        </div>
                                        {item.name}
                                    </div>
                                )
                            })}
                        </div>
                        <button onClick={handleCreatePreset} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">บันทึก Preset</button>
                    </div>

                    {/* Right: Existing Presets */}
                    <div className="w-full md:w-1/2 p-6 bg-white overflow-y-auto">
                        <h4 className="font-bold text-gray-700 mb-4">ชุดที่มีอยู่ ({presets.length})</h4>
                        <div className="space-y-3">
                            {presets.map(p => (
                                <div key={p.id} className="p-4 border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors group">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-gray-800">{p.name}</h5>
                                        <button 
                                            onClick={async () => { 
                                                const confirm = await showConfirm('ลบ Preset นี้?', 'ยืนยันลบ');
                                                if(confirm) onDeletePreset(p.id) 
                                            }} 
                                            className="text-gray-300 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                        {p.items.map(i => i.text).join(', ')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PresetModal;

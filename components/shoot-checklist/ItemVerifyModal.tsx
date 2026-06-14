
import React from 'react';
import { createPortal } from 'react-dom';
import { InventoryItem, ChecklistItem } from '../../types';
import { X, CheckCircle2, Box, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface ItemVerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ChecklistItem;
    inventoryItem?: InventoryItem; // To get image/desc
    onConfirm: () => void;
}

const ItemVerifyModal: React.FC<ItemVerifyModalProps> = ({ 
    isOpen, onClose, item, inventoryItem, onConfirm 
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 border border-gray-200">
                
                {/* Header with Dark Background for Full Image visibility */}
                <div className="relative h-64 bg-gray-900 flex items-center justify-center overflow-hidden">
                    {inventoryItem?.imageUrl ? (
                        <img 
                            src={inventoryItem.imageUrl} 
                            alt={item.text} 
                            className="w-full h-full object-contain" 
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="flex flex-col items-center text-gray-500">
                            <Box className="w-16 h-16 mb-2 opacity-50" />
                            <span className="text-xs font-bold uppercase">No Image</span>
                        </div>
                    )}
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-2xl font-black text-gray-800 leading-tight mb-2">
                            {item.text}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {inventoryItem?.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                        </p>
                    </div>

                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        เช็คเรียบร้อย! (Checked)
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ItemVerifyModal;

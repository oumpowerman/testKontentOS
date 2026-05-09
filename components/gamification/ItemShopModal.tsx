import React, { useState } from 'react';
import { X, ShoppingBag, Backpack, Loader2, History } from 'lucide-react';
import { ShopItem, User } from '../../types';
import { useGamification } from '../../hooks/useGamification';
import MemberHistoryModal from './MemberHistoryModal';
import { useToast } from '../../context/ToastContext';
import ShopTab from './shop/ShopTab';
import InventoryTab from './shop/InventoryTab';

interface ItemShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    onRefreshProfile?: () => Promise<any>;
}

const ItemShopModal: React.FC<ItemShopModalProps> = ({ isOpen, onClose, currentUser, onRefreshProfile }) => {
    const { shopItems, userInventory, buyItem, useItem, isLoading, loadShopItems, loadUserInventory } = useGamification(currentUser);
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'SHOP' | 'INVENTORY'>('SHOP');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Load data when modal opens
    React.useEffect(() => {
        if (isOpen) {
            loadShopItems();
            loadUserInventory();
        }
    }, [isOpen, loadShopItems, loadUserInventory]);

    if (!isOpen) return null;

    const handleBuy = async (item: ShopItem) => {
        const result = await buyItem(item);
        if (result.success) {
            // Manual refresh to update wallet points immediately
            if (onRefreshProfile) {
                await onRefreshProfile();
            }
        } else if (result.message) {
            showToast(result.message, 'error');
        }
        // Success toasts are handled by global listener
    };

    const handleUse = async (id: string, item: ShopItem) => {
        const wasDead = currentUser.hp <= 0;
        const result = await useItem(id, item);
        
        if (result.success) {
            // Success toast is handled by useGameEventListener (via game_logs)
            // but we can add a local one for immediate feedback if we want.
            // However, the user wants the "profile to come back".
            
            // Manual refresh to ensure UI updates immediately before modal closes
            if (onRefreshProfile) {
                await onRefreshProfile();
            }
            
            if (wasDead && (item.effectType === 'HEAL_HP' || item.effectType === 'REMOVE_LATE')) {
                // If they were dead and used a healing item, close modal to show the revived dashboard
                onClose();
            } else if (item.effectType === 'HEAL_HP' || item.effectType === 'REMOVE_LATE') {
                // Even if not dead, healing items usually mean they want to see their stats update
                setTimeout(() => {
                    onClose();
                }, 800);
            }
        } else if (result.message) {
            const type = item.effectType === 'SKIP_DUTY' ? 'info' : 'error';
            showToast(result.message, type);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-4 border-indigo-50">
                
                {/* Header */}
                <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShoppingBag className="w-32 h-32" />
                    </div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <ShoppingBag className="w-6 h-6 text-yellow-300" /> ร้านค้าสวัสดิการ
                            </h2>
                            <p className="text-indigo-200 text-sm mt-1">ใช้แต้มแลกตัวช่วยชีวิต</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-2 bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center border-4 border-white/20 shadow-inner">
                                <span className="text-lg">💰</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-200 uppercase">My Wallet</p>
                                <p className="text-xl font-black leading-none">{currentUser.availablePoints.toLocaleString()} JP</p>
                            </div>
                        </div>
                        
                        {/* History Button */}
                        <button 
                            onClick={() => setIsHistoryOpen(true)}
                            className="flex flex-col items-center justify-center text-[9px] font-bold text-indigo-200 hover:text-white transition-colors gap-1 px-2"
                        >
                            <div className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                                <History className="w-4 h-4" />
                            </div>
                            HISTORY
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button 
                        onClick={() => setActiveTab('SHOP')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'SHOP' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> ซื้อของ (Buy)
                    </button>
                    <button 
                        onClick={() => setActiveTab('INVENTORY')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'INVENTORY' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Backpack className="w-4 h-4" /> กระเป๋า ({userInventory.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    )}

                    {activeTab === 'SHOP' ? (
                        <ShopTab 
                            items={shopItems} 
                            currentUser={currentUser} 
                            onBuy={handleBuy} 
                        />
                    ) : (
                        <InventoryTab 
                            inventory={userInventory} 
                            onUse={handleUse} 
                            onGoToShop={() => setActiveTab('SHOP')} 
                        />
                    )}
                </div>
            </div>

            {/* History Modal (Stacked) */}
            <MemberHistoryModal 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
                currentUser={currentUser} 
            />
        </div>
    );
};

export default ItemShopModal;

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Reward, Redemption } from '../types';
import { X, Gift, History, Coins, ShoppingBag, Briefcase, CheckCircle2, Clock, Ban } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface RewardShopProps {
    rewards: Reward[];
    userPoints: number;
    userRedemptions: Redemption[];
    onRedeem: (reward: Reward) => void;
    onUseReward: (id: string) => void;
    onClose: () => void;
    onOpenHistory: () => void;
}

const RewardShop: React.FC<RewardShopProps> = ({ 
    rewards, 
    userPoints, 
    userRedemptions,
    onRedeem, 
    onUseReward,
    onClose, 
    onOpenHistory 
}) => {
    const [activeTab, setActiveTab] = useState<'SHOP' | 'BACKPACK'>('SHOP');

    const inventory = userRedemptions.filter(r => r.status === 'OWNED');

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 font-sans">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Main Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col z-10 border-4 border-purple-50"
                >
                    
                    {/* Header */}
                    <div className="bg-purple-600 p-6 text-white relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Gift className="w-40 h-40" />
                        </div>
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Gift className="w-8 h-8 text-yellow-300" /> ร้านสวัสดิการพนักงาน
                                </h2>
                                <p className="text-purple-200 text-sm mt-1">Reward & Welfare Center</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-between items-end gap-4 relative z-10">
                            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center border-4 border-white/20 shadow-inner">
                                    <Coins className="w-6 h-6 text-yellow-800" />
                                </div>
                                <div className="pr-4">
                                    <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">แต้มสวัสดิการ (Points)</p>
                                    <p className="text-3xl font-black leading-none">{userPoints.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex bg-black/20 p-1 rounded-2xl border border-white/10 backdrop-blur-sm relative">
                                <button 
                                    onClick={() => setActiveTab('SHOP')}
                                    className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'SHOP' ? 'text-purple-600' : 'text-white hover:text-purple-200'}`}
                                >
                                    {activeTab === 'SHOP' && (
                                        <motion.div 
                                            layoutId="activeTabBg"
                                            className="absolute inset-0 bg-white rounded-xl shadow-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-20 flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4" /> เลือกซื้อ
                                    </span>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('BACKPACK')}
                                    className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'BACKPACK' ? 'text-purple-600' : 'text-white hover:text-purple-200'}`}
                                >
                                    {activeTab === 'BACKPACK' && (
                                        <motion.div 
                                            layoutId="activeTabBg"
                                            className="absolute inset-0 bg-white rounded-xl shadow-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-20 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" /> กระเป๋า
                                        {inventory.length > 0 && (
                                            <span className="w-5 h-5 bg-yellow-400 text-yellow-900 text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black ml-1">
                                                {inventory.length}
                                            </span>
                                        )}
                                    </span>
                                </button>
                                <button 
                                    onClick={onOpenHistory}
                                    className="relative z-10 flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all ml-2 border-l border-white/10 text-white"
                                >
                                    <History className="w-4 h-4" /> ประวัติ
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 scrollbar-thin">
                        <AnimatePresence mode="wait">
                            {activeTab === 'SHOP' ? (
                                <motion.div 
                                    key="shop"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                >
                                    {rewards.filter(r => r.isActive).map(reward => {
                                        const canAfford = userPoints >= reward.cost;
                                        return (
                                            <div key={reward.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 -mr-4 -mt-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                                                    <span className="text-9xl">{reward.icon || '🎁'}</span>
                                                </div>

                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                        {reward.icon || '🎁'}
                                                    </div>
                                                    <span className={`px-4 py-1.5 rounded-2xl text-xs font-black ${canAfford ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-2 ${canAfford ? 'border-green-200' : 'border-red-200'}`}>
                                                        {reward.cost.toLocaleString()} Pts
                                                    </span>
                                                </div>
                                                
                                                <div className="relative z-10 flex-1">
                                                    <h3 className="font-bold text-gray-800 text-xl mb-1 group-hover:text-purple-600 transition-colors leading-tight">{reward.title}</h3>
                                                    <p className="text-sm text-gray-500 mb-6 leading-relaxed line-clamp-2">{reward.description || 'ไม่มีรายละเอียด'}</p>
                                                </div>
                                                
                                                <button
                                                    onClick={() => canAfford && onRedeem(reward)}
                                                    disabled={!canAfford}
                                                    className={`
                                                        w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
                                                        ${canAfford 
                                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-purple-200' 
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                                                    `}
                                                >
                                                    {canAfford ? (
                                                        <>ซื้อเก็บไว้ 🎒</>
                                                    ) : (
                                                        <>แต้มไม่พอ 🔒</>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="backpack"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="max-w-3xl mx-auto space-y-6"
                                >
                                    <div className="bg-indigo-600/5 border border-indigo-100 rounded-3xl p-6 mb-6">
                                        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5" /> ของรางวัลที่รอการใช้งาน
                                        </h4>
                                        <p className="text-sm text-indigo-600 mt-1">คุณสามารถเลือกใช้ของรางวัลที่คุณซื้อไว้ได้ที่นี่ เมื่อกดใช้แล้ว Admin จะได้รับแจ้งเตือนครับ</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {inventory.map(item => (
                                            <div key={item.id} className="bg-white border-2 border-gray-100 p-5 rounded-3xl flex items-center justify-between gap-4 group hover:border-purple-200 transition-all shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:bg-purple-100 transition-colors">
                                                        {item.rewardSnapshot?.icon || '🎁'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[20px] font-bold font-kanit text-gray-800 leading-tight">{item.rewardSnapshot?.title}</h4>
                                                        <p className="text-[12px] text-gray-400 font-kanit font-medium uppercase tracking-widest mt-1">
                                                            ซื้อเมื่อ {format(item.redeemedAt, 'd MMM yyyy', { locale: th })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => onUseReward(item.id)}
                                                    className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-medium font-kanit text-sm hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all active:scale-95"
                                                >
                                                    ใช้เลย ✨
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {inventory.length === 0 && (
                                        <div className="py-20 text-center text-gray-400">
                                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Briefcase className="w-10 h-10 opacity-20" />
                                            </div>
                                            <p className="font-bold">ยังไม่มีของรางวัลในกระเป๋า</p>
                                            <button 
                                                onClick={() => setActiveTab('SHOP')}
                                                className="mt-4 text-purple-600 font-bold text-sm hover:underline"
                                            >
                                                ไปที่ร้านค้ากันเถอะ
                                            </button>
                                        </div>
                                    )}

                                    {/* Used Section Preview */}
                                    {userRedemptions.some(r => r.status === 'USED') && (
                                        <div className="mt-12 opacity-60">
                                            <h4 className="text-sm font-bold text-gray-500 mb-4 px-2 uppercase tracking-widest">อยู่ระหว่างตรวจสอบ</h4>
                                            <div className="space-y-2">
                                                {userRedemptions.filter(r => r.status === 'USED').map(item => (
                                                    <div key={item.id} className="bg-gray-100/50 border border-gray-200 p-4 rounded-2xl flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-xl grayscale opacity-50">{item.rewardSnapshot?.icon || '🎁'}</div>
                                                            <span className="text-sm font-bold text-gray-600">{item.rewardSnapshot?.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                            <Clock className="w-3 h-3" /> Awaiting
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default RewardShop;

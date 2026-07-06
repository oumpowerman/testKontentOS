import React, { useState, useEffect } from 'react';
import { Check, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuGroup } from '../../types';
import { MENU_GROUPS } from '../Sidebar';

interface SidebarControlCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeViews: string[] | null;
  onSave: (selected: string[]) => Promise<void>;
}

export const SidebarControlCenterModal: React.FC<SidebarControlCenterModalProps> = ({
  isOpen,
  onClose,
  activeViews,
  onSave
}) => {
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected menus when modal opens or activeViews change
  useEffect(() => {
    if (isOpen) {
      const initialSelected = activeViews || MENU_GROUPS.flatMap(g => g.items.map(item => item.view));
      setSelectedMenus(initialSelected);
    }
  }, [isOpen, activeViews]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedMenus);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    const all = MENU_GROUPS.flatMap(g => g.items.map(item => item.view));
    setSelectedMenus(all);
  };

  const handleClearAll = () => {
    setSelectedMenus([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-4xl shadow-2xl text-white max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl">
                  <Settings className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    Sidebar Control Center 🛠️
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">เปิด-ปิดเมนูระบบตามสเปกที่ลูกค้าสั่งซื้อ บันทึกลงฐานข้อมูลเพื่อใช้งานร่วมกัน</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                >
                  เลือกทั้งหมด
                </button>
                <button
                  onClick={handleClearAll}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                >
                  ยกเลิกทั้งหมด
                </button>
              </div>
            </div>

            {/* Bento-style Groups */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MENU_GROUPS.map((group) => (
                  <div key={group.id} className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      {React.createElement(group.icon, { className: "w-5 h-5 text-indigo-400" })}
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">
                        {group.title} Group
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.items.map((item) => {
                        const isSelected = selectedMenus.includes(item.view);
                        return (
                          <button
                            key={item.view}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMenus(selectedMenus.filter(v => v !== item.view));
                              } else {
                                setSelectedMenus([...selectedMenus, item.view]);
                              }
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group
                              ${isSelected 
                                ? 'bg-indigo-600/10 border-indigo-500/40 text-white' 
                                : 'bg-slate-900/50 border-slate-800/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}
                          >
                            <div className="flex items-center gap-2.5">
                              {React.createElement(item.icon, { className: `w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}` })}
                              <span className="text-xs font-bold">{item.label}</span>
                            </div>
                            <div>
                              {isSelected ? (
                                <ToggleRight className="w-6 h-6 text-indigo-400" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-slate-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 pt-4 mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                disabled={isSaving}
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

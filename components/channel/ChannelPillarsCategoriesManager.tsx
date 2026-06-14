import React, { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, X, Check, Plus, ChevronDown, Sparkles } from 'lucide-react';
import { Channel } from '../../types';
import { useMasterData } from '../../hooks/useMasterData';
import { motion, AnimatePresence } from 'framer-motion';

// Curated default recommendations to ensure excellent fallback options
const DEFAULT_POPULAR_PILLARS = [
  'Entertainment 🎬',
  'Education 📚',
  'Lifestyle 🌱',
  'Promotion 📢',
  'Realtime / News ⚡',
  'Vlog / Diary 📹',
  'Review / Unboxing 📦',
  'Podcast / Interview 🎙️',
  'Behind the Scenes 🎥',
  'Tutorial / How-to 💡'
];

interface TempOption {
  id: string;
  type: 'PILLAR' | 'CATEGORY';
  key: string;
  label: string;
}

interface ChannelPillarsCategoriesManagerProps {
  targetId: string;
  channel: Channel | null;
  tempOptions: TempOption[];
  setTempOptions: React.Dispatch<React.SetStateAction<TempOption[]>>;
}

export const ChannelPillarsCategoriesManager: React.FC<ChannelPillarsCategoriesManagerProps> = ({
  targetId,
  channel,
  tempOptions,
  setTempOptions
}) => {
  const { masterOptions, addMasterOption, deleteMasterOption } = useMasterData();

  // Input states
  const [newPillarLabel, setNewPillarLabel] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  // Dropdown states for Pillar
  const [isPillarDropdownOpen, setIsPillarDropdownOpen] = useState(false);
  const pillarInputContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pillarInputContainerRef.current &&
        !pillarInputContainerRef.current.contains(event.target as Node)
      ) {
        setIsPillarDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch system-wide global pillars dynamically or fallback to static defaults
  const systemPillars = masterOptions
    ? masterOptions
        .filter((o: any) => o.type === 'PILLAR' && !o.parentKey && o.isActive)
        .map((p: any) => p.label)
    : [];

  const allSuggestedPillars = Array.from(
    new Set([...systemPillars, ...DEFAULT_POPULAR_PILLARS])
  );

  // Filter recommendations based on user input string
  const filteredSuggestedPillars = allSuggestedPillars.filter(p =>
    p.toLowerCase().includes(newPillarLabel.toLowerCase())
  );

  const handleAddPillarWithValue = async (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    const key = `PIL_${trimmedValue.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    // Check if it already exists for this channel to prevent duplicates
    const channelPillars = masterOptions.filter(
      (o: any) => o.type === 'PILLAR' && o.parentKey === targetId && o.isActive
    );
    const hasDuplicate =
      channelPillars.some((p: any) => p.label.toLowerCase() === trimmedValue.toLowerCase()) ||
      tempOptions.some(o => o.type === 'PILLAR' && o.label.toLowerCase() === trimmedValue.toLowerCase());

    if (hasDuplicate) {
      setNewPillarLabel('');
      setIsPillarDropdownOpen(false);
      return;
    }

    if (channel) {
      // Direct save to DB in edit mode
      await addMasterOption({
        type: 'PILLAR',
        key,
        label: trimmedValue,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        sortOrder: 10,
        isActive: true,
        isDefault: false,
        parentKey: targetId
      });
    } else {
      // Store temp options for later commit in create mode
      setTempOptions(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'PILLAR',
          key,
          label: trimmedValue
        }
      ]);
    }

    setNewPillarLabel('');
    setIsPillarDropdownOpen(false);
  };

  const handleAddPillarClick = () => {
    handleAddPillarWithValue(newPillarLabel);
  };

  const handleAddCategoryClick = async () => {
    const trimmed = newCategoryLabel.trim();
    if (!trimmed) return;

    const key = `CAT_${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const channelCategories = masterOptions.filter(
      (o: any) => o.type === 'CATEGORY' && o.parentKey === targetId && o.isActive
    );
    const hasDuplicate =
      channelCategories.some((cat: any) => cat.label.toLowerCase() === trimmed.toLowerCase()) ||
      tempOptions.some(o => o.type === 'CATEGORY' && o.label.toLowerCase() === trimmed.toLowerCase());

    if (hasDuplicate) {
      setNewCategoryLabel('');
      return;
    }

    if (channel) {
      await addMasterOption({
        type: 'CATEGORY',
        key,
        label: trimmed,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        sortOrder: 10,
        isActive: true,
        isDefault: false,
        parentKey: targetId
      });
    } else {
      setTempOptions(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'CATEGORY',
          key,
          label: trimmed
        }
      ]);
    }
    setNewCategoryLabel('');
  };

  const handleRemovePillarOrCategoryClick = async (idOrKey: string, isTemp: boolean) => {
    if (isTemp) {
      setTempOptions(prev => prev.filter(o => o.id !== idOrKey));
    } else {
      await deleteMasterOption(idOrKey);
    }
  };

  // Channel existing options
  const existingPillars = masterOptions.filter(
    (o: any) => o.type === 'PILLAR' && o.parentKey === targetId && o.isActive
  );
  const currentPillars = channel ? existingPillars : tempOptions.filter(o => o.type === 'PILLAR');

  const existingCategories = masterOptions.filter(
    (o: any) => o.type === 'CATEGORY' && o.parentKey === targetId && o.isActive
  );
  const currentCategories = channel ? existingCategories : tempOptions.filter(o => o.type === 'CATEGORY');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-gray-700 flex items-center">
          <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-500" />
          4. ตั้งค่าแกนเนื้อหาและหมวดหมู่เฉพาะช่อง (Channel-Specific Pillars & Categories)
        </label>
        <p className="text-xs text-slate-400">กำหนดแกนหลัก (Pillar) และประเภทคลิป (Category) เจาะจงสำหรับช่องรายการนี้</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        
        {/* Pillar Section */}
        <div className="space-y-4" ref={pillarInputContainerRef}>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between h-5">
            <span>แกนเนื้อหาประจำช่อง (Pillars)</span>
            <span className="text-[10px] text-slate-400 font-normal normal-case flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-[pulse_2s_infinite]" /> มีรูปแบบแนะนำและดรอปดาวน์
            </span>
          </label>
          
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newPillarLabel}
                  onChange={e => {
                    setNewPillarLabel(e.target.value);
                    setIsPillarDropdownOpen(true);
                  }}
                  onFocus={() => setIsPillarDropdownOpen(true)}
                  placeholder="เช่น รีวิวสินค้า, สปอนเซอร์, กินโชว์"
                  className="w-full pr-10 px-3.5 py-2 bg-white border border-slate-200 text-sm rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setIsPillarDropdownOpen(prev => !prev)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddPillarClick}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shrink-0 shadow-sm"
              >
                เพิ่ม
              </button>
            </div>

            {/* Smart Suggested Dropdown */}
            <AnimatePresence>
              {isPillarDropdownOpen && filteredSuggestedPillars.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full z-[9999] mt-1.5 bg-white border border-slate-150 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto custom-scrollbar"
                >
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    แกนหลักยอดนิยมที่แนะนำ
                  </div>
                  <div className="py-1">
                    {filteredSuggestedPillars.map((pillarVal, index) => {
                      // Check if already contains
                      const isAdded = currentPillars.some(
                        p => p.label.toLowerCase() === pillarVal.toLowerCase()
                      );
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (!isAdded) {
                              setNewPillarLabel(pillarVal);
                              setIsPillarDropdownOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors text-slate-700 ${
                            isAdded
                              ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400'
                              : 'cursor-pointer hover:bg-indigo-50/70 focus:bg-indigo-50/70 outline-none'
                          }`}
                        >
                          <span>{pillarVal}</span>
                          {isAdded ? (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
                              เพิ่มแล้ว
                            </span>
                          ) : (
                            <button
                              type="button"
                              title="เลือกและเพิ่มทันที"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddPillarWithValue(pillarVal);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pillars List tags */}
          <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2.5 bg-white rounded-xl border border-slate-100/90 shadow-2xs">
            {currentPillars.map((p: any) => {
              const isTemp = !p.id || tempOptions.some(to => to.id === p.id);
              return (
                <div
                  key={p.id || p.key}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg shadow-xs"
                >
                  <span>{p.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePillarOrCategoryClick(p.id, isTemp)}
                    className="text-indigo-400 hover:text-rose-500 transition-colors ml-1 p-0.5 rounded-full hover:bg-rose-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {currentPillars.length === 0 && (
              <p className="text-gray-400 text-xs italic self-center pl-1 font-kanit">ยังไม่มีแกนเนื้อหาเฉพาะ (จะใช้แกนตั้งต้นแทน)</p>
            )}
          </div>
        </div>

        {/* Category Section */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between h-5 font-kanit">
            <span>หมวดหมู่คลิปเฉพาะช่อง (Categories)</span>
            <span className="text-[10px] text-slate-400 font-normal normal-case flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500 animate-[pulse_2s_infinite]" /> ระบุแยกประเภทผลงานอิสระ
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryLabel}
              onChange={e => setNewCategoryLabel(e.target.value)}
              placeholder="เช่น รีวิว 1 นาที, Vlog วันหยุด, Shorts แหล่งเรียนรู้"
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 text-sm rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
            />
            <button
              type="button"
              onClick={handleAddCategoryClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shrink-0 shadow-sm"
            >
              เพิ่ม
            </button>
          </div>

          {/* Categories List tags */}
          <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2.5 bg-white rounded-xl border border-slate-100/90 shadow-2xs">
            {currentCategories.map((cat: any) => {
              const isTemp = !cat.id || tempOptions.some(to => to.id === cat.id);
              return (
                <div
                  key={cat.id || cat.key}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg shadow-xs"
                >
                  <span>{cat.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePillarOrCategoryClick(cat.id, isTemp)}
                    className="text-emerald-400 hover:text-rose-500 transition-colors ml-1 p-0.5 rounded-full hover:bg-rose-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {currentCategories.length === 0 && (
              <p className="text-gray-400 text-xs italic self-center pl-1 font-kanit">ยังไม่มีหมวดหมู่คลิปเฉพาะ (จะใช้หมวดหมู่ตั้งต้นแทน)</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, Loader2, Edit2, Plus } from 'lucide-react';
import { Channel, Platform } from '../types';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useMasterData } from '../hooks/useMasterData';
import { ChannelLogoSelector } from './channel/ChannelLogoSelector';
import { PlatformGridSelector } from './channel/PlatformGridSelector';
import { ChannelPillarsCategoriesManager } from './channel/ChannelPillarsCategoriesManager';

export interface ChannelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  onSave: (channel: Channel, logoFile?: File | null) => Promise<boolean>;
}

export const BRAND_COLORS = [
  { id: 'red', class: 'bg-red-100 text-red-700 border-red-200 ring-red-500' },
  { id: 'orange', class: 'bg-orange-100 text-orange-700 border-orange-200 ring-orange-500' },
  { id: 'amber', class: 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500' },
  { id: 'green', class: 'bg-green-100 text-green-700 border-green-200 ring-green-500' },
  { id: 'teal', class: 'bg-teal-100 text-teal-700 border-teal-200 ring-teal-500' },
  { id: 'blue', class: 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500' },
  { id: 'indigo', class: 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-indigo-500' },
  { id: 'purple', class: 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-500' },
  { id: 'pink', class: 'bg-pink-100 text-pink-700 border-pink-200 ring-pink-500' },
  { id: 'slate', class: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500' },
];

const ChannelFormModal: React.FC<ChannelFormModalProps> = ({ isOpen, onClose, channel, onSave }) => {
  const { showAlert } = useGlobalDialog();
  const { addMasterOption } = useMasterData();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['YOUTUBE']);
  const [color, setColor] = useState(BRAND_COLORS[0].class);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Allocate an ID that stays stable during creation
  const targetId = useRef(channel?.id || crypto.randomUUID()).current;

  // Local state for temp options only when creating a new channel
  const [tempOptions, setTempOptions] = useState<{ id: string; type: 'PILLAR' | 'CATEGORY'; key: string; label: string }[]>([]);

  // Image upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load and populate fields when the channel prop changes
  useEffect(() => {
    if (isOpen) {
      setTempOptions([]);
      if (channel) {
        setName(channel.name);
        setDescription(channel.description || '');
        setSelectedPlatforms(channel.platforms || []);
        setColor(channel.color || BRAND_COLORS[0].class);
        setLogoPreview(channel.logoUrl || null);
        setLogoFile(null);
      } else {
        // Clear fields for a brand new channel
        setName('');
        setDescription('');
        setSelectedPlatforms(['YOUTUBE']);
        setColor(BRAND_COLORS[0].class);
        setLogoFile(null);
        setLogoPreview(null);
      }
    }
  }, [isOpen, channel]);

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showAlert("กรุณาตั้งชื่อรายการ/แบรนด์ด้วยครับ");
      return;
    }
    if (selectedPlatforms.length === 0) {
      showAlert("ต้องเลือกอย่างน้อย 1 ช่องทาง (Platform) นะครับ");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Channel = {
        id: targetId,
        name: name.trim(),
        description: description.trim(),
        color,
        platforms: selectedPlatforms,
        logoUrl: logoPreview || undefined,
      };

      const success = await onSave(payload, logoFile);
      if (success) {
        // Save temp options if creating a new channel
        if (tempOptions.length > 0) {
          for (const opt of tempOptions) {
            await addMasterOption({
              type: opt.type,
              key: opt.key,
              label: opt.label,
              color: opt.type === 'PILLAR' 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                : 'bg-emerald-100 text-emerald-700 border-emerald-200',
              sortOrder: 10,
              isActive: true,
              isDefault: false,
              parentKey: targetId
            });
          }
        }
        onClose();
      }
    } catch (err) {
      console.error("Error submitting channel form:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto"
          onClick={() => { if (!isSubmitting) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  {channel ? (
                    <Edit2 className="w-5 h-5 mr-2.5 text-indigo-500" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2.5 text-indigo-500" />
                  )}
                  {channel ? 'แก้ไขข้อมูลรายการ' : 'เพิ่มรายการใหม่'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  {channel ? 'Update connection and brand show spec' : 'Create new show banner & profile'}
                </p>
              </div>
              <button
                onClick={() => { if (!isSubmitting) onClose(); }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200/60 rounded-full transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Logo Uploader */}
                <ChannelLogoSelector
                  logoPreview={logoPreview}
                  onFileChange={handleFileChange}
                  onRemovePhoto={handleRemovePhoto}
                  isSubmitting={isSubmitting}
                />

                <div className="flex-1 space-y-6">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      1. ชื่อรายการ / แบรนด์ (Name) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="channel-name-input"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="เช่น Juijui Vlog, ข่าวเช้า, เกมมิ่ง..."
                      className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-gray-800 transition-all text-lg placeholder:font-normal placeholder:text-gray-300 disabled:opacity-70 disabled:bg-gray-50"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Description Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      รายละเอียด / คอนเซปต์ (Description)
                    </label>
                    <textarea
                      id="channel-desc-input"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="เช่น รายการพาเที่ยว เน้นกิน สบายๆ..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-gray-700 transition-all resize-none h-24 text-sm disabled:opacity-70"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Color Selector */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <Palette className="w-4 h-4 mr-2 text-indigo-500" />
                      2. สีประจำรายการ (Brand Color)
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                      {BRAND_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setColor(c.class)}
                          disabled={isSubmitting}
                          className={`
                            h-9 rounded-xl border-2 transition-all relative flex items-center justify-center
                            ${c.class.split(' ')[0]} 
                            ${c.class.split(' ')[2]}
                            ${color === c.class ? 'ring-2 ring-offset-2 ' + c.class.split(' ')[3] : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'}
                            ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}
                          `}
                        >
                          {color === c.class && <Check className="w-5 h-5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 my-6"></div>

              {/* Active Platforms */}
              <PlatformGridSelector
                selectedPlatforms={selectedPlatforms}
                togglePlatform={togglePlatform}
                isSubmitting={isSubmitting}
              />

              <div className="border-t border-gray-100 my-6"></div>

              {/* Pillars & Categories Settings */}
              <ChannelPillarsCategoriesManager
                targetId={targetId}
                channel={channel}
                tempOptions={tempOptions}
                setTempOptions={setTempOptions}
              />

              {/* Action Buttons */}
              <div className="flex justify-end pt-6 border-t border-gray-100 gap-3">
                <button
                  type="button"
                  id="cancel-channel-btn"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold font-kanit transition-all hover:text-slate-700 active:scale-95 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  id="submit-channel-btn"
                  disabled={isSubmitting}
                  className={`
                    px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-kanit shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center
                    ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>{channel ? 'บันทึกการแก้ไข' : 'สร้างรายการใหม่'}</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ChannelFormModal;

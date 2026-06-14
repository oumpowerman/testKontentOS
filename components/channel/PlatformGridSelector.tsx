import React from 'react';
import { Youtube, Facebook, Instagram, Video, Globe, Check, LayoutTemplate } from 'lucide-react';
import { Platform } from '../../types';

export const PLATFORM_OPTIONS: { id: Platform; label: string; icon: any; color: string }[] = [
  { id: 'YOUTUBE', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { id: 'FACEBOOK', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'TIKTOK', label: 'TikTok', icon: Video, color: 'text-zinc-800' },
  { id: 'INSTAGRAM', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'OTHER', label: 'Other/Website', icon: Globe, color: 'text-gray-600' },
];

interface PlatformGridSelectorProps {
  selectedPlatforms: Platform[];
  togglePlatform: (platform: Platform) => void;
  isSubmitting: boolean;
}

export const PlatformGridSelector: React.FC<PlatformGridSelectorProps> = ({
  selectedPlatforms,
  togglePlatform,
  isSubmitting
}) => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-gray-700 flex items-center">
        <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-500" />
        3. รายการนี้ลงที่ไหนบ้าง? (Active Platforms)
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {PLATFORM_OPTIONS.map((p) => {
          const isSelected = selectedPlatforms.includes(p.id);
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlatform(p.id)}
              disabled={isSubmitting}
              className={`
                flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative group/platform
                ${isSelected
                  ? `border-indigo-500 bg-indigo-50/50 shadow-sm`
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                }
                ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 active:translate-y-0'}
              `}
            >
              <Icon className={`w-8 h-8 mb-2 ${isSelected ? p.color : 'text-slate-300 group-hover/platform:text-slate-400'} transition-all`} />
              <span className={`font-bold text-xs ${isSelected ? 'text-gray-800' : 'text-slate-400 group-hover/platform:text-slate-500'}`}>
                {p.label}
              </span>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

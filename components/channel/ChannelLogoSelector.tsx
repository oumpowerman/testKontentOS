import React, { useRef } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface ChannelLogoSelectorProps {
  logoPreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (e: React.MouseEvent) => void;
  isSubmitting: boolean;
}

export const ChannelLogoSelector: React.FC<ChannelLogoSelectorProps> = ({
  logoPreview,
  onFileChange,
  onRemovePhoto,
  isSubmitting
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (!isSubmitting) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logo</label>
      <div
        className={`relative w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all overflow-hidden group ${
          isSubmitting ? 'cursor-not-allowed opacity-70' : ''
        }`}
        onClick={handleContainerClick}
      >
        {logoPreview ? (
          <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
        )}
        {!isSubmitting && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg"
        disabled={isSubmitting}
      />
      {logoPreview && !isSubmitting && (
        <button
          type="button"
          onClick={onRemovePhoto}
          className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline transition-all"
        >
          ลบรูป
        </button>
      )}
    </div>
  );
};

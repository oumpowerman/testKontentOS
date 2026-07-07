import React, { useState, useRef, useEffect } from 'react';
import { BellRing, Lock, Unlock, CheckCircle2, Sparkles, X } from 'lucide-react';

interface ProfileSocialSectionProps {
  lineUserId: string;
  onLineUserIdChange: (val: string) => void;
}

const ProfileSocialSection: React.FC<ProfileSocialSectionProps> = ({ lineUserId, onLineUserIdChange }) => {
  // Store original value on mount to allow cancellation
  const originalIdRef = useRef(lineUserId);
  const [isLocked, setIsLocked] = useState(!!lineUserId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if parent updates lineUserId (e.g. from automatic linking)
  useEffect(() => {
    if (lineUserId && !isLocked && !originalIdRef.current) {
      // If it was empty but now has a value from outside, lock it
      originalIdRef.current = lineUserId;
      setIsLocked(true);
    }
  }, [lineUserId, isLocked]);

  const handleUnlock = () => {
    setIsLocked(false);
    // Focus the input in next tick
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelEdit = () => {
    onLineUserIdChange(originalIdRef.current);
    if (originalIdRef.current) {
      setIsLocked(true);
    }
  };

  const isEmptyNow = !lineUserId;

  return (
    <div className="space-y-3 mt-4 px-1" id="profile-line-id-section">
      {/* Label and Badge Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider ml-1 flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-lg shadow-sm">
            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          LINE User ID (สำหรับแจ้งเตือน)
        </label>

        {/* Dynamic Status Badge */}
        {isLocked && lineUserId ? (
          <span className="relative inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            เชื่อมต่อแล้ว 🔒
          </span>
        ) : !isLocked && originalIdRef.current ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 animate-pulse">
            ⚠️ กำลังแก้ไข...
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 text-[10px] font-black rounded-full border border-pink-100 animate-bounce">
            <Sparkles className="w-3 h-3 fill-pink-300 text-pink-500" />
            แนะนำ ✨
          </span>
        )}
      </div>

      {/* Input Group with Premium Design */}
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={lineUserId}
          readOnly={isLocked}
          onChange={(e) => onLineUserIdChange(e.target.value)}
          className={`w-full px-5 py-4 rounded-2xl outline-none text-xs font-mono font-bold transition-all duration-300 pr-32
            ${
              isLocked
                ? 'bg-slate-50 border-2 border-slate-200 text-slate-500 cursor-not-allowed shadow-inner'
                : isEmptyNow
                ? 'bg-emerald-50/30 border-2 border-emerald-300/80 focus:bg-white focus:border-emerald-500 text-emerald-800 shadow-md shadow-emerald-100/50 ring-2 ring-emerald-50/50 focus:ring-4 focus:ring-emerald-100/80'
                : 'bg-emerald-50/10 border-2 border-emerald-400 focus:bg-white focus:border-emerald-500 text-emerald-900 focus:ring-4 focus:ring-emerald-100/80'
            }
          `}
          placeholder="Uxxxxxxxxxxxxxxxxxxxx..."
        />

        {/* Action Button inside Input */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {isLocked && lineUserId ? (
            <button
              type="button"
              onClick={handleUnlock}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900 text-[10px] font-black rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
            >
              <Unlock className="w-3 h-3 text-slate-500" />
              ปลดล็อคเพื่อแก้ไข
            </button>
          ) : !isLocked && originalIdRef.current ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-[10px] font-black rounded-xl border border-rose-200 shadow-sm transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
              ยกเลิก
            </button>
          ) : null}
        </div>
      </div>

      {/* Helper / Desc text */}
      {isLocked && lineUserId ? (
        <p className="text-[10px] text-slate-400 ml-2 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          บัญชี LINE ของคุณผูกเข้ากับระบบเสถียรเรียบร้อยแล้ว ปลอดภัยจากการแก้ไขโดยไม่เจตนา
        </p>
      ) : (
        <p className={`text-[10px] ml-2 font-semibold transition-all duration-300 ${isEmptyNow ? 'text-emerald-600 animate-pulse' : 'text-emerald-500'}`}>
          {isEmptyNow 
            ? '🔔 แนะนำ: เชื่อมต่อ LINE วันนี้เพื่อรับสิทธิ์แจ้งเตือนการอนุมัติใบลา เควส และรายงานสรุปแบบอัตโนมัติ'
            : '* กรอก LINE User ID ที่ต้องการเชื่อมต่อ และกด Save Changes ด้านล่าง'
          }
        </p>
      )}
    </div>
  );
};

export default ProfileSocialSection;

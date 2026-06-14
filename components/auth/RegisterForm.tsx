import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, Briefcase, Mail, Phone, Lock, Eye, EyeOff, Quote, ArrowRight, Loader2, Camera } from 'lucide-react';
import FilterDropdown from '../common/FilterDropdown';
import { EMOJI_POOL } from '../../constants/emojis';

interface RegisterFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  name: string;
  setName: (val: string) => void;
  position: string;
  setPosition: (val: string) => void;
  employmentType: string;
  setEmploymentType: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  reason: string;
  setReason: (val: string) => void;
  
  positions: { key: string, label: string }[];
  avatarPreview: string | null;
  isConvertingImg: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  selectedEmoji: string;
  setSelectedEmoji: (val: string) => void;
  takenEmojis: string[];
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  name,
  setName,
  position,
  setPosition,
  employmentType,
  setEmploymentType,
  phone,
  setPhone,
  reason,
  setReason,
  positions,
  avatarPreview,
  isConvertingImg,
  fileInputRef,
  handleFileChange,
  isLoading,
  onSubmit,
  selectedEmoji,
  setSelectedEmoji,
  takenEmojis,
}) => {
  // EMOJI_POOL is imported from central constants
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Avatar Image Selection */}
      <div className="flex justify-center mb-6">
        <div 
          className="relative group cursor-pointer" 
          onClick={() => !isConvertingImg && fileInputRef.current?.click()}
        >
          <div className={`w-24 h-24 rounded-full border-4 ${avatarPreview ? 'border-pink-300' : 'border-slate-100'} bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-pink-400 group-hover:scale-105 shadow-sm`}>
            {isConvertingImg ? (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-[10px] mt-1">Processing..</span>
              </div>
            ) : avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex flex-col items-center text-slate-400 select-none">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-bold text-red-400">รูปโปรไฟล์ *</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
            <Sparkles className="w-3 h-3" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/jpg, image/heic" 
            onChange={handleFileChange} 
            disabled={isConvertingImg}
          />
        </div>
      </div>

      {/* Nickname and Rank Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Nickname */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ชื่อเล่น *</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <User className="w-5 h-5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
              </motion.div>
            </div>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700 text-sm" 
              placeholder="ชื่อเล่น" 
              required 
            />
          </div>
        </div>

        {/* Position */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ตำแหน่งงาน *</label>
          <FilterDropdown 
            label="ตำแหน่งงาน"
            options={positions.length > 0 ? positions.map(p => ({ key: p.label, label: p.label })) : [
              { key: 'Editor', label: 'Editor' },
              { key: 'Creative', label: 'Creative' },
            ]}
            value={position}
            onChange={(val) => setPosition(val)}
            showAllOption={false}
            clearable={false}
            icon={<Briefcase className="w-5 h-5" />}
            activeColorClass="bg-pink-50 border-pink-200 text-pink-700 font-bold"
          />
        </div>
      </div>

      {/* Employment Type */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ประเภทพนักงาน *</label>
        <FilterDropdown 
          label="ประเภทพนักงาน"
          options={[
            { key: 'FULL_TIME', label: 'พนักงานประจำ (Full-time)' },
            { key: 'INTERN', label: 'นักศึกษาฝึกงาน (Intern)' },
            { key: 'PROBATION', label: 'ทดลองงาน (Probation)' },
          ]}
          value={employmentType}
          onChange={(val) => setEmploymentType(val)}
          showAllOption={false}
          clearable={false}
          icon={<User className="w-5 h-5" />}
          activeColorClass="bg-pink-50 border-pink-200 text-pink-700 font-bold"
        />
      </div>

      {/* Email Input */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">อีเมล *</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
            </motion.div>
          </div>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700" 
            placeholder="email@example.com" 
            required 
          />
        </div>
      </div>

      {/* Phone Number */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">เบอร์โทรศัพท์ *</label>
        <div className="relative group">
          <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500 transition-colors" />
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700" 
            placeholder="08x-xxx-xxxx" 
            required 
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">รหัสผ่าน *</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <motion.div
              animate={{ 
                rotate: [0, 8, 0, -8, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
            </motion.div>
          </div>
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700 [&::-ms-reveal]:hidden [&::-webkit-password-reveal-button]:hidden" 
            placeholder="••••••••" 
            required 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors outline-none focus:ring-0 z-20"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Bio / Quote Area */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">แนะนำตัว / ฝากถึงทีมงาน</label>
        <div className="relative group">
          <Quote className="w-5 h-5 text-slate-400 absolute left-4 top-4 group-focus-within:text-pink-500 transition-colors" />
          <textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            rows={2} 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-medium text-slate-700 text-sm resize-none" 
            placeholder="บอกเราหน่อยว่าทำไมอยากร่วมทีม..." 
          />
        </div>
      </div>

      {/* 8-bit Emoji Picker Selection */}
      <div className="space-y-2 bg-indigo-50/20 border-2 border-indigo-100/50 p-4 shadow-inner rounded-2xl">
        <div className="flex justify-between items-center">
          <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5 uppercase">
            <span>✨ เลือกอิโมจิประจำตัว *</span>
            <span className="text-[10px] font-medium text-indigo-400 font-sans lowercase">(ใช้สำหรับวิ่งบนลู่วิ่งแข่ง และสะสมแต้ม)</span>
          </label>
          <span className="font-mono text-lg select-none px-3 py-1 bg-white rounded-xl border border-indigo-100 shadow-sm">
            {selectedEmoji || '👾'}
          </span>
        </div>
        
        <div className="grid grid-cols-10 gap-1.5 max-h-[115px] overflow-y-auto p-1.5 bg-white/70 rounded-xl border border-indigo-50/50 scrollbar-thin scrollbar-thumb-indigo-200">
          {EMOJI_POOL.map((emo) => {
            const isTaken = takenEmojis.includes(emo);
            const isSelected = selectedEmoji === emo;
            return (
              <button
                key={emo}
                type="button"
                disabled={isTaken}
                onClick={() => setSelectedEmoji(emo)}
                className={`text-xl p-1 rounded-lg transition-transform duration-100 ease-out flex items-center justify-center relative select-none
                  ${isSelected ? 'bg-indigo-500 scale-110 shadow-md border border-indigo-600 ring-2 ring-indigo-200 z-10 text-white' : 'hover:scale-105 active:scale-95'}
                  ${isTaken ? 'opacity-25 bg-slate-100 cursor-not-allowed filter grayscale line-through' : 'cursor-pointer hover:bg-indigo-50'}
                `}
                title={isTaken ? 'เพื่อนในทีมเลือกไปแล้วครับ' : 'คลิกเพื่อเลือกอิโมจินี้'}
              >
                <span className="leading-none">{emo}</span>
                {isTaken && (
                  <span className="absolute text-[8px] bottom-0 right-0">🔒</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isLoading || isConvertingImg}
          className={`w-full py-4 rounded-xl font-black text-white text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading || isConvertingImg ? 'opacity-70 cursor-not-allowed' : ''} bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-200`}
        >
          {isLoading || isConvertingImg ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังส่งใบสมัคร...</span>
            </>
          ) : (
            <>
              <span>ส่งใบสมัครสมาชิก</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )} 
        </button>
      </div>
    </form>
  );
};

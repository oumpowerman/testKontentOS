import React from 'react';
import { Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface UpdatePasswordFormProps {
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* New Password Input */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">รหัสผ่านใหม่ *</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <motion.div
              animate={{ 
                rotate: [0, 8, 0, -8, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </motion.div>
          </div>
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 rounded-xl outline-none transition-all font-bold text-slate-700 [&::-ms-reveal]:hidden [&::-webkit-password-reveal-button]:hidden" 
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

      {/* Confirm Password Input */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ยืนยันรหัสผ่านใหม่ *</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 rounded-xl outline-none transition-all font-bold text-slate-700" 
            placeholder="••••••••" 
            required 
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-black text-white text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังอัปเดตรหัสผ่าน...</span>
            </>
          ) : (
            <>
              <span>อัปเดตรหัสผ่านใหม่</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )} 
        </button>
      </div>
    </form>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (val: string) => void;
  isLoading: boolean;
  resetSent: boolean;
  showForgotConfirm: boolean;
  setShowForgotConfirm: (val: boolean) => void;
  onSubmitEmail: (e: React.FormEvent) => void;
  onSendReset: () => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  setEmail,
  isLoading,
  resetSent,
  showForgotConfirm,
  setShowForgotConfirm,
  onSubmitEmail,
  onSendReset,
  onBackToLogin,
}) => {
  // If reset email has been successfully initiated and sent
  if (resetSent) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2rem] text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-emerald-600" />
        </div>
        <h4 className="text-xl font-black text-slate-800 mb-2">ส่งลิงก์กู้คืนแล้ว!</h4>
        <p className="text-slate-500 text-sm font-medium mb-6">
          กรุณาตรวจสอบกล่องจดหมายของคุณ (รวมถึง Junk/Spam) และคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่
        </p>
        <button 
          type="button"
          onClick={onBackToLogin}
          className="text-emerald-600 font-black text-sm uppercase tracking-widest hover:underline outline-none"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      </motion.div>
    );
  }

  // If the user is currently at the spelling confirmation dialog
  if (showForgotConfirm) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-amber-50/85 border-2 border-amber-100 p-6 md:p-8 rounded-[2rem] text-center"
      >
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h4 className="text-xl font-black text-slate-800 mb-2">ตรวจสอบอีเมลให้ชัวร์ก่อนนะครับ 🔍</h4>
        <p className="text-slate-500 text-sm font-medium mb-4 leading-relaxed">
          ระบบกู้คืนรหัสผ่าน <span className="text-red-500 font-extrabold">จะไม่มีการแจ้งเตือนใด ๆ</span> หากระบุอีเมลไม่ตรงกับในฐานข้อมูล (เพื่อความปลอดภัยทางข้อมูล) กรุณาสะกดทีละตัวอักษรให้ถูกต้อง
        </p>
        
        <div className="bg-white border border-amber-200/60 rounded-2xl p-4 mb-6 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block mb-1">อีเมลที่คุณระบุคือ:</span>
          <span className="text-md font-black text-indigo-600 break-all select-all block py-1 bg-slate-50 rounded-lg border border-dashed border-slate-200">{email}</span>
        </div>

        <div className="space-y-2">
          <button 
            type="button"
            disabled={isLoading}
            onClick={onSendReset}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังส่งอีмеลกู้คืน...</span>
              </>
            ) : (
              <>
                <span>ใช่, อีเมลนี้สะกดถูกต้องแน่นอน 👍</span>
              </>
            )}
          </button>
          
          <button 
            type="button"
            disabled={isLoading}
            onClick={() => setShowForgotConfirm(false)}
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm border border-slate-200 transition-all outline-none"
          >
            แก้ไขสะกดคำ / เปลี่ยนอีเมล
          </button>
        </div>
      </motion.div>
    );
  }

  // Standard step: input the email
  return (
    <form onSubmit={onSubmitEmail} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">อีเมลสมาชิก *</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </motion.div>
          </div>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 rounded-xl outline-none transition-all font-bold text-slate-700" 
            placeholder="email@example.com" 
            required 
          />
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-black text-white text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200`}
        >
          <span>ส่งอีเมลกู้คืนรหัสผ่าน</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <button 
        type="button"
        onClick={onBackToLogin}
        className="w-full mt-4 text-center text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors outline-none"
      >
        กลับไปหน้าเข้าสู่ระบบ
      </button>
    </form>
  );
};

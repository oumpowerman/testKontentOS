import React from 'react';
import { motion } from 'framer-motion';
import { UserX, LogOut, HelpCircle } from 'lucide-react';

interface MissingProfileScreenProps {
  onLogout: () => void;
}

export const MissingProfileScreen: React.FC<MissingProfileScreenProps> = ({ onLogout }) => {
  return (
    <div id="missing-profile-screen" className="flex min-h-screen flex-col items-center justify-center bg-[#0f111a] p-6 text-center overflow-hidden relative">
      {/* Aurora Ambient Cosmic Glow Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-slate-900/80 border border-red-500/20 p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-slate-200"
      >
        {/* Glow border on top edge */}
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

        {/* Premium Warning Icon Container */}
        <div className="mx-auto w-20 h-20 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <UserX className="w-10 h-10" />
        </div>

        {/* Header Title */}
        <h2 className="text-2xl font-black font-kanit mb-3 text-white tracking-wide">
          ไม่พบข้อมูลโปรไฟล์ในระบบ
        </h2>
        
        {/* Subtitle/Explainers */}
        <div className="space-y-3 mb-8">
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            บัญชีของคุณผ่านการตรวจสอบสิทธิ์แล้ว <br />
            แต่ <span className="text-red-400 font-bold">ไม่พบข้อมูลโปรไฟล์</span> ในตารางฐานข้อมูลหลัก
          </p>
          <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-400 text-left space-y-1.5 font-medium leading-relaxed">
            <div className="flex items-start gap-1.5">
              <span className="text-red-400 mt-0.5">•</span>
              <span>อาจเกิดจากขั้นตอนการสมัครสมาชิกขัดข้องระหว่างกลาง</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-red-400 mt-0.5">•</span>
              <span>หรือข้อมูลผู้ใช้ถูกยกเลิกในตารางหลักโดยผู้ดูแลระบบ</span>
            </div>
          </div>
        </div>

        {/* Actions Button Panel */}
        <div className="flex flex-col gap-3">
          <button
            id="force-logout-btn"
            onClick={onLogout}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] text-white font-black rounded-2xl shadow-lg shadow-pink-500/10 transition-all duration-300 text-sm flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ / เปลี่ยนบัญชีอื่น
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-4 border-t border-slate-800/60 pt-4">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>หากต้องการใช้งานบัญชีนี้ต่อ โปรดติดต่อผู้ดูแลระบบเพื่อแก้ไข</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

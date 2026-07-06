import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, Rocket } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface BrandSectionProps {
  authMode: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE';
}

export const BrandSection: React.FC<BrandSectionProps> = ({ authMode }) => {
  return (
    <div className="hidden md:flex md:w-5/12 relative flex-col items-center justify-center text-white p-12 overflow-hidden select-none">
         {/* 1. Login Background Layer */}
         <motion.div
           initial={false}
           animate={{ opacity: authMode === 'LOGIN' ? 1 : 0 }}
           transition={{ duration: 0.8, ease: "easeInOut" }}
           className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] to-[#818cf8]"
         />

         {/* 2. Register Background Layer */}
         <motion.div
           initial={false}
           animate={{ opacity: authMode === 'REGISTER' ? 1 : 0 }}
           transition={{ duration: 0.8, ease: "easeInOut" }}
           className="absolute inset-0 bg-gradient-to-br from-[#db2777] to-[#f472b6]"
         />

         {/* 3. Other Modes (Forgot / Update) Background Layer */}
         <motion.div
           initial={false}
           animate={{ opacity: (authMode !== 'LOGIN' && authMode !== 'REGISTER') ? 1 : 0 }}
           transition={{ duration: 0.8, ease: "easeInOut" }}
           className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#334155]"
         />

         {/* ลายจุด Dot Pattern ด้านบนสุดของ Background */}
         <div className="absolute inset-0 opacity-20 z-0" style={{ backgroundImage: 'radial-gradient(circle at 4px 4px, white 2px, transparent 0)', backgroundSize: '40px 40px' }}></div>
         
         <AnimatePresence mode="wait">
            <motion.div 
                key={authMode}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="relative z-10 text-center flex flex-col items-center select-none"
            >
                <motion.div 
                    animate={{ 
                        rotate: [3, 8, 3, -2, 3],
                        y: [0, -4, 0]
                    }}
                    transition={{ 
                        duration: 5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-28 h-28 bg-white/20 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-md shadow-xl ring-2 ring-white/30"
                >
                    {authMode === 'LOGIN' ? (
                        <Sparkles className="w-14 h-14 text-white drop-shadow-md" />
                    ) : authMode === 'FORGOT' || authMode === 'UPDATE' ? (
                        <Lock className="w-14 h-14 text-white drop-shadow-md" />
                    ) : (
                        <Rocket className="w-14 h-14 text-white drop-shadow-md" />
                    )}
                </motion.div>
                
                <h2 id="brand-title" className="text-4xl font-black mb-4 leading-tight drop-shadow-sm tracking-tight">
                    {BRAND_CONFIG.name}
                </h2>
                <p id="brand-description" className="text-white/90 text-lg leading-relaxed mb-10 font-medium max-w-xs">
                    {authMode === 'LOGIN' 
                        ? "ระบบจัดการงานคอนเทนต์ สำหรับทีมครีเอเตอร์ยุคใหม่"
                        : authMode === 'REGISTER'
                        ? "สมัครสมาชิกเพื่อเริ่มจัดการงาน และ Workload ทีมของคุณ"
                        : authMode === 'FORGOT'
                        ? "ไม่ต้องกังวล เราจะช่วยคุณกู้คืนบัญชีเอง"
                        : "ตั้งรหัสผ่านใหม่ที่จำง่ายแต่ปลอดภัยนะครับ"
                    }
                </p>
            </motion.div>
         </AnimatePresence>
    </div>
  );
};

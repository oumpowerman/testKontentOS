import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'super-admin-9999') {
      onSuccess();
      setPasscode('');
      setPasscodeError('');
    } else {
      setPasscodeError('รหัสลับไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-white"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black tracking-tight">Developer Access</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">กรุณากรอกรหัสลับเพื่อปลดล็อก Sidebar Control Center</p>
              
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setPasscodeError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-indigo-500 transition-colors"
                    autoFocus
                  />
                  {passcodeError && (
                    <p className="text-red-400 text-xs mt-2 font-bold">{passcodeError}</p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-colors"
                  >
                    ยืนยัน
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

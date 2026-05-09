
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

function PWAReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-2rem)] sm:w-[420px]">
          <motion.div
             initial={{ y: 100, opacity: 0, scale: 0.95 }}
             animate={{ y: 0, opacity: 1, scale: 1 }}
             exit={{ y: 100, opacity: 0, scale: 0.95 }}
             className="w-full"
          >
            <div className="bg-white/95 backdrop-blur-2xl border border-indigo-100/50 shadow-[0_20px_70px_rgba(79,70,229,0.2)] rounded-3xl p-5 sm:p-7 flex flex-col gap-5 overflow-hidden relative group">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-100 transition-colors" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <RefreshCw className={`w-6 h-6 ${needRefresh ? 'animate-spin-slow' : ''}`} />
                  </div>
                  <div className="pr-2">
                    <h4 className="text-slate-900 font-black text-lg sm:text-xl tracking-tight leading-tight">
                      {offlineReady ? 'พร้อมใช้งานออฟไลน์!' : 'พบเวอร์ชันใหม่! 🚀'}
                    </h4>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                      {offlineReady 
                        ? 'คุณสามารถใช้งานแอปได้แม้ไม่มีอินเทอร์เน็ต' 
                        : 'เราได้อัปเดตฟีเจอร์ใหม่ๆ กดอัปเดตเพื่อรับประสบการณ์ล่าสุด'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={close}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3 relative z-10 mt-1">
                {needRefresh ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateServiceWorker(true)}
                      className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      อัปเดตเดี๋ยวนี้
                    </motion.button>
                    <button
                      onClick={close}
                      className="flex-1 py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all"
                    >
                      ไว้ก่อน
                    </button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={close}
                    className="w-full py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm border-2 border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95"
                  >
                    รับทราบ
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default PWAReloadPrompt;

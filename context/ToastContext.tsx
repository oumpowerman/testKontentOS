
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Skull, Gift } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'penalty' | 'reward';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Logic: Only auto-dismiss if NOT a penalty. 
    // Penalties stay on screen until manually closed (Sticky).
    if (type !== 'penalty') {
        const duration = type === 'reward' ? 5000 : 3000; // Rewards stay a bit longer (5s)
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container - UPDATED z-index to 10000 */}
      <div className="fixed top-4 right-4 z-[120000] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-right-full duration-300
              ${toast.type === 'success' ? 'bg-white/95 border-green-200 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-white/95 border-red-200 text-red-800' : ''}
              ${toast.type === 'info' ? 'bg-white/95 border-blue-200 text-blue-800' : ''}
              ${toast.type === 'warning' ? 'bg-white/95 border-orange-200 text-orange-800' : ''}
              ${toast.type === 'penalty' ? 'bg-red-600 border-red-700 text-white shadow-red-200 shadow-2xl scale-105' : ''}
              ${toast.type === 'reward' ? 'bg-yellow-500 border-yellow-600 text-white shadow-yellow-200' : ''}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
              {toast.type === 'penalty' && <Skull className="w-6 h-6 text-white animate-pulse" />}
              {toast.type === 'reward' && <Gift className="w-5 h-5 text-white animate-bounce" />}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-bold ${toast.type === 'penalty' || toast.type === 'reward' ? 'text-white' : ''}`}>
                {
                 toast.type === 'success' ? 'สำเร็จ!' : 
                 toast.type === 'error' ? 'เกิดข้อผิดพลาด' : 
                 toast.type === 'warning' ? 'แจ้งเตือน' : 
                 toast.type === 'penalty' ? 'โดนหักคะแนน!' :
                 toast.type === 'reward' ? 'ยินดีด้วย!' :
                 'ข้อมูล'
                }
              </p>
              <p className={`text-sm mt-0.5 ${toast.type === 'penalty' || toast.type === 'reward' ? 'text-white/90' : 'opacity-90'}`}>
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className={`ml-4 flex-shrink-0 transition-colors p-1 rounded-full hover:bg-black/10 ${toast.type === 'penalty' || toast.type === 'reward' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};


import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Skull, AlertCircle, Heart, Timer, LogOut, CheckCircle2 } from 'lucide-react';
import { AppNotification } from '../../types';

interface DeathLockModalProps {
    notification: AppNotification | undefined;
    onAcknowledge: (id: string) => void;
    onLogout: () => void;
}

const DeathLockModal: React.FC<DeathLockModalProps> = ({ notification, onAcknowledge, onLogout }) => {
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(7);

    useEffect(() => {
        if (notification) {
            // Only reset if it's a DIFFERENT notification ID
            // This prevents resets when notifications array re-calculates in parent
            setCanClose(false);
            setCountdown(7);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanClose(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [notification?.id]); // Change dependency to notification.id

    if (!notification) return null;

    const daysRemaining = notification.metadata?.daysRemaining || 0;
    const isImminent = daysRemaining <= 1;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-in fade-in duration-500">
            <div className={`bg-slate-900 border ${isImminent ? 'border-red-600/50' : 'border-orange-500/30'} w-full max-w-lg rounded-[2.5rem] shadow-[0_0_80px_rgba(220,38,38,0.2)] overflow-hidden relative flex flex-col items-center text-center p-10 animate-in zoom-in-95 duration-700`}>
                
                {/* Visual Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.1)_0%,transparent_70%)] pointer-events-none"></div>
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>

                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-2xl border-2 border-red-600/50 relative group">
                    <Skull className={`w-12 h-12 ${isImminent ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
                    <div className="absolute -top-1 -right-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg border-4 border-slate-900 animate-bounce">
                            <Timer className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight uppercase italic">
                    {isImminent ? 'วิญญาณกำลังจะแตกสลาย!' : 'สัญญาณชีพกำลังจะดับสูญ'}
                </h2>
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-red-600 opacity-50"></div>
                    <p className="text-red-500 font-bold text-xs uppercase tracking-[0.3em]">
                        Death Protocol Warning
                    </p>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-red-600 opacity-50"></div>
                </div>

                <div className="bg-slate-800/40 rounded-3xl p-8 border border-white/5 mb-8 w-full backdrop-blur-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-300 text-lg leading-relaxed mb-8 font-medium">
                            {notification.message}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-red-950/30 p-5 rounded-2xl border border-red-500/20">
                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Time Remaining</p>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-4xl font-bold text-white">{daysRemaining}</p>
                                    <p className="text-sm font-bold text-red-500">วันทำการ</p>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">HP Level</p>
                                <div className="flex items-center justify-center gap-2 text-red-500">
                                    <Heart className="w-5 h-5 fill-current" />
                                    <p className="text-2xl font-black">CRITICAL</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Dark inner shadow */}
                    <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none"></div>
                </div>

                <div className="space-y-4 w-full">
                    <button
                        onClick={() => canClose && onAcknowledge(notification.id)}
                        disabled={!canClose}
                        className={`
                            w-full py-5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3
                            ${canClose 
                                ? 'bg-white text-black hover:bg-red-600 hover:text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] cursor-pointer active:scale-[0.98]' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'}
                        `}
                    >
                        {canClose ? (
                            <>
                                <CheckCircle2 className="w-6 h-6" /> รับทราบและจะฟื้นฟู HP โดยเร็ว!
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-6 h-6 animate-spin-slow opacity-50" /> 
                                สแกนกรรม... {countdown} วินาที
                            </>
                        )}
                    </button>

                    <button 
                        onClick={onLogout}
                        className="w-full py-4 bg-transparent text-slate-500 hover:text-white transition-colors text-sm font-bold flex items-center justify-center gap-2 group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        ลงชื่อออก (ยอมรับชะตากรรมชั่วคราว)
                    </button>
                </div>

                {/* Warning Footer */}
                <p className="mt-8 text-slate-600 text-[10px] font-bold uppercase tracking-tighter">
                    Security Enforcement: If HP is not restored within 7 business days, the system will initiate Permanent Burial Protocol.
                </p>
            </div>
        </div>,
        document.body
    );
};

export default DeathLockModal;

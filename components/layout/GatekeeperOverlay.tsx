import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserSession } from '../../context/UserSessionContext';
import { MasterOption } from '../../types';
import { ShieldCheck, LogOut, ArrowRight, Loader2 } from 'lucide-react';

interface GatekeeperOverlayProps {
    activePolicy: MasterOption;
    userAcceptedVersion: number;
}

const GatekeeperOverlay: React.FC<GatekeeperOverlayProps> = ({ activePolicy, userAcceptedVersion }) => {
    const { updateProfile } = useUserSession();
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    // Fail-safe state in case database profile updates fail
    const [localAcceptBypass, setLocalAcceptBypass] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const difference = target.scrollHeight - target.scrollTop - target.clientHeight;
        if (difference <= 15) {
            setHasScrolledToBottom(true);
        }
    };

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            const success = await updateProfile({
                acceptedTermsVersion: activePolicy.progressValue || 1,
                acceptedTermsAt: new Date(),
            });

            if (!success) {
                // Fail-safe bypass so user isn't stuck forever if network drops
                console.warn("Profile update returned false, bypassing locally to protect user access.");
                setLocalAcceptBypass(true);
            }
        } catch (error) {
            console.error("Error accepting terms:", error);
            setLocalAcceptBypass(true);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setIsSigningOut(false);
        }
    };

    if (localAcceptBypass) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300 select-none">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 bg-slate-50">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shrink-0">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h2 className="font-extrabold text-slate-900 text-xl tracking-tight leading-none">
                            {activePolicy.label || 'ข้อตกลงและระเบียบปฏิบัติการทำงาน'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            ระบบตรวจพบข้อตกลงฉบับปรับปรุงใหม่ (เวอร์ชัน v{activePolicy.progressValue}) เพื่อความโปร่งใสและรักษามาตรฐานร่วมกัน กรุณาตรวจสอบและกดยอมรับเพื่อเริ่มเข้าสู่ห้องปฏิบัติงาน
                        </p>
                    </div>
                </div>

                {/* Terms Body (Scrollable) */}
                <div 
                    onScroll={handleScroll}
                    className="p-8 overflow-y-auto flex-1 font-sans text-sm text-slate-600 leading-relaxed space-y-4"
                >
                    {activePolicy.description ? (
                        activePolicy.description.split('\n').map((line, idx) => {
                            if (line.startsWith('###')) {
                                return (
                                    <h4 key={idx} className="font-extrabold text-slate-900 text-base pt-3 border-t border-slate-50">
                                        {line.replace('###', '').trim()}
                                    </h4>
                                );
                            }
                            if (line.startsWith('#')) {
                                return (
                                    <h3 key={idx} className="font-black text-slate-900 text-lg border-b border-slate-100 pb-2.5">
                                        {line.replace('#', '').trim()}
                                    </h3>
                                );
                            }
                            if (line.startsWith('-')) {
                                return (
                                    <li key={idx} className="ml-5 list-disc text-slate-650">
                                        {line.replace('-', '').trim()}
                                    </li>
                                );
                            }
                            return <p key={idx}>{line}</p>;
                        })
                    ) : (
                        <p className="text-slate-450 italic text-center py-10">
                            ไม่มีเนื้อหาระเบียบปฏิบัติในระบบ
                        </p>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-xs text-slate-400 flex-1 text-center sm:text-left font-medium">
                        {!hasScrolledToBottom ? (
                            <span className="animate-pulse text-rose-500 font-bold">
                                ⚠️ กรุณาเลื่อนลงไปด้านล่างสุดเพื่อยืนยันว่าได้อ่านครบถ้วนแล้ว
                            </span>
                        ) : (
                            <span className="text-green-600 font-bold flex items-center justify-center sm:justify-start gap-1">
                                ✓ ฉันได้อ่านรายละเอียดระเบียบปฏิบัติครบถ้วนแล้ว
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Decline & Exit */}
                        <button
                            type="button"
                            disabled={isSigningOut || isAccepting}
                            onClick={handleSignOut}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSigningOut ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            ปฏิเสธและออกจากระบบ
                        </button>

                        {/* Accept & Enter */}
                        <button
                            type="button"
                            disabled={!hasScrolledToBottom || isAccepting || isSigningOut}
                            onClick={handleAccept}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md active:scale-95
                                ${hasScrolledToBottom && !isAccepting
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 cursor-pointer'
                                    : 'bg-slate-300 text-slate-450 shadow-none cursor-not-allowed'
                                }
                            `}
                        >
                            {isAccepting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    ยอมรับและเริ่มปฏิบัติงาน
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GatekeeperOverlay;

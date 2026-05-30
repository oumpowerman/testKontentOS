import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Monitor, ShieldAlert, LogOut, Zap, RefreshCw } from 'lucide-react';

export const ScreenSessionLimiter: React.FC<{ user: any }> = ({ user }) => {
  const [isKicked, setIsKicked] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [tableExists, setTableExists] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);
  const [activeScreensList, setActiveScreensList] = useState<any[]>([]);
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const [tick, setTick] = useState(0);

  // Generate a distinct UUID for this browser tab/session if not already present
  const getTabId = (): string => {
    let tabId = sessionStorage.getItem('juijui_tab_id');
    if (!tabId) {
      tabId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString();
      sessionStorage.setItem('juijui_tab_id', tabId);
    }
    return tabId;
  };

  const tabId = getTabId();

  // Periodically force an update of elapsed time strings when blocked
  useEffect(() => {
    if (!isBlocked) return;
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isBlocked]);

  const cleanUpAndCheck = async () => {
    if (!user?.id || !tableExists) {
      setIsSyncing(false);
      return;
    }

    try {
      // 1. Delete outdated screens (older than 120 seconds) for this user to keep database clean
      const expiryTime = new Date(Date.now() - 120 * 1000).toISOString();
      await supabase
        .from('user_screens')
        .delete()
        .eq('user_id', user.id)
        .lt('last_seen_at', expiryTime);

      // 2. Fetch all current active sessions for the user
      const { data: screens, error } = await supabase
        .from('user_screens')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn("⚠️ user_screens table does not exist. Concurrency limits are inactive until migrations run.");
          setTableExists(false);
          setIsSyncing(false);
          return;
        }
        throw error;
      }

      const active = (screens || []).filter(s => new Date(s.last_seen_at).getTime() > Date.now() - 120000);
      setActiveScreensList(active);

      const isAlreadyRegistered = active.some(s => s.id === tabId);

      if (!isAlreadyRegistered && active.length >= 2) {
        setIsBlocked(true);
      } else {
        // Register current screen
        await supabase
          .from('user_screens')
          .upsert({
            id: tabId,
            user_id: user.id,
            last_seen_at: new Date().toISOString()
          });
        setIsBlocked(false);
      }
    } catch (err) {
      console.error("Failed to perform screen activity checks:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!user?.id || !tableExists) {
      setIsSyncing(false);
      return;
    }

    cleanUpAndCheck();

    // Heartbeat every 30 seconds to preserve this session
    const heartbeatInterval = setInterval(async () => {
      // Don't issue heartbeat if blocked or kicked
      if (isBlocked || isKicked) return;

      try {
        await supabase
          .from('user_screens')
          .upsert({
            id: tabId,
            user_id: user.id,
            last_seen_at: new Date().toISOString()
          });
      } catch (err) {
        console.warn("Screen limiter heartbeat error:", err);
      }
    }, 30000);

    // Real-time listener to trigger user logout if current session ID (tabId) gets deleted
    const screenSubscription = supabase
      .channel(`screen-limits:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_screens',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.old && payload.old.id === tabId) {
            console.log("🔒 Screen Session Kick-out Triggered: This tab ID was evicted.");
            setIsKicked(true);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(heartbeatInterval);
      supabase.removeChannel(screenSubscription);
    };
  }, [user?.id, tableExists, isBlocked, isKicked]);

  const handleManualSignOut = async () => {
    try {
      await supabase.from('user_screens').delete().eq('id', tabId);
    } catch (e) { /* ignore */ }
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleTakeover = async () => {
    if (activeScreensList.length === 0) return;
    setTakeoverLoading(true);

    try {
      // Find the oldest connection based on last_seen_at
      const sorted = [...activeScreensList].sort(
        (a, b) => new Date(a.last_seen_at).getTime() - new Date(b.last_seen_at).getTime()
      );

      const oldest = sorted[0];
      if (oldest) {
        // Delete oldest session to make room
        await supabase
          .from('user_screens')
          .delete()
          .eq('id', oldest.id);
      }

      // Upsert current session
      await supabase
        .from('user_screens')
        .upsert({
          id: tabId,
          user_id: user.id,
          last_seen_at: new Date().toISOString()
        });

      setIsBlocked(false);
      // Wait a moment then refresh state to ensure everything conforms
      setTimeout(() => {
        cleanUpAndCheck();
      }, 500);
    } catch (err) {
      console.error("Takeover failed:", err);
    } finally {
      setTakeoverLoading(false);
    }
  };

  // Countdown timer auto-logoff when kicked out
  useEffect(() => {
    if (!isKicked) return;

    if (countdown <= 0) {
      handleManualSignOut();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isKicked, countdown]);

  const formatActiveTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 5) return 'เมื่อครู่นี้';
    if (diffSec < 60) return `ใช้งานเมื่อ ${diffSec} วินาทีที่แล้ว`;
    const diffMin = Math.floor(diffSec / 60);
    return `ใช้งานเมื่อ ${diffMin} นาทีที่แล้ว`;
  };

  if (isSyncing) {
    return null;
  }

  // 1. STATE: BLOCKED (User wants to log in but has reached the 2-screen limit)
  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/92 backdrop-blur-lg transition-opacity duration-300">
        <div className="w-full max-w-md scale-95 transform rounded-3xl border border-slate-800/80 bg-slate-900 p-8 shadow-2xl transition-all duration-300 select-none">
          <div className="flex flex-col items-center text-center">
            
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-8 ring-indigo-500/5 animate-pulse">
              <Monitor className="h-8 w-8" />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white mb-2">
              หน้าจอใช้งานเต็มแล้ว 🔒
            </h1>
            <p className="text-sm font-light text-slate-400 leading-relaxed mb-6">
              บัญชีของคุณกำลังเปิดใช้งานพร้อมกันครบขีดจำกัดสูงสุด <strong className="text-indigo-400 font-semibold">2 หน้าจอ</strong> แล้วในขณะนี้
            </p>

            {/* List of active screens */}
            <div className="w-full space-y-3 mb-6">
              <p className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                รายการหน้าจอที่กำลังเปิดใช้งานอยู่ในขณะนี้:
              </p>
              {activeScreensList.map((screen, idx) => (
                <div 
                  key={screen.id} 
                  className="w-full rounded-xl bg-slate-950/70 p-4 flex items-center justify-between border border-slate-800/40"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-white font-medium">อุปกรณ์เชื่อมต่อที่ {idx + 1}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate w-40">{screen.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {formatActiveTime(screen.last_seen_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={handleTakeover}
                disabled={takeoverLoading}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {takeoverLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                แย่งสิทธิ์เชื่อมต่อ (เตะหน้าจอเก่าสุดออก)
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    await cleanUpAndCheck();
                  }}
                  className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950 px-3 py-3 text-xs font-semibold text-slate-300 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  ตรวจสอบอีกครั้ง
                </button>
                <button
                  onClick={handleManualSignOut}
                  className="flex items-center justify-center rounded-xl border border-rose-950/40 bg-rose-950/10 hover:bg-rose-950/20 px-3 py-3 text-xs font-semibold text-rose-400 transition-all active:scale-[0.98]"
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  ลงชื่อออก
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  // 2. STATE: KICKED (This specific browser session was evicted by another screen performing a takeover)
  if (isKicked) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-300">
        <div className="w-full max-w-md scale-95 transform rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-all duration-300 select-none">
          <div className="flex flex-col items-center text-center">
            
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5 animate-pulse">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white mb-2">
              หน้าจอนี้ถูกตัดการเชื่อมต่อ 🔒
            </h1>
            <p className="text-sm font-light text-slate-400 leading-relaxed mb-6">
              หน้าจอนี้ <span className="text-rose-400 font-medium">ถูกตัดสิทธิ์เชื่อมต่อ (Evicted)</span> เนื่องจากมีหน้าจอใหม่เข้าใช้งานโดยเลือก แย่งสิทธิ์เชื่อมต่อ
            </p>

            <div className="w-full rounded-xl bg-slate-950 p-4 mb-6 flex items-center justify-start border border-slate-800/50">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Monitor className="h-4 w-4" />
              </div>
              <div className="text-left font-mono text-xs">
                <p className="text-slate-400 font-medium font-sans">Session ID (Current Screen)</p>
                <p className="text-indigo-400 truncate w-60">{tabId}</p>
              </div>
            </div>

            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-6">
              <div 
                className="bg-indigo-500 h-full transition-all duration-1000 ease-linear rounded-full" 
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>

            <button
              onClick={handleManualSignOut}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] transition-all"
            >
              รับทราบและลงชื่อออก ({countdown} วิ)
            </button>
            
          </div>
        </div>
      </div>
    );
  }

  return null;
};


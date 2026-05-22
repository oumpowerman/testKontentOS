import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Monitor, ShieldAlert, LogOut } from 'lucide-react';

export const ScreenSessionLimiter: React.FC<{ user: any }> = ({ user }) => {
  const [isKicked, setIsKicked] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [tableExists, setTableExists] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);

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

  useEffect(() => {
    if (!user?.id || !tableExists) {
      setIsSyncing(false);
      return;
    }

    const registerScreen = async () => {
      try {
        // Enforced elegantly via PostgreSQL Server trigger:
        // Simply upserting our screen record will invoke BEFORE trigger under the hood to automatically:
        // - Clean up any expired keys older than 90 seconds
        // - Enforce the 2-screen cap by deleting the oldest tab if exceeded
        const { error: upsertError } = await supabase
          .from('user_screens')
          .upsert({
            id: tabId,
            user_id: user.id,
            last_seen_at: new Date().toISOString()
          });

        if (upsertError) {
          if (upsertError.code === '42P01' || upsertError.message?.includes('does not exist')) {
            console.warn("⚠️ user_screens table does not exist. Concurrency limits are inactive until migrations run.");
            setTableExists(false);
          } else {
            throw upsertError;
          }
        }
      } catch (err) {
        console.error("Failed to register session screen:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    registerScreen();

    // 2. Low-cost heartbeat sends update query to preserve session (Every 5 minutes)
    const heartbeatInterval = setInterval(async () => {
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
    }, 300000);

    // 3. Realtime Listener: Trigger user logout if their current session ID (tabId) gets deleted
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
            console.log("🔒 Screen Session Kick-out Triggered: This tab ID was evicted by Postgres database session manager.");
            setIsKicked(true);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(heartbeatInterval);
      supabase.removeChannel(screenSubscription);
    };
  }, [user?.id, tableExists]);

  const handleManualSignOut = async () => {
    try {
      await supabase.from('user_screens').delete().eq('id', tabId);
    } catch (e) { /* ignore */ }
    await supabase.auth.signOut();
    window.location.reload();
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

  if (isSyncing) {
    return null;
  }

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
              ระบบจำกัดสิทธิ์การใช้งานพร้อมกันสูงสุด <strong className="text-indigo-400 font-medium">2 หน้าจอ</strong><br />
              โดยหน้าจอนี้ได้รับการขอให้ <span className="text-rose-400 font-medium">เตะออก (Kickout)</span> เนื่องจากคุณเปิดใช้งานหน้าจออื่นเพิ่มเป็นบราวเซอร์ที่ 3
            </p>

            <div className="w-full rounded-xl bg-slate-950 p-4 mb-6 flex items-center justify-start border border-slate-800/50">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Monitor className="h-4 w-4" />
              </div>
              <div className="text-left font-mono text-xs">
                <p className="text-slate-400 font-medium">Session ID (Current Screen)</p>
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


import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import LandingPage from './components/landing/LandingPage';
import AuthPage from './components/AuthPage';
import AppRouter from './routes/AppRouter';
import PublicScriptViewer from './components/public/PublicScriptViewer';
import { TaskProvider } from './context/TaskContext';
import { GameConfigProvider } from './context/GameConfigContext';
import { MasterDataProvider } from './context/MasterDataContext';
import { GoogleDriveProvider } from './context/GoogleDriveContext';
import { WorkboxProvider } from './context/WorkboxContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChecklistProvider } from './context/ChecklistContext';
import { KPIProvider } from './context/KPIContext';
import { FinanceProvider } from './context/FinanceContext';
import { WikiProvider } from './context/WikiContext';
import { MeetingProvider } from './context/MeetingContext';
import { UserSessionProvider, useUserSession } from './context/UserSessionContext';
import { ShootQueueProvider } from './context/ShootQueueContext';
import { StorageProvider } from './context/StorageContext';
import { GlobalRealtimeSync } from './components/GlobalRealtimeSync';
import { ScreenSessionLimiter } from './components/ScreenSessionLimiter';
import PWAReloadPrompt from './components/PWAReloadPrompt';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({

  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // --- ROUTING CHECK: Magic Link (Script Share) ---
  const path = window.location.pathname;
  if (path.startsWith('/s/')) {
      const token = path.split('/s/')[1];
      if (token) {
          return <PublicScriptViewer token={token} />;
      }
  }

  // --- ROUTING CHECK: PWA Share Target Payload Capture ---
  if (path.startsWith('/share_target')) {
      const searchParams = new URLSearchParams(window.location.search);
      const title = searchParams.get('title') || '';
      const text = searchParams.get('text') || '';
      const url = searchParams.get('url') || '';
      
      localStorage.setItem('juijui_pwa_shared_ref', JSON.stringify({
          title,
          text,
          url,
          timestamp: Date.now()
      }));
      
      // Smooth replace-location to root
      window.location.replace('/');
      return null;
  }

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // --- INITIAL AUTH CHECK ---
  useEffect(() => {
    // 1. Check current session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Auth session check error:", error.message);
          // If the error is about refresh token, we should probably sign out to clear local storage
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_grant')) {
            await supabase.auth.signOut();
            setSession(null);
          }
        } else {
          setSession(session);
        }
      } catch (err: any) {
        console.error("Unexpected auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Event:', event);
      if (event === 'SIGNED_OUT') {
        setSession(null);
      } else if (session) {
        setSession(session);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  let content;
  if (loading) {
     content = (
        <div className="flex h-screen items-center justify-center bg-slate-50 flex-col">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        </div>
     );
  } else if (!session) {
    if (showLogin) {
      content = <AuthPage onLoginSuccess={() => {}} onBack={() => setShowLogin(false)} />;
    } else {
      content = <LandingPage onGoToLogin={() => setShowLogin(true)} />;
    }
  } else {
    content = (
      <QueryClientProvider client={queryClient}>
        <AuthenticatedApp user={session.user} />
      </QueryClientProvider>
    );
  }

  return (
    <>
      <PWAReloadPrompt />
      {content}
    </>
  );
}

function AuthenticatedApp({ user }: { user: any }) {
  return (
    <GoogleDriveProvider>
      <MasterDataProvider>
        <UserSessionProvider sessionUser={user}>
          <StorageProvider>
            <AuthenticatedAppInner user={user} />
          </StorageProvider>
        </UserSessionProvider>
      </MasterDataProvider>
    </GoogleDriveProvider>
  );
}

function AuthenticatedAppInner({ user }: { user: any }) {
  const { currentUserProfile, isReady } = useUserSession();

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 flex-col">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-300 animate-pulse font-medium">กำลังเตรียมข้อมูลระบบ...</p>
      </div>
    );
  }

  return (
    <NotificationProvider currentUser={currentUserProfile}>
      <WorkboxProvider currentUser={currentUserProfile}>
        <ChecklistProvider>
          <KPIProvider>
            <FinanceProvider>
              <WikiProvider>
                <GameConfigProvider>
                  <MeetingProvider>
                    <TaskProvider>
                      <ShootQueueProvider>
                        <GlobalRealtimeSync />
                        <ScreenSessionLimiter user={user} />
                        <AppRouter user={user} />
                      </ShootQueueProvider>
                    </TaskProvider>
                  </MeetingProvider>
                </GameConfigProvider>
              </WikiProvider>
            </FinanceProvider>
          </KPIProvider>
        </ChecklistProvider>
      </WorkboxProvider>
    </NotificationProvider>
  );
}

export default App;

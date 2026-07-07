
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useMasterData } from './hooks/useMasterData';
import GatekeeperOverlay from './components/layout/GatekeeperOverlay';
import { ShootQueueProvider } from './context/ShootQueueContext';
import { StorageProvider } from './context/StorageContext';
import { GlobalRealtimeSync } from './components/GlobalRealtimeSync';
import { ScreenSessionLimiter } from './components/ScreenSessionLimiter';
import { LineUserIdLinker } from './components/LineUserIdLinker';
import { LinePendingBanner } from './components/LinePendingBanner';
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
  // --- ROUTING CHECK: LINE Webhook pending user ID ---
  const queryParams = new URLSearchParams(window.location.search);
  const lineUserIdParam = queryParams.get('line_user_id');
  if (lineUserIdParam) {
    sessionStorage.setItem('pending_line_user_id', lineUserIdParam.trim());
  }

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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // --- INITIAL AUTH CHECK ---
  useEffect(() => {
    // 1. Check current session and recovery parameters
    const checkSession = async () => {
      if (window.location.hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
        setShowLogin(true);
      }

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
          // Only set standard session if we're not actively handling recovery on initial mount
          if (session && !window.location.hash.includes('type=recovery')) {
            setSession(session);
          }
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
        setIsRecoveryMode(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setShowLogin(true);
        setSession(null); // Keep standard session state null during recovery to block authenticated app view
      } else if (session) {
        // If we are currently in recovery mode, don't let the authed app load yet
        if (!isRecoveryMode) {
          setSession(session);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isRecoveryMode]);

  const handlePasswordUpdateSuccess = async () => {
    setIsRecoveryMode(false);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      setSession(currentSession);
    } else {
      setShowLogin(true);
    }
  };

  let content;
  if (loading) {
     content = (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex h-screen items-center justify-center bg-slate-50 flex-col"
        >
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        </motion.div>
     );
  } else if (isRecoveryMode) {
    content = (
      <motion.div
        key="recovery"
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.02, y: -15 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <AuthPage 
          onLoginSuccess={() => {}} 
          onPasswordUpdateSuccess={handlePasswordUpdateSuccess}
          onBack={undefined}
          initialMode="UPDATE" 
        />
      </motion.div>
    );
  } else if (!session) {
    if (showLogin) {
      content = (
        <motion.div
          key="auth"
          initial={{ opacity: 0, y: 25, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 25, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen"
        >
          <AuthPage onLoginSuccess={() => {}} onBack={() => setShowLogin(false)} />
        </motion.div>
      );
    } else {
      content = (
        <motion.div
          key="landing"
          initial={{ opacity: 0, y: -25, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -25, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <LandingPage onGoToLogin={() => setShowLogin(true)} />
        </motion.div>
      );
    }
  } else {
    content = (
      <motion.div
        key="app"
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <QueryClientProvider client={queryClient}>
          <AuthenticatedApp user={session.user} />
        </QueryClientProvider>
      </motion.div>
    );
  }

  return (
    <>
      <PWAReloadPrompt />
      {!session && <LinePendingBanner />}
      <AnimatePresence mode="wait">
        {content}
      </AnimatePresence>
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
  const { masterOptions } = useMasterData();

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 flex-col">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-300 animate-pulse font-medium">กำลังเตรียมข้อมูลระบบ...</p>
      </div>
    );
  }

  // Active policy gatekeeper check
  const activePolicy = masterOptions.find(o => o.type === 'SYSTEM_POLICY' && o.key === 'TERMS_OF_SERVICE');
  const userAcceptedVersion = currentUserProfile?.acceptedTermsVersion || 0;
  const needsPolicyAcceptance = activePolicy && activePolicy.isActive && userAcceptedVersion < (activePolicy.progressValue || 1);

  return (
    <NotificationProvider currentUser={currentUserProfile}>
      {needsPolicyAcceptance && (
        <GatekeeperOverlay activePolicy={activePolicy} userAcceptedVersion={userAcceptedVersion} />
      )}
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
                        <LineUserIdLinker />
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

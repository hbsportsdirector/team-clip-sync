
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import VideoPlayback from './pages/VideoPlayback';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { Toaster } from 'sonner';
import { supabase } from './integrations/supabase/client';

// Auth redirect handler component with improved logic to prevent redirect loops
const AuthRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleInitialAuthCheck = async () => {
      try {
        console.log("Checking authentication status on page load");
        
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          return;
        }
        
        const isAuthenticated = !!data.session;
        const isLoginPage = location.pathname === '/login';
        const isHomePage = location.pathname === '/';
        
        console.log("Auth state:", { 
          isAuthenticated,
          currentPath: location.pathname,
          hasActiveSession: !!data.session,
        });
        
        // If auth state change is due to OAuth callback, don't interfere with the flow
        const isAuthCallback = location.hash && 
          (location.hash.includes('access_token') || location.hash.includes('error'));
        
        if (isAuthCallback) {
          console.log("Detected OAuth callback, not redirecting");
          return;
        }
        
        if (isAuthenticated) {
          // Check for saved redirect path from OAuth flow
          const redirectPath = sessionStorage.getItem('redirect_after_auth');
          if (redirectPath) {
            console.log("Found saved redirect path:", redirectPath);
            sessionStorage.removeItem('redirect_after_auth');
            navigate(redirectPath, { replace: true });
            return;
          }
          
          // If authenticated and on login page, redirect to home
          if (isLoginPage) {
            console.log("Redirecting to home from login page");
            navigate('/', { replace: true });
          }
        } else {
          // If not authenticated and not on login or home page, redirect to login
          if (!isLoginPage && !isHomePage) {
            console.log("Redirecting to login page");
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error("Failed to check authentication status:", error);
      }
    };
    
    // Call the auth check function
    handleInitialAuthCheck();
  }, [location.pathname, navigate, location.hash]);
  
  return null;
};

function App() {
  // Add mobile webapp meta tag
  useEffect(() => {
    // Fix the meta tag for mobile web app capability
    const existingAppleTag = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (existingAppleTag) {
      // Add the standard mobile-web-app-capable meta tag
      if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
        const mobileWebAppMeta = document.createElement('meta');
        mobileWebAppMeta.setAttribute('name', 'mobile-web-app-capable');
        mobileWebAppMeta.setAttribute('content', 'yes');
        document.head.appendChild(mobileWebAppMeta);
      }
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <div className="min-h-screen bg-background">
            <AuthRedirectHandler />
            <Toaster 
              position="top-center" 
              toastOptions={{
                style: { 
                  borderRadius: '0.75rem',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
                }
              }} 
            />
            
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/video" element={<VideoPlayback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

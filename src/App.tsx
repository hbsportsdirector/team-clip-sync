
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

// Auth redirect handler component
const AuthRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only run this effect once on initial mount
    const handleInitialAuthCheck = async () => {
      try {
        console.log("Checking authentication status on page load");
        
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          return;
        }
        
        if (data?.session) {
          console.log("Active session found, user is authenticated");
          // If we have an active session and we're on the login page, redirect to home
          if (location.pathname === '/login') {
            console.log("Redirecting to home from login page");
            navigate('/', { replace: true });
          }
        } else {
          console.log("No active session found, user is not authenticated");
          // If we don't have a session and we're not on the login page, redirect to login
          if (location.pathname !== '/login' && location.pathname !== '/') {
            console.log("Redirecting to login page");
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error("Failed to check authentication status:", error);
      }
    };
    
    handleInitialAuthCheck();
  }, [location.pathname, navigate]);
  
  return null;
};

function App() {
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

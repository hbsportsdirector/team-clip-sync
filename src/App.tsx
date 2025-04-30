
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
    // Check if this is a redirect from OAuth (will have hash or query params)
    if (location.hash || location.search) {
      console.log("Detected potential auth redirect with params", { 
        hash: location.hash,
        search: location.search 
      });
      
      // Extract access_token from the URL if present (commonly found in hash fragment)
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        console.log("Found access_token in URL hash, might be a successful OAuth login");
      }
      
      // Handle the auth callback
      const handleAuthCallback = async () => {
        try {
          console.log("Processing auth redirect...");
          
          // Try to exchange the URL params for a session
          if (location.hash && location.hash.includes('access_token')) {
            console.log("Attempting to set session from URL hash...");
            const { data, error } = await supabase.auth.setSession({
              access_token: hashParams.get('access_token') || '',
              refresh_token: hashParams.get('refresh_token') || '',
            });
            
            if (error) {
              console.error("Error setting session from URL params:", error);
            } else if (data?.session) {
              console.log("Successfully set session from URL params");
            }
          }
          
          // Check if we have a valid session after the redirect
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error processing auth callback:", error);
            throw error;
          }
          
          if (data?.session) {
            console.log("Authentication successful, session details:", {
              user: data.session.user.email,
              expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
              provider: data.session.user.app_metadata?.provider,
              hasProviderToken: !!data.session.provider_token
            });
            navigate('/', { replace: true });
          } else {
            console.log("No session found after redirect, staying on login page");
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error("Failed to process authentication redirect:", error);
          navigate('/login', { replace: true });
        }
      };
      
      handleAuthCallback();
    }
  }, [location, navigate]);
  
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


import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import VideoPlayback from './pages/VideoPlayback';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { Toaster } from 'sonner';

// Auth redirect handler component
const AuthRedirectHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Check if this is a redirect from OAuth (will have hash or query params)
    if (location.hash || location.search) {
      console.log("Detected potential auth redirect with params", { 
        hash: location.hash,
        search: location.search 
      });
    }
  }, [location]);
  
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

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import VideoPlayback from './pages/VideoPlayback';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <div className="App">
          <Toaster position="top-center" />
          
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/video" element={<VideoPlayback />} /> {/* New route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;

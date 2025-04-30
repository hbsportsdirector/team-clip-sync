// src/pages/Login.jsx

import { supabase } from '../lib/supabase'; // adjust path if different

export default function Login() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This gives you file-level read/write access in the user's Drive:
        scopes: 'https://www.googleapis.com/auth/drive.file'
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
      <h1>Login</h1>
      <button
        onClick={handleGoogleLogin}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer',
          borderRadius: '0.25rem',
          border: '1px solid #333',
          backgroundColor: '#fff'
        }}
      >
        Sign in with Google (Drive)
      </button>
    </div>
  );
}

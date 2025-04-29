
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    name: string | null;
    email: string | null;
    picture: string | null;
  } | null;
  accessToken: string | null;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
  });

  // Mock authentication flow for now
  const login = async () => {
    try {
      // In a real implementation, we would use the Google OAuth flow
      // For now, we'll simulate a successful login
      setAuthState({
        isAuthenticated: true,
        user: {
          name: 'Demo User',
          email: 'user@example.com',
          picture: null,
        },
        accessToken: 'mock-token',
      });
      
      toast.success('Successfully logged in');
      localStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in');
    }
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
    localStorage.removeItem('isAuthenticated');
    toast.info('Logged out');
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      
      if (isAuth) {
        setAuthState({
          isAuthenticated: true,
          user: {
            name: 'Demo User',
            email: 'user@example.com',
            picture: null,
          },
          accessToken: 'mock-token',
        });
      }
    };
    
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

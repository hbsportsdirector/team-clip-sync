
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getGoogleAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true,
  });
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({
          isAuthenticated: !!session,
          user: session?.user ?? null,
          session: session,
          loading: false,
        });
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        isAuthenticated: !!session,
        user: session?.user ?? null,
        session: session,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      toast.success('Successfully logged in');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to log in');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) throw error;
      toast.success('Registration successful. Please check your email for verification.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to sign up');
      throw error;
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/drive.metadata.readonly',
          redirectTo: `${window.location.origin}/login`,
        },
      });
      
      if (error) {
        toast.error(error.message || 'Failed to log in with Google');
        throw error;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const getGoogleAccessToken = async (): Promise<string | null> => {
    try {
      if (!authState.session) {
        toast.error('You must be logged in to access Google Drive');
        return null;
      }

      // Check if the user is authenticated with Google
      if (authState.session.provider_token) {
        return authState.session.provider_token;
      } else {
        console.log('No Google provider token found, user might not be logged in with Google');
        return null;
      }
    } catch (error) {
      console.error('Error getting Google access token:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
      });
      
      toast.info('Logged out');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to log out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signUp,
        signInWithGoogle,
        logout,
        getGoogleAccessToken,
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

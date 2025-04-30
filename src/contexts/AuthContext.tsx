
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
  hasGoogleConnected: boolean;
  refreshGoogleToken: () => Promise<string | null>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true,
  });
  
  const [hasGoogleConnected, setHasGoogleConnected] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event, "Session exists:", !!session);
        console.log("Session details:", session ? {
          provider: session.user?.app_metadata?.provider,
          hasProviderToken: !!session.provider_token,
          hasAccessToken: !!session.access_token,
          user: session.user?.email,
          expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
        } : "No session");
        
        setAuthState({
          isAuthenticated: !!session,
          user: session?.user ?? null,
          session: session,
          loading: false,
        });
        
        // Check if user has Google connected
        const isGoogleConnected = !!session?.provider_token;
        setHasGoogleConnected(isGoogleConnected);
        console.log("Google connected:", isGoogleConnected);
        
        // Reset error on successful auth events
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setAuthError(null);
          if (session?.user) {
            toast.success(`Welcome, ${session.user.user_metadata.name || session.user.email}`);
          }
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          console.log("User signed out");
        }
      }
    );

    // Check for existing session
    console.log("Checking for existing session");
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Existing session check result:", !!session, "Error:", error);
      
      if (session) {
        console.log("Found session for user:", session.user?.email);
        console.log("Provider:", session.user?.app_metadata?.provider);
        console.log("Has provider token:", !!session.provider_token);
        console.log("Session expires at:", session.expires_at ? 
          new Date(session.expires_at * 1000).toISOString() : 'unknown');
      }
      
      if (error) {
        console.error("Session retrieval error:", error);
        setAuthError(error.message);
      }
      
      setAuthState({
        isAuthenticated: !!session,
        user: session?.user ?? null,
        session: session,
        loading: false,
      });
      
      // Check if user has Google connected
      setHasGoogleConnected(!!session?.provider_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      toast.success('Successfully logged in');
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message);
      toast.error(error.message || 'Failed to log in');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setAuthError(null);
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
      setAuthError(error.message);
      toast.error(error.message || 'Failed to sign up');
      throw error;
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      console.log("Starting Google sign-in process");
      
      // Log user's current URL to help with debugging redirect issues
      const currentUrl = window.location.href;
      const currentOrigin = window.location.origin;
      console.log("Current URL:", currentUrl);
      console.log("Current origin:", currentOrigin);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/drive.file',
          redirectTo: `${currentOrigin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        setAuthError(error.message);
        toast.error(error.message || 'Failed to log in with Google');
        throw error;
      }
      
      console.log("Google sign-in initiated successfully, redirecting to Google", data);
    } catch (error: any) {
      console.error('Google login error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  const refreshGoogleToken = async (): Promise<string | null> => {
    try {
      setAuthError(null);
      console.log("Attempting to refresh session");
      // Attempt to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        setAuthError(error.message);
        return null;
      }
      
      if (data.session?.provider_token) {
        console.log('Successfully refreshed Google token');
        return data.session.provider_token;
      } else {
        console.log('No provider token in refreshed session');
        setAuthError("No Google token found after refresh");
        return null;
      }
    } catch (error: any) {
      console.error('Error during token refresh:', error);
      setAuthError(error.message);
      return null;
    }
  };

  const getGoogleAccessToken = async (): Promise<string | null> => {
    try {
      if (!authState.session) {
        console.log("No session available for Google access token");
        return null;
      }

      // Check if the user is authenticated with Google
      if (authState.session.provider_token) {
        console.log('Using existing provider token');
        return authState.session.provider_token;
      } else {
        console.log('No Google provider token found, user might not be logged in with Google');
        return null;
      }
    } catch (error: any) {
      console.error('Error getting Google access token:', error);
      setAuthError(error.message);
      return null;
    }
  };

  const logout = async () => {
    try {
      setAuthError(null);
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
      setAuthError(error.message);
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
        hasGoogleConnected,
        refreshGoogleToken,
        authError,
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

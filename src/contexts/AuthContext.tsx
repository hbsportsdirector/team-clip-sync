
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  authStatus: 'initializing' | 'authenticated' | 'unauthenticated';
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
  isProcessingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true,
    authStatus: 'initializing',
  });
  
  const [hasGoogleConnected, setHasGoogleConnected] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);
  
  // Check if the current user has Google Drive permissions
  const checkGoogleDrivePermissions = useCallback((session: Session | null) => {
    // Check if user has Google connected with Drive permissions
    if (!session) {
      console.log("No session for Google Drive check");
      setHasGoogleConnected(false);
      return false;
    }
    
    const googleProvider = session.user?.app_metadata?.provider === 'google';
    const hasToken = !!session.provider_token;
    
    // Check if the token has the required scope
    let hasCorrectScope = false;
    if (googleProvider && session.user?.app_metadata?.provider_scopes) {
      const scopes = session.user.app_metadata.provider_scopes;
      hasCorrectScope = Array.isArray(scopes) && 
        scopes.includes('https://www.googleapis.com/auth/drive.file');
    }
    
    const isGoogleConnected = googleProvider && hasToken && hasCorrectScope;
    
    console.log("Google Drive check:", {
      googleProvider,
      hasToken,
      hasCorrectScope,
      isGoogleConnected,
      providerScopes: session.user?.app_metadata?.provider_scopes
    });
    
    setHasGoogleConnected(isGoogleConnected);
    return isGoogleConnected;
  }, []);
  
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event, "Session exists:", !!session);
        
        if (session) {
          console.log("Session details:", {
            provider: session.user?.app_metadata?.provider,
            hasProviderToken: !!session.provider_token,
            hasAccessToken: !!session.access_token,
            user: session.user?.email,
            expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
            scopes: session.user?.app_metadata?.provider_scopes
          });
        } else {
          console.log("No session");
        }
        
        setAuthState({
          isAuthenticated: !!session,
          user: session?.user ?? null,
          session: session,
          loading: false,
          authStatus: session ? 'authenticated' : 'unauthenticated',
        });
        
        // Check Google Drive permissions
        const isGoogleConnected = checkGoogleDrivePermissions(session);
        console.log("Google connected status:", isGoogleConnected);
        
        // Reset processing state when auth state changes
        setIsProcessingAuth(false);
        
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
          setHasGoogleConnected(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Existing session check result:", !!session, "Error:", error);
      
      if (session) {
        console.log("Found session for user:", session.user?.email);
        
        // Check Google Drive permissions
        checkGoogleDrivePermissions(session);
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
        authStatus: session ? 'authenticated' : 'unauthenticated',
      });
    });

    return () => subscription.unsubscribe();
  }, [checkGoogleDrivePermissions]);

  const login = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setIsProcessingAuth(true);
      
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
    } finally {
      // We'll let the onAuthStateChange handler reset this
      // to avoid race conditions with the state update
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setAuthError(null);
      setIsProcessingAuth(true);
      
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
    } finally {
      // We'll let the onAuthStateChange handler reset this
      // to avoid race conditions with the state update
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      setIsProcessingAuth(true);
      console.log("Starting Google sign-in process with Drive scope");
      
      // Save the redirect path if needed
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/login') {
        sessionStorage.setItem('redirect_after_auth', currentPath);
      }
      
      // Use a consistent redirect URL for all OAuth flows
      const redirectUrl = `${window.location.origin}/`;
      console.log("Using redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/drive.file',
          redirectTo: redirectUrl,
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
      
      console.log("Google sign-in initiated successfully, redirecting to Google");
    } catch (error: any) {
      console.error('Google login error:', error);
      setAuthError(error.message);
      setIsProcessingAuth(false);
      throw error;
    }
    // Don't reset processing state here - will be handled by onAuthStateChange
  };

  const refreshGoogleToken = async (): Promise<string | null> => {
    try {
      setAuthError(null);
      setIsProcessingAuth(true);
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
        
        // Update the session state after refresh
        setAuthState({
          isAuthenticated: true,
          user: data.session.user,
          session: data.session,
          loading: false,
          authStatus: 'authenticated',
        });
        
        // Check if the token has Drive permissions
        checkGoogleDrivePermissions(data.session);
        
        return data.session.provider_token;
      } else {
        console.log('No provider token in refreshed session');
        
        // If the user is authenticated with Google but no provider token,
        // they may need to re-authenticate with the correct scopes
        if (data.session?.user?.app_metadata?.provider === 'google') {
          console.log("User authenticated with Google but missing provider token. May need to re-auth.");
          // Don't set an error here to avoid confusion
        }
        
        return null;
      }
    } catch (error: any) {
      console.error('Error during token refresh:', error);
      setAuthError(error.message);
      return null;
    } finally {
      setIsProcessingAuth(false);
    }
  };

  const getGoogleAccessToken = async (): Promise<string | null> => {
    try {
      if (!authState.session) {
        console.log("No session available for Google access token");
        return null;
      }

      // Check if the user is authenticated with Google and has a provider token
      if (authState.session.provider_token) {
        console.log('Using existing provider token');
        return authState.session.provider_token;
      } else {
        console.log('No Google provider token found');
        
        // If user is logged in with Google but missing token, try a refresh
        if (authState.user?.app_metadata?.provider === 'google') {
          console.log('User logged in with Google but missing provider token. Attempting refresh...');
          return await refreshGoogleToken();
        }
        
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
      setIsProcessingAuth(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
        authStatus: 'unauthenticated',
      });
      
      setHasGoogleConnected(false);
      toast.info('Logged out');
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthError(error.message);
      toast.error(error.message || 'Failed to log out');
    } finally {
      setIsProcessingAuth(false);
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
        isProcessingAuth,
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

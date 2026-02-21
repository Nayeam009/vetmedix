import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { QueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children, queryClient }: { children: ReactNode; queryClient?: QueryClient }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT' && queryClient) {
        queryClient.clear();
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      setError(null);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName },
        },
      });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          return { 
            error: new Error('This email is already registered. Please sign in instead.'), 
            user: null 
          };
        }
        return { error: signUpError, user: null };
      }
      
      return { error: null, user: data.user };
    } catch (err) {
      return { error: err as Error, user: null };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          return { error: new Error('Invalid email or password. Please try again.') };
        }
        return { error: signInError };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      logger.error('Error signing out:', err);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        logger.error('Error refreshing session:', refreshError);
        setError(refreshError);
      } else if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (err) {
      logger.error('Error refreshing session:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    refreshSession,
    clearError,
  }), [user, session, loading, error, signUp, signIn, signOut, refreshSession, clearError]);

  return (
    <AuthContext.Provider value={value}>
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

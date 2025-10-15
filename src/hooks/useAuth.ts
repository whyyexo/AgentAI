import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, authHelpers, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  checkLimits: () => Promise<any>;
  incrementApiCalls: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await authHelpers.getUserProfile(userId);
      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const { data, error } = await authHelpers.signUp(email, password, fullName);
      
      if (error) {
        return { error };
      }

      // Profile will be created automatically by the trigger
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await authHelpers.signIn(email, password);
      
      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authHelpers.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data, error } = await authHelpers.updateProfile(updates);
      
      if (error) {
        return { error };
      }

      if (data) {
        setProfile(data);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const checkLimits = async () => {
    try {
      const { data, error } = await authHelpers.checkUserLimits();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const incrementApiCalls = async () => {
    try {
      await authHelpers.incrementApiCalls();
      // Reload profile to get updated API call count
      if (user) {
        await loadUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error incrementing API calls:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkLimits,
    incrementApiCalls,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking if user can perform actions
export function useUserLimits() {
  const { profile, checkLimits } = useAuth();
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refreshLimits = async () => {
    setLoading(true);
    try {
      const { data, error } = await checkLimits();
      if (!error && data) {
        setLimits(data[0]); // RPC returns array
      }
    } catch (error) {
      console.error('Error checking limits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      refreshLimits();
    }
  }, [profile]);

  return {
    limits,
    loading,
    refreshLimits,
    canCreateAgent: limits?.can_create_agent ?? false,
    canMakeApiCall: limits?.can_make_api_call ?? false,
    agentsCount: limits?.agents_count ?? 0,
    apiCallsUsed: limits?.api_calls_used ?? 0,
    apiCallsLimit: limits?.api_calls_limit ?? 0,
  };
}

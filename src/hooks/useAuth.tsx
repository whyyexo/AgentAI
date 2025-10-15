import { useState, useEffect, createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, authHelpers, UserProfile } from '../lib/supabase';
import { useSessionManager } from './useSessionManager';
import { useTabVisibility } from './useTabVisibility';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionManager = useSessionManager({ timeoutMs: 10000, maxRetries: 3 });
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTabVisible = useTabVisibility();
  const lastVisibilityChangeRef = useRef<number>(Date.now());

  // Fonction pour forcer l'arrêt du loading avec un timeout de sécurité
  const forceStopLoading = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Timeout de sécurité pour éviter le loading infini
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Force stopping loading state after 15 seconds');
      setLoading(false);
      setIsInitialized(true);
    }, 15000);
  }, []);

  // Fonction pour arrêter le loading proprement
  const stopLoading = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setLoading(false);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session with timeout protection
    const getInitialSession = async () => {
      try {
        forceStopLoading();
        
        // Utiliser le sessionManager sécurisé
        const hasValidSession = await sessionManager.checkAndRefreshSession();
        
        if (!isMounted) return;
        
        if (hasValidSession) {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        
        stopLoading();
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          stopLoading();
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with timeout protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        
        try {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
          
          // Ne pas changer le loading ici si c'est l'initialisation
          if (isInitialized) {
            stopLoading();
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          if (isMounted && isInitialized) {
            stopLoading();
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      sessionManager.cleanup();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [sessionManager, forceStopLoading, stopLoading, isInitialized]);

  // Vérifier la session quand l'onglet redevient visible
  useEffect(() => {
    if (isTabVisible && isInitialized && user) {
      const now = Date.now();
      // Éviter de vérifier trop souvent (minimum 5 secondes entre les vérifications)
      if (now - lastVisibilityChangeRef.current > 5000) {
        lastVisibilityChangeRef.current = now;
        console.log('Tab became visible, checking session...');
        
        // Vérifier la session en arrière-plan sans bloquer l'UI
        sessionManager.checkAndRefreshSession().then(hasValidSession => {
          if (!hasValidSession) {
            console.warn('Session invalid after tab visibility change');
            // La session n'est plus valide, l'utilisateur sera redirigé vers la page de connexion
            setUser(null);
            setProfile(null);
          }
        }).catch(error => {
          console.error('Error checking session on tab visibility change:', error);
        });
      }
    }
  }, [isTabVisible, isInitialized, user, sessionManager]);

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
      const { error } = await authHelpers.signUp(email, password, fullName);
      
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
      const { error } = await authHelpers.signIn(email, password);
      
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
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

import { useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface SessionManagerOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

export function useSessionManager(options: SessionManagerOptions = {}) {
  const { timeoutMs = 10000, maxRetries = 3 } = options;
  const isCheckingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetCheckingState = useCallback(() => {
    isCheckingRef.current = false;
    retryCountRef.current = 0;
    clearTimeout();
  }, [clearTimeout]);

  const checkAndRefreshSession = useCallback(async (): Promise<boolean> => {
    // Empêcher les appels multiples simultanés
    if (isCheckingRef.current) {
      return false;
    }

    isCheckingRef.current = true;

    try {
      // Créer une promesse avec timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Session check timeout'));
        }, timeoutMs);
      });

      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]);

      clearTimeout();

      if (error) {
        console.error('Error getting session:', error);
        
        // Retry logic
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Retrying session check (${retryCountRef.current}/${maxRetries})`);
          
          // Attendre un peu avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
          isCheckingRef.current = false;
          return checkAndRefreshSession();
        }
        
        resetCheckingState();
        return false;
      }

      // Si la session existe mais est expirée, essayer de la rafraîchir
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // Si la session expire dans moins de 5 minutes, la rafraîchir
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('Session expires soon, refreshing...');
          
          try {
            const refreshPromise = supabase.auth.refreshSession();
            const refreshTimeoutPromise = new Promise<never>((_, reject) => {
              timeoutRef.current = setTimeout(() => {
                reject(new Error('Session refresh timeout'));
              }, timeoutMs);
            });

            const { data: refreshData, error: refreshError } = await Promise.race([
              refreshPromise,
              refreshTimeoutPromise
            ]);

            clearTimeout();

            if (refreshError) {
              console.error('Error refreshing session:', refreshError);
              
              // Retry logic pour le refresh
              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                console.log(`Retrying session refresh (${retryCountRef.current}/${maxRetries})`);
                
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
                isCheckingRef.current = false;
                return checkAndRefreshSession();
              }
              
              resetCheckingState();
              return false;
            }

            console.log('Session refreshed successfully');
          } catch (refreshErr) {
            console.error('Session refresh failed:', refreshErr);
            resetCheckingState();
            return false;
          }
        }
      }

      resetCheckingState();
      return !!session;

    } catch (error) {
      console.error('Session check failed:', error);
      
      // Retry logic pour les erreurs générales
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`Retrying session check after error (${retryCountRef.current}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
        isCheckingRef.current = false;
        return checkAndRefreshSession();
      }
      
      resetCheckingState();
      return false;
    }
  }, [timeoutMs, maxRetries, clearTimeout, resetCheckingState]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current) {
      return false;
    }

    isCheckingRef.current = true;

    try {
      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Session refresh timeout'));
        }, timeoutMs);
      });

      const { data, error } = await Promise.race([
        refreshPromise,
        timeoutPromise
      ]);

      clearTimeout();

      if (error) {
        console.error('Error refreshing session:', error);
        resetCheckingState();
        return false;
      }

      console.log('Session refreshed successfully');
      resetCheckingState();
      return true;

    } catch (error) {
      console.error('Session refresh failed:', error);
      resetCheckingState();
      return false;
    }
  }, [timeoutMs, clearTimeout, resetCheckingState]);

  // Nettoyer les timeouts au démontage
  const cleanup = useCallback(() => {
    clearTimeout();
    resetCheckingState();
  }, [clearTimeout, resetCheckingState]);

  return {
    checkAndRefreshSession,
    refreshSession,
    isChecking: isCheckingRef.current,
    cleanup
  };
}

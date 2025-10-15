import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function SessionDebug() {
  const { user, loading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const updateSessionInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSessionInfo({
          hasSession: !!session,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null,
          timeUntilExpiry: session?.expires_at ? 
            Math.max(0, Math.floor((session.expires_at * 1000 - Date.now()) / 1000)) : null
        });
      } catch (error) {
        console.error('Error getting session info:', error);
      }
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 1000);

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-xs">
      <div className="font-bold mb-2">Session Debug</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.email : 'None'}</div>
      <div>Tab Visible: {isVisible ? 'Yes' : 'No'}</div>
      <div>Has Session: {sessionInfo?.hasSession ? 'Yes' : 'No'}</div>
      {sessionInfo?.expiresAt && (
        <div>Expires: {sessionInfo.expiresAt}</div>
      )}
      {sessionInfo?.timeUntilExpiry !== null && (
        <div>Time Left: {sessionInfo.timeUntilExpiry}s</div>
      )}
    </div>
  );
}

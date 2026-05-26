import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { syncOnLogin } from './cloudSync';
import { showToast } from '../components/Toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u && !syncedRef.current) {
        syncedRef.current = true;
        setSyncing(true);
        syncOnLogin().finally(() => setSyncing(false));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);

      if (event === 'SIGNED_IN' && u && !syncedRef.current) {
        syncedRef.current = true;
        setSyncing(true);
        syncOnLogin().finally(() => setSyncing(false));
      }
      if (event === 'SIGNED_OUT') {
        syncedRef.current = false;
      }
      if (event === 'TOKEN_REFRESHED' && !session) {
        showToast('セッションが切れました。再ログインしてください。', 'error');
      }
    });

    // Check for OAuth error in URL hash (e.g. user denied access)
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const errorDesc = params.get('error_description');
      if (errorDesc) {
        showToast(`ログインに失敗しました: ${decodeURIComponent(errorDesc)}`, 'error');
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const signInWithTwitter = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'x',
      options: {
        redirectTo: window.location.origin + '/settings',
      },
    });
    if (error) {
      showToast('ログインの開始に失敗しました。', 'error');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast('ログアウトに失敗しました。', 'error');
    }
  };

  return { user, loading, syncing, signInWithTwitter, signOut };
}

import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth-store';
import apiClient from '../../lib/api-client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          // Fetch user profile from NestJS backend
          const { data } = await apiClient.get('/auth/me');
          
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: data.profile.role,
            username: data.profile.username,
          });
        } catch (error) {
          console.error('Failed to fetch user profile', error);
          // If /auth/me fails, clear state
          useAuthStore.getState().logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         // Will be handled by the initAuth logic or login flow
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
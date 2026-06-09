import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth-store';
import apiClient from '../../lib/api-client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          // Fetch user profile from NestJS backend using explicit authorization token
          const { data } = await apiClient.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          
          login(session.access_token, {
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
      } else {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         // Will be handled by the initAuth logic or login flow
      } else if (event === 'SIGNED_OUT') {
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().logout();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, setLoading]);

  return <>{children}</>;
}
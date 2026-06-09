import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  username: string;
}

interface AuthState {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, role: user.role, isAuthenticated: true, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      login: (token, user) =>
        set({
          token,
          user,
          role: user.role,
          isAuthenticated: true,
          isLoading: false,
        }),
      logout: async () => {
        if (get().isAuthenticated) {
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.error('SignOut error:', err);
          }
        }
        set({
          user: null,
          role: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, role: state.role, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
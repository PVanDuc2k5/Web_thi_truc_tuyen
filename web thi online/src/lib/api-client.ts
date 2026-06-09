import axios from 'axios';
import { useAuthStore } from './auth-store';

import { supabase } from './supabase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token dynamically from Supabase
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching Supabase session for API request:', error);
  }
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
      if (window.location.pathname !== '/') {
        window.location.href = '/'; // Redirect to login
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
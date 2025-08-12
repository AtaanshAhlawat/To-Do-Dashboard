import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login, logout as apiLogout, register, refreshToken } from '../apiService';

export const useAuthStore = create(persist((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  error: null,

  // Login action
  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await login(username, password);
      set({ user: username, token: res.token, refreshToken: res.refreshToken, loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err; // Re-throw error so Auth.jsx can catch it
    }
  },

  // Register action
  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      await register(username, password);
      set({ loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err; // Re-throw error so Auth.jsx can catch it
    }
  },

  // Logout action
  logout: () => {
    apiLogout();
    set({ user: null, token: null, refreshToken: null });
  },

  // Refresh token action
  refresh: async () => {
    try {
      const res = await refreshToken();
      if (res?.token) {
        set({ token: res.token });
        return true;
      } else {
        get().logout();
        return false;
      }
    } catch {
      get().logout();
      return false;
    }
  },
}), {
  name: 'auth-storage',
  partialize: state => ({ user: state.user, token: state.token, refreshToken: state.refreshToken }),
}));

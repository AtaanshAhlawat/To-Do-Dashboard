import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login, logout as apiLogout, register, refreshToken, deleteAccount as apiDeleteAccount } from '../apiService';

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
      const newState = { user: { username }, token: res.token, refreshToken: res.refreshToken, loading: false };
      console.log('Setting auth state:', newState);
      set(newState);
      console.log('Auth state after set:', get());
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // Register action
  register: async (username, password) => {
    set({ loading: true, error: null });
    try {
      await register(username, password);
      set({ loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // Logout action
  logout: () => {
    apiLogout();
    set({ user: null, token: null, refreshToken: null });
  },

  // Delete account action
  deleteAccount: async () => {
    try {
      await apiDeleteAccount();
      apiLogout();
      set({ user: null, token: null, refreshToken: null });
      return true;
    } catch (err) {
      console.error('Delete account error:', err);
      return false;
    }
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(persist((set) => ({
  loading: false,
  error: null,
  modal: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setModal: (modal) => set({ modal }),
  clearError: () => set({ error: null }),
  clearModal: () => set({ modal: null }),
}), {
  name: 'ui-storage',
  partialize: state => ({ loading: state.loading, error: state.error, modal: state.modal }),
}));

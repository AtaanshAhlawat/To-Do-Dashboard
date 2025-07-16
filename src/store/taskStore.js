import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchTasks, addTask, updateTask, deleteTask } from '../apiService';

export const useTaskStore = create(persist((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  loadTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await fetchTasks();
      set({ tasks, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const newTask = await addTask(task);
      set({ tasks: [...get().tasks, newTask], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateTask(id, updates);
      set({ tasks: get().tasks.map(t => t._id === id ? updated : t), loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteTask(id);
      set({ tasks: get().tasks.filter(t => t._id !== id), loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  clear: () => set({ tasks: [], error: null })

}), {
  name: 'task-storage',
  partialize: state => ({ tasks: state.tasks }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchTasks, addTask as addTaskService, updateTask, deleteTask } from '../apiService';

export const useTaskStore = create(persist((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  loadTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await fetchTasks();
      set({ tasks: tasks.map(t => ({
  ...t,
  tags: Array.isArray(t.tags) ? t.tags : [],
  description: typeof t.description === 'string' ? t.description : ''
})), loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const newTask = await addTaskService({ ...task, tags: task.tags || [] });
      set({ tasks: [...get().tasks, {
  ...newTask,
  tags: Array.isArray(newTask.tags) ? newTask.tags : [],
  description: typeof newTask.description === 'string' ? newTask.description : ''
}], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateTask(id, { ...updates, tags: updates.tags || [] });
      set({ tasks: get().tasks.map(t => t._id === id ? {
  ...updated,
  tags: Array.isArray(updated.tags) ? updated.tags : [],
  description: typeof updated.description === 'string' ? updated.description : ''
} : t), loading: false });
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

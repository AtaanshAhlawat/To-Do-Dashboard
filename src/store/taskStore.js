import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fetchTasks,
  addTask as addTaskService,
  updateTask,
  deleteTask,
} from "../apiService";

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      loading: false,
      error: null,
      tags: [],
      taskStatus: {},
      taskPriorities: {},

      loadTasks: async () => {
        set({ loading: true, error: null });
        try {
          const tasks = await fetchTasks();
          const statuses = { ...get().taskStatus };
          const priorities = { ...get().taskPriorities };
          tasks.forEach((task) => {
            if (!statuses[task._id]) {
              statuses[task._id] = task.status || "Pending";
            }
            if (!priorities[task._id]) {
              priorities[task._id] = task.priority || "normal";
            }
          });
          const allTags = Array.from(
            new Set(
              tasks.flatMap((t) => (Array.isArray(t.tags) ? t.tags : [])),
            ),
          );
          const defaultTags = ["Personal", "Work", "Urgent"];
          const mergedTags = Array.from(new Set([...defaultTags, ...allTags]));

          set({
            tasks: tasks.map((t) => ({
              ...t,
              tags: Array.isArray(t.tags) ? t.tags : [],
              description:
                typeof t.description === "string" ? t.description : "",
            })),
            tags: mergedTags,
            taskStatus: statuses,
            taskPriorities: priorities,
            loading: false,
          });
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      addTask: async (task) => {
        set({ loading: true, error: null });
        try {
          const newTask = await addTaskService({
            ...task,
            tags: task.tags || [],
          });
          set({
            tasks: [
              ...get().tasks,
              {
                ...newTask,
                tags: Array.isArray(newTask.tags) ? newTask.tags : [],
                description:
                  typeof newTask.description === "string"
                    ? newTask.description
                    : "",
              },
            ],
            loading: false,
          });
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      updateTask: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          // Get the current task to preserve existing fields
          const currentTask = get().tasks.find((t) => t._id === id);

          // Don't modify tags unless explicitly provided
          const updateData = { ...updates };
          if (updateData.tags !== undefined) {
            updateData.tags = Array.isArray(updateData.tags)
              ? updateData.tags
              : [];
          }

          const updated = await updateTask(id, updateData);

          // Merge updated task with existing task to preserve fields not returned by backend
          const mergedTask = {
            ...currentTask,
            ...updated,
            tags:
              updated.tags !== undefined
                ? Array.isArray(updated.tags)
                  ? updated.tags
                  : currentTask?.tags || []
                : currentTask?.tags || [],
            description:
              updated.description !== undefined
                ? typeof updated.description === "string"
                  ? updated.description
                  : ""
                : currentTask?.description || "",
          };

          set({
            tasks: get().tasks.map((t) => (t._id === id ? mergedTask : t)),
            loading: false,
          });
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      updateTaskStatus: (taskId, status) => {
        set((state) => ({
          taskStatus: {
            ...state.taskStatus,
            [taskId]: status,
          },
        }));
      },

      updateTaskPriority: (taskId, priority) => {
        set((state) => ({
          taskPriorities: {
            ...state.taskPriorities,
            [taskId]: priority,
          },
        }));
      },

      deleteTask: async (id) => {
        set({ loading: true, error: null });
        try {
          await deleteTask(id);
          const { [id]: _, ...remainingStatuses } = get().taskStatus;
          const { [id]: __, ...remainingPriorities } = get().taskPriorities;
          set({
            tasks: get().tasks.filter((t) => t._id !== id),
            taskStatus: remainingStatuses,
            taskPriorities: remainingPriorities,
            loading: false,
          });
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      addTag: (tag) => {
        if (!tag || get().tags.includes(tag)) return;
        set((state) => ({
          tags: [...state.tags, tag],
        }));
      },

      clear: () =>
        set({
          tasks: [],
          error: null,
          tags: ["Personal", "Work", "Urgent"],
          taskStatus: {},
          taskPriorities: {},
        }),
    }),
    {
      name: "task-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        tags: state.tags,
        taskStatus: state.taskStatus,
        taskPriorities: state.taskPriorities,
      }),
    },
  ),
);

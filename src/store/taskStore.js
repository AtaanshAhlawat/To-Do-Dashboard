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
      // Filtering and sorting state
      sortConfig: null, // { column: 'task', direction: 'asc' }
      filters: {}, // { task: { type: 'text', value: 'search' }, status: { type: 'multiselect', selected: ['Pending'] } }

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
          sortConfig: null,
          filters: {},
        }),

      // Sorting functions
      setSortConfig: (column, direction) => {
        set({ sortConfig: { column, direction } });
      },

      clearSort: () => {
        set({ sortConfig: null });
      },

      // Filtering functions
      setFilter: (column, filterConfig) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [column]: filterConfig
          }
        }));
      },

      clearFilter: (column) => {
        set((state) => {
          const newFilters = { ...state.filters };
          delete newFilters[column];
          return { filters: newFilters };
        });
      },

      clearAllFilters: () => {
        set({ filters: {}, sortConfig: null });
      },

      // Get filtered and sorted tasks
      getFilteredAndSortedTasks: () => {
        const { tasks, taskStatus, taskPriorities, filters, sortConfig } = get();
        let filteredTasks = [...tasks];

        // Apply filters
        Object.entries(filters).forEach(([column, filterConfig]) => {
          if (!filterConfig) return;

          switch (column) {
            case 'task':
              if (filterConfig.type === 'text' && filterConfig.value) {
                const searchTerm = filterConfig.value.toLowerCase();
                filteredTasks = filteredTasks.filter(task =>
                  task.text?.toLowerCase().includes(searchTerm) ||
                  task.description?.toLowerCase().includes(searchTerm)
                );
              }
              break;

            case 'status':
              if (filterConfig.type === 'multiselect' && filterConfig.selected?.length > 0) {
                filteredTasks = filteredTasks.filter(task => {
                  const status = taskStatus[task._id] || 'Pending';
                  return filterConfig.selected.includes(status);
                });
              }
              break;

            case 'priority':
              if (filterConfig.type === 'multiselect' && filterConfig.selected?.length > 0) {
                filteredTasks = filteredTasks.filter(task => {
                  const priority = taskPriorities[task._id] || task.priority || 'normal';
                  return filterConfig.selected.includes(priority);
                });
              }
              break;

            case 'tags':
              if (filterConfig.type === 'multiselect' && filterConfig.selected?.length > 0) {
                filteredTasks = filteredTasks.filter(task => {
                  const taskTags = Array.isArray(task.tags) ? task.tags : [];
                  return filterConfig.selected.some(selectedTag => taskTags.includes(selectedTag));
                });
              }
              break;

            case 'created':
              if (filterConfig.type === 'text' && filterConfig.value) {
                const searchTerm = filterConfig.value.toLowerCase();
                filteredTasks = filteredTasks.filter(task => {
                  const date = new Date(task.created);
                  const dateString = date.toLocaleDateString().toLowerCase();
                  const timeString = date.toLocaleTimeString().toLowerCase();
                  return dateString.includes(searchTerm) || timeString.includes(searchTerm);
                });
              }
              break;
          }
        });

        // Apply sorting
        if (sortConfig) {
          filteredTasks.sort((a, b) => {
            let aValue, bValue;

            switch (sortConfig.column) {
              case 'task':
                aValue = a.text?.toLowerCase() || '';
                bValue = b.text?.toLowerCase() || '';
                break;

              case 'status':
                const statusOrder = { 'Pending': 0, 'In Progress': 1, 'Completed': 2, 'Rejected': 3 };
                aValue = statusOrder[taskStatus[a._id] || 'Pending'] ?? 0;
                bValue = statusOrder[taskStatus[b._id] || 'Pending'] ?? 0;
                break;

              case 'priority':
                const priorityOrder = { 'low': 0, 'normal': 1, 'high': 2 };
                const aPriority = taskPriorities[a._id] || a.priority || 'normal';
                const bPriority = taskPriorities[b._id] || b.priority || 'normal';
                aValue = priorityOrder[aPriority] ?? 1;
                bValue = priorityOrder[bPriority] ?? 1;
                break;

              case 'tags':
                aValue = (Array.isArray(a.tags) ? a.tags : []).join(', ').toLowerCase();
                bValue = (Array.isArray(b.tags) ? b.tags : []).join(', ').toLowerCase();
                break;

              case 'created':
                aValue = new Date(a.created).getTime();
                bValue = new Date(b.created).getTime();
                break;

              default:
                return 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return sortConfig.direction === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }

            if (sortConfig.direction === 'asc') {
              return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
              return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
          });
        }

        return filteredTasks;
      }
    }),
    {
      name: "task-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        tags: state.tags,
        taskStatus: state.taskStatus,
        taskPriorities: state.taskPriorities,
        sortConfig: state.sortConfig,
        filters: state.filters,
      }),
    },
  ),
);

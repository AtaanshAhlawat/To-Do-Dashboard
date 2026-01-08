import { useEffect, useState } from "react";
import { useTaskStore } from "../store/taskStore";
import { useUIStore } from "../store/uiStore";
import { TASK_STATUS } from "../constants/taskConstants";

/**
 * Custom hook for task management
 */
export const useTasks = () => {
  const {
    tasks,
    loadTasks,
    addTask: addTaskStore,
    updateTask: updateTaskStore,
    deleteTask: deleteTaskStore,
    loading: tasksLoading,
    tags,
    addTag: addTagToStore,
    taskStatus,
    taskPriorities,
    updateTaskStatus: updateTaskStatusStore,
    updateTaskPriority: updateTaskPriorityStore,
    sortConfig,
    filters,
    setSortConfig,
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilteredAndSortedTasks,
  } = useTaskStore();

  const { setError: setUIError } = useUIStore();

  // Update task status in the backend
  const updateTaskStatus = async (taskId, status) => {
    try {
      await updateTaskStore(taskId, { status });
      updateTaskStatusStore(taskId, status);
    } catch (error) {
      console.error("Error updating task status:", error);
      setUIError("Failed to update task status");
    }
  };

  // Toggle task status
  const toggleTaskStatus = (taskId) => {
    const currentStatus = taskStatus[taskId] || TASK_STATUS.PENDING;
    let newStatus;

    switch (currentStatus) {
      case TASK_STATUS.PENDING:
        newStatus = TASK_STATUS.IN_PROGRESS;
        break;
      case TASK_STATUS.IN_PROGRESS:
        newStatus = TASK_STATUS.COMPLETED;
        break;
      case TASK_STATUS.COMPLETED:
        newStatus = TASK_STATUS.REJECTED;
        break;
      default:
        newStatus = TASK_STATUS.PENDING;
    }

    updateTaskStatus(taskId, newStatus);
  };

  // Update task priority in the backend
  const updateTaskPriority = async (taskId, priority) => {
    try {
      await updateTaskStore(taskId, { priority });
      updateTaskPriorityStore(taskId, priority);
    } catch (error) {
      console.error("Error updating task priority:", error);
      setUIError("Failed to update task priority");
    }
  };

  // Toggle task priority
  const toggleTaskPriority = (taskId) => {
    const currentPriority = taskPriorities[taskId] || "normal";
    let newPriority;

    switch (currentPriority) {
      case "low":
        newPriority = "normal";
        break;
      case "normal":
        newPriority = "high";
        break;
      case "high":
        newPriority = "low";
        break;
      default:
        newPriority = "normal";
    }

    updateTaskPriority(taskId, newPriority);
  };

  // Toggle tag for a task
  const toggleTaskTag = (taskId, tag) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const currentTags = Array.isArray(task.tags) ? [...task.tags] : [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    updateTaskStore(taskId, { tags: newTags });
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    await deleteTaskStore(id);
  };

  return {
    tasks,
    loadTasks,
    addTask: addTaskStore,
    updateTask: updateTaskStore,
    deleteTask: handleDeleteTask,
    tasksLoading,
    tags,
    addTag: addTagToStore,
    taskStatus,
    taskPriorities,
    toggleTaskStatus,
    toggleTaskPriority,
    toggleTaskTag,
    sortConfig,
    filters,
    setSortConfig,
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilteredAndSortedTasks,
  };
};

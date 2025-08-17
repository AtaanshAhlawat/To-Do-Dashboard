import { useState, useEffect, useRef, useCallback } from "react";
import Auth from "./Auth";
import {
  Trash2,
  Edit2,
  Plus,
  Check,
  X,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuthStore } from "./store/authStore";
import { useTaskStore } from "./store/taskStore";
import { useUIStore } from "./store/uiStore";

// Status options for tasks
const TASK_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

// Status colors for UI
const STATUS_COLORS = {
  [TASK_STATUS.PENDING]: "#f59e0b",
  [TASK_STATUS.IN_PROGRESS]: "#3b82f6",
  [TASK_STATUS.COMPLETED]: "#10b981",
  [TASK_STATUS.REJECTED]: "#ef4444",
};

function App() {
  // Zustand stores
  const { user, token, logout, deleteAccount } = useAuthStore();
  const {
    tasks = [], // Provide default empty array
    loadTasks,
    addTask: addTaskStore,
    updateTask: updateTaskStore,
    deleteTask: deleteTaskStore,
    loading: tasksLoading,
    error: tasksError,
    clear: clearTasks,
  } = useTaskStore();
  const {
    loading: uiLoading,
    error: uiError,
    setError: setUIError,
  } = useUIStore();

  // Local UI state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const profileMenuRef = useRef(null);
  const tagFilterRef = useRef(null);
  const [tagFilter, setTagFilter] = useState([]);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Form state
  const [newTask, setNewTask] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [tags, setTags] = useState(["Personal", "Work", "Urgent"]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingTags, setEditingTags] = useState([]);
  const [editingDeadline, setEditingDeadline] = useState("");
  const [editingPriority, setEditingPriority] = useState("normal");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState({});
  const [showTagDropdown, setShowTagDropdown] = useState(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [showTaskMenu, setShowTaskMenu] = useState(null);
  const [taskOrder, setTaskOrder] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);

  // Auto-fix: clear old persisted data if schema is wrong
  useEffect(() => {
    try {
      const persisted = localStorage.getItem("task-storage");
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (
          parsed &&
          Array.isArray(parsed.tasks) &&
          parsed.tasks.some((t) => t.category && !t.tags)
        ) {
          localStorage.clear();
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error checking persisted data:", error);
    }
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const toggleTagFilter = useCallback((tag) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    setDeletingAccount(true);
    try {
      const success = await deleteAccount();
      if (success) {
        setUIError("Account deleted successfully");
      } else {
        setUIError("Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setUIError("Failed to delete account. Please try again.");
    } finally {
      setDeletingAccount(false);
    }
  }, [deleteAccount, setUIError]);

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return;
    
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  // Close tag filter dropdown when clicking outside
  useEffect(() => {
    if (!showTagFilter) return;
    
    const handleClickOutside = (e) => {
      if (tagFilterRef.current && !tagFilterRef.current.contains(e.target)) {
        setShowTagFilter(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTagFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if clicking outside tag dropdown
      if (
        showTagDropdown &&
        !e.target.closest("[data-tag-dropdown]") &&
        !e.target.closest("[data-tag-button]")
      ) {
        setShowTagDropdown(null);
      }
      // Check if clicking outside task menu
      if (
        showTaskMenu &&
        !e.target.closest("[data-task-menu]") &&
        !e.target.closest("[data-menu-button]")
      ) {
        setShowTaskMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTagDropdown, showTaskMenu]);

  // Load tasks on mount if logged in
  useEffect(() => {
    if (token && loadTasks) {
      loadTasks().catch(error => {
        console.error("Error loading tasks:", error);
        setUIError("Failed to load tasks");
      });
    }
  }, [token, loadTasks, setUIError]);

  // Initialize task statuses when tasks are loaded
  useEffect(() => {
    if (tasks.length === 0) return;
    
    const statuses = {};
    let hasChanges = false;
    
    tasks.forEach((task) => {
      if (task._id && !taskStatus[task._id]) {
        statuses[task._id] = task.status || TASK_STATUS.PENDING;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setTaskStatus((prev) => ({ ...prev, ...statuses }));
    }
  }, [tasks, taskStatus]);

  // Initialize task order
  useEffect(() => {
    if (tasks.length > 0 && taskOrder.length === 0) {
      setTaskOrder(tasks.map((task) => task._id).filter(Boolean));
    }
  }, [tasks, taskOrder]);

  // Update task status in the backend
  const updateTaskStatus = useCallback(async (taskId, status) => {
    if (!taskId || !status) return;
    
    try {
      await updateTaskStore(taskId, { status });
      setTaskStatus((prev) => ({
        ...prev,
        [taskId]: status,
      }));
    } catch (error) {
      console.error("Error updating task status:", error);
      setUIError("Failed to update task status");
    }
  }, [updateTaskStore, setUIError]);

  // Toggle task status
  const toggleTaskStatus = useCallback((taskId) => {
    if (!taskId) return;
    
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
  }, [taskStatus, updateTaskStatus]);

  // Toggle task priority
  const toggleTaskPriority = useCallback(async (taskId) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const currentPriority = task.priority || "normal";
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

    try {
      await updateTaskStore(taskId, { priority: newPriority });
    } catch (error) {
      console.error("Error updating task priority:", error);
      setUIError("Failed to update task priority");
    }
  }, [tasks, updateTaskStore, setUIError]);

  // Format date to 'Tue Aug 12 6:24 PM' format
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "No date";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      
      const options = {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      return date.toLocaleString("en-US", options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  }, []);

  // Toggle tag for a task
  const toggleTaskTag = useCallback(async (taskId, tag) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const currentTags = Array.isArray(task.tags) ? [...task.tags] : [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    try {
      await updateTaskStore(taskId, { tags: newTags });
    } catch (error) {
      console.error("Error updating task tags:", error);
      setUIError("Failed to update task tags");
    }
  }, [tasks, updateTaskStore, setUIError]);

  // Update tags list when tasks change
  useEffect(() => {
    if (!Array.isArray(tasks)) return;
    
    const allTags = tasks
      .flatMap((t) => (Array.isArray(t.tags) ? t.tags : []))
      .filter(Boolean);
    const uniqueTags = Array.from(new Set(allTags));
    const defaultTags = ["Personal", "Work", "Urgent"];
    const merged = Array.from(new Set([...defaultTags, ...uniqueTags]));
    
    setTags(merged);
  }, [tasks]);

  // Delete from backend
  const handleDeleteTask = useCallback(async (id) => {
    if (!id) return;
    
    try {
      await deleteTaskStore(id);
      // Remove from task order
      setTaskOrder(prev => prev.filter(taskId => taskId !== id));
      // Remove from task status
      setTaskStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[id];
        return newStatus;
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      setUIError("Failed to delete task");
    }
  }, [deleteTaskStore, setUIError]);

  // Start editing
  const handleEditClick = useCallback((task) => {
    if (!task) return;
    
    setEditingId(task._id);
    setEditingText(task.text || "");
    setEditingDescription(task.description || "");
    setEditingTags([...(Array.isArray(task.tags) ? task.tags : [])]);
    setEditingDeadline(task.deadline || "");
    setEditingPriority(task.priority || "normal");
    setShowAdd(true);
  }, []);

  // Handle save task (create or update)
  const handleSaveTask = useCallback(async (e) => {
    e.preventDefault();

    if (editingId) {
      // Editing existing task
      if (!editingText.trim()) return;

      const taskData = {
        text: editingText.trim(),
        description: editingDescription.trim(),
        tags: editingTags,
        deadline: editingDeadline,
        priority: editingPriority,
      };

      try {
        await updateTaskStore(editingId, taskData);
        
        // Reset form and close modal
        setEditingId(null);
        setEditingText("");
        setEditingDescription("");
        setEditingTags([]);
        setEditingDeadline("");
        setEditingPriority("normal");
        setShowAdd(false);
      } catch (error) {
        console.error("Error updating task:", error);
        setUIError("Failed to update task. Please try again.");
      }
    } else {
      // Creating new task
      if (!newTask.trim()) return;

      const taskData = {
        text: newTask.trim(),
        description: newDescription.trim(),
        tags: selectedTags,
        deadline: newDeadline,
        priority: newPriority,
      };

      try {
        const createdTask = await addTaskStore(taskData);

        // Add new task to order at the top
        if (createdTask && createdTask._id) {
          setTaskOrder((prev) => [createdTask._id, ...prev]);
        }

        // Reset form and close modal
        setNewTask("");
        setNewDescription("");
        setSelectedTags([]);
        setNewDeadline("");
        setNewPriority("normal");
        setShowAdd(false);
      } catch (error) {
        console.error("Error creating task:", error);
        setUIError("Failed to create task. Please try again.");
      }
    }
  }, [
    editingId, editingText, editingDescription, editingTags, editingDeadline, 
    editingPriority, newTask, newDescription, selectedTags, newDeadline, 
    newPriority, updateTaskStore, addTaskStore, setUIError
  ]);

  const handleAddTag = useCallback((e) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  }, [newTag, tags]);

  const handleRemoveTag = useCallback((index) => {
    if (editingId) {
      setEditingTags(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedTags(prev => prev.filter((_, i) => i !== index));
    }
  }, [editingId]);

  const handleCloseModal = useCallback(() => {
    setModalClosing(true);
    setShowTagSelector(false);
    
    setTimeout(() => {
      setShowAdd(false);
      setModalClosing(false);
      
      if (editingId) {
        // Reset editing state
        setEditingId(null);
        setEditingText("");
        setEditingDescription("");
        setEditingTags([]);
        setEditingDeadline("");
        setEditingPriority("normal");
      } else {
        // Reset adding state
        setNewTask("");
        setNewDescription("");
        setSelectedTags([]);
        setNewDeadline("");
        setNewPriority("normal");
      }
    }, 200);
  }, [editingId]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, taskId) => {
    if (!taskId) return;
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e, taskId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTask(taskId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTask(null);
    }
  }, []);

  const handleDrop = useCallback((e, targetTaskId) => {
    e.preventDefault();

    if (!draggedTask || draggedTask === targetTaskId) {
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    setTaskOrder(prev => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedTask);
      const targetIndex = newOrder.indexOf(targetTaskId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return prev;
      }

      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedTask);

      return newOrder;
    });
    
    setDraggedTask(null);
    setDragOverTask(null);
  }, [draggedTask]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverTask(null);
  }, []);

  // Filter tasks with error handling
  const filteredTasks = tasks
    .filter((task) => {
      if (!task) return false;
      
      try {
        // Apply search filter
        const searchMatch =
          !search ||
          task.text?.toLowerCase().includes(search.toLowerCase()) ||
          task.description?.toLowerCase().includes(search.toLowerCase()) ||
          (Array.isArray(task.tags) && task.tags.some((tag) =>
            tag?.toLowerCase().includes(search.toLowerCase())
          ));

        // Apply tag filter
        const tagMatch =
          tagFilter.length === 0 ||
          (Array.isArray(task.tags) &&
            tagFilter.every((filterTag) => task.tags.includes(filterTag)));

        return searchMatch && tagMatch;
      } catch (error) {
        console.error("Error filtering task:", error, task);
        return false;
      }
    })
    .sort((a, b) => {
      const indexA = taskOrder.indexOf(a._id);
      const indexB = taskOrder.indexOf(b._id);
      return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
    });

  // Color variables
  const blue = "#2563eb";
  const blueLight = "#3b82f6";
  const blueGradient = `linear-gradient(90deg, ${blue} 60%, ${blueLight} 100%)`;
  const blueShadow = "0 2px 12px #2563eb33";

  // Handle body overflow with cleanup
  useEffect(() => {
    if (showAdd) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showAdd]);

  // Debug logging (remove in production)
  console.log("Auth check - Token:", !!token);
  console.log("Auth check - User:", !!user);

  if (!token) {
    console.log("No token found, rendering Auth component");
    return <Auth onAuth={loadTasks} />;
  }

  return (
    <>
      {/* Rest of your JSX remains the same, but with the handlers updated */}
      {/* ... rest of the component */}
    </>
  );
}

export default App;
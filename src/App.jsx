import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  // Auto-fix: clear old persisted data if schema is wrong
  useEffect(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem("task-storage"));
      if (
        persisted &&
        Array.isArray(persisted.tasks) &&
        persisted.tasks.some((t) => t.category && !t.tags)
      ) {
        localStorage.clear();
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to parse persisted tasks", e);
    }
  }, []);

  // Zustand stores
  const { user, token, logout, deleteAccount } = useAuthStore();
  const {
    tasks,
    loadTasks,
    addTask: addTaskStore,
    updateTask: updateTaskStore,
    deleteTask: deleteTaskStore,
    loading: tasksLoading
  } = useTaskStore();
  const { setError: setUIError } = useUIStore();

  // Local UI state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const profileMenuRef = useRef(null);
  const tagFilterRef = useRef(null);
  const [tagFilter, setTagFilter] = useState([]); // Multi-tag filter
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Toggle tag in filter
  const toggleTagFilter = (tag) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const success = await deleteAccount();
      if (success) {
        // Account deleted successfully, user is already logged out
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
  };

  // User menu toggle

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClick(e) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfileMenu]);

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
  const [taskStatus, setTaskStatus] = useState({}); // { taskId: status }
  const [taskPriorities, setTaskPriorities] = useState({}); // { taskId: priority }
  const [showTagDropdown, setShowTagDropdown] = useState(null); // taskId or null
  const leaveTimeout = useRef(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [showTaskMenu, setShowTaskMenu] = useState(null); // taskId or null
  const [taskOrder, setTaskOrder] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
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
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTagDropdown, showTaskMenu]);

  // Close tag filter dropdown when clicking outside
  useEffect(() => {
    if (!showTagFilter) return;
    function handleClick(e) {
      if (tagFilterRef.current && !tagFilterRef.current.contains(e.target)) {
        setShowTagFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTagFilter]);

  // Load tasks on mount if logged in
  useEffect(() => {
    if (token) loadTasks();
  }, [token, loadTasks]);

  // Initialize task statuses when tasks are loaded
  useEffect(() => {
    const statuses = {};
    tasks.forEach((task) => {
      if (!taskStatus[task._id]) {
        statuses[task._id] = task.status || TASK_STATUS.PENDING;
      }
    });
    setTaskStatus((prev) => ({ ...prev, ...statuses }));
  }, [tasks, taskStatus]);

  // Initialize task priorities when tasks are loaded
  useEffect(() => {
    const priorities = {};
    tasks.forEach((task) => {
      if (!taskPriorities[task._id]) {
        priorities[task._id] = task.priority || "normal";
      }
    });
    setTaskPriorities((prev) => ({ ...prev, ...priorities }));
  }, [tasks, taskPriorities]);

  // Initialize task order
  useEffect(() => {
    if (tasks.length > 0 && taskOrder.length === 0) {
      setTaskOrder(tasks.map((task) => task._id));
    }
  }, [tasks, taskOrder]);

  // Update task status in the backend
  const updateTaskStatus = async (taskId, status) => {
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
      setTaskPriorities((prev) => ({
        ...prev,
        [taskId]: priority,
      }));
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

  // Format date to 'Tue Aug 12 6:24 PM' format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
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

  // Always sync tag list with all unique tags from tasks
  useEffect(() => {
    const allTags = Array.from(
      new Set(tasks.flatMap((t) => (Array.isArray(t.tags) ? t.tags : []))),
    );
    const defaultTags = ["Personal", "Work", "Urgent"];
    const merged = Array.from(new Set([...defaultTags, ...allTags]));
    setTags(merged);
  }, [tasks]);

  // Toggle completion in backend

  // Delete from backend
  const handleDeleteTask = async (id) => {
    await deleteTaskStore(id);
  };

  // Start editing
  const handleEditClick = (task) => {
    setEditingId(task._id);
    setEditingText(task.text);
    setEditingDescription(task.description || "");
    setEditingTags([...(task.tags || [])]);
    setEditingDeadline(task.deadline || "");
    setEditingPriority(task.priority || "normal");
    setShowAdd(true);
  };

  // Handle save task (create or update)
  const handleSaveTask = async (e) => {
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
  };


  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (index) => {
    if (editingId) {
      setEditingTags(editingTags.filter((_, i) => i !== index));
    } else {
      setSelectedTags(selectedTags.filter((_, i) => i !== index));
    }
  };

  const handleCloseModal = () => {
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
  };


  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
  };

  const handleDragOver = (e, taskId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTask(taskId);
  };

  const handleDragLeave = (e) => {
    // Only clear drag over if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTask(null);
    }
  };

  const handleDrop = (e, targetTaskId) => {
    e.preventDefault();

    if (!draggedTask || draggedTask === targetTaskId) {
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    const newOrder = [...taskOrder];
    const draggedIndex = newOrder.indexOf(draggedTask);
    const targetIndex = newOrder.indexOf(targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTask);

    setTaskOrder(newOrder);
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const filteredTasks = tasks
    .filter((task) => {
      // Apply search filter
      const searchMatch =
        search === "" ||
        task.text?.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase()) ||
        task.tags?.some((tag) =>
          tag.toLowerCase().includes(search.toLowerCase()),
        );

      // Apply tag filter
      const tagMatch =
        tagFilter.length === 0 ||
        (task.tags &&
          tagFilter.every((filterTag) => task.tags.includes(filterTag)));

      return searchMatch && tagMatch;
    })
    .sort((a, b) => {
      const indexA = taskOrder.indexOf(a._id);
      const indexB = taskOrder.indexOf(b._id);
      return indexA - indexB;
    });

  // Color variables
  const blue = "#2563eb";
  const blueLight = "#3b82f6";
  const blueGradient = `linear-gradient(90deg, ${blue} 60%, ${blueLight} 100%)`;
  const blueShadow = "0 2px 12px #2563eb33";

  useEffect(() => {
    if (showAdd) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAdd]);

  console.log("Auth check - Token:", token);
  console.log("Auth check - User:", user);
  console.log("Auth check - Token type:", typeof token);
  console.log("Auth check - User type:", typeof user);

  if (!token) {
    console.log("No token found, rendering Auth component");
    return <Auth onAuth={loadTasks} />;
  }

  return (
    <>

      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: "#f5faff",
          padding: "2rem 1rem",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "min(1200px, 90vw)",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* Header with Search, Filter, and Profile */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {/* Search and Filter Controls */}
            <div style={{ display: "flex", gap: "1rem", flex: 1 }}>
              <input
                type="text"
                placeholder="Search for task..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  fontSize: "1rem",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.75rem",
                  flex: 1,
                  border: `2px solid #e2e8f0`,
                  background: "#fff",
                  boxSizing: "border-box",
                  minWidth: "200px",
                }}
              />
              <div style={{ position: "relative" }} ref={tagFilterRef}>
                <button
                  onClick={() => setShowTagFilter(!showTagFilter)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "#fff",
                    border: `2px solid #e2e8f0`,
                    borderRadius: "0.75rem",
                    padding: "0 1rem",
                    height: "100%",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 6V3M7 3H3M7 3L12.2 12.6M21 3H11M21 12H15M21 21H12.6M3 3H7M3 12H7M3 21H10.2M10.2 21C10.2 21.9941 9.39411 22.8 8.4 22.8C7.40589 22.8 6.6 21.9941 6.6 21C6.6 20.0059 7.40589 19.2 8.4 19.2C9.39411 19.2 10.2 20.0059 10.2 21ZM17.4 12C17.4 12.9941 16.5941 13.8 15.6 13.8C14.6059 13.8 13.8 12.9941 13.8 12C13.8 11.0059 14.6059 10.2 15.6 10.2C16.5941 10.2 17.4 11.0059 17.4 12ZM7 6C7 6.99411 6.19411 7.8 5.2 7.8C4.20589 7.8 3.4 6.99411 3.4 6C3.4 5.00589 4.20589 4.2 5.2 4.2C6.19411 4.2 7 5.00589 7 6Z"
                      stroke={blue}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span style={{ whiteSpace: "nowrap" }}>Filter by Tag</span>
                  {tagFilter.length > 0 && (
                    <span
                      style={{
                        background: blue,
                        color: "white",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        padding: "0.1rem 0.5rem",
                        marginLeft: "0.25rem",
                      }}
                    >
                      {tagFilter.length}
                    </span>
                  )}
                </button>

                {showTagFilter && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "0.5rem",
                      background: "#fff",
                      borderRadius: "0.75rem",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      padding: "0.75rem",
                      minWidth: "200px",
                      zIndex: 1001, // Higher z-index
                      border: "1px solid #f1f5f9",
                      maxHeight: "300px",
                      overflowY: "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                        paddingBottom: "0.5rem",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        Filter by Tag
                      </span>
                      {tagFilter.length > 0 && (
                        <button
                          onClick={() => setTagFilter([])}
                          style={{
                            background: "none",
                            border: "none",
                            color: blue,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "none";
                          }}
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        margin: "0 -0.5rem",
                      }}
                    >
                      {Array.from(
                        new Set(tasks.flatMap((task) => task.tags || [])),
                      ).length > 0 ? (
                        Array.from(
                          new Set(tasks.flatMap((task) => task.tags || [])),
                        ).map((tag, index) => (
                          <div
                            key={index}
                            onClick={() => toggleTagFilter(tag)}
                            style={{
                              fontSize: "0.85rem",
                              color: "#64748b",
                              padding: "0.5rem 0.75rem",
                              margin: "0.25rem",
                              borderRadius: "0.5rem",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              backgroundColor: tagFilter.includes(tag)
                                ? "#e0f2fe"
                                : "transparent",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                tagFilter.includes(tag)
                                  ? "#bae6fd"
                                  : "#f8fafc")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                tagFilter.includes(tag)
                                  ? "#e0f2fe"
                                  : "transparent")
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={tagFilter.includes(tag)}
                                readOnly
                                style={{
                                  width: "1rem",
                                  height: "1rem",
                                  cursor: "pointer",
                                  accentColor: "#3b82f6",
                                }}
                              />
                              <span>{tag}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            color: "#94a3b8",
                            padding: "1rem",
                            fontSize: "0.9rem",
                          }}
                        >
                          No tags found
                        </div>
                      )}
                    </div>

                    {tagFilter.length > 0 && (
                      <button
                        onClick={() => setTagFilter([])}
                        style={{
                          width: "100%",
                          marginTop: "0.75rem",
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          color: "#475569",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Icon */}
            {user && (
              <div style={{ position: "relative" }}>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.5rem",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => setShowProfileMenu((v) => !v)}
                  aria-label="Profile menu"
                >
                  <User size={24} color="#18192b" />
                </button>
                {showProfileMenu && (
                  <div
                    ref={profileMenuRef}
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "0.5rem",
                      background: "#fff",
                      boxShadow: "0 2px 12px #0001",
                      borderRadius: 12,
                      padding: "1rem",
                      minWidth: 200,
                      zIndex: 1001, // Higher z-index
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.5rem 0",
                        borderBottom: "1px solid #f1f5f9",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "#64748b",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Signed in as
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          color: "#1e293b",
                        }}
                      >
                        {user.username || "User"}
                      </div>
                    </div>

                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        padding: "0.6rem 0.5rem",
                        borderRadius: "6px",
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.color = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.color = "#64748b";
                      }}
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 17L21 12L16 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 12H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Sign out
                    </button>

                    <div
                      style={{
                        height: "1px",
                        background: "#f1f5f9",
                        margin: "0.5rem 0",
                      }}
                    ></div>

                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        padding: "0.6rem 0.5rem",
                        borderRadius: "6px",
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowDeleteAccountModal(true);
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Delete account
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          {tasksLoading ? (
            <div style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>
          ) : filteredTasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                margin: "4rem 0",
                padding: "3rem",
                background: "#fff",
                borderRadius: "1.5rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: blue,
                  marginBottom: "1rem",
                }}
              >
                You don't have any tasks yet
              </h3>
              <p style={{ color: "#666", fontSize: "1.2rem" }}>
                Click on the <strong>+</strong> button to add one
              </p>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                background: "#fff",
                borderRadius: "1rem",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "800px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: blueGradient,
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.1)",
                    }}
                  >
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem 1.5rem",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Task
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem 1.5rem",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "120px",
                      }}
                    >
                      Priority
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem 1.5rem",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        minWidth: "200px",
                      }}
                    >
                      Tags
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem 1.5rem",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "160px",
                      }}
                    >
                      Created
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem 1.5rem",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        minWidth: "140px",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "1rem 1.5rem",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "120px",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const status = taskStatus[task._id] || TASK_STATUS.PENDING;
                    const statusColor = STATUS_COLORS[status] || "#64748b";
                    const priority =
                      taskPriorities[task._id] || task.priority || "normal";
                    const priorityColors = {
                      high: {
                        bg: "#fef3c7",
                        color: "#f59e0b",
                        border: "#f59e0b",
                      },
                      normal: {
                        bg: "#e0f2fe",
                        color: "#0369a1",
                        border: "#0369a1",
                      },
                      low: {
                        bg: "#f0fdf4",
                        color: "#16a34a",
                        border: "#16a34a",
                      },
                    };
                    const priorityColor =
                      priorityColors[priority] || priorityColors.normal;

                    return (
                      <tr
                        key={task._id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onDragOver={(e) => handleDragOver(e, task._id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, task._id)}
                        onDragEnd={handleDragEnd}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "all 0.2s",
                          background:
                            dragOverTask === task._id
                              ? "#e0f2fe"
                              : draggedTask === task._id
                                ? "#f1f5f9"
                                : "transparent",
                          cursor: "move",
                        }}
                        onMouseEnter={(e) => {
                          clearTimeout(leaveTimeout.current);
                          if (
                            draggedTask !== task._id &&
                            !showTaskMenu &&
                            !showTagDropdown
                          ) {
                            e.currentTarget.style.background =
                              dragOverTask === task._id ? "#bae6fd" : "#f8fafc";
                          }
                        }}
                        onMouseLeave={(e) => {
                          leaveTimeout.current = setTimeout(() => {
                            if (
                              draggedTask !== task._id &&
                              dragOverTask !== task._id &&
                              !showTaskMenu &&
                              !showTagDropdown
                            ) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }, 100);
                        }}
                      >
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            borderBottom: "1px solid #f1f5f9",
                            verticalAlign: "middle",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                            }}
                          >
                            <span
                              style={{
                                textDecoration:
                                  status === TASK_STATUS.COMPLETED
                                    ? "line-through"
                                    : "none",
                                color:
                                  status === TASK_STATUS.COMPLETED
                                    ? "#94a3b8"
                                    : "#1e293b",
                                fontWeight: 500,
                                fontSize: "1rem",
                                lineHeight: 1.5,
                                flex: 1,
                              }}
                            >
                              {task.text}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            borderBottom: "1px solid #f1f5f9",
                            verticalAlign: "middle",
                          }}
                        >
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              toggleTaskPriority(task._id);
                              return false;
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              background: priorityColor.bg,
                              color: priorityColor.color,
                              padding: "0.375rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              border: `1px solid ${priorityColor.border}20`,
                              textTransform: "capitalize",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            title="Click to change priority"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.05)";
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: priorityColor.color,
                                flexShrink: 0,
                              }}
                            />
                            {priority}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            borderBottom: "1px solid #f1f5f9",
                            verticalAlign: "middle",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                              minHeight: "40px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                              }}
                            >
                              {Array.isArray(task.tags) &&
                                task.tags.length > 0 &&
                                task.tags.slice(0, 3).map((tag) => (
                                  <div
                                    key={tag}
                                    style={{
                                      position: "relative",
                                      display: "inline-block",
                                    }}
                                  >
                                    <span
                                      style={{
                                        background: "#e0f2fe",
                                        color: blue,
                                        padding: "0.3rem 0.8rem",
                                        borderRadius: "9999px",
                                        fontSize: "0.8rem",
                                        fontWeight: 500,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.25rem",
                                        transition: "all 0.2s",
                                        border: "1px solid transparent",
                                      }}
                                      title={tag}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background =
                                          "#bae6fd";
                                        e.currentTarget.style.borderColor =
                                          "#7dd3fc";
                                        e.currentTarget.style.transform =
                                          "translateY(-1px)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                          "#e0f2fe";
                                        e.currentTarget.style.borderColor =
                                          "transparent";
                                        e.currentTarget.style.transform =
                                          "translateY(0)";
                                      }}
                                    >
                                      {tag.length > 12
                                        ? `${tag.substring(0, 10)}...`
                                        : tag}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updatedTags = task.tags.filter(
                                            (t) => t !== tag,
                                          );
                                          updateTaskStore(task._id, {
                                            tags: updatedTags,
                                          });
                                        }}
                                        style={{
                                          background: "transparent",
                                          border: "none",
                                          color: "currentColor",
                                          opacity: 0.7,
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: "0.1rem",
                                          borderRadius: "50%",
                                          transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "rgba(0, 0, 0, 0.1)";
                                          e.currentTarget.style.opacity = "1";
                                          e.currentTarget.style.transform =
                                            "scale(1.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                          e.currentTarget.style.opacity = "0.7";
                                          e.currentTarget.style.transform =
                                            "scale(1)";
                                        }}
                                      >
                                        ×
                                      </button>
                                    </span>
                                  </div>
                                ))}
                              <div style={{ position: "relative" }}>
                                <button
                                  data-tag-button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTagDropdown(
                                      showTagDropdown === task._id ? null : task._id,
                                    );
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "1px dashed #cbd5e1",
                                    borderRadius: "0.5rem",
                                    padding: "0.25rem 0.75rem",
                                    color: "#64748b",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#f8fafc";
                                    e.currentTarget.style.borderColor = "#94a3b8";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.borderColor = "#cbd5e1";
                                  }}
                                >
                                  <Plus size={14} />
                                  Add Tag
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "#64748b",
                            fontSize: "0.95rem",
                          }}
                        >
                          {formatDate(task.created)}
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            borderBottom: "1px solid #f1f5f9",
                            verticalAlign: "middle",
                            minWidth: "140px",
                          }}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "9999px",
                              background: `${statusColor}10`,
                              color: statusColor,
                              border: `1px solid ${statusColor}20`,
                              fontWeight: 600,
                              fontSize: "0.85rem",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onClick={() => toggleTaskStatus(task._id)}
                            title={`Click to change status (${status})`}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${statusColor}15`;
                              e.currentTarget.style.transform =
                                "translateY(-1px)";
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(0, 0, 0, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = `${statusColor}10`;
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: statusColor,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ textTransform: "capitalize" }}>
                              {status.toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {/* Drag handle */}
                            <div
                              style={{
                                cursor: "grab",
                                padding: "0.4rem",
                                borderRadius: "0.5rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                                color: "#64748b",
                              }}
                              title="Drag to reorder"
                              onMouseDown={(e) => {
                                e.currentTarget.style.cursor = "grabbing";
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.cursor = "grab";
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f1f5f9";
                                e.currentTarget.style.color = blue;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.color = "#64748b";
                                e.currentTarget.style.cursor = "grab";
                              }}
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle
                                  cx="9"
                                  cy="5"
                                  r="1"
                                  fill="currentColor"
                                />
                                <circle
                                  cx="15"
                                  cy="5"
                                  r="1"
                                  fill="currentColor"
                                />
                                <circle
                                  cx="9"
                                  cy="12"
                                  r="1"
                                  fill="currentColor"
                                />
                                <circle
                                  cx="15"
                                  cy="12"
                                  r="1"
                                  fill="currentColor"
                                />
                                <circle
                                  cx="9"
                                  cy="19"
                                  r="1"
                                  fill="currentColor"
                                />
                                <circle
                                  cx="15"
                                  cy="19"
                                  r="1"
                                  fill="currentColor"
                                />
                              </svg>
                            </div>

                            {/* Menu button */}
                            <div
                              style={{ position: "relative", zIndex: 999999 }}
                            >
                              <button
                                data-menu-button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowTaskMenu(
                                    showTaskMenu === task._id ? null : task._id,
                                  );
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#64748b",
                                  cursor: "pointer",
                                  padding: "0.4rem",
                                  borderRadius: "0.5rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.2s",
                                }}
                                title="More options"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#f1f5f9";
                                  e.currentTarget.style.color = blue;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  e.currentTarget.style.color = "#64748b";
                                }}
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="1"
                                    fill="currentColor"
                                  />
                                  <circle
                                    cx="12"
                                    cy="5"
                                    r="1"
                                    fill="currentColor"
                                  />
                                  <circle
                                    cx="12"
                                    cy="19"
                                    r="1"
                                    fill="currentColor"
                                  />
                                </svg>
                              </button>

                              {/* Dropdown menu */}
                              {showTaskMenu === task._id && (
                                <div
                                  style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 999999,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTaskMenu(null);
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "fixed",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      background: "rgba(0, 0, 0, 0.3)",
                                      zIndex: -1,
                                    }}
                                  />
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      zIndex: 1000000,
                                    }}
                                  >
                                    <div
                                      data-task-menu
                                      style={{
                                        background: "#fff",
                                        borderRadius: "0.75rem",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                        padding: "0.75rem",
                                        minWidth: "180px",
                                        border: "1px solid #e5e7eb",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: 600,
                                          fontSize: "0.9rem",
                                          color: "#374151",
                                          marginBottom: "0.75rem",
                                          textAlign: "center",
                                        }}
                                      >
                                        Task Options
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowTaskMenu(null);
                                          handleEditClick(task);
                                        }}
                                        style={{
                                          width: "100%",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.5rem",
                                          padding: "0.5rem 0.75rem",
                                          background: "transparent",
                                          border: "none",
                                          borderRadius: "0.5rem",
                                          color: "#374151",
                                          cursor: "pointer",
                                          fontSize: "0.9rem",
                                          transition: "all 0.2s",
                                          textAlign: "left",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#f8fafc";
                                          e.currentTarget.style.color = blue;
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                          e.currentTarget.style.color =
                                            "#374151";
                                        }}
                                      >
                                        <Edit2 size={16} />
                                        Edit Task
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowTaskMenu(null);
                                          handleDeleteTask(task._id);
                                        }}
                                        style={{
                                          width: "100%",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.5rem",
                                          padding: "0.5rem 0.75rem",
                                          background: "transparent",
                                          border: "none",
                                          borderRadius: "0.5rem",
                                          color: "#374151",
                                          cursor: "pointer",
                                          fontSize: "0.9rem",
                                          transition: "all 0.2s",
                                          textAlign: "left",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#fef2f2";
                                          e.currentTarget.style.color =
                                            "#ef4444";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                          e.currentTarget.style.color =
                                            "#374151";
                                        }}
                                      >
                                        <Trash2 size={16} />
                                        Delete Task
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Floating Add Button */}
        <button
          onClick={() => setShowAdd(true)}
          style={{
            position: "fixed",
            right: "2rem",
            bottom: "2rem",
            width: 64,
            height: 64,
            background: blueGradient,
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            boxShadow: "0 8px 32px rgba(37, 99, 235, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow =
              "0 12px 40px rgba(37, 99, 235, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 8px 32px rgba(37, 99, 235, 0.3)";
          }}
        >
          <Plus size={32} />
        </button>

        {/* Tag Dropdown Modal (Portal) */}
      {showTagDropdown &&
        createPortal(
          (() => {
            const task = tasks.find((t) => t._id === showTagDropdown);
            if (!task) return null;

            return (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1002,
                }}
                onClick={() => setShowTagDropdown(null)}
                onMouseEnter={() => clearTimeout(leaveTimeout.current)}
              >
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.3)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    data-tag-dropdown
                    style={{
                      background: "#fff",
                      borderRadius: "0.75rem",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                      padding: "1rem",
                      minWidth: "300px",
                      maxWidth: "350px",
                      maxHeight: "400px",
                      overflowY: "auto",
                      border: "1px solid #e5e7eb",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                        paddingBottom: "0.5rem",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          color: "#374151",
                        }}
                      >
                        Add Tags to Task
                      </div>
                      <button
                        onClick={() => setShowTagDropdown(null)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#6b7280",
                          cursor: "pointer",
                          padding: "0.25rem",
                          borderRadius: "0.25rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                      {tags.map((tag) => (
                        <div
                          key={tag}
                          onClick={() => toggleTaskTag(task._id, tag)}
                          style={{
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            transition: "all 0.2s",
                            marginBottom: "0.25rem",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={task.tags && task.tags.includes(tag)}
                            readOnly
                            style={{
                              width: "18px",
                              height: "18px",
                              cursor: "pointer",
                              accentColor: blue,
                            }}
                          />
                          <span
                            style={{ fontSize: "0.95rem", color: "#374151" }}
                          >
                            {tag}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: "1rem",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid #f3f4f6",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => setShowTagDropdown(null)}
                        style={{
                          background: blueGradient,
                          color: "#fff",
                          border: "none",
                          borderRadius: "0.5rem",
                          padding: "0.5rem 1.5rem",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })(),
          document.getElementById("portal-root"),
        )}

        {/* Add Task Modal */}
        {showAdd && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: modalClosing
                ? "rgba(0, 0, 0, 0)"
                : "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem",
              boxSizing: "border-box",
              transition: "background 0.3s ease",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "1.5rem",
                boxShadow: "0 20px 80px rgba(0, 0, 0, 0.3)",
                padding: "2rem",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                margin: "0 auto",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                transform: modalClosing
                  ? "scale(0.9) translateY(20px)"
                  : "scale(1) translateY(0)",
                opacity: modalClosing ? 0 : 1,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <h2
                style={{
                  color: blue,
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                {editingId ? "Edit Task" : "Add New Task"}
              </h2>

              {/* Task Name Input */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "#334155",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  Task Name
                </label>
                <input
                  type="text"
                  value={editingId ? editingText : newTask}
                  onChange={(e) =>
                    editingId
                      ? setEditingText(e.target.value)
                      : setNewTask(e.target.value)
                  }
                  placeholder="Enter task name"
                  style={{
                    fontSize: "1.1rem",
                    padding: "1rem",
                    borderRadius: "1rem",
                    border: `2px solid ${blue}`,
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>

              {/* Tags Section */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <label
                    style={{
                      color: "#334155",
                      fontWeight: 600,
                      fontSize: "1rem",
                    }}
                  >
                    Tags
                  </label>
                  <button
                    onClick={() => setShowTagSelector(!showTagSelector)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "transparent",
                      border: `2px solid ${blue}`,
                      borderRadius: "0.75rem",
                      padding: "0.5rem 1rem",
                      color: blue,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = blue;
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = blue;
                    }}
                  >
                    <Plus size={16} />
                    Add Tags
                  </button>
                </div>

                {/* Selected Tags Display */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    minHeight: "2.5rem",
                    padding: "0.75rem",
                    border: `2px dashed ${blue}30`,
                    borderRadius: "1rem",
                    background: "#f8fafc",
                    marginBottom: "1rem",
                  }}
                >
                  {(editingId ? editingTags : selectedTags).length > 0 ? (
                    (editingId ? editingTags : selectedTags).map(
                      (tag, index) => (
                        <div
                          key={index}
                          style={{
                            background: blueGradient,
                            color: "#fff",
                            padding: "0.5rem 1rem",
                            borderRadius: "9999px",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
                          }}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(index)}
                            style={{
                              background: "rgba(255, 255, 255, 0.2)",
                              border: "none",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              color: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.2)";
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ),
                    )
                  ) : (
                    <span
                      style={{
                        color: "#94a3b8",
                        fontStyle: "italic",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      No tags selected. Click "Add Tags" to select tags.
                    </span>
                  )}
                </div>

                {/* Tag Selector Dropdown */}
                {showTagSelector && (
                  <div
                    style={{
                      background: "#fff",
                      border: `2px solid ${blue}`,
                      borderRadius: "1rem",
                      padding: "1rem",
                      marginBottom: "1rem",
                      boxShadow: "0 8px 32px rgba(37, 99, 235, 0.1)",
                      animation: "slideDown 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        marginBottom: "1rem",
                      }}
                    >
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            if (editingId) {
                              setEditingTags(
                                editingTags.includes(tag)
                                  ? editingTags.filter((t) => t !== tag)
                                  : [...editingTags, tag],
                              );
                            } else {
                              setSelectedTags(
                                selectedTags.includes(tag)
                                  ? selectedTags.filter((t) => t !== tag)
                                  : [...selectedTags, tag],
                              );
                            }
                          }}
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "9999px",
                            border: (editingId
                              ? editingTags
                              : selectedTags
                            ).includes(tag)
                              ? "none"
                              : `2px solid ${blue}`,
                            background: (editingId
                              ? editingTags
                              : selectedTags
                            ).includes(tag)
                              ? blueGradient
                              : "#fff",
                            color: (editingId
                              ? editingTags
                              : selectedTags
                            ).includes(tag)
                              ? "#fff"
                              : blue,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          type="button"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {/* Add New Tag */}
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag(e)}
                        placeholder="Create new tag"
                        style={{
                          flex: 1,
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${blue}`,
                          fontSize: "0.9rem",
                        }}
                      />
                      <button
                        onClick={handleAddTag}
                        style={{
                          background: blueGradient,
                          color: "#fff",
                          border: "none",
                          borderRadius: "0.5rem",
                          padding: "0.5rem 1rem",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Deadline and Priority Section */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "#334155",
                      fontWeight: 600,
                      fontSize: "1rem",
                    }}
                  >
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={editingId ? editingDeadline : newDeadline}
                    onChange={(e) =>
                      editingId
                        ? setEditingDeadline(e.target.value)
                        : setNewDeadline(e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "1rem",
                      border: `2px solid ${blue}`,
                      fontSize: "1rem",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "#334155",
                      fontWeight: 600,
                      fontSize: "1rem",
                    }}
                  >
                    Priority
                  </label>
                  <select
                    value={editingId ? editingPriority : newPriority}
                    onChange={(e) =>
                      editingId
                        ? setEditingPriority(e.target.value)
                        : setNewPriority(e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "1rem",
                      border: `2px solid ${blue}`,
                      fontSize: "1rem",
                      background: "#fff",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="normal">🟡 Normal Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                </div>
              </div>

              {/* Description Section */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "#334155",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  Description
                </label>
                <textarea
                  value={editingId ? editingDescription : newDescription}
                  onChange={(e) =>
                    editingId
                      ? setEditingDescription(e.target.value)
                      : setNewDescription(e.target.value)
                  }
                  placeholder="Add a detailed description for your task (optional)"
                  style={{
                    fontSize: "1rem",
                    padding: "1rem",
                    borderRadius: "1rem",
                    border: `2px solid ${blue}`,
                    width: "100%",
                    minHeight: "120px",
                    boxSizing: "border-box",
                    resize: "vertical",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    padding: "1rem 2rem",
                    borderRadius: "1rem",
                    background: blueGradient,
                    color: "#fff",
                    border: "none",
                    boxShadow: blueShadow,
                    cursor: "pointer",
                    flex: 1,
                    transition: "all 0.2s ease",
                  }}
                  onClick={handleSaveTask}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(37, 99, 235, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = blueShadow;
                  }}
                >
                  {editingId ? "Update Task" : "Create Task"}
                </button>
                <button
                  style={{
                    background: "transparent",
                    border: `2px solid ${blue}`,
                    color: blue,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "1rem 2rem",
                    borderRadius: "1rem",
                    transition: "all 0.2s ease",
                  }}
                  onClick={handleCloseModal}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = blue;
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = blue;
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteAccountModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "1.5rem",
                boxShadow: "0 20px 80px rgba(0, 0, 0, 0.3)",
                padding: "2rem",
                width: "100%",
                maxWidth: "500px",
                boxSizing: "border-box",
              }}
            >
              <h2
                style={{
                  color: "#ef4444",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  textAlign: "center",
                  margin: 0,
                  marginBottom: "1rem",
                }}
              >
                ⚠️ Delete Account
              </h2>

              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#374151",
                  textAlign: "center",
                  marginBottom: "2rem",
                  lineHeight: 1.6,
                }}
              >
                Are you absolutely sure you want to delete your account?
                <br />
                <br />
                <strong>
                  This action cannot be undone and will permanently delete:
                </strong>
                <br />
                • Your account and profile
                <br />
                • All your tasks and data
                <br />• All your settings and preferences
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    background: deletingAccount ? "#9ca3af" : "#6b7280",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: deletingAccount ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteAccountModal(false)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    background: deletingAccount ? "#9ca3af" : "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: deletingAccount ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  disabled={deletingAccount}
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    handleDeleteAccount();
                  }}
                >
                  {deletingAccount ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Add keyframe animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
if (!document.head.contains(style)) {
  document.head.appendChild(style);
}

export default App;
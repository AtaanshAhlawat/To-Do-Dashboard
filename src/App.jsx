import { useState, useEffect, useRef } from "react";
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
  REJECTED: "Rejected",
};

// Status colors for UI
const STATUS_COLORS = {
  [TASK_STATUS.PENDING]: "#f59e0b",
  [TASK_STATUS.IN_PROGRESS]: "#3b82f6",
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
    } catch {}
  }, []);

  // Zustand stores
  const { user, token, logout, deleteAccount } = useAuthStore();
  const {
    tasks,
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
  const [tagFilter, setTagFilter] = useState([]); // Multi-tag filter
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Get all unique tags from tasks
  const allTags = [...new Set(tasks.flatMap((task) => task.tags || []))];

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
  const toggleUserMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

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
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingTags, setEditingTags] = useState([]);
  const [editingDeadline, setEditingDeadline] = useState("");
  const [editingPriority, setEditingPriority] = useState("normal");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const [taskStatus, setTaskStatus] = useState({}); // { taskId: status }
  const [showTagDropdown, setShowTagDropdown] = useState(null); // taskId or null
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);

  // Load tasks on mount if logged in
  useEffect(() => {
    if (token) loadTasks();
  }, [token, loadTasks]);

  // Initialize task statuses when tasks are loaded
  useEffect(() => {
    const statuses = {};
    tasks.forEach((task) => {
      statuses[task._id] = task.status || TASK_STATUS.PENDING;
    });
    setTaskStatus(statuses);
  }, [tasks]);

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
        newStatus = TASK_STATUS.REJECTED;
        break;
      default:
        newStatus = TASK_STATUS.PENDING;
    }

    updateTaskStatus(taskId, newStatus);
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
  const toggleTask = async (id) => {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;
    await updateTaskStore(id, { completed: !task.completed });
  };

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
        await addTaskStore(taskData);

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

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
    setEditingDescription("");
    setEditingTags([]);
    setEditingDeadline("");
    setEditingPriority("normal");
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

  // Add missing functions
  const startEditing = (taskId, text, description, tags) => {
    setEditingId(taskId);
    setEditingText(text);
    setEditingDescription(description || "");
    setEditingTags([...(tags || [])]);
    setShowAdd(true);
  };

  const saveEdit = async (taskId) => {
    if (!editingText.trim()) return;

    const taskData = {
      text: editingText.trim(),
      description: editingDescription.trim(),
      tags: editingTags,
    };

    try {
      await updateTaskStore(taskId, taskData);
      setEditingId(null);
      setEditingText("");
      setEditingDescription("");
      setEditingTags([]);
    } catch (error) {
      console.error("Error updating task:", error);
      setUIError("Failed to update task. Please try again.");
    }
  };

  const filteredTasks = tasks.filter((task) => {
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

    // Apply completion filter
    let completionMatch = true;
    if (filter === "active") {
      completionMatch = !task.completed;
    } else if (filter === "completed") {
      completionMatch = task.completed;
    }

    return searchMatch && tagMatch && completionMatch;
  });

  const tagTasks =
    tagFilter.length === 0
      ? tasks
      : tasks.filter(
          (t) => t.tags && t.tags.some((tag) => tagFilter.includes(tag)),
        );

  const tagActive = tagTasks.filter((t) => !t.completed).length;
  const tagComplete = tagTasks.filter((t) => t.completed).length;
  const tagPercent = tagTasks.length
    ? Math.round((tagComplete / tagTasks.length) * 100)
    : 0;

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
      {/* Profile Icon Top Right */}
      {user && (
        <div style={{ position: "fixed", top: 24, right: 32, zIndex: 1000 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setShowProfileMenu((v) => !v)}
                aria-label="Profile menu"
              >
                <User size={32} color="#18192b" />
              </button>
              {showProfileMenu && (
                <div
                  ref={profileMenuRef}
                  style={{
                    position: "absolute",
                    top: 50,
                    right: 0,
                    background: "#fff",
                    boxShadow: "0 2px 12px #0001",
                    borderRadius: 12,
                    padding: "1rem",
                    minWidth: 200,
                    zIndex: 1000,
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
          </div>
        </div>
      )}

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
          {/* Header Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
              alignItems: "start",
            }}
          >
            {/* Progress Card */}
            <div
              style={{
                background: "#fff",
                border: `2px solid ${blue}`,
                borderRadius: "1.5rem",
                boxShadow: blueShadow,
                padding: "2rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  fontSize: "1.8rem",
                  background: "#e0edff",
                  color: blue,
                  border: `3px solid ${blueLight}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontWeight: 700,
                }}
              >
                <span>{tagPercent}%</span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: blue,
                    marginBottom: "0.5rem",
                  }}
                >
                  {tagFilter.length === 0
                    ? `You have ${tagActive} task${tagActive !== 1 ? "s" : ""} to complete.`
                    : `You have ${tagActive} ${tagFilter.join(", ")} task${tagActive !== 1 ? "s" : ""} to complete.`}
                </div>
                <div style={{ color: "#666", fontSize: "1.1rem" }}>
                  {tagComplete === 0
                    ? "No tasks completed yet. Keep going!"
                    : `${tagComplete} completed! Great job!`}
                </div>
              </div>
            </div>

            {/* Controls Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Search and Filter */}
              <div style={{ display: "flex", gap: "1rem" }}>
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
                    border: `2px solid ${blueLight}`,
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
                      border: `2px solid ${blueLight}`,
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
                        zIndex: 50,
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
                            onMouseOver={(e) =>
                              (e.currentTarget.style.background = "#f8fafc")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.background = "none")
                            }
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
                              padding: "0.5rem",
                              color: "#94a3b8",
                              textAlign: "center",
                              fontSize: "0.85rem",
                            }}
                          >
                            No tags available
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
                            background: "none",
                            border: "1px solid #f1f5f9",
                            borderRadius: "0.5rem",
                            color: blue,
                            fontWeight: 500,
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
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
                              d="M6 18L18 6M6 6L18 18"
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

              {/* Category Label */}
              <div
                style={{
                  fontSize: "1.2rem",
                  padding: "0.8rem 1.5rem",
                  borderRadius: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#e0edff",
                  color: blue,
                  fontWeight: 700,
                  boxShadow: blueShadow,
                }}
              >
                <User size={24} style={{ marginRight: "0.5rem" }} />
                {tagFilter.length === 0
                  ? `All Tasks (${filteredTasks.length})`
                  : `${tagFilter.join(", ")} (${filteredTasks.length})`}
              </div>

              {/* Tag Filter */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  margin: "0.5rem 0",
                }}
              >
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setTagFilter(
                        tagFilter.includes(tag)
                          ? tagFilter.filter((t) => t !== tag)
                          : [...tagFilter, tag],
                      )
                    }
                    style={{
                      fontWeight: 600,
                      fontSize: "1rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "1rem",
                      border: tagFilter.includes(tag)
                        ? "none"
                        : `2px solid ${blueLight}`,
                      background: tagFilter.includes(tag)
                        ? blueGradient
                        : "#fff",
                      color: tagFilter.includes(tag) ? "#fff" : blue,
                      boxShadow: tagFilter.includes(tag) ? blueShadow : "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      marginBottom: 4,
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View Toggle and Filter Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {["all", "active", "completed"].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  style={{
                    fontSize: "1.1rem",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "0.75rem",
                    fontWeight: 700,
                    background: filter === filterType ? blueGradient : "#fff",
                    color: filter === filterType ? "#fff" : blue,
                    border: `2px solid ${blue}`,
                    boxShadow: filter === filterType ? blueShadow : "none",
                    transition: "all 0.2s",
                    minWidth: "100px",
                    cursor: "pointer",
                  }}
                >
                  {filterType === "all"
                    ? "All"
                    : filterType === "active"
                      ? "Pending"
                      : "Completed"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setViewMode("card")}
                style={{
                  padding: "0.6rem 1.2rem",
                  background: viewMode === "card" ? blueGradient : "#fff",
                  color: viewMode === "card" ? "#fff" : blue,
                  border: `2px solid ${blue}`,
                  borderRadius: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: viewMode === "card" ? 1 : 0.7,
                  transition: "all 0.2s",
                }}
              >
                Card View
              </button>
              <button
                onClick={() => setViewMode("table")}
                style={{
                  padding: "0.6rem 1.2rem",
                  background: viewMode === "table" ? blueGradient : "#fff",
                  color: viewMode === "table" ? "#fff" : blue,
                  border: `2px solid ${blue}`,
                  borderRadius: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: viewMode === "table" ? 1 : 0.7,
                  transition: "all 0.2s",
                }}
              >
                Table View
              </button>
            </div>
          </div>

          {/* Tasks Section */}
          {filteredTasks.length === 0 ? (
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
          ) : viewMode === "table" ? (
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
                        textAlign: "center",
                        padding: "1rem 1.5rem",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "80px",
                      }}
                    >
                      Complete
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

                    return (
                      <tr
                        key={task._id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f8fafc";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0, 0, 0, 0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            borderBottom: "1px solid #f1f5f9",
                            verticalAlign: "middle",
                          }}
                        >
                          <span
                            style={{
                              textDecoration: task.completed
                                ? "line-through"
                                : "none",
                              color: task.completed ? "#94a3b8" : "#1e293b",
                              fontWeight: 500,
                              fontSize: "1rem",
                              lineHeight: 1.5,
                            }}
                          >
                            {task.text}
                          </span>
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTagDropdown(
                                      showTagDropdown === task._id
                                        ? null
                                        : task._id,
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
                                    e.currentTarget.style.background =
                                      "#f8fafc";
                                    e.currentTarget.style.borderColor =
                                      "#94a3b8";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "transparent";
                                    e.currentTarget.style.borderColor =
                                      "#cbd5e1";
                                  }}
                                >
                                  <Plus size={14} />
                                  Add Tag
                                </button>

                                {showTagDropdown === task._id && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      right: 0,
                                      background: "#fff",
                                      borderRadius: "0.75rem",
                                      boxShadow:
                                        "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                      padding: "0.5rem",
                                      zIndex: 50,
                                      minWidth: "200px",
                                      maxHeight: "300px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    <div
                                      style={{
                                        padding: "0.5rem",
                                        fontWeight: 600,
                                        fontSize: "0.9rem",
                                        color: "#64748b",
                                      }}
                                    >
                                      Add Tags
                                    </div>
                                    {tags.map((tag) => (
                                      <div
                                        key={tag}
                                        onClick={() =>
                                          toggleTaskTag(task._id, tag)
                                        }
                                        style={{
                                          padding: "0.5rem 0.75rem",
                                          borderRadius: "0.5rem",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.5rem",
                                          transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#f8fafc";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            task.tags && task.tags.includes(tag)
                                          }
                                          readOnly
                                          style={{
                                            width: "16px",
                                            height: "16px",
                                            cursor: "pointer",
                                          }}
                                        />
                                        <span>{tag}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
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
                        <td
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            borderBottom: "1px solid #f1f5f9",
                            verticalAlign: "middle",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task._id)}
                            style={{
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                              accentColor: blue,
                              flexShrink: 0,
                            }}
                            title={
                              task.completed
                                ? "Mark as pending"
                                : "Mark as completed"
                            }
                          />
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "0.5rem",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(
                                  task._id,
                                  task.text,
                                  task.description,
                                  task.tags,
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
                              title="Edit task"
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
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task._id);
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
                              title="Delete task"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#fef2f2";
                                e.currentTarget.style.color = "#ef4444";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.color = "#64748b";
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                gap: "1.5rem",
                width: "100%",
              }}
            >
              {console.log("TASKS FOR RENDER", tasks)}
              {filteredTasks.map((task) => {
                const status = taskStatus[task._id] || TASK_STATUS.PENDING;
                const statusColor = STATUS_COLORS[status] || "#64748b";

                return (
                  <div
                    key={task._id}
                    style={{
                      background: blueGradient,
                      color: "#fff",
                      borderRadius: "1.5rem",
                      fontSize: "1.1rem",
                      boxShadow: "0 8px 32px rgba(37, 99, 235, 0.2)",
                      padding: expandedTaskId === task._id ? "2rem" : "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      minHeight: "80px",
                      position: "relative",
                      transition:
                        "transform 0.2s, box-shadow 0.2s, padding 0.2s",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                    onClick={() =>
                      setExpandedTaskId(
                        expandedTaskId === task._id ? null : task._id,
                      )
                    }
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 40px rgba(37, 99, 235, 0.3)";

                      // Show status on hover
                      const statusElement =
                        e.currentTarget.querySelector(".task-status-hover");
                      if (statusElement) {
                        statusElement.style.transform = "translateX(0)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 32px rgba(37, 99, 235, 0.2)";

                      // Hide status on mouse leave
                      const statusElement =
                        e.currentTarget.querySelector(".task-status-hover");
                      if (statusElement) {
                        statusElement.style.transform = "translateX(100%)";
                      }
                    }}
                  >
                    {/* Status hover indicator */}
                    <div
                      className="task-status-hover"
                      style={{
                        position: "absolute",
                        top: "1rem",
                        right: 0,
                        background: statusColor,
                        color: "white",
                        padding: "0.25rem 1rem",
                        borderTopLeftRadius: "9999px",
                        borderBottomLeftRadius: "9999px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        transform: "translateX(100%)",
                        transition: "transform 0.3s ease",
                        zIndex: 10,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskStatus(task._id);
                      }}
                    >
                      {status}
                    </div>
                    {/* Collapsed view: only show main info */}
                    {expandedTaskId !== task._id ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          width: "100%",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTask(task._id);
                          }}
                          style={{
                            accentColor: "#fff",
                            width: 20,
                            height: 20,
                            marginTop: "2px",
                            cursor: "pointer",
                          }}
                          title={
                            task.completed
                              ? "Mark as pending"
                              : "Mark as completed"
                          }
                        />
                        <div
                          style={{
                            flex: 1,
                            fontWeight: 700,
                            fontSize: "1.2rem",
                            lineHeight: 1.4,
                            textDecoration: task.completed
                              ? "line-through"
                              : "none",
                            opacity: task.completed ? 0.7 : 1,
                          }}
                        >
                          {task.text}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            position: "relative",
                          }}
                        >
                          {(() => {
                            const tags = Array.isArray(task.tags)
                              ? task.tags
                              : [];
                            if (tags.length > 0) {
                              return (
                                <>
                                  {tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      style={{
                                        background: "#fff",
                                        color: blue,
                                        fontWeight: 700,
                                        borderRadius: "0.75rem",
                                        padding: "0.3rem 0.8rem",
                                        fontSize: "0.9rem",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {tags.length > 2 && (
                                    <div style={{ position: "relative" }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowTagDropdown(
                                            showTagDropdown === task._id
                                              ? null
                                              : task._id,
                                          );
                                        }}
                                        style={{
                                          background: "#ffffff40",
                                          border: "none",
                                          borderRadius: "9999px",
                                          width: "28px",
                                          height: "28px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          cursor: "pointer",
                                          color: "white",
                                          fontWeight: 700,
                                          fontSize: "0.9rem",
                                          transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#ffffff60";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "#ffffff40";
                                        }}
                                      >
                                        +{tags.length - 2}
                                      </button>

                                      {showTagDropdown === task._id && (
                                        <div
                                          style={{
                                            position: "absolute",
                                            top: "100%",
                                            right: 0,
                                            background: "#fff",
                                            borderRadius: "0.75rem",
                                            boxShadow:
                                              "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                            padding: "0.5rem",
                                            zIndex: 50,
                                            minWidth: "200px",
                                            maxHeight: "300px",
                                            overflowY: "auto",
                                          }}
                                        >
                                          <div
                                            style={{
                                              padding: "0.5rem",
                                              fontWeight: 600,
                                              fontSize: "0.9rem",
                                              color: "#64748b",
                                            }}
                                          >
                                            All Tags
                                          </div>
                                          {tags.map((tag) => (
                                            <div
                                              key={tag}
                                              onClick={() =>
                                                toggleTaskTag(task._id, tag)
                                              }
                                              style={{
                                                padding: "0.5rem 0.75rem",
                                                borderRadius: "0.5rem",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                transition: "all 0.2s",
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.background =
                                                  "#f8fafc";
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.background =
                                                  "transparent";
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={
                                                  task.tags &&
                                                  task.tags.includes(tag)
                                                }
                                                readOnly
                                                style={{
                                                  width: "16px",
                                                  height: "16px",
                                                  cursor: "pointer",
                                                }}
                                              />
                                              <span
                                                style={{ color: "#1e293b" }}
                                              >
                                                {tag}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            }
                            return (
                              <div style={{ position: "relative" }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTagDropdown(
                                      showTagDropdown === task._id
                                        ? null
                                        : task._id,
                                    );
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "1px dashed rgba(255,255,255,0.5)",
                                    borderRadius: "0.5rem",
                                    padding: "0.25rem 0.75rem",
                                    color: "rgba(255,255,255,0.9)",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      "rgba(255,255,255,0.1)";
                                    e.currentTarget.style.borderColor =
                                      "rgba(255,255,255,0.7)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "transparent";
                                    e.currentTarget.style.borderColor =
                                      "rgba(255,255,255,0.5)";
                                  }}
                                >
                                  <Plus size={14} />
                                  Add Tag
                                </button>

                                {showTagDropdown === task._id && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      right: 0,
                                      background: "#fff",
                                      borderRadius: "0.75rem",
                                      boxShadow:
                                        "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                      padding: "0.5rem",
                                      zIndex: 50,
                                      minWidth: "200px",
                                      maxHeight: "300px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    <div
                                      style={{
                                        padding: "0.5rem",
                                        fontWeight: 600,
                                        fontSize: "0.9rem",
                                        color: "#64748b",
                                      }}
                                    >
                                      Add Tags
                                    </div>
                                    {tags.map((tag) => (
                                      <div
                                        key={tag}
                                        onClick={() =>
                                          toggleTaskTag(task._id, tag)
                                        }
                                        style={{
                                          padding: "0.5rem 0.75rem",
                                          borderRadius: "0.5rem",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.5rem",
                                          transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#f8fafc";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            task.tags && task.tags.includes(tag)
                                          }
                                          readOnly
                                          style={{
                                            width: "16px",
                                            height: "16px",
                                            cursor: "pointer",
                                          }}
                                        />
                                        <span style={{ color: "#1e293b" }}>
                                          {tag}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      // Expanded view: show all details
                      <div>
                        {editingId === task._id ? (
                          <>
                            <input
                              type="text"
                              value={editingText}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditingText(e.target.value)}
                              placeholder="Task name"
                              style={{
                                fontSize: "1.2rem",
                                fontWeight: 700,
                                borderRadius: "0.75rem",
                                border: `2px solid ${blue}`,
                                padding: "0.75rem 1rem",
                                marginBottom: 10,
                                width: "100%",
                              }}
                            />
                            <textarea
                              value={editingDescription}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditingDescription(e.target.value)
                              }
                              placeholder="Description (optional)"
                              style={{
                                fontSize: "1rem",
                                padding: "0.75rem",
                                borderRadius: "0.75rem",
                                border: `2px solid ${blue}`,
                                width: "100%",
                                minHeight: 60,
                                boxSizing: "border-box",
                                margin: "0.5rem 0",
                              }}
                            />
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                                marginBottom: 12,
                              }}
                            >
                              {tags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTags(
                                      editingTags.includes(tag)
                                        ? editingTags.filter((t) => t !== tag)
                                        : [...editingTags, tag],
                                    );
                                  }}
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    padding: "0.3rem 1.1rem",
                                    borderRadius: "0.75rem",
                                    border: editingTags.includes(tag)
                                      ? "none"
                                      : `2px solid ${blue}`,
                                    background: editingTags.includes(tag)
                                      ? blueGradient
                                      : "#fff",
                                    color: editingTags.includes(tag)
                                      ? "#fff"
                                      : blue,
                                    boxShadow: editingTags.includes(tag)
                                      ? blueShadow
                                      : "none",
                                    cursor: "pointer",
                                    marginBottom: 2,
                                  }}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                            <div
                              style={{ display: "flex", gap: 8, marginTop: 10 }}
                            >
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await saveEdit(task._id);
                                }}
                                style={{
                                  background: blueGradient,
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "0.5rem",
                                  padding: "0.6rem 1.4rem",
                                  fontWeight: 700,
                                  fontSize: "1rem",
                                  cursor: "pointer",
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEdit();
                                }}
                                style={{
                                  background: "#fff",
                                  color: blue,
                                  border: `2px solid ${blue}`,
                                  borderRadius: "0.5rem",
                                  padding: "0.6rem 1.4rem",
                                  fontWeight: 700,
                                  fontSize: "1rem",
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                width: "100%",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleTask(task._id);
                                }}
                                style={{
                                  accentColor: "#fff",
                                  width: 20,
                                  height: 20,
                                  marginTop: "2px",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                                title={
                                  task.completed
                                    ? "Mark as pending"
                                    : "Mark as completed"
                                }
                              />
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "1.2rem",
                                  lineHeight: 1.4,
                                  textDecoration: task.completed
                                    ? "line-through"
                                    : "none",
                                  opacity: task.completed ? 0.7 : 1,
                                  flex: 1,
                                }}
                              >
                                {task.text}
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                margin: "0.5rem 0",
                              }}
                            >
                              {(() => {
                                const tags = Array.isArray(task.tags)
                                  ? task.tags
                                  : [];
                                if (tags.length > 0) {
                                  return tags.map((tag) => (
                                    <span
                                      key={tag}
                                      style={{
                                        background: "#fff",
                                        color: blue,
                                        fontWeight: 700,
                                        borderRadius: "0.75rem",
                                        padding: "0.3rem 1.1rem",
                                        fontSize: "0.95rem",
                                        whiteSpace: "nowrap",
                                        marginBottom: 2,
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ));
                                }
                                return (
                                  <span
                                    style={{
                                      background: "#fff",
                                      color: blue,
                                      fontWeight: 500,
                                      borderRadius: "0.75rem",
                                      padding: "0.3rem 1.1rem",
                                      fontSize: "0.95rem",
                                      marginBottom: 2,
                                      opacity: 0.6,
                                    }}
                                  >
                                    [No tags]
                                  </span>
                                );
                              })()}
                            </div>
                            <div
                              style={{
                                background: "#fff",
                                color: blue,
                                borderRadius: 12,
                                padding: "1rem",
                                margin: "0.5rem 0",
                                fontSize: "1.05rem",
                                fontWeight: 500,
                                opacity: 0.95,
                              }}
                            >
                              {(() => {
                                const description =
                                  typeof task.description === "string"
                                    ? task.description
                                    : "";
                                return (
                                  description || (
                                    <span style={{ opacity: 0.5 }}>
                                      [No description]
                                    </span>
                                  )
                                );
                              })()}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                marginTop: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  opacity: 0.9,
                                  background: "rgba(255,255,255,0.2)",
                                  padding: "0.25rem 0.75rem",
                                  borderRadius: "9999px",
                                }}
                              >
                                {formatDate(task.created)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(task);
                                }}
                                style={{
                                  background: "rgba(255,255,255,0.2)",
                                  border: "none",
                                  borderRadius: "0.5rem",
                                  padding: "0.5rem",
                                  color: "#fff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task._id);
                                }}
                                style={{
                                  background: "rgba(255,255,255,0.2)",
                                  border: "none",
                                  borderRadius: "0.5rem",
                                  padding: "0.5rem",
                                  color: "#fff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

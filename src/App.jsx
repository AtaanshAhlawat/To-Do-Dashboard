import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import Auth from "./Auth";
import { SearchBar } from "./components/common/SearchBar";
import { ProfileMenu } from "./components/common/ProfileMenu";
import { DeleteAccountModal } from "./components/modals/DeleteAccountModal";
import { TaskModal } from "./components/modals/TaskModal";
import { TaskTable } from "./components/tasks/TaskTable";
import { useAuthStore } from "./store/authStore";
import { useTasks } from "./hooks/useTasks";
import { useClickOutside } from "./hooks/useClickOutside";
import { TASK_STATUS, STATUS_COLORS, PRIORITY_OPTIONS } from "./constants/taskConstants";
import { COLORS } from "./constants/uiConstants";

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

  // Auth store
  const { user, token, logout, deleteAccount } = useAuthStore();

  // Task management
  const {
    tasks,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    tasksLoading,
    tags,
    addTag,
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
  } = useTasks();

  // UI State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [taskOrder, setTaskOrder] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);

  const tagFilterRef = useRef(null);

  // Close tag filter when clicking outside
  useClickOutside(tagFilterRef, () => setShowTagFilter(false), showTagFilter);

  // Load tasks on mount
  useEffect(() => {
    if (token) loadTasks();
  }, [token, loadTasks]);

  // Initialize task order for drag & drop
  useEffect(() => {
    if (tasks.length > 0 && taskOrder.length === 0) {
      setTaskOrder(tasks.map((task) => task._id));
    }
  }, [tasks, taskOrder]);

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const success = await deleteAccount();
      if (!success) {
        alert("Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setDeletingAccount(false);
      setShowDeleteAccountModal(false);
    }
  };

  // Handle task edit
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  // Handle task save (create or update)
  const handleSaveTask = async (formData) => {
    if (editingTask) {
      // Update existing task
      await updateTask(editingTask._id, formData);
    } else {
      // Create new task
      await addTask(formData);
    }
    setEditingTask(null);
    setShowTaskModal(false);
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

  // Get filtered tasks
  const filteredTasks = getFilteredAndSortedTasks()
    .filter((task) => {
      // Search filter
      const searchMatch =
        search === "" ||
        task.text?.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase()) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      // Tag filter
      const tagMatch =
        tagFilter.length === 0 ||
        (task.tags && tagFilter.every((filterTag) => task.tags.includes(filterTag)));

      return searchMatch && tagMatch;
    })
    .sort((a, b) => {
      // Apply drag-and-drop ordering if no column sorting is active
      if (!sortConfig) {
        const indexA = taskOrder.indexOf(a._id);
        const indexB = taskOrder.indexOf(b._id);
        return indexA - indexB;
      }
      return 0; // Let the store handle sorting when column sorting is active
    });

  // Handle sort
  const handleSort = (column, direction) => {
    setSortConfig(column, direction);
  };

  // Handle filter
  const handleFilter = (column, filterConfig) => {
    if (filterConfig.value === "" && filterConfig.selected?.length === 0) {
      clearFilter(column);
    } else {
      setFilter(column, filterConfig);
    }
  };

  // If not authenticated, show login
  if (!token) {
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
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", flex: 1, alignItems: "center" }}>
              <SearchBar value={search} onChange={setSearch} />

              {/* Clear All Filters Button */}
              {(Object.keys(filters).length > 0 || sortConfig) && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "2px solid #fecaca",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                  title="Clear all filters and sorting"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}

              {/* Tag Filter Button */}
              <div style={{ position: "relative" }} ref={tagFilterRef}>
                <button
                  onClick={() => setShowTagFilter(!showTagFilter)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "#fff",
                    border: "2px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>Filter by Tag</span>
                  {tagFilter.length > 0 && (
                    <span
                      style={{
                        background: COLORS.blue,
                        color: "white",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        padding: "0.1rem 0.5rem",
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
                      top: "calc(100% + 0.5rem)",
                      left: 0,
                      background: "#fff",
                      borderRadius: "0.75rem",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                      padding: "1rem",
                      minWidth: "250px",
                      zIndex: 100,
                    }}
                  >
                    <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#64748b" }}>
                      Select Tags
                    </h4>
                    {tags.map((tag) => (
                      <label
                        key={tag}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem",
                          cursor: "pointer",
                          borderRadius: "0.5rem",
                          transition: "background 0.2s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={tagFilter.includes(tag)}
                          onChange={() => {
                            setTagFilter((prev) =>
                              prev.includes(tag)
                                ? prev.filter((t) => t !== tag)
                                : [...prev, tag]
                            );
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <ProfileMenu
              user={user}
              showMenu={showProfileMenu}
              setShowMenu={setShowProfileMenu}
              onLogout={logout}
              onDeleteAccount={() => setShowDeleteAccountModal(true)}
            />
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
                  color: COLORS.blue,
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
            <TaskTable
              tasks={filteredTasks}
              tags={tags}
              taskStatus={tasks.reduce((acc, task) => {
                acc[task._id] = task.status || TASK_STATUS.PENDING;
                return acc;
              }, {})}
              taskPriorities={tasks.reduce((acc, task) => {
                acc[task._id] = task.priority || "normal";
                return acc;
              }, {})}
              onEdit={handleEditTask}
              onDelete={deleteTask}
              onToggleStatus={toggleTaskStatus}
              onTogglePriority={toggleTaskPriority}
              onToggleTag={toggleTaskTag}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              draggedTask={draggedTask}
              dragOverTask={dragOverTask}
              sortConfig={sortConfig}
              filters={filters}
              onSort={handleSort}
              onFilter={handleFilter}
            />
          )}

          {/* Add Task FAB */}
          <button
            onClick={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
            style={{
              position: "fixed",
              bottom: "2rem",
              right: "2rem",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.blueLight} 100%)`,
              border: "none",
              color: "#fff",
              fontSize: "2rem",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(37, 99, 235, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              zIndex: 50,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = "0 12px 48px rgba(37, 99, 235, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(37, 99, 235, 0.4)";
            }}
            title="Add new task"
          >
            <Plus size={32} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        editingTask={editingTask}
        allTags={tags}
        onAddTag={addTag}
      />

      {showDeleteAccountModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteAccountModal(false)}
          isDeleting={deletingAccount}
        />
      )}
    </>
  );
}

export default App;

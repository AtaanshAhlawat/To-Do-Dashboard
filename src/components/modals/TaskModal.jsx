import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { COLORS, GRADIENTS } from "../../constants/uiConstants";
import { useTaskForm } from "../../hooks/useTaskForm";

export const TaskModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingTask = null,
  allTags = [],
  onAddTag
}) => {
  const {
    formData,
    updateField,
    addTag,
    removeTag,
    resetForm,
    loadTask,
    showTagSelector,
    setShowTagSelector,
    newTagFromDropdown,
    setNewTagFromDropdown,
  } = useTaskForm(editingTask);

  const [modalClosing, setModalClosing] = React.useState(false);

  useEffect(() => {
    if (editingTask) {
      loadTask(editingTask);
    } else {
      resetForm();
    }
  }, [editingTask, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModalClosing(false);
      onClose();
      resetForm();
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.text.trim()) return;
    
    onSave(formData);
    handleClose();
  };

  const handleAddNewTag = (e) => {
    e.preventDefault();
    const trimmedTag = newTagFromDropdown.trim();
    if (trimmedTag) {
      addTag(trimmedTag);
      onAddTag(trimmedTag);
      setNewTagFromDropdown("");
    }
  };

  if (!isOpen) return null;

  return createPortal(
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
        opacity: modalClosing ? 0 : 1,
        transition: "opacity 0.3s",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
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
          transform: modalClosing ? "scale(0.9) translateY(20px)" : "scale(1) translateY(0)",
          opacity: modalClosing ? 0 : 1,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <h2
          style={{
            color: COLORS.blue,
            fontSize: "1.8rem",
            fontWeight: 700,
            textAlign: "center",
            margin: 0,
          }}
        >
          {editingTask ? "Edit Task" : "Add New Task"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Task Name */}
          <div style={{ marginBottom: "1.5rem" }}>
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
              value={formData.text}
              onChange={(e) => updateField("text", e.target.value)}
              placeholder="Enter task name"
              style={{
                fontSize: "1.1rem",
                padding: "1rem",
                borderRadius: "1rem",
                border: `2px solid ${COLORS.blue}`,
                width: "100%",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              autoFocus
            />
          </div>

          {/* Tags Section */}
          <div style={{ marginBottom: "1.5rem" }}>
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
                type="button"
                onClick={() => setShowTagSelector(!showTagSelector)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: `2px solid ${COLORS.blue}`,
                  borderRadius: "9999px",
                  width: "36px",
                  height: "36px",
                  color: COLORS.blue,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Plus size={20} />
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
                border: `2px dashed ${COLORS.blue}30`,
                borderRadius: "1rem",
                background: "#f8fafc",
                marginBottom: "1rem",
              }}
            >
              {formData.tags.length > 0 ? (
                formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    style={{
                      background: GRADIENTS.blueGradient,
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
                      type="button"
                      onClick={() => removeTag(index)}
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
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
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
                  No tags selected. Click "+" to add tags.
                </span>
              )}
            </div>

            {/* Tag Selector */}
            {showTagSelector && (
              <div
                style={{
                  background: "#fff",
                  border: `2px solid ${COLORS.blue}`,
                  borderRadius: "1rem",
                  padding: "1rem",
                  marginBottom: "1rem",
                  boxShadow: "0 8px 32px rgba(37, 99, 235, 0.1)",
                }}
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      disabled={formData.tags.includes(tag)}
                      style={{
                        background: formData.tags.includes(tag) ? "#e0f2fe" : "#f8fafc",
                        border: "none",
                        borderRadius: "0.5rem",
                        padding: "0.5rem 1rem",
                        margin: "0.25rem",
                        cursor: formData.tags.includes(tag) ? "default" : "pointer",
                        fontSize: "0.9rem",
                        opacity: formData.tags.includes(tag) ? 0.5 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddNewTag} style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={newTagFromDropdown}
                    onChange={(e) => setNewTagFromDropdown(e.target.value)}
                    placeholder="Create new tag..."
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.9rem",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: COLORS.blue,
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.5rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Deadline */}
          <div style={{ marginBottom: "1.5rem" }}>
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
              value={formData.deadline}
              onChange={(e) => updateField("deadline", e.target.value)}
              style={{
                fontSize: "1rem",
                padding: "1rem",
                borderRadius: "1rem",
                border: `2px solid ${COLORS.blue}`,
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Priority */}
          <div style={{ marginBottom: "1.5rem" }}>
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
              value={formData.priority}
              onChange={(e) => updateField("priority", e.target.value)}
              style={{
                fontSize: "1rem",
                padding: "1rem",
                borderRadius: "1rem",
                border: `2px solid ${COLORS.blue}`,
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "1.5rem" }}>
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
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Add a detailed description for your task (optional)"
              style={{
                fontSize: "1rem",
                padding: "1rem",
                borderRadius: "1rem",
                border: `2px solid ${COLORS.blue}`,
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
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              type="submit"
              style={{
                fontWeight: 700,
                fontSize: "1.1rem",
                padding: "1rem 2rem",
                borderRadius: "1rem",
                background: GRADIENTS.blueGradient,
                color: "#fff",
                border: "none",
                boxShadow: COLORS.blueShadow,
                cursor: "pointer",
                flex: 1,
                transition: "all 0.2s ease",
              }}
            >
              {editingTask ? "Update Task" : "Create Task"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: "transparent",
                border: `2px solid ${COLORS.blue}`,
                color: COLORS.blue,
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                padding: "1rem 2rem",
                borderRadius: "1rem",
                transition: "all 0.2s ease",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

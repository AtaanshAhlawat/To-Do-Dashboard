import React, { useState, useRef } from "react";
import { Edit2, Trash2, Plus, X } from "lucide-react";
import { TASK_STATUS, STATUS_COLORS, PRIORITY_COLORS } from "../../constants/taskConstants";
import { COLORS } from "../../constants/uiConstants";
import { formatDate } from "../../utils/dateUtils";

export const TaskRow = ({
  task,
  tags,
  status,
  priority,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePriority,
  onToggleTag,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragged,
  isDragOver,
}) => {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const leaveTimeout = useRef(null);

  const statusColor = STATUS_COLORS[status] || STATUS_COLORS[TASK_STATUS.PENDING];
  
  const priorityColor = {
    low: { bg: "#f0fdf4", color: PRIORITY_COLORS.low, border: PRIORITY_COLORS.low },
    normal: { bg: "#eff6ff", color: PRIORITY_COLORS.normal, border: PRIORITY_COLORS.normal },
    high: { bg: "#fef3c7", color: PRIORITY_COLORS.high, border: PRIORITY_COLORS.high },
  }[priority] || { bg: "#eff6ff", color: PRIORITY_COLORS.normal, border: PRIORITY_COLORS.normal };

  return (
    <tr
      draggable="true"
      onDragStart={(e) => onDragStart(e, task._id)}
      onDragOver={(e) => onDragOver(e, task._id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, task._id)}
      onDragEnd={onDragEnd}
      style={{
        background: isDragOver ? "#bae6fd" : isDragged ? "#f1f5f9" : "transparent",
        cursor: "move",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => {
        clearTimeout(leaveTimeout.current);
        if (!isDragged && !showTagDropdown) {
          e.currentTarget.style.background = isDragOver ? "#bae6fd" : "#f8fafc";
        }
      }}
      onMouseLeave={(e) => {
        leaveTimeout.current = setTimeout(() => {
          if (!isDragged && !isDragOver && !showTagDropdown) {
            e.currentTarget.style.background = "transparent";
          }
        }, 100);
      }}
    >
      {/* Task Name */}
      <td
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #f1f5f9",
          verticalAlign: "middle",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span
            style={{
              textDecoration: status === TASK_STATUS.COMPLETED ? "line-through" : "none",
              color: status === TASK_STATUS.COMPLETED ? "#94a3b8" : "#1e293b",
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

      {/* Priority */}
      <td
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #f1f5f9",
          verticalAlign: "middle",
        }}
      >
        <div
          onClick={() => onTogglePriority(task._id)}
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

      {/* Tags */}
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
            alignItems: "flex-start",
            gap: "0.5rem",
            flexWrap: "wrap",
            minHeight: "40px",
            maxHeight: "120px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", flex: 1 }}>
            {Array.isArray(task.tags) && task.tags.length > 0
              ? task.tags.map((tag) => (
                  <div key={tag} style={{ position: "relative", display: "inline-block" }}>
                    <span
                      style={{
                        background: "#e0f2fe",
                        color: COLORS.blue,
                        padding: "0.25rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        transition: "all 0.2s",
                        border: "1px solid transparent",
                        whiteSpace: "nowrap",
                      }}
                      title={tag}
                    >
                      {tag.length > 10 ? `${tag.substring(0, 8)}...` : tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedTags = task.tags.filter((t) => t !== tag);
                          onToggleTag(task._id, tag);
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
                          width: "14px",
                          height: "14px",
                        }}
                      >
                        ×
                      </button>
                    </span>
                  </div>
                ))
              : null}

            {/* Add Tag Button */}
            <div style={{ position: "relative" }}>
              <button
                data-tag-button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTagDropdown(!showTagDropdown);
                }}
                style={{
                  background: "transparent",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "9999px",
                  padding: "0.35rem",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  width: "28px",
                  height: "28px",
                }}
                title="Add tag to this task"
              >
                <Plus size={14} />
              </button>

              {/* Tag Dropdown */}
              {showTagDropdown && (
                <div
                  data-tag-dropdown
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "0.5rem",
                    background: "#fff",
                    border: `2px solid ${COLORS.blue}`,
                    borderRadius: "0.75rem",
                    padding: "0.75rem",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                    zIndex: 100,
                    minWidth: "200px",
                    maxHeight: "250px",
                    overflowY: "auto",
                  }}
                >
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTag(task._id, tag);
                        setShowTagDropdown(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "0.5rem",
                        background: task.tags?.includes(tag) ? "#e0f2fe" : "transparent",
                        border: "none",
                        borderRadius: "0.5rem",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        transition: "all 0.2s",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Deadline */}
      <td
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #f1f5f9",
          color: "#64748b",
          fontSize: "0.95rem",
          verticalAlign: "middle",
        }}
      >
        {task.deadline ? formatDate(task.deadline) : "-"}
      </td>

      {/* Status */}
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
          onClick={() => onToggleStatus(task._id)}
          title={`Click to change status (${status})`}
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
          {status}
        </div>
      </td>

      {/* Actions */}
      <td
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #f1f5f9",
          textAlign: "center",
          verticalAlign: "middle",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button
            onClick={() => onEdit(task)}
            style={{
              background: "#eff6ff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            title="Edit task"
          >
            <Edit2 size={16} color={COLORS.blue} />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            style={{
              background: "#fef2f2",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            title="Delete task"
          >
            <Trash2 size={16} color="#ef4444" />
          </button>
        </div>
      </td>
    </tr>
  );
};

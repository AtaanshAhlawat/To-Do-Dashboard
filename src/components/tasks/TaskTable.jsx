import React from "react";
import { TaskRow } from "./TaskRow";
import { TASK_STATUS, STATUS_COLORS, PRIORITY_OPTIONS } from "../../constants/taskConstants";
import { GRADIENTS } from "../../constants/uiConstants";
import TableFilter from "../TableFilter";

export const TaskTable = ({
  tasks,
  tags,
  taskStatus,
  taskPriorities,
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
  draggedTask,
  dragOverTask,
  sortConfig,
  filters,
  onSort,
  onFilter,
}) => {
  const statusOptions = Object.values(TASK_STATUS).map((status) => ({
    value: status,
    label: status,
    color: STATUS_COLORS[status],
  }));

  const tagOptions = tags.map((tag) => ({
    value: tag,
    label: tag,
    color: null,
  }));

  return (
    <div
      style={{
        width: "100%",
        background: "#fff",
        borderRadius: "1rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "900px",
        }}
      >
        <thead>
          <tr
            style={{
              background: GRADIENTS.blueGradient,
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
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Task
                <TableFilter
                  column="task"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  filterConfig={filters.task}
                  onFilter={onFilter}
                  filterType="text"
                />
              </div>
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
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Priority
                <TableFilter
                  column="priority"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  filterConfig={filters.priority}
                  onFilter={onFilter}
                  filterType="multiselect"
                  filterOptions={PRIORITY_OPTIONS}
                />
              </div>
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "1rem 1.5rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                minWidth: "280px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Tags
                <TableFilter
                  column="tags"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  filterConfig={filters.tags}
                  onFilter={onFilter}
                  filterType="multiselect"
                  filterOptions={tagOptions}
                />
              </div>
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "1rem 1.5rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                width: "200px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Deadline
                <TableFilter
                  column="deadline"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  filterConfig={filters.deadline}
                  onFilter={onFilter}
                  filterType="date"
                />
              </div>
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "1rem 1.5rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                width: "150px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Status
                <TableFilter
                  column="status"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  filterConfig={filters.status}
                  onFilter={onFilter}
                  filterType="multiselect"
                  filterOptions={statusOptions}
                />
              </div>
            </th>
            <th
              style={{
                textAlign: "center",
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
          {tasks.map((task) => (
            <TaskRow
              key={task._id}
              task={task}
              tags={tags}
              status={taskStatus[task._id] || TASK_STATUS.PENDING}
              priority={taskPriorities[task._id] || "normal"}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onTogglePriority={onTogglePriority}
              onToggleTag={onToggleTag}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              isDragged={draggedTask === task._id}
              isDragOver={dragOverTask === task._id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

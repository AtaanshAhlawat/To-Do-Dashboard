// Task status options
export const TASK_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

// Status colors for UI
export const STATUS_COLORS = {
  [TASK_STATUS.PENDING]: "#f59e0b",
  [TASK_STATUS.IN_PROGRESS]: "#3b82f6",
  [TASK_STATUS.COMPLETED]: "#10b981",
  [TASK_STATUS.REJECTED]: "#ef4444",
};

// Priority options
export const PRIORITY_LEVELS = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
};

// Priority colors
export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.LOW]: "#16a34a",
  [PRIORITY_LEVELS.NORMAL]: "#0369a1",
  [PRIORITY_LEVELS.HIGH]: "#f59e0b",
};

// Priority options for filters/UI
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: PRIORITY_COLORS.low },
  { value: 'normal', label: 'Normal', color: PRIORITY_COLORS.normal },
  { value: 'high', label: 'High', color: PRIORITY_COLORS.high }
];

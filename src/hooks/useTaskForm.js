import { useState } from "react";

/**
 * Custom hook for task form state management
 */
export const useTaskForm = (initialTask = null) => {
  const [formData, setFormData] = useState({
    text: initialTask?.text || "",
    description: initialTask?.description || "",
    tags: initialTask?.tags || [],
    deadline: initialTask?.deadline || "",
    priority: initialTask?.priority || "normal",
  });

  const [showTagSelector, setShowTagSelector] = useState(false);
  const [newTagFromDropdown, setNewTagFromDropdown] = useState("");

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const removeTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      text: "",
      description: "",
      tags: [],
      deadline: "",
      priority: "normal",
    });
    setShowTagSelector(false);
    setNewTagFromDropdown("");
  };

  const loadTask = (task) => {
    setFormData({
      text: task.text,
      description: task.description || "",
      tags: task.tags || [],
      deadline: task.deadline || "",
      priority: task.priority || "normal",
    });
  };

  return {
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
  };
};

import { useState, useEffect, useRef } from 'react';
import Auth from './Auth';
import { Trash2, Edit2, Plus, Check, X, User } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useTaskStore } from './store/taskStore';
import { useUIStore } from './store/uiStore';

function App() {
  // Auto-fix: clear old persisted data if schema is wrong
  useEffect(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem('task-storage'));
      if (persisted && Array.isArray(persisted.tasks) && persisted.tasks.some(t => t.category && !t.tags)) {
        localStorage.clear();
        window.location.reload();
      }
    } catch {}
  }, []);

  // Zustand stores
  const { user, token, logout } = useAuthStore();
  const { tasks, loadTasks, addTask: addTaskStore, updateTask: updateTaskStore, deleteTask: deleteTaskStore, loading: tasksLoading, error: tasksError, clear: clearTasks } = useTaskStore();
  const { loading: uiLoading, error: uiError, setError: setUIError } = useUIStore();

  // Local UI state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClick(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);
  const [newTask, setNewTask] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingTags, setEditingTags] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Personal']);
  const [tags, setTags] = useState(['Personal', 'Work', 'Urgent']);
  const [newTag, setNewTag] = useState('');
  const [tagFilter, setTagFilter] = useState([]); // Multi-tag filter
  const [newDescription, setNewDescription] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Load tasks on mount if logged in
  useEffect(() => {
    if (token) loadTasks();
  }, [token, loadTasks]);

  // Always sync tag list with all unique tags from tasks
  useEffect(() => {
    const allTags = Array.from(new Set(tasks.flatMap(t => Array.isArray(t.tags) ? t.tags : [])));
    const defaultTags = ['Personal', 'Work', 'Urgent'];
    const merged = Array.from(new Set([...defaultTags, ...allTags]));
    setTags(merged);
  }, [tasks]);

  // Add a new task to backend
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    const task = {
      text: newTask.trim(),
      completed: false,
      tags: Array.isArray(selectedTags) ? selectedTags : [],
      description: typeof newDescription === 'string' ? newDescription : '',
      created: new Date().toISOString()
    };
    await addTaskStore(task);
    setNewTask('');
    setShowAdd(false);
    setSelectedTags([]);
    setNewDescription('');
  };


  // Toggle completion in backend
  const toggleTask = async (id) => {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    await updateTaskStore(id, { completed: !task.completed });
  };

  // Delete from backend
  const handleDeleteTask = async (id) => {
    await deleteTaskStore(id);
  };

  // Start editing
  const startEditing = (id, text, description = '', tags = []) => {
    setEditingId(id);
    setEditingText(text);
    setEditingDescription(description || '');
    setEditingTags(tags || []);
  };

  // Save edit to backend
  const saveEdit = async () => {
    if (!editingText.trim()) return;
    await updateTaskStore(editingId, {
      text: editingText.trim(),
      description: editingDescription,
      tags: editingTags
    });
    setEditingId(null);
    setEditingText('');
    setEditingDescription('');
    setEditingTags([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingDescription('');
    setEditingTags([]);
  };

  const filtered = tasks.filter(t =>
    (filter === 'active' ? !t.completed :
     filter === 'completed' ? t.completed : true) &&
    t.text.toLowerCase().includes(search.toLowerCase()) &&
    (tagFilter.length === 0 ? true : (t.tags && t.tags.some(tag => tagFilter.includes(tag))))
  );

  const tagTasks = tagFilter.length === 0
    ? tasks
    : tasks.filter(t => t.tags && t.tags.some(tag => tagFilter.includes(tag)));

  const tagActive = tagTasks.filter(t => !t.completed).length;
  const tagComplete = tagTasks.filter(t => t.completed).length;
  const tagPercent = tagTasks.length ? Math.round((tagComplete / tagTasks.length) * 100) : 0;

  const blue = "#2563eb"
  const blueLight = "#3b82f6"
  const blueGradient = `linear-gradient(90deg, ${blue} 60%, ${blueLight} 100%)`
  const blueShadow = "0 2px 12px #2563eb33"

  useEffect(() => {
    if (showAdd) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAdd]);

  if (!token) return <Auth onAuth={loadTasks} />;

  return (
    <>
      {/* Profile Icon Top Right */}
      {user && (
        <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowProfileMenu(v => !v)}
                aria-label="Profile menu"
              >
                <User size={32} color="#18192b" />
              </button>
              {showProfileMenu && (
                <div ref={profileMenuRef} style={{
                  position: 'absolute', top: 40, right: 0, background: '#fff', boxShadow: '0 2px 12px #0001', borderRadius: 8, padding: '0.5rem 1.5rem', minWidth: 120
                }}>
                  <button
                    style={{ background: 'none', border: 'none', color: '#c43cff', fontWeight: 700, cursor: 'pointer', fontSize: 16, padding: 0 }}
                    onClick={() => { setShowProfileMenu(false); logout(); }}
                  >Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "#f5faff",
      padding: "2rem 1rem",
      boxSizing: "border-box",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "min(1200px, 90vw)",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem"
      }}>
        {/* Header Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
          alignItems: "start"
        }}>
          {/* Progress Card */}
          <div style={{
            background: "#fff",
            border: `2px solid ${blue}`,
            borderRadius: "1.5rem",
            boxShadow: blueShadow,
            padding: "2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div style={{
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
              fontWeight: 700
            }}>
              <span>{tagPercent}%</span>
            </div>
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: blue, marginBottom: "0.5rem" }}>
                {tagFilter.length === 0
                  ? `You have ${tagActive} task${tagActive !== 1 ? 's' : ''} to complete.`
                  : `You have ${tagActive} ${tagFilter.join(', ')} task${tagActive !== 1 ? 's' : ''} to complete.`}
              </div>
              <div style={{ color: "#666", fontSize: "1.1rem" }}>
                {tagComplete === 0
                  ? "No tasks completed yet. Keep going!"
                  : `${tagComplete} completed! Great job!`}
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search for task..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                fontSize: "1.2rem",
                padding: "1rem 1.5rem",
                borderRadius: "1rem",
                width: "100%",
                border: `2px solid ${blueLight}`,
                background: "#fff",
                boxSizing: "border-box"
              }}
            />

            {/* Category Label */}
            <div style={{
              fontSize: "1.2rem",
              padding: "0.8rem 1.5rem",
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e0edff",
              color: blue,
              fontWeight: 700,
              boxShadow: blueShadow
            }}>
              <User size={24} style={{ marginRight: "0.5rem" }} />
              {tagFilter.length === 0
                ? `All Tasks (${filtered.length})`
                : `${tagFilter.join(', ')} (${filtered.length})`}
            </div>

            {/* Tag Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tagFilter.includes(tag)
                    ? tagFilter.filter(t => t !== tag)
                    : [...tagFilter, tag])}
                  style={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '1rem',
                    border: tagFilter.includes(tag) ? 'none' : `2px solid ${blueLight}`,
                    background: tagFilter.includes(tag) ? blueGradient : '#fff',
                    color: tagFilter.includes(tag) ? '#fff' : blue,
                    boxShadow: tagFilter.includes(tag) ? blueShadow : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: 4
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          {['all', 'active', 'completed'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              style={{
                fontSize: "1.1rem",
                padding: "0.8rem 2rem",
                borderRadius: "1rem",
                fontWeight: 700,
                background: filter === filterType ? blueGradient : "#fff",
                color: filter === filterType ? "#fff" : blue,
                border: `2px solid ${blue}`,
                boxShadow: filter === filterType ? blueShadow : "none",
                transition: "all 0.2s",
                minWidth: "120px"
              }}
            >
              {filterType === 'all' ? 'All' : filterType === 'active' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Tasks Section */}
        {filtered.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            margin: "4rem 0",
            padding: "3rem",
            background: "#fff",
            borderRadius: "1.5rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05)"
          }}>
            <h3 style={{ fontSize: "1.8rem", fontWeight: 700, color: blue, marginBottom: "1rem" }}>
              You don't have any tasks yet
            </h3>
            <p style={{ color: "#666", fontSize: "1.2rem" }}>
              Click on the <strong>+</strong> button to add one
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "1.5rem",
            width: "100%"
          }}>
            {console.log('TASKS FOR RENDER', tasks)}
{filtered.map(task => (
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
                  transition: "transform 0.2s, box-shadow 0.2s, padding 0.2s",
                  cursor: "pointer"
                }}
                onClick={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(37, 99, 235, 0.3)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(37, 99, 235, 0.2)"
                }}
              >
                {/* Collapsed view: only show main info */}
                {expandedTaskId !== task._id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); toggleTask(task._id); }}
                      style={{ accentColor: "#fff", width: 20, height: 20, marginTop: "2px", cursor: "pointer" }}
                      title={task.completed ? "Mark as pending" : "Mark as completed"}
                    />
                    <div style={{ flex: 1, fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.4, textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.7 : 1 }}>
                      {task.text}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(() => {
                        const tags = Array.isArray(task.tags) ? task.tags : [];
                        if (tags.length > 0) {
                          return <>
                            {tags.slice(0, 2).map(tag => (
                              <span key={tag} style={{ background: "#fff", color: blue, fontWeight: 700, borderRadius: "0.75rem", padding: "0.3rem 0.8rem", fontSize: "0.9rem" }}>{tag}</span>
                            ))}
                            {tags.length > 2 && <span style={{ background: "#fff", color: blue, borderRadius: "0.75rem", padding: "0.3rem 0.8rem", fontSize: "0.9rem" }}>+{tags.length-2}</span>}
                          </>;
                        }
                        return <span style={{ background: "#fff", color: blue, fontWeight: 500, borderRadius: "0.75rem", padding: "0.3rem 0.8rem", fontSize: "0.9rem", opacity: 0.6 }}>[No tags]</span>;
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
                          onClick={e => e.stopPropagation()}
                          onChange={e => setEditingText(e.target.value)}
                          placeholder="Task name"
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            borderRadius: "0.75rem",
                            border: `2px solid ${blue}`,
                            padding: "0.75rem 1rem",
                            marginBottom: 10,
                            width: "100%"
                          }}
                        />
                        <textarea
                          value={editingDescription}
                          onClick={e => e.stopPropagation()}
                          onChange={e => setEditingDescription(e.target.value)}
                          placeholder="Description (optional)"
                          style={{
                            fontSize: "1rem",
                            padding: "0.75rem",
                            borderRadius: "0.75rem",
                            border: `2px solid ${blue}`,
                            width: "100%",
                            minHeight: 60,
                            boxSizing: "border-box",
                            margin: "0.5rem 0"
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                          {tags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={e => { e.stopPropagation(); setEditingTags(editingTags.includes(tag)
                                ? editingTags.filter(t => t !== tag)
                                : [...editingTags, tag]); }}
                              style={{
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                padding: "0.3rem 1.1rem",
                                borderRadius: "0.75rem",
                                border: editingTags.includes(tag) ? "none" : `2px solid ${blue}`,
                                background: editingTags.includes(tag) ? blueGradient : "#fff",
                                color: editingTags.includes(tag) ? "#fff" : blue,
                                boxShadow: editingTags.includes(tag) ? blueShadow : "none",
                                cursor: "pointer",
                                marginBottom: 2
                              }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button
                            onClick={async e => {
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
                              cursor: "pointer"
                            }}
                          >Save</button>
                          <button
                            onClick={e => { e.stopPropagation(); cancelEdit(); }}
                            style={{
                              background: "#fff",
                              color: blue,
                              border: `2px solid ${blue}`,
                              borderRadius: "0.5rem",
                              padding: "0.6rem 1.4rem",
                              fontWeight: 700,
                              fontSize: "1rem",
                              cursor: "pointer"
                            }}
                          >Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onClick={e => e.stopPropagation()}
                            onChange={e => { e.stopPropagation(); toggleTask(task._id); }}
                            style={{ accentColor: "#fff", width: 20, height: 20, marginTop: "2px", cursor: "pointer" }}
                            title={task.completed ? "Mark as pending" : "Mark as completed"}
                          />
                          <div style={{ flex: 1, fontWeight: 700, fontSize: "1.3rem", lineHeight: 1.4, textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.7 : 1 }}>
                            {task.text}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0.5rem 0' }}>
                          {(() => {
                            const tags = Array.isArray(task.tags) ? task.tags : [];
                            if (tags.length > 0) {
                              return tags.map(tag => (
                                <span key={tag} style={{ background: "#fff", color: blue, fontWeight: 700, borderRadius: "0.75rem", padding: "0.3rem 1.1rem", fontSize: "0.95rem", marginBottom: 2 }}>{tag}</span>
                              ));
                            }
                            return <span style={{ background: "#fff", color: blue, fontWeight: 500, borderRadius: "0.75rem", padding: "0.3rem 1.1rem", fontSize: "0.95rem", marginBottom: 2, opacity: 0.6 }}>[No tags]</span>;
                          })()}
                        </div>
                        <div style={{ background: "#fff", color: blue, borderRadius: 12, padding: '1rem', margin: '0.5rem 0', fontSize: '1.05rem', fontWeight: 500, opacity: 0.95 }}>
                          {(() => {
                            const description = typeof task.description === 'string' ? task.description : '';
                            return description || <span style={{ opacity: 0.5 }}>[No description]</span>;
                          })()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                          <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                            {(() => {
                              const d = new Date(task.created);
                              const dateStr = d.toLocaleString('en-US', {
                                month: 'long', day: 'numeric', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', hour12: true
                              });
                              const [date, time] = dateStr.split(', ');
                              return `${date} (${time && time.replace(/\s/, '').toLowerCase()})`;
                            })()}
                          </span>
                          <button 
                            onClick={e => { e.stopPropagation(); startEditing(task._id, task.text, task.description, task.tags); }}
                            style={{
                              background: "rgba(255,255,255,0.2)",
                              border: "none",
                              borderRadius: "0.5rem",
                              padding: "0.5rem",
                              color: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={e => { e.stopPropagation(); handleDeleteTask(task._id); }}
                            style={{
                              background: "rgba(255,255,255,0.2)",
                              border: "none",
                              borderRadius: "0.5rem",
                              padding: "0.5rem",
                              color: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
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
            ))}
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
          transition: "transform 0.2s, box-shadow 0.2s"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.1)"
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(37, 99, 235, 0.4)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(37, 99, 235, 0.3)"
        }}
      >
        <Plus size={32} />
      </button>

      {/* Add Task Modal */}
      {showAdd && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem",
          boxSizing: "border-box"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "1.5rem",
            boxShadow: "0 20px 80px rgba(0, 0, 0, 0.3)",
            padding: "2rem",
            width: "100%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflowY: "auto",
            margin: "0 auto",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}>
            <h2 style={{ 
              color: blue, 
              fontSize: "1.8rem", 
              fontWeight: 700, 
              textAlign: "center", 
              margin: 0 
            }}>
              Add New Task
            </h2>
            
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Task Name *"
              style={{
                fontSize: "1.1rem",
                padding: "1rem",
                borderRadius: "1rem",
                border: `2px solid ${blue}`,
                width: "100%",
                boxSizing: "border-box"
              }}
            />
            
            <div style={{ 
              display: "flex", 
              gap: "0.75rem", 
              flexWrap: "wrap",
              width: "100%" 
            }}>
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(selectedTags.includes(tag)
                    ? selectedTags.filter(t => t !== tag)
                    : [...selectedTags, tag])}
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "1rem",
                    border: selectedTags.includes(tag) ? "none" : `2px solid ${blue}`,
                    background: selectedTags.includes(tag) ? blueGradient : "#fff",
                    color: selectedTags.includes(tag) ? "#fff" : blue,
                    boxShadow: selectedTags.includes(tag) ? blueShadow : "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Description field */}
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              style={{
                fontSize: "1rem",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `2px solid ${blue}`,
                width: "100%",
                minHeight: 60,
                boxSizing: "border-box",
                margin: "0.5rem 0"
              }}
            />
            
            <div style={{
              display: "flex",
              gap: "0.75rem",
              width: "100%"
            }}>
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add new tag"
                style={{
                  fontSize: "1rem",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: `2px solid ${blue}`,
                  flex: 1,
                  minWidth: 0,
                  boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newTag.trim() && !tags.includes(newTag.trim())) {
                    setTags([...tags, newTag.trim()]);
                    setNewTag('');
                  }
                }}
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.75rem",
                  background: blueGradient,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                Add Tag
              </button>
            </div>
            
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "1rem", 
              justifyContent: "space-between"
            }}>
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
                  flex: 1
                }}
                onClick={handleAddTask}
              >
                Create Task
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: blue,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "1rem"
                }}
                onClick={() => setShowAdd(false)}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default App
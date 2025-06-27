import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, Check, X, User } from 'lucide-react'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('Personal')
  const [tags, setTags] = useState(['Personal', 'Work', 'Urgent'])
  const [newTag, setNewTag] = useState('')
  const [tagFilter, setTagFilter] = useState('All Tags')

  useEffect(() => {
    const saved = localStorage.getItem('todoTasks')
    if (saved) setTasks(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('todoTasks', JSON.stringify(tasks))
  }, [tasks])

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
        category: selectedTag,
        created: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ])
    setNewTask('')
    setShowAdd(false)
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const startEditing = (id, text) => {
    setEditingId(id)
    setEditingText(text)
  }

  const saveEdit = () => {
    if (!editingText.trim()) return
    setTasks(tasks.map(t => t.id === editingId ? { ...t, text: editingText.trim() } : t))
    setEditingId(null)
    setEditingText('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }

  const filtered = tasks.filter(t =>
    (filter === 'active' ? !t.completed :
     filter === 'completed' ? t.completed : true) &&
    t.text.toLowerCase().includes(search.toLowerCase()) &&
    (tagFilter === 'All Tags' ? true : t.category === tagFilter)
  )

  const tagTasks = tagFilter === 'All Tags'
    ? tasks
    : tasks.filter(t => t.category === tagFilter)

  const tagActive = tagTasks.filter(t => !t.completed).length
  const tagComplete = tagTasks.filter(t => t.completed).length
  const tagPercent = tagTasks.length ? Math.round((tagComplete / tagTasks.length) * 100) : 0

  const blue = "#2563eb"
  const blueLight = "#3b82f6"
  const blueGradient = `linear-gradient(90deg, ${blue} 60%, ${blueLight} 100%)`
  const blueShadow = "0 2px 12px #2563eb33"

  useEffect(() => {
    if (showAdd) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [showAdd]);

  return (
    <div className="main-bg" style={{
      minHeight: "100vh",
      minWidth: "100vw",
      background: "#f5faff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div className="center-content" style={{
        width: "100vw",
        maxWidth: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        padding: 0,
        boxSizing: "border-box"
      }}>
        <div className="progress-card" style={{
          margin: "0 auto 2em auto",
          textAlign: "center",
          background: "#fff",
          border: `2px solid ${blue}`,
          borderRadius: 28,
          boxShadow: blueShadow,
          width: "100%",
          maxWidth: 420,
          minWidth: 0,
          boxSizing: "border-box"
        }}>
          <div className="progress-circle" style={{
            margin: "0 auto 1em auto",
            width: 80,
            height: 80,
            fontSize: "1.5em",
            background: "#e0edff",
            color: blue,
            border: `2px solid ${blueLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            fontWeight: 700
          }}>
            <span>{tagPercent}%</span>
          </div>
          <div>
            <b style={{ fontSize: "1.3em", color: blue }}>
              {tagFilter === 'All Tags'
                ? `You have ${tagActive} task${tagActive !== 1 ? 's' : ''} to complete.`
                : `You have ${tagActive} ${tagFilter} task${tagActive !== 1 ? 's' : ''} to complete.`}
            </b>
            <div style={{ color: "#3b3b3b", fontSize: "1.1em", marginTop: 4 }}>
              {tagComplete === 0
                ? "No tasks completed yet. Keep going!"
                : `${tagComplete} completed! Great job!`}
            </div>
          </div>
        </div>

        <div className="search-row" style={{
          justifyContent: "center",
          marginBottom: 24,
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box"
        }}>
          <input
            className="search-input"
            type="text"
            placeholder="Search for task..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              fontSize: "1.3em",
              padding: "1.2em 1.7em",
              borderRadius: 22,
              width: "100%",
              border: `2px solid ${blueLight}`,
              background: "#fff",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div className="category-label" style={{
          fontSize: "1.3em",
          padding: "0.8em 2.2em",
          borderRadius: 22,
          margin: "0 auto 2em auto",
          display: "inline-flex",
          alignItems: "center",
          background: "#e0edff",
          color: blue,
          fontWeight: 700,
          boxShadow: blueShadow
        }}>
          <User size={26} style={{ marginRight: 10 }} />
          Personal ({filtered.length})
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 24,
          gap: 16,
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box"
        }}>
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            style={{
              fontSize: "1.1em",
              padding: "0.7em 1.5em",
              borderRadius: 16,
              border: `2px solid ${blueLight}`,
              background: "#fff",
              color: blue,
              fontWeight: 600,
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <option value="All Tags">All Tags</option>
            {tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Filter Row */}
        <div className="filter-row" style={{
          display: 'flex',
          gap: '1em',
          justifyContent: "center",
          margin: '2em 0 2.5em 0',
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
          flexWrap: "wrap"
        }}>
          <button
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
            style={{
              fontSize: "1.1em",
              padding: "0.7em 1.2em",
              borderRadius: 18,
              fontWeight: 700,
              background: filter === 'all' ? blueGradient : "#fff",
              color: filter === 'all' ? "#fff" : blue,
              border: `2px solid ${blue}`,
              boxShadow: filter === 'all' ? blueShadow : "none",
              transition: "all 0.2s",
              flex: 1,
              minWidth: 100,
              maxWidth: "100%"
            }}
          >
            All
          </button>
          <button
            className={filter === 'active' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('active')}
            style={{
              fontSize: "1.1em",
              padding: "0.7em 1.2em",
              borderRadius: 18,
              fontWeight: 700,
              background: filter === 'active' ? blueGradient : "#fff",
              color: filter === 'active' ? "#fff" : blue,
              border: `2px solid ${blue}`,
              boxShadow: filter === 'active' ? blueShadow : "none",
              transition: "all 0.2s",
              flex: 1,
              minWidth: 100,
              maxWidth: "100%"
            }}
          >
            Pending
          </button>
          <button
            className={filter === 'completed' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('completed')}
            style={{
              fontSize: "1.1em",
              padding: "0.7em 1.2em",
              borderRadius: 18,
              fontWeight: 700,
              background: filter === 'completed' ? blueGradient : "#fff",
              color: filter === 'completed' ? "#fff" : blue,
              border: `2px solid ${blue}`,
              boxShadow: filter === 'completed' ? blueShadow : "none",
              transition: "all 0.2s",
              flex: 1,
              minWidth: 100,
              maxWidth: "100%"
            }}
          >
            Completed
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ textAlign: "center", margin: "3em 0" }}>
            <h3 style={{ fontSize: "1.3em", fontWeight: 700, color: blue }}>You don't have any tasks yet</h3>
            <p style={{ color: "#3b3b3b", fontSize: "1.1em" }}>Click on the <b>+</b> button to add one</p>
          </div>
        ) : (
          <ul className="todo-list" style={{
            width: "100vw",
            maxWidth: "100vw",
            margin: 0,
            padding: 0,
            boxSizing: "border-box"
          }}>
            {filtered.map(task => (
              <li
                key={task.id}
                className={`todo-card${task.completed ? " completed" : ""}`}
                style={{
                  background: blueGradient,
                  color: "#fff",
                  borderRadius: 22,
                  fontSize: "1.1em",
                  marginBottom: 24,
                  boxShadow: "0 8px 48px 0 #2563eb33",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.2em 1.2em",
                  minHeight: 80,
                  textAlign: "center",
                  width: "100%",
                  maxWidth: "100vw",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center" }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: "1em",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.7em",
                    justifyContent: "center"
                  }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      style={{ accentColor: "#fff", width: 22, height: 22, marginRight: 10 }}
                      title={task.completed ? "Mark as pending" : "Mark as completed"}
                    />
                    {editingId === task.id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") saveEdit()
                          else if (e.key === "Escape") cancelEdit()
                        }}
                        autoFocus
                        style={{ fontSize: "1em", borderRadius: 10, border: "none", padding: 8, width: "60vw", maxWidth: 200 }}
                      />
                    ) : (
                      task.text
                    )}
                  </span>
                  <div style={{ marginTop: 12 }}>
                    <span className="category-chip" style={{
                      background: "#fff",
                      color: blue,
                      fontWeight: 700,
                      borderRadius: 14,
                      padding: "0.3em 1em",
                      fontSize: "0.95em",
                      boxShadow: "0 2px 8px #b6d3ff33",
                      gap: "0.5em",
                      display: "inline-flex",
                      alignItems: "center"
                    }}>
                      <User size={16} /> {task.category}
                    </span>
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  minWidth: 80
                }}>
                  <span style={{ fontSize: "0.95em", opacity: 0.8, marginBottom: 10 }}>
                    today {task.created}
                  </span>
                  <div style={{ display: "flex", gap: "0.5em" }}>
                    {editingId === task.id ? (
                      <>
                        <button className="icon-btn" onClick={saveEdit}><Check size={22} /></button>
                        <button className="icon-btn" onClick={cancelEdit}><X size={22} /></button>
                      </>
                    ) : (
                      <>
                        <button className="icon-btn" onClick={() => startEditing(task.id, task.text)}><Edit2 size={22} /></button>
                        <button className="icon-btn" onClick={() => deleteTask(task.id)}><Trash2 size={22} /></button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating Add Button */}
      <button className="fab" onClick={() => setShowAdd(true)} style={{
        position: "fixed",
        right: "2.5em",
        bottom: "2.5em",
        width: 70,
        height: 70,
        background: blueGradient,
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        boxShadow: "0 4px 32px #2563eb33",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2.2em",
        cursor: "pointer",
        zIndex: 10
      }}>
        <Plus size={44} />
      </button>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="modal-bg">
          <div className="modal-card">
            <h2 style={{ color: "#2563eb", fontSize: "2em", fontWeight: 700, textAlign: "center", marginBottom: "1em" }}>
              Add New Task
            </h2>
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Task Name *"
              style={{
                fontSize: "1.1em",
                padding: "0.8em",
                borderRadius: "14px",
                border: "2px solid #2563eb",
                marginBottom: "1em",
                width: "100%",
                boxSizing: "border-box"
              }}
            />
            <div className="tag-btn-group" style={{ display: "flex", gap: "0.7em", marginBottom: "1em", flexWrap: "wrap", width: "100%" }}>
              {tags.map(tag => (
                <button
                  key={tag}
                  className={selectedTag === tag ? "tag-btn selected" : "tag-btn"}
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    fontWeight: 700,
                    fontSize: "1em",
                    padding: "0.5em 1.2em",
                    borderRadius: "12px",
                    border: selectedTag === tag ? "none" : "2px solid #2563eb",
                    background: selectedTag === tag ? "linear-gradient(90deg, #2563eb 60%, #3b82f6 100%)" : "#fff",
                    color: selectedTag === tag ? "#fff" : "#2563eb",
                    boxShadow: selectedTag === tag ? "0 2px 8px #2563eb33" : "none",
                    cursor: "pointer"
                  }}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="tag-input-row" style={{ display: "flex", gap: "0.7em", marginBottom: "1em", width: "100%" }}>
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add new tag"
                style={{
                  fontSize: "1em",
                  padding: "0.5em 1em",
                  borderRadius: "10px",
                  border: "2px solid #2563eb",
                  flex: 1,
                  minWidth: 0
                }}
              />
              <button
                className="tag-btn"
                type="button"
                onClick={() => {
                  if (newTag.trim() && !tags.includes(newTag.trim())) {
                    setTags([...tags, newTag.trim()]);
                    setNewTag('');
                  }
                }}
                style={{
                  fontWeight: 700,
                  fontSize: "1em",
                  padding: "0.5em 1.2em",
                  borderRadius: "12px",
                  background: "linear-gradient(90deg, #2563eb 60%, #3b82f6 100%)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  minWidth: 0
                }}
              >
                Add Tag
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1em", marginTop: "1em" }}>
              <button
                className="create-btn"
                style={{
                  fontWeight: 700,
                  fontSize: "1.1em",
                  padding: "0.7em 2em",
                  borderRadius: "12px",
                  background: "linear-gradient(90deg, #2563eb 60%, #3b82f6 100%)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 2px 8px #2563eb33",
                  cursor: "pointer"
                }}
                onClick={addTask}
              >
                Create Task
              </button>
              <button
                className="close-btn"
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "1em",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                onClick={() => setShowAdd(false)}
              >
                &#10005; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
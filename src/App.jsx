import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, Check, X, User, Filter } from 'lucide-react'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [search, setSearch] = useState('') // Add this state at the top
  const [selectedTag, setSelectedTag] = useState('Personal')
  const [tags, setTags] = useState(['Personal', 'Work', 'Urgent']) // Manage tags in state
  const [newTag, setNewTag] = useState('') // Manage new tag input
  const [tagFilter, setTagFilter] = useState('All Tags')
  const category = "Personal"

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

  // Update filtered logic to include tag filtering
  const filtered = tasks.filter(t =>
    (filter === 'active' ? !t.completed :
     filter === 'completed' ? t.completed : true) &&
    t.text.toLowerCase().includes(search.toLowerCase()) &&
    (tagFilter === 'All Tags' ? true : t.category === tagFilter)
  )

  // Calculate progress for the selected tag filter
  const tagTasks = tagFilter === 'All Tags'
    ? tasks
    : tasks.filter(t => t.category === tagFilter)

  const tagActive = tagTasks.filter(t => !t.completed).length
  const tagComplete = tagTasks.filter(t => t.completed).length
  const tagPercent = tagTasks.length ? Math.round((tagComplete / tagTasks.length) * 100) : 0

  const active = tasks.filter(t => !t.completed).length
  const complete = tasks.filter(t => t.completed).length
  const percent = tasks.length ? Math.round((complete / tasks.length) * 100) : 0

  // Blue theme colors
  const blue = "#2563eb"
  const blueLight = "#3b82f6"
  const blueGradient = `linear-gradient(90deg, ${blue} 60%, ${blueLight} 100%)`
  const blueShadow = "0 2px 12px #2563eb33"

  return (
    <div className="main-bg" style={{ minHeight: "100vh", paddingBottom: 80, background: "#f5faff" }}>
      <header className="greeting" style={{ justifyContent: "center", textAlign: "center" }}>
        <span role="img" aria-label="wave" style={{ fontSize: 40, marginRight: 16 }}>👋</span>
        <div>
          <h2 style={{ fontSize: "2.8em", fontWeight: 800, marginBottom: 8, color: blue }}>Good morning</h2>
          <p style={{ fontSize: "1.3em", color: "#3b3b3b" }}>Make every moment count.</p>
        </div>
      </header>

      <div className="center-content" style={{ alignItems: "center", marginTop: 24 }}>
        <div className="progress-card" style={{
          margin: "0 auto 2em auto",
          textAlign: "center",
          minWidth: 340,
          background: "#fff",
          border: `2px solid ${blue}`,
          borderRadius: 28,
          boxShadow: blueShadow
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

        <div className="search-row" style={{ justifyContent: "center", marginBottom: 24 }}>
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
              width: 350,
              maxWidth: "90%",
              border: `2px solid ${blueLight}`,
              background: "#fff"
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

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, gap: 16 }}>
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
              fontWeight: 600
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
          gap: '2em',
          justifyContent: "center",
          margin: '2em 0 2.5em 0'
        }}>
          <button
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
            style={{
              fontSize: "1.3em",
              padding: "0.9em 2.7em",
              borderRadius: 22,
              fontWeight: 700,
              background: filter === 'all' ? blueGradient : "#fff",
              color: filter === 'all' ? "#fff" : blue,
              border: `2px solid ${blue}`,
              boxShadow: filter === 'all' ? blueShadow : "none",
              transition: "all 0.2s"
            }}
          >
            All
          </button>
          <button
            className={filter === 'active' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('active')}
            style={{
              fontSize: "1.3em",
              padding: "0.9em 2.7em",
              borderRadius: 22,
              fontWeight: 700,
              background: filter === 'active' ? blueGradient : "#fff",
              color: filter === 'active' ? "#fff" : blue,
              border: `2px solid ${blue}`,
              boxShadow: filter === 'active' ? blueShadow : "none",
              transition: "all 0.2s"
            }}
          >
            Pending
          </button>
          <button
            className={filter === 'completed' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('completed')}
            style={{
              fontSize: "1.3em",
              padding: "0.9em 2.7em",
              borderRadius: 22,
              fontWeight: 700,
              background: filter === 'completed' ? blueGradient : "#fff",
              color: filter === 'completed' ? "#fff" : blue,
              border: `2px solid ${blue}`,
              boxShadow: filter === 'completed' ? blueShadow : "none",
              transition: "all 0.2s"
            }}
          >
            Completed
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ textAlign: "center", margin: "3em 0" }}>
            <h3 style={{ fontSize: "1.7em", fontWeight: 700, color: blue }}>You don't have any tasks yet</h3>
            <p style={{ color: "#3b3b3b", fontSize: "1.3em" }}>Click on the <b>+</b> button to add one</p>
          </div>
        ) : (
          <ul className="todo-list" style={{ width: "100%", maxWidth: 750, margin: "0 auto" }}>
            {filtered.map(task => (
              <li
                key={task.id}
                className={`todo-card${task.completed ? " completed" : ""}`}
                style={{
                  background: blueGradient,
                  color: "#fff",
                  borderRadius: 32,
                  fontSize: "1.4em",
                  marginBottom: 34,
                  boxShadow: "0 8px 48px 0 #2563eb33",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "2.2em 2.7em 1.7em 2.2em",
                  minHeight: 100,
                  textAlign: "center"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center" }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: "1.3em",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.9em",
                    justifyContent: "center"
                  }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      style={{ accentColor: "#fff", width: 26, height: 26, marginRight: 12 }}
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
                        style={{ fontSize: "1.1em", borderRadius: 10, border: "none", padding: 10, width: 220 }}
                      />
                    ) : (
                      task.text
                    )}
                  </span>
                  <div style={{ marginTop: 16 }}>
                    <span className="category-chip" style={{
                      background: "#fff",
                      color: blue,
                      fontWeight: 700,
                      borderRadius: 18,
                      padding: "0.4em 1.4em",
                      fontSize: "1.1em",
                      boxShadow: "0 2px 8px #b6d3ff33",
                      gap: "0.7em",
                      display: "inline-flex",
                      alignItems: "center"
                    }}>
                      <User size={18} /> {task.category}
                    </span>
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  minWidth: 140
                }}>
                  <span style={{ fontSize: "1.1em", opacity: 0.8, marginBottom: 16 }}>
                    today {task.created}
                  </span>
                  <div style={{ display: "flex", gap: "0.7em" }}>
                    {editingId === task.id ? (
                      <>
                        <button className="icon-btn" onClick={saveEdit}><Check size={26} /></button>
                        <button className="icon-btn" onClick={cancelEdit}><X size={26} /></button>
                      </>
                    ) : (
                      <>
                        <button className="icon-btn" onClick={() => startEditing(task.id, task.text)}><Edit2 size={26} /></button>
                        <button className="icon-btn" onClick={() => deleteTask(task.id)}><Trash2 size={26} /></button>
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
        width: 90,
        height: 90,
        background: blueGradient,
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        boxShadow: "0 4px 32px #2563eb33",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "3em",
        cursor: "pointer",
        zIndex: 10
      }}>
        <Plus size={44} />
      </button>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="modal-bg">
          <div className="modal-card" style={{
            minWidth: 380,
            padding: "2.7em 2.7em 2.2em 2.7em",
            background: "#fff",
            borderRadius: 24,
            boxShadow: "0 8px 48px #2563eb33"
          }}>
            <h2 style={{
              textAlign: "center",
              color: blue,
              fontWeight: 800,
              fontSize: "2em",
              marginBottom: 24
            }}>Add New Task</h2>
            <input
              type="text"
              placeholder="Task Name *"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              style={{
                marginBottom: 22,
                padding: "1.2em",
                border: `2px solid ${blueLight}`,
                borderRadius: 16,
                fontSize: "1.2em"
              }}
            />
            <div className="tag-selector" style={{
              marginBottom: 22,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`tag-btn${selectedTag === tag ? " active" : ""}`}
                  style={{
                    flex: "1 1 100px",
                    padding: "0.8em",
                    borderRadius: 12,
                    fontSize: "1.1em",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: selectedTag === tag ? blueGradient : "#f0f0f0",
                    color: selectedTag === tag ? "#fff" : blue,
                    border: `2px solid ${blue}`,
                    textAlign: "center"
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, fontSize: "1.1em" }}>Tag:</label>
              <select
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
                style={{
                  marginLeft: 12,
                  padding: "0.5em 1em",
                  borderRadius: 10,
                  border: `2px solid ${blueLight}`,
                  fontSize: "1em"
                }}
              >
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <input
                type="text"
                placeholder="Add new tag"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                style={{
                  padding: "0.7em 1em",
                  borderRadius: 10,
                  border: `2px solid ${blueLight}`,
                  fontSize: "1em",
                  marginRight: 8
                }}
              />
              <button
                onClick={() => {
                  if (newTag.trim() && !tags.includes(newTag.trim())) {
                    setTags([...tags, newTag.trim()])
                    setSelectedTag(newTag.trim())
                    setNewTag('')
                  }
                }}
                style={{
                  padding: "0.7em 1.2em",
                  borderRadius: 10,
                  background: blueGradient,
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "1em"
                }}
              >
                Add Tag
              </button>
            </div>
            <button className="create-btn" onClick={addTask} style={{
              background: blueGradient,
              color: "#fff",
              border: "none",
              borderRadius: 18,
              padding: "1.1em 0",
              fontSize: "1.3em",
              fontWeight: 700,
              marginBottom: 10,
              cursor: "pointer"
            }}>Create Task</button>
            <button className="close-btn" onClick={() => setShowAdd(false)} style={{
              background: "none",
              border: "none",
              color: blue,
              fontSize: "1.2em",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 0
            }}>
              <X size={22} style={{ marginRight: 8 }} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
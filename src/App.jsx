import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, Check, X, User, Filter } from 'lucide-react'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  // For demo: all tasks are "Personal"
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
        category,
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
    filter === 'active' ? !t.completed :
    filter === 'completed' ? t.completed : true
  )

  const active = tasks.filter(t => !t.completed).length
  const complete = tasks.filter(t => t.completed).length
  const percent = tasks.length ? Math.round((complete / tasks.length) * 100) : 0

  return (
    <div className="main-bg">
      <header className="greeting">
        <span role="img" aria-label="wave" style={{ fontSize: 28, marginRight: 8 }}>👋</span>
        <div>
          <h2>Good morning</h2>
          <p>Make every moment count.</p>
        </div>
        <div className="avatar"><User size={28} color="#888" /></div>
      </header>

      <div className="center-content">
        <div className="progress-card">
          <div className="progress-circle">
            <span>{percent}%</span>
          </div>
          <div>
            <b>You have {active} task{active !== 1 ? 's' : ''} to complete.</b>
            <div style={{ color: "#888", fontSize: "1em" }}>
              {complete === 0
                ? "No tasks completed yet. Keep going!"
                : `${complete} completed! Great job!`}
            </div>
          </div>
        </div>

        <div className="search-row">
          <input
            className="search-input"
            type="text"
            placeholder="Search for task..."
            // Add search logic if needed
          />
          <button className="sort-btn"><Filter size={20} /> Sort</button>
        </div>

        <div className="category-label">
          <User size={18} style={{ marginRight: 4 }} />
          Personal ({filtered.length})
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>You don't have any tasks yet</h3>
            <p>Click on the <b>+</b> button to add one</p>
          </div>
        ) : (
          <ul className="todo-list">
            {filtered.map(task => (
              <li
                key={task.id}
                className="todo-card"
                style={{ background: "#c43cff", color: "#fff" }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: "1.2em" }}>
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
                        style={{ fontSize: "1em", borderRadius: 8, border: "none", padding: 4 }}
                      />
                    ) : (
                      task.text
                    )}
                  </span>
                  <div style={{ marginTop: 8 }}>
                    <span className="category-chip"><User size={14} /> Personal</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.9em", opacity: 0.8, marginBottom: 8 }}>
                    today {task.created}
                  </span>
                  <div style={{ display: "flex", gap: "0.25em" }}>
                    {editingId === task.id ? (
                      <>
                        <button className="icon-btn" onClick={saveEdit}><Check /></button>
                        <button className="icon-btn" onClick={cancelEdit}><X /></button>
                      </>
                    ) : (
                      <>
                        <button className="icon-btn" onClick={() => startEditing(task.id, task.text)}><Edit2 /></button>
                        <button className="icon-btn" onClick={() => deleteTask(task.id)}><Trash2 /></button>
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
      <button className="fab" onClick={() => setShowAdd(true)}>
        <Plus size={32} />
      </button>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="modal-bg">
          <div className="modal-card">
            <h2>Add New Task</h2>
            <input
              type="text"
              placeholder="Task Name *"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <button className="create-btn" onClick={addTask}>Create Task</button>
            <button className="close-btn" onClick={() => setShowAdd(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
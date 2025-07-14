const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = 'your_secret_key' // Use env var in production

let users = [] // In-memory user store
let tasks = []
let id = 1

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' })
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'User exists' })
  const hash = await bcrypt.hash(password, 10)
  users.push({ username, password: hash })
  res.json({ message: 'User registered' })
})

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username)
  if (!user) return res.status(400).json({ error: 'Invalid credentials' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' })
  res.json({ token })
})

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.username = decoded.username
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// CRUD routes (protected)
app.get('/api/tasks', auth, (req, res) => {
  res.json(tasks.filter(t => t.username === req.username))
})

app.post('/api/tasks', auth, (req, res) => {
  const task = { id: id++, ...req.body, username: req.username }
  tasks.push(task)
  res.json(task)
})

app.patch('/api/tasks/:id', auth, (req, res) => {
  const task = tasks.find(t => t.id == req.params.id && t.username === req.username)
  if (!task) return res.status(404).json({ error: 'Not found' })
  Object.assign(task, req.body)
  res.json(task)
})

app.delete('/api/tasks/:id', auth, (req, res) => {
  const before = tasks.length
  tasks = tasks.filter(t => !(t.id == req.params.id && t.username === req.username))
  if (tasks.length === before) return res.status(404).json({ error: 'Not found' })
  res.json({ message: 'Deleted' })
})

app.listen(3001, () => console.log('Server running on port 3001'))
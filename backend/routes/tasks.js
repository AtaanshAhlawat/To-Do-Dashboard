const express = require('express');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get all tasks for user
router.get('/', auth, async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.userId });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// Create a new task
router.post('/', auth, async (req, res, next) => {
  try {
    console.log('Incoming task:', req.body, 'User:', req.userId);
    const { text, completed, tags, description } = req.body;
    const safeTags = Array.isArray(tags) ? tags : [];
    const safeDescription = typeof description === 'string' ? description : '';
    const task = new Task({
      text,
      completed: Boolean(completed),
      tags: safeTags,
      description: safeDescription,
      // Let the model's default handle the created timestamp
      user: req.userId
    });
    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    next(err);
  }
});

// Update a task
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if ('tags' in updates) updates.tags = Array.isArray(updates.tags) ? updates.tags : [];
    if ('description' in updates) updates.description = typeof updates.description === 'string' ? updates.description : '';
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updates,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const Task = require('../models/Task');

const router = express.Router();

// Get all tasks for user with sorting and filtering
router.get('/', async (req, res, next) => {
  try {
    const { 
      sortBy = 'created', 
      sortOrder = 'desc',
      status,
      priority,
      search,
      tags
    } = req.query;

    // Build query - req.user is set by policy middleware
    let query = { user: req.user._id };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Search filter
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $all: tagArray };
    }

    // Build sort object
    let sortObject = {};
    const validSortFields = ['text', 'priority', 'status', 'created', 'deadline', 'description'];
    const validSortOrders = ['asc', 'desc'];

    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      // Default sorting
      sortObject.created = -1;
    }

    const tasks = await Task.find(query).sort(sortObject);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// Get task statistics
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          normalPriority: { $sum: { $cond: [{ $eq: ['$priority', 'normal'] }, 1, 0] } },
          lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      highPriority: 0,
      normalPriority: 0,
      lowPriority: 0
    });
  } catch (err) {
    next(err);
  }
});

// Create a new task
router.post('/', async (req, res, next) => {
  try {
    console.log('Incoming task:', req.body, 'User:', req.user._id);
    const { text, completed, tags, description, priority, deadline, status } = req.body;
    
    const safeTags = Array.isArray(tags) ? tags : [];
    const safeDescription = typeof description === 'string' ? description : '';
    const safePriority = ['low', 'normal', 'high'].includes(priority) ? priority : 'normal';
    const safeStatus = ['Pending', 'In Progress', 'Completed', 'Rejected'].includes(status) ? status : 'Pending';
    
    const task = new Task({
      text,
      completed: Boolean(completed),
      tags: safeTags,
      description: safeDescription,
      priority: safePriority,
      status: safeStatus,
      deadline: deadline || null,
      user: req.user._id
    });
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    next(err);
  }
});

// Update a task
router.patch('/:id', async (req, res, next) => {
  try {
    const updates = { ...req.body };
    
    // Sanitize updates
    if ('tags' in updates) {
      updates.tags = Array.isArray(updates.tags) ? updates.tags : [];
    }
    if ('description' in updates) {
      updates.description = typeof updates.description === 'string' ? updates.description : '';
    }
    if ('priority' in updates) {
      updates.priority = ['low', 'normal', 'high'].includes(updates.priority) ? updates.priority : 'normal';
    }
    if ('status' in updates) {
      updates.status = ['Pending', 'In Progress', 'Completed', 'Rejected'].includes(updates.status) ? updates.status : 'Pending';
    }
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true }
    );
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// Delete a task
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Bulk operations
router.post('/bulk', async (req, res, next) => {
  try {
    const { action, taskIds, updates } = req.body;
    
    if (!action || !taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'Invalid bulk operation parameters' });
    }
    
    let result;
    
    switch (action) {
      case 'update':
        result = await Task.updateMany(
          { _id: { $in: taskIds }, user: req.user._id },
          updates
        );
        break;
      case 'delete':
        result = await Task.deleteMany(
          { _id: { $in: taskIds }, user: req.user._id }
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.json({ 
      message: `Bulk ${action} completed`,
      modifiedCount: result.modifiedCount || result.deletedCount
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

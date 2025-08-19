const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  description: { 
    type: String, 
    default: '',
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  tags: { 
    type: [String], 
    default: [],
    validate: {
      validator: function(tags) {
        return tags.length <= 10; // Max 10 tags per task
      },
      message: 'A task cannot have more than 10 tags'
    }
  },
  deadline: { 
    type: Date,
    validate: {
      validator: function(deadline) {
        return !deadline || deadline > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  created: { 
    type: Date, 
    default: Date.now 
  },
  updated: { 
    type: Date, 
    default: Date.now 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true
});

// Indexes for better performance
TaskSchema.index({ user: 1, created: -1 });
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, priority: 1 });
TaskSchema.index({ user: 1, tags: 1 });
TaskSchema.index({ user: 1, deadline: 1 });

// Update the updated field on save
TaskSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Virtual for overdue tasks
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return this.deadline < new Date() && this.status !== 'Completed';
});

// Method to mark as completed
TaskSchema.methods.markCompleted = function() {
  this.status = 'Completed';
  this.completed = true;
  return this.save();
};

// Method to update status
TaskSchema.methods.updateStatus = function(newStatus) {
  if (['Pending', 'In Progress', 'Completed', 'Rejected'].includes(newStatus)) {
    this.status = newStatus;
    this.completed = newStatus === 'Completed';
    return this.save();
  }
  throw new Error('Invalid status');
};

// Method to update priority
TaskSchema.methods.updatePriority = function(newPriority) {
  if (['low', 'normal', 'high'].includes(newPriority)) {
    this.priority = newPriority;
    return this.save();
  }
  throw new Error('Invalid priority');
};

// Static method to get overdue tasks
TaskSchema.statics.getOverdueTasks = function(userId) {
  return this.find({
    user: userId,
    deadline: { $lt: new Date() },
    status: { $ne: 'Completed' }
  });
};

// Static method to get tasks due today
TaskSchema.statics.getTasksDueToday = function(userId) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    user: userId,
    deadline: {
      $gte: today,
      $lt: tomorrow
    },
    status: { $ne: 'Completed' }
  });
};

module.exports = mongoose.model('Task', TaskSchema);

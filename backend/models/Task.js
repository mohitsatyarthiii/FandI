import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  // Task details
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true
  },
  
  // Reference to entry (if created from form entry)
  entryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entry'
  },
  
  // Location
  location: {
    type: String,
    enum: ['mathura', 'agra', 'noida'],
    required: [true, 'Location is required']
  },
  
  // Assignment details
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to someone']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned by someone']
  },
  
  // Task details
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'on-hold', 'cancelled'],
    default: 'pending'
  },
  
  // Dates
  dueDate: {
    type: Date
  },
  startDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  
  // Progress tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Task details
  category: {
    type: String,
    enum: ['follow-up', 'site-visit', 'documentation', 'meeting', 'other'],
    default: 'other'
  },
  
  // Attachments/files (storing file paths or URLs)
  attachments: [{
    filename: String,
    path: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Comments/updates
  updates: [{
    text: String,
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ location: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual for task summary
taskSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    title: this.title,
    assignedTo: this.assignedTo,
    status: this.status,
    priority: this.priority,
    location: this.location,
    dueDate: this.dueDate,
    progress: this.progress
  };
});

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// To ensure virtuals are included in JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;
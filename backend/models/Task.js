// models/Task.js - Clean and Optimized
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
  dueDate: Date,
  startDate: Date,
  completedDate: Date,
  
  // Progress tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Task category
  category: {
    type: String,
    enum: ['follow-up', 'site-visit', 'documentation', 'meeting', 'other'],
    default: 'other'
  },
  
  // Attachments
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
  
  // Updates/Notes
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
  
  /* ========== NOTIFICATION TRACKING ========== */
  // Track all notification attempts
  notifications: [{
    type: {
      type: String,
      enum: ['whatsapp', 'sms', 'error']
    },
    sentTo: {
      type: String,
      enum: ['staff', 'customer']
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending']
    },
    messageId: String,
    error: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Quick status flags
  notificationStatus: {
    staff: {
      whatsapp: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      whatsappSentAt: Date,
      smsSentAt: Date
    },
    customer: {
      whatsapp: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      whatsappSentAt: Date,
      smsSentAt: Date
    }
  }

}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ location: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

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

// Method to mark notification as sent
taskSchema.methods.markNotificationSent = async function(type, sentTo, messageId) {
  // Initialize if not exists
  if (!this.notifications) this.notifications = [];
  if (!this.notificationStatus) {
    this.notificationStatus = {
      staff: { whatsapp: false, sms: false },
      customer: { whatsapp: false, sms: false }
    };
  }
  
  // Add to notifications array
  this.notifications.push({
    type,
    sentTo,
    status: 'sent',
    messageId,
    sentAt: new Date()
  });
  
  // Update status flags
  if (sentTo === 'staff' || sentTo === 'customer') {
    if (!this.notificationStatus[sentTo]) {
      this.notificationStatus[sentTo] = { whatsapp: false, sms: false };
    }
    this.notificationStatus[sentTo][type] = true;
    this.notificationStatus[sentTo][`${type}SentAt`] = new Date();
  }
  
  return this;
};

// Method to mark notification as failed
taskSchema.methods.markNotificationFailed = async function(type, sentTo, error) {
  if (!this.notifications) this.notifications = [];
  
  this.notifications.push({
    type,
    sentTo,
    status: 'failed',
    error: typeof error === 'string' ? error : error?.message || 'Unknown error',
    sentAt: new Date()
  });
  
  return this;
};

// To ensure virtuals are included in JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;
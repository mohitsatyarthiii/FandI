import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  // Form submission details
  enquiryType: {
    type: String,
    enum: ['service', 'product', 'complaint', 'general', 'other'],
    required: [true, 'Enquiry type is required']
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientPhone: {
    type: String,
    required: [true, 'Client phone is required'],
    trim: true
  },
  clientEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  clientAddress: {
    type: String,
    required: [true, 'Client address is required'],
    trim: true
  },
  clientCity: {
    type: String,
    trim: true
  },
  
  // Location details
  location: {
    type: String,
    enum: ['mathura', 'agra', 'noida'],
    required: [true, 'Location is required']
  },
  
  // Enquiry details
  enquiryDescription: {
    type: String,
    required: [true, 'Enquiry description is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['new', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'new'
  },
  
  // Assignment details
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  
  // Additional info
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
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
entrySchema.index({ location: 1, status: 1 });
entrySchema.index({ assignedTo: 1 });
entrySchema.index({ createdAt: -1 });

// Virtual for entry summary
entrySchema.virtual('summary').get(function() {
  return {
    id: this._id,
    clientName: this.clientName,
    enquiryType: this.enquiryType,
    location: this.location,
    status: this.status,
    priority: this.priority,
    createdAt: this.createdAt
  };
});

// To ensure virtuals are included in JSON
entrySchema.set('toJSON', { virtuals: true });
entrySchema.set('toObject', { virtuals: true });

const Entry = mongoose.model('Entry', entrySchema);

export default Entry;
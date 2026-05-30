import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema(
  {
    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
      required: true,
      index: true
    },

    clientName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      enum: ['mathura', 'agra', 'noida'],
      required: true,
      index: true
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageTemplate'
    },

    templateName: {
      type: String,
      trim: true
    },

    channel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      required: true,
      index: true
    },

    message: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      index: true
    },

    messageId: {
      type: String,
      trim: true
    },

    error: {
      type: String,
      trim: true
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

followUpSchema.index({
  phone: 1,
  createdAt: -1
});

followUpSchema.index({
  entryId: 1,
  createdAt: -1
});

followUpSchema.index({
  location: 1,
  status: 1
});

followUpSchema.virtual('summary').get(function () {
  return {
    id: this._id,
    clientName: this.clientName,
    phone: this.phone,
    channel: this.channel,
    status: this.status,
    sentAt: this.sentAt
  };
});

followUpSchema.set('toJSON', { virtuals: true });
followUpSchema.set('toObject', { virtuals: true });

const FollowUp = mongoose.model(
  'FollowUp',
  followUpSchema
);

export default FollowUp;
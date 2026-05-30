import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },

    description: {
      type: String,
      trim: true
    },

    channel: {
      type: String,
      enum: ['sms', 'whatsapp'],
      required: true
    },

    content: {
      type: String,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

templateSchema.index({
  isActive: 1
});

templateSchema.index({
  channel: 1
});

templateSchema.virtual('availableVariables').get(function () {
  return [
    '{{clientName}}',
    '{{phone}}',
    '{{location}}'
  ];
});

templateSchema.set('toJSON', { virtuals: true });
templateSchema.set('toObject', { virtuals: true });

const MessageTemplate = mongoose.model(
  'MessageTemplate',
  templateSchema
);

export default MessageTemplate;
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Project name is required'],
      trim:     true,
      maxlength:[150, 'Project name cannot exceed 150 characters'],
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
    },
    status: {
      type:    String,
      enum:    ['active', 'completed', 'archived'],
      default: 'active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
    deadline: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Virtual: task count (populated via Task model) ────────────────────────────
projectSchema.virtual('tasks', {
  ref:          'Task',
  localField:   '_id',
  foreignField: 'project',
});

// ── Index for fast member lookups ─────────────────────────────────────────────
projectSchema.index({ members: 1 });
projectSchema.index({ owner: 1 });

module.exports = mongoose.model('Project', projectSchema);

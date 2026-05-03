const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Task title is required'],
      trim:     true,
      maxlength:[200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
    },
    status: {
      type:    String,
      enum:    ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    project: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Project',
      required: [true, 'Project is required'],
    },
    assignee: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    dueDate: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
taskSchema.index({ project: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);

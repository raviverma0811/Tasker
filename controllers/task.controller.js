const Task    = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// ── GET /api/tasks ───────────────────────────────────────────────────────────
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, assignee, project } = req.query;
    const filter = {};

    // Scope: members see only tasks in their projects
    if (req.user.role !== 'admin') {
      const memberProjects = await Project.find({ members: req.user._id }).select('_id');
      filter.project = { $in: memberProjects.map((p) => p._id) };
    }

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (project)  filter.project  = project;

    const tasks = await Task.find(filter)
      .populate('assignee',  'name email')
      .populate('project',   'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── POST /api/tasks ──────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { title, description, priority, project, assignee, dueDate } = req.body;

  try {
    const projectExists = await Project.findById(project);
    if (!projectExists) return res.status(404).json({ message: 'Project not found.' });

    const task = await Task.create({
      title, description, priority,
      project, assignee: assignee || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
    });

    await task.populate([
      { path: 'assignee',  select: 'name email' },
      { path: 'project',   select: 'name' },
      { path: 'createdBy', select: 'name' },
    ]);

    res.status(201).json({ message: 'Task created.', task });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── GET /api/tasks/:taskId ───────────────────────────────────────────────────
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignee',  'name email')
      .populate('project',   'name')
      .populate('createdBy', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── PUT /api/tasks/:taskId ───────────────────────────────────────────────────
const updateTask = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ message: 'Task not found.' });

      const isOwner = task.createdBy.toString() === req.user._id.toString();
      const isAssignee = task.assignee?.toString() === req.user._id.toString();
      if (!isOwner && !isAssignee) {
        return res.status(403).json({ message: 'Not authorized to update this task.' });
      }
    }

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('assignee', 'name email').populate('project', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task updated.', task });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── PATCH /api/tasks/:taskId/status ──────────────────────────────────────────
const updateTaskStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['todo', 'in_progress', 'review', 'done'];

  if (!valid.includes(status)) {
    return res.status(422).json({ message: `Status must be one of: ${valid.join(', ')}` });
  }

  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status },
      { new: true }
    ).populate('assignee', 'name').populate('project', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Status updated.', task });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── DELETE /api/tasks/:taskId ─────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getAllTasks, createTask, getTaskById,
  updateTask, updateTaskStatus, deleteTask,
};

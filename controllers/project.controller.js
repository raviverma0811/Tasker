const Project = require('../models/Project');
const Task    = require('../models/Task');
const User    = require('../models/User');
const { validationResult } = require('express-validator');

// ── GET /api/projects ────────────────────────────────────────────────────────
const getAllProjects = async (req, res) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { members: req.user._id };

    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    // Attach task counts
    const projectsWithCount = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ project: p._id });
        return { ...p.toObject(), taskCount };
      })
    );

    res.json({ projects: projectsWithCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── POST /api/projects ───────────────────────────────────────────────────────
const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, description, deadline } = req.body;

  try {
    const project = await Project.create({
      name,
      description,
      deadline: deadline || null,
      owner:   req.user._id,
      members: [req.user._id], // Auto-add creator
    });

    await project.populate('owner', 'name email');
    res.status(201).json({ message: 'Project created.', project });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── GET /api/projects/:projectId ─────────────────────────────────────────────
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner',   'name email')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const tasks = await Task.find({ project: project._id })
      .populate('assignee',  'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── PUT /api/projects/:projectId ─────────────────────────────────────────────
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Project updated.', project });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── DELETE /api/projects/:projectId ──────────────────────────────────────────
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Delete all tasks belonging to this project
    await Task.deleteMany({ project: req.params.projectId });

    res.json({ message: 'Project and all its tasks deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── POST /api/projects/:projectId/members ────────────────────────────────────
const addMember = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { $addToSet: { members: userId } }, // $addToSet prevents duplicates
      { new: true }
    ).populate('members', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Member added.', project });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── DELETE /api/projects/:projectId/members/:userId ──────────────────────────
const removeMember = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { $pull: { members: req.params.userId } },
      { new: true }
    ).populate('members', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Member removed.', project });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getAllProjects, createProject, getProjectById,
  updateProject, deleteProject, addMember, removeMember,
};

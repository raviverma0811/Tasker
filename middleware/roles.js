const Project = require('../models/Project');

// ── Role-based authorization ───────────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: [${roles.join(' or ')}].`,
    });
  }
  next();
};

// ── Project membership guard ──────────────────────────────────────────────────
const isProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project;
  if (!projectId) return next();

  try {
    if (req.user.role === 'admin') return next(); // Admins bypass

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const isMember = project.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this project.' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authorize, isProjectMember };

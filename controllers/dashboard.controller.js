const Task    = require('../models/Task');
const Project = require('../models/Project');

const getDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    // Determine project scope
    let projectIds;
    if (isAdmin) {
      const allProjects = await Project.find().select('_id');
      projectIds = allProjects.map((p) => p._id);
    } else {
      const myProjects = await Project.find({ members: req.user._id }).select('_id');
      projectIds = myProjects.map((p) => p._id);
    }

    const taskFilter = { project: { $in: projectIds } };
    const now = new Date();

    // Task status breakdown
    const taskStats = await Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort:  { _id: 1 } },
    ]);

    // Priority breakdown
    const priorityStats = await Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Overdue tasks
    const overdueTasks = await Task.find({
      ...taskFilter,
      dueDate: { $lt: now },
      status:  { $ne: 'done' },
    })
      .populate('assignee', 'name')
      .populate('project',  'name')
      .sort({ dueDate: 1 })
      .limit(10);

    // Recent tasks
    const recentTasks = await Task.find(taskFilter)
      .populate('assignee', 'name')
      .populate('project',  'name')
      .sort({ createdAt: -1 })
      .limit(6);

    // Project progress summary
    const projectSummary = await Promise.all(
      (
        await Project.find(isAdmin ? {} : { members: req.user._id })
          .populate('owner', 'name')
          .sort({ createdAt: -1 })
          .limit(6)
      ).map(async (p) => {
        const totalTasks = await Task.countDocuments({ project: p._id });
        const doneTasks  = await Task.countDocuments({ project: p._id, status: 'done' });
        return {
          _id:        p._id,
          name:       p.name,
          status:     p.status,
          deadline:   p.deadline,
          owner:      p.owner,
          totalTasks,
          doneTasks,
          progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        };
      })
    );

    // Total counts
    const totalTasks    = await Task.countDocuments(taskFilter);
    const totalProjects = projectIds.length;

    res.json({
      taskStats,
      priorityStats,
      overdueTasks,
      recentTasks,
      projectSummary,
      totalTasks,
      totalProjects,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getDashboardStats };

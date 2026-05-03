const express = require('express');
const { body } = require('express-validator');
const {
  getAllProjects, createProject, getProjectById,
  updateProject, deleteProject, addMember, removeMember,
} = require('../controllers/project.controller');
const { authenticate }                = require('../middleware/auth');
const { authorize, isProjectMember }  = require('../middleware/roles');

const router = express.Router();
router.use(authenticate);

router.get('/',                getAllProjects);
router.post('/', authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Project name is required'),
], createProject);

router.get('/:projectId',    isProjectMember, getProjectById);
router.put('/:projectId',    authorize('admin'), updateProject);
router.delete('/:projectId', authorize('admin'), deleteProject);

router.post('/:projectId/members',         authorize('admin'), addMember);
router.delete('/:projectId/members/:userId', authorize('admin'), removeMember);

module.exports = router;

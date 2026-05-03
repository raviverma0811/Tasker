const express = require('express');
const { body } = require('express-validator');
const {
  getAllTasks, createTask, getTaskById,
  updateTask, updateTaskStatus, deleteTask,
} = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/roles');

const router = express.Router();
router.use(authenticate);

router.get('/', getAllTasks);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
], createTask);

router.get('/:taskId',            getTaskById);
router.put('/:taskId',            updateTask);
router.patch('/:taskId/status',   updateTaskStatus);
router.delete('/:taskId',         authorize('admin'), deleteTask);

module.exports = router;

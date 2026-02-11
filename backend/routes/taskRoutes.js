import express from 'express';
import { body } from 'express-validator';
import {
  createTask,
  getTasks,
  getTask,
  updateTaskStatus,
  updateTask,
  addAttachment,
  getTaskStats,
  getMyTasks,
  getTasksAssignedByMe
} from '../controllers/taskController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (Admin/Manager)
router.post('/',
  authorize(['admin', 'manager']),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('location').isIn(['mathura', 'agra', 'noida']),
    body('assignedTo').isMongoId(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isISO8601(),
    body('category').optional().isIn(['follow-up', 'site-visit', 'documentation', 'meeting', 'other']),
    body('entryId').optional().isMongoId()
  ],
  validate,
  createTask
);

// @route   GET /api/tasks
// @desc    Get all tasks with filters
// @access  Private (Admin/Manager/Staff)
router.get('/',
  authorize(['admin', 'manager', 'staff']),
  getTasks
);

// @route   GET /api/tasks/stats/dashboard
// @desc    Get task statistics for dashboard
// @access  Private (Admin/Manager/Staff)
router.get('/stats/dashboard',
  authorize(['admin', 'manager', 'staff']),
  getTaskStats
);

// @route   GET /api/tasks/my-tasks
// @desc    Get current user's tasks (for staff)
// @access  Private (Staff)
router.get('/my-tasks',
  authorize(['staff']),
  getMyTasks
);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private (Admin/Manager/Assigned Staff)
router.get('/:id',
  (req, res, next) => {
    // Allow access for all roles, permission check in controller
    next();
  },
  getTask
);

// @route   PUT /api/tasks/:id/status
// @desc    Update task status
// @access  Private (Admin/Manager/Assigned Staff)
router.put('/:id/status',
  (req, res, next) => {
    // Allow access for all roles, permission check in controller
    next();
  },
  [
    body('status').isIn(['pending', 'in-progress', 'completed', 'on-hold', 'cancelled']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('note').optional().trim()
  ],
  validate,
  updateTaskStatus
);

// @route   PUT /api/tasks/:id
// @desc    Update task details
// @access  Private (Admin/Manager)
router.put('/:id',
  authorize(['admin', 'manager']),
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('dueDate').optional().isISO8601(),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'on-hold', 'cancelled']),
    body('assignedTo').optional().isMongoId(),
    body('progress').optional().isInt({ min: 0, max: 100 })
  ],
  validate,
  updateTask
);

// @route   POST /api/tasks/:id/attachments
// @desc    Add attachment to task
// @access  Private (Admin/Manager/Assigned Staff)
router.post('/:id/attachments',
  (req, res, next) => {
    // Allow access for all roles, permission check in controller
    next();
  },
  [
    body('filename').trim().notEmpty(),
    body('path').trim().notEmpty()
  ],
  validate,
  addAttachment
);

router.get('/assigned-by-me',
  authorize(['admin', 'manager']),
  getTasksAssignedByMe
);

export default router;
// routes/taskRoutes.js
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
  getTasksAssignedByMe,
  retryNotifications
} from '../controllers/taskController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   POST /api/tasks
// @desc    Create a new task with SMS/WhatsApp notifications
// @access  Private (Admin/Manager)
router.post('/',
  authorize(['admin', 'manager']),
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('location').isIn(['mathura', 'agra', 'noida']).withMessage('Invalid location'),
    body('assignedTo').isMongoId().withMessage('Valid staff ID is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('category').optional().isIn(['follow-up', 'site-visit', 'documentation', 'meeting', 'other']),
    body('entryId').optional().isMongoId().withMessage('Invalid entry ID')
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
// @desc    Get current user's assigned tasks (for staff)
// @access  Private (Staff)
router.get('/my-tasks',
  authorize(['staff']),
  getMyTasks
);

// @route   GET /api/tasks/assigned-by-me
// @desc    Get tasks assigned by current user (admin/manager)
// @access  Private (Admin/Manager)
router.get('/assigned-by-me',
  authorize(['admin', 'manager']),
  getTasksAssignedByMe
);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private (Admin/Manager/Assigned Staff)
router.get('/:id',
  authorize(['admin', 'manager', 'staff']),
  getTask
);

// @route   PUT /api/tasks/:id/status
// @desc    Update task status (staff can update their tasks)
// @access  Private (Admin/Manager/Assigned Staff)
router.put('/:id/status',
  authorize(['admin', 'manager', 'staff']),
  [
    body('status').isIn(['pending', 'in-progress', 'completed', 'on-hold', 'cancelled']).withMessage('Invalid status'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
    body('note').optional().trim()
  ],
  validate,
  updateTaskStatus
);

// @route   PUT /api/tasks/:id
// @desc    Update task details (admin/manager only)
// @access  Private (Admin/Manager)
router.put('/:id',
  authorize(['admin', 'manager']),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'on-hold', 'cancelled']),
    body('assignedTo').optional().isMongoId().withMessage('Invalid staff ID'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100')
  ],
  validate,
  updateTask
);

// @route   POST /api/tasks/:id/attachments
// @desc    Add attachment to task
// @access  Private (Admin/Manager/Assigned Staff)
router.post('/:id/attachments',
  authorize(['admin', 'manager', 'staff']),
  [
    body('filename').trim().notEmpty().withMessage('Filename is required'),
    body('path').trim().notEmpty().withMessage('File path is required')
  ],
  validate,
  addAttachment
);

// @route   POST /api/tasks/:id/retry-notifications
// @desc    Retry failed notifications for a task
// @access  Private (Admin/Manager)
router.post('/:id/retry-notifications',
  authorize(['admin', 'manager']),
  retryNotifications
);

export default router;
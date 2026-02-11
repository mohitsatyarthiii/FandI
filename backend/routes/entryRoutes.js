import express from 'express';
import { body } from 'express-validator';
import {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  addNote,
  getDashboardStats,
  convertToTask
} from '../controllers/entryController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate } from '../utils/validators.js';

const router = express.Router();

// @route   POST /api/entries
// @desc    Create a new entry (form submission)
// @access  Public
router.post('/',
  [
    body('enquiryType').isIn(['service', 'product', 'complaint', 'general', 'other']),
    body('clientName').trim().notEmpty(),
    body('clientPhone').trim().notEmpty(),
    body('clientEmail').optional().isEmail().normalizeEmail(),
    body('clientAddress').trim().notEmpty(),
    body('clientCity').optional().trim(),
    body('location').isIn(['mathura', 'agra', 'noida']),
    body('enquiryDescription').trim().notEmpty(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
  ],
  validate,
  createEntry
);

// All other routes require authentication
router.use(authenticate);

// @route   GET /api/entries
// @desc    Get all entries with filters
// @access  Private (Admin/Manager/Staff)
router.get('/',
  authorize(['admin', 'manager', 'staff']),
  getEntries
);

// @route   GET /api/entries/stats/dashboard
// @desc    Get dashboard statistics for entries
// @access  Private (Admin/Manager/Staff)
router.get('/stats/dashboard',
  authorize(['admin', 'manager', 'staff']),
  getDashboardStats
);

// @route   GET /api/entries/:id
// @desc    Get entry by ID
// @access  Private (Admin/Manager/Staff with permission)
router.get('/:id',
  authorize(['admin', 'manager', 'staff']),
  getEntry
);

// @route   PUT /api/entries/:id
// @desc    Update entry
// @access  Private (Admin/Manager)
router.put('/:id',
  authorize(['admin', 'manager']),
  [
    body('status').optional().isIn(['new', 'assigned', 'in-progress', 'completed', 'cancelled']),
    body('assignedTo').optional().isMongoId(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('enquiryDescription').optional().trim()
  ],
  validate,
  updateEntry
);

// @route   POST /api/entries/:id/notes
// @desc    Add note to entry
// @access  Private (Admin/Manager/Assigned Staff)
router.post('/:id/notes',
  authorize(['admin', 'manager', 'staff']),
  [
    body('text').trim().notEmpty()
  ],
  validate,
  addNote
);

// @route   POST /api/entries/:id/convert-to-task
// @desc    Convert entry to task
// @access  Private (Admin/Manager)
router.post('/:id/convert-to-task',
  authorize(['admin', 'manager']),
  [
    body('assignedTo').isMongoId(),
    body('dueDate').optional().isISO8601(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
  ],
  validate,
  convertToTask
);

export default router;
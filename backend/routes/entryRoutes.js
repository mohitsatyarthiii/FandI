// routes/entryRoutes.js
import express from 'express';
import { body, validationResult } from 'express-validator'; // IMPORTANT: Add validationResult here
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
import { validate } from '../utils/validators.js'; // Use the imported validate instead

const router = express.Router();

// @route   POST /api/entries
// @desc    Create a new entry (form submission)
// @access  Public
router.post('/',
  [
    body('enquiryType')
      .isIn(['service', 'product', 'complaint', 'general', 'other'])
      .withMessage('Invalid enquiry type'),
    body('clientName')
      .trim()
      .notEmpty()
      .withMessage('Client name is required'),
    body('clientPhone')
      .trim()
      .notEmpty()
      .withMessage('Client phone is required'),
    body('clientEmail')
      .optional({ values: 'falsy' })
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('clientAddress')
      .trim()
      .notEmpty()
      .withMessage('Client address is required'),
    body('clientCity')
      .optional()
      .trim(),
    body('location')
      .isIn(['mathura', 'agra', 'noida'])
      .withMessage('Invalid location'),
    body('enquiryDescription')
      .trim()
      .notEmpty()
      .withMessage('Enquiry description is required'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority')
  ],
  validate, // Use the imported validate middleware
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
    body('status')
      .optional()
      .isIn(['new', 'assigned', 'in-progress', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('assignedTo')
      .optional()
      .isMongoId()
      .withMessage('Invalid assigned user ID'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('enquiryDescription')
      .optional()
      .trim()
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
    body('text')
      .trim()
      .notEmpty()
      .withMessage('Note text is required')
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
    body('assignedTo')
      .isMongoId()
      .withMessage('Assigned user ID is required and must be valid'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority')
  ],
  validate,
  convertToTask
);

export default router;
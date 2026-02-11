import express from 'express';
import { body } from 'express-validator';
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUsersByLocation
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   POST /api/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin)
router.post('/',
  authorize(['admin']),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'manager', 'staff']).withMessage('Invalid role'),
    body('location').isIn(['mathura', 'agra', 'noida', 'all']).withMessage('Invalid location'),
    body('phone').optional().trim()
  ],
  validate,
  createUser
);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin/Manager)
router.get('/',
  authorize(['admin', 'manager']),
  getUsers
);

// @route   GET /api/users/location/:location
// @desc    Get users by location
// @access  Private (Admin/Manager)
router.get('/location/:location',
  authorize(['admin', 'manager']),
  getUsersByLocation
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin/Manager/Self)
router.get('/:id',
  (req, res, next) => {
    // Allow access if user is admin/manager OR accessing own profile
    if (req.userRole === 'admin' || req.userRole === 'manager' || req.params.id === req.userId) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Not authorized' });
  },
  getUser
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin/Manager/Self)
router.put('/:id',
  (req, res, next) => {
    // Allow access if user is admin/manager OR updating own profile
    if (req.userRole === 'admin' || req.userRole === 'manager' || req.params.id === req.userId) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Not authorized' });
  },
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('role').optional().isIn(['admin', 'manager', 'staff']),
    body('location').optional().isIn(['mathura', 'agra', 'noida', 'all']),
    body('isActive').optional().isBoolean()
  ],
  validate,
  updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete/Deactivate user (Admin only)
// @access  Private (Admin)
router.delete('/:id',
  authorize(['admin']),
  deleteUser
);

export default router;
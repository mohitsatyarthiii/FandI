import express from 'express';
import { body } from 'express-validator';
import { 
  login, 
  getMe, 
  changePassword, 
  resetUserPassword 
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', 
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  login
);

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticate, getMe);

// @route   PUT /api/auth/change-password
// @desc    Change current user's password
// @access  Private
router.put('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  changePassword
);

// @route   PUT /api/auth/reset-password/:userId
// @desc    Reset another user's password (Admin/Manager)
// @access  Private (Admin/Manager)
router.put('/reset-password/:userId',
  authenticate,
  authorize(['admin', 'manager']),
  [
    body('newPassword').isLength({ min: 6 })
  ],
  resetUserPassword
);

export default router;
import express from 'express';
import { body } from 'express-validator';

import {
  sendFollowUp,
  getHistory,
  getClientHistory,
  getStats,
  retryFollowUp,

  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '../controllers/followUpController.js';

import {
  authenticate,
  authorize
} from '../middlewares/authMiddleware.js';

import {
  validate
} from '../utils/validators.js';

const router = express.Router();

/* ==========================================================
   ALL ROUTES REQUIRE AUTH
========================================================== */

router.use(authenticate);

/* ==========================================================
   FOLLOW UP SEND
========================================================== */

// POST /api/followups/send

router.post(
  '/send',
  authorize([
    'admin',
    'manager',
    'staff'
  ]),
  [
    body('entryIds')
      .isArray({
        min: 1
      })
      .withMessage(
        'At least one entry is required'
      ),

    body('channel')
      .isIn([
        'sms',
        'whatsapp'
      ])
      .withMessage(
        'Invalid channel'
      ),

    body('templateId')
      .optional()
      .isMongoId()
      .withMessage(
        'Invalid template id'
      ),

    body('message')
      .optional()
      .trim()
  ],
  validate,
  sendFollowUp
);

/* ==========================================================
   HISTORY
========================================================== */

// GET /api/followups/history

router.get(
  '/history',
  authorize([
    'admin',
    'manager',
    'staff'
  ]),
  getHistory
);

/* ==========================================================
   CLIENT HISTORY
========================================================== */

// GET /api/followups/client/:entryId

router.get(
  '/client/:entryId',
  authorize([
    'admin',
    'manager',
    'staff'
  ]),
  getClientHistory
);

/* ==========================================================
   DASHBOARD STATS
========================================================== */

// GET /api/followups/stats

router.get(
  '/stats',
  authorize([
    'admin',
    'manager'
  ]),
  getStats
);

/* ==========================================================
   RETRY FAILED MESSAGE
========================================================== */

// POST /api/followups/retry/:id

router.post(
  '/retry/:id',
  authorize([
    'admin',
    'manager'
  ]),
  retryFollowUp
);

/* ==========================================================
   TEMPLATE ROUTES
========================================================== */

// GET TEMPLATES

router.get(
  '/templates',
  authorize([
    'admin',
    'manager',
    'staff'
  ]),
  getTemplates
);

// CREATE TEMPLATE

router.post(
  '/templates',
  authorize([
    'admin',
    'manager'
  ]),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage(
        'Template name is required'
      ),

    body('channel')
      .isIn([
        'sms',
        'whatsapp'
      ])
      .withMessage(
        'Invalid channel'
      ),

    body('content')
      .trim()
      .notEmpty()
      .withMessage(
        'Template content is required'
      ),

    body('description')
      .optional()
      .trim()
  ],
  validate,
  createTemplate
);

// UPDATE TEMPLATE

router.put(
  '/templates/:id',
  authorize([
    'admin',
    'manager'
  ]),
  [
    body('name')
      .optional()
      .trim(),

    body('content')
      .optional()
      .trim(),

    body('description')
      .optional()
      .trim(),

    body('channel')
      .optional()
      .isIn([
        'sms',
        'whatsapp'
      ])
  ],
  validate,
  updateTemplate
);

// DELETE TEMPLATE

router.delete(
  '/templates/:id',
  authorize([
    'admin',
    'manager'
  ]),
  deleteTemplate
);

export default router;
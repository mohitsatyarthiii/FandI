import FollowUp from '../models/FollowUp.js';
import MessageTemplate from '../models/MessageTemplate.js';
import Entry from '../models/Entry.js';

import followUpService from '../services/followUpService.js';

/* ==========================================================
   SEND BULK FOLLOW UP
========================================================== */

export const sendFollowUp = async (req, res) => {
  try {
    const {
      entryIds,
      templateId,
      message,
      channel = 'whatsapp'
    } = req.body;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one entry is required'
      });
    }

    const result = await followUpService.sendBulkMessages({
      entryIds,
      templateId,
      customMessage: message,
      channel,
      userId: req.userId,
      userRole: req.userRole,
      userLocation: req.userLocation
    });

    res.status(200).json({
      success: true,
      message: 'Follow up messages processed',
      ...result
    });

  } catch (error) {
    console.error('Send follow up error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==========================================================
   GET HISTORY
========================================================== */

export const getHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      channel,
      phone,
      location,
      startDate,
      endDate,
      sentBy
    } = req.query;

    const result =
      await followUpService.getFollowUpHistory({
        page,
        limit,
        status,
        channel,
        phone,
        location,
        startDate,
        endDate,
        sentBy,
        userRole: req.userRole,
        userLocation: req.userLocation
      });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get history error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==========================================================
   CLIENT HISTORY
========================================================== */

export const getClientHistory = async (req, res) => {
  try {
    const { entryId } = req.params;

    const entry = await Entry.findById(entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    if (
      req.userRole !== 'admin' &&
      entry.location !== req.userLocation
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const history =
      await followUpService.getClientHistory(entryId);

    res.json({
      success: true,
      count: history.length,
      history
    });

  } catch (error) {
    console.error('Client history error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==========================================================
   STATS
========================================================== */

export const getStats = async (req, res) => {
  try {

    const stats =
      await followUpService.getFollowUpStats({
        userRole: req.userRole,
        userLocation: req.userLocation
      });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==========================================================
   RETRY FAILED MESSAGE
========================================================== */

export const retryFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    const followUp = await FollowUp.findById(id);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow up not found'
      });
    }

    const result =
      await followUpService.retryFailedMessage(
        id,
        req.userId
      );

    res.json({
      success: true,
      message: 'Retry completed',
      result
    });

  } catch (error) {
    console.error('Retry error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==========================================================
   GET TEMPLATES
========================================================== */

export const getTemplates = async (req, res) => {
  try {

    const templates =
      await MessageTemplate.find({
        isActive: true
      })
      .populate(
        'createdBy',
        'name email role'
      )
      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      count: templates.length,
      templates
    });

  } catch (error) {
    console.error('Get templates error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==========================================================
   CREATE TEMPLATE
========================================================== */

export const createTemplate = async (req, res) => {
  try {

    const {
      name,
      description,
      content,
      channel
    } = req.body;

    const exists =
      await MessageTemplate.findOne({
        name: name.trim()
      });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Template already exists'
      });
    }

    const template =
      await MessageTemplate.create({
        name,
        description,
        content,
        channel,
        createdBy: req.userId
      });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });

  } catch (error) {
    console.error('Create template error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==========================================================
   UPDATE TEMPLATE
========================================================== */

export const updateTemplate = async (req, res) => {
  try {

    const { id } = req.params;

    const template =
      await MessageTemplate.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated',
      template
    });

  } catch (error) {
    console.error('Update template error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==========================================================
   DELETE TEMPLATE
========================================================== */

export const deleteTemplate = async (req, res) => {
  try {

    const { id } = req.params;

    const template =
      await MessageTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    template.isActive = false;

    await template.save();

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// controllers/entryController.js
import Entry from '../models/Entry.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import twilioService from '../services/twilioService.js';

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return null;
  // Remove all non-digits and leading zeros
  let cleaned = phone.toString().replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  
  // Add +91 if it's a 10-digit Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
};

// Background notification function
const sendEntryNotifications = async (entry) => {
  try {
    const companyName = process.env.COMPANY_NAME || 'Fandi';
    const cleanPhone = cleanPhoneNumber(entry.clientPhone);
    
    console.log('\n📱 ========== SENDING NOTIFICATIONS ==========');
    console.log(`📞 Original: ${entry.clientPhone}`);
    console.log(`📞 Cleaned: ${cleanPhone}`);
    console.log(`👤 Client: ${entry.clientName}`);
    console.log(`📍 Location: ${entry.location}`);
    
    // SMS Message
    const smsMessage = `✨ Welcome to ${companyName}!

Hi ${entry.clientName}, 👋  
Thank you for your ${entry.enquiryType} enquiry. We’ve successfully received your request.

Our team will review your details and get in touch with you shortly to assist you further.

📞 For any additional queries, feel free to call or WhatsApp us anytime at: +91 93197 25916

We look forward to assisting you!😊`;
    
    // WhatsApp Message  
    const whatsappMessage = `*${companyName} - Enquiry Confirmation*\n\nDear ${entry.clientName},\n\nThank you for contacting us! Your enquiry has been received.\n\n*Enquiry Details:*\n• Type: ${entry.enquiryType}\n• Priority: ${entry.priority}\n• Location: ${entry.location}\n• Description: ${entry.enquiryDescription}\n\n*Tracking ID:* ${entry._id.toString().slice(-6)}\n\nWe will get back to you shortly.\n\nRegards,\nTeam ${companyName}`;

    // ALWAYS send SMS first (more reliable)
    console.log('\n📨 Sending SMS...');
    const smsResult = await twilioService.sendSMS(cleanPhone, smsMessage);
    
    if (smsResult.success) {
      console.log('✅ SMS SENT SUCCESSFULLY!');
      console.log(`   SID: ${smsResult.sid}`);
      
      // Add success note to entry
      await Entry.findByIdAndUpdate(entry._id, {
        $push: {
          notes: {
            text: `✅ SMS sent to ${cleanPhone}`,
            addedBy: null,
            addedAt: new Date()
          }
        }
      });
      
      // Try WhatsApp after SMS success
      console.log('\n📱 Trying WhatsApp...');
      const waResult = await twilioService.sendWhatsApp(cleanPhone, whatsappMessage);
      
      if (waResult.success) {
        console.log('✅ WhatsApp also sent!');
        await Entry.findByIdAndUpdate(entry._id, {
          $push: {
            notes: {
              text: `✅ WhatsApp sent to ${cleanPhone}`,
              addedBy: null,
              addedAt: new Date()
            }
          }
        });
      } else {
        console.log('ℹ️ WhatsApp skipped/failed (SMS was sent)');
      }
      
    } else {
      console.error('❌ SMS FAILED:', smsResult.error);
      
      // Log failure to entry
      await Entry.findByIdAndUpdate(entry._id, {
        $push: {
          notes: {
            text: `❌ SMS failed: ${smsResult.error}`,
            addedBy: null,
            addedAt: new Date()
          }
        }
      });
    }
    
    console.log('📱 ==========================================\n');
    
  } catch (error) {
    console.error('💥 Notification error:', error);
  }
};

// @desc    Create new entry (form submission)
// @route   POST /api/entries
// @access  Public
export const createEntry = async (req, res) => {
  try {
    const entryData = req.body;
    
    console.log('\n📝 ========== NEW ENTRY ==========');
    console.log('Data:', JSON.stringify(entryData, null, 2));

    // Create entry
    const entry = new Entry(entryData);
    await entry.save();
    
    console.log(`✅ Entry created: ${entry._id}`);
    console.log('📝 ================================\n');

    // Send notifications in background (don't await)
    if (entry.clientPhone) {
      sendEntryNotifications(entry);
    }

    res.status(201).json({
      success: true,
      message: 'Entry submitted successfully',
      entry: entry.summary
    });

  } catch (error) {
    console.error('❌ Create entry error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};

// @desc    Get all entries (with filters)
// @route   GET /api/entries
// @access  Private (Admin/Manager/Staff)
export const getEntries = async (req, res) => {
  try {
    const { 
      location, 
      status, 
      assignedTo, 
      priority,
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const userRole = req.userRole;
    const userLocation = req.userLocation;
    const userId = req.userId;

    let query = {};

    if (userRole === 'admin') {
      if (location && location !== 'all') query.location = location;
    } else if (userRole === 'manager') {
      query.location = userLocation;
    } else {
      query.location = userLocation;
      query.$or = [
        { assignedTo: userId },
        { assignedTo: null },
        { status: 'new' }
      ];
    }

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = await Entry.find(query)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Entry.countDocuments(query);

    res.json({
      success: true,
      count: entries.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      entries
    });

  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching entries' 
    });
  }
};

// @desc    Get single entry
// @route   GET /api/entries/:id
// @access  Private (Admin/Manager/Staff with permission)
export const getEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const userRole = req.userRole;
    const userLocation = req.userLocation;
    const userId = req.userId;

    const entry = await Entry.findById(entryId)
      .populate('assignedTo', 'name email role phone')
      .populate('assignedBy', 'name email')
      .populate('notes.addedBy', 'name email');

    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Entry not found' 
      });
    }

    if (userRole === 'admin') {
      // Admin can see all
    } else if (userRole === 'manager') {
      if (entry.location !== userLocation) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to view this entry' 
        });
      }
    } else {
      if (entry.assignedTo && entry.assignedTo._id.toString() !== userId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to view this entry' 
        });
      }
      if (entry.location !== userLocation) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to view this entry' 
        });
      }
    }

    res.json({
      success: true,
      entry
    });

  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching entry' 
    });
  }
};

// @desc    Update entry
// @route   PUT /api/entries/:id
// @access  Private (Admin/Manager)
export const updateEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const updates = req.body;
    const userRole = req.userRole;
    const userId = req.userId;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update entries' 
      });
    }

    if (userRole === 'manager') {
      const entry = await Entry.findById(entryId);
      if (!entry) {
        return res.status(404).json({ 
          success: false, 
          message: 'Entry not found' 
        });
      }
      
      const manager = await User.findById(userId);
      if (entry.location !== manager.location) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to update entries from other locations' 
        });
      }
    }

    if (updates.assignedTo) {
      updates.assignedBy = userId;
      updates.assignedAt = new Date();
      updates.status = 'assigned';
    }

    const entry = await Entry.findByIdAndUpdate(
      entryId,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email');

    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Entry not found' 
      });
    }

    res.json({
      success: true,
      message: 'Entry updated successfully',
      entry
    });

  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating entry' 
    });
  }
};

// @desc    Add note to entry
// @route   POST /api/entries/:id/notes
// @access  Private (Admin/Manager/Assigned Staff)
export const addNote = async (req, res) => {
  try {
    const entryId = req.params.id;
    const { text } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    const entry = await Entry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Entry not found' 
      });
    }

    const canAddNote = 
      userRole === 'admin' || 
      userRole === 'manager' ||
      (userRole === 'staff' && entry.assignedTo && entry.assignedTo.toString() === userId);

    if (!canAddNote) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to add notes to this entry' 
      });
    }

    entry.notes.push({
      text,
      addedBy: userId
    });

    await entry.save();

    const updatedEntry = await Entry.findById(entryId)
      .populate('notes.addedBy', 'name email');

    res.json({
      success: true,
      message: 'Note added successfully',
      notes: updatedEntry.notes
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while adding note' 
    });
  }
};

// @desc    Get statistics for dashboard
// @route   GET /api/entries/stats/dashboard
// @access  Private (Admin/Manager/Staff)
export const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.userRole;
    const userLocation = req.userLocation;
    const userId = req.userId;

    let matchQuery = {};

    if (userRole === 'admin') {
      // Admin sees all
    } else if (userRole === 'manager') {
      matchQuery.location = userLocation;
    } else {
      matchQuery.location = userLocation;
      matchQuery.$or = [
        { assignedTo: userId },
        { assignedTo: null },
        { status: 'new' }
      ];
    }

    const statusCounts = await Entry.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    let locationCounts = [];
    if (userRole === 'admin') {
      locationCounts = await Entry.aggregate([
        { $group: {
          _id: '$location',
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } }
      ]);
    }

    const priorityCounts = await Entry.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }}
    ]);

    const recentEntries = await Entry.find(matchQuery)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      total: statusCounts.reduce((sum, item) => sum + item.count, 0),
      byStatus: Object.fromEntries(
        statusCounts.map(item => [item._id, item.count])
      ),
      byPriority: Object.fromEntries(
        priorityCounts.map(item => [item._id, item.count])
      ),
      byLocation: Object.fromEntries(
        locationCounts.map(item => [item._id, item.count])
      ),
      recentEntries
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching dashboard stats' 
    });
  }
};

// @desc    Convert entry to task
// @route   POST /api/entries/:id/convert-to-task
// @access  Private (Admin/Manager)
export const convertToTask = async (req, res) => {
  try {
    const entryId = req.params.id;
    const { assignedTo, dueDate, priority } = req.body;
    const assignedBy = req.userId;
    const userRole = req.userRole;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to create tasks' 
      });
    }

    const entry = await Entry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Entry not found' 
      });
    }

    if (userRole === 'manager') {
      const manager = await User.findById(assignedBy);
      if (entry.location !== manager.location) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to create tasks for other locations' 
        });
      }
    }

    const task = new Task({
      title: `Follow up: ${entry.clientName} - ${entry.enquiryType}`,
      description: `Follow up for enquiry: ${entry.enquiryDescription}\n\nClient: ${entry.clientName}\nPhone: ${entry.clientPhone}\nAddress: ${entry.clientAddress}`,
      entryId,
      location: entry.location,
      assignedTo,
      assignedBy,
      priority: priority || entry.priority,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      category: 'follow-up'
    });

    await task.save();

    entry.status = 'assigned';
    entry.assignedTo = assignedTo;
    entry.assignedBy = assignedBy;
    entry.assignedAt = new Date();
    await entry.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .populate('entryId', 'clientName clientPhone enquiryType');

    res.status(201).json({
      success: true,
      message: 'Task created successfully from entry',
      task: populatedTask,
      entry: entry.summary
    });

  } catch (error) {
    console.error('Convert to task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while converting entry to task' 
    });
  }
};
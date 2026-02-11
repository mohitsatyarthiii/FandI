import Entry from '../models/Entry.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

// @desc    Create new entry (form submission)
// @route   POST /api/entries
// @access  Public
export const createEntry = async (req, res) => {
  try {
    const entryData = req.body;

    // Create entry
    const entry = new Entry(entryData);
    await entry.save();

    res.status(201).json({
      success: true,
      message: 'Entry submitted successfully',
      entry: entry.summary
    });

  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while submitting entry' 
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

    // Build query
    let query = {};

    // Role-based filtering
    if (userRole === 'admin') {
      // Admin can see all entries
      if (location && location !== 'all') query.location = location;
    } else if (userRole === 'manager') {
      // Manager can see entries from their location only
      query.location = userLocation;
    } else {
      // Staff can see entries assigned to them or unassigned in their location
      query.location = userLocation;
      query.$or = [
        { assignedTo: userId },
        { assignedTo: null },
        { status: 'new' }
      ];
    }

    // Additional filters
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get entries with populated assignedTo
    const entries = await Entry.find(query)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
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

    // Check permission
    if (userRole === 'admin') {
      // Admin can see all
    } else if (userRole === 'manager') {
      // Manager can see only their location
      if (entry.location !== userLocation) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to view this entry' 
        });
      }
    } else {
      // Staff can see only if assigned to them or in their location and unassigned
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

    // Check permission
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update entries' 
      });
    }

    // If manager, verify they're updating entry from their location
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

    // If assigning to someone, set assignedBy and assignedAt
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

    // Check permission
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

    // Add note
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

    // Role-based filtering
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

    // Get counts by status
    const statusCounts = await Entry.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    // Get counts by location (for admin only)
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

    // Get counts by priority
    const priorityCounts = await Entry.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }}
    ]);

    // Get recent entries
    const recentEntries = await Entry.find(matchQuery)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Format response
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

    // Check permission
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

    // If manager, verify they're assigning in their location
    if (userRole === 'manager') {
      const manager = await User.findById(assignedBy);
      if (entry.location !== manager.location) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to create tasks for other locations' 
        });
      }
    }

    // Create task from entry
    const task = new Task({
      title: `Follow up: ${entry.clientName} - ${entry.enquiryType}`,
      description: `Follow up for enquiry: ${entry.enquiryDescription}\n\nClient: ${entry.clientName}\nPhone: ${entry.clientPhone}\nAddress: ${entry.clientAddress}`,
      entryId,
      location: entry.location,
      assignedTo,
      assignedBy,
      priority: priority || entry.priority,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
      category: 'follow-up'
    });

    await task.save();

    // Update entry status
    entry.status = 'assigned';
    entry.assignedTo = assignedTo;
    entry.assignedBy = assignedBy;
    entry.assignedAt = new Date();
    await entry.save();

    // Populate task details
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
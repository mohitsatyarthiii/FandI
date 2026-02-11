import Task from '../models/Task.js';
import User from '../models/User.js';
import Entry from '../models/Entry.js';

/* ==========================================================
   1) CREATE TASK
========================================================== */

export const createTask = async (req, res) => {
  try {
    const taskData = req.body;
    const assignedBy = req.userId;
    const userRole = req.userRole;
    const userLocation = req.userLocation;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tasks'
      });
    }

    taskData.assignedBy = assignedBy;

    if (userRole === 'manager') {
      if (taskData.location !== userLocation) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create tasks for other locations'
        });
      }

      const assignedUser = await User.findById(taskData.assignedTo);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found'
        });
      }

      if (assignedUser.role !== 'staff') {
        return res.status(403).json({
          success: false,
          message: 'Can only assign tasks to staff members'
        });
      }

      if (assignedUser.location !== userLocation) {
        return res.status(403).json({
          success: false,
          message: 'Can only assign tasks to staff in your location'
        });
      }
    }

    const task = new Task(taskData);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role location phone')
      .populate('assignedBy', 'name email role location')
      .populate('entryId', 'clientName clientPhone clientAddress enquiryType');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task'
    });
  }
};

/* ==========================================================
   2) GET ALL TASKS (with filters)
========================================================== */

export const getTasks = async (req, res) => {
  try {
    const {
      status,
      assignedTo,
      location,
      priority,
      category,
      overdue,
      page = 1,
      limit = 20
    } = req.query;

    const userRole = req.userRole;
    const userLocation = req.userLocation;
    const userId = req.userId;

    let query = {};

    if (userRole === 'admin') {
      if (location && location !== 'all') {
        query.location = location;
      }
    } else if (userRole === 'manager') {
      query.location = userLocation;
    } else {
      query.assignedTo = userId;
    }

    if (status && status !== 'all') query.status = status;
    if (assignedTo && assignedTo !== 'all') query.assignedTo = assignedTo;
    if (priority && priority !== 'all') query.priority = priority;
    if (category && category !== 'all') query.category = category;

    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['completed', 'cancelled'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role location phone isActive')
      .populate('assignedBy', 'name email role location')
      .populate('entryId', 'clientName clientPhone clientAddress enquiryType location')
      .sort({ priority: -1, dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      count: tasks.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      tasks
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
};

/* ==========================================================
   3) GET SINGLE TASK (getTask)
========================================================== */

export const getTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.userId;
    const userRole = req.userRole;

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email role location phone')
      .populate('assignedBy', 'name email role location')
      .populate('entryId', 'clientName clientPhone clientAddress enquiryType');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const canAccess =
      userRole === 'admin' ||
      userRole === 'manager' ||
      task.assignedTo.toString() === userId;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task'
      });
    }

    res.json({ success: true, task });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task'
    });
  }
};

/* ==========================================================
   4) UPDATE TASK STATUS
========================================================== */

export const updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status, progress, note } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const canUpdate =
      userRole === 'admin' ||
      userRole === 'manager' ||
      task.assignedTo.toString() === userId;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    task.status = status;
    if (progress !== undefined) task.progress = progress;

    task.updates.push({
      text: note || `Status changed to ${status}`,
      status,
      updatedBy: userId
    });

    if (status === 'completed') {
      task.completedDate = new Date();
      task.progress = 100;
    }

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'name email role location')
      .populate('assignedBy', 'name email role location');

    res.json({
      success: true,
      message: 'Task status updated',
      task: updatedTask
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
};

/* ==========================================================
   5) UPDATE TASK DETAILS (admin/manager)
========================================================== */

export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userRole = req.userRole;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update task'
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email role location')
      .populate('assignedBy', 'name email role location');

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task'
    });
  }
};

/* ==========================================================
   6) ADD ATTACHMENT
========================================================== */

export const addAttachment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { filename, path } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const canAdd =
      userRole === 'admin' ||
      userRole === 'manager' ||
      task.assignedTo.toString() === userId;

    if (!canAdd) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add attachment'
      });
    }

    task.attachments.push({
      filename,
      path,
      uploadedBy: userId
    });

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('attachments.uploadedBy', 'name email');

    res.json({
      success: true,
      message: 'Attachment added',
      attachments: updatedTask.attachments
    });

  } catch (error) {
    console.error('Add attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding attachment'
    });
  }
};

/* ==========================================================
   7) DASHBOARD STATS (getTaskStats)
========================================================== */

export const getTaskStats = async (req, res) => {
  try {
    const userRole = req.userRole;
    const userLocation = req.userLocation;
    const userId = req.userId;

    let match = {};

    if (userRole === 'manager') {
      match.location = userLocation;
    }

    if (userRole === 'staff') {
      match.assignedTo = userId;
    }

    const stats = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    stats.forEach(s => {
      result[s._id] = s.count;
    });

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats'
    });
  }
};

/* ==========================================================
   8) GET MY TASKS (staff)
========================================================== */

export const getMyTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    let query = { assignedTo: userId };
    if (status && status !== 'all') query.status = status;

    const tasks = await Task.find(query)
      .populate('assignedBy', 'name email role')
      .populate('entryId', 'clientName clientPhone clientAddress enquiryType')
      .sort({ priority: -1, dueDate: 1, createdAt: -1 })
      .limit(50);

    const counts = await Task.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {};
    counts.forEach(c => {
      stats[c._id] = c.count;
    });

    res.json({
      success: true,
      count: tasks.length,
      stats,
      tasks
    });

  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your tasks'
    });
  }
};

export const getTasksAssignedByMe = async (req, res) => {
  try {
    const userId = req.userId;

    const tasks = await Task.find({ assignedBy: userId })
      .populate('assignedTo', 'name role location')
      .populate('entryId', 'clientName enquiryType location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


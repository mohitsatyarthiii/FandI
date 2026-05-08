// controllers/taskController.js
import Task from '../models/Task.js';
import User from '../models/User.js';
import Entry from '../models/Entry.js';
import twilioService from '../services/twilioService.js';

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
};

// controllers/taskController.js - Update sendTaskNotifications function
const sendTaskNotifications = async (task, staff, customer) => {
  const results = {
    staff: { sms: false, whatsapp: false },
    customer: { sms: false, whatsapp: false }
  };
  
  const companyName = process.env.COMPANY_NAME || 'Fandi';
  
  console.log('\n📱 ========== TASK NOTIFICATIONS ==========');
  console.log(`📋 Task: ${task.title}`);
  console.log(`👨‍🔧 Staff: ${staff?.name} (${staff?.phone})`);
  console.log(`👤 Customer: ${customer?.clientName} (${customer?.clientPhone})`);
  console.log(`📅 Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'Not set'}`);
  
  // ========== STAFF NOTIFICATIONS ==========
  if (staff && staff.phone) {
    const cleanStaffPhone = cleanPhoneNumber(staff.phone);
    
    console.log('\n📨 Sending to STAFF...');
    
    // Staff SMS Message
    const staffSMS = `🚀 New Task Assigned – ${companyName}

Hi ${staff?.name || 'Team'}, 👋

You’ve been assigned a new task. Please find the details below:

👤 Customer: ${customer?.clientName || 'N/A'}  
📞 Phone: ${customer?.clientPhone || 'N/A'}  
📍 Address: ${customer?.clientAddress || 'N/A'}  

🛠 Task: ${task.title}  
📅 Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'ASAP'}  

Please ensure timely completion and maintain service quality standards.

All the best! 💪`;

    // Send SMS to Staff
    try {
      const smsResult = await twilioService.sendSMS(cleanStaffPhone, staffSMS);
      if (smsResult.success) {
        results.staff.sms = true;
        console.log(`✅ Staff SMS sent to ${cleanStaffPhone}`);
        // Don't pass the full response object
        await task.markNotificationSent('sms', 'staff', smsResult.sid);
      } else {
        console.log(`❌ Staff SMS failed: ${smsResult.error}`);
        await task.markNotificationFailed('sms', 'staff', smsResult.error);
      }
    } catch (error) {
      console.error(`❌ Staff SMS error:`, error.message);
      await task.markNotificationFailed('sms', 'staff', error.message);
    }

    // Staff WhatsApp Message
    const staffWhatsApp = `*${companyName} - New Task*\n\nHello ${staff.name},\n\nNew task assigned.\n\n📋 *Details:*\n• Customer: ${customer?.clientName || 'N/A'}\n• Phone: ${customer?.clientPhone || 'N/A'}\n• Address: ${customer?.clientAddress || 'N/A'}\n• Task: ${task.title}\n• Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'ASAP'}\n\nRegards,\n${companyName}`;

    // Try WhatsApp to Staff
    try {
      const waResult = await twilioService.sendWhatsApp(cleanStaffPhone, staffWhatsApp);
      if (waResult.success) {
        results.staff.whatsapp = true;
        console.log(`✅ Staff WhatsApp sent to ${cleanStaffPhone}`);
        await task.markNotificationSent('whatsapp', 'staff', waResult.sid);
      } else {
        console.log(`ℹ️ Staff WhatsApp failed: ${waResult.error}`);
      }
    } catch (error) {
      console.log(`ℹ️ Staff WhatsApp error:`, error.message);
    }
  }

  // ========== CUSTOMER NOTIFICATIONS ==========
  if (customer && customer.clientPhone) {
    const cleanCustomerPhone = cleanPhoneNumber(customer.clientPhone);
    
    console.log('\n📨 Sending to CUSTOMER...');
    
    // Customer SMS Message
    const customerSMS = `✨ ${companyName} Service Update

Hi ${customer.clientName}, 👋  

We’re happy to inform you that your service request has been successfully scheduled.

👨‍🔧 Assigned Staff: ${staff?.name || 'Our Executive'}  
📞 Contact Number: ${staff?.phone || 'Will be shared shortly'}  
📅 Visit Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'Scheduled soon'}  

Our team member will visit your location and assist you with your request.

📞 For any queries or support, feel free to call or WhatsApp us at: +91 93197 25916  

Thank you for choosing ${companyName}! 🙌`;

    // Send SMS to Customer
    try {
      const smsResult = await twilioService.sendSMS(cleanCustomerPhone, customerSMS);
      if (smsResult.success) {
        results.customer.sms = true;
        console.log(`✅ Customer SMS sent to ${cleanCustomerPhone}`);
        await task.markNotificationSent('sms', 'customer', smsResult.sid);
      } else {
        console.log(`❌ Customer SMS failed: ${smsResult.error}`);
        await task.markNotificationFailed('sms', 'customer', smsResult.error);
      }
    } catch (error) {
      console.error(`❌ Customer SMS error:`, error.message);
      await task.markNotificationFailed('sms', 'customer', error.message);
    }

    // Customer WhatsApp Message
    const customerWhatsApp = `*${companyName} - Service Confirmation*\n\nDear ${customer.clientName},\n\nThank you! Your request is confirmed.\n\n✅ *Details:*\n• Staff: ${staff?.name || 'Assigned'}\n• Contact: ${staff?.phone || 'N/A'}\n• Visit: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'Scheduled soon'}\n\nRegards,\n${companyName}`;

    // Try WhatsApp to Customer
    try {
      const waResult = await twilioService.sendWhatsApp(cleanCustomerPhone, customerWhatsApp);
      if (waResult.success) {
        results.customer.whatsapp = true;
        console.log(`✅ Customer WhatsApp sent to ${cleanCustomerPhone}`);
        await task.markNotificationSent('whatsapp', 'customer', waResult.sid);
      } else {
        console.log(`ℹ️ Customer WhatsApp failed: ${waResult.error}`);
      }
    } catch (error) {
      console.log(`ℹ️ Customer WhatsApp error:`, error.message);
    }
  }

  // Save task after all notifications
  try {
    await task.save();
    console.log('✅ Notification status saved to database');
  } catch (saveError) {
    console.error('❌ Failed to save notification status:', saveError.message);
  }

  console.log('📱 ==========================================\n');
  
  return results;
};

/* ==========================================================
   1) CREATE TASK WITH NOTIFICATIONS
========================================================== */
// controllers/taskController.js - Update createTask
export const createTask = async (req, res) => {
  try {
    const taskData = req.body;
    const assignedBy = req.userId;
    const userRole = req.userRole;
    const userLocation = req.userLocation;

    // Authorization checks
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tasks'
      });
    }

    taskData.assignedBy = assignedBy;

    // Manager location validation
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

    // Create task
    const task = new Task(taskData);
    await task.save();
    
    console.log(`\n✅ Task created: ${task._id}`);

    // Get staff and customer details
    const staff = await User.findById(taskData.assignedTo).select('name phone email location');
    const customer = taskData.entryId ? 
      await Entry.findById(taskData.entryId).select('clientName clientPhone clientAddress clientCity enquiryType') : 
      null;

    // Send notifications (don't await - fire and forget but handle errors)
    sendTaskNotifications(task, staff, customer).catch(err => {
      console.error('Background notification error:', err);
    });

    // Get populated task for response
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role location phone')
      .populate('assignedBy', 'name email role location')
      .populate('entryId', 'clientName clientPhone clientAddress enquiryType');

    res.status(201).json({
      success: true,
      message: 'Task created successfully. Notifications are being sent.',
      task: populatedTask
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
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

    // Role-based filtering
    if (userRole === 'admin') {
      if (location && location !== 'all') {
        query.location = location;
      }
    } else if (userRole === 'manager') {
      query.location = userLocation;
    } else {
      query.assignedTo = userId;
    }

    // Apply filters
    if (status && status !== 'all') query.status = status;
    if (assignedTo && assignedTo !== 'all') query.assignedTo = assignedTo;
    if (priority && priority !== 'all') query.priority = priority;
    if (category && category !== 'all') query.category = category;

    // Overdue filter
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['completed', 'cancelled'] };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch tasks
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
   3) GET SINGLE TASK
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

    // Check access
    const canAccess =
      userRole === 'admin' ||
      userRole === 'manager' ||
      (task.assignedTo && task.assignedTo._id.toString() === userId);

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

    // Check access
    const canUpdate =
      userRole === 'admin' ||
      userRole === 'manager' ||
      (task.assignedTo && task.assignedTo.toString() === userId);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Update fields
    task.status = status;
    if (progress !== undefined) task.progress = progress;

    // Add update entry
    task.updates.push({
      text: note || `Status changed to ${status}`,
      status,
      updatedBy: userId,
      updatedAt: new Date()
    });

    // If completed, set completed date
    if (status === 'completed') {
      task.completedDate = new Date();
      task.progress = 100;
    }

    await task.save();

    // Get updated task with populated fields
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
    const updateData = req.body;

    // Check authorization
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update task'
      });
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
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

    // Check access
    const canAdd =
      userRole === 'admin' ||
      userRole === 'manager' ||
      (task.assignedTo && task.assignedTo.toString() === userId);

    if (!canAdd) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add attachment'
      });
    }

    // Add attachment
    task.attachments.push({
      filename,
      path,
      uploadedBy: userId,
      uploadedAt: new Date()
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
   7) DASHBOARD STATS
========================================================== */

export const getTaskStats = async (req, res) => {
  try {
    const userRole = req.userRole;
    const userLocation = req.userLocation;
    const userId = req.userId;

    let match = {};

    // Role-based filtering
    if (userRole === 'manager') {
      match.location = userLocation;
    } else if (userRole === 'staff') {
      match.assignedTo = userId;
    }

    // Get stats by status
    const statusStats = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get stats by priority
    const priorityStats = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get overdue count
    const overdueCount = await Task.countDocuments({
      ...match,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    });

    // Format results
    const statusResult = {};
    statusStats.forEach(s => {
      statusResult[s._id] = s.count;
    });

    const priorityResult = {};
    priorityStats.forEach(p => {
      priorityResult[p._id] = p.count;
    });

    res.json({
      success: true,
      stats: {
        byStatus: statusResult,
        byPriority: priorityResult,
        overdue: overdueCount,
        total: statusStats.reduce((acc, curr) => acc + curr.count, 0)
      }
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

    // Get counts for each status
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

/* ==========================================================
   9) GET TASKS ASSIGNED BY ME (for admin/manager)
========================================================== */

export const getTasksAssignedByMe = async (req, res) => {
  try {
    const userId = req.userId;

    const tasks = await Task.find({ assignedBy: userId })
      .populate('assignedTo', 'name role location phone')
      .populate('entryId', 'clientName enquiryType location clientPhone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks
    });

  } catch (error) {
    console.error('Get tasks assigned by me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/* ==========================================================
   10) RETRY FAILED NOTIFICATIONS
========================================================== */

// controllers/taskController.js - Update retryNotifications
export const retryNotifications = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userRole = req.userRole;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to retry notifications'
      });
    }

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name phone')
      .populate('entryId', 'clientName clientPhone clientAddress');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const staff = task.assignedTo;
    const customer = task.entryId;

    // Send notifications
    const results = await sendTaskNotifications(task, staff, customer);

    res.json({
      success: true,
      message: 'Notifications retry completed',
      results
    });

  } catch (error) {
    console.error('Retry notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};
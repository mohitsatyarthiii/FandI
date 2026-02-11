import User from '../models/User.js';

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, location, phone } = req.body;
    const createdBy = req.userId;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
      location,
      phone,
      createdBy
    });

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating user' 
    });
  }
};

// @desc    Get all users (with filters)
// @route   GET /api/users
// @access  Private (Admin/Manager)
export const getUsers = async (req, res) => {
  try {
    const { role, location, isActive } = req.query;
    const userRole = req.userRole;
    const userLocation = req.userLocation;

    // Build query
    let query = {};

    // Role-based filtering
    if (userRole === 'manager') {
      // Manager can only see staff in their location
      query = { 
        $or: [
          { role: 'staff', location: userLocation },
          { _id: req.userId } // Can see themselves
        ]
      };
    } else if (userRole === 'admin') {
      // Admin can see all users
      if (role) query.role = role;
      if (location && location !== 'all') query.location = location;
      if (isActive !== undefined) query.isActive = isActive === 'true';
    } else {
      // Staff can only see themselves
      query = { _id: req.userId };
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching users' 
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/Manager/Self)
export const getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const requesterId = req.userId;
    const requesterRole = req.userRole;

    // Check permission
    if (requesterRole !== 'admin' && requesterId !== userId) {
      // If not admin and not self, check if manager viewing their staff
      if (requesterRole === 'manager') {
        const requester = await User.findById(requesterId);
        const targetUser = await User.findById(userId);
        
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
          });
        }

        // Manager can only view staff in their location
        if (targetUser.role !== 'staff' || targetUser.location !== requester.location) {
          return res.status(403).json({ 
            success: false, 
            message: 'Not authorized to view this user' 
          });
        }
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized' 
        });
      }
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching user' 
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/Manager/Self)
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    const requesterId = req.userId;
    const requesterRole = req.userRole;

    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.email; // Email should be updated separately

    // Check permission
    if (requesterRole !== 'admin' && requesterId !== userId) {
      // If not admin and not self, check if manager updating their staff
      if (requesterRole === 'manager') {
        const requester = await User.findById(requesterId);
        const targetUser = await User.findById(userId);
        
        if (!targetUser) {
          return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
          });
        }

        // Manager can only update staff in their location
        if (targetUser.role !== 'staff' || targetUser.location !== requester.location) {
          return res.status(403).json({ 
            success: false, 
            message: 'Not authorized to update this user' 
          });
        }

        // Manager cannot change role or location
        if (updates.role || updates.location) {
          return res.status(403).json({ 
            success: false, 
            message: 'Manager cannot change role or location' 
          });
        }
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized' 
        });
      }
    }

    // Self-update restrictions
    if (requesterId === userId && updates.role) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot change your own role' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating user' 
    });
  }
};

// @desc    Delete/Deactivate user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const requesterRole = req.userRole;

    // Only admin can delete users
    if (requesterRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete users' 
      });
    }

    // Cannot delete yourself
    if (userId === req.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Soft delete - set isActive to false
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting user' 
    });
  }
};

// @desc    Get users by location
// @route   GET /api/users/location/:location
// @access  Private (Admin/Manager)
export const getUsersByLocation = async (req, res) => {
  try {
    const { location } = req.params;

    const users = await User.find({
      location: location,
      isActive: true
    }).select('name email role location phone isActive');

    res.json({
      success: true,
      users
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
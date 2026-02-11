import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (userId, role, location) => {
  return jwt.sign(
    { userId, role, location },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated. Contact admin.' 
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = generateToken(user._id, user.role, user.location);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        phone: user.phone || ''
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        phone: user.phone,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ✅ FIX: Add changePassword export
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while changing password' 
    });
  }
};

// ✅ FIX: Add resetUserPassword export
// @desc    Reset user password (Admin/Manager only)
// @route   PUT /api/auth/reset-password/:userId
// @access  Private (Admin/Manager)
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { userId } = req.params;
    const requesterId = req.userId;
    const requesterRole = req.userRole;

    // Validation
    if (!newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password is required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    // Check if requester has permission
    if (requesterRole !== 'admin' && requesterRole !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to reset passwords' 
      });
    }

    // If manager, check if they're managing this user
    if (requesterRole === 'manager') {
      const requester = await User.findById(requesterId);
      const targetUser = await User.findById(userId);
      
      if (!targetUser) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Manager can only reset staff passwords in their location
      if (targetUser.role !== 'staff' || targetUser.location !== requester.location) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to reset this user\'s password' 
        });
      }
    }

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while resetting password' 
    });
  }
};

// @desc    Get users by location
// @route   GET /api/users/location/:location
// @access  Private (Admin/Manager)
export const getUsersByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    const userRole = req.userRole;
    const userLocation = req.userLocation;

    console.log('Getting users by location:', location, 'Role:', userRole);

    // Validate location
    const validLocations = ['mathura', 'agra', 'noida'];
    if (!validLocations.includes(location)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid location' 
      });
    }

    // Check permission
    if (userRole === 'manager' && location !== userLocation) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view users from other locations' 
      });
    }

    const users = await User.find({ 
      location, 
      isActive: true
    }).select('name email role phone location isActive').sort({ role: 1, name: 1 });

    console.log(`Found ${users.length} users in ${location}`);

    res.json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get users by location error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching users' 
    });
  }
};
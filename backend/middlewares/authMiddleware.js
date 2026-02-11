import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userLocation = decoded.location;
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Role ${req.userRole} not authorized` 
      });
    }

    next();
  };
};
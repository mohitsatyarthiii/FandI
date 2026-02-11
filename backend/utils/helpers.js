// Response helper functions
export const responseHelper = {
  success: (res, data = {}, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      ...data
    });
  },
  
  error: (res, message = 'Error occurred', statusCode = 500, errors = null) => {
    const response = {
      success: false,
      message
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
  },
  
  validationError: (res, errors) => {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  },
  
  notFound: (res, resource = 'Resource') => {
    return res.status(404).json({
      success: false,
      message: `${resource} not found`
    });
  },
  
  unauthorized: (res, message = 'Unauthorized access') => {
    return res.status(401).json({
      success: false,
      message
    });
  },
  
  forbidden: (res, message = 'Access denied') => {
    return res.status(403).json({
      success: false,
      message
    });
  }
};

// Pagination helper
export const paginate = (query, page = 1, limit = 20) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return query.skip(skip).limit(parseInt(limit));
};

// Generate random password
export const generateRandomPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as Indian phone number
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  
  return phone;
};

// Get location display name
export const getLocationDisplayName = (locationCode) => {
  const locations = {
    'mathura': 'Mathura',
    'agra': 'Agra',
    'noida': 'Noida',
    'all': 'All Locations'
  };
  
  return locations[locationCode] || locationCode;
};

// Get role display name
export const getRoleDisplayName = (roleCode) => {
  const roles = {
    'admin': 'Administrator',
    'manager': 'Manager',
    'staff': 'Staff'
  };
  
  return roles[roleCode] || roleCode;
};

// Date formatter
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY HH:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    default:
      return d.toLocaleDateString();
  }
};

// Calculate task completion time
export const calculateCompletionTime = (startDate, endDate) => {
  if (!startDate || !endDate) return 'N/A';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
};

// Filter data by user role and location
export const filterByRoleAndLocation = (data, userRole, userLocation) => {
  if (userRole === 'admin') {
    return data; // Admin sees everything
  }
  
  if (userRole === 'manager') {
    return data.filter(item => item.location === userLocation);
  }
  
  // Staff only sees their assigned data
  return data.filter(item => item.assignedTo && item.assignedTo.toString() === userLocation);
};

// Generate dashboard statistics
export const generateStats = (data, groupByField) => {
  const stats = {};
  
  data.forEach(item => {
    const key = item[groupByField] || 'unknown';
    stats[key] = (stats[key] || 0) + 1;
  });
  
  return stats;
};
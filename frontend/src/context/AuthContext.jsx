import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAPI, getMeAPI } from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    console.log('🔍 Checking auth - Token exists:', !!token);

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        
        // Verify token with backend
        const response = await getMeAPI();
        if (response.data.success) {
          console.log('✅ Token verified, user:', response.data.user);
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🔐 Login attempt:', email);
      
      const response = await loginAPI(email, password);
      console.log('📦 Login response:', response.data);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state
        setUser(user);
        setError(null);
        
        console.log('✅ Login successful, redirecting...');
        
        // Redirect to dashboard
        navigate('/dashboard');
        
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let message = 'Login failed. Please try again.';
      
      if (error.response) {
        console.log('Error response:', error.response.data);
        message = error.response.data?.message || message;
      } else if (error.request) {
        console.log('No response received');
        message = 'Cannot connect to server. Check if backend is running.';
      } else {
        console.log('Error:', error.message);
        message = error.message;
      }
      
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isStaff: user?.role === 'staff'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
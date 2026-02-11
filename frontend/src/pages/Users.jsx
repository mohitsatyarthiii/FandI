import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  getUsersAPI, 
  createUserAPI, 
  updateUserAPI, 
  deleteUserAPI,
  getUsersByLocationAPI,
  resetPasswordAPI 
} from '../api/axios';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Shield,
  Mail,
  Phone,
  MoreVertical,
  RefreshCw,
  UserPlus,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

const Users = () => {
  const { user: currentUser, isAdmin, isManager } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    location: 'mathura',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const locations = ['mathura', 'agra', 'noida'];
  
  useEffect(() => {
    fetchUsers();
  }, [selectedLocation]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let response;
      
      if (isAdmin) {
        const params = selectedLocation !== 'all' ? { location: selectedLocation } : {};
        response = await getUsersAPI(params);
      } else if (isManager) {
        response = await getUsersByLocationAPI(currentUser.location);
      }
      
      setUsers(response?.data?.users || []);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await createUserAPI(formData);
      if (response.data.success) {
        setSuccess('User created successfully!');
        setShowAddModal(false);
        setFormData({
          name: '', email: '', password: '', role: 'staff', location: 'mathura', phone: ''
        });
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleResetPassword = async () => {
    try {
      setError('');
      const response = await resetPasswordAPI(selectedUser._id, 'Default@123');
      if (response.data.success) {
        setSuccess(`Password reset for ${selectedUser.name}. New password: Default@123`);
        setShowResetModal(false);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await updateUserAPI(user._id, { isActive: !user.isActive });
      fetchUsers();
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    staff: 'bg-green-100 text-green-800'
  };

  const locationColors = {
    mathura: 'bg-orange-100 text-orange-800',
    agra: 'bg-blue-100 text-blue-800',
    noida: 'bg-green-100 text-green-800',
    all: 'bg-gray-100 text-gray-800'
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UsersIcon className="h-6 w-6 text-indigo-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              {isAdmin ? 'Manage all users across locations' : `Manage staff in ${currentUser?.location}`}
            </p>
          </div>
          
          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus size={18} />
              Add New User
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {success}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc} className="capitalize">{loc}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <div key={user._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {user.name?.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white 
                        ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${roleColors[user.role]}`}>
                          {user.role}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${locationColors[user.location]}`}>
                          {user.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        document.getElementById(`menu-${user._id}`)?.classList.toggle('hidden');
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical size={18} className="text-gray-500" />
                    </button>
                    
                    <div id={`menu-${user._id}`} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1 hidden">
                      {(isAdmin || (isManager && user.role === 'staff')) && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowResetModal(true);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <RefreshCw size={14} />
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                      {isAdmin && user.role !== 'admin' && (
                        <button
                          onClick={() => deleteUserAPI(user._id).then(() => fetchUsers())}
                          className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          Delete User
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    <span>{user.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="staff">Staff</option>
                    {isAdmin && <option value="manager">Manager</option>}
                    {isAdmin && <option value="admin">Admin</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {isAdmin ? (
                      <>
                        {locations.map(loc => <option key={loc} value={loc} className="capitalize">{loc}</option>)}
                        <option value="all">All Locations</option>
                      </>
                    ) : (
                      <option value={currentUser.location} className="capitalize">{currentUser.location}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
              <p className="text-gray-600 mb-6">
                Reset password for <span className="font-semibold">{selectedUser.name}</span>?
                <br />
                New password will be: <span className="font-mono bg-gray-100 px-2 py-1 rounded">Default@123</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleResetPassword}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;
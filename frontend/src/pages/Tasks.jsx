import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../context/AuthContext';
import { 
  getTasksAPI, 
  createTaskAPI, 
  updateTaskAPI,
  updateTaskStatusAPI,
  getMyTasksAPI,
  getUsersByLocationAPI,
  getEntriesAPI
} from '../api/axios';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  X,
  AlertCircle,
  Flag,
  Clock,
  Tag,
  Paperclip,
  FileText,
  Briefcase,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

const Tasks = () => {
  const { user, isAdmin, isManager, isStaff } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    location: user?.location || 'mathura',
    priority: 'medium',
    dueDate: '',
    category: 'other',
    entryId: '',
    startDate: '',
    progress: 0,
    status: 'pending'
  });
  
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    progress: 0,
    text: ''
  });
  
  const [attachmentData, setAttachmentData] = useState({
    filename: '',
    path: ''
  });

  // Staff and entry data
  const [staffList, setStaffList] = useState([]);
  const [allStaffList, setAllStaffList] = useState([]);
  const [entriesList, setEntriesList] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Constants
  const locations = ['mathura', 'agra', 'noida'];
  const statuses = ['pending', 'in-progress', 'completed', 'on-hold', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const categories = ['follow-up', 'site-visit', 'documentation', 'meeting', 'other'];

  // ============= FETCH FUNCTIONS =============
  
  useEffect(() => {
    fetchTasks();
  }, [selectedStatus, selectedPriority, selectedLocation, selectedCategory]);

  useEffect(() => {
    if (showCreateModal) {
      fetchStaffForLocation(formData.location);
      if (isAdmin) {
        fetchAllStaff();
        fetchEntries();
      }
    }
  }, [showCreateModal, formData.location]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let response;
      const params = {};
      
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedPriority !== 'all') params.priority = selectedPriority;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      
      if (isStaff) {
        console.log('Fetching my tasks for staff');
        response = await getMyTasksAPI(params);
        setTasks(response.data.tasks || []);
      } else {
        if (!isAdmin) {
          params.location = user.location;
        } else if (selectedLocation !== 'all') {
          params.location = selectedLocation;
        }
        console.log('Fetching tasks with params:', params);
        response = await getTasksAPI(params);
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

const fetchStaffForLocation = async (location) => {
  try {
    setLoadingStaff(true);
    console.log('Fetching users for location:', location);

    if (!location) return;

    const response = await getUsersByLocationAPI(location);
    const users = response.data.users || [];

    console.log("Users from API:", users);

    if (isAdmin) {
      // ✅ ADMIN: managers + staff दिखाओ (role-wise)
      const filtered = users.filter(u => u.isActive === true);
      setStaffList(filtered);
    } 
    else if (isManager) {
      // ✅ MANAGER: सिर्फ staff दिखाओ
      const staff = users.filter(u => 
        u.role === 'staff' && u.isActive === true
      );
      setStaffList(staff);
    }

  } catch (error) {
    console.error('Fetch staff error:', error);
    setError('Failed to fetch users list');
  } finally {
    setLoadingStaff(false);
  }
};


const fetchAllStaff = async () => {
  try {
    const promises = locations.map(loc => getUsersByLocationAPI(loc));
    const responses = await Promise.all(promises);

    const allUsers = responses.flatMap(res =>
      res.data.users?.filter(u => u.isActive === true) || []
    );

    console.log("All active users:", allUsers);
    setAllStaffList(allUsers);

  } catch (error) {
    console.error('Fetch all users error:', error);
  }
};


  const fetchEntries = async () => {
    try {
      setLoadingEntries(true);
      const response = await getEntriesAPI({ 
        limit: 50 
      });
      console.log('Entries API response:', response.data.entries?.length);
      setEntriesList(response.data.entries || []);
    } catch (error) {
      console.error('Fetch entries error:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  // ============= HANDLER FUNCTIONS =============

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validate form
      if (!formData.assignedTo) {
        setError('Please assign task to a staff member');
        return;
      }

      const taskData = {
        ...formData,
        assignedBy: user.id,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        progress: 0,
        status: 'pending'
      };

      console.log('Creating task with data:', taskData);

      const response = await createTaskAPI(taskData);
      
      if (response.data.success) {
        setSuccess('Task created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Create task error:', error);
      setError(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async () => {
    try {
      const response = await updateTaskAPI(selectedTask._id, formData);
      if (response.data.success) {
        setSuccess('Task updated successfully!');
        setShowUpdateModal(false);
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Update task error:', error);
      setError(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await updateTaskStatusAPI(
        selectedTask._id,
        statusUpdate.status,
        statusUpdate.progress,
        statusUpdate.text
      );
      
      if (response.data.success) {
        setSuccess('Task status updated successfully!');
        setShowUpdateModal(false);
        setStatusUpdate({ status: '', progress: 0, text: '' });
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Update status error:', error);
      setError(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleEntrySelect = async (entryId) => {
    if (!entryId) return;
    
    try {
      // Find entry from entriesList
      const entry = entriesList.find(e => e._id === entryId);
      if (!entry) return;
      
      setSelectedEntry(entry);
      
      // Auto-fill form from entry
      setFormData({
        ...formData,
        title: `Follow-up: ${entry.clientName} - ${entry.enquiryType}`,
        description: `Client: ${entry.clientName}\nPhone: ${entry.clientPhone}\nAddress: ${entry.clientAddress}\nCity: ${entry.clientCity || ''}\n\nEnquiry: ${entry.enquiryDescription}`,
        location: entry.location,
        priority: entry.priority || 'medium',
        entryId: entry._id,
        category: 'follow-up'
      });
      
      // Location ke hisaab se staff fetch karo
      await fetchStaffForLocation(entry.location);
      
    } catch (error) {
      console.error('Entry select error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      location: user?.location || 'mathura',
      priority: 'medium',
      dueDate: '',
      category: 'other',
      entryId: '',
      startDate: '',
      progress: 0,
      status: 'pending'
    });
    setSelectedEntry(null);
    setError('');
  };

  // ============= HELPER FUNCTIONS =============

 const getFilteredStaff = () => {
  if (isAdmin) {
    if (selectedLocation !== 'all') {
      return staffList;       // location-wise users
    }
    return allStaffList;      // सभी locations के users
  }

  if (isManager) {
    return staffList;         // सिर्फ अपनी location के staff
  }

  return [];
};


const getStaffDisplayName = (user) => {
  return `${user.name} - ${user.role} (${user.location})`;
};
  const getStatusCount = (status) => {
    return tasks.filter(t => t.status === status).length;
  };

  const getPriorityCount = (priority) => {
    return tasks.filter(t => t.priority === priority).length;
  };

  const filteredTasks = tasks.filter(task => 
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header - same as before */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-indigo-600" />
              {isStaff ? 'My Tasks' : 'Task Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isStaff 
                ? 'View and update your assigned tasks' 
                : isAdmin 
                  ? 'Manage tasks across all locations'
                  : `Manage tasks in ${user?.location} location`}
            </p>
          </div>
          
          {(isAdmin || isManager) && (
            <button
              onClick={() => {
                resetForm();
                fetchStaffForLocation(user?.location || 'mathura');
                if (isAdmin) {
                  fetchAllStaff();
                  fetchEntries();
                }
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Create Task
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

        {/* Stats Cards - same as before */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{tasks.length}</p>
          </div>
          {statuses.map(status => (
            <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-600 capitalize">{status}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{getStatusCount(status)}</p>
            </div>
          ))}
        </div>

        {/* Priority Stats - Admin/Manager Only */}
        {(isAdmin || isManager) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {priorities.map(priority => (
              <div key={priority} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-sm text-gray-600 capitalize">{priority} Priority</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{getPriorityCount(priority)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={isStaff ? "Search your tasks..." : "Search tasks by title, description, staff..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status} className="capitalize">{status}</option>
                ))}
              </select>
              
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Priority</option>
                {priorities.map(p => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat.replace('-', ' ')}</option>
                ))}
              </select>
              
              {isAdmin && (
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    if (e.target.value !== 'all') {
                      fetchStaffForLocation(e.target.value);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm capitalize"
                >
                  <option value="all">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : 
               isStaff ? 'You have no assigned tasks' : 'Create your first task to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onView={() => {
                  setSelectedTask(task);
                  setShowDetailsModal(true);
                }}
                onUpdateStatus={isStaff ? () => {
                  setSelectedTask(task);
                  setStatusUpdate({
                    status: task.status,
                    progress: task.progress || 0,
                    text: ''
                  });
                  setShowUpdateModal(true);
                } : null}
                onEdit={(isAdmin || isManager) ? () => {
                  setSelectedTask(task);
                  setFormData({
                    title: task.title,
                    description: task.description,
                    assignedTo: task.assignedTo?._id || '',
                    location: task.location,
                    priority: task.priority,
                    dueDate: task.dueDate?.split('T')[0] || '',
                    category: task.category,
                    entryId: task.entryId?._id || '',
                    startDate: task.startDate?.split('T')[0] || '',
                    progress: task.progress,
                    status: task.status
                  });
                  setShowUpdateModal(true);
                } : null}
              />
            ))}
          </div>
        )}

        {/* ============= CREATE TASK MODAL - FIXED DROPDOWNS ============= */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }} 
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateTask} className="p-6 space-y-6">
                {/* Link to Entry */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-indigo-700 mb-2">
                    Link from Existing Entry (Optional)
                  </label>
                  <select
                    onChange={(e) => handleEntrySelect(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    disabled={loadingEntries}
                  >
                    <option value="">Select an entry to auto-fill</option>
                    {entriesList.map(entry => (
                      <option key={entry._id} value={entry._id}>
                        {entry.clientName} - {entry.enquiryType} ({entry.location}) {entry.status === 'new' ? '🆕' : ''}
                      </option>
                    ))}
                  </select>
                  {loadingEntries && <p className="text-xs text-indigo-600 mt-2">Loading entries...</p>}
                </div>

                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Site visit for CCTV installation"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Detailed description of the task..."
                  />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    {isAdmin ? (
                      <select
                        required
                        value={formData.location}
                        onChange={(e) => {
                          setFormData({...formData, location: e.target.value, assignedTo: ''});
                          fetchStaffForLocation(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 capitalize"
                      >
                        <option value="">Select Location</option>
                        {locations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.location}
                        disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg capitalize"
                      />
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 capitalize"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assign To - Staff Dropdown - FIXED */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={loadingStaff}
                    >
                      <option value="">Select Staff Member</option>
                      {getFilteredStaff().map(staff => (
                        <option key={staff._id} value={staff._id}>
                          {getStaffDisplayName(staff)}
                        </option>
                      ))}
                    </select>
                    {loadingStaff && (
                      <div className="flex items-center gap-2 mt-2">
                        <RefreshCw size={14} className="animate-spin text-indigo-600" />
                        <span className="text-xs text-gray-500">Loading staff members...</span>
                      </div>
                    )}
                    {!loadingStaff && getFilteredStaff().length === 0 && formData.location && (
  <p className="text-xs text-red-500 mt-2">
    No active users found in {formData.location}. 
  </p>
)}
                    <p className="text-xs text-gray-500 mt-1">
                      {isAdmin 
                        ? (selectedLocation !== 'all' ? `Showing staff from ${selectedLocation}` : 'Showing staff from all locations')
                        : `Showing staff from ${user?.location}`}
                    </p>
                    {isAdmin && selectedLocation === 'all' && (
                      <p className="text-xs text-indigo-600 mt-1">
                        Tip: Select a specific location to filter staff
                      </p>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 capitalize"
                    >
                      {priorities.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Entry ID (Hidden) */}
                {formData.entryId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      ✓ Linked to entry: {selectedEntry?.clientName} - {selectedEntry?.enquiryType}
                    </p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loadingStaff || !formData.location || getFilteredStaff().length === 0}
                  >
                    Create Task
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {showDetailsModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)} 
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Title & Status */}
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                        ${selectedTask.priority === 'urgent' ? 'bg-red-100 text-red-800' : 
                          selectedTask.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          selectedTask.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {selectedTask.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                        ${selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedTask.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          selectedTask.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                          selectedTask.status === 'on-hold' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {selectedTask.description}
                  </p>
                </div>

                {/* Task Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedTask.location}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedTask.category}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTask.assignedTo?.name}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Assigned By</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTask.assignedBy?.name}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'Not set'}
                      {selectedTask.isOverdue && <span className="ml-2 text-red-600 text-xs">(Overdue)</span>}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : 'Not started'}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Progress</p>
                    <span className="text-sm font-medium text-gray-900">{selectedTask.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>

                {/* Updates/Notes */}
                {selectedTask.updates && selectedTask.updates.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Updates & Notes</p>
                    <div className="space-y-3">
                      {selectedTask.updates.slice(-3).map((update, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">{update.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              Status changed to <span className="font-medium capitalize">{update.status}</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(update.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Attachments</p>
                    <div className="space-y-2">
                      {selectedTask.attachments.map((att, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Paperclip size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{att.filename}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(att.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {isStaff && selectedTask.status !== 'completed' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setStatusUpdate({
                          status: selectedTask.status,
                          progress: selectedTask.progress || 0,
                          text: ''
                        });
                        setShowUpdateModal(true);
                      }}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                    >
                      Update Status
                    </button>
                  )}
                  {(isAdmin || isManager) && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setFormData({
                          title: selectedTask.title,
                          description: selectedTask.description,
                          assignedTo: selectedTask.assignedTo?._id || '',
                          location: selectedTask.location,
                          priority: selectedTask.priority,
                          dueDate: selectedTask.dueDate?.split('T')[0] || '',
                          category: selectedTask.category,
                          entryId: selectedTask.entryId?._id || '',
                          startDate: selectedTask.startDate?.split('T')[0] || '',
                          progress: selectedTask.progress,
                          status: selectedTask.status
                        });
                        setShowUpdateModal(true);
                      }}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                    >
                      Edit Task
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Task/Status Modal */}
        {showUpdateModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">
                  {isStaff ? 'Update Task Status' : 'Edit Task'}
                </h2>
                <button 
                  onClick={() => {
                    setShowUpdateModal(false);
                    setStatusUpdate({ status: '', progress: 0, text: '' });
                  }} 
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {isStaff ? (
                  // Staff Status Update Form
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{selectedTask.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Assigned to: {selectedTask.assignedTo?.name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={statusUpdate.status}
                        onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status} className="capitalize">{status}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Progress ({statusUpdate.progress}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={statusUpdate.progress}
                        onChange={(e) => setStatusUpdate({...statusUpdate, progress: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Update Note
                      </label>
                      <textarea
                        rows={3}
                        value={statusUpdate.text}
                        onChange={(e) => setStatusUpdate({...statusUpdate, text: e.target.value})}
                        placeholder="Add a note about this update..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      onClick={handleUpdateStatus}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                    >
                      Update Status
                    </button>
                  </div>
                ) : (
                  // Admin/Manager Edit Task Form
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateTask(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.progress}
                          onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                      >
                        Update Task
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUpdateModal(false)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tasks;
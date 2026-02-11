import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import EntryCard from '../components/EntryCard';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  CheckSquare,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  MapPin,
  Briefcase,
  UserPlus,
  Activity
} from 'lucide-react';
import { getEntriesAPI, getEntryStatsAPI } from '../api/axios';
import { getTasksAPI, getTaskStatsAPI, getMyTasksAPI } from '../api/axios';
import { getUsersAPI } from '../api/axios';

const Dashboard = () => {
  const { user, isAdmin, isManager, isStaff } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    entries: { total: 0, new: 0, assigned: 0, completed: 0 },
    tasks: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    users: { total: 0, managers: 0, staff: 0 }
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [locationData, setLocationData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data based on role
      if (isAdmin) {
        // Admin: Sab kuch
        const [entriesRes, tasksRes, usersRes] = await Promise.all([
          getEntriesAPI({ limit: 5 }),
          getTasksAPI({ limit: 5 }),
          getUsersAPI({})
        ]);
        
        setRecentEntries(entriesRes.data.entries || []);
        setRecentTasks(tasksRes.data.tasks || []);
        
        setStats({
          entries: {
            total: entriesRes.data.total || 0,
            new: entriesRes.data.entries?.filter(e => e.status === 'new').length || 0,
            assigned: entriesRes.data.entries?.filter(e => e.status === 'assigned').length || 0,
            completed: entriesRes.data.entries?.filter(e => e.status === 'completed').length || 0
          },
          tasks: {
            total: tasksRes.data.total || 0,
            pending: tasksRes.data.tasks?.filter(t => t.status === 'pending').length || 0,
            inProgress: tasksRes.data.tasks?.filter(t => t.status === 'in-progress').length || 0,
            completed: tasksRes.data.tasks?.filter(t => t.status === 'completed').length || 0
          },
          users: {
            total: usersRes.data.users?.length || 0,
            managers: usersRes.data.users?.filter(u => u.role === 'manager').length || 0,
            staff: usersRes.data.users?.filter(u => u.role === 'staff').length || 0
          }
        });
        
        // Location wise data
        const locationCounts = {};
        entriesRes.data.entries?.forEach(entry => {
          locationCounts[entry.location] = (locationCounts[entry.location] || 0) + 1;
        });
        setLocationData(Object.entries(locationCounts).map(([loc, count]) => ({ loc, count })));
        
      } else if (isManager) {
        // Manager: Sirf apni location ka data
        const [entriesRes, tasksRes, staffRes] = await Promise.all([
          getEntriesAPI({ location: user.location, limit: 5 }),
          getTasksAPI({ location: user.location, limit: 5 }),
          getUsersByLocationAPI(user.location)
        ]);
        
        setRecentEntries(entriesRes.data.entries || []);
        setRecentTasks(tasksRes.data.tasks || []);
        
        setStats({
          entries: {
            total: entriesRes.data.total || 0,
            new: entriesRes.data.entries?.filter(e => e.status === 'new').length || 0,
            assigned: entriesRes.data.entries?.filter(e => e.status === 'assigned').length || 0,
            completed: entriesRes.data.entries?.filter(e => e.status === 'completed').length || 0
          },
          tasks: {
            total: tasksRes.data.total || 0,
            pending: tasksRes.data.tasks?.filter(t => t.status === 'pending').length || 0,
            inProgress: tasksRes.data.tasks?.filter(t => t.status === 'in-progress').length || 0,
            completed: tasksRes.data.tasks?.filter(t => t.status === 'completed').length || 0
          },
          users: {
            total: staffRes.data.users?.length || 0,
            staff: staffRes.data.users?.filter(u => u.role === 'staff').length || 0
          }
        });
        
      } else if (isStaff) {
        // Staff: Sirf apne tasks
        const [tasksRes, entriesRes] = await Promise.all([
          getMyTasksAPI(),
          getEntriesAPI({ assignedTo: user.id, limit: 5 })
        ]);
        
        setRecentTasks(tasksRes.data.tasks || []);
        setRecentEntries(entriesRes.data.entries || []);
        
        setStats({
          tasks: {
            total: tasksRes.data.count || 0,
            pending: tasksRes.data.tasks?.filter(t => t.status === 'pending').length || 0,
            inProgress: tasksRes.data.tasks?.filter(t => t.status === 'in-progress').length || 0,
            completed: tasksRes.data.tasks?.filter(t => t.status === 'completed').length || 0
          }
        });
      }
      
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stats cards based on role
  const getStatsCards = () => {
    const cards = [];

    if (isAdmin || isManager) {
      cards.push(
        { title: 'Total Entries', value: stats.entries.total, icon: FileText, color: 'indigo', trend: 12 },
        { title: 'New Entries', value: stats.entries.new, icon: AlertCircle, color: 'orange' },
        { title: 'Active Tasks', value: stats.tasks.inProgress, icon: Activity, color: 'blue' },
        { title: 'Total Users', value: stats.users.total, icon: Users, color: 'green', trend: 5 }
      );
    }

    if (isStaff) {
      cards.push(
        { title: 'My Tasks', value: stats.tasks.total, icon: CheckSquare, color: 'indigo' },
        { title: 'In Progress', value: stats.tasks.inProgress, icon: Clock, color: 'blue' },
        { title: 'Completed', value: stats.tasks.completed, icon: TrendingUp, color: 'green' },
        { title: 'Pending', value: stats.tasks.pending, icon: AlertCircle, color: 'orange' }
      );
    }

    return cards;
  };

  return (
    <Layout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getStatsCards().map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          {/* Location Stats - Admin Only */}
          {isAdmin && locationData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-indigo-600" />
                Location-wise Entries
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {locationData.map(({ loc, count }) => (
                  <div key={loc} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="capitalize font-medium text-gray-700">{loc}</span>
                    <span className="text-2xl font-bold text-indigo-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Entries & Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Entries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  Recent Entries
                </h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {recentEntries.length > 0 ? (
                  recentEntries.map(entry => (
                    <div key={entry._id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{entry.clientName}</h3>
                          <p className="text-sm text-gray-600 mt-1">{entry.enquiryType}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full capitalize 
                              ${entry.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                              {entry.priority}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full capitalize 
                              ${entry.status === 'new' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{entry.location}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent entries</p>
                )}
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckSquare size={20} className="text-indigo-600" />
                  Recent Tasks
                </h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.map(task => (
                    <div key={task._id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.description?.substring(0, 50)}...
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full capitalize 
                              ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {task.status}
                            </span>
                            {task.progress > 0 && (
                              <span className="text-xs text-gray-600">{task.progress}%</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent tasks</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-600" />
              Quick Actions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(isAdmin || isManager) && (
                <>
                  <button className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText size={20} className="text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Create Entry</p>
                      <p className="text-xs text-gray-600">Add new form entry</p>
                    </div>
                  </button>
                  
                  <button className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckSquare size={20} className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Assign Task</p>
                      <p className="text-xs text-gray-600">Assign to staff</p>
                    </div>
                  </button>
                </>
              )}
              
              {isAdmin && (
                <button className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserPlus size={20} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Add User</p>
                    <p className="text-xs text-gray-600">Create staff/manager</p>
                  </div>
                </button>
              )}
              
              {isStaff && (
                <button className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Update Status</p>
                    <p className="text-xs text-gray-600">Mark task complete</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
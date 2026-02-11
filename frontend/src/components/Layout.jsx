import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Navbar setSidebarOpen={setSidebarOpen} />
        
        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 mb-6 text-white">
              <h1 className="text-2xl font-bold mb-2">
                👋 Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-indigo-100">
                {user?.role === 'admin' && 'Manage users, entries, and tasks across all locations.'}
                {user?.role === 'manager' && `Manage your team and tasks in ${user?.location} location.`}
                {user?.role === 'staff' && 'Track and update your assigned tasks.'}
              </p>
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
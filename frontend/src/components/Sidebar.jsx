import { NavLink } from 'react-router-dom'; // ✅ Import NavLink
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  UserCircle,
  LogOut,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',      // ✅ Route path
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'staff']
    },
    {
      name: 'Users',
      href: '/users',         // ✅ Route path
      icon: Users,
      roles: ['admin', 'manager']
    },
    {
      name: 'Entries',
      href: '/entries',       // ✅ Route path
      icon: FileText,
      roles: ['admin', 'manager', 'staff']
    },
    {
      name: 'Tasks',
      href: '/tasks',         // ✅ Route path
      icon: CheckSquare,
      roles: ['admin', 'manager', 'staff']
    },
    {
      name: 'Profile',
      href: '/profile',       // ✅ Route path
      icon: UserCircle,
      roles: ['admin', 'manager', 'staff']
    }
  ];

  const filteredNav = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-lg ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-indigo-600" />
            <span className="font-bold text-lg text-gray-800">StaffFlow</span>
          </div>
        ) : (
          <Briefcase className="h-8 w-8 text-indigo-600 mx-auto" />
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-gray-100 lg:block hidden">
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation - ✅ Yahan NavLink use karo */}
      <nav className="p-3 space-y-1">
        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => `
              flex items-center px-3 py-3 rounded-lg transition-colors
              ${sidebarOpen ? 'gap-3' : 'justify-center'}
              ${isActive 
                ? 'bg-indigo-50 text-indigo-600' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <item.icon size={20} />
            {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
        <button
          onClick={logout}
          className={`
            flex items-center w-full px-3 py-3 rounded-lg text-red-600
            hover:bg-red-50 transition-colors
            ${sidebarOpen ? 'gap-3' : 'justify-center'}
          `}
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
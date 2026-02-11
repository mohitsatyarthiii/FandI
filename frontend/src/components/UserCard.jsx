import { MapPin, Phone, Mail, UserCog, MoreVertical } from 'lucide-react';
import { useState } from 'react';

const UserCard = ({ user, onResetPassword, onEdit, onToggleStatus }) => {
  const [showMenu, setShowMenu] = useState(false);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {user.name?.charAt(0)}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white 
              ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
            />
          </div>
          
          {/* User Info */}
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

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical size={18} className="text-gray-500" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                <button
                  onClick={() => { onResetPassword(user); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => { onEdit(user); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                >
                  Edit User
                </button>
                <button
                  onClick={() => { onToggleStatus(user); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                >
                  {user.isActive ? 'Deactivate' : 'Activate'} User
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Info */}
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

      {/* Metadata */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
        {user.createdBy && (
          <span className="flex items-center gap-1">
            <UserCog size={12} />
            By: {user.createdBy.name || 'Admin'}
          </span>
        )}
      </div>
    </div>
  );
};

export default UserCard;
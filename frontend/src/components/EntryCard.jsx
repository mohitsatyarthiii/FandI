import { MapPin, Phone, Mail, Clock, AlertCircle, User, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const EntryCard = ({ entry, onView, onAssign, onConvertToTask }) => {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    new: 'bg-purple-100 text-purple-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Tag size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{entry.clientName}</h3>
              <p className="text-sm text-gray-500 capitalize">{entry.enquiryType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${priorityColors[entry.priority]}`}>
              {entry.priority}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[entry.status]}`}>
              {entry.status}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {entry.enquiryDescription}
        </p>

        {/* Client Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} className="text-gray-400" />
            <span>{entry.clientPhone}</span>
          </div>
          {entry.clientEmail && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} className="text-gray-400" />
              <span className="truncate">{entry.clientEmail}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} className="text-gray-400" />
            <span className="capitalize">{entry.location} • {entry.clientCity}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={14} className="text-gray-400" />
            <span>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Assigned To */}
        {entry.assignedTo && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={14} className="text-gray-600" />
            </div>
            <span className="text-xs text-gray-700">
              Assigned to: <span className="font-medium">{entry.assignedTo.name}</span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onView(entry)}
            className="flex-1 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
          >
            View Details
          </button>
          {!entry.assignedTo && onAssign && (
            <button
              onClick={() => onAssign(entry)}
              className="flex-1 px-3 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
            >
              Assign
            </button>
          )}
          {onConvertToTask && (
            <button
              onClick={() => onConvertToTask(entry)}
              className="px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
            >
              Convert
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntryCard;
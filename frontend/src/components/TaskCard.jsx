import { Calendar, User, Flag, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const TaskCard = ({ task, onView, onUpdateStatus }) => {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    'on-hold': 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-blue-50'}`}>
              <Flag size={18} className={isOverdue ? 'text-red-600' : 'text-blue-600'} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              <p className="text-xs text-gray-500 capitalize">{task.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[task.status]}`}>
              {task.status}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>

        {/* Task Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={14} className="text-gray-400" />
            <span>Assigned to: <span className="font-medium">{task.assignedTo?.name}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              Due: {format(new Date(task.dueDate), 'dd MMM yyyy')}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>
          {task.progress > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">{task.progress}%</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onView(task)}
            className="flex-1 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
          >
            View Details
          </button>
          {task.status !== 'completed' && onUpdateStatus && (
            <button
              onClick={() => onUpdateStatus(task)}
              className="flex-1 px-3 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
            >
              Update Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
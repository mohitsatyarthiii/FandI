import React from 'react';
import { 
  Calendar, 
  User, 
  MapPin, 
  Flag, 
  Clock,
  ChevronRight,
  Bell,
  AlertCircle,
  MessageSquare,
  Smartphone
} from 'lucide-react';

const TaskCard = ({ 
  task, 
  onView, 
  onUpdateStatus, 
  onEdit, 
  onViewNotifications,
  onRetryNotifications 
}) => {
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = task.isOverdue || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed');

  // Check notification status
  const hasNotificationIssues = task.notificationStatus && (
    !task.notificationStatus.staff?.whatsapp ||
    !task.notificationStatus.staff?.sms ||
    (task.entryId && (
      !task.notificationStatus.customer?.whatsapp ||
      !task.notificationStatus.customer?.sms
    ))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header with priority and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>
          
          {/* Notification indicator */}
          {task.notificationStatus && (
            <div className="flex items-center gap-1">
              {task.notificationStatus.staff?.whatsapp && task.notificationStatus.staff?.sms ? (
                <div className="flex items-center gap-1 text-green-600" title="Staff notifications sent">
                  <MessageSquare size={14} />
                  <Smartphone size={14} />
                </div>
              ) : (
                <button 
                  onClick={() => onRetryNotifications?.()}
                  className="text-yellow-600 hover:text-yellow-800"
                  title="Some notifications failed - click to retry"
                >
                  <AlertCircle size={16} />
                </button>
              )}
              
              {task.entryId && (
                <>
                  {task.notificationStatus.customer?.whatsapp && task.notificationStatus.customer?.sms ? (
                    <div className="flex items-center gap-1 text-green-600 ml-1 pl-1 border-l" title="Customer notifications sent">
                      <MessageSquare size={14} />
                      <Smartphone size={14} />
                    </div>
                  ) : (
                    <button 
                      onClick={() => onRetryNotifications?.()}
                      className="text-yellow-600 hover:text-yellow-800 ml-1 pl-1 border-l"
                      title="Customer notifications pending/failed"
                    >
                      <AlertCircle size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {task.title}
        </h3>

        {/* Description preview */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {task.description}
        </p>

        {/* Details grid */}
        <div className="space-y-2 mb-4">
          {task.assignedTo && (
            <div className="flex items-center text-sm text-gray-600">
              <User size={16} className="mr-2 text-gray-400" />
              <span className="truncate">{task.assignedTo.name}</span>
            </div>
          )}
          
          {task.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin size={16} className="mr-2 text-gray-400" />
              <span className="capitalize">{task.location}</span>
            </div>
          )}
          
          {task.dueDate && (
            <div className="flex items-center text-sm">
              <Calendar size={16} className="mr-2 text-gray-400" />
              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {new Date(task.dueDate).toLocaleDateString()}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}

          {/* Customer info if exists */}
          {task.entryId && (
            <div className="flex items-center text-sm text-indigo-600">
              <Flag size={16} className="mr-2 text-indigo-400" />
              <span className="truncate">{task.entryId.clientName}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {task.progress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={onView}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
          >
            View Details
            <ChevronRight size={16} className="ml-1" />
          </button>
          
          <div className="flex items-center gap-2">
            {onUpdateStatus && (
              <button
                onClick={onUpdateStatus}
                className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-100"
              >
                Update
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-sm bg-gray-50 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-100"
              >
                Edit
              </button>
            )}

            {hasNotificationIssues && onRetryNotifications && (
              <button
                onClick={onRetryNotifications}
                className="text-sm bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg hover:bg-yellow-100"
                title="Retry failed notifications"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications';

const Notifications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = [
    { id: 'All', label: 'All', count: 0 },
    { id: 'Alerts', label: 'Alerts', count: 0 },
    { id: 'Approvals', label: 'Approvals', count: 0 },
    { id: 'Bookings', label: 'Bookings', count: 0 }
  ];

  const notificationTypes = {
    asset_assigned: { category: 'Bookings', color: 'bg-blue-500', icon: CheckCircle },
    maintenance_approved: { category: 'Approvals', color: 'bg-green-500', icon: CheckCircle },
    maintenance_rejected: { category: 'Approvals', color: 'bg-red-500', icon: AlertTriangle },
    booking_confirmed: { category: 'Bookings', color: 'bg-green-500', icon: Calendar },
    booking_cancelled: { category: 'Bookings', color: 'bg-red-500', icon: Calendar },
    booking_reminder: { category: 'Bookings', color: 'bg-amber-500', icon: Clock },
    transfer_approved: { category: 'Approvals', color: 'bg-green-500', icon: CheckCircle },
    overdue_return: { category: 'Alerts', color: 'bg-red-500', icon: AlertTriangle },
    audit_discrepancy: { category: 'Alerts', color: 'bg-amber-500', icon: AlertTriangle }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
      return;
    }

    fetchNotifications();
  }, [navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      
      if (response.data.data) {
        setNotifications(response.data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error.response?.data?.detail || error.message);
      // Mock data representing server-side generated notifications
      setNotifications([
        {
          id: 1,
          type: 'asset_assigned',
          message: 'Laptop AF-0014 assigned to Priya Shah',
          created_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
          read: false
        },
        {
          id: 2,
          type: 'maintenance_approved',
          message: 'Maintenance request for Projector AF-0062 has been approved',
          created_at: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
          read: false
        },
        {
          id: 3,
          type: 'booking_confirmed',
          message: 'Conference Room B2 booking confirmed for tomorrow 2:00 PM',
          created_at: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
          read: true
        },
        {
          id: 4,
          type: 'overdue_return',
          message: 'Overdue return: AF-0021 was due 3 days ago',
          created_at: new Date(Date.now() - 90 * 60000).toISOString(), // 1.5 hours ago
          read: false
        },
        {
          id: 5,
          type: 'transfer_approved',
          message: 'Asset transfer AF-0089 from IT to Finance has been approved',
          created_at: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
          read: true
        },
        {
          id: 6,
          type: 'audit_discrepancy',
          message: 'Audit discrepancy flagged: Standing Desk AF-0042 marked as damaged',
          created_at: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
          read: false
        },
        {
          id: 7,
          type: 'booking_reminder',
          message: 'Reminder: Video Conference System booking in 30 minutes',
          created_at: new Date(Date.now() - 6 * 3600000).toISOString(), // 6 hours ago
          read: true
        },
        {
          id: 8,
          type: 'maintenance_rejected',
          message: 'Maintenance request for Monitor AF-0156 has been rejected',
          created_at: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
          read: true
        },
        {
          id: 9,
          type: 'booking_cancelled',
          message: 'Conference Room A booking for today 10:00 AM has been cancelled',
          created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), // 2 days ago
          read: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error.response?.data?.detail || error.message);
      // Optimistically update UI
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    }
  };

  const getFilteredNotifications = () => {
    if (activeFilter === 'All') {
      return notifications;
    }
    return notifications.filter(notification => {
      const type = notificationTypes[notification.type];
      return type && type.category === activeFilter;
    });
  };

  const getFilterCounts = () => {
    const counts = {
      All: notifications.length,
      Alerts: 0,
      Approvals: 0,
      Bookings: 0
    };

    notifications.forEach(notification => {
      const type = notificationTypes[notification.type];
      if (type && counts[type.category] !== undefined) {
        counts[type.category]++;
      }
    });

    return counts;
  };

  const filteredNotifications = getFilteredNotifications();
  const filterCounts = getFilterCounts();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F12] flex">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Notifications & Activity</h1>
            <p className="text-gray-400">Stay updated with all system activities and alerts</p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {filters.map((filter) => {
              const count = filterCounts[filter.id] || 0;
              const isActive = activeFilter === filter.id;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-transparent border border-[#2A2A32] text-gray-300 hover:border-blue-500/50 hover:text-white'
                  }`}
                >
                  <span>{filter.label}</span>
                  {count > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-[#2A2A32] text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                  <p className="text-gray-400">Loading notifications...</p>
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">You're all caught up! 🎉</h3>
                <p className="text-gray-400">
                  {activeFilter === 'All' 
                    ? 'No notifications to show right now.'
                    : `No ${activeFilter.toLowerCase()} notifications found.`
                  }
                </p>
              </div>
            ) : (
              // Notification Items
              <div className="divide-y divide-[#2A2A32]">
                {filteredNotifications.map((notification) => {
                  const type = notificationTypes[notification.type];
                  const IconComponent = type?.icon || Bell;
                  
                  return (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      type={type}
                      IconComponent={IconComponent}
                      onMarkAsRead={handleMarkAsRead}
                      getRelativeTime={getRelativeTime}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
// Reusable NotificationItem component for both full page and dropdown
export const NotificationItem = ({ 
  notification, 
  type, 
  IconComponent, 
  onMarkAsRead, 
  getRelativeTime,
  isCompact = false,
  showViewAll = false,
  onViewAll 
}) => {
  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`relative flex items-start gap-4 p-4 hover:bg-[#1F1F24] transition cursor-pointer ${
        !notification.read ? 'border-l-4 border-l-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      {/* Unread indicator dot */}
      {!notification.read && (
        <div className="absolute left-2 top-6 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}

      {/* Category colored square/dot */}
      <div className={`flex-shrink-0 ${isCompact ? 'w-3 h-3' : 'w-4 h-4'} ${type?.color || 'bg-gray-500'} rounded`}></div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-gray-300 ${!notification.read ? 'font-semibold' : ''} ${
          isCompact ? 'text-sm' : ''
        }`}>
          {notification.message}
        </p>
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-right">
        <span className={`text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {getRelativeTime(notification.created_at)}
        </span>
      </div>
    </div>
  );
};

// Reusable NotificationDropdown component for Dashboard
export const NotificationDropdown = ({ 
  notifications = [], 
  onMarkAsRead, 
  onViewAll, 
  getRelativeTime 
}) => {
  const notificationTypes = {
    asset_assigned: { category: 'Bookings', color: 'bg-blue-500', icon: CheckCircle },
    maintenance_approved: { category: 'Approvals', color: 'bg-green-500', icon: CheckCircle },
    maintenance_rejected: { category: 'Approvals', color: 'bg-red-500', icon: AlertTriangle },
    booking_confirmed: { category: 'Bookings', color: 'bg-green-500', icon: Calendar },
    booking_cancelled: { category: 'Bookings', color: 'bg-red-500', icon: Calendar },
    booking_reminder: { category: 'Bookings', color: 'bg-amber-500', icon: Clock },
    transfer_approved: { category: 'Approvals', color: 'bg-green-500', icon: CheckCircle },
    overdue_return: { category: 'Alerts', color: 'bg-red-500', icon: AlertTriangle },
    audit_discrepancy: { category: 'Alerts', color: 'bg-amber-500', icon: AlertTriangle }
  };

  // Show latest 5 notifications
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="w-80">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2A2A32]">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell size={32} className="text-gray-500 mb-3" />
            <p className="text-gray-400 text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2A2A32]">
            {recentNotifications.map((notification) => {
              const type = notificationTypes[notification.type];
              const IconComponent = type?.icon || Bell;
              
              return (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  type={type}
                  IconComponent={IconComponent}
                  onMarkAsRead={onMarkAsRead}
                  getRelativeTime={getRelativeTime}
                  isCompact={true}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with View All link */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-[#2A2A32]">
          <button
            onClick={onViewAll}
            className="w-full flex items-center justify-center gap-2 py-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition"
          >
            <span>View All Notifications</span>
            <ExternalLink size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
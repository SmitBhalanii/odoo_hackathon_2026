import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  ArrowLeftRight,
  Calendar,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Plus,
  AlertTriangle,
  Clock,
  User,
  LogOut
} from 'lucide-react';
import { NotificationDropdown } from './Notifications';
import { PageWrapper, ContentArea, CardSkeleton } from '../components/SharedComponents';
import { getStatusColor, CARD_STYLES, BUTTON_STYLES, SPACING } from '../utils/constants';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'organization', label: 'Organization Setup', icon: Building2, path: '/organization', adminOnly: true },
    { id: 'assets', label: 'Assets', icon: Package, path: '/assets' },
    { id: 'allocation', label: 'Allocation & Transfer', icon: ArrowLeftRight, path: '/allocation' },
    { id: 'booking', label: 'Resource Booking', icon: Calendar, path: '/booking' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, path: '/maintenance' },
    { id: 'audit', label: 'Audit', icon: ClipboardCheck, path: '/audit' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' }
  ];

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Redirect to login if no user
      navigate('/login');
      return;
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, [navigate]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationDropdown && !event.target.closest('.notification-dropdown-container')) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificationDropdown]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch KPI data
      const kpiResponse = await fetch('/api/dashboard/kpi', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If backend is not available, use mock data
      if (!kpiResponse.ok && kpiResponse.status === 404) {
        // Use mock data for development
        const { mockKpiData, mockRecentActivity, mockNotificationCount } = await import('../utils/mockApi.js');
        setKpiData(mockKpiData.data);
        setOverdueCount(mockKpiData.data.overdueReturns || 0);
        setRecentActivity(mockRecentActivity.data.items || []);
        setUnreadNotifications(mockNotificationCount.data.count || 0);
        setLoading(false);
        return;
      }
      
      const kpiResult = await kpiResponse.json();
      
      if (kpiResult.data) {
        setKpiData(kpiResult.data);
        setOverdueCount(kpiResult.data.overdueReturns || 0);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/dashboard/recent-activity?limit=6', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const activityResult = await activityResponse.json();
      
      if (activityResult.data) {
        setRecentActivity(activityResult.data.items || []);
      }

      // Fetch unread notifications count and recent notifications
      const notifResponse = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const notifResult = await notifResponse.json();
      
      if (notifResult.data) {
        setUnreadNotifications(notifResult.data.count || 0);
      }

      // Fetch recent notifications for dropdown
      const recentNotifResponse = await fetch('/api/notifications?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const recentNotifResult = await recentNotifResponse.json();
      
      if (recentNotifResult.data) {
        setNotifications(recentNotifResult.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use mock data as fallback on error
      try {
        const { mockKpiData, mockRecentActivity, mockNotificationCount } = await import('../utils/mockApi.js');
        setKpiData(mockKpiData.data);
        setOverdueCount(mockKpiData.data.overdueReturns || 0);
        setRecentActivity(mockRecentActivity.data.items || []);
        setUnreadNotifications(mockNotificationCount.data.count || 0);
        
        // Mock notifications for dropdown
        setNotifications([
          {
            id: 1,
            type: 'asset_assigned',
            message: 'Laptop AF-0014 assigned to Priya Shah',
            created_at: new Date(Date.now() - 2 * 60000).toISOString(),
            read: false
          },
          {
            id: 2,
            type: 'maintenance_approved',
            message: 'Maintenance request approved',
            created_at: new Date(Date.now() - 15 * 60000).toISOString(),
            read: false
          }
        ]);
      } catch (mockError) {
        console.error('Failed to load mock data:', mockError);
      }
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

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      
      // Update unread count
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    }
  };

  const handleViewAllNotifications = () => {
    setShowNotificationDropdown(false);
    navigate('/notifications');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Admin: getStatusColor('Critical'),
      'Asset Manager': getStatusColor('Medium'), 
      'Department Head': getStatusColor('Available'),
      Employee: getStatusColor('Low')
    };
    return colors[role] || colors.Employee;
  };

  const kpiCards = [
    {
      label: 'Assets Available',
      value: kpiData?.assetsAvailable || 0,
      icon: Package,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Assets Allocated',
      value: kpiData?.assetsAllocated || 0,
      icon: User,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Maintenance Today',
      value: kpiData?.maintenanceToday || 0,
      icon: Wrench,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Active Bookings',
      value: kpiData?.activeBookings || 0,
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Pending Transfers',
      value: kpiData?.pendingTransfers || 0,
      icon: ArrowLeftRight,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      label: 'Upcoming Returns',
      value: kpiData?.upcomingReturns || 0,
      icon: Clock,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <PageWrapper>
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#17171C] border-r border-[#2A2A32] flex flex-col">
        {/* Logo */}
        <div className={`p-${SPACING.sm} border-b border-[#2A2A32]`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">AF</span>
            </div>
            <span className="text-white text-xl font-semibold">AssetFlow</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 p-${SPACING.xs} space-y-1`}>
          {navItems.map((item) => {
            // Hide Organization Setup if not admin
            if (item.adminOnly && user.role !== 'Admin') {
              return null;
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-gray-400 hover:text-white hover:bg-[#1F1F24]'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile at Bottom */}
        <div className={`p-${SPACING.xs} border-t border-[#2A2A32]`}>
          <div className={`flex items-center gap-3 mb-3`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{getInitials(user.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-gray-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 ${BUTTON_STYLES.ghost} text-sm`}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className={`bg-[#17171C] border-b border-[#2A2A32] px-${SPACING.md} py-${SPACING.xs}`}>
          <div className="flex items-center justify-end gap-4">
            {/* User Avatar with Role */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-white text-sm font-medium">{user.name}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-[#2A2A32]">
                <span className="text-white text-sm font-semibold">{getInitials(user.name)}</span>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative notification-dropdown-container">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className={`relative p-2 ${BUTTON_STYLES.ghost}`}
              >
                <Bell size={20} className="text-gray-400" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <div className={`absolute right-0 top-full mt-2 ${CARD_STYLES.modal} z-50`}>
                  <NotificationDropdown
                    notifications={notifications}
                    onMarkAsRead={markNotificationAsRead}
                    onViewAll={handleViewAllNotifications}
                    getRelativeTime={getRelativeTime}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        <ContentArea 
          title="Today's Overview"
        >
          {/* KPI Cards Grid */}
          {loading ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-${SPACING.sm} mb-${SPACING.md}`}>
              <CardSkeleton count={6} />
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-${SPACING.sm} mb-${SPACING.md}`}>
              {kpiCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className={`${CARD_STYLES.base} ${CARD_STYLES.hover} p-${SPACING.sm}`}
                  >
                    <div className={`flex items-start justify-between mb-${SPACING.xs}`}>
                      <span className="text-xs uppercase text-gray-400 font-medium tracking-wide">
                        {card.label}
                      </span>
                      <div className={`p-2 rounded-lg ${card.bgColor}`}>
                        <Icon size={20} className={card.color} />
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-white">{card.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Overdue Alert Banner */}
          {overdueCount > 0 && (
            <div
              onClick={() => navigate('/allocation?filter=overdue')}
              className={`bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/30 rounded-lg p-${SPACING.xs} mb-${SPACING.md} cursor-pointer hover:border-red-500/50 transition-colors duration-200`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {overdueCount} asset{overdueCount !== 1 ? 's' : ''} overdue for return
                  </p>
                  <p className="text-gray-400 text-sm">Flagged for follow-up — click to view details</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={`flex flex-wrap gap-${SPACING.xs} mb-${SPACING.md}`}>
            <button
              onClick={() => navigate('/assets/register')}
              className={`flex items-center gap-2 px-${SPACING.sm} py-3 ${BUTTON_STYLES.primary}`}
            >
              <Plus size={20} />
              Register Asset
            </button>
            <button
              onClick={() => navigate('/booking/new')}
              className={`flex items-center gap-2 px-${SPACING.sm} py-3 ${BUTTON_STYLES.secondary}`}
            >
              <Calendar size={20} />
              Book Resource
            </button>
            <button
              onClick={() => navigate('/maintenance/new')}
              className={`flex items-center gap-2 px-${SPACING.sm} py-3 ${BUTTON_STYLES.secondary}`}
            >
              <Wrench size={20} />
              Raise Maintenance Request
            </button>
          </div>

          {/* Recent Activity */}
          <div className={CARD_STYLES.base}>
            <div className={`px-${SPACING.sm} py-${SPACING.xs} border-b border-[#2A2A32]`}>
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            </div>
            <div className={`p-${SPACING.sm}`}>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4 animate-pulse">
                      <div className="w-8 h-8 bg-[#2A2A32] rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-[#2A2A32] rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-[#2A2A32] rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        {activity.action === 'allocated' && <User size={16} className="text-blue-400" />}
                        {activity.action === 'transfer' && <ArrowLeftRight size={16} className="text-purple-400" />}
                        {activity.action === 'maintenance' && <Wrench size={16} className="text-orange-400" />}
                        {activity.action === 'booking' && <Calendar size={16} className="text-green-400" />}
                        {activity.action === 'audit' && <ClipboardCheck size={16} className="text-cyan-400" />}
                        {!['allocated', 'transfer', 'maintenance', 'booking', 'audit'].includes(activity.action) && (
                          <Package size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-sm">{activity.description}</p>
                        <p className="text-gray-500 text-xs mt-1">{getRelativeTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </ContentArea>
      </main>
    </PageWrapper>
  );
};

export default Dashboard;

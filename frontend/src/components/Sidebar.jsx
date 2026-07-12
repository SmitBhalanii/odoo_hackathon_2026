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
  LogOut
} from 'lucide-react';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <aside className="w-[260px] bg-[#17171C] border-r border-[#2A2A32] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#2A2A32]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">AF</span>
          </div>
          <span className="text-white text-xl font-semibold">AssetFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
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
      <div className="p-4 border-t border-[#2A2A32]">
        <div className="flex items-center gap-3 mb-3">
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1F1F24] hover:bg-[#252529] text-gray-300 hover:text-white rounded-lg transition text-sm"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

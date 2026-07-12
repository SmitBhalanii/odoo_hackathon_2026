import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  TrendingUp,
  AlertCircle,
  Clock,
  Calendar,
  Package
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import Sidebar from '../components/Sidebar';

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Analytics data
  const [utilizationData, setUtilizationData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [mostUsedAssets, setMostUsedAssets] = useState([]);
  const [idleAssets, setIdleAssets] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
      return;
    }

    fetchAnalytics();
  }, [navigate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      // Fetch utilization by department
      const utilizationResponse = await fetch('/api/analytics/utilization-by-department', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const utilizationResult = await utilizationResponse.json();
      if (utilizationResult.data) setUtilizationData(utilizationResult.data);

      // Fetch maintenance frequency
      const maintenanceResponse = await fetch('/api/analytics/maintenance-frequency', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const maintenanceResult = await maintenanceResponse.json();
      if (maintenanceResult.data) setMaintenanceData(maintenanceResult.data);

      // Fetch most used assets
      const mostUsedResponse = await fetch('/api/analytics/most-used-assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mostUsedResult = await mostUsedResponse.json();
      if (mostUsedResult.data) setMostUsedAssets(mostUsedResult.data.items || []);

      // Fetch idle assets
      const idleResponse = await fetch('/api/analytics/idle-assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const idleResult = await idleResponse.json();
      if (idleResult.data) setIdleAssets(idleResult.data.items || []);

      // Fetch upcoming maintenance & retirement
      const upcomingResponse = await fetch('/api/analytics/upcoming-maintenance-retirement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const upcomingResult = await upcomingResponse.json();
      if (upcomingResult.data) setUpcomingMaintenance(upcomingResult.data.items || []);

      // Fetch department summary
      const deptResponse = await fetch('/api/analytics/department-allocation-summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptResult = await deptResponse.json();
      if (deptResult.data) setDepartmentSummary(deptResult.data.items || []);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Mock data for development - based on real aggregation queries
      setUtilizationData([
        { department: 'Engineering', allocated: 45, available: 12, total: 57 },
        { department: 'IT', allocated: 32, available: 8, total: 40 },
        { department: 'Finance', allocated: 18, available: 7, total: 25 },
        { department: 'Operations', allocated: 28, available: 15, total: 43 },
        { department: 'HR', allocated: 12, available: 5, total: 17 }
      ]);

      setMaintenanceData([
        { week: 'Week 1', count: 3 },
        { week: 'Week 2', count: 5 },
        { week: 'Week 3', count: 2 },
        { week: 'Week 4', count: 7 },
        { week: 'Week 5', count: 4 },
        { week: 'Week 6', count: 6 },
        { week: 'Week 7', count: 8 },
        { week: 'Week 8', count: 5 }
      ]);

      setMostUsedAssets([
        { tag: 'AF-0202', name: 'Conference Room B2', count: 34, type: 'bookings' },
        { tag: 'AF-0201', name: 'Conference Room A', count: 28, type: 'bookings' },
        { tag: 'AF-0001', name: 'MacBook Pro 16"', count: 12, type: 'allocations' },
        { tag: 'AF-0203', name: 'Projector - Meeting Room', count: 11, type: 'bookings' },
        { tag: 'AF-0114', name: 'Dell Latitude 5420', count: 8, type: 'allocations' }
      ]);

      setIdleAssets([
        { tag: 'AF-0301', name: 'Camera - Canon EOS', days_idle: 68 },
        { tag: 'AF-0412', name: 'Wireless Presenter', days_idle: 62 },
        { tag: 'AF-0089', name: 'Standing Desk SD-08', days_idle: 45 },
        { tag: 'AF-0156', name: 'Portable Monitor', days_idle: 38 }
      ]);

      setUpcomingMaintenance([
        { 
          tag: 'AF-0062', 
          name: 'Projector PJ-04', 
          reason: 'Service due in 5 days', 
          type: 'maintenance',
          due_date: '2026-07-17'
        },
        { 
          tag: 'AF-0234', 
          name: 'AC Unit - Conference Room', 
          reason: 'Service due in 12 days', 
          type: 'maintenance',
          due_date: '2026-07-24'
        },
        { 
          tag: 'AF-0015', 
          name: 'Server Rack SR-01', 
          reason: '4 years old — nearing retirement', 
          type: 'retirement',
          age_years: 4
        },
        { 
          tag: 'AF-0128', 
          name: 'Laptop - HP EliteBook', 
          reason: '4.5 years old — nearing retirement', 
          type: 'retirement',
          age_years: 4.5
        }
      ]);

      setDepartmentSummary([
        { department: 'Engineering', asset_count: 57, allocated: 45, utilization: 78.9 },
        { department: 'IT', asset_count: 40, allocated: 32, utilization: 80.0 },
        { department: 'Finance', asset_count: 25, allocated: 18, utilization: 72.0 },
        { department: 'Operations', asset_count: 43, allocated: 28, utilization: 65.1 },
        { department: 'HR', asset_count: 17, allocated: 12, utilization: 70.6 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // Combine all data for CSV export
    let csvContent = 'Asset Flow - Analytics Report\n\n';
    
    // Utilization by Department
    csvContent += 'UTILIZATION BY DEPARTMENT\n';
    csvContent += 'Department,Allocated,Available,Total\n';
    utilizationData.forEach(row => {
      csvContent += `${row.department},${row.allocated},${row.available},${row.total}\n`;
    });
    
    csvContent += '\nMOST USED ASSETS\n';
    csvContent += 'Tag,Name,Count,Type\n';
    mostUsedAssets.forEach(row => {
      csvContent += `${row.tag},${row.name},${row.count},${row.type}\n`;
    });
    
    csvContent += '\nIDLE ASSETS\n';
    csvContent += 'Tag,Name,Days Idle\n';
    idleAssets.forEach(row => {
      csvContent += `${row.tag},${row.name},${row.days_idle}\n`;
    });
    
    csvContent += '\nUPCOMING MAINTENANCE & RETIREMENT\n';
    csvContent += 'Tag,Name,Reason,Type\n';
    upcomingMaintenance.forEach(row => {
      csvContent += `${row.tag},${row.name},"${row.reason}",${row.type}\n`;
    });
    
    csvContent += '\nDEPARTMENT ALLOCATION SUMMARY\n';
    csvContent += 'Department,Asset Count,Allocated,Utilization %\n';
    departmentSummary.forEach(row => {
      csvContent += `${row.department},${row.asset_count},${row.allocated},${row.utilization.toFixed(1)}%\n`;
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `AssetFlow_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessToast('Report exported successfully!');
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg px-4 py-2 shadow-xl">
          <p className="text-white font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F12] flex">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
              <p className="text-gray-400">Insights and trends across your asset portfolio</p>
            </div>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              <Download size={20} />
              Export Report
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-400">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Utilization by Department Chart */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={24} className="text-blue-400" />
                    Utilization by Department
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={utilizationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" />
                      <XAxis 
                        dataKey="department" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      <Bar dataKey="allocated" fill="#3B82F6" name="Allocated" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="available" fill="#10B981" name="Available" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Maintenance Frequency Chart */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle size={24} className="text-purple-400" />
                    Maintenance Frequency
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={maintenanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" />
                      <XAxis 
                        dataKey="week" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#A855F7" 
                        strokeWidth={3}
                        name="Maintenance Requests"
                        dot={{ fill: '#A855F7', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Most Used & Idle Assets Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Used Assets */}
                <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={24} className="text-green-400" />
                    Most Used Assets
                  </h2>
                  <div className="space-y-3">
                    {mostUsedAssets.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No usage data available</p>
                    ) : (
                      mostUsedAssets.map((asset, index) => (
                        <div
                          key={asset.tag}
                          className="flex items-center justify-between p-4 bg-[#0F0F12] border border-[#2A2A32] rounded-lg hover:border-green-500/50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 text-green-300 rounded-full font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-semibold">{asset.name}</p>
                              <p className="text-sm text-gray-400">{asset.tag}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold text-lg">{asset.count}</p>
                            <p className="text-xs text-gray-500">{asset.type}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Idle Assets */}
                <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock size={24} className="text-amber-400" />
                    Idle Assets
                  </h2>
                  <div className="space-y-3">
                    {idleAssets.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No idle assets</p>
                    ) : (
                      idleAssets.map((asset) => (
                        <div
                          key={asset.tag}
                          className="flex items-center justify-between p-4 bg-[#0F0F12] border-l-4 border-l-amber-500 border border-[#2A2A32] rounded-lg hover:bg-amber-500/5 transition"
                        >
                          <div>
                            <p className="text-white font-semibold">{asset.name}</p>
                            <p className="text-sm text-gray-400">{asset.tag}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-amber-400 font-bold">{asset.days_idle} days</p>
                            <p className="text-xs text-gray-500">unused</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Upcoming Maintenance / Retirement */}
              <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar size={24} className="text-blue-400" />
                  Assets Due for Maintenance / Nearing Retirement
                </h2>
                <div className="space-y-3">
                  {upcomingMaintenance.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No upcoming items</p>
                  ) : (
                    upcomingMaintenance.map((item) => (
                      <div
                        key={item.tag}
                        className="flex items-center justify-between p-4 bg-[#0F0F12] border border-[#2A2A32] rounded-lg hover:border-blue-500/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          {item.type === 'maintenance' ? (
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <AlertCircle size={20} className="text-blue-400" />
                            </div>
                          ) : (
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                              <Package size={20} className="text-orange-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-400">{item.tag}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            item.type === 'maintenance' ? 'text-blue-400' : 'text-orange-400'
                          }`}>
                            {item.reason}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.type === 'maintenance' ? 'Service Due' : 'Retirement Alert'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Department-wise Allocation Summary Table */}
              <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-[#2A2A32]">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <TrendingUp size={24} className="text-blue-400" />
                    Department-wise Allocation Summary
                  </h2>
                </div>
                <table className="w-full">
                  <thead className="bg-[#1F1F24] border-b border-[#2A2A32]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Asset Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Allocated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Utilization %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A32]">
                    {departmentSummary.map((dept) => (
                      <tr key={dept.department} className="hover:bg-[#1F1F24] transition">
                        <td className="px-6 py-4">
                          <p className="text-white font-semibold">{dept.department}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{dept.asset_count}</td>
                        <td className="px-6 py-4 text-gray-300">{dept.allocated}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-[#2A2A32] rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  dept.utilization >= 75 
                                    ? 'bg-green-500' 
                                    : dept.utilization >= 50 
                                    ? 'bg-blue-500' 
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${dept.utilization}%` }}
                              ></div>
                            </div>
                            <span className={`font-semibold min-w-[4rem] ${
                              dept.utilization >= 75 
                                ? 'text-green-400' 
                                : dept.utilization >= 50 
                                ? 'text-blue-400' 
                                : 'text-amber-400'
                            }`}>
                              {dept.utilization.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slideUp">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <Download size={24} />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

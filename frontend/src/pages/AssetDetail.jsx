import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  User,
  Wrench,
  Calendar,
  MapPin,
  DollarSign,
  Package
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const AssetDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [asset, setAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('allocation'); // allocation or maintenance
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const assetStatuses = {
    'Available': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Allocated': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Reserved': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Under Maintenance': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'Lost': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Retired': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    'Disposed': 'bg-gray-700/20 text-gray-400 border-gray-700/30'
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
      return;
    }

    fetchAssetDetails();
  }, [id, navigate]);

  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      // Fetch asset details
      const assetResponse = await fetch(`/api/assets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assetResult = await assetResponse.json();
      if (assetResult.data) setAsset(assetResult.data);

      // Fetch allocation history
      const allocationResponse = await fetch(`/api/assets/${id}/allocation-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allocationResult = await allocationResponse.json();
      if (allocationResult.data) setAllocationHistory(allocationResult.data.items || []);

      // Fetch maintenance history
      const maintenanceResponse = await fetch(`/api/assets/${id}/maintenance-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const maintenanceResult = await maintenanceResponse.json();
      if (maintenanceResult.data) setMaintenanceHistory(maintenanceResult.data.items || []);

    } catch (error) {
      console.error('Failed to fetch asset details:', error);
      // Mock data for development
      setAsset({
        id: id,
        tag: 'AF-0001',
        name: 'MacBook Pro 16"',
        category: 'Laptops',
        status: 'Allocated',
        location: 'IT Dept - Floor 3',
        department: 'IT',
        serial_number: 'MBP2023XYZ789',
        acquisition_date: '2023-05-15',
        acquisition_cost: 2499.99,
        condition: 'Good',
        extra_fields: {
          warranty_period: '3 years',
          processor_type: 'M2 Pro'
        }
      });

      setAllocationHistory([
        {
          id: 1,
          date: '2024-01-15T10:30:00Z',
          action: 'Allocated',
          user: 'Priya Shah',
          department: 'IT',
          notes: 'Allocated for software development work'
        },
        {
          id: 2,
          date: '2023-11-20T14:20:00Z',
          action: 'Returned',
          user: 'John Doe',
          department: 'IT',
          notes: 'Returned after project completion'
        },
        {
          id: 3,
          date: '2023-08-10T09:15:00Z',
          action: 'Allocated',
          user: 'John Doe',
          department: 'IT',
          notes: 'Allocated for Q3 project'
        },
        {
          id: 4,
          date: '2023-05-15T11:00:00Z',
          action: 'Registered',
          user: 'Admin',
          department: 'IT',
          notes: 'Initial asset registration'
        }
      ]);

      setMaintenanceHistory([
        {
          id: 1,
          date: '2023-12-05T08:00:00Z',
          type: 'Repair',
          status: 'Completed',
          description: 'Battery replacement',
          technician: 'Tech Support Team',
          cost: 199.00,
          duration: '2 days'
        },
        {
          id: 2,
          date: '2023-09-20T10:30:00Z',
          type: 'Preventive',
          status: 'Completed',
          description: 'Software update and cleaning',
          technician: 'IT Support',
          cost: 0,
          duration: '1 day'
        },
        {
          id: 3,
          date: '2023-06-10T14:00:00Z',
          type: 'Inspection',
          status: 'Completed',
          description: 'Initial setup and configuration',
          technician: 'IT Support',
          cost: 0,
          duration: '0.5 days'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    return assetStatuses[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F12] flex">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/assets')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={20} />
            Back to Assets
          </button>

          {loading ? (
            <div className="text-center text-gray-400 py-16">Loading asset details...</div>
          ) : !asset ? (
            <div className="text-center text-gray-400 py-16">
              <Package size={48} className="mx-auto mb-4 text-gray-600" />
              <p>Asset not found</p>
            </div>
          ) : (
            <>
              {/* Asset Header */}
              <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <QrCode size={24} className="text-gray-400" />
                      <h1 className="text-3xl font-bold text-white">{asset.name}</h1>
                    </div>
                    <p className="text-gray-400 text-lg mb-4">Tag: <span className="text-white font-medium">{asset.tag}</span></p>
                    <span className={`inline-block px-3 py-1.5 text-sm rounded border font-medium ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                </div>

                {/* Asset Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Category</p>
                    <p className="text-white font-medium">{asset.category}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Serial Number</p>
                    <p className="text-white font-medium">{asset.serial_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      <MapPin size={12} className="inline mr-1" />
                      Location
                    </p>
                    <p className="text-white font-medium">{asset.location}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Department</p>
                    <p className="text-white font-medium">{asset.department}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      <Calendar size={12} className="inline mr-1" />
                      Acquired
                    </p>
                    <p className="text-white font-medium">{new Date(asset.acquisition_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      <DollarSign size={12} className="inline mr-1" />
                      Cost
                    </p>
                    <p className="text-white font-medium">${asset.acquisition_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Condition</p>
                    <p className="text-white font-medium">{asset.condition}</p>
                  </div>
                  
                  {/* Extra Fields */}
                  {asset.extra_fields && Object.keys(asset.extra_fields).length > 0 && (
                    Object.entries(asset.extra_fields).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs uppercase text-gray-500 mb-1">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-white font-medium">{value}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* History Tabs */}
              <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg overflow-hidden">
                {/* Tab Header */}
                <div className="flex border-b border-[#2A2A32]">
                  <button
                    onClick={() => setActiveTab('allocation')}
                    className={`flex-1 px-6 py-4 font-medium transition ${
                      activeTab === 'allocation'
                        ? 'bg-blue-500/10 text-blue-300 border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-white hover:bg-[#1F1F24]'
                    }`}
                  >
                    <User size={18} className="inline mr-2" />
                    Allocation History
                  </button>
                  <button
                    onClick={() => setActiveTab('maintenance')}
                    className={`flex-1 px-6 py-4 font-medium transition ${
                      activeTab === 'maintenance'
                        ? 'bg-blue-500/10 text-blue-300 border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-white hover:bg-[#1F1F24]'
                    }`}
                  >
                    <Wrench size={18} className="inline mr-2" />
                    Maintenance History
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Allocation History Timeline */}
                  {activeTab === 'allocation' && (
                    <div className="space-y-6">
                      {allocationHistory.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No allocation history available</p>
                      ) : (
                        allocationHistory.map((record, index) => (
                          <div key={record.id} className="relative pl-8 pb-6 border-l-2 border-[#2A2A32] last:border-l-0 last:pb-0">
                            <div className="absolute left-0 top-0 w-4 h-4 bg-blue-500 rounded-full -translate-x-[9px]"></div>
                            <div className="mb-2">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-white font-semibold">{record.action}</span>
                                <span className="text-xs text-gray-500">{formatDate(record.date)}</span>
                              </div>
                              <p className="text-gray-400 text-sm">
                                <User size={14} className="inline mr-1" />
                                {record.user} — {record.department}
                              </p>
                            </div>
                            {record.notes && (
                              <p className="text-gray-300 text-sm bg-[#0F0F12] p-3 rounded border border-[#2A2A32]">
                                {record.notes}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Maintenance History Timeline */}
                  {activeTab === 'maintenance' && (
                    <div className="space-y-6">
                      {maintenanceHistory.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No maintenance history available</p>
                      ) : (
                        maintenanceHistory.map((record, index) => (
                          <div key={record.id} className="relative pl-8 pb-6 border-l-2 border-[#2A2A32] last:border-l-0 last:pb-0">
                            <div className={`absolute left-0 top-0 w-4 h-4 rounded-full -translate-x-[9px] ${
                              record.status === 'Completed' ? 'bg-green-500' : 'bg-orange-500'
                            }`}></div>
                            <div className="mb-2">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-white font-semibold">{record.type}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  record.status === 'Completed' 
                                    ? 'bg-green-500/20 text-green-300' 
                                    : 'bg-orange-500/20 text-orange-300'
                                }`}>
                                  {record.status}
                                </span>
                                <span className="text-xs text-gray-500">{formatDate(record.date)}</span>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">{record.description}</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Technician:</span>
                                  <span className="text-gray-300 ml-2">{record.technician}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Duration:</span>
                                  <span className="text-gray-300 ml-2">{record.duration}</span>
                                </div>
                                {record.cost > 0 && (
                                  <div>
                                    <span className="text-gray-500">Cost:</span>
                                    <span className="text-gray-300 ml-2">${record.cost.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AssetDetail;

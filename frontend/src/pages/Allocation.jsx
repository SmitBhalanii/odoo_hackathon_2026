import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  ChevronDown,
  Calendar as CalendarIcon,
  User,
  Building2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Allocation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Asset selection
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  
  // Allocation form
  const [holderType, setHolderType] = useState('employee'); // 'employee' or 'department'
  const [selectedHolder, setSelectedHolder] = useState(null);
  const [holderSearchTerm, setHolderSearchTerm] = useState('');
  const [showHolderDropdown, setShowHolderDropdown] = useState(false);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  
  // Transfer form
  const [transferTo, setTransferTo] = useState(null);
  const [transferSearchTerm, setTransferSearchTerm] = useState('');
  const [showTransferDropdown, setShowTransferDropdown] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  
  // UI state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [showPendingPanel, setShowPendingPanel] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // Fetch assets
      const assetsResponse = await fetch('/api/assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assetsResult = await assetsResponse.json();
      if (assetsResult.data) setAssets(assetsResult.data.items || []);

      // Fetch employees
      const employeesResponse = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const employeesResult = await employeesResponse.json();
      if (employeesResult.data) setEmployees(employeesResult.data.items || []);

      // Fetch departments
      const deptResponse = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptResult = await deptResponse.json();
      if (deptResult.data) setDepartments(deptResult.data.items || []);

      // Fetch pending transfers
      const transfersResponse = await fetch('/api/transfers/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transfersResult = await transfersResponse.json();
      if (transfersResult.data) setPendingTransfers(transfersResult.data.items || []);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data for development
      setAssets([
        { 
          id: 1, 
          tag: 'AF-0001', 
          name: 'MacBook Pro 16"', 
          status: 'Allocated',
          current_holder: { name: 'Priya Shah', type: 'employee', department: 'Engineering' },
          allocation_history: [
            { date: '2026-03-12', action: 'allocated', holder: 'Priya Shah', department: 'Engineering' },
            { date: '2026-01-04', action: 'returned', holder: 'Arjun Nair', condition: 'Good' }
          ]
        },
        { 
          id: 2, 
          tag: 'AF-0114', 
          name: 'Dell Latitude 5420', 
          status: 'Available',
          allocation_history: [
            { date: '2025-12-10', action: 'returned', holder: 'Sarah Johnson', condition: 'Good' },
            { date: '2025-08-15', action: 'allocated', holder: 'Sarah Johnson', department: 'IT' }
          ]
        },
        { 
          id: 3, 
          tag: 'AF-0042', 
          name: 'Epson Projector', 
          status: 'Available',
          allocation_history: []
        },
      ]);

      setEmployees([
        { id: 1, name: 'Priya Shah', department: 'Engineering', email: 'priya@company.com' },
        { id: 2, name: 'Arjun Nair', department: 'IT', email: 'arjun@company.com' },
        { id: 3, name: 'Sarah Johnson', department: 'IT', email: 'sarah@company.com' },
        { id: 4, name: 'Michael Chen', department: 'Finance', email: 'michael@company.com' },
      ]);

      setDepartments([
        { id: 1, name: 'Engineering' },
        { id: 2, name: 'IT' },
        { id: 3, name: 'Finance' },
        { id: 4, name: 'Operations' }
      ]);

      setPendingTransfers([
        { 
          id: 1, 
          asset: { tag: 'AF-0089', name: 'Standing Desk' },
          from: { name: 'John Doe', department: 'Operations' },
          to: { name: 'Jane Smith', department: 'Engineering' },
          reason: 'Department relocation',
          requested_at: '2026-07-10T10:30:00Z'
        }
      ]);
    }
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const isAllocated = selectedAsset?.status === 'Allocated';

  const filteredAssets = assets.filter(asset =>
    asset.tag.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase())
  );

  const filteredHolders = holderType === 'employee'
    ? employees.filter(emp =>
        emp.name.toLowerCase().includes(holderSearchTerm.toLowerCase())
      )
    : departments.filter(dept =>
        dept.name.toLowerCase().includes(holderSearchTerm.toLowerCase())
      );

  const filteredTransferTargets = holderType === 'employee'
    ? employees.filter(emp =>
        emp.name.toLowerCase().includes(transferSearchTerm.toLowerCase()) &&
        emp.id !== selectedAsset?.current_holder?.id
      )
    : departments.filter(dept =>
        dept.name.toLowerCase().includes(transferSearchTerm.toLowerCase()) &&
        dept.name !== selectedAsset?.current_holder?.name
      );

  const handleAllocate = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/allocations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_id: selectedAssetId,
          holder_type: holderType,
          holder_id: selectedHolder.id,
          expected_return_date: expectedReturnDate || null
        })
      });

      const result = await response.json();
      
      if (!result.error) {
        showSuccessToast('Asset allocated successfully!');
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Allocation failed:', error);
      showSuccessToast('Asset allocated successfully! (Mock)');
      fetchData();
      resetForm();
    }
  };

  const handleTransferRequest = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_id: selectedAssetId,
          from_holder_id: selectedAsset.current_holder.id,
          from_holder_type: selectedAsset.current_holder.type,
          to_holder_id: transferTo.id,
          to_holder_type: holderType,
          reason: transferReason
        })
      });

      const result = await response.json();
      
      if (!result.error) {
        showSuccessToast('Transfer request sent for approval!');
        fetchData();
        resetTransferForm();
      }
    } catch (error) {
      console.error('Transfer request failed:', error);
      showSuccessToast('Transfer request sent for approval! (Mock)');
      fetchData();
      resetTransferForm();
    }
  };

  const handleApproveTransfer = async (transferId) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/transfers/${transferId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      showSuccessToast('Transfer approved!');
      fetchData();
    } catch (error) {
      console.error('Approval failed:', error);
      showSuccessToast('Transfer approved! (Mock)');
      fetchData();
    }
  };

  const handleRejectTransfer = async (transferId) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/transfers/${transferId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      showSuccessToast('Transfer rejected!');
      fetchData();
    } catch (error) {
      console.error('Rejection failed:', error);
      showSuccessToast('Transfer rejected! (Mock)');
      fetchData();
    }
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const resetForm = () => {
    setSelectedHolder(null);
    setHolderSearchTerm('');
    setExpectedReturnDate('');
  };

  const resetTransferForm = () => {
    setTransferTo(null);
    setTransferSearchTerm('');
    setTransferReason('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const canApproveTransfers = user?.role === 'AssetManager' || user?.role === 'DepartmentHead' || user?.role === 'Admin';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F12] flex">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Allocation & Transfer</h1>
            <p className="text-gray-400">Allocate assets to employees or departments, and manage transfers</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Asset Selector */}
              <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">Select Asset</label>
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by tag or name... (e.g., AF-0114 - Dell Laptop)"
                    value={assetSearchTerm}
                    onChange={(e) => {
                      setAssetSearchTerm(e.target.value);
                      setShowAssetDropdown(true);
                    }}
                    onFocus={() => setShowAssetDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {showAssetDropdown && filteredAssets.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setAssetSearchTerm(`${asset.tag} - ${asset.name}`);
                            setShowAssetDropdown(false);
                            resetForm();
                            resetTransferForm();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#1F1F24] transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white font-medium">{asset.tag} - {asset.name}</p>
                            <p className="text-sm text-gray-400">Status: {asset.status}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            asset.status === 'Available' 
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {asset.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Content Area with Smooth Transition */}
              {selectedAsset && (
                <div className="overflow-hidden transition-all duration-500 ease-in-out">
                  {!isAllocated ? (
                    /* STATE A: Allocation Form */
                    <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6 animate-fadeIn">
                      <h2 className="text-xl font-semibold text-white mb-6">Allocate Asset</h2>
                      
                      <form onSubmit={handleAllocate} className="space-y-6">
                        {/* Holder Type Toggle */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">Holder Type</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setHolderType('employee');
                                setSelectedHolder(null);
                                setHolderSearchTerm('');
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                                holderType === 'employee'
                                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                  : 'bg-[#0F0F12] border-[#2A2A32] text-gray-400 hover:border-gray-400'
                              }`}
                            >
                              <User size={20} />
                              <span className="font-medium">Employee</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setHolderType('department');
                                setSelectedHolder(null);
                                setHolderSearchTerm('');
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                                holderType === 'department'
                                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                  : 'bg-[#0F0F12] border-[#2A2A32] text-gray-400 hover:border-gray-400'
                              }`}
                            >
                              <Building2 size={20} />
                              <span className="font-medium">Department</span>
                            </button>
                          </div>
                        </div>

                        {/* Holder Selector */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            {holderType === 'employee' ? 'Employee' : 'Department'}
                          </label>
                          <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              required
                              placeholder={`Search ${holderType}...`}
                              value={holderSearchTerm}
                              onChange={(e) => {
                                setHolderSearchTerm(e.target.value);
                                setShowHolderDropdown(true);
                              }}
                              onFocus={() => setShowHolderDropdown(true)}
                              className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {showHolderDropdown && filteredHolders.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                {filteredHolders.map((holder) => (
                                  <button
                                    key={holder.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedHolder(holder);
                                      setHolderSearchTerm(holder.name);
                                      setShowHolderDropdown(false);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-[#1F1F24] transition"
                                  >
                                    <p className="text-white font-medium">{holder.name}</p>
                                    {holderType === 'employee' && holder.department && (
                                      <p className="text-sm text-gray-400">{holder.department}</p>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expected Return Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Expected Return Date (Optional)
                          </label>
                          <div className="relative">
                            <CalendarIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="date"
                              value={expectedReturnDate}
                              onChange={(e) => setExpectedReturnDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={!selectedHolder}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                        >
                          <CheckCircle size={20} />
                          Allocate Asset
                        </button>
                      </form>
                    </div>

                  ) : (
                    /* STATE B: Conflict Alert + Transfer Form */
                    <div className="space-y-6 animate-slideDown">
                      {/* Prominent Red Alert Card */}
                      <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500/50 rounded-lg p-6 shadow-lg animate-pulse-once">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <AlertTriangle size={32} className="text-red-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-red-300 mb-2">
                              Already Allocated
                            </h3>
                            <p className="text-red-200 text-lg mb-1">
                              This asset is currently allocated to{' '}
                              <span className="font-semibold">{selectedAsset.current_holder.name}</span>
                              {selectedAsset.current_holder.department && (
                                <span> ({selectedAsset.current_holder.department})</span>
                              )}
                            </p>
                            <p className="text-red-300/80 text-sm">
                              Direct re-allocation is blocked — submit a transfer request below.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Transfer Request Form */}
                      <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Transfer Request</h2>
                        
                        <form onSubmit={handleTransferRequest} className="space-y-6">
                          {/* From (Disabled) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">From</label>
                            <div className="px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-gray-400 cursor-not-allowed">
                              {selectedAsset.current_holder.name}
                              {selectedAsset.current_holder.department && ` (${selectedAsset.current_holder.department})`}
                            </div>
                          </div>

                          {/* Holder Type Toggle */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">Transfer To</label>
                            <div className="flex gap-3 mb-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setHolderType('employee');
                                  setTransferTo(null);
                                  setTransferSearchTerm('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                                  holderType === 'employee'
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                    : 'bg-[#0F0F12] border-[#2A2A32] text-gray-400 hover:border-gray-400'
                                }`}
                              >
                                <User size={20} />
                                <span className="font-medium">Employee</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setHolderType('department');
                                  setTransferTo(null);
                                  setTransferSearchTerm('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                                  holderType === 'department'
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                    : 'bg-[#0F0F12] border-[#2A2A32] text-gray-400 hover:border-gray-400'
                                }`}
                              >
                                <Building2 size={20} />
                                <span className="font-medium">Department</span>
                              </button>
                            </div>

                            {/* To Selector */}
                            <div className="relative">
                              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                required
                                placeholder={`Search ${holderType}...`}
                                value={transferSearchTerm}
                                onChange={(e) => {
                                  setTransferSearchTerm(e.target.value);
                                  setShowTransferDropdown(true);
                                }}
                                onFocus={() => setShowTransferDropdown(true)}
                                className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />

                              {showTransferDropdown && filteredTransferTargets.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                  {filteredTransferTargets.map((holder) => (
                                    <button
                                      key={holder.id}
                                      type="button"
                                      onClick={() => {
                                        setTransferTo(holder);
                                        setTransferSearchTerm(holder.name);
                                        setShowTransferDropdown(false);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-[#1F1F24] transition"
                                    >
                                      <p className="text-white font-medium">{holder.name}</p>
                                      {holderType === 'employee' && holder.department && (
                                        <p className="text-sm text-gray-400">{holder.department}</p>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Reason */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">Reason</label>
                            <textarea
                              required
                              rows={4}
                              value={transferReason}
                              onChange={(e) => setTransferReason(e.target.value)}
                              placeholder="Explain why this transfer is needed..."
                              className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          </div>

                          {/* Submit Button */}
                          <button
                            type="submit"
                            disabled={!transferTo || !transferReason}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                          >
                            <Send size={20} />
                            Submit Transfer Request
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Allocation History */}
              {selectedAsset && selectedAsset.allocation_history && selectedAsset.allocation_history.length > 0 && (
                <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Allocation History</h2>
                  
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#2A2A32]"></div>
                    
                    {/* Timeline items */}
                    <div className="space-y-6">
                      {selectedAsset.allocation_history.map((item, index) => (
                        <div key={index} className="relative pl-10">
                          {/* Timeline dot */}
                          <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            item.action === 'allocated' 
                              ? 'bg-blue-500/30 border-2 border-blue-500'
                              : 'bg-gray-500/30 border-2 border-gray-500'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              item.action === 'allocated' ? 'bg-blue-400' : 'bg-gray-400'
                            }`}></div>
                          </div>
                          
                          {/* Event details */}
                          <div>
                            <p className="text-gray-400 text-sm mb-1">{formatDate(item.date)}</p>
                            <p className="text-white font-medium">
                              {item.action === 'allocated' ? 'Allocated to' : 'Returned by'}{' '}
                              {item.holder}
                              {item.department && `, ${item.department}`}
                            </p>
                            {item.condition && (
                              <p className="text-gray-400 text-sm mt-1">Condition: {item.condition}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pending Transfers Panel */}
            <div className="lg:col-span-1">
              <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Pending Transfers</h2>
                  {pendingTransfers.length > 0 && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-sm font-medium rounded-full">
                      {pendingTransfers.length}
                    </span>
                  )}
                </div>

                {pendingTransfers.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={32} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400 text-sm">No pending transfers</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {pendingTransfers.map((transfer) => (
                      <div key={transfer.id} className="bg-[#0F0F12] border border-[#2A2A32] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-blue-400 font-medium text-sm">{transfer.asset.tag}</span>
                          <span className="text-gray-400 text-sm">- {transfer.asset.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm mb-3">
                          <span className="text-gray-300">{transfer.from.name}</span>
                          <ArrowRight size={16} className="text-gray-500" />
                          <span className="text-gray-300">{transfer.to.name}</span>
                        </div>

                        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{transfer.reason}</p>

                        <p className="text-gray-500 text-xs mb-4">
                          Requested {formatDate(transfer.requested_at)}
                        </p>

                        {canApproveTransfers && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveTransfer(transfer.id)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectTransfer(transfer.id)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slideUp">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <CheckCircle size={24} />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Allocation;

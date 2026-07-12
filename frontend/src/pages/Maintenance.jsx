import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  X,
  Upload,
  CheckCircle,
  XCircle,
  UserPlus,
  Play,
  Check,
  AlertCircle,
  ChevronDown,
  Calendar
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getAssets, transitionStatus } from '../api/assets';
import { getEmployees } from '../api/employees';
import { 
  getMaintenanceRequests, 
  createMaintenance, 
  approveMaintenance, 
  rejectMaintenance,
  assignTechnician,
  startMaintenance,
  resolveMaintenance
} from '../api/maintenance';

const Maintenance = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    asset_id: null,
    issue_description: '',
    priority: 'Medium',
    photo: null
  });
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Technician assignment
  const [assigningRequestId, setAssigningRequestId] = useState(null);
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const stages = [
    { id: 'pending', name: 'Pending', color: 'text-gray-400' },
    { id: 'approved', name: 'Approved', color: 'text-blue-400' },
    { id: 'technician_assigned', name: 'Technician Assigned', color: 'text-purple-400' },
    { id: 'in_progress', name: 'In Progress', color: 'text-amber-400' },
    { id: 'resolved', name: 'Resolved', color: 'text-green-400' }
  ];

  const priorities = {
    Low: { color: 'bg-gray-500', label: 'Low' },
    Medium: { color: 'bg-blue-500', label: 'Medium' },
    High: { color: 'bg-amber-500', label: 'High' },
    Critical: { color: 'bg-red-500', label: 'Critical' }
  };

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
      // Fetch maintenance requests
      const requestsResponse = await getMaintenanceRequests();
      if (requestsResponse.data.data) setRequests(requestsResponse.data.data.items || []);

      // Fetch assets
      const assetsResponse = await getAssets();
      if (assetsResponse.data.data) setAssets(assetsResponse.data.data.items || []);

      // Fetch technicians
      const techResponse = await getEmployees({ role: 'Technician' });
      if (techResponse.data.data) setTechnicians(techResponse.data.data.items || []);

    } catch (error) {
      console.error('Failed to fetch data:', error.response?.data?.detail || error.message);
      // Mock data for development
      setAssets([
        { id: 1, tag: 'AF-0001', name: 'MacBook Pro 16"', status: 'Allocated' },
        { id: 2, tag: 'AF-0062', name: 'Projector', status: 'Under Maintenance' },
        { id: 3, tag: 'AF-0114', name: 'Dell Latitude 5420', status: 'Available' },
        { id: 4, tag: 'AF-0042', name: 'Standing Desk', status: 'Available' },
      ]);

      setTechnicians([
        { id: 1, name: 'R. Varma' },
        { id: 2, name: 'K. Patel' },
        { id: 3, name: 'S. Mehta' },
      ]);

      setRequests([
        {
          id: 1,
          asset: { id: 2, tag: 'AF-0062', name: 'Projector' },
          issue_description: 'Projector bulb not turning on',
          priority: 'High',
          stage: 'pending',
          created_at: '2026-07-10T09:00:00Z'
        },
        {
          id: 2,
          asset: { id: 1, tag: 'AF-0001', name: 'MacBook Pro 16"' },
          issue_description: 'Screen flickering intermittently',
          priority: 'Medium',
          stage: 'approved',
          created_at: '2026-07-09T14:30:00Z'
        },
        {
          id: 3,
          asset: { id: 3, tag: 'AF-0114', name: 'Dell Latitude 5420' },
          issue_description: 'Battery not charging properly',
          priority: 'Critical',
          stage: 'technician_assigned',
          technician: { id: 1, name: 'R. Varma' },
          created_at: '2026-07-08T11:15:00Z'
        },
        {
          id: 4,
          asset: { id: 4, tag: 'AF-0042', name: 'Standing Desk' },
          issue_description: 'Height adjustment motor stuck',
          priority: 'Low',
          stage: 'in_progress',
          technician: { id: 2, name: 'K. Patel' },
          created_at: '2026-07-07T10:00:00Z'
        },
        {
          id: 5,
          asset: { id: 2, tag: 'AF-0062', name: 'Projector' },
          issue_description: 'Cooling fan making noise',
          priority: 'Medium',
          stage: 'resolved',
          technician: { id: 3, name: 'S. Mehta' },
          resolved_at: '2026-07-07T16:00:00Z',
          created_at: '2026-07-05T09:00:00Z'
        },
      ]);
    }
  };

  const getRequestsByStage = (stageId) => {
    return requests.filter(req => req.stage === stageId);
  };

  const canManageRequests = () => {
    return user?.role === 'AssetManager' || user?.role === 'Admin';
  };

  const isTechnician = () => {
    return user?.role === 'Technician' || user?.role === 'AssetManager' || user?.role === 'Admin';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const handleApprove = async (requestId) => {
    try {
      const request = requests.find(r => r.id === requestId);
      
      // Update request stage
      await approveMaintenance(requestId);

      // Transition asset to Under Maintenance
      await transitionStatus(request.asset.id, { new_status: 'Under Maintenance' });

      showSuccessToast(`${request.asset.tag} status: ${request.asset.status || 'Available'} → Under Maintenance`);
      fetchData();
    } catch (error) {
      console.error('Approval failed:', error.response?.data?.detail || error.message);
      showSuccessToast(error.response?.data?.detail || 'Approval failed');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectMaintenance(requestId);
      showSuccessToast('Request rejected');
      fetchData();
    } catch (error) {
      console.error('Rejection failed:', error.response?.data?.detail || error.message);
      showSuccessToast(error.response?.data?.detail || 'Rejection failed');
    }
  };

  const handleAssignTechnician = async (requestId, technicianId) => {
    try {
      const technician = technicians.find(t => t.id === technicianId);
      
      await assignTechnician(requestId, { technician_id: technicianId });

      showSuccessToast(`Technician ${technician.name} assigned`);
      setAssigningRequestId(null);
      setShowTechnicianDropdown(false);
      fetchData();
    } catch (error) {
      console.error('Assignment failed:', error.response?.data?.detail || error.message);
      showSuccessToast(error.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleStartWork = async (requestId) => {
    try {
      await startMaintenance(requestId);
      showSuccessToast('Work started');
      fetchData();
    } catch (error) {
      console.error('Start failed:', error.response?.data?.detail || error.message);
      showSuccessToast(error.response?.data?.detail || 'Start failed');
    }
  };

  const handleResolve = async (requestId) => {
    try {
      const request = requests.find(r => r.id === requestId);
      
      // Update request stage
      await resolveMaintenance(requestId);

      // Transition asset back to Available
      await transitionStatus(request.asset.id, { new_status: 'Available' });

      showSuccessToast(`${request.asset.tag} status: Under Maintenance → Available`);
      fetchData();
    } catch (error) {
      console.error('Resolution failed:', error.response?.data?.detail || error.message);
      showSuccessToast(error.response?.data?.detail || 'Resolution failed');
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      
      formData.append('asset_id', requestForm.asset_id);
      formData.append('issue_description', requestForm.issue_description);
      formData.append('priority', requestForm.priority);
      if (requestForm.photo) {
        formData.append('photo', requestForm.photo);
      }

      const response = await createMaintenance(formData);
      
      if (response.data) {
        showSuccessToast('Maintenance request submitted!');
        setShowRequestModal(false);
        resetRequestForm();
        fetchData();
      }
    } catch (error) {
      console.error('Request submission failed:', error.response?.data?.detail || error.message);
      showSuccessToast(error.response?.data?.detail || 'Request submission failed');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRequestForm({ ...requestForm, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetRequestForm = () => {
    setRequestForm({
      asset_id: null,
      issue_description: '',
      priority: 'Medium',
      photo: null
    });
    setAssetSearchTerm('');
    setPhotoPreview(null);
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredAssets = assets.filter(asset =>
    asset.tag.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase())
  );

  const selectedAsset = assets.find(a => a.id === requestForm.asset_id);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F12] flex">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-auto p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Maintenance Management</h1>
              <p className="text-gray-400">Track and manage asset maintenance requests</p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              <Plus size={20} />
              Raise Request
            </button>
          </div>

          {/* Kanban Board */}
          <div className="flex gap-4 min-w-max pb-8">
            {stages.map((stage) => {
              const stageRequests = getRequestsByStage(stage.id);
              
              return (
                <div key={stage.id} className="flex-shrink-0 w-80">
                  {/* Column Header */}
                  <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold ${stage.color}`}>{stage.name}</h3>
                      <span className="px-2 py-1 bg-[#2A2A32] text-gray-300 text-sm font-medium rounded-full">
                        {stageRequests.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3">
                    {stageRequests.length === 0 ? (
                      <div className="bg-[#17171C] border border-dashed border-[#2A2A32] rounded-lg p-6 text-center">
                        <p className="text-gray-500 text-sm">No requests</p>
                      </div>
                    ) : (
                      stageRequests.map((request) => (
                        <div
                          key={request.id}
                          className={`bg-[#17171C] border border-[#2A2A32] rounded-lg p-4 hover:border-blue-500/50 transition ${
                            stage.id === 'resolved' ? 'bg-green-500/5 border-green-500/30' : ''
                          }`}
                        >
                          {/* Asset Tag and Name */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold truncate">
                                {request.asset.tag} — {request.asset.name}
                              </h4>
                            </div>
                            {/* Priority Indicator */}
                            <div 
                              className={`w-3 h-3 rounded-full ${priorities[request.priority].color} flex-shrink-0 ml-2`}
                              title={`Priority: ${request.priority}`}
                            ></div>
                          </div>

                          {/* Issue Description */}
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {request.issue_description}
                          </p>

                          {/* Stage-Specific Context */}
                          {stage.id === 'technician_assigned' && request.technician && (
                            <div className="mb-3 px-3 py-2 bg-[#0F0F12] rounded border border-[#2A2A32]">
                              <p className="text-purple-400 text-xs font-medium">
                                tech: {request.technician.name}
                              </p>
                            </div>
                          )}

                          {stage.id === 'in_progress' && request.technician && (
                            <div className="mb-3 px-3 py-2 bg-[#0F0F12] rounded border border-[#2A2A32]">
                              <p className="text-amber-400 text-xs font-medium">
                                working: {request.technician.name}
                              </p>
                            </div>
                          )}

                          {stage.id === 'resolved' && request.resolved_at && (
                            <div className="mb-3 px-3 py-2 bg-green-500/10 rounded border border-green-500/30">
                              <p className="text-green-400 text-xs font-medium">
                                resolved {formatDate(request.resolved_at)}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            {/* Pending Stage Actions */}
                            {stage.id === 'pending' && canManageRequests() && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(request.id)}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition"
                                >
                                  <CheckCircle size={16} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(request.id)}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition"
                                >
                                  <XCircle size={16} />
                                  Reject
                                </button>
                              </div>
                            )}

                            {/* Approved Stage Actions */}
                            {stage.id === 'approved' && canManageRequests() && (
                              <div>
                                {assigningRequestId === request.id ? (
                                  <div className="relative">
                                    <button
                                      onClick={() => setShowTechnicianDropdown(!showTechnicianDropdown)}
                                      className="w-full flex items-center justify-between px-3 py-2 bg-[#0F0F12] border border-[#2A2A32] rounded text-white text-sm"
                                    >
                                      <span>Select Technician</span>
                                      <ChevronDown size={16} />
                                    </button>

                                    {showTechnicianDropdown && (
                                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#17171C] border border-[#2A2A32] rounded shadow-xl z-20 max-h-48 overflow-y-auto">
                                        {technicians.map((tech) => (
                                          <button
                                            key={tech.id}
                                            onClick={() => handleAssignTechnician(request.id, tech.id)}
                                            className="w-full px-3 py-2 text-left text-white text-sm hover:bg-[#1F1F24] transition"
                                          >
                                            {tech.name}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAssigningRequestId(request.id);
                                      setShowTechnicianDropdown(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition"
                                  >
                                    <UserPlus size={16} />
                                    Assign Technician
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Technician Assigned Stage Actions */}
                            {stage.id === 'technician_assigned' && isTechnician() && (
                              <button
                                onClick={() => handleStartWork(request.id)}
                                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded transition"
                              >
                                <Play size={16} />
                                Start Work
                              </button>
                            )}

                            {/* In Progress Stage Actions */}
                            {stage.id === 'in_progress' && isTechnician() && (
                              <button
                                onClick={() => handleResolve(request.id)}
                                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition"
                              >
                                <Check size={16} />
                                Resolve
                              </button>
                            )}
                          </div>

                          {/* Request Date */}
                          <div className="mt-3 pt-3 border-t border-[#2A2A32]">
                            <p className="text-gray-500 text-xs">
                              Raised {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workflow Footnote */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">Workflow Note:</span> Approving a request moves the asset to Under Maintenance. 
                Resolving it returns the asset to Available.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Raise Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => {
            setShowRequestModal(false);
            resetRequestForm();
          }}></div>
          
          <div className="relative bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-2xl w-full max-w-lg mx-4 animate-scaleIn">
            <div className="px-6 py-4 border-b border-[#2A2A32] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Raise Maintenance Request</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  resetRequestForm();
                }}
                className="p-2 hover:bg-[#2A2A32] rounded transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              {/* Asset Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Asset *</label>
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Search by tag or name..."
                    value={assetSearchTerm}
                    onChange={(e) => {
                      setAssetSearchTerm(e.target.value);
                      setShowAssetDropdown(true);
                    }}
                    onFocus={() => setShowAssetDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {showAssetDropdown && filteredAssets.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            setRequestForm({ ...requestForm, asset_id: asset.id });
                            setAssetSearchTerm(`${asset.tag} - ${asset.name}`);
                            setShowAssetDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#1F1F24] transition"
                        >
                          <p className="text-white font-medium">{asset.tag} - {asset.name}</p>
                          <p className="text-sm text-gray-400">Status: {asset.status}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Issue Description *</label>
                <textarea
                  required
                  rows={4}
                  value={requestForm.issue_description}
                  onChange={(e) => setRequestForm({ ...requestForm, issue_description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priority *</label>
                <select
                  required
                  value={requestForm.priority}
                  onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Photo (Optional)</label>
                <div className="border-2 border-dashed border-[#2A2A32] rounded-lg p-4 text-center hover:border-blue-500 transition">
                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setRequestForm({ ...requestForm, photo: null });
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-400 text-sm mb-1">Upload photo of the issue</p>
                      <p className="text-gray-500 text-xs">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!requestForm.asset_id}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                <CheckCircle size={20} />
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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

export default Maintenance;

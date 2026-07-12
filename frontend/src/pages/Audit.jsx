import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  ChevronDown,
  Calendar as CalendarIcon,
  AlertTriangle,
  Lock,
  MessageSquare,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Audit = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [auditCycles, setAuditCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditors, setAuditors] = useState([]);
  
  // Modal states
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    title: '',
    department: '',
    location: '',
    start_date: '',
    end_date: '',
    auditor_ids: []
  });
  
  // UI states
  const [showCycleDropdown, setShowCycleDropdown] = useState(false);
  const [showAuditorDropdown, setShowAuditorDropdown] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [notes, setNotes] = useState({});
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState({});
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const verificationStatuses = {
    verified: { label: 'Verified', color: 'bg-green-500/20 text-green-300 border-green-500 hover:bg-green-500/30' },
    missing: { label: 'Missing', color: 'bg-red-500/20 text-red-300 border-red-500 hover:bg-red-500/30' },
    damaged: { label: 'Damaged', color: 'bg-amber-500/20 text-amber-300 border-amber-500 hover:bg-amber-500/30' }
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
      const token = localStorage.getItem('authToken');

      // Fetch audit cycles
      const cyclesResponse = await fetch('/api/audit-cycles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cyclesResult = await cyclesResponse.json();
      if (cyclesResult.data) {
        setAuditCycles(cyclesResult.data.items || []);
        // Auto-select the first open cycle
        const openCycle = cyclesResult.data.items.find(c => c.status === 'open');
        if (openCycle) setSelectedCycleId(openCycle.id);
      }

      // Fetch departments
      const deptResponse = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptResult = await deptResponse.json();
      if (deptResult.data) setDepartments(deptResult.data.items || []);

      // Fetch auditors
      const auditorsResponse = await fetch('/api/employees?role=AssetManager,Admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const auditorsResult = await auditorsResponse.json();
      if (auditorsResult.data) setAuditors(auditorsResult.data.items || []);

      // Fetch assets for selected cycle
      if (selectedCycleId) {
        const assetsResponse = await fetch(`/api/audit-cycles/${selectedCycleId}/assets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const assetsResult = await assetsResponse.json();
        if (assetsResult.data) setAssets(assetsResult.data.items || []);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data for development
      setDepartments([
        { id: 1, name: 'Engineering' },
        { id: 2, name: 'IT' },
        { id: 3, name: 'Finance' },
        { id: 4, name: 'Operations' }
      ]);

      setAuditors([
        { id: 1, name: 'A. Rao', avatar_color: 'from-blue-500 to-purple-600' },
        { id: 2, name: 'S. Iqbal', avatar_color: 'from-green-500 to-teal-600' },
        { id: 3, name: 'M. Kumar', avatar_color: 'from-pink-500 to-rose-600' },
      ]);

      setAuditCycles([
        {
          id: 1,
          title: 'Q3 Audit: Engineering Dept',
          department: 'Engineering',
          location: 'Building A - Floor 3',
          start_date: '2026-07-01',
          end_date: '2026-07-15',
          status: 'open',
          auditors: [
            { id: 1, name: 'A. Rao', avatar_color: 'from-blue-500 to-purple-600' },
            { id: 2, name: 'S. Iqbal', avatar_color: 'from-green-500 to-teal-600' }
          ],
          created_at: '2026-06-28T09:00:00Z'
        },
        {
          id: 2,
          title: 'Q2 Audit: IT Department',
          department: 'IT',
          location: 'Building B - All Floors',
          start_date: '2026-04-01',
          end_date: '2026-04-15',
          status: 'closed',
          auditors: [{ id: 3, name: 'M. Kumar', avatar_color: 'from-pink-500 to-rose-600' }],
          discrepancy_count: 3,
          created_at: '2026-03-25T09:00:00Z',
          closed_at: '2026-04-16T17:00:00Z'
        }
      ]);

      setAssets([
        {
          id: 1,
          tag: 'AF-0001',
          name: 'MacBook Pro 16"',
          expected_location: 'Engineering - Desk 14',
          verification_status: 'verified'
        },
        {
          id: 2,
          tag: 'AF-0114',
          name: 'Dell Latitude 5420',
          expected_location: 'Engineering - Desk 22',
          verification_status: 'missing'
        },
        {
          id: 3,
          tag: 'AF-0042',
          name: 'Standing Desk',
          expected_location: 'Engineering - Workstation 8',
          verification_status: 'damaged'
        },
        {
          id: 4,
          tag: 'AF-0089',
          name: 'Monitor - Dell 27"',
          expected_location: 'Engineering - Conference Room',
          verification_status: null
        },
        {
          id: 5,
          tag: 'AF-0203',
          name: 'Wireless Keyboard',
          expected_location: 'Engineering - Hot Desk Area',
          verification_status: 'verified'
        }
      ]);

      setSelectedCycleId(1);
    }
  };

  useEffect(() => {
    if (selectedCycleId) {
      fetchData();
    }
  }, [selectedCycleId]);

  const selectedCycle = auditCycles.find(c => c.id === selectedCycleId);
  const openCycles = auditCycles.filter(c => c.status === 'open');
  const closedCycles = auditCycles.filter(c => c.status === 'closed');

  const discrepancyCount = assets.filter(a => 
    a.verification_status && a.verification_status !== 'verified'
  ).length;

  const canAudit = () => {
    if (!selectedCycle || selectedCycle.status !== 'open') return false;
    return user?.role === 'AssetManager' || 
           user?.role === 'Admin' ||
           selectedCycle.auditors?.some(auditor => auditor.id === user?.id);
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString('en-US', { month: 'short' })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleVerificationChange = async (assetId, status) => {
    if (!canAudit()) {
      showSuccessToast('You do not have permission to verify assets');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/audit-cycles/${selectedCycleId}/assets/${assetId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verification_status: status })
      });

      setAssets(prev => prev.map(a => 
        a.id === assetId ? { ...a, verification_status: status } : a
      ));
    } catch (error) {
      console.error('Verification failed:', error);
      setAssets(prev => prev.map(a => 
        a.id === assetId ? { ...a, verification_status: status } : a
      ));
    }
  };

  const handleSaveNote = async (assetId, noteText) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/audit-cycles/${selectedCycleId}/assets/${assetId}/note`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: noteText })
      });

      setNotes({ ...notes, [assetId]: noteText });
      showSuccessToast('Note saved');
    } catch (error) {
      console.error('Note save failed:', error);
      setNotes({ ...notes, [assetId]: noteText });
      showSuccessToast('Note saved (Mock)');
    }
  };

  const handleCloseAuditCycle = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Get all missing assets
      const missingAssets = assets.filter(a => a.verification_status === 'missing');
      
      // Close the audit cycle
      await fetch(`/api/audit-cycles/${selectedCycleId}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Transition all missing assets to Lost
      for (const asset of missingAssets) {
        await fetch(`/api/assets/${asset.id}/transition-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ new_status: 'Lost' })
        });
      }

      showSuccessToast(`Audit closed. ${missingAssets.length} asset${missingAssets.length !== 1 ? 's' : ''} marked Lost.`);
      setShowCloseConfirm(false);
      fetchData();
    } catch (error) {
      console.error('Close audit failed:', error);
      const missingAssets = assets.filter(a => a.verification_status === 'missing');
      showSuccessToast(`Audit closed. ${missingAssets.length} asset${missingAssets.length !== 1 ? 's' : ''} marked Lost. (Mock)`);
      
      setAuditCycles(prev => prev.map(c => 
        c.id === selectedCycleId 
          ? { ...c, status: 'closed', closed_at: new Date().toISOString(), discrepancy_count: discrepancyCount }
          : c
      ));
      setShowCloseConfirm(false);
      setSelectedCycleId(openCycles[0]?.id || null);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/audit-cycles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cycleForm)
      });

      const result = await response.json();
      
      if (!result.error) {
        showSuccessToast('Audit cycle created successfully!');
        setShowNewCycleModal(false);
        resetCycleForm();
        fetchData();
      }
    } catch (error) {
      console.error('Create cycle failed:', error);
      showSuccessToast('Audit cycle created successfully! (Mock)');
      
      const selectedAuditors = auditors.filter(a => cycleForm.auditor_ids.includes(a.id));
      const newCycle = {
        id: Date.now(),
        title: cycleForm.title,
        department: cycleForm.department,
        location: cycleForm.location,
        start_date: cycleForm.start_date,
        end_date: cycleForm.end_date,
        status: 'open',
        auditors: selectedAuditors,
        created_at: new Date().toISOString()
      };
      
      setAuditCycles(prev => [newCycle, ...prev]);
      setSelectedCycleId(newCycle.id);
      setShowNewCycleModal(false);
      resetCycleForm();
    }
  };

  const resetCycleForm = () => {
    setCycleForm({
      title: '',
      department: '',
      location: '',
      start_date: '',
      end_date: '',
      auditor_ids: []
    });
  };

  const toggleAuditor = (auditorId) => {
    setCycleForm(prev => ({
      ...prev,
      auditor_ids: prev.auditor_ids.includes(auditorId)
        ? prev.auditor_ids.filter(id => id !== auditorId)
        : [...prev.auditor_ids, auditorId]
    }));
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F12] flex">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Asset Audit</h1>
              <p className="text-gray-400">Verify asset locations and conditions</p>
            </div>
            <button
              onClick={() => setShowNewCycleModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              <Plus size={20} />
              New Audit Cycle
            </button>
          </div>

          {/* Active Audit Cycle Summary */}
          {selectedCycle && (
            <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {/* Cycle Selector */}
                  <div className="relative inline-block mb-3">
                    <button
                      onClick={() => setShowCycleDropdown(!showCycleDropdown)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white hover:border-blue-500 transition"
                    >
                      <span className="font-medium">Select Cycle</span>
                      <ChevronDown size={16} />
                    </button>

                    {showCycleDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-96 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                        {openCycles.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-[#0F0F12] border-b border-[#2A2A32]">
                              <p className="text-xs font-semibold text-gray-400 uppercase">Open Cycles</p>
                            </div>
                            {openCycles.map((cycle) => (
                              <button
                                key={cycle.id}
                                onClick={() => {
                                  setSelectedCycleId(cycle.id);
                                  setShowCycleDropdown(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-[#1F1F24] transition ${
                                  cycle.id === selectedCycleId ? 'bg-blue-500/20' : ''
                                }`}
                              >
                                <p className="text-white font-medium">{cycle.title}</p>
                                <p className="text-sm text-gray-400">{formatDateRange(cycle.start_date, cycle.end_date)}</p>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {closedCycles.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-[#0F0F12] border-b border-t border-[#2A2A32]">
                              <p className="text-xs font-semibold text-gray-400 uppercase">Closed Cycles</p>
                            </div>
                            {closedCycles.map((cycle) => (
                              <button
                                key={cycle.id}
                                onClick={() => {
                                  setSelectedCycleId(cycle.id);
                                  setShowCycleDropdown(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-[#1F1F24] transition ${
                                  cycle.id === selectedCycleId ? 'bg-blue-500/20' : ''
                                }`}
                              >
                                <p className="text-gray-400 font-medium">{cycle.title}</p>
                                <p className="text-sm text-gray-500">{formatDateRange(cycle.start_date, cycle.end_date)}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cycle Info */}
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedCycle.title}</h2>
                  <p className="text-gray-400 mb-3">{formatDateRange(selectedCycle.start_date, selectedCycle.end_date)}</p>
                  
                  {/* Auditors */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-400">Auditors:</span>
                    {selectedCycle.auditors?.map((auditor) => (
                      <div
                        key={auditor.id}
                        className="flex items-center gap-2 px-3 py-1 bg-[#0F0F12] border border-[#2A2A32] rounded-full"
                      >
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${auditor.avatar_color} flex items-center justify-center text-white text-xs font-semibold`}>
                          {getInitials(auditor.name)}
                        </div>
                        <span className="text-sm text-gray-300">{auditor.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Badge */}
                {selectedCycle.status === 'closed' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 border border-gray-500 rounded-lg">
                    <Lock size={16} className="text-gray-400" />
                    <span className="text-gray-300 text-sm font-medium">Closed</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checklist Table */}
          {selectedCycle && (
            <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-[#1F1F24] border-b border-[#2A2A32]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expected Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Verification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A32]">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#1F1F24] transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-semibold">{asset.tag}</p>
                          <p className="text-gray-400 text-sm">{asset.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{asset.expected_location}</td>
                      <td className="px-6 py-4">
                        {/* 3-way Pill Selector */}
                        <div className="flex gap-2">
                          {Object.entries(verificationStatuses).map(([key, status]) => (
                            <button
                              key={key}
                              onClick={() => handleVerificationChange(asset.id, key)}
                              disabled={selectedCycle.status === 'closed' || !canAudit()}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition ${
                                asset.verification_status === key
                                  ? status.color
                                  : 'bg-[#0F0F12] text-gray-500 border-[#2A2A32] hover:border-gray-500'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedNotes(prev => ({
                            ...prev,
                            [asset.id]: !prev[asset.id]
                          }))}
                          className="p-2 hover:bg-[#2A2A32] rounded transition"
                          title="Add note"
                        >
                          <MessageSquare size={18} className={
                            notes[asset.id] ? 'text-blue-400' : 'text-gray-400'
                          } />
                        </button>
                        
                        {/* Inline Note Field */}
                        {expandedNotes[asset.id] && (
                          <div className="absolute right-8 mt-2 w-80 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-xl z-10 p-4">
                            <textarea
                              value={notes[asset.id] || ''}
                              onChange={(e) => setNotes({ ...notes, [asset.id]: e.target.value })}
                              placeholder="Add notes about this asset..."
                              rows={3}
                              className="w-full px-3 py-2 bg-[#0F0F12] border border-[#2A2A32] rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  handleSaveNote(asset.id, notes[asset.id] || '');
                                  setExpandedNotes(prev => ({ ...prev, [asset.id]: false }));
                                }}
                                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setExpandedNotes(prev => ({ ...prev, [asset.id]: false }))}
                                className="flex-1 px-3 py-1.5 bg-[#2A2A32] hover:bg-[#35353D] text-gray-300 text-sm font-medium rounded transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Discrepancy Banner */}
          {selectedCycle && selectedCycle.status === 'open' && discrepancyCount > 0 && (
            <div className="bg-amber-500/20 border-2 border-amber-500 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-amber-300 font-semibold">
                    {discrepancyCount} asset{discrepancyCount !== 1 ? 's' : ''} flagged — discrepancy report generated automatically
                  </p>
                  <p className="text-amber-200 text-sm mt-1">
                    {assets.filter(a => a.verification_status === 'missing').length} missing, {' '}
                    {assets.filter(a => a.verification_status === 'damaged').length} damaged
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Close Audit Button */}
          {selectedCycle && selectedCycle.status === 'open' && (user?.role === 'AssetManager' || user?.role === 'Admin') && (
            <div className="mb-6">
              <button
                onClick={() => setShowCloseConfirm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                <Lock size={20} />
                Close Audit Cycle
              </button>
            </div>
          )}

          {/* Audit History */}
          {closedCycles.length > 0 && (
            <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Audit History</h3>
              
              <div className="space-y-3">
                {closedCycles.map((cycle) => (
                  <div key={cycle.id} className="bg-[#0F0F12] border border-[#2A2A32] rounded-lg">
                    <button
                      onClick={() => setExpandedHistory(prev => ({
                        ...prev,
                        [cycle.id]: !prev[cycle.id]
                      }))}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#17171C] transition"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronRight
                          size={20}
                          className={`text-gray-400 transition-transform ${
                            expandedHistory[cycle.id] ? 'rotate-90' : ''
                          }`}
                        />
                        <div className="text-left">
                          <p className="text-white font-medium">{cycle.title}</p>
                          <p className="text-sm text-gray-400">
                            {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {cycle.discrepancy_count > 0 && (
                          <div className="px-3 py-1 bg-amber-500/20 border border-amber-500 rounded-full">
                            <p className="text-amber-300 text-xs font-medium">
                              {cycle.discrepancy_count} discrepanc{cycle.discrepancy_count !== 1 ? 'ies' : 'y'}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 border border-gray-500 rounded">
                          <Lock size={14} className="text-gray-400" />
                          <span className="text-gray-300 text-xs font-medium">Closed</span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedHistory[cycle.id] && (
                      <div className="px-4 pb-4 border-t border-[#2A2A32]">
                        <div className="pt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Department:</span>
                            <span className="text-white">{cycle.department}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Location:</span>
                            <span className="text-white">{cycle.location}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Closed:</span>
                            <span className="text-white">{formatDate(cycle.closed_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <span className="text-sm text-gray-400">Auditors:</span>
                            {cycle.auditors?.map((auditor) => (
                              <div
                                key={auditor.id}
                                className="flex items-center gap-1 px-2 py-1 bg-[#17171C] border border-[#2A2A32] rounded"
                              >
                                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${auditor.avatar_color} flex items-center justify-center text-white text-xs font-semibold`}>
                                  {getInitials(auditor.name)}
                                </div>
                                <span className="text-xs text-gray-300">{auditor.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Close Audit Confirmation Dialog */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setShowCloseConfirm(false)}></div>
          
          <div className="relative bg-[#17171C] border border-red-500 rounded-lg shadow-2xl w-full max-w-md mx-4 animate-scaleIn">
            <div className="px-6 py-4 border-b border-[#2A2A32]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={24} className="text-red-400" />
                Close Audit Cycle
              </h2>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to close this audit cycle? This action cannot be undone.
              </p>
              
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-300 text-sm font-semibold mb-2">Warning:</p>
                <p className="text-red-200 text-sm">
                  All assets marked as "Missing" will be transitioned to "Lost" status. 
                  {' '}{assets.filter(a => a.verification_status === 'missing').length} asset(s) will be affected.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseAuditCycle}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Lock size={20} />
                  Confirm Close
                </button>
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 px-4 py-3 bg-[#2A2A32] hover:bg-[#35353D] text-gray-300 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Audit Cycle Modal */}
      {showNewCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => {
            setShowNewCycleModal(false);
            resetCycleForm();
          }}></div>
          
          <div className="relative bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-[#17171C] px-6 py-4 border-b border-[#2A2A32] flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">Create New Audit Cycle</h2>
              <button
                onClick={() => {
                  setShowNewCycleModal(false);
                  resetCycleForm();
                }}
                className="p-2 hover:bg-[#2A2A32] rounded transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={cycleForm.title}
                  onChange={(e) => setCycleForm({ ...cycleForm, title: e.target.value })}
                  placeholder="e.g., Q3 Audit: Engineering Dept"
                  className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                  <select
                    value={cycleForm.department}
                    onChange={(e) => setCycleForm({ ...cycleForm, department: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={cycleForm.location}
                    onChange={(e) => setCycleForm({ ...cycleForm, location: e.target.value })}
                    placeholder="e.g., Building A - Floor 3"
                    className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                  <div className="relative">
                    <CalendarIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={cycleForm.start_date}
                      onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                  <div className="relative">
                    <CalendarIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={cycleForm.end_date}
                      onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })}
                      min={cycleForm.start_date}
                      className="w-full pl-10 pr-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Auditors Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Auditors *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAuditorDropdown(!showAuditorDropdown)}
                    className="w-full px-4 py-3 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="text-white">
                      {cycleForm.auditor_ids.length > 0
                        ? `${cycleForm.auditor_ids.length} auditor${cycleForm.auditor_ids.length !== 1 ? 's' : ''} selected`
                        : 'Select auditors...'
                      }
                    </span>
                    <ChevronDown size={20} className="text-gray-400" />
                  </button>

                  {showAuditorDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                      {auditors.map((auditor) => (
                        <label
                          key={auditor.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[#1F1F24] cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={cycleForm.auditor_ids.includes(auditor.id)}
                            onChange={() => toggleAuditor(auditor.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${auditor.avatar_color} flex items-center justify-center text-white text-xs font-semibold`}>
                            {getInitials(auditor.name)}
                          </div>
                          <span className="text-white">{auditor.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Auditors Preview */}
                {cycleForm.auditor_ids.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cycleForm.auditor_ids.map((auditorId) => {
                      const auditor = auditors.find(a => a.id === auditorId);
                      return (
                        <div
                          key={auditorId}
                          className="flex items-center gap-2 px-3 py-1 bg-[#0F0F12] border border-[#2A2A32] rounded-full"
                        >
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${auditor.avatar_color} flex items-center justify-center text-white text-xs font-semibold`}>
                            {getInitials(auditor.name)}
                          </div>
                          <span className="text-sm text-gray-300">{auditor.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleAuditor(auditorId)}
                            className="p-0.5 hover:bg-red-500/20 rounded transition"
                          >
                            <X size={14} className="text-gray-400 hover:text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={cycleForm.auditor_ids.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                <CheckCircle size={20} />
                Create Audit Cycle
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

export default Audit;

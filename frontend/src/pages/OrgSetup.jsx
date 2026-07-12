import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Tag,
  Users,
  Plus,
  Search,
  Edit2,
  X,
  ChevronDown,
  AlertCircle,
  Package
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const OrgSetup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('departments'); // departments, categories, employees
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add or edit
  const [selectedItem, setSelectedItem] = useState(null);

  // Data states
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for modals
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    head: '',
    parent_department: '',
    status: 'Active'
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    extra_fields: [],
    status: 'Active'
  });

  const [showRoleDropdown, setShowRoleDropdown] = useState(null);

  useEffect(() => {
    // Check if user is Admin
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'Admin') {
        // Redirect non-admins
        navigate('/dashboard');
        return;
      }
    } else {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      // Fetch departments
      const deptResponse = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deptResult = await deptResponse.json();
      if (deptResult.data) setDepartments(deptResult.data.items || []);

      // Fetch categories
      const catResponse = await fetch('/api/asset-categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const catResult = await catResponse.json();
      if (catResult.data) setCategories(catResult.data.items || []);

      // Fetch employees
      const empResponse = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const empResult = await empResponse.json();
      if (empResult.data) setEmployees(empResult.data.items || []);

    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      // Use mock data for development
      setDepartments([
        { id: 1, name: 'IT', head: 'John Doe', parent_department: null, status: 'Active' },
        { id: 2, name: 'HR', head: 'Jane Smith', parent_department: null, status: 'Active' },
        { id: 3, name: 'Finance', head: 'Bob Johnson', parent_department: null, status: 'Active' },
        { id: 4, name: 'Operations', head: 'Alice Brown', parent_department: null, status: 'Active' }
      ]);

      setCategories([
        { id: 1, name: 'Laptops', extra_fields: ['warranty_period', 'processor_type'], status: 'Active' },
        { id: 2, name: 'Furniture', extra_fields: ['material', 'dimensions'], status: 'Active' },
        { id: 3, name: 'Vehicles', extra_fields: ['license_plate', 'mileage'], status: 'Active' }
      ]);

      setEmployees([
        { id: 1, name: 'John Doe', email: 'john@company.com', department: 'IT', role: 'Admin', status: 'Active' },
        { id: 2, name: 'Jane Smith', email: 'jane@company.com', department: 'HR', role: 'Asset Manager', status: 'Active' },
        { id: 3, name: 'Bob Johnson', email: 'bob@company.com', department: 'Finance', role: 'Department Head', status: 'Active' },
        { id: 4, name: 'Alice Brown', email: 'alice@company.com', department: 'Operations', role: 'Employee', status: 'Active' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedItem(null);
    if (activeTab === 'departments') {
      setDepartmentForm({ name: '', head: '', parent_department: '', status: 'Active' });
    } else if (activeTab === 'categories') {
      setCategoryForm({ name: '', extra_fields: [], status: 'Active' });
    }
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    if (activeTab === 'departments') {
      setDepartmentForm({
        name: item.name,
        head: item.head,
        parent_department: item.parent_department || '',
        status: item.status
      });
    } else if (activeTab === 'categories') {
      setCategoryForm({
        name: item.name,
        extra_fields: item.extra_fields || [],
        status: item.status
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('authToken');
    try {
      if (activeTab === 'departments') {
        const url = modalMode === 'add' ? '/api/departments' : `/api/departments/${selectedItem.id}`;
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(departmentForm)
        });
        
        const result = await response.json();
        if (!result.error) {
          alert(modalMode === 'add' ? 'Department created successfully!' : 'Department updated successfully!');
          fetchData();
          setShowModal(false);
        }
      } else if (activeTab === 'categories') {
        const url = modalMode === 'add' ? '/api/asset-categories' : `/api/asset-categories/${selectedItem.id}`;
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(categoryForm)
        });
        
        const result = await response.json();
        if (!result.error) {
          alert(modalMode === 'add' ? 'Category created successfully!' : 'Category updated successfully!');
          fetchData();
          setShowModal(false);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Operation failed. Please try again.');
    }
  };

  const handleRoleChange = async (employeeId, newRole) => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`/api/employees/${employeeId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      const result = await response.json();
      if (!result.error) {
        alert(`Role changed to ${newRole} successfully!`);
        fetchData();
        setShowRoleDropdown(null);
      }
    } catch (error) {
      console.error('Role change failed:', error);
      alert('Failed to change role. Please try again.');
    }
  };

  const addExtraField = () => {
    setCategoryForm({
      ...categoryForm,
      extra_fields: [...categoryForm.extra_fields, { key: '', value: '' }]
    });
  };

  const updateExtraField = (index, field, value) => {
    const updated = [...categoryForm.extra_fields];
    updated[index] = typeof updated[index] === 'string' 
      ? (field === 'key' ? value : updated[index])
      : { ...updated[index], [field]: value };
    setCategoryForm({ ...categoryForm, extra_fields: updated });
  };

  const removeExtraField = (index) => {
    const updated = categoryForm.extra_fields.filter((_, i) => i !== index);
    setCategoryForm({ ...categoryForm, extra_fields: updated });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      Admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Asset Manager': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Department Head': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      Employee: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[role] || colors.Employee;
  };

  const getStatusColor = (status) => {
    return status === 'Active' 
      ? 'bg-green-500/20 text-green-300 border-green-500/30'
      : 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'departments') {
      return departments.filter(d => 
        d.name.toLowerCase().includes(term) || 
        (d.head && d.head.toLowerCase().includes(term))
      );
    } else if (activeTab === 'categories') {
      return categories.filter(c => c.name.toLowerCase().includes(term));
    } else {
      return employees.filter(e => 
        e.name.toLowerCase().includes(term) || 
        e.email.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term)
      );
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F12] flex">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Organization Setup</h1>
            <p className="text-gray-400">Manage departments, asset categories, and employee roles</p>
          </div>

          {/* Tab Control with Add Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveTab('departments'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'departments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#17171C] text-gray-400 hover:text-white hover:bg-[#1F1F24]'
                }`}
              >
                <Building2 size={18} className="inline mr-2" />
                Departments
              </button>
              <button
                onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'categories'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#17171C] text-gray-400 hover:text-white hover:bg-[#1F1F24]'
                }`}
              >
                <Tag size={18} className="inline mr-2" />
                Categories
              </button>
              <button
                onClick={() => { setActiveTab('employees'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'employees'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#17171C] text-gray-400 hover:text-white hover:bg-[#1F1F24]'
                }`}
              >
                <Users size={18} className="inline mr-2" />
                Employees
              </button>
            </div>

            {activeTab !== 'employees' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                <Plus size={18} />
                Add
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#17171C] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg overflow-hidden">
            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <>
                {loading ? (
                  <div className="p-8 text-center text-gray-400">Loading departments...</div>
                ) : filteredData().length === 0 ? (
                  <div className="p-16 text-center">
                    <Building2 size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 mb-2">No departments yet</p>
                    <p className="text-gray-500 text-sm">Add your first department to get started</p>
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead className="bg-[#1F1F24] border-b border-[#2A2A32]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Head</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Parent Dept</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2A32]">
                        {filteredData().map((dept) => (
                          <tr key={dept.id} className="hover:bg-[#1F1F24] transition">
                            <td className="px-6 py-4 text-white font-medium">{dept.name}</td>
                            <td className="px-6 py-4 text-gray-300">{dept.head || '—'}</td>
                            <td className="px-6 py-4 text-gray-300">{dept.parent_department || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 text-xs rounded border ${getStatusColor(dept.status)}`}>
                                {dept.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => openEditModal(dept)}
                                className="p-2 hover:bg-[#2A2A32] rounded transition"
                              >
                                <Edit2 size={16} className="text-blue-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-6 py-4 bg-[#1A1A22] border-t border-[#2A2A32]">
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <AlertCircle size={16} />
                        Editing a department here also updates the dropdown lists on the Assets and Allocation screens.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <>
                {loading ? (
                  <div className="p-8 text-center text-gray-400">Loading categories...</div>
                ) : filteredData().length === 0 ? (
                  <div className="p-16 text-center">
                    <Tag size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 mb-2">No categories yet</p>
                    <p className="text-gray-500 text-sm">Add your first asset category to get started</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-[#1F1F24] border-b border-[#2A2A32]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Extra Fields</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A32]">
                      {filteredData().map((cat) => (
                        <tr key={cat.id} className="hover:bg-[#1F1F24] transition">
                          <td className="px-6 py-4 text-white font-medium">{cat.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {(cat.extra_fields || []).map((field, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                                  {typeof field === 'string' ? field : field.key}
                                </span>
                              ))}
                              {(!cat.extra_fields || cat.extra_fields.length === 0) && (
                                <span className="text-gray-500 text-sm">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 text-xs rounded border ${getStatusColor(cat.status)}`}>
                              {cat.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openEditModal(cat)}
                              className="p-2 hover:bg-[#2A2A32] rounded transition"
                            >
                              <Edit2 size={16} className="text-blue-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
              <>
                {loading ? (
                  <div className="p-8 text-center text-gray-400">Loading employees...</div>
                ) : filteredData().length === 0 ? (
                  <div className="p-16 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 mb-2">No employees yet</p>
                    <p className="text-gray-500 text-sm">Employees will appear here once they sign up</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-[#1F1F24] border-b border-[#2A2A32]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A32]">
                      {filteredData().map((emp) => (
                        <tr key={emp.id} className="hover:bg-[#1F1F24] transition">
                          <td className="px-6 py-4 text-white font-medium">{emp.name}</td>
                          <td className="px-6 py-4 text-gray-300">{emp.email}</td>
                          <td className="px-6 py-4 text-gray-300">{emp.department}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 text-xs rounded border ${getRoleBadgeColor(emp.role)}`}>
                              {emp.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 text-xs rounded border ${getStatusColor(emp.status)}`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <button
                                onClick={() => setShowRoleDropdown(showRoleDropdown === emp.id ? null : emp.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#2A2A32] hover:bg-[#3A3A42] text-gray-300 text-sm rounded transition"
                              >
                                Change Role
                                <ChevronDown size={14} />
                              </button>
                              
                              {showRoleDropdown === emp.id && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-lg z-10">
                                  <button
                                    onClick={() => handleRoleChange(emp.id, 'Department Head')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#1F1F24] transition first:rounded-t-lg"
                                  >
                                    Department Head
                                  </button>
                                  <button
                                    onClick={() => handleRoleChange(emp.id, 'Asset Manager')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#1F1F24] transition"
                                  >
                                    Asset Manager
                                  </button>
                                  <button
                                    onClick={() => handleRoleChange(emp.id, 'Employee')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#1F1F24] transition last:rounded-b-lg"
                                  >
                                    Employee
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal for Add/Edit Department or Category */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {modalMode === 'add' ? 'Add' : 'Edit'} {activeTab === 'departments' ? 'Department' : 'Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-[#2A2A32] rounded transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {activeTab === 'departments' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department Name</label>
                  <input
                    type="text"
                    required
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department Head</label>
                  <select
                    value={departmentForm.head}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, head: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select head</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Parent Department (Optional)</label>
                  <select
                    value={departmentForm.parent_department}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, parent_department: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {departments.filter(d => d.id !== selectedItem?.id).map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Active"
                        checked={departmentForm.status === 'Active'}
                        onChange={(e) => setDepartmentForm({ ...departmentForm, status: e.target.value })}
                        className="text-blue-600"
                      />
                      <span className="text-gray-300">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Inactive"
                        checked={departmentForm.status === 'Inactive'}
                        onChange={(e) => setDepartmentForm({ ...departmentForm, status: e.target.value })}
                        className="text-blue-600"
                      />
                      <span className="text-gray-300">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-transparent border border-[#2A2A32] hover:border-gray-400 text-gray-300 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    {modalMode === 'add' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category Name</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Extra Fields (JSON)</label>
                  <div className="space-y-2">
                    {categoryForm.extra_fields.map((field, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Field name"
                          value={typeof field === 'string' ? field : field.key}
                          onChange={(e) => updateExtraField(index, 'key', e.target.value)}
                          className="flex-1 px-4 py-2 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeExtraField(index)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addExtraField}
                      className="w-full py-2 border-2 border-dashed border-[#2A2A32] hover:border-blue-500 text-gray-400 hover:text-blue-400 rounded-lg transition text-sm"
                    >
                      + Add Field
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category-status"
                        value="Active"
                        checked={categoryForm.status === 'Active'}
                        onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                        className="text-blue-600"
                      />
                      <span className="text-gray-300">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category-status"
                        value="Inactive"
                        checked={categoryForm.status === 'Inactive'}
                        onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                        className="text-blue-600"
                      />
                      <span className="text-gray-300">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-transparent border border-[#2A2A32] hover:border-gray-400 text-gray-300 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    {modalMode === 'add' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSetup;

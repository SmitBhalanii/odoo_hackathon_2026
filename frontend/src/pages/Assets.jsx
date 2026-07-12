import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  QrCode,
  X,
  ChevronDown,
  Upload,
  Calendar as CalendarIcon
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { PageWrapper, ContentArea, TableSkeleton, EmptyStateNeutral } from '../components/SharedComponents';
import { getStatusColor, CARD_STYLES, BUTTON_STYLES, SPACING } from '../utils/constants';
import { getAssets, createAsset } from '../api/assets';
import { getCategories } from '../api/categories';
import { getDepartments } from '../api/departments';

const Assets = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  
  // Dropdown states
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(false);
  
  // Registration form
  const [showRegistrationPanel, setShowRegistrationPanel] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    category: '',
    serial_number: '',
    acquisition_date: '',
    acquisition_cost: '',
    condition: 'Good',
    location: '',
    photo: null,
    bookable: false,
    extra_field_values: {}
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  const assetStatuses = [
    { value: 'Available', color: getStatusColor('Available') },
    { value: 'Allocated', color: getStatusColor('Allocated') },
    { value: 'Reserved', color: getStatusColor('Reserved') },
    { value: 'Under Maintenance', color: getStatusColor('Under Maintenance') },
    { value: 'Lost', color: getStatusColor('Lost') },
    { value: 'Retired', color: getStatusColor('Retired') },
    { value: 'Disposed', color: getStatusColor('Disposed') }
  ];

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
    setLoading(true);
    try {
      // Fetch assets
      const assetsResponse = await getAssets();
      if (assetsResponse.data.data) setAssets(assetsResponse.data.data.items || []);

      // Fetch categories
      const categoriesResponse = await getCategories();
      if (categoriesResponse.data.data) setCategories(categoriesResponse.data.data.items || []);

      // Fetch departments
      const deptResponse = await getDepartments();
      if (deptResponse.data.data) setDepartments(deptResponse.data.data.items || []);

    } catch (error) {
      console.error('Failed to fetch assets:', error.response?.data?.detail || error.message);
      // Mock data for development
      setAssets([
        { id: 1, tag: 'AF-0001', name: 'MacBook Pro 16"', category: 'Laptops', status: 'Allocated', location: 'IT Dept - Floor 3', department: 'IT' },
        { id: 2, tag: 'AF-0114', name: 'Dell Latitude 5420', category: 'Laptops', status: 'Available', location: 'Asset Store', department: 'IT' },
        { id: 3, tag: 'AF-0042', name: 'Epson Projector', category: 'Electronics', status: 'Under Maintenance', location: 'Maintenance Room', department: 'Operations' },
        { id: 4, tag: 'AF-0089', name: 'Standing Desk', category: 'Furniture', status: 'Allocated', location: 'Operations - Desk 12', department: 'Operations' },
        { id: 5, tag: 'AF-0203', name: 'Conference Room A', category: 'Spaces', status: 'Reserved', location: 'Building A - 2nd Floor', department: 'HR' }
      ]);

      setCategories([
        { id: 1, name: 'Laptops', extra_fields: ['warranty_period', 'processor_type'], status: 'Active' },
        { id: 2, name: 'Furniture', extra_fields: ['material', 'dimensions'], status: 'Active' },
        { id: 3, name: 'Electronics', extra_fields: ['model_number'], status: 'Active' }
      ]);

      setDepartments([
        { id: 1, name: 'IT' },
        { id: 2, name: 'HR' },
        { id: 3, name: 'Finance' },
        { id: 4, name: 'Operations' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColorClass = (status) => {
    return getStatusColor(status);
  };

  const toggleCategoryFilter = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleStatusFilter = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleDepartmentFilter = (dept) => {
    setSelectedDepartments(prev =>
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const filteredAssets = () => {
    return assets.filter(asset => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        asset.tag.toLowerCase().includes(searchLower) ||
        asset.name.toLowerCase().includes(searchLower) ||
        asset.category.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(asset.category);

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 || 
        selectedStatuses.includes(asset.status);

      // Department filter
      const matchesDepartment = selectedDepartments.length === 0 || 
        selectedDepartments.includes(asset.department);

      return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRegistrationForm({ ...registrationForm, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      Object.keys(registrationForm).forEach(key => {
        if (key === 'extra_field_values') {
          formData.append(key, JSON.stringify(registrationForm[key]));
        } else if (key === 'photo' && registrationForm[key]) {
          formData.append(key, registrationForm[key]);
        } else {
          formData.append(key, registrationForm[key]);
        }
      });

      const response = await createAsset(formData);
      
      if (response.data) {
        alert('Asset registered successfully!');
        setShowRegistrationPanel(false);
        resetRegistrationForm();
        fetchData();
      }
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.detail || error.message);
      alert(error.response?.data?.detail || 'Asset registration failed');
    }
  };

  const resetRegistrationForm = () => {
    setRegistrationForm({
      name: '',
      category: '',
      serial_number: '',
      acquisition_date: '',
      acquisition_cost: '',
      condition: 'Good',
      location: '',
      photo: null,
      bookable: false,
      extra_field_values: {}
    });
    setPhotoPreview(null);
  };

  const selectedCategory = categories.find(c => c.name === registrationForm.category);

  if (!user) return null;

  return (
    <PageWrapper>
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <ContentArea 
          title="Asset Directory"
          description="View and manage all organizational assets"
          actions={
            <button
              onClick={() => setShowRegistrationPanel(true)}
              className={`flex items-center gap-2 px-${SPACING.sm} py-2.5 ${BUTTON_STYLES.primary}`}
            >
              <Plus size={20} />
              Register Asset
            </button>
          }
        >

          {/* Search Bar */}
          <div className={`mb-${SPACING.sm}`}>
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tag, serial, or QR code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#17171C] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className={`flex gap-3 mb-${SPACING.sm}`}>
            {/* Category Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCategoryFilter(!showCategoryFilter);
                  setShowStatusFilter(false);
                  setShowDepartmentFilter(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                  selectedCategories.length > 0
                    ? getStatusColor('Medium')
                    : 'bg-[#17171C] border-[#2A2A32] text-gray-400 hover:text-white'
                }`}
              >
                Category
                {selectedCategories.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
                <ChevronDown size={16} />
              </button>

              {showCategoryFilter && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1F1F24] cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => toggleCategoryFilter(cat.name)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-300">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusFilter(!showStatusFilter);
                  setShowCategoryFilter(false);
                  setShowDepartmentFilter(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                  selectedStatuses.length > 0
                    ? getStatusColor('Medium')
                    : 'bg-[#17171C] border-[#2A2A32] text-gray-400 hover:text-white'
                }`}
              >
                Status
                {selectedStatuses.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {selectedStatuses.length}
                  </span>
                )}
                <ChevronDown size={16} />
              </button>

              {showStatusFilter && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {assetStatuses.map((status) => (
                    <label key={status.value} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1F1F24] cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => toggleStatusFilter(status.value)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className={`inline-block px-2 py-1 text-xs rounded border ${status.color}`}>
                        {status.value}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Department Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDepartmentFilter(!showDepartmentFilter);
                  setShowCategoryFilter(false);
                  setShowStatusFilter(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                  selectedDepartments.length > 0
                    ? getStatusColor('Medium')
                    : 'bg-[#17171C] border-[#2A2A32] text-gray-400 hover:text-white'
                }`}
              >
                Department
                {selectedDepartments.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {selectedDepartments.length}
                  </span>
                )}
                <ChevronDown size={16} />
              </button>

              {showDepartmentFilter && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {departments.map((dept) => (
                    <label key={dept.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1F1F24] cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept.name)}
                        onChange={() => toggleDepartmentFilter(dept.name)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-300">{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading assets...</div>
            ) : filteredAssets().length === 0 ? (
              <div className="p-16 text-center">
                <QrCode size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-2">No assets found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or register a new asset</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#1F1F24] border-b border-[#2A2A32]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tag</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A32]">
                  {filteredAssets().map((asset) => (
                    <tr 
                      key={asset.id} 
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      className="hover:bg-[#1F1F24] cursor-pointer transition"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <QrCode size={16} className="text-gray-400" />
                          {asset.tag}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{asset.name}</td>
                      <td className="px-6 py-4 text-gray-300">{asset.category}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded border ${getStatusColorClass(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{asset.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ContentArea>
      </main>

      {/* Registration Slide-Over Panel */}
      {showRegistrationPanel && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setShowRegistrationPanel(false)}></div>
          
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-[#17171C] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-[#17171C] border-b border-[#2A2A32] px-8 py-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-white">Register Asset</h2>
              <button
                onClick={() => setShowRegistrationPanel(false)}
                className="p-2 hover:bg-[#2A2A32] rounded transition"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitRegistration} className="p-8 space-y-6">
              {/* Asset Tag Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Asset Tag</label>
                <input
                  type="text"
                  disabled
                  value="Auto-generated on save (e.g. AF-0203)"
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MacBook Pro 16-inch"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                <select
                  required
                  value={registrationForm.category}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, category: e.target.value, extra_field_values: {} })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Extra Fields */}
              {selectedCategory && selectedCategory.extra_fields && selectedCategory.extra_fields.length > 0 && (
                <div className="p-4 bg-[#0F0F12] border border-[#2A2A32] rounded-lg space-y-4">
                  <p className="text-sm font-medium text-gray-400">Category-Specific Fields</p>
                  {selectedCategory.extra_fields.map((field) => {
                    const fieldKey = typeof field === 'string' ? field : field.key;
                    return (
                      <div key={fieldKey}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <input
                          type="text"
                          value={registrationForm.extra_field_values[fieldKey] || ''}
                          onChange={(e) => setRegistrationForm({
                            ...registrationForm,
                            extra_field_values: {
                              ...registrationForm.extra_field_values,
                              [fieldKey]: e.target.value
                            }
                          })}
                          className="w-full px-4 py-2.5 bg-[#17171C] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Serial Number</label>
                <input
                  type="text"
                  value={registrationForm.serial_number}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, serial_number: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., SN123456789"
                />
              </div>

              {/* Acquisition Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Acquisition Date *</label>
                <div className="relative">
                  <CalendarIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={registrationForm.acquisition_date}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, acquisition_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Acquisition Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Acquisition Cost *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={registrationForm.acquisition_cost}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, acquisition_cost: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Condition *</label>
                <select
                  required
                  value={registrationForm.condition}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, condition: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                <input
                  type="text"
                  required
                  value={registrationForm.location}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Building A - Floor 3"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Photo</label>
                <div className="border-2 border-dashed border-[#2A2A32] rounded-lg p-6 text-center hover:border-blue-500 transition">
                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setRegistrationForm({ ...registrationForm, photo: null });
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-400 text-sm mb-1">Drag and drop or click to upload</p>
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

              {/* Bookable Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#0F0F12] border border-[#2A2A32] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-300">Bookable Resource</p>
                  <p className="text-xs text-gray-500 mt-1">Allow this asset to be reserved/booked</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={registrationForm.bookable}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, bookable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-6"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegistrationPanel(false)}
                  className="flex-1 py-3 bg-transparent border-2 border-[#2A2A32] hover:border-gray-400 text-gray-300 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Assets;

// Shared constants for visual consistency across all pages

// Spacing scale (only use these values)
export const SPACING = {
  xs: '4', // 1rem
  sm: '6', // 1.5rem 
  md: '8', // 2rem
  lg: '12', // 3rem
  xl: '16', // 4rem
};

// Status colors (consistent across all components)
export const STATUS_COLORS = {
  // Asset statuses
  'Available': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Allocated': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Reserved': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Under Maintenance': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Lost': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Retired': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Disposed': 'bg-gray-700/20 text-gray-400 border-gray-700/30',
  
  // Maintenance request statuses
  'pending': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'approved': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'technician_assigned': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'in_progress': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'resolved': 'bg-green-500/20 text-green-300 border-green-500/30',
  
  // Booking statuses
  'upcoming': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'ongoing': 'bg-green-500/20 text-green-300 border-green-500/30',
  'completed': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'cancelled': 'bg-red-500/20 text-red-300 border-red-500/30',
  
  // Verification statuses
  'verified': 'bg-green-500/20 text-green-300 border-green-500/30',
  'missing': 'bg-red-500/20 text-red-300 border-red-500/30',
  'damaged': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  
  // Priority levels
  'Low': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Medium': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'High': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Critical': 'bg-red-500/20 text-red-300 border-red-500/30'
};

// Card styles (consistent shadows and radius)
export const CARD_STYLES = {
  base: 'bg-[#17171C] border border-[#2A2A32] rounded-lg',
  hover: 'hover:border-[#3A3A42] transition-colors duration-200',
  shadow: 'shadow-lg shadow-black/10',
  modal: 'bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-2xl'
};

// Button hierarchy
export const BUTTON_STYLES = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200',
  secondary: 'bg-transparent border-2 border-[#2A2A32] hover:border-blue-500 text-gray-300 hover:text-white font-medium rounded-lg transition-colors duration-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200',
  ghost: 'bg-transparent hover:bg-[#1F1F24] text-gray-400 hover:text-white rounded-lg transition-colors duration-200'
};

// Layout constants
export const LAYOUT = {
  sidebarWidth: 'w-[260px]',
  contentPadding: 'p-8',
  headerHeight: 'h-16',
  borderColor: 'border-[#2A2A32]',
  backgroundColor: 'bg-[#0F0F12]',
  cardBackground: 'bg-[#17171C]'
};

// Animation classes
export const ANIMATIONS = {
  fadeIn: 'animate-fadeIn',
  slideUp: 'animate-slideUp',
  slideDown: 'animate-slideDown',
  scaleIn: 'animate-scaleIn',
  pulse: 'animate-pulse',
  spin: 'animate-spin'
};

// Helper function to get status color
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS['Available'];
};

// Helper function to get priority color  
export const getPriorityColor = (priority) => {
  return STATUS_COLORS[priority] || STATUS_COLORS['Medium'];
};
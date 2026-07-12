// Mock API responses for development when backend is not ready
// This can be used as a fallback or for testing

export const mockKpiData = {
  data: {
    assetsAvailable: 142,
    assetsAllocated: 87,
    maintenanceToday: 5,
    activeBookings: 12,
    pendingTransfers: 3,
    upcomingReturns: 8,
    overdueReturns: 2
  },
  error: null
};

export const mockRecentActivity = {
  data: {
    items: [
      {
        action: 'allocated',
        description: 'Laptop AF-0114 allocated to Priya Shah — IT dept',
        timestamp: new Date(Date.now() - 2 * 60000).toISOString() // 2 minutes ago
      },
      {
        action: 'booking',
        description: 'Conference Room A booked by Marketing team for 2:00 PM - 4:00 PM',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString() // 15 minutes ago
      },
      {
        action: 'maintenance',
        description: 'Maintenance request approved for Projector PJ-0042',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString() // 45 minutes ago
      },
      {
        action: 'transfer',
        description: 'Transfer request submitted: Dell Monitor from IT to Finance',
        timestamp: new Date(Date.now() - 90 * 60000).toISOString() // 1.5 hours ago
      },
      {
        action: 'audit',
        description: 'Audit cycle completed for Operations department - 98% accuracy',
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString() // 3 hours ago
      },
      {
        action: 'allocated',
        description: 'Standing Desk SD-0089 allocated to John Doe — Operations',
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString() // 5 hours ago
      }
    ],
    total: 6
  },
  error: null
};

export const mockNotificationCount = {
  data: {
    count: 3
  },
  error: null
};

// Helper to simulate API delay
export const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

// Mock fetch wrapper that can be used for development
export const mockFetch = async (url) => {
  await delay(800); // Simulate network delay

  if (url.includes('/dashboard/kpi')) {
    return { json: async () => mockKpiData };
  }
  
  if (url.includes('/dashboard/recent-activity')) {
    return { json: async () => mockRecentActivity };
  }
  
  if (url.includes('/notifications/unread-count')) {
    return { json: async () => mockNotificationCount };
  }

  // Default response
  return {
    json: async () => ({
      data: null,
      error: { message: 'Not found', code: 'NOT_FOUND' }
    })
  };
};

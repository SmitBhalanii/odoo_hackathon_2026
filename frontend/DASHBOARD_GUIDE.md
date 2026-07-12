# Dashboard Guide

## Overview
The AssetFlow Dashboard provides a comprehensive view of the asset management system with real-time KPIs, recent activity, and quick actions.

## Features

### 1. Persistent Sidebar Navigation
- **Width**: 260px
- **Logo**: AssetFlow branding at the top
- **Navigation Items**:
  - Dashboard
  - Organization Setup (Admin only)
  - Assets
  - Allocation & Transfer
  - Resource Booking
  - Maintenance
  - Audit
  - Reports
  - Notifications
- **User Profile**: Displayed at bottom with logout option
- **Active Route Highlighting**: Current page highlighted with blue pill background

### 2. Top Bar
- **User Avatar**: Shows user initials in circular avatar
- **Role Badge**: Color-coded role indicator
  - Admin: Purple
  - Asset Manager: Blue
  - Department Head: Green
  - Employee: Gray
- **Notification Bell**: Shows unread count badge

### 3. KPI Cards (6 Cards)
- **Assets Available**: Total assets ready for allocation
- **Assets Allocated**: Currently allocated assets
- **Maintenance Today**: Maintenance scheduled for today
- **Active Bookings**: Current active resource bookings
- **Pending Transfers**: Transfer requests awaiting approval
- **Upcoming Returns**: Assets due for return soon

Each card includes:
- Uppercase gray label
- Large bold number
- Icon in themed circle

### 4. Overdue Alert Banner
- Only visible when `overdueCount > 0`
- Red/amber gradient background
- Warning icon
- Clickable - navigates to filtered allocation view
- Shows count of overdue assets

### 5. Quick Action Buttons
- **Register Asset**: Primary button (solid blue)
- **Book Resource**: Secondary button (outline)
- **Raise Maintenance Request**: Secondary button (outline)

### 6. Recent Activity Feed
- Shows last 6 activity entries
- Each entry includes:
  - Action-specific icon
  - Description text
  - Relative timestamp (e.g., "2m ago", "3h ago", "5d ago")
- Real-time updates from activity log

## API Endpoints

The dashboard fetches data from these endpoints:

```
GET /api/dashboard/kpi
Response: {
  data: {
    assetsAvailable: number,
    assetsAllocated: number,
    maintenanceToday: number,
    activeBookings: number,
    pendingTransfers: number,
    upcomingReturns: number,
    overdueReturns: number
  },
  error: null
}

GET /api/dashboard/recent-activity?limit=6
Response: {
  data: {
    items: [
      {
        action: string, // 'allocated', 'transfer', 'maintenance', 'booking', 'audit'
        description: string,
        timestamp: string (ISO 8601)
      }
    ],
    total: number
  },
  error: null
}

GET /api/notifications/unread-count
Response: {
  data: {
    count: number
  },
  error: null
}
```

## Development Mode

When the backend is not available, the dashboard automatically falls back to mock data from `utils/mockApi.js`. This allows frontend development to continue independently.

## Role-Based Access

- **Admin**: Sees all navigation items including "Organization Setup"
- **Asset Manager**: Sees all except "Organization Setup"
- **Department Head**: Sees all except "Organization Setup"
- **Employee**: Sees all except "Organization Setup"

## Responsive Design

- **Desktop (lg)**: 3-column KPI grid
- **Tablet (md)**: 2-column KPI grid
- **Mobile**: Single column layout
- Sidebar remains visible on desktop, can be made collapsible for mobile

## Loading States

- **Skeleton Loading**: Shows animated placeholders for KPI cards while data loads
- **Activity Feed**: Shows skeleton items during data fetch
- Smooth transitions when data loads

## Navigation

All navigation items are clickable and route to their respective pages:
- Dashboard: `/dashboard`
- Organization: `/organization`
- Assets: `/assets`
- Allocation: `/allocation`
- Booking: `/booking`
- Maintenance: `/maintenance`
- Audit: `/audit`
- Reports: `/reports`
- Notifications: `/notifications`

Quick action buttons route to:
- Register Asset: `/assets/register`
- Book Resource: `/booking/new`
- Raise Maintenance: `/maintenance/new`

## Color Scheme

Consistent with the design system:
- Background: `#0F0F12`
- Card: `#17171C`
- Border: `#2A2A32`
- Primary Blue: `#3B82F6`
- Text: White/Gray scale

## Icons

All icons from `lucide-react` library for consistency.

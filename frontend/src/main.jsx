import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OrgSetup from './pages/OrgSetup'
import PlaceholderPage from './pages/PlaceholderPage'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/organization" element={<OrgSetup />} />
        <Route path="/assets" element={<PlaceholderPage title="Assets" description="View and manage all assets." />} />
        <Route path="/assets/register" element={<PlaceholderPage title="Register Asset" description="Add a new asset to the system." />} />
        <Route path="/allocation" element={<PlaceholderPage title="Allocation & Transfer" description="Manage asset allocations and transfer requests." />} />
        <Route path="/booking" element={<PlaceholderPage title="Resource Booking" description="Book shared resources." />} />
        <Route path="/booking/new" element={<PlaceholderPage title="New Booking" description="Create a new resource booking." />} />
        <Route path="/maintenance" element={<PlaceholderPage title="Maintenance" description="View and manage maintenance requests." />} />
        <Route path="/maintenance/new" element={<PlaceholderPage title="New Maintenance Request" description="Submit a maintenance request." />} />
        <Route path="/audit" element={<PlaceholderPage title="Audit" description="Manage audit cycles." />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" description="View system reports and analytics." />} />
        <Route path="/notifications" element={<PlaceholderPage title="Notifications" description="View all notifications." />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

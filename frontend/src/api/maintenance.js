import apiClient from './client';

export const getMaintenanceRequests = (params = {}) =>
  apiClient.get('/maintenance-requests', { params });

export const getMaintenanceRequest = (id) =>
  apiClient.get(`/maintenance-requests/${id}`);

export const createMaintenanceRequest = (data) =>
  apiClient.post('/maintenance-requests', data);

// Alias
export const createMaintenance = createMaintenanceRequest;

export const approveMaintenanceRequest = (id) =>
  apiClient.post(`/maintenance-requests/${id}/approve`);

// Alias
export const approveMaintenance = approveMaintenanceRequest;

export const rejectMaintenanceRequest = (id, rejection_reason = null) =>
  apiClient.post(`/maintenance-requests/${id}/reject`, { rejection_reason });

// Alias
export const rejectMaintenance = rejectMaintenanceRequest;

export const assignTechnician = (id, technician_name) =>
  apiClient.post(`/maintenance-requests/${id}/assign-technician`, { technician_name });

export const startMaintenance = (id) =>
  apiClient.post(`/maintenance-requests/${id}/start`);

export const resolveMaintenance = (id, resolution_notes = null, cost = null) =>
  apiClient.post(`/maintenance-requests/${id}/resolve`, { resolution_notes, cost });

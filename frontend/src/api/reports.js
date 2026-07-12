import apiClient from './client';

export const getUtilizationByDepartment = (params = {}) =>
  apiClient.get('/analytics/utilization-by-department', { params });

export const getMaintenanceFrequency = (params = {}) =>
  apiClient.get('/analytics/maintenance-frequency', { params });

export const getMostUsedAssets = (params = {}) =>
  apiClient.get('/analytics/most-used-assets', { params });

export const getIdleAssets = (params = {}) =>
  apiClient.get('/analytics/idle-assets', { params });

export const getUpcomingMaintenanceRetirement = (params = {}) =>
  apiClient.get('/analytics/upcoming-maintenance-retirement', { params });

export const getDepartmentAllocationSummary = (params = {}) =>
  apiClient.get('/analytics/department-allocation-summary', { params });

export const getBookingHeatmap = (params = {}) =>
  apiClient.get('/analytics/booking-heatmap', { params });

export const exportReport = (type, format = 'csv', params = {}) =>
  apiClient.get('/analytics/export', {
    params: { type, format, ...params },
    responseType: 'blob'
  });

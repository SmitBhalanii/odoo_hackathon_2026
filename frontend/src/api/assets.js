import apiClient from './client';

export const getAssets = (params = {}) =>
  apiClient.get('/assets', { params });

export const getAsset = (id) =>
  apiClient.get(`/assets/${id}`);

// Alias for convenience
export const getAssetById = getAsset;

export const createAsset = (data) =>
  apiClient.post('/assets', data);

export const updateAsset = (id, data) =>
  apiClient.put(`/assets/${id}`, data);

export const getAvailableAssets = (params = {}) =>
  apiClient.get('/assets/available', { params });

export const transitionAssetStatus = (id, new_status, notes = null) =>
  apiClient.post(`/assets/${id}/transition-status`, { new_status, notes });

// Alias for convenience
export const transitionStatus = transitionAssetStatus;

export const getValidTransitions = (id) =>
  apiClient.get(`/assets/${id}/valid-transitions`);

export const getAllocationHistory = (id) =>
  apiClient.get(`/assets/${id}/allocation-history`);

export const getMaintenanceHistory = (id) =>
  apiClient.get(`/assets/${id}/maintenance-history`);

// Alias for convenience
export const getAssetHistory = (id) => 
  Promise.all([getAllocationHistory(id), getMaintenanceHistory(id)]);

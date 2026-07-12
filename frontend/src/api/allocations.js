import apiClient from './client';

export const getAllocations = (params = {}) =>
  apiClient.get('/allocations', { params });

export const createAllocation = (data) =>
  apiClient.post('/allocations', data);

export const updateAllocation = (id, data) =>
  apiClient.put(`/allocations/${id}`, data);

export const returnAllocation = (id, data) =>
  apiClient.post(`/allocations/${id}/return`, data);

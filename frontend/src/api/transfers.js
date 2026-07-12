import apiClient from './client';

export const getTransfers = (params = {}) =>
  apiClient.get('/transfers', { params });

export const getPendingTransfers = (params = {}) =>
  apiClient.get('/transfers/pending', { params });

export const createTransfer = (data) =>
  apiClient.post('/transfers', data);

export const approveTransfer = (id) =>
  apiClient.post(`/transfers/${id}/approve`);

export const rejectTransfer = (id, reason = null) =>
  apiClient.post(`/transfers/${id}/reject`, { reason });

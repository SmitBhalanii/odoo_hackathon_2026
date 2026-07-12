import apiClient from './client';

export const getAuditCycles = (params = {}) =>
  apiClient.get('/audit-cycles', { params });

export const getAuditCycle = (id) =>
  apiClient.get(`/audit-cycles/${id}`);

export const createAuditCycle = (data) =>
  apiClient.post('/audit-cycles', data);

export const markAuditResult = (resultId, result, notes = null) =>
  apiClient.patch(`/audit-cycles/results/${resultId}`, { result, notes });

export const getAuditDiscrepancies = (id) =>
  apiClient.get(`/audit-cycles/${id}/discrepancies`);

export const closeAuditCycle = (id) =>
  apiClient.post(`/audit-cycles/${id}/close`);

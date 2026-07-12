import apiClient from './client';

export const getEmployees = () =>
  apiClient.get('/employees');

export const updateEmployeeRole = (id, role) =>
  apiClient.patch(`/employees/${id}/role`, { role });

export const updateEmployeeStatus = (id, status) =>
  apiClient.patch(`/employees/${id}/status`, { status });

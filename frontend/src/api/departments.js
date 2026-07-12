import apiClient from './client';

export const getDepartments = () =>
  apiClient.get('/departments');

export const createDepartment = (data) =>
  apiClient.post('/departments', data);

export const updateDepartment = (id, data) =>
  apiClient.put(`/departments/${id}`, data);

export const updateDepartmentStatus = (id, status) =>
  apiClient.patch(`/departments/${id}/status`, { status });

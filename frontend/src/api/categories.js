import apiClient from './client';

export const getCategories = () =>
  apiClient.get('/asset-categories');

export const createCategory = (data) =>
  apiClient.post('/asset-categories', data);

export const updateCategory = (id, data) =>
  apiClient.put(`/asset-categories/${id}`, data);

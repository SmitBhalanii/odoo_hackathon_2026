import apiClient from './client';

export const checkHealth = () =>
  apiClient.get('/health');

export const checkRoot = () =>
  apiClient.get('/');

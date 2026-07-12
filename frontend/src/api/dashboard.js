import apiClient from './client';

export const getDashboardKPI = () =>
  apiClient.get('/dashboard/kpi');

// Alias
export const getKPI = getDashboardKPI;

export const getRecentActivity = (limit = 10) =>
  apiClient.get('/dashboard/recent-activity', { params: { limit } });

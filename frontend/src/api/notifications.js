import apiClient from './client';

export const getNotifications = (params = {}) =>
  apiClient.get('/notifications', { params });

export const markNotificationRead = (id) =>
  apiClient.patch(`/notifications/${id}/read`);

// Alias for convenience
export const markAsRead = markNotificationRead;

export const markAllNotificationsRead = () =>
  apiClient.patch('/notifications/read-all');

// Alias for convenience
export const markAllAsRead = markAllNotificationsRead;

export const getUnreadCount = () =>
  apiClient.get('/notifications/unread-count');

export const getActivityLog = (params = {}) =>
  apiClient.get('/notifications/activity-log', { params });

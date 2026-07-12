import apiClient from './client';

export const getBookings = (params = {}) =>
  apiClient.get('/bookings', { params });

export const getBooking = (id) =>
  apiClient.get(`/bookings/${id}`);

export const createBooking = (data) =>
  apiClient.post('/bookings', data);

export const updateBooking = (id, data) =>
  apiClient.put(`/bookings/${id}`, data);

export const confirmBooking = (id) =>
  apiClient.post(`/bookings/${id}/confirm`);

export const cancelBooking = (id) =>
  apiClient.post(`/bookings/${id}/cancel`);

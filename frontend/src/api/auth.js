import apiClient from './client';

export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password });

export const signup = (name, email, password, department_id = null) =>
  apiClient.post('/auth/signup', { name, email, password, department_id });

export const forgotPassword = (email) =>
  apiClient.post('/auth/forgot-password', { email });

export const resetPassword = (token, new_password) =>
  apiClient.post('/auth/reset-password', { token, new_password });

export const getMe = () =>
  apiClient.get('/auth/me');

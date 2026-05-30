import axios from 'axios';

const API_URL = 'https://31.97.228.243.nip.io/api';

console.log('🌐 API URL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ ALL API EXPORTS ============

// ----- AUTH -----
export const loginAPI = (email, password) => 
  axiosInstance.post('/auth/login', { email, password });

export const getMeAPI = () => 
  axiosInstance.get('/auth/me');

export const changePasswordAPI = (currentPassword, newPassword) => 
  axiosInstance.put('/auth/change-password', { currentPassword, newPassword });

export const resetPasswordAPI = (userId, newPassword) => 
  axiosInstance.put(`/auth/reset-password/${userId}`, { newPassword });

// ----- USERS -----
export const getUsersAPI = (params) => 
  axiosInstance.get('/users', { params });

export const createUserAPI = (userData) => 
  axiosInstance.post('/users', userData);

export const updateUserAPI = (userId, userData) => 
  axiosInstance.put(`/users/${userId}`, userData);

export const deleteUserAPI = (userId) => 
  axiosInstance.delete(`/users/${userId}`);

export const getUsersByLocationAPI = (location) => 
  axiosInstance.get(`/users/location/${location}`);

// ----- ENTRIES -----
export const createEntryAPI = (entryData) => 
  axiosInstance.post('/entries', entryData);

export const getEntriesAPI = (params) => 
  axiosInstance.get('/entries', { params });

export const getEntryAPI = (entryId) => 
  axiosInstance.get(`/entries/${entryId}`);

export const updateEntryAPI = (entryId, entryData) => 
  axiosInstance.put(`/entries/${entryId}`, entryData);

export const addNoteAPI = (entryId, text) => 
  axiosInstance.post(`/entries/${entryId}/notes`, { text });

export const convertToTaskAPI = (entryId, taskData) => 
  axiosInstance.post(`/entries/${entryId}/convert-to-task`, taskData);

export const getEntryStatsAPI = () => 
  axiosInstance.get('/entries/stats/dashboard');

// ----- TASKS -----
export const getTasksAPI = (params) => 
  axiosInstance.get('/tasks', { params });

export const getTaskAPI = (taskId) => 
  axiosInstance.get(`/tasks/${taskId}`);

export const createTaskAPI = (taskData) => 
  axiosInstance.post('/tasks', taskData);

export const updateTaskStatusAPI = (taskId, status, progress, note) => 
  axiosInstance.put(`/tasks/${taskId}/status`, { status, progress, note });

export const updateTaskAPI = (taskId, taskData) => 
  axiosInstance.put(`/tasks/${taskId}`, taskData);

export const getMyTasksAPI = (params) => 
  axiosInstance.get('/tasks/my-tasks', { params });

export const getTaskStatsAPI = () => 
  axiosInstance.get('/tasks/stats/dashboard');

export const getTasksAssignedByMeAPI = (params) =>
  axiosInstance.get('/tasks/assigned-by-me', { params });

// Add this to your axios.js file
export const retryNotificationsAPI = (taskId) => {
  return axiosInstance.post(`/tasks/${taskId}/retry-notifications`);
};


/* =========================
   FOLLOW UPS
========================= */

export const sendFollowUpAPI = (data) =>
  axiosInstance.post('/followups/send', data);

export const getFollowUpHistoryAPI = (params) =>
  axiosInstance.get('/followups/history', { params });

export const getClientHistoryAPI = (entryId) =>
  axiosInstance.get(`/followups/client/${entryId}`);

export const getFollowUpStatsAPI = () =>
  axiosInstance.get('/followups/stats');

export const retryFollowUpAPI = (id) =>
  axiosInstance.post(`/followups/retry/${id}`);

/* =========================
   TEMPLATES
========================= */

export const getTemplatesAPI = () =>
  axiosInstance.get('/followups/templates');

export const createTemplateAPI = (data) =>
  axiosInstance.post('/followups/templates', data);

export const updateTemplateAPI = (id, data) =>
  axiosInstance.put(`/followups/templates/${id}`, data);

export const deleteTemplateAPI = (id) =>
  axiosInstance.delete(`/followups/templates/${id}`);


export default axiosInstance;
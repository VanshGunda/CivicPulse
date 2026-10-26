import api from './client';

const params = (values = {}) => Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const authApi = {
  me: () => api.get('/api/auth/me').then((r) => r.data),
};

export const issueApi = {
  list: (query = {}) => api.get('/api/issues', { params: params(query) }).then((r) => r.data),
  mine: (query = {}) => api.get('/api/issues/mine', { params: params(query) }).then((r) => r.data),
  assigned: (query = {}) => api.get('/api/issues/assigned', { params: params(query) }).then((r) => r.data),
  get: (id) => api.get(`/api/issues/${id}`).then((r) => r.data),
  create: (payload) => api.post('/api/issues', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/api/issues/${id}`, payload).then((r) => r.data),
  updateStatus: (id, payload) => api.patch(`/api/issues/${id}/status`, payload).then((r) => r.data),
  updatePriority: (id, payload) => api.patch(`/api/issues/${id}/priority`, payload).then((r) => r.data),
  assign: (id, payload) => api.patch(`/api/issues/${id}/assignment`, payload).then((r) => r.data),
  history: (id) => api.get(`/api/issues/${id}/history`).then((r) => r.data),
  comments: (id) => api.get(`/api/issues/${id}/comments`).then((r) => r.data),
  addComment: (id, payload) => api.post(`/api/issues/${id}/comments`, payload).then((r) => r.data),
  support: (id) => api.post(`/api/issues/${id}/support`).then((r) => r.data),
  removeSupport: (id) => api.delete(`/api/issues/${id}/support`).then((r) => r.data),
  duplicateCheck: (query) => api.get('/api/issues/duplicate-check', { params: params(query) }).then((r) => r.data),
};

export const departmentApi = {
  list: () => api.get('/api/departments').then((r) => r.data),
  listAll: () => api.get('/api/departments/admin/all').then((r) => r.data),
  create: (payload) => api.post('/api/departments', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/api/departments/${id}`, payload).then((r) => r.data),
  deactivate: (id) => api.delete(`/api/departments/${id}`).then((r) => r.data),
};

export const dashboardApi = {
  summary: () => api.get('/api/dashboard/summary').then((r) => r.data),
};

export const notificationApi = {
  list: (query = {}) => api.get('/api/notifications', { params: params(query) }).then((r) => r.data),
  unreadCount: () => api.get('/api/notifications/unread-count').then((r) => r.data),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`).then((r) => r.data),
};

export const adminApi = {
  users: (query = {}) => api.get('/api/admin/users', { params: params(query) }).then((r) => r.data),
  updateRole: (id, role) => api.patch(`/api/admin/users/${id}/role`, { role }).then((r) => r.data),
  updateEnabled: (id, enabled) => api.patch(`/api/admin/users/${id}/enabled`, { enabled }).then((r) => r.data),
};

export const uploadApi = {
  image: (file, onUploadProgress) => {
    const data = new FormData();
    data.append('file', file);
    return api.post('/api/uploads/images', data, {
      onUploadProgress,
    }).then((r) => r.data);
  },
};

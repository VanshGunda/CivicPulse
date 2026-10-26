import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, ''),
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('civicpulse.accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !String(error?.config?.url || '').includes('/api/auth/')) {
      window.dispatchEvent(new CustomEvent('civicpulse:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.detail) return data.detail;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat().find(Boolean);
    if (first) return String(first);
  }
  if (error?.code === 'ECONNABORTED') return 'The request took too long. Check your connection and try again.';
  if (!error?.response) return 'Cannot reach the CivicPulse API. Make sure the Spring Boot server is running on port 8080.';
  if (error.response.status === 401) return 'Your session has expired. Please sign in again.';
  if (error.response.status === 403) return 'You do not have permission to perform this action.';
  return fallback;
}

export default api;

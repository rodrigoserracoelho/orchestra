import axios from 'axios';

// In production BASE_URL is "/orchestra/", in dev it's "/"
const basePath = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g. "" or "/orchestra"
const API_BASE = import.meta.env.VITE_API_URL || `${basePath}/api`;

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = `${basePath}/login`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;

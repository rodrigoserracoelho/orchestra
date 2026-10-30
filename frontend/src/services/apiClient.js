import axios from 'axios';
import { getItem, removeItem } from './storage';

// In production BASE_URL is "/orchestra/", in dev it's "/"
const basePath = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g. "" or "/orchestra"
const API_BASE = import.meta.env.VITE_API_URL || `${basePath}/api`;

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Endpoints where a 401 means "that code was wrong", not "your session expired".
// Redirecting on these reloads the login page mid-attempt: the inline error
// never renders, the code step and the typed email are lost, and the user sees
// a blank flash followed by a fresh form with no explanation.
const LOGIN_ATTEMPT_PATHS = ['/auth/request-code', '/auth/verify-code'];

// Handle 401 responses — an expired or revoked session sends the user to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isLoginAttempt = LOGIN_ATTEMPT_PATHS.some((p) => url.includes(p));
    if (error.response?.status === 401 && !isLoginAttempt) {
      removeItem('token');
      removeItem('user');
      window.location.href = `${basePath}/login`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;

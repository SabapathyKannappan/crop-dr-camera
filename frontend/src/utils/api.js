// API utility with authentication
import axios from 'axios';
import { authService } from './auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with auth interceptor
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 90000,
});

// Add auth header to all requests
apiClient.interceptors.request.use(
  (config) => {
    const authHeaders = authService.getAuthHeaders();
    config.headers = {
      ...config.headers,
      ...authHeaders,
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (redirect to signin)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to signin
      authService.clearAuthCode();
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

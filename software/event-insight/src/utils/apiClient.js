/**
 * Centralized Axios client with auth interceptors
 * Handles token management, 401 responses, and error logging
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 10000,
});

/**
 * Request interceptor: Add auth token to headers if available
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle auth failures and log errors
 * On 401: Emit logout event for AuthContext to handle
 * AuthContext will clear state and perform immediate navigation
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized (401) - emitting logout event');
      // Emit custom event; AuthContext listens and handles logout + navigation
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } else if (error.response) {
      // Server responded with error status (4xx, 5xx)
      console.error(`[API] HTTP ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // Request made but no response (network error)
      console.error('[API] No response from server:', error.request);
    } else {
      // Other errors
      console.error('[API] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;


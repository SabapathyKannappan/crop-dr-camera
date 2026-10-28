// Authentication utility functions with complete state clearing

const AUTH_STORAGE_KEY = 'plant_doctor_auth_code';
const CACHE_KEYS_PREFIX = 'plant_doctor_';

export const authService = {
  // Get stored auth code
  getAuthCode: () => {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  },

  // Store auth code
  setAuthCode: (code) => {
    localStorage.setItem(AUTH_STORAGE_KEY, code);
  },

  // Complete sign out - clear ALL data
  clearAuthCode: () => {
    // Clear auth code
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    // Clear all cached data with our prefix
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEYS_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear any cached variables in memory
    if (window.plantDoctorCache) {
      window.plantDoctorCache = null;
    }
  },

  // Check if user is authenticated with verification
  isAuthenticated: () => {
    const code = localStorage.getItem(AUTH_STORAGE_KEY);
    return !!(code && code.length === 6);
  },

  // Get auth headers for API requests
  getAuthHeaders: () => {
    const code = localStorage.getItem(AUTH_STORAGE_KEY);
    return code ? { 'X-Auth-Code': code } : {};
  },
  
  // Force refresh authentication state
  refreshAuth: async () => {
    const code = localStorage.getItem(AUTH_STORAGE_KEY);
    if (code) {
      try {
        // Verify code is still valid
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify`, {
          headers: { 'X-Auth-Code': code }
        });
        if (!response.ok) {
          // Invalid code - clear everything
          authService.clearAuthCode();
          return false;
        }
        return true;
      } catch (error) {
        console.error('Auth refresh error:', error);
        return false;
      }
    }
    return false;
  }
};

import axios from 'axios';
import API from './api';

// Create a custom Axios instance with default config
const axiosInstance = axios.create({
  baseURL: API.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors (401, 403, etc.)
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        localStorage.removeItem('token');
        // Could redirect to login page here
        console.error('Authentication error: Please log in again');
      }
      
      if (status === 403) {
        console.error('Authorization error: You do not have permission to access this resource');
      }
    }
    
    return Promise.reject(error);
  }
);

// Export the Axios instance for use in components
export default axiosInstance; 
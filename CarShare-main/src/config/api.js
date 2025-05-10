// API Configuration
const API = {
  // Base URL for all API requests
  BASE_URL: 'http://localhost:5023/api', // Updated to the correct endpoint
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/Auth/login',
    REGISTER: '/Auth/register',
    
    // Users
    USER_PROFILE: '/Users/profile',
    USER_BY_ID: (id) => `/Users/${id}`,
    
    // Cars
    CARS: '/Cars',
    CAR_DETAILS: (id) => `/Cars/${id}`,
    APPROVE_CAR: (id) => `/Cars/${id}/approve`,
    
    // Rentals
    RENTALS: '/Rentals',
    
    // Chat
    CHAT_STATUS: '/Chat/status',
    CHAT_TEST_NOTIFICATION: '/Chat/test-notification',
  },
  
  // Generate full URL for an endpoint
  url: function(endpoint) {
    return this.BASE_URL + endpoint;
  },
  
  // Headers
  getHeaders: function(token) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
};

export default API; 
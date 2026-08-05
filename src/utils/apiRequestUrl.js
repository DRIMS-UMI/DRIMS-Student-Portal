import axios from 'axios';

//export const BASE_API_URL = "https://drimsapi.alero.digital/api/v1";
// [ngrok] 
export const BASE_API_URL = 'https://5ca7-102-86-12-127.ngrok-free.app/api/v1';
//export const BASE_API_URL = 'https://drimsapi.umi.ac.ug/api/v1';

const apiRequest = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000,
});

apiRequest.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'; // [ngrok]

// Request interceptor to add auth token
apiRequest.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('umi_student_auth_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiRequest.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Check if this was a login request
      const isLoginRequest = error.config && error.config.url && error.config.url.includes('/login');

      if (!isLoginRequest) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('umi_student_auth_token');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiRequest; 
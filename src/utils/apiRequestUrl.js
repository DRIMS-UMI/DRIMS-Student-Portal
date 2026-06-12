import axios from 'axios';

// export const BASE_API_URL = "https://drimsapi.alero.digital/api/v1";
//export const BASE_API_URL = 'http://localhost:5000/api/v1';
export const BASE_API_URL = 'https://drimsapi.umi.ac.ug/api/v1';

const apiRequest = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000,
});

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
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('umi_student_auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiRequest; 
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pulse_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

import axios from 'axios';

const RAW = import.meta.env.VITE_API_URL || '';
export const API = RAW.replace(/\/+$/, '');
export const loginUrl = `${API}/api/auth/discord`;

export const api = axios.create({
  baseURL: API || undefined,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  (r) => r.data,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.error || err.message || 'request_failed';
    if (status === 401 && !window.location.pathname.startsWith('/login')) {
      window.dispatchEvent(new CustomEvent('nbc:unauthorized'));
    }
    return Promise.reject(Object.assign(new Error(message), { status, data: err.response?.data }));
  }
);
import axios from 'axios';

export const API = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.response.use(
  (r) => r.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'request_failed';
    return Promise.reject(Object.assign(new Error(message), { status: err.response?.status }));
  }
);

export const loginUrl = API + '/api/auth/discord';

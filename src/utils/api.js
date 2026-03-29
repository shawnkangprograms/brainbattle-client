import axios from 'axios';

// Vercel env var: VITE_API_URL = https://brainbattle-server-production-10c3.up.railway.app
// Dev: empty string so Vite proxy handles routing to localhost:5000
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

// Automatically attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

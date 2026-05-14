import axios from 'axios';

// VITE_API_URL sobrescreve (útil em dev local).
// Sem ela, usa o mesmo hostname que o browser usou para acessar o frontend,
// com a porta do backend — funciona em qualquer servidor sem reconfigurar.
const baseURL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8080/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth');
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

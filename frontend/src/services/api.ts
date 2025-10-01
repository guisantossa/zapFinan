import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

// Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 402 Payment Required errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string }>) => {
    if (error.response?.status === 402) {
      const message = error.response?.data?.detail || 'Esta funcionalidade requer upgrade do plano';

      toast.error('Upgrade Necessário', {
        description: message,
        action: {
          label: 'Ver Planos',
          onClick: () => {
            window.location.href = '/planos';
          },
        },
        duration: 6000,
      });
    } else if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;

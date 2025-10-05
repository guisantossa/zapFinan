import axios from 'axios';
import { toast } from 'sonner';

// Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log(`[HTTP] Anexando token para: ${config.url}`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log(`[HTTP] Nenhum token disponível para: ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.log('[HTTP] Erro no interceptor de requisição:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors (token refresh is handled by AuthContext)
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('[HTTP] Interceptor de resposta recebeu erro:', error.response?.status, error.message);

    // Handle 401 Unauthorized - just log and pass through
    // Token refresh is now handled by AuthContext
    if (error.response?.status === 401) {
      console.log('[HTTP] 401 detectado, deixando AuthContext gerenciar...');
      // Don't attempt refresh here anymore - let AuthContext handle it
      return Promise.reject(error);
    }

    // Handle specific error codes (except 401 which is handled by AuthContext)
    switch (error.response?.status) {
      case 400:
        console.log('[HTTP] Erro 400 - Dados inválidos');
        // Don't show toast for 400 errors - let components handle them
        break;
      case 403:
        console.log('[HTTP] Erro 403 - Acesso negado');
        toast.error('Acesso negado.');
        break;
      case 404:
        console.log('[HTTP] Erro 404 - Recurso não encontrado');
        // Don't show toast for 404 errors - let components handle them
        break;
      case 422:
        console.log('[HTTP] Erro 422 - Validação');
        // Don't show toast for validation errors - let components handle them
        break;
      case 429:
        console.log('[HTTP] Erro 429 - Rate limit');
        toast.error('Muitas tentativas. Tente novamente em alguns minutos.');
        break;
      case 500:
        console.log('[HTTP] Erro 500 - Erro interno do servidor');
        toast.error('Erro interno do servidor. Tente novamente.');
        break;
      default:
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          console.log('[HTTP] Erro de rede');
          toast.error('Erro de conexão. Verifique sua internet.');
        } else if (error.response?.status >= 500) {
          console.log('[HTTP] Erro de servidor:', error.response?.status);
          toast.error('Erro inesperado. Tente novamente.');
        } else {
          console.log('[HTTP] Erro não tratado:', error.response?.status, error.message);
        }
    }

    return Promise.reject(error);
  }
);

// Helper functions for common HTTP methods
export const api = {
  get: <T = any>(url: string, config?: any) =>
    httpClient.get<T>(url, config).then(res => res.data),

  post: <T = any>(url: string, data?: any, config?: any) =>
    httpClient.post<T>(url, data, config).then(res => res.data),

  put: <T = any>(url: string, data?: any, config?: any) =>
    httpClient.put<T>(url, data, config).then(res => res.data),

  patch: <T = any>(url: string, data?: any, config?: any) =>
    httpClient.patch<T>(url, data, config).then(res => res.data),

  delete: <T = any>(url: string, config?: any) =>
    httpClient.delete<T>(url, config).then(res => res.data),
};
import axios from 'axios';

// Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
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

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_inicio: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  plano_id: number | null;
}

export interface Plan {
  id: number;
  nome: string;
  valor_mensal: number;
  valor_anual: number;
}

export interface Payment {
  date: string | null;
  status: string;
  value: number;
  method: string | null;
}

export interface UserStats {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  receitas: number;
  despesas: number;
}

export interface UserProfile {
  user: User;
  plan: Plan | null;
  last_payment: Payment | null;
  stats: UserStats;
}

export interface UpdateUserData {
  nome?: string;
  email?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

class UserApi {
  // Get current user basic info
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/user/me');
    return response.data;
  }

  // Get complete user profile
  async getUserProfile(): Promise<UserProfile> {
    const response = await api.get('/user/me/profile');
    return response.data;
  }

  // Update user information
  async updateUser(data: UpdateUserData): Promise<User> {
    const response = await api.put('/user/me', data);
    return response.data;
  }

  // Change password
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.put('/user/change-password', {
      senha: data.new_password,
      current_password: data.current_password
    });
    return response.data;
  }

  // Get all available plans
  async getAvailablePlans(): Promise<Plan[]> {
    const response = await api.get('/plans/');
    return response.data;
  }

  // Get specific plan details
  async getPlan(planId: number): Promise<Plan> {
    const response = await api.get(`/plans/${planId}`);
    return response.data;
  }

  // Request email verification
  async requestEmailVerification(): Promise<{ message: string }> {
    const response = await api.post('/user/resend-verification', {
      email: '' // This will be handled by the backend based on current user
    });
    return response.data;
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post('/user/verify-email', { token });
    return response.data;
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await api.post('/user/forgot-password', { email });
    return response.data;
  }

  // Format currency
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  // Format datetime
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR');
  }

  // Calculate plan savings (annual vs monthly)
  calculatePlanSavings(plan: Plan): { savings: number; percentage: number } {
    const monthlyTotal = plan.valor_mensal * 12;
    const savings = monthlyTotal - plan.valor_anual;
    const percentage = (savings / monthlyTotal) * 100;
    return { savings, percentage };
  }
}

export const userApi = new UserApi();
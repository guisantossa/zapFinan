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

export interface UserPhone {
  id: string;
  user_id: string;
  phone_number: string;
  is_primary: boolean;
  is_verified: boolean;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPhoneListResponse {
  phones: UserPhone[];
  total: number;
  primary_phone: UserPhone | null;
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
    const response = await api.post('/user/change-password', {
      current_password: data.current_password,
      new_password: data.new_password,
      confirm_new_password: data.new_password
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

  // ============================================================================
  // Phone Management Methods
  // ============================================================================

  // Get all user phones
  async getUserPhones(): Promise<UserPhoneListResponse> {
    const response = await api.get('/user/phones/');
    return response.data;
  }

  // Get primary phone
  async getPrimaryPhone(): Promise<UserPhone> {
    const response = await api.get('/user/phones/primary');
    return response.data;
  }

  // Add new phone
  async addPhone(phoneNumber: string, isPrimary: boolean = false): Promise<UserPhone> {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const response = await api.post('/user/phones/', {
      phone_number: cleaned,
      is_primary: isPrimary,
    });
    return response.data;
  }

  // Delete phone
  async deletePhone(phoneId: string): Promise<void> {
    await api.delete(`/user/phones/${phoneId}`);
  }

  // Set phone as primary
  async setPhonePrimary(phoneId: string): Promise<UserPhone> {
    const response = await api.patch(`/user/phones/${phoneId}/set-primary`);
    return response.data;
  }

  // Deactivate phone
  async deactivatePhone(phoneId: string): Promise<UserPhone> {
    const response = await api.patch(`/user/phones/${phoneId}/deactivate`);
    return response.data;
  }

  // Activate phone
  async activatePhone(phoneId: string): Promise<UserPhone> {
    const response = await api.patch(`/user/phones/${phoneId}/activate`);
    return response.data;
  }

  // Request phone verification
  async requestPhoneVerification(phoneId: string): Promise<{ message: string; code?: string; expires_in_minutes: number }> {
    const response = await api.post(`/user/phones/${phoneId}/request-verification`);
    return response.data;
  }

  // Verify phone with code
  async verifyPhone(phoneId: string, verificationCode: string): Promise<UserPhone> {
    const response = await api.post(`/user/phones/${phoneId}/verify`, {
      phone_id: phoneId,
      verification_token: verificationCode,
    });
    return response.data;
  }

  // Format phone number for display
  formatPhoneNumber(phone: string): string {
    if (!phone) return 'Não informado';
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
  }

  // Format phone input (para input field)
  formatPhoneInput(value: string): string {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 2) {
      return cleaned;
    }
    if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    if (cleaned.length <= 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }

    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }

  // Validate phone format
  validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
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
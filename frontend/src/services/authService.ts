import { api } from './httpService';
import type {
  User,
  LoginResponse,
  RegisterRequest,
  LoginRequest,
  SMSTokenRequest,
  SMSVerifyRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth';

export const authService = {
  // Traditional login with phone/email and password
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/user/login', {
      identifier: credentials.identifier,
      senha: credentials.senha,
    });
  },

  // SMS-based authentication - Step 1: Send SMS token
  sendSMSToken: async (phone: string): Promise<void> => {
    return api.post<void>('/user/send-sms-token', {
      telefone: phone,
    });
  },

  // SMS-based authentication - Step 2: Verify SMS token
  verifySMSToken: async (token: string): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/user/verify-sms-token', {
      token,
    });
  },

  // User registration
  register: async (userData: RegisterRequest): Promise<void> => {
    return api.post<void>('/user/register', userData);
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    // Force fresh token from localStorage in case it was just updated
    const token = localStorage.getItem('accessToken');
  

    return api.get<User>('/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    return api.post<RefreshTokenResponse>('/user/refresh', {
      refresh_token: refreshToken,
    });
  },

  // Logout (invalidate tokens)
  logout: async (): Promise<void> => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.warn('Logout request failed, but continuing with local cleanup');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Forgot password - Send reset email
  forgotPassword: async (email: string): Promise<void> => {
    return api.post<void>('/user/forgot-password', {
      email,
    });
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    return api.post<void>('/user/reset-password', {
      token,
      new_password: newPassword,
    });
  },

  // Resend email verification
  resendEmailVerification: async (): Promise<void> => {
    return api.post<void>('/user/resend-email-verification');
  },

  // Verify email with token
  verifyEmail: async (token: string): Promise<void> => {
    return api.post<void>('/user/verify-email', {
      token,
    });
  },
};
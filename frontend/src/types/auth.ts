export interface User {
  id: number;
  telefone: string;
  nome: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  message: string;
}

export interface RegisterRequest {
  telefone: string;
  nome: string;
  email: string;
  senha: string;
}

export interface LoginRequest {
  identifier: string;  // telefone ou email
  senha: string;
}

export interface SMSTokenRequest {
  telefone: string;
}

export interface SMSVerifyRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}
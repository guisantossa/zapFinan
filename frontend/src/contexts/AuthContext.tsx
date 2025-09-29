import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/authService';
import '../utils/auth-debug'; // Load debug utilities

// Helper function to extract error message safely
const extractErrorMessage = (error: any, defaultMessage: string): string => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    } else if (Array.isArray(detail)) {
      return detail.map(err => err.msg || err).join(', ');
    }
  }
  return defaultMessage;
};

// Helper function to check if a token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < currentTime;

    

    return isExpired;
  } catch (error) {
    console.log('[Auth] Error checking token expiration:', error);
    return true; // Treat invalid tokens as expired
  }
};

// Helper function to clear expired tokens from localStorage
const clearExpiredTokens = (): boolean => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  let clearedTokens = false;

  if (accessToken && isTokenExpired(accessToken)) {
    localStorage.removeItem('accessToken');
    clearedTokens = true;
  }

  if (refreshToken && isTokenExpired(refreshToken)) {
    localStorage.removeItem('refreshToken');
    clearedTokens = true;
  }

  return clearedTokens;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithSMS: (phone: string) => Promise<void>;
  verifySMSToken: (token: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshAuthToken: () => Promise<boolean>;
}

interface LoginCredentials {
  identifier: string;
  senha: string;
}

interface RegisterData {
  telefone: string;
  nome: string;
  email: string;
  senha: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Centralized refresh token method
  const refreshAuthToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }

      // Check if refresh token is expired before attempting refresh
      if (isTokenExpired(refreshToken)) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return false;
      }

      const response = await authService.refreshToken(refreshToken);


      // Update stored tokens
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);

      return true;
    } catch (error: any) {
      console.log('[Auth] Refresh de token falhou:', error.message, error.response?.data);

      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });

      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {

      try {
        // First, check and clear any expired tokens
        const clearedExpiredTokens = clearExpiredTokens();
        if (clearedExpiredTokens) {
          console.log('[Auth] Expired tokens were cleared');
        }

        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!token) {
          console.log('[Auth] Nenhum token encontrado, usuário não autenticado');
          dispatch({ type: 'AUTH_FAILURE', payload: '' });
          return;
        }


        try {
          // Primeira tentativa: usar o token atual
          const user = await authService.getCurrentUser();
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } catch (getCurrentUserError: any) {
          // Se o token atual falhou, tentar fazer refresh
          if (refreshToken && getCurrentUserError.response?.status === 401) {
            const refreshSuccess = await refreshAuthToken();

            if (refreshSuccess) {
              try {

                // Pequeno delay para garantir que o token foi atualizado
                await new Promise(resolve => setTimeout(resolve, 100));

                // Tentar novamente obter os dados do usuário
                const user = await authService.getCurrentUser();
                dispatch({ type: 'AUTH_SUCCESS', payload: user });
              } catch (retryError: any) {
                dispatch({ type: 'AUTH_FAILURE', payload: '' });
              }
            } else {
              console.log('[Auth] Refresh falhou');
              dispatch({ type: 'AUTH_FAILURE', payload: '' });
            }
          } else {
            console.log('[Auth] Sem refresh token disponível ou erro diferente de 401');
            // Sem refresh token ou erro diferente de 401
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            dispatch({ type: 'AUTH_FAILURE', payload: '' });
          }
        }
      } catch (error: any) {
        console.error('[Auth] Erro inesperado na verificação de autenticação:', error);
        // Erro inesperado, limpar tudo
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'AUTH_FAILURE', payload: '' });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);

      // Use user data from login response instead of extra API call
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Erro ao fazer login');
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const loginWithSMS = async (phone: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      await authService.sendSMSToken(phone);
      // Don't set success state yet, wait for SMS verification
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Erro ao enviar SMS');
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const verifySMSToken = async (token: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.verifySMSToken(token);
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);

      // Use user data from SMS verification response instead of extra API call
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Token inválido');
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      await authService.register(userData);
      // After registration, user needs to verify email or login
      dispatch({ type: 'AUTH_FAILURE', payload: '' });
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Erro ao criar conta');
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    console.log('[Auth] Fazendo logout do usuário');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
    console.log('[Auth] Logout concluído');
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    loginWithSMS,
    verifySMSToken,
    register,
    logout,
    clearError,
    refreshAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
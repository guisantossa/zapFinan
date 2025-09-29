// Settings API service
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

export interface UserSettings {
  id: number;
  user_id: string; // UUID as string in frontend
  // Alert Settings
  daily_reports_enabled: boolean;
  daily_reports_time: string; // Time in HH:MM format
  commitment_alerts_enabled: boolean;
  commitment_alerts_time: string; // Time in HH:MM format
  // Synchronization Settings
  google_calendar_connected: boolean;
  google_calendar_email?: string;
  google_calendar_last_sync?: string;
  sync_transactions_enabled: boolean;
  sync_commitments_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsUpdate {
  daily_reports_enabled?: boolean;
  daily_reports_time?: string;
  commitment_alerts_enabled?: boolean;
  commitment_alerts_time?: string;
  google_calendar_connected?: boolean;
  sync_transactions_enabled?: boolean;
  sync_commitments_enabled?: boolean;
}

export interface GoogleCalendarStatus {
  connected: boolean;
  email?: string;
  last_sync?: string;
  sync_transactions_enabled: boolean;
  sync_commitments_enabled: boolean;
}

export const settingsApi = {
  // Get user settings
  async getUserSettings(): Promise<UserSettings> {
    const response = await api.get<UserSettings>('/user/settings/');
    return response.data;
  },

  // Update user settings
  async updateUserSettings(settings: UserSettingsUpdate): Promise<UserSettings> {
    const response = await api.put<UserSettings>('/user/settings/', settings);
    return response.data;
  },

  // Get Google Calendar status
  async getGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
    const response = await api.get<GoogleCalendarStatus>('/user/settings/google-calendar');
    return response.data;
  },

  // Connect Google Calendar
  async connectGoogleCalendar(): Promise<{ message: string; settings: UserSettings }> {
    const response = await api.post<{ message: string; settings: UserSettings }>('/user/settings/google-calendar/connect');
    return response.data;
  },

  // Disconnect Google Calendar
  async disconnectGoogleCalendar(): Promise<{ message: string; settings: UserSettings }> {
    const response = await api.post<{ message: string; settings: UserSettings }>('/user/settings/google-calendar/disconnect');
    return response.data;
  },

  // Utility functions
  formatTime: (timeString: string): string => {
    // Convert HH:MM:SS to HH:MM if needed
    return timeString.slice(0, 5);
  },

  parseTime: (timeInput: string): string => {
    // Ensure time is in HH:MM format
    const time = timeInput.includes(':') ? timeInput : `${timeInput}:00`;
    return time.slice(0, 5);
  },

  formatLastSync: (lastSync?: string): string => {
    if (!lastSync) return 'Nunca';
    const date = new Date(lastSync);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};
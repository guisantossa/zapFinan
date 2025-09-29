from datetime import datetime, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# Base schema with common fields
class UserSettingsBase(BaseModel):
    # Alert Settings
    daily_reports_enabled: bool = Field(
        default=True, description="Enable daily reports"
    )
    daily_reports_time: time = Field(
        default=time(8, 0), description="Time for daily reports (HH:MM)"
    )
    commitment_alerts_enabled: bool = Field(
        default=True, description="Enable commitment alerts"
    )
    commitment_alerts_time: time = Field(
        default=time(7, 0), description="Time for commitment alerts (HH:MM)"
    )

    # Synchronization Settings
    google_calendar_connected: bool = Field(
        default=False, description="Google Calendar connection status"
    )
    sync_transactions_enabled: bool = Field(
        default=False, description="Enable transaction sync"
    )
    sync_commitments_enabled: bool = Field(
        default=True, description="Enable commitment sync"
    )


# Schema for creating new settings (inherits from base)
class UserSettingsCreate(UserSettingsBase):
    user_id: UUID = Field(..., description="User ID")


# Schema for updating settings (all fields optional)
class UserSettingsUpdate(BaseModel):
    daily_reports_enabled: Optional[bool] = None
    daily_reports_time: Optional[time] = None
    commitment_alerts_enabled: Optional[bool] = None
    commitment_alerts_time: Optional[time] = None
    google_calendar_connected: Optional[bool] = None
    sync_transactions_enabled: Optional[bool] = None
    sync_commitments_enabled: Optional[bool] = None


# Schema for reading settings from database
class UserSettingsInDB(UserSettingsBase):
    id: int
    user_id: UUID
    google_calendar_email: Optional[str] = None
    google_calendar_last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Schema for API responses
class UserSettings(UserSettingsInDB):
    pass


# Schema for Google Calendar integration status
class GoogleCalendarStatus(BaseModel):
    connected: bool
    email: Optional[str] = None
    last_sync: Optional[datetime] = None
    sync_transactions_enabled: bool
    sync_commitments_enabled: bool

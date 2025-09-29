from datetime import time
from typing import Optional
from uuid import UUID as UUIDType

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.user_settings import UserSettings
from app.schemas.user_settings import UserSettingsCreate, UserSettingsUpdate


class CRUDUserSettings(CRUDBase[UserSettings, UserSettingsCreate, UserSettingsUpdate]):
    def get_by_user_id(
        self, db: Session, *, user_id: UUIDType
    ) -> Optional[UserSettings]:
        """Get user settings by user ID."""
        return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()

    def get_or_create_by_user_id(
        self, db: Session, *, user_id: UUIDType
    ) -> UserSettings:
        """Get existing settings or create default settings for a user."""
        settings = self.get_by_user_id(db, user_id=user_id)
        if not settings:
            # Create default settings
            settings_data = UserSettingsCreate(
                user_id=user_id,
                daily_reports_enabled=True,
                daily_reports_time=time(8, 0),
                commitment_alerts_enabled=True,
                commitment_alerts_time=time(7, 0),
                google_calendar_connected=False,
                sync_transactions_enabled=False,
                sync_commitments_enabled=True,
            )
            settings = self.create(db, obj_in=settings_data)
        return settings

    def update_by_user_id(
        self, db: Session, *, user_id: UUIDType, obj_in: UserSettingsUpdate
    ) -> Optional[UserSettings]:
        """Update settings by user ID."""
        settings = self.get_by_user_id(db, user_id=user_id)
        if settings:
            return self.update(db, db_obj=settings, obj_in=obj_in)
        return None

    def update_google_calendar_status(
        self,
        db: Session,
        *,
        user_id: UUIDType,
        connected: bool,
        email: Optional[str] = None,
    ) -> Optional[UserSettings]:
        """Update Google Calendar connection status."""
        settings = self.get_or_create_by_user_id(db, user_id=user_id)
        update_data = {
            "google_calendar_connected": connected,
        }
        if email is not None:
            update_data["google_calendar_email"] = email

        return self.update(db, db_obj=settings, obj_in=update_data)


user_settings = CRUDUserSettings(UserSettings)

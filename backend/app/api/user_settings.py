from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.crud import user_settings
from app.models.user import User
from app.schemas.user_settings import (
    GoogleCalendarStatus,
    UserSettings,
    UserSettingsUpdate,
)

router = APIRouter()


@router.get("/", response_model=UserSettings)
async def get_user_settings(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get user settings. Creates default settings if none exist.
    """
    settings = user_settings.get_or_create_by_user_id(db, user_id=current_user.id)
    return settings


@router.put("/", response_model=UserSettings)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user settings.
    """
    settings = user_settings.update_by_user_id(
        db, user_id=current_user.id, obj_in=settings_update
    )
    if not settings:
        # This shouldn't happen since get_or_create ensures settings exist
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User settings not found"
        )
    return settings


@router.get("/google-calendar", response_model=GoogleCalendarStatus)
async def get_google_calendar_status(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get Google Calendar integration status.
    """
    settings = user_settings.get_or_create_by_user_id(db, user_id=current_user.id)

    return GoogleCalendarStatus(
        connected=settings.google_calendar_connected,
        email=settings.google_calendar_email,
        last_sync=settings.google_calendar_last_sync,
        sync_transactions_enabled=settings.sync_transactions_enabled,
        sync_commitments_enabled=settings.sync_commitments_enabled,
    )


@router.post("/google-calendar/connect")
async def connect_google_calendar(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Initiate Google Calendar connection.
    This endpoint would normally redirect to Google OAuth, but for now it's a placeholder.
    """
    # TODO: Implement Google OAuth flow
    # For now, we'll just mark as connected for testing
    settings = user_settings.update_google_calendar_status(
        db, user_id=current_user.id, connected=True, email="example@gmail.com"
    )

    return {"message": "Google Calendar connection initiated", "settings": settings}


@router.post("/google-calendar/disconnect")
async def disconnect_google_calendar(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Disconnect Google Calendar integration.
    """
    settings = user_settings.update_google_calendar_status(
        db, user_id=current_user.id, connected=False, email=None
    )

    return {
        "message": "Google Calendar disconnected successfully",
        "settings": settings,
    }

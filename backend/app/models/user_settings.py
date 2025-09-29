from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Time,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )

    # Alert Settings
    daily_reports_enabled = Column(Boolean, default=True, nullable=False)
    daily_reports_time = Column(Time, default="08:00", nullable=False)
    commitment_alerts_enabled = Column(Boolean, default=True, nullable=False)
    commitment_alerts_time = Column(Time, default="07:00", nullable=False)

    # Synchronization Settings
    google_calendar_connected = Column(Boolean, default=False, nullable=False)
    google_calendar_email = Column(String(255), nullable=True)
    google_calendar_last_sync = Column(DateTime(timezone=True), nullable=True)
    sync_transactions_enabled = Column(Boolean, default=False, nullable=False)
    sync_commitments_enabled = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="settings")

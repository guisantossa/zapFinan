import uuid

from sqlalchemy import UUID, Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    # Basic fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    senha = Column(String(255), nullable=False)
    telefone = Column(String(20), unique=True, nullable=False, index=True)
    nome = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True, unique=True, index=True)
    lid = Column(
        String(50), unique=True, nullable=True, index=True
    )  # WhatsApp/N8N identifier
    data_inicio = Column(DateTime(timezone=True), server_default=func.now())

    # Security and status fields
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_password_change = Column(DateTime(timezone=True), server_default=func.now())

    # Verification tokens
    email_verification_token = Column(String(255), nullable=True)
    email_verification_expires = Column(DateTime(timezone=True), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)

    # Plan reference
    plano_id = Column(Integer, ForeignKey("plans.id"), nullable=True)

    # Timestamps
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships using string references to avoid circular imports
    plano = relationship("Plan", back_populates="users")
    transactions = relationship(
        "Transaction", back_populates="usuario", cascade="all, delete-orphan"
    )
    budgets = relationship(
        "Budget", back_populates="usuario", cascade="all, delete-orphan"
    )
    commitments = relationship(
        "Commitment", back_populates="usuario", cascade="all, delete-orphan"
    )
    google_auth = relationship(
        "UserGoogleAuth",
        back_populates="usuario",
        uselist=False,
        cascade="all, delete-orphan",
    )
    consentimentos = relationship(
        "Consent", back_populates="usuario", cascade="all, delete-orphan"
    )
    payments = relationship(
        "Payment", back_populates="usuario", cascade="all, delete-orphan"
    )

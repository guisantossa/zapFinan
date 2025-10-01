import uuid
from typing import Optional

from sqlalchemy import UUID, Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    # Basic fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    senha = Column(String(255), nullable=False)
    # telefone foi removido - use user.primary_phone ou user.phones
    nome = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True, unique=True, index=True)
    # lid foi movido para user_phones - use user.primary_lid
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
    settings = relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    phones = relationship(
        "UserPhone",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",  # Carrega phones automaticamente para evitar N+1
    )

    # Computed properties for backward compatibility
    @property
    def primary_phone(self) -> Optional[str]:
        """Retorna o telefone principal do usuário (active + primary)."""
        for phone in self.phones:
            if phone.is_primary and phone.is_active:
                return phone.phone_number
        # Fallback: retorna o primeiro telefone ativo se não houver primary
        for phone in self.phones:
            if phone.is_active:
                return phone.phone_number
        return None

    @property
    def primary_lid(self) -> Optional[str]:
        """Retorna o LID (WhatsApp identifier) do telefone principal."""
        for phone in self.phones:
            if phone.is_primary and phone.is_active and phone.lid:
                return phone.lid
        # Fallback: retorna o primeiro lid ativo disponível
        for phone in self.phones:
            if phone.is_active and phone.lid:
                return phone.lid
        return None

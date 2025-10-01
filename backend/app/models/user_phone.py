"""
UserPhone Model - Suporte a múltiplos telefones por usuário
"""

import uuid

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserPhone(Base):
    """
    Telefones de usuário com suporte a múltiplos números.

    Regras de negócio:
    - Um usuário pode ter múltiplos telefones
    - Um telefone pode pertencer a apenas um usuário (unique)
    - Cada usuário deve ter exatamente um telefone principal
    - Telefone principal não pode ser removido se for o único
    """

    __tablename__ = "user_phones"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign Key to User
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Phone Data
    phone_number = Column(
        String(20),
        unique=True,  # Telefone não pode ser duplicado no sistema
        nullable=False,
        index=True,
    )

    # WhatsApp/N8N identifier (Meta sends @lid instead of phone)
    lid = Column(
        String(50),
        unique=True,  # Cada @lid é único no sistema
        nullable=True,  # Nem todo telefone tem lid (só WhatsApp Business)
        index=True,
    )

    # Status Flags
    is_primary = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,  # Index para buscar telefone principal rapidamente
    )

    is_verified = Column(Boolean, default=False, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    # Verification tokens (para SMS)
    verification_token = Column(String(10), nullable=True)
    verification_expires = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    verified_at = Column(DateTime(timezone=True), nullable=True)

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
    user = relationship("User", back_populates="phones")

    # Table constraints
    __table_args__ = (
        # Index composto para queries por user + primary
        Index("ix_user_phones_user_primary", "user_id", "is_primary"),
        # Index composto para queries por user + active
        Index("ix_user_phones_user_active", "user_id", "is_active"),
    )

    def __repr__(self):
        return f"<UserPhone(id={self.id}, phone={self.phone_number}, primary={self.is_primary})>"

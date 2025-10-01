"""
Pydantic Schemas para UserPhone
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.validators import format_phone

# ============================================================================
# Base Schemas
# ============================================================================


class UserPhoneBase(BaseModel):
    """Schema base para telefone."""

    phone_number: str = Field(
        ...,
        min_length=10,
        max_length=20,
        description="Phone number in E.164 format or local format",
    )
    lid: Optional[str] = Field(
        default=None, max_length=50, description="WhatsApp/N8N identifier (Meta @lid)"
    )

    @field_validator("phone_number", mode="before")
    @classmethod
    def validate_and_format_phone(cls, v):
        """Validar e formatar telefone com prefixo internacional +55."""
        if not v:
            raise ValueError("Phone number is required")

        # Aplicar formatação padrão (adiciona +55 se brasileiro)
        formatted = format_phone(v)

        # Validar que está no formato E.164 correto
        if not formatted.startswith("+"):
            raise ValueError("Phone number must be in international format")

        # Validar comprimento razoável (E.164: +XX...)
        if len(formatted) < 12 or len(formatted) > 20:
            raise ValueError("Phone number length invalid after formatting")

        return formatted


# ============================================================================
# Create Schemas
# ============================================================================


class UserPhoneCreate(UserPhoneBase):
    """Schema para criar novo telefone."""

    is_primary: bool = Field(
        default=False, description="Set as primary phone for the user"
    )


class UserPhoneCreateInternal(UserPhoneCreate):
    """Schema interno para criação (inclui user_id)."""

    user_id: UUID


# ============================================================================
# Update Schemas
# ============================================================================


class UserPhoneUpdate(BaseModel):
    """Schema para atualizar telefone existente."""

    is_primary: Optional[bool] = Field(
        default=None, description="Change primary phone status"
    )
    is_active: Optional[bool] = Field(
        default=None, description="Activate or deactivate phone"
    )


# ============================================================================
# Response Schemas
# ============================================================================


class UserPhoneResponse(UserPhoneBase):
    """Schema de resposta para telefone."""

    id: UUID
    user_id: UUID
    is_primary: bool
    is_verified: bool
    is_active: bool
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserPhoneListResponse(BaseModel):
    """Schema para lista de telefones."""

    phones: list[UserPhoneResponse]
    total: int
    primary_phone: Optional[UserPhoneResponse] = None


# ============================================================================
# Verification Schemas
# ============================================================================


class PhoneVerificationRequest(BaseModel):
    """Schema para solicitar verificação de telefone."""

    phone_number: str = Field(..., description="Phone number to verify")


class PhoneVerificationConfirm(BaseModel):
    """Schema para confirmar verificação com token."""

    phone_id: UUID
    verification_token: str = Field(..., min_length=4, max_length=10)


# ============================================================================
# Set Primary Phone Schema
# ============================================================================


class SetPrimaryPhoneRequest(BaseModel):
    """Schema para definir telefone principal."""

    phone_id: UUID

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.plan import PlanResponse
from app.schemas.user_phone import UserPhoneResponse


class UserBase(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None


class UserCreate(BaseModel):
    """Schema para criar usuário (telefone será adicionado via UserPhone)."""

    phone_number: str  # Telefone inicial
    senha: str
    nome: Optional[str] = None
    email: Optional[str] = None


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    senha: Optional[str] = None


class UserInDB(UserBase):
    id: UUID
    data_inicio: datetime
    is_active: bool
    is_verified: bool
    email_verified: bool
    last_login_at: Optional[datetime] = None
    plano_id: Optional[int] = None
    plano: Optional[PlanResponse] = None  # Informações completas do plano
    phones: list[UserPhoneResponse] = []  # Lista de telefones do usuário

    class Config:
        from_attributes = True


class User(UserInDB):
    """Schema de resposta de usuário com telefone principal computado."""

    @property
    def telefone(self) -> Optional[str]:
        """Retorna telefone principal para compatibilidade."""
        for phone in self.phones:
            if phone.is_primary and phone.is_active:
                return phone.phone_number
        # Fallback: primeiro telefone ativo
        for phone in self.phones:
            if phone.is_active:
                return phone.phone_number
        return None


# Schema para criar usuário com telefone
class UserCreateWithPhone(BaseModel):
    """Schema para criar usuário com telefone inicial."""

    phone_number: str
    senha: str
    nome: Optional[str] = None
    email: Optional[str] = None


# Login schemas
class LoginRequest(BaseModel):
    identifier: str  # telefone ou email
    senha: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: User
    message: str


# SMS Token schemas
class SMSTokenRequest(BaseModel):
    telefone: str


class SMSTokenVerify(BaseModel):
    telefone: str
    token: str


# Password reset schemas
class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# Email verification schemas
class EmailVerificationRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


# Token refresh schema
class TokenRefreshRequest(BaseModel):
    refresh_token: str

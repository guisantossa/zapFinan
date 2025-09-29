from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class UserBase(BaseModel):
    telefone: str
    nome: Optional[str] = None
    email: Optional[str] = None


class UserCreate(UserBase):
    senha: str


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

    class Config:
        from_attributes = True


class User(UserInDB):
    pass


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

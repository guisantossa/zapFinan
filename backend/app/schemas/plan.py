from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class PlanBase(BaseModel):
    """Schema base para plano"""

    nome: str = Field(..., min_length=1, max_length=100)
    valor_mensal: Decimal = Field(..., gt=0)
    valor_anual: Decimal = Field(..., gt=0)
    description: Optional[str] = None


class PlanFeatures(BaseModel):
    """Features do plano"""

    transactions_enabled: bool = True
    budgets_enabled: bool = True
    commitments_enabled: bool = True
    reports_advanced: bool = False
    google_calendar_sync: bool = False
    multi_phone_enabled: bool = True
    api_access: bool = False
    priority_support: bool = False


class PlanLimits(BaseModel):
    """Limites do plano (None = ilimitado)"""

    max_transactions_per_month: Optional[int] = Field(None, ge=0)
    max_budgets: Optional[int] = Field(None, ge=0)
    max_commitments: Optional[int] = Field(None, ge=0)
    max_categories: Optional[int] = Field(None, ge=0)
    max_phones: Optional[int] = Field(1, ge=1)
    data_retention_months: int = Field(12, ge=1)


class PlanMetadata(BaseModel):
    """Metadata do plano"""

    is_active: bool = True
    is_default: bool = False
    display_order: int = Field(0, ge=0)
    color: Optional[str] = None
    features_json: Optional[dict] = None


class PlanCreate(PlanBase, PlanFeatures, PlanLimits, PlanMetadata):
    """Schema para criar novo plano"""

    pass


class PlanUpdate(BaseModel):
    """Schema para atualizar plano (todos campos opcionais)"""

    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    valor_mensal: Optional[Decimal] = Field(None, gt=0)
    valor_anual: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = None

    # Features
    transactions_enabled: Optional[bool] = None
    budgets_enabled: Optional[bool] = None
    commitments_enabled: Optional[bool] = None
    reports_advanced: Optional[bool] = None
    google_calendar_sync: Optional[bool] = None
    multi_phone_enabled: Optional[bool] = None
    api_access: Optional[bool] = None
    priority_support: Optional[bool] = None

    # Limits
    max_transactions_per_month: Optional[int] = Field(None, ge=0)
    max_budgets: Optional[int] = Field(None, ge=0)
    max_commitments: Optional[int] = Field(None, ge=0)
    max_categories: Optional[int] = Field(None, ge=0)
    max_phones: Optional[int] = Field(None, ge=1)
    data_retention_months: Optional[int] = Field(None, ge=1)

    # Metadata
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)
    color: Optional[str] = None
    features_json: Optional[dict] = None


class PlanResponse(PlanBase, PlanFeatures, PlanLimits, PlanMetadata):
    """Schema de resposta completo do plano"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Plan(BaseModel):
    """Schema simplificado para uso geral (backward compatibility)"""

    id: int
    nome: str
    valor_mensal: Decimal
    valor_anual: Decimal

    class Config:
        from_attributes = True


class PlanWithFeatures(Plan, PlanFeatures, PlanLimits):
    """Plano com features e limites (para exibição ao usuário)"""

    description: Optional[str] = None
    color: Optional[str] = None

    class Config:
        from_attributes = True


class UserPlanInfo(BaseModel):
    """Informações do plano do usuário com status de pagamento"""

    plan: PlanWithFeatures
    is_active: bool
    last_payment_date: Optional[str] = None
    next_payment_date: Optional[str] = None
    payment_status: str = "unknown"

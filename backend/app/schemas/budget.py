from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BudgetBase(BaseModel):
    nome: str = Field(
        ..., min_length=1, max_length=100, description="Nome do orçamento"
    )
    categoria_id: int = Field(..., description="ID da categoria")
    valor_limite: Decimal = Field(
        ..., gt=0, decimal_places=2, description="Valor limite do orçamento"
    )
    periodicidade: Literal["mensal", "quinzenal", "semanal"] = Field(
        default="mensal", description="Periodicidade do orçamento"
    )
    notificar_em: Optional[Decimal] = Field(
        default=80.0, ge=0, le=100, description="Percentual para envio de alertas"
    )


class BudgetCreate(BudgetBase):
    usuario_id: UUID


class BudgetUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    valor_limite: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    periodicidade: Optional[Literal["mensal", "quinzenal", "semanal"]] = None
    notificar_em: Optional[Decimal] = Field(None, ge=0, le=100)
    ativo: Optional[bool] = None


class BudgetInDB(BudgetBase):
    id: UUID
    usuario_id: UUID
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True


class Budget(BudgetInDB):
    pass


# Budget Period Schemas
class BudgetPeriodBase(BaseModel):
    ano: int = Field(..., ge=2020, le=2050, description="Ano do período")
    mes: int = Field(..., ge=1, le=12, description="Mês do período")
    quinzena: Optional[int] = Field(None, ge=1, le=2, description="Quinzena (1 ou 2)")
    semana: Optional[int] = Field(None, ge=1, le=4, description="Semana do mês")
    valor_limite: Decimal = Field(
        ..., gt=0, decimal_places=2, description="Valor limite do período"
    )


class BudgetPeriodCreate(BudgetPeriodBase):
    budget_id: UUID
    data_inicio: datetime
    data_fim: datetime


class BudgetPeriodUpdate(BaseModel):
    valor_gasto: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    status: Optional[Literal["ativo", "excedido", "finalizado"]] = None
    alerta_enviado: Optional[bool] = None


class BudgetPeriodInDB(BudgetPeriodBase):
    id: UUID
    budget_id: UUID
    valor_gasto: Decimal
    status: str
    data_inicio: datetime
    data_fim: datetime
    alerta_enviado: bool
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True


class BudgetPeriod(BudgetPeriodInDB):
    pass


# Combined schemas for API responses
class BudgetWithPeriods(Budget):
    periods: List[BudgetPeriod] = []

    class Config:
        from_attributes = True


class BudgetWithCurrentPeriod(Budget):
    current_period: Optional[BudgetPeriod] = None

    class Config:
        from_attributes = True


class BudgetSummary(BaseModel):
    """Resumo do orçamento para dashboard."""

    id: UUID
    nome: str
    categoria_id: int
    categoria_nome: Optional[str] = None
    valor_limite: Decimal
    valor_gasto: Decimal
    percentual_gasto: Decimal
    status: str
    periodicidade: str
    dias_restantes: Optional[int] = None
    ativo: bool

    class Config:
        from_attributes = True

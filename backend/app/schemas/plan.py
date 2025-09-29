from decimal import Decimal

from pydantic import BaseModel


class PlanBase(BaseModel):
    nome: str
    valor_mensal: Decimal
    valor_anual: Decimal


class PlanCreate(PlanBase):
    pass


class PlanUpdate(PlanBase):
    pass


class PlanInDB(PlanBase):
    id: int

    class Config:
        from_attributes = True


class Plan(PlanInDB):
    pass


class UserPlanInfo(BaseModel):
    """Informações do plano do usuário com status de pagamento"""

    plan: Plan
    is_active: bool
    last_payment_date: str = None
    next_payment_date: str = None
    payment_status: str = "unknown"

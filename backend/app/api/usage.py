"""
API endpoints para consulta de uso e limites do plano.
"""

from typing import Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.usage_service import usage_service

router = APIRouter()


@router.get("/summary", response_model=Dict)
async def get_usage_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obter resumo completo de uso vs limites do plano atual.

    Retorna:
    - Uso atual de cada recurso
    - Limites do plano
    - Percentuais de uso
    - Avisos se próximo do limite
    - Features habilitadas

    Returns:
        Resumo completo de uso e limites
    """
    summary = usage_service.get_user_usage_summary(db, current_user)
    return summary


@router.get("/check/{resource_type}")
async def check_can_create_resource(
    resource_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verificar se usuário pode criar novo recurso.

    Args:
        resource_type: Tipo de recurso (transaction, budget, commitment, phone, category)

    Returns:
        {
            "can_create": bool,
            "message": str | None
        }
    """
    can_create, message = usage_service.check_can_create(
        db, current_user, resource_type
    )

    return {"can_create": can_create, "message": message}


@router.get("/features")
async def get_plan_features(
    current_user: User = Depends(get_current_user),
):
    """
    Obter lista de features disponíveis no plano atual do usuário.

    Returns:
        {
            "has_plan": bool,
            "plan_name": str,
            "features": {
                "feature_name": bool,
                ...
            }
        }
    """
    if not current_user.plano:
        return {"has_plan": False, "plan_name": None, "features": {}}

    return {
        "has_plan": True,
        "plan_id": current_user.plano.id,
        "plan_name": current_user.plano.nome,
        "features": {
            "transactions_enabled": current_user.plano.transactions_enabled,
            "budgets_enabled": current_user.plano.budgets_enabled,
            "commitments_enabled": current_user.plano.commitments_enabled,
            "reports_advanced": current_user.plano.reports_advanced,
            "google_calendar_sync": current_user.plano.google_calendar_sync,
            "multi_phone_enabled": current_user.plano.multi_phone_enabled,
            "api_access": current_user.plano.api_access,
            "priority_support": current_user.plano.priority_support,
        },
    }

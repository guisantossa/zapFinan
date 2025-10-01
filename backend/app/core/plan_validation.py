"""
Plan validation dependencies for feature and limit checking.
"""

from functools import wraps
from typing import Callable

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User

# ============================================================================
# Custom HTTP Status Codes
# ============================================================================

HTTP_402_PAYMENT_REQUIRED = 402  # Plan upgrade required


# ============================================================================
# Feature Validation Dependencies
# ============================================================================


def require_feature(feature_name: str):
    """
    Dependency factory para verificar se usuário tem acesso a uma feature.

    Usage:
        @router.post("/budgets/", dependencies=[Depends(require_feature("budgets_enabled"))])
        async def create_budget(...):
            ...

    Args:
        feature_name: Nome da feature (ex: "budgets_enabled", "api_access")

    Raises:
        HTTPException 402: Se o plano não tem a feature
        HTTPException 403: Se usuário não tem plano
    """

    async def _validate_feature(
        current_user: User = Depends(get_current_user),
    ):
        # Verificar se usuário tem plano
        if not current_user.plano:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No active plan. Please subscribe to a plan.",
            )

        # Verificar se plano tem a feature
        if not current_user.plano.has_feature(feature_name):
            raise HTTPException(
                status_code=HTTP_402_PAYMENT_REQUIRED,
                detail=f"This feature requires a plan upgrade. Feature: {feature_name}",
            )

        return True

    return _validate_feature


def check_feature_access(user: User, feature_name: str) -> bool:
    """
    Helper function para verificar feature access programaticamente.

    Args:
        user: User instance
        feature_name: Nome da feature

    Returns:
        True se tem acesso, False se não
    """
    if not user.plano:
        return False

    return user.plano.has_feature(feature_name)


# ============================================================================
# Limit Validation Dependencies
# ============================================================================


def require_limit(limit_name: str, count_func: Callable):
    """
    Dependency factory para verificar se usuário está dentro do limite.

    Usage:
        async def count_user_budgets(user: User, db: Session) -> int:
            return db.query(Budget).filter(Budget.usuario_id == user.id).count()

        @router.post("/budgets/", dependencies=[Depends(require_limit("max_budgets", count_user_budgets))])
        async def create_budget(...):
            ...

    Args:
        limit_name: Nome do limite (ex: "max_budgets", "max_transactions_per_month")
        count_func: Função que retorna a contagem atual do recurso

    Raises:
        HTTPException 402: Se excedeu o limite
        HTTPException 403: Se usuário não tem plano
    """

    async def _validate_limit(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        # Verificar se usuário tem plano
        if not current_user.plano:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No active plan. Please subscribe to a plan.",
            )

        # Obter limite do plano
        limit = current_user.plano.get_limit(limit_name)

        # None = ilimitado, pode prosseguir
        if limit is None:
            return True

        # Contar uso atual
        current_count = await count_func(current_user, db)

        # Verificar se está dentro do limite
        if current_count >= limit:
            raise HTTPException(
                status_code=HTTP_402_PAYMENT_REQUIRED,
                detail=f"You have reached the limit for this resource. Current: {current_count}, Limit: {limit}. Please upgrade your plan.",
            )

        return True

    return _validate_limit


def check_limit(user: User, limit_name: str, current_count: int) -> bool:
    """
    Helper function para verificar limite programaticamente.

    Args:
        user: User instance
        limit_name: Nome do limite
        current_count: Contagem atual do recurso

    Returns:
        True se está dentro do limite, False se excedeu
    """
    if not user.plano:
        return False

    return user.plano.is_within_limit(limit_name, current_count)


def get_user_limit(user: User, limit_name: str) -> int | None:
    """
    Obter limite de um recurso para o usuário.

    Args:
        user: User instance
        limit_name: Nome do limite

    Returns:
        Valor do limite ou None se ilimitado/sem plano
    """
    if not user.plano:
        return None

    return user.plano.get_limit(limit_name)


# ============================================================================
# Decorators para validação (alternativa aos Depends)
# ============================================================================


def validate_plan_feature(feature_name: str):
    """
    Decorator para validar feature dentro de uma função.

    Usage:
        @validate_plan_feature("budgets_enabled")
        async def my_function(user: User, db: Session):
            ...
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Tentar extrair user dos kwargs ou args
            user = kwargs.get("current_user") or kwargs.get("user")

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )

            if not check_feature_access(user, feature_name):
                raise HTTPException(
                    status_code=HTTP_402_PAYMENT_REQUIRED,
                    detail=f"This feature requires a plan upgrade. Feature: {feature_name}",
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator

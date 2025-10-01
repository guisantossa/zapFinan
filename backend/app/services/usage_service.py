"""
Usage tracking service for plan limits validation.
"""

from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.commitment import Commitment
from app.models.transaction import Transaction
from app.models.user import User
from app.models.user_phone import UserPhone


class UsageService:
    """
    Serviço para rastrear uso de recursos e validar limites do plano.
    """

    # ========================================================================
    # Transaction Usage
    # ========================================================================

    @staticmethod
    def count_transactions_this_month(db: Session, user_id: UUID) -> int:
        """
        Contar transações do usuário no mês atual.

        Args:
            db: Session do banco
            user_id: ID do usuário

        Returns:
            Número de transações no mês atual
        """
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        count = (
            db.query(func.count(Transaction.id))
            .filter(
                and_(
                    Transaction.usuario_id == user_id,
                    Transaction.data_registro >= start_of_month,
                )
            )
            .scalar()
        )

        return count or 0

    @staticmethod
    def count_total_transactions(db: Session, user_id: UUID) -> int:
        """
        Contar total de transações do usuário.

        Args:
            db: Session do banco
            user_id: ID do usuário

        Returns:
            Número total de transações
        """
        count = (
            db.query(func.count(Transaction.id))
            .filter(Transaction.usuario_id == user_id)
            .scalar()
        )

        return count or 0

    # ========================================================================
    # Budget Usage
    # ========================================================================

    @staticmethod
    def count_budgets(db: Session, user_id: UUID) -> int:
        """
        Contar orçamentos do usuário.

        Args:
            db: Session do banco
            user_id: ID do usuário

        Returns:
            Número de orçamentos
        """
        count = (
            db.query(func.count(Budget.id))
            .filter(Budget.usuario_id == user_id)
            .scalar()
        )

        return count or 0

    # ========================================================================
    # Commitment Usage
    # ========================================================================

    @staticmethod
    def count_commitments(db: Session, user_id: UUID) -> int:
        """
        Contar compromissos do usuário.

        Args:
            db: Session do banco
            user_id: ID do usuário

        Returns:
            Número de compromissos
        """
        count = (
            db.query(func.count(Commitment.id))
            .filter(Commitment.usuario_id == user_id)
            .scalar()
        )

        return count or 0

    # ========================================================================
    # Category Usage
    # ========================================================================

    @staticmethod
    def count_user_categories(db: Session, user_id: UUID) -> int:
        """
        Contar categorias personalizadas do usuário.

        Nota: Por enquanto, categorias são globais.
        Este método está preparado para quando houver categorias por usuário.

        Args:
            db: Session do banco
            user_id: ID do usuário

        Returns:
            Número de categorias (0 por enquanto, pois categorias são globais)
        """
        # TODO: Implementar quando houver categorias personalizadas por usuário
        return 0

    # ========================================================================
    # Phone Usage
    # ========================================================================

    @staticmethod
    def count_phones(db: Session, user_id: UUID) -> int:
        """
        Contar telefones do usuário.

        Args:
            db: Session do banco
            user_id: ID do usuário

        Returns:
            Número de telefones
        """
        count = (
            db.query(func.count(UserPhone.id))
            .filter(UserPhone.user_id == user_id)
            .scalar()
        )

        return count or 0

    # ========================================================================
    # Summary Methods
    # ========================================================================

    @staticmethod
    def get_user_usage_summary(db: Session, user: User) -> Dict:
        """
        Obter resumo completo de uso do usuário vs limites do plano.

        Args:
            db: Session do banco
            user: Objeto User

        Returns:
            Dicionário com uso atual e limites do plano
        """
        if not user.plano:
            return {
                "has_plan": False,
                "plan_name": None,
                "usage": {},
                "limits": {},
                "warnings": ["Nenhum plano ativo"],
            }

        plan = user.plano

        # Contar uso atual
        usage = {
            "transactions_this_month": UsageService.count_transactions_this_month(
                db, user.id
            ),
            "total_transactions": UsageService.count_total_transactions(db, user.id),
            "budgets": UsageService.count_budgets(db, user.id),
            "commitments": UsageService.count_commitments(db, user.id),
            "categories": UsageService.count_user_categories(db, user.id),
            "phones": UsageService.count_phones(db, user.id),
        }

        # Obter limites do plano
        limits = {
            "max_transactions_per_month": plan.max_transactions_per_month,
            "max_budgets": plan.max_budgets,
            "max_commitments": plan.max_commitments,
            "max_categories": plan.max_categories,
            "max_phones": plan.max_phones,
            "data_retention_months": plan.data_retention_months,
        }

        # Calcular percentuais de uso
        percentages = {}
        warnings = []

        for key, limit in limits.items():
            if limit is None:
                percentages[key] = 0  # Ilimitado
                continue

            # Mapear nome do limite para nome do uso
            usage_key = key.replace("max_", "")
            if usage_key == "transactions_per_month":
                usage_key = "transactions_this_month"

            current = usage.get(usage_key, 0)
            percentage = (current / limit * 100) if limit > 0 else 0
            percentages[key] = round(percentage, 1)

            # Avisos se próximo do limite
            if percentage >= 90:
                warnings.append(
                    f"Você está usando {percentage}% do limite de {key.replace('max_', '').replace('_', ' ')}"
                )
            elif percentage >= 100:
                warnings.append(
                    f"Limite de {key.replace('max_', '').replace('_', ' ')} excedido!"
                )

        return {
            "has_plan": True,
            "plan_id": plan.id,
            "plan_name": plan.nome,
            "usage": usage,
            "limits": limits,
            "percentages": percentages,
            "warnings": warnings,
            "features": {
                "transactions_enabled": plan.transactions_enabled,
                "budgets_enabled": plan.budgets_enabled,
                "commitments_enabled": plan.commitments_enabled,
                "reports_advanced": plan.reports_advanced,
                "google_calendar_sync": plan.google_calendar_sync,
                "multi_phone_enabled": plan.multi_phone_enabled,
                "api_access": plan.api_access,
                "priority_support": plan.priority_support,
            },
        }

    @staticmethod
    def check_can_create(
        db: Session, user: User, resource_type: str
    ) -> tuple[bool, Optional[str]]:
        """
        Verificar se usuário pode criar novo recurso baseado no limite do plano.

        Args:
            db: Session do banco
            user: Objeto User
            resource_type: Tipo de recurso ("transaction", "budget", "commitment", "phone")

        Returns:
            Tupla (pode_criar, mensagem_erro)
        """
        if not user.plano:
            return False, "Nenhum plano ativo. Assine um plano para continuar."

        # Mapear tipo de recurso para método de contagem e nome do limite
        resource_mapping = {
            "transaction": {
                "count_method": UsageService.count_transactions_this_month,
                "limit_name": "max_transactions_per_month",
                "display_name": "transações este mês",
            },
            "budget": {
                "count_method": UsageService.count_budgets,
                "limit_name": "max_budgets",
                "display_name": "orçamentos",
            },
            "commitment": {
                "count_method": UsageService.count_commitments,
                "limit_name": "max_commitments",
                "display_name": "compromissos",
            },
            "phone": {
                "count_method": UsageService.count_phones,
                "limit_name": "max_phones",
                "display_name": "telefones",
            },
            "category": {
                "count_method": UsageService.count_user_categories,
                "limit_name": "max_categories",
                "display_name": "categorias",
            },
        }

        if resource_type not in resource_mapping:
            return True, None  # Tipo desconhecido, permitir

        mapping = resource_mapping[resource_type]
        limit = user.plano.get_limit(mapping["limit_name"])

        # None = ilimitado
        if limit is None:
            return True, None

        # Contar uso atual
        current_count = mapping["count_method"](db, user.id)

        # Verificar se está dentro do limite
        if current_count >= limit:
            return (
                False,
                f"Limite de {mapping['display_name']} atingido ({current_count}/{limit}). Faça upgrade do seu plano.",
            )

        return True, None


# Singleton instance
usage_service = UsageService()

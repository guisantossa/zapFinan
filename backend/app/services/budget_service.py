from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import Session

from app.crud.budget import budget, budget_period
from app.models.budget import Budget
from app.schemas.budget import BudgetSummary


class BudgetService:
    """Serviços automáticos para gerenciamento de orçamentos."""

    @staticmethod
    def ensure_current_periods(db: Session, usuario_id: str) -> List[Budget]:
        """Garante que todos os orçamentos ativos do usuário tenham períodos atuais."""
        user_budgets = budget.get_by_user(db, usuario_id=usuario_id, ativo_only=True)
        updated_budgets = []

        for user_budget in user_budgets:
            # Verificar se tem período atual
            current_period = budget_period.get_current_period(
                db, budget_id=user_budget.id
            )

            if not current_period:
                # Criar período atual
                new_period = budget_period.create_period_for_budget(
                    db, budget=user_budget
                )
                if new_period:
                    updated_budgets.append(user_budget)

        return updated_budgets

    @staticmethod
    def update_budget_from_transaction(
        db: Session,
        usuario_id: str,
        categoria_id: int,
        valor: Decimal,
        data_transacao: datetime,
        tipo: str = "despesa",
    ) -> Optional[Budget]:
        """Atualiza orçamento quando uma nova transação é criada."""

        # Só atualizar orçamentos para despesas
        if tipo != "despesa":
            return None

        # Buscar orçamento ativo para a categoria
        user_budget = budget.get_by_user_and_category(
            db, usuario_id=usuario_id, categoria_id=categoria_id
        )

        if not user_budget:
            return None

        # Buscar período correspondente à data da transação
        current_period = budget_period.get_current_period(
            db, budget_id=user_budget.id, current_date=data_transacao
        )

        if not current_period:
            # Criar período se não existir para esta data
            current_period = budget_period.create_period_for_budget(
                db, budget=user_budget, target_date=data_transacao
            )

        if current_period:
            # Atualizar valor gasto
            budget_period.update_valor_gasto(
                db, period_id=current_period.id, valor_adicional=valor
            )

        return user_budget

    @staticmethod
    def get_budgets_for_alerts(db: Session, usuario_id: str) -> List[dict]:
        """Retorna orçamentos que precisam de alerta."""
        user_budgets = budget.get_by_user(db, usuario_id=usuario_id, ativo_only=True)
        budgets_for_alert = []

        for user_budget in user_budgets:
            current_period = budget_period.get_current_period(
                db, budget_id=user_budget.id
            )

            if not current_period or current_period.alerta_enviado:
                continue

            # Calcular percentual gasto
            if current_period.valor_limite > 0:
                percentual_gasto = (
                    current_period.valor_gasto / current_period.valor_limite
                ) * 100

                # Verificar se atingiu o limite para alerta
                if percentual_gasto >= user_budget.notificar_em:
                    budgets_for_alert.append(
                        {
                            "budget": user_budget,
                            "period": current_period,
                            "percentual_gasto": percentual_gasto,
                            "categoria_nome": (
                                user_budget.categoria.nome
                                if user_budget.categoria
                                else "Categoria"
                            ),
                        }
                    )

        return budgets_for_alert

    @staticmethod
    def mark_alert_sent(db: Session, period_id: str):
        """Marca alerta como enviado."""
        period = budget_period.get(db, id=period_id)
        if period:
            budget_period.update(db, db_obj=period, obj_in={"alerta_enviado": True})

    @staticmethod
    def get_dashboard_summary(db: Session, usuario_id: str) -> List[BudgetSummary]:
        """Retorna resumo para dashboard."""
        user_budgets = budget.get_by_user(db, usuario_id=usuario_id, ativo_only=True)
        summaries = []

        for user_budget in user_budgets:
            current_period = budget_period.get_current_period(
                db, budget_id=user_budget.id
            )

            if not current_period:
                # Criar período se não existir
                current_period = budget_period.create_period_for_budget(
                    db, budget=user_budget
                )

            if current_period:
                # Calcular percentual e dias restantes
                percentual_gasto = (
                    (current_period.valor_gasto / current_period.valor_limite * 100)
                    if current_period.valor_limite > 0
                    else 0
                )

                dias_restantes = max(0, (current_period.data_fim - datetime.now()).days)

                summaries.append(
                    BudgetSummary(
                        id=user_budget.id,
                        nome=user_budget.nome,
                        categoria_id=user_budget.categoria_id,
                        categoria_nome=(
                            user_budget.categoria.nome
                            if user_budget.categoria
                            else None
                        ),
                        valor_limite=current_period.valor_limite,
                        valor_gasto=current_period.valor_gasto,
                        percentual_gasto=percentual_gasto,
                        status=current_period.status,
                        periodicidade=user_budget.periodicidade,
                        dias_restantes=dias_restantes,
                        ativo=user_budget.ativo,
                    )
                )

        return summaries

    @staticmethod
    def create_next_periods_if_needed(db: Session):
        """Job automático para criar próximos períodos."""
        # Buscar todos os orçamentos ativos
        all_budgets = db.query(Budget).filter(Budget.ativo).all()

        created_periods = []
        current_time = datetime.now()

        for budget_obj in all_budgets:
            # Verificar se período atual está terminando (últimos 3 dias)
            current_period = budget_period.get_current_period(
                db, budget_id=budget_obj.id
            )

            if current_period:
                days_until_end = (current_period.data_fim - current_time).days

                if days_until_end <= 3:
                    # Criar próximo período
                    next_period = budget_period.create_period_for_budget(
                        db, budget=budget_obj, target_date=current_period.data_fim
                    )

                    if next_period:
                        created_periods.append(
                            {
                                "budget_id": budget_obj.id,
                                "period_id": next_period.id,
                                "budget_name": budget_obj.nome,
                            }
                        )

        return created_periods

    @staticmethod
    def recalculate_all_budgets(db: Session) -> dict:
        """Recalcula todos os orçamentos baseado nas transações existentes."""

        # Buscar todos os orçamentos ativos
        all_budgets = db.query(Budget).filter(Budget.ativo).all()

        updated_budgets = 0
        created_periods = 0
        details = []

        for budget_obj in all_budgets:
            result = BudgetService.recalculate_budget_periods(db, budget_obj)
            updated_budgets += result["updated_periods"]
            created_periods += result["created_periods"]
            details.append(
                {
                    "budget_id": str(budget_obj.id),
                    "budget_name": budget_obj.nome,
                    "updated_periods": result["updated_periods"],
                    "created_periods": result["created_periods"],
                }
            )

        return {
            "updated_budgets": updated_budgets,
            "created_periods": created_periods,
            "details": details,
        }

    @staticmethod
    def recalculate_user_budgets(db: Session, usuario_id: str) -> dict:
        """Recalcula orçamentos de um usuário específico."""
        user_budgets = budget.get_by_user(db, usuario_id=usuario_id, ativo_only=True)

        updated_budgets = 0
        created_periods = 0
        details = []

        for budget_obj in user_budgets:
            result = BudgetService.recalculate_budget_periods(db, budget_obj)
            updated_budgets += result["updated_periods"]
            created_periods += result["created_periods"]
            details.append(
                {
                    "budget_id": str(budget_obj.id),
                    "budget_name": budget_obj.nome,
                    "updated_periods": result["updated_periods"],
                    "created_periods": result["created_periods"],
                }
            )

        return {
            "updated_budgets": updated_budgets,
            "created_periods": created_periods,
            "details": details,
        }

    @staticmethod
    def recalculate_budget_periods(db: Session, budget_obj: Budget) -> dict:
        """Recalcula períodos de um orçamento específico baseado nas transações."""
        from sqlalchemy import and_

        from app.models.transaction import Transaction

        # Garantir que existe período atual
        current_period = budget_period.get_current_period(db, budget_id=budget_obj.id)
        created_periods = 0

        if not current_period:
            current_period = budget_period.create_period_for_budget(
                db, budget=budget_obj
            )
            if current_period:
                created_periods = 1

        updated_periods = 0

        if current_period:
            # Buscar todas as transações do usuário nesta categoria no período atual
            transactions = (
                db.query(Transaction)
                .filter(
                    and_(
                        Transaction.usuario_id == budget_obj.usuario_id,
                        Transaction.categoria_id == budget_obj.categoria_id,
                        Transaction.tipo == "despesa",
                        Transaction.data_transacao >= current_period.data_inicio.date(),
                        Transaction.data_transacao <= current_period.data_fim.date(),
                    )
                )
                .all()
            )

            # Calcular valor total gasto
            total_gasto = sum(float(t.valor) for t in transactions)

            # Atualizar período sempre (forçar atualização)
            current_period.valor_gasto = total_gasto

            # Atualizar status
            if total_gasto > float(current_period.valor_limite):
                current_period.status = "excedido"
            else:
                current_period.status = "ativo"

            db.add(current_period)
            db.commit()
            updated_periods = 1

        return {"updated_periods": updated_periods, "created_periods": created_periods}


# Instância única do serviço
budget_service = BudgetService()

import calendar
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session, joinedload

from app.crud.base import CRUDBase
from app.models.budget import Budget, BudgetPeriod
from app.schemas.budget import (
    BudgetCreate,
    BudgetPeriodCreate,
    BudgetPeriodUpdate,
    BudgetUpdate,
)


class CRUDBudget(CRUDBase[Budget, BudgetCreate, BudgetUpdate]):
    def get_by_user(
        self,
        db: Session,
        *,
        usuario_id: UUID,
        skip: int = 0,
        limit: int = 100,
        ativo_only: bool = True,
    ) -> List[Budget]:
        query = (
            db.query(Budget)
            .options(joinedload(Budget.categoria))
            .filter(Budget.usuario_id == usuario_id)
        )

        if ativo_only:
            query = query.filter(Budget.ativo)

        return query.order_by(desc(Budget.criado_em)).offset(skip).limit(limit).all()

    def get_by_user_and_category(
        self, db: Session, *, usuario_id: UUID, categoria_id: int
    ) -> Optional[Budget]:
        return (
            db.query(Budget)
            .filter(
                and_(
                    Budget.usuario_id == usuario_id,
                    Budget.categoria_id == categoria_id,
                    Budget.ativo,
                )
            )
            .first()
        )

    def get_with_current_period(
        self, db: Session, *, budget_id: UUID, current_date: Optional[datetime] = None
    ) -> Optional[Budget]:
        if current_date is None:
            current_date = datetime.now()

        return (
            db.query(Budget)
            .options(joinedload(Budget.categoria), joinedload(Budget.periods))
            .filter(Budget.id == budget_id)
            .first()
        )


class CRUDBudgetPeriod(CRUDBase[BudgetPeriod, BudgetPeriodCreate, BudgetPeriodUpdate]):
    def get_current_period(
        self, db: Session, *, budget_id: UUID, current_date: Optional[datetime] = None
    ) -> Optional[BudgetPeriod]:
        if current_date is None:
            current_date = datetime.now()

        return (
            db.query(BudgetPeriod)
            .filter(
                and_(
                    BudgetPeriod.budget_id == budget_id,
                    BudgetPeriod.data_inicio <= current_date,
                    BudgetPeriod.data_fim >= current_date,
                )
            )
            .first()
        )

    def get_by_period(
        self,
        db: Session,
        *,
        budget_id: UUID,
        ano: int,
        mes: int,
        quinzena: Optional[int] = None,
        semana: Optional[int] = None,
    ) -> Optional[BudgetPeriod]:
        query = db.query(BudgetPeriod).filter(
            and_(
                BudgetPeriod.budget_id == budget_id,
                BudgetPeriod.ano == ano,
                BudgetPeriod.mes == mes,
            )
        )

        if quinzena is not None:
            query = query.filter(BudgetPeriod.quinzena == quinzena)
        if semana is not None:
            query = query.filter(BudgetPeriod.semana == semana)

        return query.first()

    def update_valor_gasto(
        self, db: Session, *, period_id: UUID, valor_adicional: Decimal
    ) -> Optional[BudgetPeriod]:
        period = db.query(BudgetPeriod).filter(BudgetPeriod.id == period_id).first()
        if not period:
            return None

        period.valor_gasto += valor_adicional

        # Atualizar status se necessário
        if period.valor_gasto > period.valor_limite:
            period.status = "excedido"
        elif period.status == "excedido" and period.valor_gasto <= period.valor_limite:
            period.status = "ativo"

        db.add(period)
        db.commit()
        db.refresh(period)
        return period

    def get_periods_for_alert(
        self, db: Session, *, usuario_id: UUID, percentual_minimo: float = 80.0
    ) -> List[BudgetPeriod]:
        """Busca períodos que precisam de alerta."""
        current_date = datetime.now()

        return (
            db.query(BudgetPeriod)
            .join(Budget)
            .filter(
                and_(
                    Budget.usuario_id == usuario_id,
                    Budget.ativo,
                    BudgetPeriod.status == "ativo",
                    BudgetPeriod.data_inicio <= current_date,
                    BudgetPeriod.data_fim >= current_date,
                    not BudgetPeriod.alerta_enviado,
                    (BudgetPeriod.valor_gasto / BudgetPeriod.valor_limite * 100)
                    >= percentual_minimo,
                )
            )
            .all()
        )

    def create_period_for_budget(
        self, db: Session, *, budget: Budget, target_date: Optional[datetime] = None
    ) -> Optional[BudgetPeriod]:
        """Cria automaticamente um período para um orçamento."""
        if target_date is None:
            target_date = datetime.now()

        year = target_date.year
        month = target_date.month

        # Calcular datas de início e fim baseado na periodicidade
        if budget.periodicidade == "mensal":
            data_inicio = datetime(year, month, 1)
            last_day = calendar.monthrange(year, month)[1]
            data_fim = datetime(year, month, last_day, 23, 59, 59)
            quinzena = None
            semana = None

        elif budget.periodicidade == "quinzenal":
            if target_date.day <= 15:
                # Primeira quinzena
                data_inicio = datetime(year, month, 1)
                data_fim = datetime(year, month, 15, 23, 59, 59)
                quinzena = 1
            else:
                # Segunda quinzena
                data_inicio = datetime(year, month, 16)
                last_day = calendar.monthrange(year, month)[1]
                data_fim = datetime(year, month, last_day, 23, 59, 59)
                quinzena = 2
            semana = None

        elif budget.periodicidade == "semanal":
            # Calcular semana do mês (simplificado)
            semana = (target_date.day - 1) // 7 + 1
            week_start = (semana - 1) * 7 + 1
            week_end = min(week_start + 6, calendar.monthrange(year, month)[1])

            data_inicio = datetime(year, month, week_start)
            data_fim = datetime(year, month, week_end, 23, 59, 59)
            quinzena = None

        # Verificar se período já existe
        existing = self.get_by_period(
            db,
            budget_id=budget.id,
            ano=year,
            mes=month,
            quinzena=quinzena,
            semana=semana,
        )

        if existing:
            return existing

        # Criar novo período
        period_data = BudgetPeriodCreate(
            budget_id=budget.id,
            ano=year,
            mes=month,
            quinzena=quinzena,
            semana=semana,
            valor_limite=budget.valor_limite,
            data_inicio=data_inicio,
            data_fim=data_fim,
        )

        return self.create(db, obj_in=period_data)


budget = CRUDBudget(Budget)
budget_period = CRUDBudgetPeriod(BudgetPeriod)

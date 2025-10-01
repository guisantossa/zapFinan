from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanUpdate


class CRUDPlan(CRUDBase[Plan, PlanCreate, PlanUpdate]):
    """CRUD operations for Plan model with enhanced functionality."""

    # ========================================================================
    # Read Operations
    # ========================================================================

    def get_all_active(self, db: Session) -> List[Plan]:
        """
        Obter todos os planos ativos ordenados por display_order.

        Returns:
            Lista de planos ativos
        """
        return (
            db.query(Plan)
            .filter(Plan.is_active.is_(True))
            .order_by(Plan.display_order.asc())
            .all()
        )

    def get_all(self, db: Session, *, include_inactive: bool = False) -> List[Plan]:
        """
        Obter todos os planos (ativos ou incluindo inativos).

        Args:
            include_inactive: Se True, inclui planos inativos

        Returns:
            Lista de planos
        """
        query = db.query(Plan)

        if not include_inactive:
            query = query.filter(Plan.is_active.is_(True))

        return query.order_by(Plan.display_order.asc()).all()

    def get_by_name(self, db: Session, *, name: str) -> Optional[Plan]:
        """
        Obter plano por nome.

        Args:
            name: Nome do plano

        Returns:
            Plano ou None
        """
        return db.query(Plan).filter(Plan.nome == name).first()

    def get_default_plan(self, db: Session) -> Optional[Plan]:
        """
        Obter o plano padrão (para novos usuários).

        Returns:
            Plano padrão ou None
        """
        return (
            db.query(Plan)
            .filter(and_(Plan.is_default.is_(True), Plan.is_active.is_(True)))
            .first()
        )

    # ========================================================================
    # Create/Update Operations
    # ========================================================================

    def create(self, db: Session, *, obj_in: PlanCreate) -> Plan:
        """
        Criar novo plano.

        Se is_default=True, remove flag de outros planos.
        """
        # Se é plano padrão, remover flag de outros
        if obj_in.is_default:
            self._remove_default_from_others(db)

        return super().create(db, obj_in=obj_in)

    def update(self, db: Session, *, db_obj: Plan, obj_in: PlanUpdate) -> Plan:
        """
        Atualizar plano existente.

        Se is_default=True, remove flag de outros planos.
        """
        # Se está definindo como padrão, remover flag de outros
        if obj_in.is_default:
            self._remove_default_from_others(db, exclude_id=db_obj.id)

        return super().update(db, db_obj=db_obj, obj_in=obj_in)

    def activate(self, db: Session, *, plan_id: int) -> Plan:
        """
        Ativar plano.

        Args:
            plan_id: ID do plano

        Returns:
            Plano ativado
        """
        plan = self.get(db, id=plan_id)
        if plan:
            plan.is_active = True
            plan.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(plan)
        return plan

    def deactivate(self, db: Session, *, plan_id: int) -> Plan:
        """
        Desativar plano (soft delete).

        Args:
            plan_id: ID do plano

        Returns:
            Plano desativado
        """
        plan = self.get(db, id=plan_id)
        if plan:
            plan.is_active = False
            plan.is_default = False  # Não pode ser padrão se inativo
            plan.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(plan)
        return plan

    def set_as_default(self, db: Session, *, plan_id: int) -> Plan:
        """
        Definir plano como padrão.

        Remove flag is_default de outros planos.

        Args:
            plan_id: ID do plano

        Returns:
            Plano definido como padrão
        """
        self._remove_default_from_others(db, exclude_id=plan_id)

        plan = self.get(db, id=plan_id)
        if plan:
            plan.is_default = True
            plan.is_active = True  # Plano padrão deve estar ativo
            plan.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(plan)
        return plan

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def _remove_default_from_others(
        self, db: Session, exclude_id: Optional[int] = None
    ) -> None:
        """
        Remover flag is_default de outros planos.

        Args:
            exclude_id: ID do plano a excluir da operação
        """
        query = db.query(Plan).filter(Plan.is_default.is_(True))

        if exclude_id:
            query = query.filter(Plan.id != exclude_id)

        plans = query.all()
        for plan in plans:
            plan.is_default = False
            plan.updated_at = datetime.utcnow()

        db.commit()


plan = CRUDPlan(Plan)

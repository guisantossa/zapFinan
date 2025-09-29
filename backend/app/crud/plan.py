from typing import List

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanUpdate


class CRUDPlan(CRUDBase[Plan, PlanCreate, PlanUpdate]):
    def get_all_active(self, db: Session) -> List[Plan]:
        """Obter todos os planos disponíveis."""
        return db.query(Plan).all()

    def get_by_name(self, db: Session, *, name: str) -> Plan:
        """Obter plano por nome."""
        return db.query(Plan).filter(Plan.nome == name).first()


plan = CRUDPlan(Plan)

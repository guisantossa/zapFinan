from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import plan
from app.schemas.plan import Plan

router = APIRouter()


@router.get("/", response_model=List[Plan])
async def list_plans(db: Session = Depends(get_db)):
    """Listar todos os planos disponíveis."""
    plans = plan.get_all_active(db=db)
    return plans


@router.get("/{plan_id}", response_model=Plan)
async def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Obter detalhes de um plano específico."""
    db_plan = plan.get(db=db, id=plan_id)
    if not db_plan:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado"
        )
    return db_plan

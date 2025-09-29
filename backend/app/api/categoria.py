from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_database
from app.crud.category import category
from app.schemas.category import Category

router = APIRouter()


@router.get("/categorias/", response_model=List[Category])
def listar_categorias(db: Session = Depends(get_database)):
    """Lista todas as categorias disponíveis."""
    return category.get_multi(db)


@router.get("/categorias/{tipo}", response_model=List[Category])
def listar_categorias_por_tipo(tipo: str, db: Session = Depends(get_database)):
    """Lista categorias por tipo (despesa ou receita)."""
    return category.get_by_tipo(db, tipo=tipo)

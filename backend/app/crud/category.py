from typing import List

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    def get_by_tipo(self, db: Session, *, tipo: str) -> List[Category]:
        return db.query(Category).filter(Category.tipo == tipo).all()

    def get_by_nome(self, db: Session, *, nome: str) -> Category:
        return db.query(Category).filter(Category.nome == nome).first()


category = CRUDCategory(Category)

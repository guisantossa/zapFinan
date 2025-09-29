from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_telefone(self, db: Session, *, telefone: str) -> Optional[User]:
        return db.query(User).filter(User.telefone == telefone).first()

    def get_by_token(self, db: Session, *, token: UUID) -> Optional[User]:
        return db.query(User).filter(User.token == token).first()

    def authenticate(
        self, db: Session, *, telefone: str, token: UUID
    ) -> Optional[User]:
        user = self.get_by_telefone(db, telefone=telefone)
        if not user:
            return None
        if user.token != token:
            return None
        return user


user = CRUDUser(User)

"""
CRUD operations for UserPhone model
"""

import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.user_phone import UserPhone
from app.schemas.user_phone import UserPhoneCreate, UserPhoneUpdate


class CRUDUserPhone(CRUDBase[UserPhone, UserPhoneCreate, UserPhoneUpdate]):
    """CRUD operations for user phones with business logic."""

    # ========================================================================
    # Read Operations
    # ========================================================================

    def get_by_phone_number(
        self, db: Session, *, phone_number: str
    ) -> Optional[UserPhone]:
        """Buscar telefone pelo número."""
        return (
            db.query(UserPhone).filter(UserPhone.phone_number == phone_number).first()
        )

    def get_by_lid(self, db: Session, *, lid: str) -> Optional[UserPhone]:
        """Buscar telefone pelo LID (WhatsApp/N8N identifier)."""
        # Remove @ se presente
        clean_lid = lid.lstrip("@")
        return db.query(UserPhone).filter(UserPhone.lid == clean_lid).first()

    def get_primary_phone(self, db: Session, *, user_id: UUID) -> Optional[UserPhone]:
        """Buscar telefone principal do usuário."""
        return (
            db.query(UserPhone)
            .filter(
                and_(
                    UserPhone.user_id == user_id,
                    UserPhone.is_primary.is_(True),
                    UserPhone.is_active.is_(True),
                )
            )
            .first()
        )

    def get_user_phones(
        self, db: Session, *, user_id: UUID, active_only: bool = True
    ) -> List[UserPhone]:
        """Listar todos telefones de um usuário."""
        query = db.query(UserPhone).filter(UserPhone.user_id == user_id)

        if active_only:
            query = query.filter(UserPhone.is_active.is_(True))

        return query.order_by(
            UserPhone.is_primary.desc(), UserPhone.created_at.asc()  # Primary first
        ).all()

    def count_user_phones(
        self, db: Session, *, user_id: UUID, active_only: bool = True
    ) -> int:
        """Contar telefones de um usuário."""
        query = db.query(func.count(UserPhone.id)).filter(UserPhone.user_id == user_id)

        if active_only:
            query = query.filter(UserPhone.is_active.is_(True))

        return query.scalar()

    # ========================================================================
    # Create Operations
    # ========================================================================

    def create_phone(
        self,
        db: Session,
        *,
        user_id: UUID,
        phone_number: str,
        is_primary: bool = False,
        is_verified: bool = False,
    ) -> UserPhone:
        """Criar novo telefone para usuário."""

        # Verificar se telefone já existe
        existing = self.get_by_phone_number(db, phone_number=phone_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered",
            )

        # Verificar se é o primeiro telefone
        phone_count = self.count_user_phones(db, user_id=user_id)
        if phone_count == 0:
            is_primary = True  # Primeiro telefone é sempre primary

        # Se está definindo como primary, remover primary de outros
        if is_primary:
            self._remove_primary_from_others(db, user_id=user_id)

        # Criar telefone
        db_phone = UserPhone(
            user_id=user_id,
            phone_number=phone_number,
            is_primary=is_primary,
            is_verified=is_verified,
            is_active=True,
            verified_at=datetime.utcnow() if is_verified else None,
        )

        db.add(db_phone)
        db.commit()
        db.refresh(db_phone)

        return db_phone

    # ========================================================================
    # Update Operations
    # ========================================================================

    def set_primary_phone(
        self, db: Session, *, phone_id: UUID, user_id: UUID
    ) -> UserPhone:
        """Definir telefone como principal."""

        # Buscar telefone
        phone = (
            db.query(UserPhone)
            .filter(and_(UserPhone.id == phone_id, UserPhone.user_id == user_id))
            .first()
        )

        if not phone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Phone not found"
            )

        if not phone.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot set inactive phone as primary",
            )

        # Remover primary de outros telefones
        self._remove_primary_from_others(db, user_id=user_id)

        # Definir como primary
        phone.is_primary = True
        phone.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(phone)

        return phone

    def deactivate_phone(
        self, db: Session, *, phone_id: UUID, user_id: UUID
    ) -> UserPhone:
        """Desativar telefone."""

        # Buscar telefone
        phone = (
            db.query(UserPhone)
            .filter(and_(UserPhone.id == phone_id, UserPhone.user_id == user_id))
            .first()
        )

        if not phone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Phone not found"
            )

        # Verificar se pode desativar
        active_count = self.count_user_phones(db, user_id=user_id, active_only=True)

        if phone.is_primary and active_count == 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the only active phone",
            )

        # Desativar
        phone.is_active = False
        phone.updated_at = datetime.utcnow()

        # Se era primary, promover outro
        if phone.is_primary:
            phone.is_primary = False
            self._promote_next_phone_to_primary(db, user_id=user_id)

        db.commit()
        db.refresh(phone)

        return phone

    def verify_phone(
        self, db: Session, *, phone_id: UUID, user_id: UUID, verification_token: str
    ) -> UserPhone:
        """Verificar telefone com token."""

        # Buscar telefone primeiro (para debug melhor)
        phone = (
            db.query(UserPhone)
            .filter(and_(UserPhone.id == phone_id, UserPhone.user_id == user_id))
            .first()
        )

        if not phone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Phone not found"
            )

        # Limpar token recebido (remover espaços, etc)
        clean_token = verification_token.strip()

        # Verificar se o token bate
        if not phone.verification_token or phone.verification_token != clean_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid verification token",
            )

        # Verificar expiração
        if (
            phone.verification_expires
            and datetime.utcnow() > phone.verification_expires
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Verification token expired",
            )

        # Marcar como verificado
        phone.is_verified = True
        phone.verified_at = datetime.utcnow()
        phone.verification_token = None
        phone.verification_expires = None
        phone.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(phone)

        return phone

    def generate_verification_token(
        self, db: Session, *, phone_id: UUID, user_id: UUID
    ) -> str:
        """Gerar token de verificação SMS."""

        phone = (
            db.query(UserPhone)
            .filter(and_(UserPhone.id == phone_id, UserPhone.user_id == user_id))
            .first()
        )

        if not phone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Phone not found"
            )

        # Gerar token de 6 dígitos
        token = "".join([str(secrets.randbelow(10)) for _ in range(6)])

        phone.verification_token = token
        phone.verification_expires = datetime.utcnow() + timedelta(minutes=5)
        phone.updated_at = datetime.utcnow()

        db.commit()

        return token

    # ========================================================================
    # Delete Operations
    # ========================================================================

    def delete_phone(self, db: Session, *, phone_id: UUID, user_id: UUID) -> bool:
        """Remover telefone permanentemente."""

        # Buscar telefone
        phone = (
            db.query(UserPhone)
            .filter(and_(UserPhone.id == phone_id, UserPhone.user_id == user_id))
            .first()
        )

        if not phone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Phone not found"
            )

        # Verificar se pode remover
        total_phones = (
            db.query(func.count(UserPhone.id))
            .filter(UserPhone.user_id == user_id)
            .scalar()
        )

        if phone.is_primary and total_phones == 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the only phone. Add another phone first.",
            )

        # Se era primary, promover outro
        was_primary = phone.is_primary

        # Remover
        db.delete(phone)
        db.commit()

        # Promover outro se necessário
        if was_primary:
            self._promote_next_phone_to_primary(db, user_id=user_id)

        return True

    # ========================================================================
    # Helper Methods (Private)
    # ========================================================================

    def _remove_primary_from_others(self, db: Session, user_id: UUID) -> None:
        """Remover flag is_primary de outros telefones do usuário."""
        db.query(UserPhone).filter(
            and_(UserPhone.user_id == user_id, UserPhone.is_primary.is_(True))
        ).update(
            {UserPhone.is_primary: False, UserPhone.updated_at: datetime.utcnow()},
            synchronize_session=False,
        )
        db.commit()

    def _promote_next_phone_to_primary(self, db: Session, user_id: UUID) -> None:
        """Promover próximo telefone ativo a primary."""
        next_phone = (
            db.query(UserPhone)
            .filter(and_(UserPhone.user_id == user_id, UserPhone.is_active.is_(True)))
            .order_by(UserPhone.created_at.asc())
            .first()
        )

        if next_phone:
            next_phone.is_primary = True
            next_phone.updated_at = datetime.utcnow()
            db.commit()


# Singleton instance
user_phone = CRUDUserPhone(UserPhone)

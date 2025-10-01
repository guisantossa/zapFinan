from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from dateutil.relativedelta import relativedelta
from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.commitment import Commitment, UserGoogleAuth
from app.schemas.commitment import (
    CommitmentCreate,
    CommitmentUpdate,
    UserGoogleAuthCreate,
    UserGoogleAuthUpdate,
)


class CRUDCommitment(CRUDBase[Commitment, CommitmentCreate, CommitmentUpdate]):
    def get_by_user(
        self,
        db: Session,
        *,
        usuario_id: UUID,
        skip: int = 0,
        limit: int = 100,
        status_filter: Optional[str] = None,
        tipo_filter: Optional[str] = None,
    ) -> List[Commitment]:
        query = db.query(Commitment).filter(Commitment.usuario_id == usuario_id)

        if status_filter:
            query = query.filter(Commitment.status == status_filter)
        if tipo_filter:
            query = query.filter(Commitment.tipo == tipo_filter)

        return (
            query.order_by(desc(Commitment.data_inicio)).offset(skip).limit(limit).all()
        )

    def get_by_period(
        self,
        db: Session,
        *,
        usuario_id: UUID,
        data_inicio: datetime,
        data_fim: datetime,
        status_filter: Optional[str] = None,
    ) -> List[Commitment]:
        """Busca compromissos em um período específico."""
        query = db.query(Commitment).filter(
            and_(
                Commitment.usuario_id == usuario_id,
                # Compromisso se sobrepõe ao período
                or_(
                    and_(
                        Commitment.data_inicio >= data_inicio,
                        Commitment.data_inicio <= data_fim,
                    ),
                    and_(
                        Commitment.data_fim >= data_inicio,
                        Commitment.data_fim <= data_fim,
                    ),
                    and_(
                        Commitment.data_inicio <= data_inicio,
                        Commitment.data_fim >= data_fim,
                    ),
                ),
            )
        )

        if status_filter:
            query = query.filter(Commitment.status == status_filter)

        return query.order_by(Commitment.data_inicio).all()

    def get_proximos_compromissos(
        self, db: Session, *, usuario_id: UUID, limite_horas: int = 24, limit: int = 10
    ) -> List[Commitment]:
        """Busca próximos compromissos nas próximas X horas."""
        now = datetime.now()
        limite_data = now + timedelta(hours=limite_horas)

        return (
            db.query(Commitment)
            .filter(
                and_(
                    Commitment.usuario_id == usuario_id,
                    Commitment.data_inicio >= now,
                    Commitment.data_inicio <= limite_data,
                    Commitment.status == "agendado",
                )
            )
            .order_by(Commitment.data_inicio)
            .limit(limit)
            .all()
        )

    def get_compromissos_para_lembrete(
        self, db: Session, *, minutos_antecedencia: int = 30
    ) -> List[Commitment]:
        """Busca compromissos que precisam de lembrete."""
        now = datetime.now()
        inicio_janela = now + timedelta(
            minutes=minutos_antecedencia - 5
        )  # 5 min de tolerância
        fim_janela = now + timedelta(minutes=minutos_antecedencia + 5)

        return (
            db.query(Commitment)
            .filter(
                and_(
                    Commitment.lembrete_whatsapp,
                    Commitment.status == "agendado",
                    Commitment.data_inicio >= inicio_janela,
                    Commitment.data_inicio <= fim_janela,
                )
            )
            .all()
        )

    def get_pendentes_sincronizacao(
        self, db: Session, *, usuario_id: Optional[UUID] = None, limit: int = 100
    ) -> List[Commitment]:
        """Busca compromissos que precisam ser sincronizados com Google."""
        query = db.query(Commitment).filter(Commitment.precisa_sincronizar)

        if usuario_id:
            query = query.filter(Commitment.usuario_id == usuario_id)

        return query.limit(limit).all()

    def create_with_sync_flag(
        self, db: Session, *, obj_in: CommitmentCreate
    ) -> Commitment:
        """Cria compromisso marcando para sincronização."""
        commitment = self.create(db, obj_in=obj_in)

        # Verificar se usuário tem Google conectado
        google_auth = (
            db.query(UserGoogleAuth)
            .filter(
                and_(
                    UserGoogleAuth.usuario_id == obj_in.usuario_id,
                    UserGoogleAuth.ativo,
                )
            )
            .first()
        )

        if google_auth:
            commitment.precisa_sincronizar = True
        else:
            commitment.precisa_sincronizar = False

        db.add(commitment)
        db.commit()
        db.refresh(commitment)
        return commitment

    def create_recurrence_instances(
        self,
        db: Session,
        *,
        commitment: Commitment,
        quantidade_maxima: int = 52,  # Máximo 1 ano de recorrência
    ) -> List[Commitment]:
        """Cria instâncias de recorrência para um compromisso."""
        if commitment.recorrencia == "nenhuma":
            return []

        instances = []
        current_date = commitment.data_inicio
        commitment_duration = commitment.data_fim - commitment.data_inicio

        for i in range(1, quantidade_maxima + 1):
            # Calcular próxima data baseada na recorrência
            if commitment.recorrencia == "diaria":
                next_date = current_date + timedelta(days=i)
            elif commitment.recorrencia == "semanal":
                next_date = current_date + timedelta(weeks=i)
            elif commitment.recorrencia == "mensal":
                next_date = current_date + relativedelta(months=i)
            elif commitment.recorrencia == "anual":
                next_date = current_date + relativedelta(years=i)
            else:
                break

            # Verificar se está dentro do limite da recorrência
            if (
                commitment.recorrencia_ate
                and next_date.date() > commitment.recorrencia_ate
            ):
                break

            # Criar nova instância
            new_instance = CommitmentCreate(
                usuario_id=commitment.usuario_id,
                titulo=commitment.titulo,
                descricao=commitment.descricao,
                data_inicio=next_date,
                data_fim=next_date + commitment_duration,
                tipo=commitment.tipo,
                status="agendado",
                recorrencia="nenhuma",  # Instâncias filhas não são recorrentes
                lembrete_whatsapp=commitment.lembrete_whatsapp,
                minutos_antes_lembrete=commitment.minutos_antes_lembrete,
            )

            instance = self.create(db, obj_in=new_instance)
            instance.compromisso_pai_id = commitment.id
            db.add(instance)
            instances.append(instance)

        db.commit()
        return instances


class CRUDUserGoogleAuth(
    CRUDBase[UserGoogleAuth, UserGoogleAuthCreate, UserGoogleAuthUpdate]
):
    def get_by_user(self, db: Session, *, usuario_id: UUID) -> Optional[UserGoogleAuth]:
        return (
            db.query(UserGoogleAuth)
            .filter(UserGoogleAuth.usuario_id == usuario_id)
            .first()
        )

    def is_token_expired(self, auth: UserGoogleAuth) -> bool:
        """Verifica se o token expirou."""
        from datetime import timezone

        if not auth.google_token_expiry:
            return True
        return datetime.now(timezone.utc) >= auth.google_token_expiry

    def get_active_users_with_google(self, db: Session) -> List[UserGoogleAuth]:
        """Busca usuários com Google ativo."""
        return db.query(UserGoogleAuth).filter(UserGoogleAuth.ativo).all()

    def update_tokens(
        self,
        db: Session,
        *,
        auth: UserGoogleAuth,
        access_token: str,
        refresh_token: Optional[str] = None,
        token_expiry: Optional[datetime] = None,
    ) -> UserGoogleAuth:
        """Atualiza tokens de acesso."""
        update_data = {
            "google_access_token": access_token,
            "ultima_sincronizacao": datetime.now(),
        }

        if refresh_token:
            update_data["google_refresh_token"] = refresh_token
        if token_expiry:
            update_data["google_token_expiry"] = token_expiry

        return self.update(db, db_obj=auth, obj_in=update_data)


commitment = CRUDCommitment(Commitment)
user_google_auth = CRUDUserGoogleAuth(UserGoogleAuth)

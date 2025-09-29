import uuid

from sqlalchemy import (
    UUID,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Commitment(Base):
    """Modelo de compromissos/agenda do usuário."""

    __tablename__ = "commitments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Dados do compromisso
    titulo = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=True)
    data_inicio = Column(DateTime(timezone=True), nullable=False, index=True)
    data_fim = Column(DateTime(timezone=True), nullable=False, index=True)

    # Tipo e status
    tipo = Column(
        String(50), nullable=False, default="evento"
    )  # reuniao, pagamento, evento, lembrete, aniversario
    status = Column(
        String(20), nullable=False, default="agendado"
    )  # agendado, concluido, cancelado, adiado

    # Recorrência
    recorrencia = Column(
        String(20), nullable=False, default="nenhuma"
    )  # nenhuma, diaria, semanal, mensal, anual
    recorrencia_ate = Column(Date, nullable=True)  # Data limite para recorrência
    compromisso_pai_id = Column(
        UUID(as_uuid=True), ForeignKey("commitments.id"), nullable=True
    )  # Para recorrência

    # Integração Google Calendar
    google_event_id = Column(String(200), nullable=True, index=True)
    sincronizado_google = Column(Boolean, default=False, nullable=False)
    ultima_sincronizacao = Column(DateTime(timezone=True), nullable=True)
    precisa_sincronizar = Column(Boolean, default=True, nullable=False)

    # Configurações de lembrete
    lembrete_whatsapp = Column(Boolean, default=True, nullable=False)
    minutos_antes_lembrete = Column(Integer, default=30)  # Minutos antes para lembrete

    # Metadados
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "tipo IN ('reuniao', 'pagamento', 'evento', 'lembrete', 'aniversario')",
            name="check_commitment_tipo",
        ),
        CheckConstraint(
            "status IN ('agendado', 'concluido', 'cancelado', 'adiado')",
            name="check_commitment_status",
        ),
        CheckConstraint(
            "recorrencia IN ('nenhuma', 'diaria', 'semanal', 'mensal', 'anual')",
            name="check_commitment_recorrencia",
        ),
        CheckConstraint("data_fim >= data_inicio", name="check_commitment_dates"),
    )

    # Relationships
    usuario = relationship("User", back_populates="commitments")
    filhos_recorrencia = relationship(
        "Commitment", back_populates="pai_recorrencia", cascade="all, delete-orphan"
    )
    pai_recorrencia = relationship(
        "Commitment", remote_side=[id], back_populates="filhos_recorrencia"
    )


class UserGoogleAuth(Base):
    """Autenticação Google Calendar por usuário."""

    __tablename__ = "user_google_auth"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # OAuth2 Tokens
    google_access_token = Column(Text, nullable=False)
    google_refresh_token = Column(Text, nullable=True)
    google_token_expiry = Column(DateTime(timezone=True), nullable=True)

    # Google Calendar
    google_calendar_id = Column(
        String(200), nullable=True
    )  # ID do calendário principal
    google_email = Column(String(200), nullable=True)

    # Status
    ativo = Column(Boolean, default=True, nullable=False)
    ultima_sincronizacao = Column(DateTime(timezone=True), nullable=True)

    # Metadados
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    usuario = relationship("User", back_populates="google_auth")

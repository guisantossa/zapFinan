import uuid

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Budget(Base):
    """Configuração base de orçamento por categoria."""

    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    categoria_id = Column(
        Integer, ForeignKey("categories.id"), nullable=False, index=True
    )
    nome = Column(String(100), nullable=False)  # "Orçamento Alimentação"
    valor_limite = Column(Numeric(10, 2), nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    notificar_em = Column(Numeric(5, 2), default=80.0)  # Percentual para alertas

    # Periodicidade: 'mensal', 'quinzenal', 'semanal'
    periodicidade = Column(String(20), default="mensal", nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    usuario = relationship("User", back_populates="budgets")
    categoria = relationship("Category", back_populates="budgets")
    periods = relationship(
        "BudgetPeriod", back_populates="budget", cascade="all, delete-orphan"
    )


class BudgetPeriod(Base):
    """Instâncias automáticas de períodos de orçamento."""

    __tablename__ = "budget_periods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    budget_id = Column(
        UUID(as_uuid=True),
        ForeignKey("budgets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Identificadores de período
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)  # 1-12
    quinzena = Column(Integer, nullable=True)  # 1 ou 2 (para periodicidade quinzenal)
    semana = Column(Integer, nullable=True)  # 1-4 (para periodicidade semanal)

    # Valores do período
    valor_limite = Column(Numeric(10, 2), nullable=False)  # Copiado do budget pai
    valor_gasto = Column(Numeric(10, 2), default=0, nullable=False)

    # Status: 'ativo', 'excedido', 'finalizado'
    status = Column(String(20), default="ativo", nullable=False)

    # Data de início e fim do período
    data_inicio = Column(DateTime(timezone=True), nullable=False)
    data_fim = Column(DateTime(timezone=True), nullable=False)

    # Controle de alertas
    alerta_enviado = Column(Boolean, default=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    budget = relationship("Budget", back_populates="periods")

    # Índice composto para evitar duplicatas
    __table_args__ = (
        UniqueConstraint(
            "budget_id", "ano", "mes", "quinzena", "semana", name="uq_budget_period"
        ),
    )

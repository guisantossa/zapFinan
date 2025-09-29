import uuid

from sqlalchemy import (
    UUID,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mensagem_original = Column(String, nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    descricao = Column(String(200), nullable=False)
    tipo = Column(String(10), nullable=False)
    canal = Column(String(20))
    categoria_id = Column(Integer, ForeignKey("categories.id"))
    data_transacao = Column(Date, default=func.current_date())
    data_registro = Column(DateTime(timezone=True), server_default=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "tipo IN ('despesa', 'receita')", name="check_transaction_tipo"
        ),
        CheckConstraint(
            "canal IN ('audioMessage', 'conversation', 'imageMessage', 'webApp')",
            name="check_transaction_canal",
        ),
    )

    # Relationships
    usuario = relationship("User", back_populates="transactions")
    categoria = relationship("Category", back_populates="transactions")

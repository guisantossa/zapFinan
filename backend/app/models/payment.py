import uuid

from sqlalchemy import (
    UUID,
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


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plano_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    data_pagamento = Column(Date, nullable=True)
    metodo_pagamento = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False)
    external_id = Column(String(255), nullable=True, index=True)
    criado_em = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    valor = Column(Numeric(10, 2), nullable=False)

    # Relationships
    usuario = relationship("User", back_populates="payments")
    plano = relationship("Plan", back_populates="payments")

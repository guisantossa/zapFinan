import uuid

from sqlalchemy import UUID, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Consent(Base):
    __tablename__ = "consentimentos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    aceitou_em = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    politica_versao = Column(String(20), nullable=False)

    # Relationships
    usuario = relationship("User", back_populates="consentimentos")

from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    valor_mensal = Column(Numeric(10, 2), nullable=False)
    valor_anual = Column(Numeric(10, 2), nullable=False)

    # Relationships
    users = relationship("User", back_populates="plano")
    payments = relationship("Payment", back_populates="plano")

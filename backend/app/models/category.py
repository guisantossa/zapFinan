from sqlalchemy import CheckConstraint, Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), unique=True, nullable=False)
    tipo = Column(String(10), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint("tipo IN ('despesa', 'receita')", name="check_category_tipo"),
    )

    # Relationships
    transactions = relationship("Transaction", back_populates="categoria")
    budgets = relationship("Budget", back_populates="categoria")

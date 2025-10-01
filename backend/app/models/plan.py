from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Plan(Base):
    """
    Plano de assinatura com features, limites e metadata.

    Features: O que o usuário PODE fazer
    Limits: QUANTO o usuário pode fazer (None = ilimitado)
    Metadata: Informações de exibição e controle
    """

    __tablename__ = "plans"

    # Basic Info
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    valor_mensal = Column(Numeric(10, 2), nullable=False)
    valor_anual = Column(Numeric(10, 2), nullable=False)

    # Features (boolean flags)
    transactions_enabled = Column(Boolean, nullable=False, default=True)
    budgets_enabled = Column(Boolean, nullable=False, default=True)
    commitments_enabled = Column(Boolean, nullable=False, default=True)
    reports_advanced = Column(Boolean, nullable=False, default=False)
    google_calendar_sync = Column(Boolean, nullable=False, default=False)
    multi_phone_enabled = Column(Boolean, nullable=False, default=True)
    api_access = Column(Boolean, nullable=False, default=False)
    priority_support = Column(Boolean, nullable=False, default=False)

    # Limits (None = unlimited)
    max_transactions_per_month = Column(Integer, nullable=True)
    max_budgets = Column(Integer, nullable=True)
    max_commitments = Column(Integer, nullable=True)
    max_categories = Column(Integer, nullable=True)
    max_phones = Column(Integer, nullable=True, default=1)
    data_retention_months = Column(Integer, nullable=False, default=12)

    # Metadata
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    is_default = Column(Boolean, nullable=False, default=False, index=True)
    display_order = Column(Integer, nullable=False, default=0, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=True)  # hex color or name
    features_json = Column(JSONB, nullable=True)  # custom features

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    users = relationship("User", back_populates="plano")
    payments = relationship("Payment", back_populates="plano")

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def has_feature(self, feature_name: str) -> bool:
        """
        Verificar se o plano tem uma feature específica.

        Args:
            feature_name: Nome da feature (ex: "budgets_enabled", "api_access")

        Returns:
            True se a feature está habilitada, False caso contrário
        """
        if not hasattr(self, feature_name):
            return False
        return getattr(self, feature_name, False)

    def get_limit(self, limit_name: str) -> Optional[int]:
        """
        Obter limite de um recurso. None = ilimitado.

        Args:
            limit_name: Nome do limite (ex: "max_budgets", "max_transactions_per_month")

        Returns:
            Valor do limite ou None se ilimitado
        """
        if not hasattr(self, limit_name):
            return None
        return getattr(self, limit_name)

    def is_within_limit(self, limit_name: str, current_count: int) -> bool:
        """
        Verificar se o uso atual está dentro do limite do plano.

        Args:
            limit_name: Nome do limite a verificar
            current_count: Contagem atual do recurso

        Returns:
            True se dentro do limite (ou ilimitado), False se excedeu
        """
        limit = self.get_limit(limit_name)

        # None = ilimitado
        if limit is None:
            return True

        return current_count < limit

    def __repr__(self):
        return f"<Plan(id={self.id}, nome='{self.nome}', active={self.is_active})>"

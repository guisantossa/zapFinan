from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel


class TransactionBase(BaseModel):
    mensagem_original: str
    valor: Decimal
    descricao: str
    tipo: Literal["despesa", "receita"]
    canal: Optional[
        Literal["audioMessage", "conversation", "imageMessage", "webApp"]
    ] = None
    categoria_id: Optional[int] = None
    data_transacao: Optional[date] = None


class TransactionCreate(TransactionBase):
    usuario_id: UUID


class TransactionUpdate(BaseModel):
    descricao: Optional[str] = None
    valor: Optional[Decimal] = None
    categoria_id: Optional[int] = None
    data_transacao: Optional[date] = None


class TransactionInDB(TransactionBase):
    id: UUID
    usuario_id: UUID
    data_registro: datetime

    class Config:
        from_attributes = True


class Transaction(TransactionInDB):
    pass


class TransactionWithCategory(Transaction):
    categoria: Optional["Category"] = None
    budget_alert: Optional[dict] = None  # Informações de alerta de orçamento, se houver

    class Config:
        from_attributes = True


# Additional schemas for API endpoints
class TransactionFilters(BaseModel):
    """Filtros para listagem de transações"""

    tipo: Optional[Literal["despesa", "receita"]] = None
    categoria_id: Optional[int] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


class TransactionStats(BaseModel):
    """Estatísticas de transações"""

    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    receitas: int
    despesas: int


class CategorySummary(BaseModel):
    """Resumo por categoria"""

    categoria_id: int
    categoria_nome: str
    tipo: str
    total_valor: Decimal
    total_transacoes: int


class PaginatedTransactions(BaseModel):
    """Transações paginadas"""

    items: List[TransactionWithCategory]
    total: int
    page: int
    size: int
    pages: int


# Import here to avoid circular imports
from .category import Category  # noqa: E402

TransactionWithCategory.model_rebuild()

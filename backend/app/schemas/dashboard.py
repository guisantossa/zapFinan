from decimal import Decimal
from typing import List

from pydantic import BaseModel


class ResumoFinanceiro(BaseModel):
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal


class GastoCategoria(BaseModel):
    categoria: str
    valor: Decimal


class TransacaoRecente(BaseModel):
    id: str
    valor: Decimal
    tipo: str
    categoria: str
    data: str
    descricao: str
    usuario_id: str


class EvolucaoDiaria(BaseModel):
    data: str
    receitas: Decimal
    despesas: Decimal
    saldo: Decimal


class DashboardData(BaseModel):
    resumo: ResumoFinanceiro
    gastos_por_categoria: List[GastoCategoria]
    transacoes_recentes: List[TransacaoRecente]
    evolucao_diaria: List[EvolucaoDiaria]
    mes_referencia: str


class PeriodSummary(BaseModel):
    periodo: dict
    resumo: dict

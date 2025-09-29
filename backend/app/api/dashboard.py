from datetime import date, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_database
from app.models.transaction import Transaction
from app.schemas.dashboard import (
    DashboardData,
    EvolucaoDiaria,
    GastoCategoria,
    PeriodSummary,
    ResumoFinanceiro,
    TransacaoRecente,
)

router = APIRouter()


def get_current_month_dates():
    """Retorna início e fim do mês atual."""
    today = date.today()
    start_of_month = today.replace(day=1)
    if today.month == 12:
        next_month_start = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month_start = today.replace(month=today.month + 1, day=1)
    end_of_month = next_month_start - timedelta(days=1)
    return start_of_month, end_of_month


def get_last_30_days_dates():
    """Retorna início e fim dos últimos 30 dias."""
    today = date.today()
    start_date = today - timedelta(days=30)
    return start_date, today


@router.get("/dashboard/{usuario_id}/dados", response_model=DashboardData)
def obter_dados_dashboard(
    *,
    db: Session = Depends(get_database),
    usuario_id: UUID,
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
):
    """Obter dados completos para o dashboard do usuário."""

    # Se não fornecidas datas, usar mês atual
    if not data_inicio or not data_fim:
        data_inicio, data_fim = get_current_month_dates()

    # Buscar todas as transações do período
    transacoes = (
        db.query(Transaction)
        .options(joinedload(Transaction.categoria))
        .filter(
            and_(
                Transaction.usuario_id == usuario_id,
                Transaction.data_transacao >= data_inicio,
                Transaction.data_transacao <= data_fim,
            )
        )
        .all()
    )

    # 1. Calcular resumo financeiro
    receitas = [t for t in transacoes if t.tipo == "receita"]
    despesas = [t for t in transacoes if t.tipo == "despesa"]

    total_receitas = sum(t.valor for t in receitas)
    total_despesas = sum(t.valor for t in despesas)
    saldo = total_receitas - total_despesas

    resumo = ResumoFinanceiro(
        total_receitas=total_receitas, total_despesas=total_despesas, saldo=saldo
    )

    # 2. Gastos por categoria (apenas despesas)
    gastos_categoria_dict = {}
    for transacao in despesas:
        categoria_nome = (
            transacao.categoria.nome if transacao.categoria else "Sem categoria"
        )
        if categoria_nome not in gastos_categoria_dict:
            gastos_categoria_dict[categoria_nome] = Decimal("0")
        gastos_categoria_dict[categoria_nome] += transacao.valor

    gastos_por_categoria = [
        GastoCategoria(categoria=categoria, valor=valor)
        for categoria, valor in gastos_categoria_dict.items()
    ]

    # 3. Transações recentes (últimas 10)
    transacoes_recentes = (
        db.query(Transaction)
        .options(joinedload(Transaction.categoria))
        .filter(Transaction.usuario_id == usuario_id)
        .order_by(desc(Transaction.data_transacao))
        .limit(10)
        .all()
    )

    transacoes_recentes_list = [
        TransacaoRecente(
            id=str(t.id),
            valor=t.valor,
            tipo=t.tipo,
            categoria=t.categoria.nome if t.categoria else "Sem categoria",
            data=t.data_transacao.isoformat() if t.data_transacao else "",
            descricao=t.descricao,
            usuario_id=str(t.usuario_id),
        )
        for t in transacoes_recentes
    ]

    # 4. Evolução diária (últimos 30 dias)
    start_30_days, end_30_days = get_last_30_days_dates()

    # Buscar transações dos últimos 30 dias
    transacoes_30_dias = (
        db.query(Transaction)
        .filter(
            and_(
                Transaction.usuario_id == usuario_id,
                Transaction.data_transacao >= start_30_days,
                Transaction.data_transacao <= end_30_days,
            )
        )
        .all()
    )

    # Agrupar por data
    dados_diarios = {}
    current_date = start_30_days
    while current_date <= end_30_days:
        dados_diarios[current_date] = {
            "receitas": Decimal("0"),
            "despesas": Decimal("0"),
        }
        current_date += timedelta(days=1)

    for transacao in transacoes_30_dias:
        data_transacao = transacao.data_transacao
        if data_transacao in dados_diarios:
            if transacao.tipo == "receita":
                dados_diarios[data_transacao]["receitas"] += transacao.valor
            else:
                dados_diarios[data_transacao]["despesas"] += transacao.valor

    # Calcular saldo acumulado
    evolucao_diaria = []
    saldo_acumulado = Decimal("0")

    for data_item in sorted(dados_diarios.keys()):
        dados_dia = dados_diarios[data_item]
        saldo_dia = dados_dia["receitas"] - dados_dia["despesas"]
        saldo_acumulado += saldo_dia

        evolucao_diaria.append(
            EvolucaoDiaria(
                data=data_item.isoformat(),
                receitas=dados_dia["receitas"],
                despesas=dados_dia["despesas"],
                saldo=saldo_acumulado,
            )
        )

    # 5. Mês de referência
    meses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ]
    mes_referencia = f"{meses[data_inicio.month - 1]} {data_inicio.year}"

    return DashboardData(
        resumo=resumo,
        gastos_por_categoria=gastos_por_categoria,
        transacoes_recentes=transacoes_recentes_list,
        evolucao_diaria=evolucao_diaria,
        mes_referencia=mes_referencia,
    )


@router.get("/dashboard/{usuario_id}/periodo", response_model=PeriodSummary)
def obter_resumo_periodo(
    *,
    db: Session = Depends(get_database),
    usuario_id: UUID,
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
):
    """Obter resumo financeiro para um período específico."""

    # Buscar transações do período
    transacoes = (
        db.query(Transaction)
        .filter(
            and_(
                Transaction.usuario_id == usuario_id,
                Transaction.data_transacao >= data_inicio,
                Transaction.data_transacao <= data_fim,
            )
        )
        .all()
    )

    # Calcular totais
    receitas = [t for t in transacoes if t.tipo == "receita"]
    despesas = [t for t in transacoes if t.tipo == "despesa"]

    total_receitas = sum(t.valor for t in receitas)
    total_despesas = sum(t.valor for t in despesas)
    saldo = total_receitas - total_despesas

    return PeriodSummary(
        periodo={
            "data_inicio": data_inicio.isoformat(),
            "data_fim": data_fim.isoformat(),
        },
        resumo={
            "total_receitas": total_receitas,
            "total_despesas": total_despesas,
            "saldo": saldo,
            "quantidade_receitas": len(receitas),
            "quantidade_despesas": len(despesas),
            "total_transacoes": len(transacoes),
        },
    )

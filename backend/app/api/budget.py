from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_database
from app.crud.budget import budget, budget_period
from app.crud.user import user
from app.schemas.budget import (
    Budget,
    BudgetCreate,
    BudgetPeriod,
    BudgetSummary,
    BudgetUpdate,
    BudgetWithCurrentPeriod,
)
from app.services.budget_service import budget_service

router = APIRouter()


@router.post("/orcamentos/", response_model=Budget)
def criar_orcamento(*, db: Session = Depends(get_database), budget_in: BudgetCreate):
    """Cria um novo orçamento para o usuário."""

    # Verificar se usuário existe
    db_user = user.get(db, id=budget_in.usuario_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Verificar se já existe orçamento ativo para esta categoria
    existing_budget = budget.get_by_user_and_category(
        db, usuario_id=budget_in.usuario_id, categoria_id=budget_in.categoria_id
    )

    if existing_budget:
        raise HTTPException(
            status_code=400, detail="Já existe um orçamento ativo para esta categoria"
        )

    # Criar orçamento
    db_budget = budget.create(db, obj_in=budget_in)

    # Criar período atual automaticamente
    budget_period.create_period_for_budget(db, budget=db_budget)

    return db_budget


@router.get("/orcamentos/", response_model=List[Budget])
def listar_orcamentos(
    *,
    db: Session = Depends(get_database),
    usuario_id: UUID,
    ativo_only: bool = Query(True, description="Apenas orçamentos ativos"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """Lista orçamentos do usuário."""
    return budget.get_by_user(
        db, usuario_id=usuario_id, ativo_only=ativo_only, skip=skip, limit=limit
    )


@router.get("/orcamentos/{budget_id}", response_model=BudgetWithCurrentPeriod)
def obter_orcamento(*, db: Session = Depends(get_database), budget_id: UUID):
    """Obtém detalhes de um orçamento específico com período atual."""
    db_budget = budget.get_with_current_period(db, budget_id=budget_id)
    if not db_budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    # Buscar período atual
    current_period = budget_period.get_current_period(db, budget_id=budget_id)

    # Retornar budget com período atual
    result = BudgetWithCurrentPeriod(**db_budget.__dict__)
    result.current_period = current_period
    return result


@router.put("/orcamentos/{budget_id}", response_model=Budget)
def atualizar_orcamento(
    *, db: Session = Depends(get_database), budget_id: UUID, budget_in: BudgetUpdate
):
    """Atualiza um orçamento existente."""
    db_budget = budget.get(db, id=budget_id)
    if not db_budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    # Se mudou valor_limite, criar novo período se necessário
    if budget_in.valor_limite and budget_in.valor_limite != db_budget.valor_limite:
        current_period = budget_period.get_current_period(db, budget_id=budget_id)
        if current_period:
            budget_period.update(
                db,
                db_obj=current_period,
                obj_in={"valor_limite": budget_in.valor_limite},
            )

    return budget.update(db, db_obj=db_budget, obj_in=budget_in)


@router.delete("/orcamentos/{budget_id}")
def excluir_orcamento(*, db: Session = Depends(get_database), budget_id: UUID):
    """Exclui um orçamento (soft delete - marca como inativo)."""
    db_budget = budget.get(db, id=budget_id)
    if not db_budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    # Soft delete - marcar como inativo
    budget.update(db, db_obj=db_budget, obj_in={"ativo": False})

    return {"message": "Orçamento excluído com sucesso"}


@router.get("/orcamentos/{budget_id}/resumo", response_model=BudgetSummary)
def resumo_orcamento(*, db: Session = Depends(get_database), budget_id: UUID):
    """Retorna resumo detalhado do orçamento para o dashboard."""
    db_budget = budget.get_with_current_period(db, budget_id=budget_id)
    if not db_budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    current_period = budget_period.get_current_period(db, budget_id=budget_id)

    if not current_period:
        raise HTTPException(status_code=404, detail="Período atual não encontrado")

    # Calcular percentual gasto
    percentual_gasto = (
        (current_period.valor_gasto / current_period.valor_limite * 100)
        if current_period.valor_limite > 0
        else 0
    )

    # Calcular dias restantes
    dias_restantes = (current_period.data_fim - datetime.now()).days

    return BudgetSummary(
        id=db_budget.id,
        nome=db_budget.nome,
        categoria_id=db_budget.categoria_id,
        categoria_nome=db_budget.categoria.nome if db_budget.categoria else None,
        valor_limite=current_period.valor_limite,
        valor_gasto=current_period.valor_gasto,
        percentual_gasto=percentual_gasto,
        status=current_period.status,
        periodicidade=db_budget.periodicidade,
        dias_restantes=max(0, dias_restantes),
        ativo=db_budget.ativo,
    )


@router.get(
    "/orcamentos/usuario/{usuario_id}/resumo", response_model=List[BudgetSummary]
)
def resumo_orcamentos_usuario(*, db: Session = Depends(get_database), usuario_id: UUID):
    """Retorna resumo de todos os orçamentos ativos do usuário."""
    user_budgets = budget.get_by_user(db, usuario_id=usuario_id, ativo_only=True)

    summaries = []
    for db_budget in user_budgets:
        current_period = budget_period.get_current_period(db, budget_id=db_budget.id)

        if current_period:
            # Calcular percentual gasto
            percentual_gasto = (
                (current_period.valor_gasto / current_period.valor_limite * 100)
                if current_period.valor_limite > 0
                else 0
            )

            # Calcular dias restantes
            if hasattr(current_period.data_fim, "date"):
                data_fim = current_period.data_fim.date()
            else:
                data_fim = current_period.data_fim

            if hasattr(datetime.now(), "date"):
                data_atual = datetime.now().date()
            else:
                data_atual = datetime.now()

            dias_restantes = (data_fim - data_atual).days

            summaries.append(
                BudgetSummary(
                    id=db_budget.id,
                    nome=db_budget.nome,
                    categoria_id=db_budget.categoria_id,
                    categoria_nome=(
                        db_budget.categoria.nome if db_budget.categoria else None
                    ),
                    valor_limite=current_period.valor_limite,
                    valor_gasto=current_period.valor_gasto,
                    percentual_gasto=percentual_gasto,
                    status=current_period.status,
                    periodicidade=db_budget.periodicidade,
                    dias_restantes=max(0, dias_restantes),
                    ativo=db_budget.ativo,
                )
            )

    return summaries


@router.post("/orcamentos/{budget_id}/criar-periodo")
def criar_periodo_manual(
    *,
    db: Session = Depends(get_database),
    budget_id: UUID,
    target_date: Optional[datetime] = None,
):
    """Cria manualmente um período para orçamento (normalmente automático)."""
    db_budget = budget.get(db, id=budget_id)
    if not db_budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    new_period = budget_period.create_period_for_budget(
        db, budget=db_budget, target_date=target_date
    )

    if not new_period:
        raise HTTPException(
            status_code=400, detail="Período já existe ou erro na criação"
        )

    return {"message": "Período criado com sucesso", "period_id": new_period.id}


@router.get("/orcamentos/{budget_id}/periodos", response_model=List[BudgetPeriod])
def listar_periodos_orcamento(
    *,
    db: Session = Depends(get_database),
    budget_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=100),  # Por padrão últimos 12 períodos
):
    """Lista histórico de períodos de um orçamento."""
    db_budget = budget.get(db, id=budget_id)
    if not db_budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    return (
        db.query(budget_period.model)
        .filter(budget_period.model.budget_id == budget_id)
        .order_by(budget_period.model.ano.desc(), budget_period.model.mes.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/orcamentos/usuario/{usuario_id}/alertas")
def verificar_alertas_orcamentos(
    *, db: Session = Depends(get_database), usuario_id: UUID
):
    """Verifica orçamentos que precisam de alerta e retorna informações."""
    budgets_for_alert = budget_service.get_budgets_for_alerts(db, str(usuario_id))

    alerts = []
    for item in budgets_for_alert:
        alerts.append(
            {
                "budget_id": item["budget"].id,
                "budget_name": item["budget"].nome,
                "categoria_nome": item["categoria_nome"],
                "percentual_gasto": round(item["percentual_gasto"], 2),
                "valor_limite": item["period"].valor_limite,
                "valor_gasto": item["period"].valor_gasto,
                "periodicidade": item["budget"].periodicidade,
                "period_id": item["period"].id,
            }
        )

    return {"total_alertas": len(alerts), "alertas": alerts}


@router.post("/orcamentos/periodos/{period_id}/marcar-alerta-enviado")
def marcar_alerta_enviado(*, db: Session = Depends(get_database), period_id: UUID):
    """Marca um período como alerta já enviado."""
    budget_service.mark_alert_sent(db, str(period_id))
    return {"message": "Alerta marcado como enviado"}


@router.post("/sistema/criar-proximos-periodos")
def criar_proximos_periodos_job(*, db: Session = Depends(get_database)):
    """Job automático para criar próximos períodos de orçamento."""
    created_periods = budget_service.create_next_periods_if_needed(db)

    return {
        "message": "Job executado com sucesso",
        "periodos_criados": len(created_periods),
        "detalhes": created_periods,
    }


@router.post("/sistema/recalcular-orcamentos")
def recalcular_todos_orcamentos(*, db: Session = Depends(get_database)):
    """Recalcula todos os valores gastos dos orçamentos\
        baseado nas transações existentes."""
    resultado = budget_service.recalculate_all_budgets(db)

    return {
        "message": "Recálculo executado com sucesso",
        "orcamentos_atualizados": resultado["updated_budgets"],
        "periodos_criados": resultado["created_periods"],
        "detalhes": resultado["details"],
    }


@router.post("/orcamentos/usuario/{usuario_id}/recalcular")
def recalcular_orcamentos_usuario(
    *, db: Session = Depends(get_database), usuario_id: UUID
):
    """Recalcula os valores gastos dos orçamentos de um usuário específico."""
    resultado = budget_service.recalculate_user_budgets(db, str(usuario_id))

    return {
        "message": "Recálculo do usuário executado com sucesso",
        "orcamentos_atualizados": resultado["updated_budgets"],
        "periodos_criados": resultado["created_periods"],
        "detalhes": resultado["details"],
    }

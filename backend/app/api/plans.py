from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.crud import plan
from app.models.user import User
from app.schemas.plan import (
    PlanCreate,
    PlanResponse,
    PlanUpdate,
    PlanWithFeatures,
)

router = APIRouter()


# ============================================================================
# Public Endpoints (Usuários)
# ============================================================================


@router.get("/", response_model=List[PlanWithFeatures])
async def list_plans(db: Session = Depends(get_db)):
    """
    Listar todos os planos ativos disponíveis.

    Retorna planos com features e limites para exibição ao usuário.
    """
    plans = plan.get_all_active(db=db)
    return plans


@router.get("/{plan_id}", response_model=PlanWithFeatures)
async def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Obter detalhes de um plano específico.

    Args:
        plan_id: ID do plano

    Returns:
        Detalhes completos do plano

    Raises:
        404: Plano não encontrado
    """
    db_plan = plan.get(db=db, id=plan_id)
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado"
        )
    return db_plan


# ============================================================================
# Admin Endpoints (Gerenciamento de Planos)
# ============================================================================

# TODO: Adicionar verificação de permissão de admin
# Temporariamente protegido apenas por autenticação


@router.get("/admin/all", response_model=List[PlanResponse])
async def admin_list_all_plans(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    [ADMIN] Listar todos os planos (incluindo inativos).

    Args:
        include_inactive: Se True, inclui planos inativos

    Returns:
        Lista completa de planos
    """
    plans = plan.get_all(db=db, include_inactive=include_inactive)
    return plans


@router.post(
    "/admin/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED
)
async def admin_create_plan(
    plan_data: PlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    [ADMIN] Criar novo plano.

    Se is_default=True, remove flag de outros planos automaticamente.

    Args:
        plan_data: Dados do novo plano

    Returns:
        Plano criado

    Raises:
        400: Nome do plano já existe
    """
    # Verificar se nome já existe
    existing = plan.get_by_name(db, name=plan_data.nome)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plano com nome '{plan_data.nome}' já existe",
        )

    new_plan = plan.create(db=db, obj_in=plan_data)
    return new_plan


@router.put("/admin/{plan_id}", response_model=PlanResponse)
async def admin_update_plan(
    plan_id: int,
    plan_data: PlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    [ADMIN] Atualizar plano existente.

    Se is_default=True, remove flag de outros planos automaticamente.

    Args:
        plan_id: ID do plano
        plan_data: Dados para atualização

    Returns:
        Plano atualizado

    Raises:
        404: Plano não encontrado
        400: Nome duplicado
    """
    db_plan = plan.get(db=db, id=plan_id)
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado"
        )

    # Verificar nome duplicado (se estiver sendo alterado)
    if plan_data.nome and plan_data.nome != db_plan.nome:
        existing = plan.get_by_name(db, name=plan_data.nome)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plano com nome '{plan_data.nome}' já existe",
            )

    updated_plan = plan.update(db=db, db_obj=db_plan, obj_in=plan_data)
    return updated_plan


@router.patch("/admin/{plan_id}/activate", response_model=PlanResponse)
async def admin_activate_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    [ADMIN] Ativar plano.

    Args:
        plan_id: ID do plano

    Returns:
        Plano ativado

    Raises:
        404: Plano não encontrado
    """
    db_plan = plan.activate(db=db, plan_id=plan_id)
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado"
        )
    return db_plan


@router.patch("/admin/{plan_id}/deactivate", response_model=PlanResponse)
async def admin_deactivate_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    [ADMIN] Desativar plano (soft delete).

    Remove automaticamente a flag is_default se estiver ativa.

    Args:
        plan_id: ID do plano

    Returns:
        Plano desativado

    Raises:
        404: Plano não encontrado
    """
    db_plan = plan.deactivate(db=db, plan_id=plan_id)
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado"
        )
    return db_plan


@router.patch("/admin/{plan_id}/set-default", response_model=PlanResponse)
async def admin_set_default_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    [ADMIN] Definir plano como padrão para novos usuários.

    Remove automaticamente a flag is_default de outros planos.
    Ativa o plano automaticamente.

    Args:
        plan_id: ID do plano

    Returns:
        Plano definido como padrão

    Raises:
        404: Plano não encontrado
    """
    db_plan = plan.set_as_default(db=db, plan_id=plan_id)
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado"
        )
    return db_plan


@router.delete("/admin/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    [ADMIN] Remover plano permanentemente.

    ATENÇÃO: Esta ação é irreversível e pode causar problemas
    se usuários estiverem vinculados a este plano.

    Recomenda-se usar deactivate ao invés de delete.

    Args:
        plan_id: ID do plano

    Raises:
        404: Plano não encontrado
        400: Plano tem usuários vinculados
    """
    db_plan = plan.get(db=db, id=plan_id)
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado"
        )

    # Verificar se tem usuários vinculados
    if db_plan.users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível remover plano com {len(db_plan.users)} usuário(s) vinculado(s). Use deactivate ao invés.",
        )

    plan.remove(db=db, id=plan_id)
    return None

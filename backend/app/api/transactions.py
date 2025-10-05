import math
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.plan_validation import HTTP_402_PAYMENT_REQUIRED, require_feature
from app.crud import transaction
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import (
    CategorySummary,
    PaginatedTransactions,
    TransactionBase,
    TransactionCreate,
    TransactionStats,
    TransactionUpdate,
    TransactionWithCategory,
)
from app.services.usage_service import usage_service

router = APIRouter()


@router.get("/", response_model=PaginatedTransactions)
async def list_transactions(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(20, ge=1, le=100, description="Items por página"),
    tipo: Optional[str] = Query(
        None, description="Filtrar por tipo: despesa ou receita"
    ),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoria"),
    data_inicio: Optional[date] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    data_fim: Optional[date] = Query(None, description="Data final (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar transações do usuário com filtros e paginação."""

    # Calculate offset
    skip = (page - 1) * size

    # Build query
    query = db.query(Transaction).filter(Transaction.usuario_id == current_user.id)

    # Apply filters
    if tipo:
        if tipo not in ["despesa", "receita"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo deve ser 'despesa' ou 'receita'",
            )
        query = query.filter(Transaction.tipo == tipo)

    if categoria_id:
        query = query.filter(Transaction.categoria_id == categoria_id)

    if data_inicio:
        query = query.filter(Transaction.data_transacao >= data_inicio)

    if data_fim:
        query = query.filter(Transaction.data_transacao <= data_fim)

    # Get total count
    total = query.count()

    # Get paginated results with all filters applied - Fixed AttributeError
    filtered_query = query.order_by(Transaction.data_transacao.desc())
    transactions = filtered_query.offset(skip).limit(size).all()

    # Calculate pagination info
    pages = math.ceil(total / size) if total > 0 else 1

    return PaginatedTransactions(
        items=transactions, total=total, page=page, size=size, pages=pages
    )


@router.get("/stats", response_model=TransactionStats)
async def get_transaction_stats(
    data_inicio: Optional[date] = Query(None, description="Data inicial"),
    data_fim: Optional[date] = Query(None, description="Data final"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter estatísticas das transações do usuário."""

    stats = transaction.get_summary_by_user(
        db=db, usuario_id=current_user.id, data_inicio=data_inicio, data_fim=data_fim
    )

    return TransactionStats(**stats)


@router.get("/categories-summary", response_model=List[CategorySummary])
async def get_categories_summary(
    data_inicio: Optional[date] = Query(None, description="Data inicial"),
    data_fim: Optional[date] = Query(None, description="Data final"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter resumo por categorias."""

    summary = transaction.get_by_category_summary(
        db=db, usuario_id=current_user.id, data_inicio=data_inicio, data_fim=data_fim
    )

    return [CategorySummary(**item._asdict()) for item in summary]


@router.get("/{transaction_id}", response_model=TransactionWithCategory)
async def get_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter uma transação específica."""

    db_transaction = transaction.get(db=db, id=transaction_id)

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada"
        )

    # Verificar se a transação pertence ao usuário
    if db_transaction.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para acessar esta transação",
        )

    return db_transaction


@router.post(
    "/",
    response_model=TransactionWithCategory,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_feature("transactions_enabled"))],
)
async def create_transaction(
    transaction_in: TransactionBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Criar nova transação.

    Requer: Feature 'transactions_enabled' no plano
    Limite: max_transactions_per_month
    """
    # Verificar limite de transações do plano
    can_create, error_msg = usage_service.check_can_create(
        db, current_user, "transaction"
    )
    if not can_create:
        raise HTTPException(status_code=HTTP_402_PAYMENT_REQUIRED, detail=error_msg)

    # Definir o usuário da transação
    transaction_in = TransactionCreate(
        mensagem_original=transaction_in.mensagem_original,
        valor=transaction_in.valor,
        descricao=transaction_in.descricao,
        tipo=transaction_in.tipo,
        canal=transaction_in.canal,
        categoria_id=transaction_in.categoria_id,
        data_transacao=transaction_in.data_transacao,
        usuario_id=current_user.id,  # Adiciona o usuario_id
    )

    # Validar categoria se fornecida
    if transaction_in.categoria_id:
        from app.crud import category

        db_category = category.get(db=db, id=transaction_in.categoria_id)
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria não encontrada",
            )

    # Criar transação com atualização de orçamento
    db_transaction, alert_info = transaction.create_with_budget_update(
        db=db, obj_in=transaction_in
    )

    # Adicionar alerta à resposta, se houver
    response = TransactionWithCategory.model_validate(db_transaction)
    if alert_info:
        response.budget_alert = alert_info

    return response


@router.put("/{transaction_id}", response_model=TransactionWithCategory)
async def update_transaction(
    transaction_id: UUID,
    transaction_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualizar transação existente."""

    # Buscar transação
    db_transaction = transaction.get(db=db, id=transaction_id)

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada"
        )

    # Verificar permissão
    if db_transaction.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para editar esta transação",
        )

    # Validar categoria se fornecida
    if transaction_in.categoria_id:
        from app.crud import category

        db_category = category.get(db=db, id=transaction_in.categoria_id)
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria não encontrada",
            )

    # Atualizar transação
    updated_transaction = transaction.update(
        db=db, db_obj=db_transaction, obj_in=transaction_in
    )

    return updated_transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletar transação."""

    # Buscar transação
    db_transaction = transaction.get(db=db, id=transaction_id)

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada"
        )

    # Verificar permissão
    if db_transaction.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para deletar esta transação",
        )

    # Deletar transação
    transaction.remove(db=db, id=transaction_id)

    return None

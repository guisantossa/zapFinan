from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session, joinedload

from app.crud.base import CRUDBase
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class CRUDTransaction(CRUDBase[Transaction, TransactionCreate, TransactionUpdate]):
    def create_with_budget_update(
        self, db: Session, *, obj_in: TransactionCreate
    ) -> Transaction:
        """Cria transação e atualiza orçamentos automaticamente."""
        # Criar transação normalmente
        transaction = self.create(db, obj_in=obj_in)

        if transaction.tipo == "despesa" and transaction.categoria_id:
            from app.services.budget_service import budget_service

            budget_service.update_budget_from_transaction(
                db=db,
                usuario_id=transaction.usuario_id,
                categoria_id=transaction.categoria_id,
                valor=transaction.valor,
                data_transacao=transaction.data_transacao or datetime.now(),
                tipo=transaction.tipo,
            )

        return transaction

    def get_by_user(
        self, db: Session, *, usuario_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Transaction]:
        return (
            db.query(Transaction)
            .options(joinedload(Transaction.categoria))
            .filter(Transaction.usuario_id == usuario_id)
            .order_by(desc(Transaction.data_transacao))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user_and_period(
        self, db: Session, *, usuario_id: UUID, data_inicio: date, data_fim: date
    ) -> List[Transaction]:
        return (
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

    def get_summary_by_user(
        self,
        db: Session,
        *,
        usuario_id: UUID,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
    ) -> dict:
        query = db.query(Transaction).filter(Transaction.usuario_id == usuario_id)

        if data_inicio and data_fim:
            query = query.filter(
                and_(
                    Transaction.data_transacao >= data_inicio,
                    Transaction.data_transacao <= data_fim,
                )
            )

        # Get totals by type
        receitas = query.filter(Transaction.tipo == "receita").all()
        despesas = query.filter(Transaction.tipo == "despesa").all()

        total_receitas = sum(t.valor for t in receitas)
        total_despesas = sum(t.valor for t in despesas)
        saldo = total_receitas - total_despesas

        return {
            "total_receitas": total_receitas,
            "total_despesas": total_despesas,
            "saldo": saldo,
            "receitas": len(receitas),
            "despesas": len(despesas),
        }

    def get_by_category_summary(
        self,
        db: Session,
        *,
        usuario_id: UUID,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
    ) -> List[dict]:
        query = (
            db.query(
                Category.nome.label("categoria"),
                Category.tipo,
                func.sum(Transaction.valor).label("total"),
                func.count(Transaction.id).label("quantidade"),
            )
            .join(Transaction.categoria)
            .filter(Transaction.usuario_id == usuario_id)
        )

        if data_inicio and data_fim:
            query = query.filter(
                and_(
                    Transaction.data_transacao >= data_inicio,
                    Transaction.data_transacao <= data_fim,
                )
            )

        return query.group_by(Category.nome, Category.tipo).all()


transaction = CRUDTransaction(Transaction)

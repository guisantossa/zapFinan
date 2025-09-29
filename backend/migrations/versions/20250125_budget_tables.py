"""Add budget and budget_periods tables

Revision ID: 002_budget_tables
Revises: 001_initial
Create Date: 2025-01-25 16:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "002_budget_tables"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create budgets table
    op.create_table(
        "budgets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("categoria_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("valor_limite", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, default=True),
        sa.Column(
            "notificar_em",
            sa.Numeric(precision=5, scale=2),
            nullable=True,
            default=80.0,
        ),
        sa.Column(
            "periodicidade", sa.String(length=20), nullable=False, default="mensal"
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["categoria_id"],
            ["categories.id"],
        ),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_budgets_id"), "budgets", ["id"], unique=False)
    op.create_index(
        op.f("ix_budgets_usuario_id"), "budgets", ["usuario_id"], unique=False
    )
    op.create_index(
        op.f("ix_budgets_categoria_id"), "budgets", ["categoria_id"], unique=False
    )

    # Create budget_periods table
    op.create_table(
        "budget_periods",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("budget_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("quinzena", sa.Integer(), nullable=True),
        sa.Column("semana", sa.Integer(), nullable=True),
        sa.Column("valor_limite", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "valor_gasto", sa.Numeric(precision=10, scale=2), nullable=False, default=0
        ),
        sa.Column("status", sa.String(length=20), nullable=False, default="ativo"),
        sa.Column("data_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("data_fim", sa.DateTime(timezone=True), nullable=False),
        sa.Column("alerta_enviado", sa.Boolean(), nullable=True, default=False),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["budget_id"], ["budgets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_budget_periods_id"), "budget_periods", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_budget_periods_budget_id"),
        "budget_periods",
        ["budget_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_budget_periods_ano"), "budget_periods", ["ano"], unique=False
    )
    op.create_index(
        op.f("ix_budget_periods_mes"), "budget_periods", ["mes"], unique=False
    )

    # Create unique constraint for budget periods
    op.create_index(
        "ix_budget_periods_unique",
        "budget_periods",
        ["budget_id", "ano", "mes", "quinzena", "semana"],
        unique=True,
        postgresql_where=sa.text("quinzena IS NOT NULL OR semana IS NOT NULL"),
    )

    # Create partial unique index for monthly periods
    op.create_index(
        "ix_budget_periods_monthly_unique",
        "budget_periods",
        ["budget_id", "ano", "mes"],
        unique=True,
        postgresql_where=sa.text("quinzena IS NULL AND semana IS NULL"),
    )

    # Add check constraints
    op.execute(
        """
        ALTER TABLE budgets
        ADD CONSTRAINT check_budget_periodicidade
        CHECK (periodicidade IN ('mensal', 'quinzenal', 'semanal'))
    """
    )

    op.execute(
        """
        ALTER TABLE budget_periods
        ADD CONSTRAINT check_budget_period_status
        CHECK (status IN ('ativo', 'excedido', 'finalizado'))
    """
    )

    op.execute(
        """
        ALTER TABLE budget_periods
        ADD CONSTRAINT check_budget_period_quinzena
        CHECK (quinzena IS NULL OR quinzena IN (1, 2))
    """
    )

    op.execute(
        """
        ALTER TABLE budget_periods
        ADD CONSTRAINT check_budget_period_semana
        CHECK (semana IS NULL OR semana IN (1, 2, 3, 4))
    """
    )

    op.execute(
        """
        ALTER TABLE budget_periods
        ADD CONSTRAINT check_budget_period_mes
        CHECK (mes >= 1 AND mes <= 12)
    """
    )


def downgrade() -> None:
    op.drop_table("budget_periods")
    op.drop_table("budgets")

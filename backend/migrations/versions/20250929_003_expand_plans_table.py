"""expand plans table with features limits and metadata

Revision ID: 20250929_003
Revises: 20250929_002
Create Date: 2025-09-29 21:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "20250929_003"
down_revision = "20250929_002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Expandir tabela plans com features, limites e metadata.
    """

    # Adicionar features (o que o plano pode fazer)
    op.add_column(
        "plans",
        sa.Column(
            "transactions_enabled", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "plans",
        sa.Column(
            "budgets_enabled", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "plans",
        sa.Column(
            "commitments_enabled", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "plans",
        sa.Column(
            "reports_advanced", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
    op.add_column(
        "plans",
        sa.Column(
            "google_calendar_sync", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
    op.add_column(
        "plans",
        sa.Column(
            "multi_phone_enabled", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "plans",
        sa.Column("api_access", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "plans",
        sa.Column(
            "priority_support", sa.Boolean(), nullable=False, server_default="false"
        ),
    )

    # Adicionar limites (quanto pode fazer - NULL = ilimitado)
    op.add_column(
        "plans", sa.Column("max_transactions_per_month", sa.Integer(), nullable=True)
    )
    op.add_column("plans", sa.Column("max_budgets", sa.Integer(), nullable=True))
    op.add_column("plans", sa.Column("max_commitments", sa.Integer(), nullable=True))
    op.add_column("plans", sa.Column("max_categories", sa.Integer(), nullable=True))
    op.add_column(
        "plans",
        sa.Column("max_phones", sa.Integer(), nullable=True, server_default="1"),
    )
    op.add_column(
        "plans",
        sa.Column(
            "data_retention_months", sa.Integer(), nullable=False, server_default="12"
        ),
    )

    # Adicionar metadata do plano
    op.add_column(
        "plans",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "plans",
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "plans",
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("plans", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("plans", sa.Column("color", sa.String(20), nullable=True))
    op.add_column(
        "plans", sa.Column("features_json", postgresql.JSONB(), nullable=True)
    )

    # Adicionar timestamps
    op.add_column(
        "plans",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.add_column(
        "plans",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # Criar índices
    op.create_index("ix_plans_is_active", "plans", ["is_active"])
    op.create_index("ix_plans_is_default", "plans", ["is_default"])
    op.create_index("ix_plans_display_order", "plans", ["display_order"])

    print("[OK] Plans table expanded with features, limits, and metadata")


def downgrade() -> None:
    """
    Remover colunas adicionadas.
    """

    # Remover índices
    op.drop_index("ix_plans_display_order", table_name="plans")
    op.drop_index("ix_plans_is_default", table_name="plans")
    op.drop_index("ix_plans_is_active", table_name="plans")

    # Remover colunas de timestamp
    op.drop_column("plans", "updated_at")
    op.drop_column("plans", "created_at")

    # Remover metadata
    op.drop_column("plans", "features_json")
    op.drop_column("plans", "color")
    op.drop_column("plans", "description")
    op.drop_column("plans", "display_order")
    op.drop_column("plans", "is_default")
    op.drop_column("plans", "is_active")

    # Remover limites
    op.drop_column("plans", "data_retention_months")
    op.drop_column("plans", "max_phones")
    op.drop_column("plans", "max_categories")
    op.drop_column("plans", "max_commitments")
    op.drop_column("plans", "max_budgets")
    op.drop_column("plans", "max_transactions_per_month")

    # Remover features
    op.drop_column("plans", "priority_support")
    op.drop_column("plans", "api_access")
    op.drop_column("plans", "multi_phone_enabled")
    op.drop_column("plans", "google_calendar_sync")
    op.drop_column("plans", "reports_advanced")
    op.drop_column("plans", "commitments_enabled")
    op.drop_column("plans", "budgets_enabled")
    op.drop_column("plans", "transactions_enabled")

    print("[OK] Plans table reverted to original structure")

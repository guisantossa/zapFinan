"""Add webApp to canal constraint

Revision ID: 4a358dcb9542
Revises: 9cecdd2bbe54
Create Date: 2025-09-27 09:01:44.146989

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "4a358dcb9542"
down_revision = "9cecdd2bbe54"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove o constraint existente (nome real do banco)
    op.drop_constraint("transactions_canal_check", "transactions", type_="check")

    # Adiciona novo constraint com webApp incluído
    op.create_check_constraint(
        "transactions_canal_check",
        "transactions",
        "canal IN ('audioMessage', 'conversation', 'imageMessage', 'webApp')",
    )


def downgrade() -> None:
    # Remove o constraint com webApp
    op.drop_constraint("transactions_canal_check", "transactions", type_="check")

    # Restaura o constraint original (sem webApp)
    op.create_check_constraint(
        "transactions_canal_check",
        "transactions",
        "canal IN ('audioMessage', 'conversation', 'imageMessage')",
    )

"""make telefone nullable and remove unique constraint

Revision ID: 20250930_004
Revises: 20250929_003
Create Date: 2025-09-30 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers
revision = "20250930_004"
down_revision = "20250929_003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Fase 2: Remover campo telefone da tabela users completamente.

    Agora que:
    1. Tabela user_phones existe
    2. Código está usando UserPhone para lookups
    3. Dados já foram migrados (20250929_002)
    4. Property primary_phone retorna telefone principal

    Podemos remover o campo telefone legado completamente.
    """

    # Verificar e remover index se existir
    from sqlalchemy import inspect

    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = [idx["name"] for idx in inspector.get_indexes("users")]

    if "ix_users_telefone" in indexes:
        op.drop_index("ix_users_telefone", table_name="users")

    # Verificar e remover constraint se existir
    constraints = [c["name"] for c in inspector.get_unique_constraints("users")]
    if "users_telefone_key" in constraints:
        op.drop_constraint("users_telefone_key", "users", type_="unique")

    # Dropar view user_plans (depende de telefone)
    op.execute("DROP VIEW IF EXISTS user_plans CASCADE")

    # Remover coluna telefone
    op.drop_column("users", "telefone")


def downgrade() -> None:
    """
    Reverter mudanças: recriar coluna telefone e popular com dados de user_phones.

    ATENÇÃO: Restaura dados a partir de user_phones.
    """

    # Recriar coluna telefone
    op.add_column("users", sa.Column("telefone", sa.String(20), nullable=True))

    # Popular com telefone principal de cada usuário
    op.execute(
        """
        UPDATE users
        SET telefone = (
            SELECT phone_number
            FROM user_phones
            WHERE user_phones.user_id = users.id
            AND user_phones.is_primary = true
            AND user_phones.is_active = true
            LIMIT 1
        )
    """
    )

    # Criar unique constraint
    op.create_unique_constraint("users_telefone_key", "users", ["telefone"])

    # Criar index
    op.create_index("ix_users_telefone", "users", ["telefone"])

    # Tornar NOT NULL
    op.alter_column(
        "users",
        "telefone",
        existing_type=sa.String(20),
        nullable=False,
    )

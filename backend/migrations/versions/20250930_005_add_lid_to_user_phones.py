"""add lid to user_phones and remove from users

Revision ID: 20250930_005
Revises: 20250930_004
Create Date: 2025-09-30 01:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers
revision = "20250930_005"
down_revision = "20250930_004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Adicionar campo lid em user_phones e remover de users.

    Cada telefone WhatsApp tem seu próprio @lid (identificador da Meta).
    """

    # 1. Adicionar coluna lid em user_phones
    op.add_column("user_phones", sa.Column("lid", sa.String(50), nullable=True))

    # 2. Migrar dados: copiar users.lid para user_phones.lid do telefone principal
    op.execute(
        """
        UPDATE user_phones
        SET lid = u.lid
        FROM users u
        WHERE user_phones.user_id = u.id
        AND user_phones.is_primary = true
        AND u.lid IS NOT NULL
    """
    )

    # 3. Criar index para lid
    op.create_index("ix_user_phones_lid", "user_phones", ["lid"])

    # 4. Criar unique constraint para lid
    op.create_unique_constraint("uq_user_phones_lid", "user_phones", ["lid"])

    # 5. Verificar e remover index/constraints de users.lid se existirem
    from sqlalchemy import inspect

    bind = op.get_bind()
    inspector = inspect(bind)

    # Remover index se existir
    indexes = [idx["name"] for idx in inspector.get_indexes("users")]
    if "ix_users_lid" in indexes:
        op.drop_index("ix_users_lid", table_name="users")

    # Remover constraint se existir
    constraints = [c["name"] for c in inspector.get_unique_constraints("users")]
    if "users_lid_key" in constraints:
        op.drop_constraint("users_lid_key", "users", type_="unique")

    # 6. Remover coluna lid de users
    op.drop_column("users", "lid")


def downgrade() -> None:
    """
    Reverter mudanças: recriar lid em users e remover de user_phones.
    """

    # 1. Recriar coluna lid em users
    op.add_column("users", sa.Column("lid", sa.String(50), nullable=True))

    # 2. Migrar dados de volta: copiar lid do telefone principal
    op.execute(
        """
        UPDATE users
        SET lid = (
            SELECT lid
            FROM user_phones
            WHERE user_phones.user_id = users.id
            AND user_phones.is_primary = true
            AND user_phones.lid IS NOT NULL
            LIMIT 1
        )
    """
    )

    # 3. Criar constraints em users
    op.create_unique_constraint("users_lid_key", "users", ["lid"])
    op.create_index("ix_users_lid", "users", ["lid"])

    # 4. Remover constraints de user_phones
    op.drop_constraint("uq_user_phones_lid", "user_phones", type_="unique")
    op.drop_index("ix_user_phones_lid", table_name="user_phones")

    # 5. Remover coluna lid de user_phones
    op.drop_column("user_phones", "lid")

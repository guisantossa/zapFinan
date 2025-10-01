"""create user_phones table

Revision ID: 20250929_001
Revises: 68f0cded3490
Create Date: 2025-09-29 20:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "20250929_001"
down_revision = "68f0cded3490"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Fase 1: Criar tabela user_phones sem migrar dados ainda.
    Sistema continua usando users.telefone normalmente.
    """

    # Criar tabela user_phones
    op.create_table(
        "user_phones",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("phone_number", sa.String(length=20), nullable=False),
        sa.Column(
            "is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column("verification_token", sa.String(length=10), nullable=True),
        sa.Column("verification_expires", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone_number"),
    )

    # Criar indexes
    op.create_index(op.f("ix_user_phones_id"), "user_phones", ["id"], unique=False)
    op.create_index(
        op.f("ix_user_phones_user_id"), "user_phones", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_user_phones_phone_number"),
        "user_phones",
        ["phone_number"],
        unique=True,
    )
    op.create_index(
        op.f("ix_user_phones_is_primary"), "user_phones", ["is_primary"], unique=False
    )

    # Indexes compostos para performance
    op.create_index(
        "ix_user_phones_user_primary",
        "user_phones",
        ["user_id", "is_primary"],
        unique=False,
    )
    op.create_index(
        "ix_user_phones_user_active",
        "user_phones",
        ["user_id", "is_active"],
        unique=False,
    )


def downgrade() -> None:
    """Rollback: remover tabela user_phones."""
    op.drop_index("ix_user_phones_user_active", table_name="user_phones")
    op.drop_index("ix_user_phones_user_primary", table_name="user_phones")
    op.drop_index(op.f("ix_user_phones_is_primary"), table_name="user_phones")
    op.drop_index(op.f("ix_user_phones_phone_number"), table_name="user_phones")
    op.drop_index(op.f("ix_user_phones_user_id"), table_name="user_phones")
    op.drop_index(op.f("ix_user_phones_id"), table_name="user_phones")
    op.drop_table("user_phones")

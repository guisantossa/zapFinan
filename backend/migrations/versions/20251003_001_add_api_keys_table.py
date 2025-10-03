"""add api_keys table for N8N authentication

Revision ID: 20251003_001
Revises: 20250930_005
Create Date: 2025-10-03 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "20251003_001"
down_revision = "20250930_005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Criar tabela api_keys para autenticação de N8N e outras integrações externas.

    Features:
    - API Keys com hash bcrypt (nunca armazena texto plano)
    - Scopes granulares por feature
    - Soft deletion via is_active
    - Expiração opcional
    - IP whitelisting
    - Rate limiting customizado
    - Tracking de uso
    """

    # Criar tabela api_keys
    op.create_table(
        "api_keys",
        # Primary identification
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            comment="Unique API key ID",
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            comment="Owner user ID",
        ),
        # Key security (never returns plain text after creation)
        sa.Column(
            "key_prefix",
            sa.String(length=8),
            nullable=False,
            comment="First 8 characters of key for quick lookup (e.g., 'zpg_1a2b')",
        ),
        sa.Column(
            "key_hash",
            sa.String(length=255),
            nullable=False,
            comment="Bcrypt hash of the full key",
        ),
        # Metadata
        sa.Column(
            "name",
            sa.String(length=100),
            nullable=False,
            comment="User-friendly name (e.g., 'N8N Production')",
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
            comment="Optional description of key usage",
        ),
        # Permissions
        sa.Column(
            "scopes",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
            comment="Array of feature scopes (e.g., ['transactions', 'budgets'])",
        ),
        # Control flags
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
            comment="Soft deletion flag",
        ),
        sa.Column(
            "last_used_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Last time this key was used for authentication",
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Optional expiration date (None = never expires)",
        ),
        # Additional security (optional)
        sa.Column(
            "allowed_ips",
            postgresql.JSONB(),
            nullable=True,
            comment="Array of allowed IP addresses (None = any IP)",
        ),
        sa.Column(
            "rate_limit",
            sa.Integer(),
            nullable=True,
            comment="Custom rate limit in requests/minute (None = default)",
        ),
        # Timestamps
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
            comment="Creation timestamp",
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
            comment="Last update timestamp",
        ),
        # Constraints
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_api_keys_user_id"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_api_keys"),
    )

    # Criar indexes
    op.create_index(op.f("ix_api_keys_id"), "api_keys", ["id"], unique=False)
    op.create_index(op.f("ix_api_keys_user_id"), "api_keys", ["user_id"], unique=False)
    op.create_index(
        op.f("ix_api_keys_key_prefix"), "api_keys", ["key_prefix"], unique=False
    )
    op.create_index(
        op.f("ix_api_keys_is_active"), "api_keys", ["is_active"], unique=False
    )
    op.create_index(
        op.f("ix_api_keys_expires_at"), "api_keys", ["expires_at"], unique=False
    )

    # Index composto para performance (busca de keys ativas por usuário)
    op.create_index(
        "ix_api_keys_user_active", "api_keys", ["user_id", "is_active"], unique=False
    )

    # Index composto para autenticação (key_prefix + is_active)
    op.create_index(
        "ix_api_keys_prefix_active",
        "api_keys",
        ["key_prefix", "is_active"],
        unique=False,
    )

    print("[OK] API Keys table created successfully")


def downgrade() -> None:
    """
    Remover tabela api_keys e todos os seus indexes.
    """

    # Remover indexes compostos
    op.drop_index("ix_api_keys_prefix_active", table_name="api_keys")
    op.drop_index("ix_api_keys_user_active", table_name="api_keys")

    # Remover indexes simples
    op.drop_index(op.f("ix_api_keys_expires_at"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_is_active"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_key_prefix"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_user_id"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_id"), table_name="api_keys")

    # Remover tabela
    op.drop_table("api_keys")

    print("[OK] API Keys table removed")

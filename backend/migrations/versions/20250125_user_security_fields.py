"""Add user security fields

Revision ID: 20250125_user_security_fields
Revises: 20250125_commitment_tables
Create Date: 2025-01-25 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "20250125_user_security_fields"
down_revision = "003_commitment_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add unique constraint to email
    op.create_unique_constraint(None, "users", ["email"])

    # Add security and status fields
    op.add_column(
        "users",
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "failed_login_attempts",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.add_column(
        "users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column(
            "last_password_change",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # Add verification tokens
    op.add_column(
        "users",
        sa.Column("email_verification_token", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "email_verification_expires", sa.DateTime(timezone=True), nullable=True
        ),
    )
    op.add_column(
        "users", sa.Column("password_reset_token", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column("password_reset_expires", sa.DateTime(timezone=True), nullable=True),
    )

    # Add updated_at timestamp
    op.add_column(
        "users",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # Add indexes for performance
    op.create_index(
        "ix_users_email_verification_token", "users", ["email_verification_token"]
    )
    op.create_index("ix_users_password_reset_token", "users", ["password_reset_token"])
    op.create_index("ix_users_is_active", "users", ["is_active"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_users_is_active", table_name="users")
    op.drop_index("ix_users_password_reset_token", table_name="users")
    op.drop_index("ix_users_email_verification_token", table_name="users")

    # Drop columns
    op.drop_column("users", "updated_at")
    op.drop_column("users", "password_reset_expires")
    op.drop_column("users", "password_reset_token")
    op.drop_column("users", "email_verification_expires")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "last_password_change")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "failed_login_attempts")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "is_active")

    # Drop unique constraint on email
    op.drop_constraint(None, "users", type_="unique")

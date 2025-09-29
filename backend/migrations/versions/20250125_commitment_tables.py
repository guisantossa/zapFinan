"""Add commitments and user_google_auth tables

Revision ID: 003_commitment_tables
Revises: 002_budget_tables
Create Date: 2025-01-25 18:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "003_commitment_tables"
down_revision = "002_budget_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_google_auth table
    op.create_table(
        "user_google_auth",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("google_access_token", sa.Text(), nullable=False),
        sa.Column("google_refresh_token", sa.Text(), nullable=True),
        sa.Column("google_token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("google_calendar_id", sa.String(length=200), nullable=True),
        sa.Column("google_email", sa.String(length=200), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, default=True),
        sa.Column("ultima_sincronizacao", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("usuario_id"),
    )
    op.create_index(
        op.f("ix_user_google_auth_id"), "user_google_auth", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_user_google_auth_usuario_id"),
        "user_google_auth",
        ["usuario_id"],
        unique=False,
    )

    # Create commitments table
    op.create_table(
        "commitments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titulo", sa.String(length=200), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("data_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("data_fim", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tipo", sa.String(length=50), nullable=False, default="evento"),
        sa.Column("status", sa.String(length=20), nullable=False, default="agendado"),
        sa.Column(
            "recorrencia", sa.String(length=20), nullable=False, default="nenhuma"
        ),
        sa.Column("recorrencia_ate", sa.Date(), nullable=True),
        sa.Column("compromisso_pai_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("google_event_id", sa.String(length=200), nullable=True),
        sa.Column("sincronizado_google", sa.Boolean(), nullable=False, default=False),
        sa.Column("ultima_sincronizacao", sa.DateTime(timezone=True), nullable=True),
        sa.Column("precisa_sincronizar", sa.Boolean(), nullable=False, default=True),
        sa.Column("lembrete_whatsapp", sa.Boolean(), nullable=False, default=True),
        sa.Column("minutos_antes_lembrete", sa.Integer(), nullable=True, default=30),
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
            ["compromisso_pai_id"],
            ["commitments.id"],
        ),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_commitments_id"), "commitments", ["id"], unique=False)
    op.create_index(
        op.f("ix_commitments_usuario_id"), "commitments", ["usuario_id"], unique=False
    )
    op.create_index(
        op.f("ix_commitments_data_inicio"), "commitments", ["data_inicio"], unique=False
    )
    op.create_index(
        op.f("ix_commitments_data_fim"), "commitments", ["data_fim"], unique=False
    )
    op.create_index(
        op.f("ix_commitments_google_event_id"),
        "commitments",
        ["google_event_id"],
        unique=False,
    )

    # Add check constraints
    op.execute(
        """
        ALTER TABLE commitments
        ADD CONSTRAINT check_commitment_tipo
        CHECK (tipo IN ('reuniao', 'pagamento', 'evento', 'lembrete', 'aniversario'))
    """
    )

    op.execute(
        """
        ALTER TABLE commitments
        ADD CONSTRAINT check_commitment_status
        CHECK (status IN ('agendado', 'concluido', 'cancelado', 'adiado'))
    """
    )

    op.execute(
        """
        ALTER TABLE commitments
        ADD CONSTRAINT check_commitment_recorrencia
        CHECK (recorrencia IN ('nenhuma', 'diaria', 'semanal', 'mensal', 'anual'))
    """
    )

    op.execute(
        """
        ALTER TABLE commitments
        ADD CONSTRAINT check_commitment_dates
        CHECK (data_fim >= data_inicio)
    """
    )

    # Índices adicionais para performance
    op.create_index(
        "ix_commitments_usuario_data_status",
        "commitments",
        ["usuario_id", "data_inicio", "status"],
        unique=False,
    )

    op.create_index(
        "ix_commitments_sincronizacao",
        "commitments",
        ["precisa_sincronizar", "usuario_id"],
        unique=False,
        postgresql_where=sa.text("precisa_sincronizar = true"),
    )

    op.create_index(
        "ix_commitments_lembretes",
        "commitments",
        ["data_inicio", "lembrete_whatsapp", "status"],
        unique=False,
        postgresql_where=sa.text("lembrete_whatsapp = true AND status = 'agendado'"),
    )


def downgrade() -> None:
    op.drop_table("commitments")
    op.drop_table("user_google_auth")

"""initial migration

Revision ID: 001_initial
Revises:
Create Date: 2025-01-25 14:30:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create categories table
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=50), nullable=False),
        sa.Column("tipo", sa.String(length=10), nullable=False),
        sa.CheckConstraint(
            "tipo IN ('despesa', 'receita')", name="check_category_tipo"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )
    op.create_index(op.f("ix_categories_id"), "categories", ["id"], unique=False)

    # Create users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("senha", sa.String(length=255), nullable=False),
        sa.Column("telefone", sa.String(length=20), nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=100), nullable=True),
        sa.Column(
            "data_inicio",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("token", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("telefone"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_telefone"), "users", ["telefone"], unique=False)

    # Create transactions table
    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mensagem_original", sa.String(), nullable=False),
        sa.Column("valor", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("descricao", sa.String(length=200), nullable=False),
        sa.Column("tipo", sa.String(length=10), nullable=False),
        sa.Column("canal", sa.String(length=20), nullable=True),
        sa.Column("categoria_id", sa.Integer(), nullable=True),
        sa.Column("data_transacao", sa.Date(), nullable=True),
        sa.Column(
            "data_registro",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.CheckConstraint(
            "tipo IN ('despesa', 'receita')", name="check_transaction_tipo"
        ),
        sa.CheckConstraint(
            "canal IN ('audioMessage', 'conversation', 'imageMessage')",
            name="check_transaction_canal",
        ),
        sa.ForeignKeyConstraint(
            ["categoria_id"],
            ["categories.id"],
        ),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_transactions_id"), "transactions", ["id"], unique=False)
    op.create_index(
        op.f("ix_transactions_usuario_id"), "transactions", ["usuario_id"], unique=False
    )

    # Create reports table
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("periodo_inicio", sa.Date(), nullable=False),
        sa.Column("periodo_fim", sa.Date(), nullable=False),
        sa.Column("total_receitas", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("total_despesas", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("saldo", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("enviado_whatsapp", sa.Boolean(), nullable=True),
        sa.Column("data_envio", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reports_id"), "reports", ["id"], unique=False)
    op.create_index(
        op.f("ix_reports_usuario_id"), "reports", ["usuario_id"], unique=False
    )

    # Insert default categories
    op.execute(
        """
        INSERT INTO categories (nome, tipo) VALUES
        -- Despesas
        ('🛒 Mercado', 'despesa'),
        ('🥗 Alimentação', 'despesa'),
        ('🚗 Automóvel', 'despesa'),
        ('🎉 Lazer', 'despesa'),
        ('📺 Contas a Pagar', 'despesa'),
        ('📚 Educação', 'despesa'),
        ('💊 Saúde', 'despesa'),
        ('🏋️ Academia', 'despesa'),
        ('🐶 Pets', 'despesa'),
        ('📄 Aluguéis', 'despesa'),
        ('🎁 Presentes', 'despesa'),
        ('📌 Outros', 'despesa'),

        -- Receitas
        ('💼 Salário', 'receita'),
        ('🏦 Rendimentos', 'receita'),
        ('💵 Renda Extra', 'receita'),
        ('💳 Reembolso', 'receita'),
        ('📌 Outras', 'receita');
    """
    )


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("transactions")
    op.drop_table("users")
    op.drop_table("categories")

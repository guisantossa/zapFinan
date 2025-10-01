"""migrate existing phones to user_phones

Revision ID: 20250929_002
Revises: 20250929_001
Create Date: 2025-09-29 20:30:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.sql import text

# revision identifiers
revision = "20250929_002"
down_revision = "20250929_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Fase 2: Migrar dados de users.telefone para user_phones.
    Todos os telefones existentes viram telefones principais verificados.
    """

    # Usar raw SQL para migração eficiente
    connection = op.get_bind()

    # Migrar todos os telefones existentes
    # Cada telefone vira o telefone principal do usuário
    migration_sql = text(
        """
        INSERT INTO user_phones (
            id,
            user_id,
            phone_number,
            is_primary,
            is_verified,
            is_active,
            verified_at,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid(),  -- Gerar novo UUID para cada phone
            u.id,
            u.telefone,
            true,  -- Telefone atual vira principal
            true,  -- Considerar verificado (já está em uso)
            u.is_active,  -- Herdar status do usuário
            u.data_inicio,  -- Data de verificação = data de cadastro
            u.data_inicio,  -- created_at
            COALESCE(u.updated_at, u.data_inicio)  -- updated_at
        FROM users u
        WHERE u.telefone IS NOT NULL
          AND u.telefone != ''
          -- Evitar duplicatas se migration rodar duas vezes
          AND NOT EXISTS (
              SELECT 1 FROM user_phones up
              WHERE up.phone_number = u.telefone
          )
    """
    )

    result = connection.execute(migration_sql)
    rows_migrated = result.rowcount

    print(f"[OK] Migrated {rows_migrated} phones from users.telefone to user_phones")

    # Validar migração
    validation_sql = text(
        """
        SELECT
            COUNT(*) as total_users,
            COUNT(CASE WHEN telefone IS NOT NULL THEN 1 END) as users_with_phone,
            (SELECT COUNT(*) FROM user_phones) as migrated_phones,
            (SELECT COUNT(DISTINCT user_id) FROM user_phones) as users_in_phone_table
        FROM users
    """
    )

    result = connection.execute(validation_sql)
    stats = result.fetchone()

    print(
        f"""
    Migration Validation:
    - Total users: {stats[0]}
    - Users with phone: {stats[1]}
    - Migrated phones: {stats[2]}
    - Users in phone table: {stats[3]}
    """
    )

    # Verificar se todos usuários com telefone foram migrados
    if stats[1] != stats[2]:
        raise Exception(
            f"Migration validation failed: {stats[1]} users have phones "
            f"but only {stats[2]} phones were migrated"
        )


def downgrade() -> None:
    """
    Rollback: Remover dados migrados.
    ATENÇÃO: Não remove telefones adicionados após a migração!
    """
    connection = op.get_bind()

    # Remover apenas telefones que foram migrados (is_primary=true)
    # Mantém telefones adicionados manualmente depois
    delete_sql = text(
        """
        DELETE FROM user_phones
        WHERE is_primary = true
        AND created_at IN (
            SELECT u.data_inicio
            FROM users u
            WHERE u.id = user_phones.user_id
        )
    """
    )

    result = connection.execute(delete_sql)
    print(f"✓ Removed {result.rowcount} migrated phones (rollback)")

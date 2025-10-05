#!/usr/bin/env python3
"""
Script CLI para criar System API Key do N8N.

Este script cria uma API Key especial para o sistema N8N se autenticar
ao fazer chamadas para a API do Synca via webhooks do WhatsApp.

Uso:
    python -m scripts.create_system_key --user-id <uuid>

Ou com opções:
    python -m scripts.create_system_key --user-id <uuid> --name "Custom Name"

Argumentos:
    --user-id    UUID do usuário dono da key (obrigatório)
    --name       Nome customizado (opcional, padrão: "N8N System Key")
    --force      Força criação mesmo se já existir (revoga a antiga)

Exemplo:
    python -m scripts.create_system_key --user-id f47ac10b-58cc-4372-a567-0e02b2c3d479
"""

import argparse
import sys
from uuid import UUID

from app.core.database import SessionLocal
from app.crud.api_key import api_key as crud_api_key


def print_banner():
    """Exibe banner do script."""
    print("\n" + "=" * 70)
    print(" Synca - Gerador de System API Key para N8N")
    print("=" * 70 + "\n")


def validate_uuid(uuid_string: str) -> UUID:
    """Valida e converte string UUID."""
    try:
        return UUID(uuid_string)
    except ValueError:
        print(f"❌ Erro: '{uuid_string}' não é um UUID válido")
        print("   Formato esperado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
        sys.exit(1)


def create_system_key(user_id_str: str, key_name: str = None, force: bool = False):
    """
    Cria System API Key para N8N.

    Args:
        user_id_str: UUID do usuário (string)
        key_name: Nome customizado (opcional)
        force: Se True, revoga key existente antes de criar
    """
    # Validar UUID
    user_id = validate_uuid(user_id_str)

    # Conectar ao banco
    db = SessionLocal()

    try:
        # Nome padrão
        if not key_name:
            key_name = "N8N System Key"

        print(f"👤 Usuário ID: {user_id}")
        print(f"📝 Nome da Key: {key_name}\n")

        # Verificar se já existe
        existing_keys = crud_api_key.get_by_user(db, user_id=user_id, active_only=True)
        system_keys = [k for k in existing_keys if k.name == key_name]

        if system_keys and not force:
            print("⚠️  AVISO: Já existe uma System Key para este usuário!")
            print(f"   ID: {system_keys[0].id}")
            print(f"   Prefix: {system_keys[0].key_prefix}")
            print(f"   Criada em: {system_keys[0].created_at}")
            print("\nUse --force para revogar e criar nova.\n")
            sys.exit(1)

        # Revogar antiga se force=True
        if system_keys and force:
            print("♻️  Revogando key antiga...\n")
            for old_key in system_keys:
                crud_api_key.revoke_key(db, api_key_id=old_key.id, user_id=user_id)

        # Criar nova key
        print("🔨 Gerando nova System API Key...\n")

        api_key, plain_key = crud_api_key.create_with_key(
            db,
            user_id=user_id,
            name=key_name,
            description="System-wide key for N8N WhatsApp webhook integration",
            scopes=["transactions", "budgets", "commitments", "reports"],
            expires_at=None,  # Nunca expira
        )

        # Exibir resultado
        print("✅ System API Key criada com sucesso!\n")
        print("=" * 70)
        print("🔑 API KEY (SALVE EM LOCAL SEGURO - NUNCA SERÁ MOSTRADA NOVAMENTE):")
        print("=" * 70)
        print(f"\n{plain_key}\n")
        print("=" * 70 + "\n")

        print("📋 Informações da Key:")
        print(f"   ID:          {api_key.id}")
        print(f"   Prefix:      {api_key.key_prefix}")
        print(f"   Scopes:      {', '.join(api_key.scopes)}")
        print("   Expira em:   Nunca")
        print(f"   Criada em:   {api_key.created_at}")

        print("\n⚙️  Configuração no N8N:")
        print("-" * 70)
        print("1. Acesse as configurações do N8N")
        print("2. Adicione variável de ambiente:")
        print("\n   Nome:  SYNCA_API_KEY")
        print(f"   Valor: {plain_key}")
        print("\n3. Nos HTTP Request nodes, adicione header:")
        print("\n   Nome:  X-API-Key")
        print("   Valor: {{{{$env.SYNCA_API_KEY}}}}")
        print("-" * 70 + "\n")

        print("✅ Pronto! O N8N agora pode autenticar na API do Synca.\n")

    except Exception as e:
        print(f"\n❌ Erro ao criar System Key: {str(e)}\n")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


def main():
    """Entry point do script CLI."""
    parser = argparse.ArgumentParser(
        description="Criar System API Key para integração N8N",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python -m scripts.create_system_key --user-id f47ac10b-58cc-4372-a567-0e02b2c3d479
  python -m scripts.create_system_key --user-id f47ac10b-58cc-4372-a567-0e02b2c3d479 --force
  python -m scripts.create_system_key --user-id f47ac10b-58cc-4372-a567-0e02b2c3d479 --name "N8N Production"
        """,
    )

    parser.add_argument(
        "--user-id",
        required=True,
        help="UUID do usuário dono da key (obrigatório)",
    )
    parser.add_argument(
        "--name",
        help='Nome customizado da key (padrão: "N8N System Key")',
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Força criação revogando key existente",
    )

    args = parser.parse_args()

    # Exibir banner
    print_banner()

    # Criar key
    create_system_key(user_id_str=args.user_id, key_name=args.name, force=args.force)


if __name__ == "__main__":
    main()

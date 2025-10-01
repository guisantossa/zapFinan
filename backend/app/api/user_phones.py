"""
API endpoints para gerenciamento de telefones de usuário
"""

from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.plan_validation import HTTP_402_PAYMENT_REQUIRED
from app.crud import user_phone as crud_user_phone
from app.models.user import User
from app.schemas.user_phone import (
    PhoneVerificationConfirm,
    UserPhoneCreate,
    UserPhoneListResponse,
    UserPhoneResponse,
)

router = APIRouter()


# ============================================================================
# List & Get Endpoints
# ============================================================================


@router.get("/", response_model=UserPhoneListResponse)
async def list_user_phones(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Listar todos os telefones do usuário atual."""

    phones = crud_user_phone.get_user_phones(
        db,
        user_id=current_user.id,
        active_only=False,  # Mostrar todos, inclusive inativos
    )

    primary_phone = crud_user_phone.get_primary_phone(db, user_id=current_user.id)

    return UserPhoneListResponse(
        phones=phones, total=len(phones), primary_phone=primary_phone
    )


@router.get("/primary", response_model=UserPhoneResponse)
async def get_primary_phone(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obter telefone principal do usuário."""

    phone = crud_user_phone.get_primary_phone(db, user_id=current_user.id)

    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No primary phone found"
        )

    return phone


# ============================================================================
# Create Endpoint
# ============================================================================


@router.post("/", response_model=UserPhoneResponse, status_code=status.HTTP_201_CREATED)
async def add_phone(
    phone_data: UserPhoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Adicionar novo telefone ao usuário.

    Regras:
    - Se for o primeiro telefone, automaticamente vira primary
    - Se is_primary=True, outros telefones perdem flag primary
    - Limite baseado no plano (max_phones)

    Requer: Feature 'multi_phone_enabled' para adicionar mais de 1 telefone
    """

    # Contar telefones atuais
    phone_count = crud_user_phone.count_user_phones(db, user_id=current_user.id)

    # Se já tem 1 telefone e tenta adicionar mais, verificar feature
    if phone_count >= 1:
        if not current_user.plano:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No active plan. Please subscribe to a plan.",
            )

        if not current_user.plano.multi_phone_enabled:
            raise HTTPException(
                status_code=HTTP_402_PAYMENT_REQUIRED,
                detail="Multiple phones require plan upgrade. Feature: multi_phone_enabled",
            )

    # Verificar limite de telefones do plano
    max_phones = (
        current_user.plano.max_phones
        if current_user.plano and current_user.plano.max_phones is not None
        else 1
    )
    if phone_count >= max_phones:
        raise HTTPException(
            status_code=HTTP_402_PAYMENT_REQUIRED,
            detail=f"Phone limit reached. Current: {phone_count}, Limit: {max_phones}. Please upgrade your plan.",
        )

    # Criar telefone
    phone = crud_user_phone.create_phone(
        db,
        user_id=current_user.id,
        phone_number=phone_data.phone_number,
        is_primary=phone_data.is_primary,
        is_verified=False,  # Requer verificação
    )

    return phone


# ============================================================================
# Update Endpoints
# ============================================================================


@router.patch("/{phone_id}/set-primary", response_model=UserPhoneResponse)
async def set_primary_phone(
    phone_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Definir telefone como principal.

    Remove flag is_primary de outros telefones do usuário.
    """

    phone = crud_user_phone.set_primary_phone(
        db, phone_id=phone_id, user_id=current_user.id
    )

    return phone


@router.patch("/{phone_id}/deactivate", response_model=UserPhoneResponse)
async def deactivate_phone(
    phone_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Desativar telefone.

    Não pode desativar o único telefone ativo.
    Se desativar primary, outro telefone vira primary.
    """

    phone = crud_user_phone.deactivate_phone(
        db, phone_id=phone_id, user_id=current_user.id
    )

    return phone


@router.patch("/{phone_id}/activate", response_model=UserPhoneResponse)
async def activate_phone(
    phone_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reativar telefone desativado."""

    phone = crud_user_phone.get(db, id=phone_id)

    if not phone or phone.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Phone not found"
        )

    phone.is_active = True
    db.commit()
    db.refresh(phone)

    return phone


# ============================================================================
# Verification Endpoints
# ============================================================================


@router.post("/{phone_id}/request-verification", status_code=status.HTTP_200_OK)
async def request_phone_verification(
    phone_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Solicitar verificação de telefone via SMS.

    Gera um código de 6 dígitos e chama webhook n8n para envio.
    O código expira em 5 minutos.
    """

    # Buscar telefone
    phone = crud_user_phone.get(db, id=phone_id)

    if not phone or phone.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Phone not found"
        )

    if phone.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already verified"
        )

    # Gerar token de verificação
    verification_code = crud_user_phone.generate_verification_token(
        db, phone_id=phone_id, user_id=current_user.id
    )

    # Chamar webhook n8n para enviar SMS
    if settings.N8N_PHONE_VERIFICATION_WEBHOOK_URL:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    settings.N8N_PHONE_VERIFICATION_WEBHOOK_URL,
                    json={
                        "phone_number": phone.phone_number,
                        "verification_code": verification_code,
                        "user_name": current_user.nome or "Usuário",
                        "user_id": str(current_user.id),
                        "phone_id": str(phone_id),
                    },
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to send verification SMS",
                    )
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="SMS service timeout",
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error sending SMS: {str(e)}",
            )
    else:
        # Modo desenvolvimento: retornar código no response
        return {
            "message": "Verification code generated (dev mode)",
            "code": verification_code,
            "expires_in_minutes": 5,
        }

    return {"message": "Verification code sent via SMS", "expires_in_minutes": 5}


@router.post("/{phone_id}/verify", response_model=UserPhoneResponse)
async def verify_phone(
    phone_id: UUID,
    verification_data: PhoneVerificationConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verificar telefone com código recebido por SMS.

    O código expira em 5 minutos.
    """

    phone = crud_user_phone.verify_phone(
        db,
        phone_id=phone_id,
        user_id=current_user.id,
        verification_token=verification_data.verification_token,
    )

    return phone


# ============================================================================
# Delete Endpoint
# ============================================================================


@router.delete("/{phone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_phone(
    phone_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remover telefone permanentemente.

    Regras:
    - Não pode remover o único telefone
    - Se remover primary, outro vira primary
    """

    crud_user_phone.delete_phone(db, phone_id=phone_id, user_id=current_user.id)

    return None

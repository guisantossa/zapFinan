"""
API endpoints for API Key management

Security:
- All endpoints require JWT Bearer token authentication (not API key)
- API keys are for external integrations (N8N, automations)
- This API is for managing those keys via web interface
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.plan_validation import HTTP_402_PAYMENT_REQUIRED
from app.crud import api_key as crud_api_key
from app.models.user import User
from app.schemas.api_key import (
    APIKeyCreate,
    APIKeyListResponse,
    APIKeyResponse,
    APIKeyScopesUpdate,
    APIKeyStats,
    APIKeyUpdate,
    APIKeyWithPlainKey,
)

router = APIRouter()


# ============================================================================
# List & Get Endpoints
# ============================================================================


@router.get("/", response_model=APIKeyListResponse)
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active_only: bool = True,
):
    """
    List all API keys for the current user.

    Args:
        active_only: If True, only return active keys (default: True)

    Returns:
        List of API keys (without sensitive data)
    """

    keys = crud_api_key.get_by_user(
        db,
        user_id=current_user.id,
        active_only=active_only,
    )

    active_count = sum(1 for key in keys if key.is_active)

    return APIKeyListResponse(
        keys=keys,
        total=len(keys),
        active=active_count,
    )


@router.get("/stats", response_model=APIKeyStats)
async def get_api_key_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get statistics about user's API keys.

    Returns:
        Summary of key usage, scopes, and status
    """

    all_keys = crud_api_key.get_by_user(
        db,
        user_id=current_user.id,
        active_only=False,
    )

    active_keys = [key for key in all_keys if key.is_active]
    inactive_keys = [key for key in all_keys if not key.is_active]

    # Check for expired keys
    now = datetime.utcnow()
    expired_keys = [
        key for key in active_keys if key.expires_at and key.expires_at <= now
    ]

    # Keys never used
    never_used = [key for key in all_keys if not key.last_used_at]

    # Scope usage summary
    scopes_summary = {}
    for key in active_keys:
        for scope in key.scopes or []:
            scopes_summary[scope] = scopes_summary.get(scope, 0) + 1

    return APIKeyStats(
        total_keys=len(all_keys),
        active_keys=len(active_keys),
        inactive_keys=len(inactive_keys),
        expired_keys=len(expired_keys),
        never_used_keys=len(never_used),
        scopes_summary=scopes_summary,
    )


@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get details of a specific API key.

    Returns:
        API key details (without sensitive data like hash or full key)
    """

    api_key = crud_api_key.get(db, id=key_id)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    # Verify ownership
    if api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this API key",
        )

    return api_key


# ============================================================================
# Create Endpoint
# ============================================================================


@router.post(
    "/", response_model=APIKeyWithPlainKey, status_code=status.HTTP_201_CREATED
)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new API key.

    IMPORTANT:
    - The full key is returned ONLY ONCE in this response
    - Save it immediately - it cannot be retrieved later
    - Only the key prefix is stored for identification

    Requires:
    - Feature 'api_access' enabled in user's plan
    """

    # Check if user has API access feature
    if not current_user.plano:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active plan. Please subscribe to a plan.",
        )

    if not current_user.plano.api_access:
        raise HTTPException(
            status_code=HTTP_402_PAYMENT_REQUIRED,
            detail="API access requires plan upgrade. Feature: api_access",
        )

    # Create API key
    api_key, plain_key = crud_api_key.create_with_key(
        db,
        user_id=current_user.id,
        name=key_data.name,
        description=key_data.description,
        scopes=key_data.scopes,
        expires_at=key_data.expires_at,
        allowed_ips=key_data.allowed_ips,
        rate_limit=key_data.rate_limit,
    )

    # Return response with plain key (only time it's shown)
    response = APIKeyWithPlainKey.model_validate(api_key)
    response.key = plain_key

    return response


# ============================================================================
# Update Endpoints
# ============================================================================


@router.patch("/{key_id}", response_model=APIKeyResponse)
async def update_api_key(
    key_id: UUID,
    key_data: APIKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update API key metadata and settings.

    Can update:
    - name: Display name
    - description: Usage description
    - scopes: Permissions array
    - is_active: Activate/deactivate
    - allowed_ips: IP whitelist
    - rate_limit: Custom rate limit
    """

    api_key = crud_api_key.get(db, id=key_id)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    # Verify ownership
    if api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this API key",
        )

    # Update using CRUDBase update method
    updated_key = crud_api_key.update(
        db,
        db_obj=api_key,
        obj_in=key_data,
    )

    return updated_key


@router.patch("/{key_id}/scopes", response_model=APIKeyResponse)
async def update_api_key_scopes(
    key_id: UUID,
    scopes_data: APIKeyScopesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update ONLY the scopes/permissions of an API key.

    This is a convenience endpoint for quickly changing permissions.
    """

    updated_key = crud_api_key.update_scopes(
        db,
        api_key_id=key_id,
        user_id=current_user.id,
        scopes=scopes_data.scopes,
    )

    return updated_key


@router.post("/{key_id}/revoke", response_model=APIKeyResponse)
async def revoke_api_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Revoke an API key immediately (soft delete).

    This sets is_active = False, making the key unusable.
    The key remains in the database for audit purposes.
    """

    revoked_key = crud_api_key.revoke_key(
        db,
        api_key_id=key_id,
        user_id=current_user.id,
    )

    return revoked_key


@router.post("/{key_id}/activate", response_model=APIKeyResponse)
async def activate_api_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reactivate a previously revoked API key.

    This sets is_active = True.
    """

    activated_key = crud_api_key.activate_key(
        db,
        api_key_id=key_id,
        user_id=current_user.id,
    )

    return activated_key


# ============================================================================
# Delete Endpoint
# ============================================================================


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently delete an API key (hard delete).

    WARNING: This action cannot be undone.
    Consider using revoke instead for audit trail.
    """

    crud_api_key.delete_key(
        db,
        api_key_id=key_id,
        user_id=current_user.id,
    )

    return None


# ============================================================================
# System Key Endpoint (for N8N integration)
# ============================================================================


@router.post(
    "/system", response_model=APIKeyWithPlainKey, status_code=status.HTTP_201_CREATED
)
async def create_system_api_key(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create system-wide API key for N8N integration.

    This creates a special API key that the N8N system uses to authenticate
    ALL webhook requests. Individual user permissions are then validated based
    on the phone/lid provided in the request body.

    The key is created with ALL scopes enabled:
    - transactions
    - budgets
    - commitments
    - reports

    SECURITY NOTE:
    - This key bypasses normal plan validation for authentication
    - User plan features are validated INSIDE endpoints using request body data
    - Only logged-in users can create (consider adding admin check in production)

    Returns:
        API key with plain text (ONLY shown once - save it immediately!)

    Example response:
        {
            "id": "uuid",
            "key": "zpg_abc123...",  # ⚠️ SAVE THIS! Never shown again
            "key_prefix": "zpg_abc1",
            "name": "N8N System Key",
            ...
        }
    """

    # TODO: Add admin check when user roles are implemented
    # For now, any authenticated user can create
    # if not current_user.is_admin:
    #     raise HTTPException(403, "Admin access required")

    # Check if system key already exists for this user
    existing_keys = crud_api_key.get_by_user(
        db, user_id=current_user.id, active_only=True
    )
    system_keys = [k for k in existing_keys if k.name == "N8N System Key"]

    if system_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "SYSTEM_KEY_EXISTS",
                "message": "System key already exists for this user. Revoke the existing one first.",
                "existing_key_id": str(system_keys[0].id),
                "existing_key_prefix": system_keys[0].key_prefix,
            },
        )

    # Create system key with all scopes
    api_key, plain_key = crud_api_key.create_with_key(
        db,
        user_id=current_user.id,
        name="N8N System Key",
        description="System-wide API key for N8N WhatsApp webhook integration",
        scopes=["transactions", "budgets", "commitments", "reports"],
        expires_at=None,  # Never expires
    )

    # Return response with plain key (only time it's shown)
    response = APIKeyWithPlainKey.model_validate(api_key)
    response.key = plain_key

    return response

"""
API Key Authentication Layer for N8N and external integrations.

Security features:
- X-API-Key header authentication
- Bcrypt hash verification (never plain text comparison)
- Scope/permission validation
- IP whitelisting support
- Expiration checking
- Usage tracking (last_used_at)
- Dual authentication fallback (Bearer Token → API Key)
"""

import logging
from typing import Optional

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.api_key import APIKey
from app.models.user import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def get_user_from_api_key(
    x_api_key: Optional[str] = Header(None),
    request: Request = None,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Authenticate user via API Key from X-API-Key header.

    Flow:
    1. Extract key from X-API-Key header
    2. Lookup by key_prefix (first 8 chars) for performance
    3. Verify full key hash with bcrypt
    4. Check if key is valid (active + not expired)
    5. Check IP whitelist if configured
    6. Update last_used_at timestamp
    7. Return associated User

    Returns:
        User: Authenticated user if API key is valid
        None: If no API key provided or authentication fails

    Raises:
        HTTPException 401: If API key is invalid/expired
        HTTPException 403: If IP not allowed
    """

    if not x_api_key:
        return None

    # Validate key format (should be "zpg_" + 48 hex chars)
    if not x_api_key.startswith("zpg_") or len(x_api_key) != 52:
        logger.warning(f"[API_KEY_AUTH] Invalid API key format: {x_api_key[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Extract prefix for database lookup (performance optimization)
    key_prefix = x_api_key[:8]  # "zpg_1a2b"

    try:
        # Find API key by prefix
        api_key = (
            db.query(APIKey)
            .filter(
                APIKey.key_prefix == key_prefix,
                APIKey.is_active,  # Only active keys
            )
            .first()
        )

        if not api_key:
            logger.warning(f"[API_KEY_AUTH] API key not found: {key_prefix}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "ApiKey"},
            )

        # Verify full key hash (bcrypt comparison)
        if not api_key.verify_key(x_api_key):
            logger.warning(f"[API_KEY_AUTH] Invalid API key hash: {key_prefix}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "ApiKey"},
            )

        # Check if key is valid (active + not expired)
        if not api_key.is_valid():
            logger.warning(f"[API_KEY_AUTH] API key expired or inactive: {key_prefix}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key expired or deactivated",
                headers={"WWW-Authenticate": "ApiKey"},
            )

        # Check IP whitelist if configured
        if request:
            client_ip = request.client.host if request.client else None
            if client_ip and not api_key.is_ip_allowed(client_ip):
                logger.warning(
                    f"[API_KEY_AUTH] IP not allowed for key {key_prefix}: {client_ip}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="API key not allowed from this IP address",
                )

        # Update last_used_at timestamp
        api_key.update_last_used()
        db.commit()

        # Get associated user
        user = db.query(User).filter(User.id == api_key.user_id).first()

        if not user:
            logger.error(
                f"[API_KEY_AUTH] User not found for API key: {api_key.user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "ApiKey"},
            )

        # Check if user is active
        if not user.is_active:
            logger.warning(f"[API_KEY_AUTH] User account deactivated: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated",
            )

        logger.info(
            f"[API_KEY_AUTH] Successfully authenticated user {user.id} via API key {key_prefix}"
        )
        return user

    except HTTPException:
        # Re-raise HTTP exceptions (already logged above)
        raise
    except Exception as e:
        logger.error(f"[API_KEY_AUTH] Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during API key authentication",
        )


def require_api_key(
    user: Optional[User] = Depends(get_user_from_api_key),
) -> User:
    """
    Require API Key authentication (raises 401 if not provided).

    Use this dependency when you want to ONLY accept API Key authentication.

    Example:
        @router.post("/webhook")
        def handle_webhook(user: User = Depends(require_api_key)):
            # Only API key authentication accepted
            pass

    Raises:
        HTTPException 401: If no API key provided or invalid
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return user


def get_current_user_flexible(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None),
    request: Request = None,
    db: Session = Depends(get_db),
) -> User:
    """
    Dual authentication: Accept EITHER Bearer Token OR API Key.

    Flow:
    1. Try JWT Bearer token first (standard web authentication)
    2. If no bearer token, try API key from X-API-Key header
    3. If both fail, raise 401

    This is the RECOMMENDED dependency for N8N endpoints because:
    - Web users authenticate with Bearer tokens (normal flow)
    - N8N/automations authenticate with API keys
    - Same endpoint works for both use cases

    Example:
        @router.post("/transaction/create")
        def create_transaction(
            user: User = Depends(get_current_user_flexible),
            data: TransactionCreate
        ):
            # Works with both Bearer token AND API key
            pass

    Raises:
        HTTPException 401: If neither authentication method succeeds
    """

    # Import here to avoid circular dependency
    from app.core.auth import verify_token
    from app.models.user import User

    user = None

    if credentials:
        try:
            # Validate JWT token manually (can't call get_current_user because it uses Depends)
            token = credentials.credentials
            subject = verify_token(token, "access")

            if not subject:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                )

            # Get user from database directly
            user = db.query(User).filter(User.id == subject).first()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found",
                )

            logger.info(f"[DUAL_AUTH] Authenticated via Bearer token: user {user.id}")
            return user
        except HTTPException as e:
            # JWT auth failed, will try API key next
            logger.warning(
                f"[DUAL_AUTH] Bearer token authentication failed: {e.detail}"
            )
            pass
        except Exception as e:
            # Unexpected error, log but continue to API key
            logger.warning(f"[DUAL_AUTH] Unexpected error in Bearer auth: {str(e)}")
            import traceback

            logger.warning(traceback.format_exc())
            pass

    # Try API Key fallback
    if x_api_key:
        try:
            user = get_user_from_api_key(x_api_key=x_api_key, request=request, db=db)
            if user:
                logger.info(f"[DUAL_AUTH] Authenticated via API key: user {user.id}")
                return user
        except HTTPException:
            # API key auth failed
            raise
        except Exception as e:
            logger.error(f"[DUAL_AUTH] Unexpected error in API key auth: {str(e)}")
            pass

    # Both authentication methods failed
    logger.warning("[DUAL_AUTH] No valid authentication provided")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required: provide either Bearer token or X-API-Key header",
        headers={"WWW-Authenticate": "Bearer, ApiKey"},
    )


def check_api_key_scope(api_key: APIKey, required_scope: str) -> bool:
    """
    Check if API key has permission for a specific scope/feature.

    Args:
        api_key: APIKey instance
        required_scope: Feature name (e.g., "transactions", "budgets", "reports")

    Returns:
        bool: True if scope is granted

    Example:
        if not check_api_key_scope(api_key, "transactions"):
            raise HTTPException(403, "API key does not have 'transactions' permission")
    """
    return api_key.has_scope(required_scope)


def get_api_key_from_request(
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[APIKey]:
    """
    Extract and validate API key from request (without authentication).

    Useful for endpoints that need to check API key metadata/scopes
    without necessarily requiring authentication.

    Returns:
        APIKey: The API key object if valid
        None: If no API key provided or invalid
    """
    if not x_api_key or not x_api_key.startswith("zpg_"):
        return None

    key_prefix = x_api_key[:8]

    try:
        api_key = (
            db.query(APIKey)
            .filter(
                APIKey.key_prefix == key_prefix,
                APIKey.is_active,
            )
            .first()
        )

        if api_key and api_key.verify_key(x_api_key) and api_key.is_valid():
            return api_key

    except Exception as e:
        logger.error(f"[API_KEY_AUTH] Error retrieving API key: {str(e)}")

    return None

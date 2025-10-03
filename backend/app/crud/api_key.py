"""
CRUD operations for APIKey model
"""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreate, APIKeyUpdate


class CRUDAPIKey(CRUDBase[APIKey, APIKeyCreate, APIKeyUpdate]):
    """CRUD operations for API Keys with security logic."""

    # ========================================================================
    # Read Operations
    # ========================================================================

    def get_by_prefix(
        self, db: Session, *, key_prefix: str, active_only: bool = True
    ) -> Optional[APIKey]:
        """Get API key by prefix (first 8 chars)."""
        query = db.query(APIKey).filter(APIKey.key_prefix == key_prefix)

        if active_only:
            query = query.filter(APIKey.is_active)

        return query.first()

    def get_by_user(
        self, db: Session, *, user_id: UUID, active_only: bool = True
    ) -> List[APIKey]:
        """Get all API keys for a user."""
        query = db.query(APIKey).filter(APIKey.user_id == user_id)

        if active_only:
            query = query.filter(APIKey.is_active)

        return query.order_by(APIKey.created_at.desc()).all()

    def count_user_keys(
        self, db: Session, *, user_id: UUID, active_only: bool = True
    ) -> int:
        """Count API keys for a user."""
        query = db.query(APIKey).filter(APIKey.user_id == user_id)

        if active_only:
            query = query.filter(APIKey.is_active)

        return query.count()

    def get_expired_keys(self, db: Session) -> List[APIKey]:
        """Get all expired API keys (for cleanup tasks)."""
        now = datetime.now(timezone.utc)
        return (
            db.query(APIKey)
            .filter(
                and_(
                    APIKey.is_active,
                    APIKey.expires_at.isnot(None),
                    APIKey.expires_at <= now,
                )
            )
            .all()
        )

    # ========================================================================
    # Create Operations
    # ========================================================================

    def create_with_key(
        self,
        db: Session,
        *,
        user_id: UUID,
        name: str,
        description: Optional[str] = None,
        scopes: Optional[List[str]] = None,
        expires_at: Optional[datetime] = None,
        allowed_ips: Optional[List[str]] = None,
        rate_limit: Optional[int] = None,
    ) -> tuple[APIKey, str]:
        """
        Create a new API key and return both the model and the plain text key.

        Returns:
            tuple[APIKey, str]: (api_key_object, plain_text_key)

        Note:
            The plain text key is only returned ONCE at creation.
            It cannot be recovered later.
        """

        # Generate cryptographically secure key
        full_key, key_prefix = APIKey.generate_key()

        # Hash the key (never store plain text)
        key_hash = APIKey.hash_key(full_key)

        # Create API key object
        api_key = APIKey(
            user_id=user_id,
            key_prefix=key_prefix,
            key_hash=key_hash,
            name=name,
            description=description,
            scopes=scopes or [],
            is_active=True,
            expires_at=expires_at,
            allowed_ips=allowed_ips,
            rate_limit=rate_limit,
        )

        db.add(api_key)
        db.commit()
        db.refresh(api_key)

        # Return both object and plain key (shown only once)
        return api_key, full_key

    # ========================================================================
    # Update Operations
    # ========================================================================

    def update_scopes(
        self, db: Session, *, api_key_id: UUID, user_id: UUID, scopes: List[str]
    ) -> APIKey:
        """Update API key scopes/permissions."""

        api_key = (
            db.query(APIKey)
            .filter(and_(APIKey.id == api_key_id, APIKey.user_id == user_id))
            .first()
        )

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found",
            )

        api_key.scopes = scopes
        db.commit()
        db.refresh(api_key)

        return api_key

    def update_metadata(
        self,
        db: Session,
        *,
        api_key_id: UUID,
        user_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> APIKey:
        """Update API key name and description."""

        api_key = (
            db.query(APIKey)
            .filter(and_(APIKey.id == api_key_id, APIKey.user_id == user_id))
            .first()
        )

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found",
            )

        if name is not None:
            api_key.name = name
        if description is not None:
            api_key.description = description

        db.commit()
        db.refresh(api_key)

        return api_key

    def activate_key(self, db: Session, *, api_key_id: UUID, user_id: UUID) -> APIKey:
        """Activate a deactivated API key."""

        api_key = (
            db.query(APIKey)
            .filter(and_(APIKey.id == api_key_id, APIKey.user_id == user_id))
            .first()
        )

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found",
            )

        api_key.is_active = True
        db.commit()
        db.refresh(api_key)

        return api_key

    def deactivate_key(self, db: Session, *, api_key_id: UUID, user_id: UUID) -> APIKey:
        """Deactivate an API key (soft delete)."""

        api_key = (
            db.query(APIKey)
            .filter(and_(APIKey.id == api_key_id, APIKey.user_id == user_id))
            .first()
        )

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found",
            )

        api_key.is_active = False
        db.commit()
        db.refresh(api_key)

        return api_key

    def revoke_key(self, db: Session, *, api_key_id: UUID, user_id: UUID) -> APIKey:
        """Revoke API key immediately (alias for deactivate)."""
        return self.deactivate_key(db, api_key_id=api_key_id, user_id=user_id)

    def update_last_used(self, db: Session, *, api_key_id: UUID) -> APIKey:
        """Update last_used_at timestamp (called during authentication)."""

        api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()

        if api_key:
            api_key.last_used_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(api_key)

        return api_key

    # ========================================================================
    # Delete Operations
    # ========================================================================

    def delete_key(self, db: Session, *, api_key_id: UUID, user_id: UUID) -> bool:
        """Permanently delete API key (hard delete)."""

        api_key = (
            db.query(APIKey)
            .filter(and_(APIKey.id == api_key_id, APIKey.user_id == user_id))
            .first()
        )

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found",
            )

        db.delete(api_key)
        db.commit()

        return True

    def delete_expired_keys(self, db: Session) -> int:
        """
        Delete all expired API keys (cleanup task).

        Returns:
            int: Number of keys deleted
        """
        expired_keys = self.get_expired_keys(db)
        count = len(expired_keys)

        for key in expired_keys:
            db.delete(key)

        db.commit()

        return count

    # ========================================================================
    # Validation Operations
    # ========================================================================

    def verify_key_access(
        self,
        db: Session,
        *,
        plain_key: str,
        required_scope: Optional[str] = None,
        client_ip: Optional[str] = None,
    ) -> Optional[APIKey]:
        """
        Verify API key and check permissions.

        Args:
            plain_key: Plain text API key
            required_scope: Required permission scope (optional)
            client_ip: Client IP address for whitelisting (optional)

        Returns:
            APIKey: Valid API key if all checks pass
            None: If key is invalid or checks fail
        """

        # Extract prefix
        if not plain_key.startswith("zpg_") or len(plain_key) != 52:
            return None

        key_prefix = plain_key[:8]

        # Find active key by prefix
        api_key = self.get_by_prefix(db, key_prefix=key_prefix, active_only=True)

        if not api_key:
            return None

        # Verify hash
        if not api_key.verify_key(plain_key):
            return None

        # Check if valid (active + not expired)
        if not api_key.is_valid():
            return None

        # Check IP whitelist if configured
        if client_ip and not api_key.is_ip_allowed(client_ip):
            return None

        # Check scope if required
        if required_scope and not api_key.has_scope(required_scope):
            return None

        return api_key

    def check_rate_limit(
        self, db: Session, *, api_key_id: UUID
    ) -> tuple[bool, Optional[int]]:
        """
        Check if API key is within rate limit.

        Returns:
            tuple[bool, Optional[int]]: (is_allowed, custom_rate_limit)

        Note:
            This is a placeholder for rate limiting logic.
            Actual implementation would use Redis or similar.
        """

        api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()

        if not api_key:
            return False, None

        return True, api_key.rate_limit


# Singleton instance
api_key = CRUDAPIKey(APIKey)

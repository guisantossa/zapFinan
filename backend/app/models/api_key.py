"""
API Key model for N8N and external integrations authentication.

Security features:
- bcrypt hashed keys (never stores plain text)
- Granular scopes per feature
- Soft deletion via is_active
- Optional expiration dates
- IP whitelisting support
- Usage tracking
"""

import secrets
import uuid
from datetime import datetime, timezone

from passlib.context import CryptContext
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

# Password context for bcrypt hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class APIKey(Base):
    """
    API Keys for machine-to-machine authentication (N8N, webhooks, automations).

    Each key is:
    - Tied to a specific user
    - Has granular scopes (permissions)
    - Can be revoked instantly
    - Optionally expires
    - Tracks usage

    Security:
    - key_hash: bcrypt hash of the secret (never plain text)
    - key_prefix: First 8 chars for quick lookup (e.g., "zpg_1a2b")
    - scopes: Array of allowed features
    - is_active: Soft deletion
    - expires_at: Optional expiration
    """

    __tablename__ = "api_keys"

    # Primary identification
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        comment="Unique API key ID",
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Owner user ID",
    )

    # Key security (never returns plain text after creation)
    key_prefix = Column(
        String(8),
        nullable=False,
        index=True,
        comment="First 8 characters of key for quick lookup (e.g., 'zpg_1a2b')",
    )

    key_hash = Column(
        String(255), nullable=False, comment="Bcrypt hash of the full key"
    )

    # Metadata
    name = Column(
        String(100),
        nullable=False,
        comment="User-friendly name (e.g., 'N8N Production')",
    )

    description = Column(
        Text, nullable=True, comment="Optional description of key usage"
    )

    # Permissions
    scopes = Column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
        comment="Array of feature scopes (e.g., ['transactions', 'budgets'])",
    )

    # Control flags
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
        index=True,
        comment="Soft deletion flag",
    )

    last_used_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last time this key was used for authentication",
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        comment="Optional expiration date (None = never expires)",
    )

    # Additional security (optional)
    allowed_ips = Column(
        JSONB, nullable=True, comment="Array of allowed IP addresses (None = any IP)"
    )

    rate_limit = Column(
        Integer,
        nullable=True,
        comment="Custom rate limit in requests/minute (None = default)",
    )

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Creation timestamp",
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Last update timestamp",
    )

    # Relationships
    user = relationship("User", back_populates="api_keys")

    @staticmethod
    def generate_key() -> tuple[str, str]:
        """
        Generate a cryptographically secure API key.

        Format: zpg_{48_hex_chars}
        Example: zpg_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7

        Returns:
            tuple[str, str]: (full_key, key_prefix)
            - full_key: Complete key to give to user (only shown once)
            - key_prefix: First 8 chars for database lookup
        """
        # Generate 24 random bytes = 48 hex characters
        secret = secrets.token_hex(24)

        # Prefix for identification + secret
        full_key = f"zpg_{secret}"
        key_prefix = full_key[:8]  # "zpg_1a2b"

        return full_key, key_prefix

    @staticmethod
    def hash_key(plain_key: str) -> str:
        """
        Hash a plain API key using bcrypt.

        Bcrypt has a 72-byte limit for input. We truncate to ensure compatibility.

        Args:
            plain_key: Plain text API key

        Returns:
            str: Bcrypt hash
        """
        # Bcrypt limit: 72 bytes (72 characters for ASCII)
        # Our keys are 52 chars (zpg_ + 48 hex), well within limit
        # Truncate as safety measure
        return pwd_context.hash(plain_key[:72])

    def verify_key(self, plain_key: str) -> bool:
        """
        Verify if provided key matches the stored hash.

        Applies same truncation as hash_key to ensure consistency.

        Args:
            plain_key: Plain text key to verify

        Returns:
            bool: True if matches, False otherwise
        """
        # Apply same truncation as hash_key for consistency
        return pwd_context.verify(plain_key[:72], self.key_hash)

    def has_scope(self, scope: str) -> bool:
        """
        Check if this key has permission for a specific scope/feature.

        Args:
            scope: Feature name (e.g., "transactions", "budgets")

        Returns:
            bool: True if scope is granted
        """
        if not self.scopes:
            return False
        return scope in self.scopes

    def is_valid(self) -> bool:
        """
        Check if key is currently valid (active and not expired).

        Returns:
            bool: True if key can be used
        """
        # Must be active
        if not self.is_active:
            return False

        # Check expiration if set
        if self.expires_at:
            now = datetime.now(timezone.utc)
            if now >= self.expires_at:
                return False

        return True

    def is_ip_allowed(self, ip_address: str) -> bool:
        """
        Check if IP address is allowed to use this key.

        Args:
            ip_address: Client IP address

        Returns:
            bool: True if allowed (or no IP restriction)
        """
        # No restriction = allow all
        if not self.allowed_ips:
            return True

        return ip_address in self.allowed_ips

    def update_last_used(self):
        """Update the last_used_at timestamp to now."""
        self.last_used_at = datetime.now(timezone.utc)

    def __repr__(self) -> str:
        return f"<APIKey(id={self.id}, name='{self.name}', prefix='{self.key_prefix}', active={self.is_active})>"

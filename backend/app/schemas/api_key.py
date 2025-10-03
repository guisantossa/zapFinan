"""
Pydantic Schemas for API Key
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

# ============================================================================
# Base Schemas
# ============================================================================


class APIKeyBase(BaseModel):
    """Base schema for API Key."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User-friendly name (e.g., 'N8N Production', 'Testing Key')",
        examples=["N8N Production", "Development Key", "Mobile App"],
    )
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional description of how this key is used",
    )
    scopes: List[str] = Field(
        default_factory=list,
        description="Array of feature scopes/permissions",
        examples=[
            ["transactions", "budgets"],
            ["reports", "commitments"],
        ],
    )

    @field_validator("scopes", mode="before")
    @classmethod
    def validate_scopes(cls, v):
        """Validate that scopes is a list."""
        if v is None:
            return []
        if not isinstance(v, list):
            raise ValueError("Scopes must be a list")
        return v


# ============================================================================
# Create Schemas
# ============================================================================


class APIKeyCreate(APIKeyBase):
    """Schema for creating a new API key."""

    expires_at: Optional[datetime] = Field(
        default=None,
        description="Optional expiration date (None = never expires)",
    )
    allowed_ips: Optional[List[str]] = Field(
        default=None,
        description="Optional IP whitelist (None = allow all IPs)",
        examples=[["192.168.1.100", "10.0.0.50"]],
    )
    rate_limit: Optional[int] = Field(
        default=None,
        gt=0,
        description="Custom rate limit in requests/minute (None = use default)",
    )


# ============================================================================
# Update Schemas
# ============================================================================


class APIKeyUpdate(BaseModel):
    """Schema for updating an existing API key."""

    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Update name",
    )
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Update description",
    )
    scopes: Optional[List[str]] = Field(
        default=None,
        description="Update scopes/permissions",
    )
    is_active: Optional[bool] = Field(
        default=None,
        description="Activate or deactivate key",
    )
    allowed_ips: Optional[List[str]] = Field(
        default=None,
        description="Update IP whitelist",
    )
    rate_limit: Optional[int] = Field(
        default=None,
        gt=0,
        description="Update rate limit",
    )


# ============================================================================
# Response Schemas
# ============================================================================


class APIKeyResponse(APIKeyBase):
    """
    Schema for API key response.

    SECURITY: Never exposes key_hash or full key in responses.
    Only shows key_prefix for identification.
    """

    id: UUID
    user_id: UUID
    key_prefix: str = Field(
        ...,
        description="First 8 characters of key for identification (e.g., 'zpg_1a2b')",
    )
    is_active: bool
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    allowed_ips: Optional[List[str]] = None
    rate_limit: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class APIKeyWithPlainKey(APIKeyResponse):
    """
    Special schema that includes the plain text key.

    SECURITY:
    - Only used at creation (POST /api-keys)
    - Never stored in database
    - Never returned again
    - User must save it immediately
    """

    key: str = Field(
        ...,
        description="Full API key - SAVE THIS NOW! It will never be shown again.",
        examples=["........"],  # pragma: allowlist secret
    )


# ============================================================================
# List Response Schema
# ============================================================================


class APIKeyListResponse(BaseModel):
    """Schema for listing API keys."""

    keys: List[APIKeyResponse]
    total: int = Field(..., description="Total number of keys")
    active: int = Field(..., description="Number of active keys")


# ============================================================================
# Action Schemas
# ============================================================================


class APIKeyScopesUpdate(BaseModel):
    """Schema for updating only scopes."""

    scopes: List[str] = Field(
        ...,
        description="New list of scopes/permissions",
    )


class APIKeyRevoke(BaseModel):
    """Schema for revoking API key."""

    confirm: bool = Field(
        ...,
        description="Confirmation flag (must be true)",
    )

    @field_validator("confirm")
    @classmethod
    def validate_confirm(cls, v):
        """Ensure user confirms revocation."""
        if not v:
            raise ValueError("Must confirm revocation by setting confirm=true")
        return v


# ============================================================================
# Statistics Schema
# ============================================================================


class APIKeyStats(BaseModel):
    """Statistics about API key usage."""

    total_keys: int
    active_keys: int
    inactive_keys: int
    expired_keys: int
    never_used_keys: int
    scopes_summary: dict = Field(
        default_factory=dict,
        description="Summary of scopes usage across all keys",
        examples=[{"transactions": 5, "budgets": 3, "reports": 2}],
    )

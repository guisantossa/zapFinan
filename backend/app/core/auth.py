import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Configuration
ALGORITHM = "HS256"
security = HTTPBearer()


def create_access_token(
    subject: Union[str, Any] = None, data: dict = None, expires_delta: timedelta = None
) -> str:
    """Create JWT access token."""
    # Handle both old and new calling patterns
    if data is not None:
        subject = data.get("sub")

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": int(expire.timestamp()), "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """Create JWT refresh token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=30)

    to_encode = {"exp": int(expire.timestamp()), "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """Verify JWT token and return subject if valid."""

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])

        token_sub: str = payload.get("sub")
        token_exp: datetime = payload.get("exp")
        token_type_claim: str = payload.get("type")

        if token_sub is None:
            logger.warning("[AUTH] Token verification failed: subject is None")
            return None

        if token_type_claim != token_type:
            logger.warning(
                f"[AUTH] Token verification failed: type mismatch. Expected: {token_type}, Got: {token_type_claim}"
            )
            return None

        current_timestamp = datetime.now(timezone.utc).timestamp()

        if token_exp is None or current_timestamp > token_exp:
            logger.warning("[AUTH] Token verification failed: token expired")
            return None

        return token_sub
    except JWTError as e:
        logger.error(f"[AUTH] JWTError in verify_token: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"[AUTH] Unexpected error in verify_token: {str(e)}")
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials - DEBUG MODE ACTIVE",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Extract token from credentials
        token = credentials.credentials
        subject = verify_token(token, "access")

        if subject is None:
            logger.warning("[AUTH] Token verification failed - subject is None")
            raise credentials_exception

    except JWTError as e:
        logger.error(f"[AUTH] JWTError during token verification: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"[AUTH] Unexpected error during token verification: {str(e)}")
        raise credentials_exception

    # Get user from database
    try:
        user_uuid = UUID(subject)
        user = db.query(User).filter(User.id == user_uuid).first()

    except ValueError as e:
        logger.error(f"[AUTH] ValueError converting subject to UUID: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"[AUTH] Database error: {str(e)}")
        raise credentials_exception

    if user is None:
        logger.warning("[AUTH] User not found in database")
        raise credentials_exception

    # Check if user is active
    if not user.is_active:
        logger.warning("[AUTH] User account is deactivated")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated"
        )

    # Check if account is locked due to failed attempts
    if user.failed_login_attempts >= 5:
        logger.warning(
            f"[AUTH] Account locked due to failed attempts: {user.failed_login_attempts}"
        )
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is locked due to too many failed login attempts",
        )

    # Update last activity timestamp (optional)
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated"
        )
    return current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get current user if authenticated, None otherwise."""
    if not credentials:
        return None

    try:
        token = credentials.credentials
        subject = verify_token(token, "access")

        if subject is None:
            return None

        try:
            user_uuid = UUID(subject)
            user = db.query(User).filter(User.id == user_uuid).first()
        except ValueError:
            return None

        # Check user status more thoroughly
        if (
            not user
            or not user.is_active
            or (user.failed_login_attempts and user.failed_login_attempts >= 5)
        ):
            return None
        return user

    except Exception:
        return None


def refresh_access_token(refresh_token: str, db: Session) -> dict:
    """Refresh access token using refresh token."""
    subject = verify_token(refresh_token, "refresh")

    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Verify user still exists and is active
    try:
        user_uuid = UUID(subject)
        user = db.query(User).filter(User.id == user_uuid).first()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Create new tokens
    access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


def create_jwt_payload(user_id: str, token_type: str = "access") -> dict:
    """Create JWT payload with additional security claims."""
    now = datetime.now(timezone.utc)

    if token_type == "access":
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    else:  # refresh
        expire = now + timedelta(days=30)

    return {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": token_type,
        "jti": str(uuid.uuid4()),  # JWT ID for token tracking
    }


def revoke_user_tokens(user_id: str, db: Session):
    """Revoke all tokens for a user (would need token blacklist in production)."""
    # In production, implement a token blacklist/revocation system
    # For now, we can force password change which invalidates old sessions
    try:
        user_uuid = UUID(user_id)
        user = db.query(User).filter(User.id == user_uuid).first()
        if user:
            user.last_password_change = datetime.now(timezone.utc)
            db.commit()
    except ValueError:
        pass


def unlock_user_account(user_id: str, db: Session) -> bool:
    """Unlock a user account that was locked due to failed attempts."""
    try:
        user_uuid = UUID(user_id)
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            return False

        user.failed_login_attempts = 0
        user.is_active = True
        db.commit()
        return True
    except ValueError:
        return False

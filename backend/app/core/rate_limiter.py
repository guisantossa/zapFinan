from datetime import datetime, timedelta
from typing import Dict

from fastapi import HTTPException, Request, status
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# In-memory storage for rate limiting (in production, use Redis)
failed_attempts: Dict[str, Dict[str, any]] = {}


def get_client_ip(request: Request):
    """Get client IP address from request."""
    return get_remote_address(request)


# Rate limiter instance
limiter = Limiter(key_func=get_client_ip)


def check_failed_attempts(
    client_ip: str, max_attempts: int = 5, window_minutes: int = 15
):
    """Check if client has exceeded failed login attempts."""
    now = datetime.utcnow()

    if client_ip in failed_attempts:
        attempt_data = failed_attempts[client_ip]

        # Reset if window has expired
        if now - attempt_data["first_attempt"] > timedelta(minutes=window_minutes):
            failed_attempts[client_ip] = {
                "count": 1,
                "first_attempt": now,
                "blocked_until": None,
            }
            return False

        # Check if currently blocked
        if attempt_data.get("blocked_until") and now < attempt_data["blocked_until"]:
            return True

        # Check if max attempts exceeded
        if attempt_data["count"] >= max_attempts:
            # Block for increasing durations (exponential backoff)
            block_duration = min(
                2 ** (attempt_data["count"] - max_attempts), 60
            )  # Max 60 minutes
            failed_attempts[client_ip]["blocked_until"] = now + timedelta(
                minutes=block_duration
            )
            return True

    return False


def record_failed_attempt(client_ip: str):
    """Record a failed login attempt."""
    now = datetime.utcnow()

    if client_ip in failed_attempts:
        failed_attempts[client_ip]["count"] += 1
    else:
        failed_attempts[client_ip] = {
            "count": 1,
            "first_attempt": now,
            "blocked_until": None,
        }


def clear_failed_attempts(client_ip: str):
    """Clear failed attempts for successful login."""
    if client_ip in failed_attempts:
        del failed_attempts[client_ip]


def clear_user_failed_attempts(user_id: str, db):
    """Clear failed login attempts for a specific user in database."""
    from app.models.user import User

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.failed_login_attempts = 0
        db.commit()


def increment_user_failed_attempts(user_id: str, db) -> int:
    """Increment failed login attempts for a user and return current count."""
    from app.models.user import User

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1

        # Desativar conta após 5 tentativas
        if user.failed_login_attempts >= 5:
            user.is_active = False

        db.commit()
        return user.failed_login_attempts
    return 0


def is_user_locked(user_id: str, db) -> bool:
    """Check if user account is locked due to failed attempts."""
    from app.models.user import User

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return not user.is_active or (user.failed_login_attempts or 0) >= 5
    return False


def get_rate_limit_message(client_ip: str) -> str:
    """Get appropriate rate limit message."""
    if client_ip in failed_attempts:
        attempt_data = failed_attempts[client_ip]
        if attempt_data.get("blocked_until"):
            remaining = attempt_data["blocked_until"] - datetime.utcnow()
            if remaining.total_seconds() > 0:
                minutes = int(remaining.total_seconds() / 60) + 1
                return f"Too many failed attempts. Try again in {minutes} minute(s)."

    return "Rate limit exceeded. Please try again later."


# Custom rate limit exceeded handler
def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    client_ip = get_client_ip(request)
    message = get_rate_limit_message(client_ip)

    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "message": message,
            "retry_after": exc.retry_after if hasattr(exc, "retry_after") else 60,
        },
    )


# Rate limiting decorators for different endpoints
def auth_rate_limit():
    """Rate limit for authentication endpoints."""
    return limiter.limit("5/minute")


def register_rate_limit():
    """Rate limit for registration endpoints."""
    return limiter.limit("3/minute")


def api_rate_limit():
    """General API rate limit."""
    return limiter.limit("100/minute")


def strict_rate_limit():
    """Strict rate limit for sensitive endpoints."""
    return limiter.limit("10/minute")

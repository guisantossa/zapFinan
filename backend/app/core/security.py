# flake8: noqa
import secrets
import string
from datetime import datetime, timedelta
from typing import Any, Union

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        # Ensure both password and hash are bytes
        password_bytes = plain_password.encode("utf-8")
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate password hash with bcrypt."""
    # bcrypt has a 72-byte limit, so truncate if needed
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def validate_password_strength(password: str) -> dict[str, Any]:
    """
    Validate password strength according to modern security standards.
    Returns dict with validation results.
    """
    issues = []
    score = 0

    # Length check
    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")
    elif len(password) >= 8:
        score += 1

    if len(password) >= 12:
        score += 1

    # Character variety checks
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)

    if not has_lower:
        issues.append("Password must contain at least one lowercase letter")
    else:
        score += 1

    if not has_upper:
        issues.append("Password must contain at least one uppercase letter")
    else:
        score += 1

    if not has_digit:
        issues.append("Password must contain at least one digit")
    else:
        score += 1

    if not has_special:
        issues.append("Password must contain at least one special character")
    else:
        score += 1

    # Common password patterns
    common_patterns = [
        "password",
        "123456",
        "qwerty",
        "abc123",
        "letmein",
        "welcome",
        "monkey",
        "dragon",
        "master",
        "shadow",
    ]

    if any(pattern in password.lower() for pattern in common_patterns):
        issues.append("Password contains common patterns")
        score = max(0, score - 2)

    # Sequential characters
    if any(
        password[i : i + 3] in "abcdefghijklmnopqrstuvwxyz"
        for i in range(len(password) - 2)
    ):
        issues.append("Password contains sequential characters")
        score = max(0, score - 1)

    if any(password[i : i + 3] in "0123456789" for i in range(len(password) - 2)):
        issues.append("Password contains sequential numbers")
        score = max(0, score - 1)

    # Determine strength level
    if score >= 5 and not issues:
        strength = "strong"
    elif score >= 3:
        strength = "medium"
    elif score >= 1:
        strength = "weak"
    else:
        strength = "very_weak"

    return {
        "is_valid": len(issues) == 0,
        "strength": strength,
        "score": score,
        "issues": issues,
    }


def generate_verification_token(length: int = 32) -> str:
    """Generate a secure random token for email verification."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_reset_token(length: int = 32) -> str:
    """Generate a secure random token for password reset."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

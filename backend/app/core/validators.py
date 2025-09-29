import re
from typing import Optional


def validate_email(email: str) -> bool:
    """Validate email format."""
    if not email:
        return False

    # Basic email regex pattern
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_phone(phone: str) -> dict:
    """
    Validate phone number format.
    Returns dict with validation results.
    """
    issues = []

    if not phone:
        issues.append("Phone number is required")
        return {"is_valid": False, "issues": issues}

    # Remove common separators for validation
    clean_phone = re.sub(r"[\s\-\(\)]+", "", phone)

    # Check if it contains only allowed characters
    if not re.match(r"^\+?[\d]+$", clean_phone):
        issues.append("Phone number contains invalid characters")

    # Check length (international format)
    if len(clean_phone) < 10:
        issues.append("Phone number is too short (minimum 10 digits)")
    elif len(clean_phone) > 15:
        issues.append("Phone number is too long (maximum 15 digits)")

    # Check for Brazilian phone patterns if starts with +55 or 55
    if clean_phone.startswith("+55"):
        # Brazilian international format: +55 XX XXXXX-XXXX or +55 XX XXXX-XXXX
        if len(clean_phone) not in [13, 14]:  # +55 + 2 digits + 8 or 9 digits
            issues.append("Invalid Brazilian phone number format")
    elif clean_phone.startswith("55") and len(clean_phone) > 10:
        # Brazilian format without +: 55 XX XXXXX-XXXX or 55 XX XXXX-XXXX
        if len(clean_phone) not in [12, 13]:
            issues.append("Invalid Brazilian phone number format")
    elif not clean_phone.startswith(("+", "55")):
        # Local Brazilian format: XX XXXXX-XXXX or XX XXXX-XXXX
        if len(clean_phone) not in [10, 11]:
            issues.append("Invalid Brazilian phone number format")

    return {"is_valid": len(issues) == 0, "issues": issues, "clean_phone": clean_phone}


def format_phone(phone: str) -> str:
    """Format phone number for storage."""
    if not phone:
        return phone

    # Remove all non-digit characters except +
    clean_phone = re.sub(r"[^\d\+]", "", phone)

    # Ensure it starts with + for international format
    if clean_phone.startswith("55") and not clean_phone.startswith("+55"):
        clean_phone = "+" + clean_phone
    elif not clean_phone.startswith("+") and len(clean_phone) >= 10:
        # Assume Brazilian number, add country code
        if len(clean_phone) == 10:
            # Old format: add area code assumption
            clean_phone = "+5511" + clean_phone
        elif len(clean_phone) == 11:
            # New format with area code
            clean_phone = "+55" + clean_phone

    return clean_phone


def sanitize_input(text: str, max_length: Optional[int] = None) -> str:
    """Sanitize text input by removing potentially dangerous characters."""
    if not text:
        return text

    # Remove control characters and excessive whitespace
    sanitized = re.sub(r"[\x00-\x1f\x7f]", "", text)
    sanitized = re.sub(r"\s+", " ", sanitized).strip()

    # Truncate if max_length specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized


def validate_name(name: str) -> dict:
    """Validate name format."""
    issues = []

    if not name:
        return {"is_valid": True, "issues": []}  # Name is optional

    name = name.strip()

    if len(name) < 2:
        issues.append("Name must be at least 2 characters long")
    elif len(name) > 100:
        issues.append("Name must be less than 100 characters")

    # Allow letters, spaces, hyphens, and apostrophes
    if not re.match(r"^[a-zA-ZÀ-ÿ\s\-']+$", name):
        issues.append("Name contains invalid characters")

    # Check for reasonable patterns
    if re.match(r"^[\s\-\']+$", name):
        issues.append("Name must contain at least one letter")

    return {"is_valid": len(issues) == 0, "issues": issues}

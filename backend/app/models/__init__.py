# SQLAlchemy models - Import order matters for relationships
from .budget import Budget, BudgetPeriod
from .category import Category
from .commitment import Commitment, UserGoogleAuth
from .consent import Consent

# from .expression_embedding import ExpressionEmbedding  # Temporarily disabled - pgvector dependency
from .payment import Payment
from .plan import Plan
from .transaction import Transaction
from .user import User
from .user_phone import UserPhone
from .user_settings import UserSettings

__all__ = [
    "Plan",
    "User",
    "UserPhone",
    "Category",
    "Transaction",
    "Budget",
    "BudgetPeriod",
    "Commitment",
    "UserGoogleAuth",
    # "ExpressionEmbedding",  # Temporarily disabled - pgvector dependency
    "Consent",
    "Payment",
    "UserSettings",
]

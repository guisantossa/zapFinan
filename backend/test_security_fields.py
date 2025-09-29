#!/usr/bin/env python3

import asyncio
from unittest.mock import Mock

from fastapi import Request

from app.api.users import register_user
from app.core.database import SessionLocal
from app.schemas.user import UserCreate

# Test data
user_data = UserCreate(
    nome="Security Test",
    email="security@example.com",
    senha="TestPa55!",
    telefone="11777777777",
)


async def test_security_fields():
    try:
        # Create database session
        db = SessionLocal()

        # Mock request object
        request = Mock(spec=Request)
        request.client = Mock()
        request.client.host = "127.0.0.1"

        # Call registration function
        result = await register_user(request, user_data, db)
        print("Registration successful with security fields!")
        print("Result keys:", result.keys())
        print("User data:", result.get("user", {}))

    except Exception as e:
        print(f"Registration failed with error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_security_fields())

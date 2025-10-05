#!/usr/bin/env python3

import asyncio

import requests

BASE_URL = "http://localhost:8000"


def print_test_result(test_name, success, message=""):
    status = "PASS" if success else "FAIL"
    print(f"[{status}] {test_name}")
    if message:
        print(f"    {message}")
    print()


async def test_new_auth_system():
    print("Testing New Synca Auth System")
    print("=" * 50)
    print()

    # Test data
    test_user = {
        "nome": "Auth Test User",
        "email": "authtest@example.com",
        "telefone": "11988887777",
        "senha": "TestPassword123!",
    }

    login_data = {"identifier": "11988887777", "senha": "TestPassword123!"}

    # 1. Test User Registration
    try:
        print("1. Testing User Registration...")
        response = requests.post(f"{BASE_URL}/user/register", json=test_user)

        if response.status_code == 201:
            data = response.json()
            user_id = data.get("user", {}).get("id")
            print_test_result(
                "User Registration", True, f"User created with ID: {user_id}"
            )
        else:
            print_test_result(
                "User Registration", False, f"Status: {response.status_code}"
            )
    except Exception as e:
        print_test_result("User Registration", False, f"Error: {e}")

    # 2. Test Login
    try:
        print("2. Testing Login...")
        response = requests.post(f"{BASE_URL}/user/login", json=login_data)

        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            refresh_token = data.get("refresh_token")
            print_test_result("Login", True, "Login successful")
        else:
            print_test_result("Login", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test_result("Login", False, f"Error: {e}")

    # 3. Test Protected Endpoint
    if "access_token" in locals() and access_token:
        try:
            print("3. Testing Protected Endpoint...")
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{BASE_URL}/user/me", headers=headers)

            if response.status_code == 200:
                data = response.json()
                user_name = data.get("nome")
                print_test_result(
                    "Protected Endpoint", True, f"User data retrieved: {user_name}"
                )
            else:
                print_test_result(
                    "Protected Endpoint", False, f"Status: {response.status_code}"
                )
        except Exception as e:
            print_test_result("Protected Endpoint", False, f"Error: {e}")

    # 4. Test Token Refresh
    if "refresh_token" in locals() and refresh_token:
        try:
            print("4. Testing Token Refresh...")
            refresh_data = {"refresh_token": refresh_token}
            response = requests.post(f"{BASE_URL}/user/refresh", json=refresh_data)

            if response.status_code == 200:
                data = response.json()
                new_access_token = data.get("access_token")
                print_test_result("Token Refresh", True, "Token refreshed successfully")
            else:
                print_test_result(
                    "Token Refresh", False, f"Status: {response.status_code}"
                )
        except Exception as e:
            print_test_result("Token Refresh", False, f"Error: {e}")

    print("Authentication System Test Complete!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(test_new_auth_system())

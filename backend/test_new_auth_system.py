#!/usr/bin/env python3

import asyncio

import requests

BASE_URL = "http://localhost:8000"


def print_test_result(test_name, success, message=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if message:
        print(f"    {message}")
    print()


async def test_new_auth_system():
    print("🔐 Testando Novo Sistema de Autenticação Synca")
    print("=" * 60)
    print()

    # Test data
    test_user = {
        "nome": "Auth Test User",
        "email": "authtest@example.com",
        "telefone": "11988887777",
        "senha": "TestPassword123!",
    }

    login_data = {"identifier": "11988887777", "senha": "TestPassword123!"}

    wrong_password_data = {"identifier": "11988887777", "senha": "WrongPassword123!"}

    # 1. Test User Registration
    try:
        print("1️⃣ Testando Cadastro de Usuário...")
        response = requests.post(f"{BASE_URL}/user/register", json=test_user)

        if response.status_code == 201:
            data = response.json()
            user_id = data.get("user", {}).get("id")
            print_test_result(
                "Cadastro de usuário", True, f"Usuário criado com ID: {user_id}"
            )
        else:
            print_test_result(
                "Cadastro de usuário",
                False,
                f"Status: {response.status_code}, Response: {response.text}",
            )
    except Exception as e:
        print_test_result("Cadastro de usuário", False, f"Erro: {e}")

    # 2. Test Login with Correct Password
    try:
        print("2️⃣ Testando Login com Senha Correta...")
        response = requests.post(f"{BASE_URL}/user/login", json=login_data)

        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            refresh_token = data.get("refresh_token")
            print_test_result(
                "Login com senha correta",
                True,
                f"Tokens obtidos - Access: {access_token[:30]}...",
            )
        else:
            print_test_result(
                "Login com senha correta",
                False,
                f"Status: {response.status_code}, Response: {response.text}",
            )
    except Exception as e:
        print_test_result("Login com senha correta", False, f"Erro: {e}")

    # 3. Test Login with Wrong Password
    try:
        print("3️⃣ Testando Login com Senha Incorreta...")
        response = requests.post(f"{BASE_URL}/user/login", json=wrong_password_data)

        if response.status_code == 401:
            print_test_result(
                "Login com senha incorreta", True, "Acesso negado corretamente"
            )
        else:
            print_test_result(
                "Login com senha incorreta",
                False,
                f"Status inesperado: {response.status_code}",
            )
    except Exception as e:
        print_test_result("Login com senha incorreta", False, f"Erro: {e}")

    # 4. Test Multiple Failed Login Attempts
    try:
        print("4️⃣ Testando Bloqueio por Múltiplas Tentativas Falhadas...")
        failed_count = 0
        for i in range(6):  # Try 6 times to trigger account lock
            response = requests.post(f"{BASE_URL}/user/login", json=wrong_password_data)
            if response.status_code == 401:
                failed_count += 1
            elif response.status_code == 423:  # Account locked
                print_test_result(
                    "Bloqueio por tentativas falhadas",
                    True,
                    f"Conta bloqueada após {failed_count} tentativas",
                )
                break
        else:
            print_test_result(
                "Bloqueio por tentativas falhadas",
                False,
                "Conta não foi bloqueada após 6 tentativas",
            )
    except Exception as e:
        print_test_result("Bloqueio por tentativas falhadas", False, f"Erro: {e}")

    # 5. Test Email Login
    try:
        print("5️⃣ Testando Login por Email...")
        email_login_data = {
            "identifier": "authtest@example.com",
            "senha": "TestPassword123!",
        }
        response = requests.post(f"{BASE_URL}/user/login", json=email_login_data)

        if response.status_code in [
            200,
            423,
        ]:  # Success or locked (expected after previous test)
            print_test_result(
                "Login por email",
                True,
                f"Email login funcionando (Status: {response.status_code})",
            )
        else:
            print_test_result(
                "Login por email",
                False,
                f"Status: {response.status_code}, Response: {response.text}",
            )
    except Exception as e:
        print_test_result("Login por email", False, f"Erro: {e}")

    # 6. Test SMS Token Request
    try:
        print("6️⃣ Testando Solicitação de Token SMS...")
        sms_request = {"telefone": "11988887777"}
        response = requests.post(f"{BASE_URL}/user/send-sms-token", json=sms_request)

        if response.status_code in [
            200,
            403,
            423,
        ]:  # May be blocked due to account lock
            print_test_result(
                "Solicitação de token SMS",
                True,
                f"SMS endpoint funcionando (Status: {response.status_code})",
            )
        else:
            print_test_result(
                "Solicitação de token SMS",
                False,
                f"Status: {response.status_code}, Response: {response.text}",
            )
    except Exception as e:
        print_test_result("Solicitação de token SMS", False, f"Erro: {e}")

    # 7. Test Token Refresh
    if "access_token" in locals() and access_token:
        try:
            print("7️⃣ Testando Renovação de Token...")
            refresh_data = {"refresh_token": refresh_token}
            response = requests.post(f"{BASE_URL}/user/refresh", json=refresh_data)

            if response.status_code == 200:
                data = response.json()
                new_access_token = data.get("access_token")
                print_test_result(
                    "Renovação de token",
                    True,
                    f"Novo token: {new_access_token[:30]}...",
                )
            else:
                print_test_result(
                    "Renovação de token",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                )
        except Exception as e:
            print_test_result("Renovação de token", False, f"Erro: {e}")

    # 8. Test Protected Endpoint
    if "access_token" in locals() and access_token:
        try:
            print("8️⃣ Testando Endpoint Protegido...")
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{BASE_URL}/user/me", headers=headers)

            if response.status_code == 200:
                data = response.json()
                user_name = data.get("nome")
                print_test_result(
                    "Endpoint protegido", True, f"Dados do usuário obtidos: {user_name}"
                )
            else:
                print_test_result(
                    "Endpoint protegido",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                )
        except Exception as e:
            print_test_result("Endpoint protegido", False, f"Erro: {e}")

    # 9. Test Forgot Password
    try:
        print("9️⃣ Testando Esqueci Minha Senha...")
        forgot_data = {"email": "authtest@example.com"}
        response = requests.post(f"{BASE_URL}/user/forgot-password", json=forgot_data)

        if response.status_code == 200:
            print_test_result(
                "Esqueci minha senha", True, "Reset de senha solicitado com sucesso"
            )
        else:
            print_test_result(
                "Esqueci minha senha",
                False,
                f"Status: {response.status_code}, Response: {response.text}",
            )
    except Exception as e:
        print_test_result("Esqueci minha senha", False, f"Erro: {e}")

    print("🏁 Teste do Sistema de Autenticação Concluído!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_new_auth_system())

import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    refresh_access_token,
)
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limiter import (
    auth_rate_limit,
    check_failed_attempts,
    clear_failed_attempts,
    record_failed_attempt,
    register_rate_limit,
    strict_rate_limit,
)
from app.core.security import (
    generate_reset_token,
    generate_verification_token,
    get_password_hash,
    validate_password_strength,
    verify_password,
)
from app.core.validators import (
    format_phone,
    sanitize_input,
    validate_email,
    validate_name,
    validate_phone,
)
from app.models.user import User
from app.schemas.user import (
    EmailVerificationRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    SMSTokenRequest,
    SMSTokenVerify,
    TokenRefreshRequest,
)
from app.schemas.user import User as UserResponse
from app.schemas.user import (
    UserCreate,
    UserUpdate,
)

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
@register_rate_limit()
async def register_user(
    request: Request, user_data: UserCreate, db: Session = Depends(get_db)
):
    """Cadastrar novo usuário com validação de segurança."""

    # Sanitize inputs
    telefone = sanitize_input(user_data.telefone, 20)
    nome = sanitize_input(user_data.nome, 100) if user_data.nome else None
    email = sanitize_input(user_data.email, 100) if user_data.email else None

    # Validate phone number
    phone_validation = validate_phone(telefone)
    if not phone_validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid phone number",
                "issues": phone_validation["issues"],
            },
        )

    # Validate email if provided
    if email and not validate_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format"
        )

    # Validate name if provided
    if nome:
        name_validation = validate_name(nome)
        if not name_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Invalid name format",
                    "issues": name_validation["issues"],
                },
            )

    # Validar força da senha
    password_validation = validate_password_strength(user_data.senha)
    if not password_validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Password does not meet security requirements",
                "issues": password_validation["issues"],
                "strength": password_validation["strength"],
            },
        )

    # Format phone for storage
    formatted_phone = format_phone(telefone)

    # Verificar se telefone já existe
    existing_user = db.query(User).filter(User.telefone == formatted_phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Telefone já cadastrado"
        )

    # Verificar se email já existe (se fornecido)
    if email:
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado"
            )

    # Hash da senha
    hashed_password = get_password_hash(user_data.senha)

    # Gerar token de verificação de email se email foi fornecido
    email_verification_token = None
    email_verification_expires = None
    if email:
        email_verification_token = generate_verification_token()
        email_verification_expires = datetime.utcnow() + timedelta(
            hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS
        )

    # Criar novo usuário com todos os campos de segurança
    db_user = User(
        telefone=formatted_phone,
        nome=nome,
        email=email,
        senha=hashed_password,
        is_active=True,
        is_verified=not bool(email),  # Se não tem email, considera verificado
        email_verified=False,
        email_verification_token=email_verification_token,
        email_verification_expires=email_verification_expires,
        failed_login_attempts=0,
        last_password_change=datetime.utcnow(),
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Criar tokens de acesso e refresh
    access_token = create_access_token(subject=str(db_user.id))
    refresh_token = create_refresh_token(subject=str(db_user.id))

    response_data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(db_user.id),
            "telefone": db_user.telefone,
            "nome": db_user.nome,
            "email": db_user.email,
            "is_active": db_user.is_active,
            "is_verified": db_user.is_verified,
            "email_verified": db_user.email_verified,
            "data_inicio": db_user.data_inicio,
        },
    }

    # Se email foi fornecido, adicionar info sobre verificação
    if email:
        response_data["email_verification_required"] = True
        response_data["message"] = (
            "Account created successfully. Please check your email to verify your account."
        )
    else:
        response_data["message"] = "Account created successfully."

    # TODO: Send verification email if email was provided
    # send_verification_email(db_user.email, email_verification_token)

    return response_data


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Obter dados do usuário atual."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualizar dados do usuário atual."""

    # Verificar se email já existe (se fornecido e diferente do atual)
    if user_update.email and user_update.email != current_user.email:
        existing_email = (
            db.query(User)
            .filter(User.email == user_update.email, User.id != current_user.id)
            .first()
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado"
            )

    # Atualizar campos fornecidos
    update_data = user_update.dict(exclude_unset=True)

    # Hash da senha se fornecida
    if "senha" in update_data:
        update_data["senha"] = get_password_hash(update_data["senha"])

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
@auth_rate_limit()
async def login_user(
    request: Request, login_data: LoginRequest, db: Session = Depends(get_db)
):
    """Login de usuário com telefone/email e senha."""
    client_ip = request.client.host

    # Verificar rate limiting
    if check_failed_attempts(client_ip):
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again later.",
        )

    # Sanitizar entrada
    identifier = sanitize_input(login_data.identifier, 100)

    # Buscar usuário por telefone ou email
    user = None
    if "@" in identifier:
        # Login por email
        if not validate_email(identifier):
            record_failed_attempt(client_ip)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format"
            )
        user = db.query(User).filter(User.email == identifier).first()
    else:
        # Login por telefone
        phone_validation = validate_phone(identifier)
        if not phone_validation["is_valid"]:
            record_failed_attempt(client_ip)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format",
            )
        formatted_phone = format_phone(identifier)
        user = db.query(User).filter(User.telefone == formatted_phone).first()

    # Verificar se usuário existe
    if not user:
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # Verificar se conta está ativa
    if not user.is_active:
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )

    # Verificar senha
    if not verify_password(login_data.senha, user.senha):
        # Incrementar tentativas falhadas do usuário
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1

        # Bloquear conta após 5 tentativas
        if user.failed_login_attempts >= 5:
            user.is_active = False

        db.commit()
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # Login bem-sucedido - resetar tentativas e atualizar último login
    user.failed_login_attempts = 0
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Limpar tentativas falhadas do IP
    clear_failed_attempts(client_ip)

    # Criar tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
        message="Login successful",
    )


@router.post("/refresh", response_model=dict, status_code=status.HTTP_200_OK)
async def refresh_token(token_data: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Renovar access token usando refresh token."""
    return refresh_access_token(token_data.refresh_token, db)


@router.post("/send-sms-token", response_model=dict, status_code=status.HTTP_200_OK)
@strict_rate_limit()
async def send_sms_token(
    request: Request, sms_data: SMSTokenRequest, db: Session = Depends(get_db)
):
    """Enviar token SMS para login sem senha."""
    # Sanitizar telefone
    telefone = sanitize_input(sms_data.telefone, 20)

    # Validar telefone
    phone_validation = validate_phone(telefone)
    if not phone_validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format",
        )

    formatted_phone = format_phone(telefone)

    # Verificar se usuário existe
    user = db.query(User).filter(User.telefone == formatted_phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Phone number not registered"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )

    # Gerar token SMS (usar campo password_reset_token temporariamente)
    sms_token = str(uuid.uuid4())[:8]  # Token de 8 dígitos
    user.password_reset_token = sms_token
    user.password_reset_expires = datetime.utcnow() + timedelta(
        minutes=5
    )  # Expira em 5 minutos

    db.commit()

    # TODO: Integrar com serviço de SMS (WhatsApp, Twilio, etc.)
    # send_sms(formatted_phone, f"Your ZapGastos login code: {sms_token}")

    return {"message": "SMS token sent successfully", "expires_in_minutes": 5}


@router.post(
    "/verify-sms-token", response_model=LoginResponse, status_code=status.HTTP_200_OK
)
@auth_rate_limit()
async def verify_sms_token(
    request: Request, verify_data: SMSTokenVerify, db: Session = Depends(get_db)
):
    """Verificar token SMS e fazer login."""
    client_ip = request.client.host

    # Verificar rate limiting
    if check_failed_attempts(client_ip):
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please try again later.",
        )

    # Sanitizar dados
    telefone = sanitize_input(verify_data.telefone, 20)
    token = sanitize_input(verify_data.token, 10)

    # Validar telefone
    phone_validation = validate_phone(telefone)
    if not phone_validation["is_valid"]:
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format",
        )

    formatted_phone = format_phone(telefone)

    # Buscar usuário
    user = db.query(User).filter(User.telefone == formatted_phone).first()
    if not user:
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    # Verificar token e expiração
    if (
        not user.password_reset_token
        or user.password_reset_token != token
        or not user.password_reset_expires
        or datetime.utcnow() > user.password_reset_expires
    ):
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    # Limpar token usado
    user.password_reset_token = None
    user.password_reset_expires = None
    user.last_login_at = datetime.utcnow()
    user.failed_login_attempts = 0

    db.commit()

    # Limpar tentativas falhadas do IP
    clear_failed_attempts(client_ip)

    # Criar tokens JWT
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
        message="SMS login successful",
    )


@router.post("/forgot-password", response_model=dict, status_code=status.HTTP_200_OK)
@strict_rate_limit()
async def forgot_password(
    request: Request, forgot_data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    """Solicitar reset de senha via email."""
    # Sanitizar email
    email = sanitize_input(forgot_data.email, 100)

    # Validar email
    if not validate_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format"
        )

    # Buscar usuário
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Não revelar se email existe ou não (segurança)
        return {"message": "If the email exists, a reset link has been sent"}

    if not user.is_active:
        return {"message": "If the email exists, a reset link has been sent"}

    # Gerar token de reset
    reset_token = generate_reset_token()
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(
        hours=1
    )  # Expira em 1 hora

    db.commit()

    # TODO: Enviar email com link de reset
    # send_reset_email(email, reset_token)

    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password", response_model=dict, status_code=status.HTTP_200_OK)
@auth_rate_limit()
async def reset_password(
    request: Request, reset_data: ResetPasswordRequest, db: Session = Depends(get_db)
):
    """Confirmar reset de senha com token."""
    # Sanitizar token
    token = sanitize_input(reset_data.token, 100)

    # Buscar usuário pelo token
    user = (
        db.query(User)
        .filter(
            User.password_reset_token == token,
            User.password_reset_expires > datetime.utcnow(),
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Validar nova senha
    password_validation = validate_password_strength(reset_data.new_password)
    if not password_validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Password does not meet security requirements",
                "issues": password_validation["issues"],
            },
        )

    # Atualizar senha
    user.senha = get_password_hash(reset_data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.last_password_change = datetime.utcnow()
    user.failed_login_attempts = 0  # Reset tentativas

    db.commit()

    return {"message": "Password reset successful"}


@router.post("/verify-email", response_model=dict, status_code=status.HTTP_200_OK)
async def verify_email(
    verify_data: EmailVerificationRequest, db: Session = Depends(get_db)
):
    """Verificar email com token."""
    # Sanitizar token
    token = sanitize_input(verify_data.token, 100)

    # Buscar usuário pelo token
    user = (
        db.query(User)
        .filter(
            User.email_verification_token == token,
            User.email_verification_expires > datetime.utcnow(),
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    # Marcar email como verificado
    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    user.email_verification_token = None
    user.email_verification_expires = None
    user.is_verified = True

    db.commit()

    return {"message": "Email verified successfully"}


@router.post(
    "/resend-verification", response_model=dict, status_code=status.HTTP_200_OK
)
@strict_rate_limit()
async def resend_verification_email(
    request: Request,
    resend_data: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """Reenviar email de verificação."""
    # Sanitizar email
    email = sanitize_input(resend_data.email, 100)

    # Validar email
    if not validate_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format"
        )

    # Buscar usuário
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Não revelar se email existe
        return {
            "message": "If the email exists and is not verified, a new verification link has been sent"
        }

    if user.email_verified:
        return {"message": "Email is already verified"}

    if not user.is_active:
        return {
            "message": "If the email exists and is not verified, a new verification link has been sent"
        }

    # Gerar novo token
    verification_token = generate_verification_token()
    user.email_verification_token = verification_token
    user.email_verification_expires = datetime.utcnow() + timedelta(
        hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS
    )

    db.commit()

    # TODO: Enviar email de verificação
    # send_verification_email(email, verification_token)

    return {
        "message": "If the email exists and is not verified, a new verification link has been sent"
    }

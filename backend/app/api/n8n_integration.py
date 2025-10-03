import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.rate_limiter import auth_rate_limit
from app.core.validators import format_phone, sanitize_input, validate_phone
from app.crud.user_phone import user_phone as user_phone_crud
from app.models.user import User
from app.models.user_phone import UserPhone
from app.schemas.n8n import (
    CategoryFilterRequest,
    CategoryFilterResponse,
    CompactCategoryResponse,
    N8NBudgetCreate,
    N8NBudgetResponse,
    N8NCommitmentCreate,
    N8NCommitmentResponse,
    N8NReportCreate,
    N8NReportResponse,
    N8NTransactionCreate,
    N8NTransactionResponse,
    UserLookupData,
    UserLookupRequest,
    UserLookupResponse,
)
from app.services.category_filter import (
    category_filter_service,
    find_category_by_name_flexible,
)

router = APIRouter()


def detect_search_type(query: str) -> str:
    """Auto-detect the type of search based on query format"""
    # Remove leading @ if present
    clean_query = query.lstrip("@")

    # Check if it looks like a phone number
    if re.match(r"^[\+]?[\d\s\-\(\)]{8,}$", clean_query):
        return "phone"

    # Check if it starts with @ or contains special characters typical of lids
    if query.startswith("@") or re.match(r"^[a-zA-Z0-9_\-\.]+$", clean_query):
        return "lid"

    # Default to name search
    return "name"


@router.post(
    "/user/lookup", response_model=UserLookupResponse, status_code=status.HTTP_200_OK
)
@auth_rate_limit()
async def lookup_user(
    request: Request, lookup_data: UserLookupRequest, db: Session = Depends(get_db)
):
    """
    Lookup user by phone, name, or lid (WhatsApp identifier).

    Search types:
    - phone: Search by phone number (formatted automatically)
    - name: Search by name (partial match, case-insensitive)
    - lid: Search by lid (exact match, with or without @)
    """

    # Sanitize input
    query = sanitize_input(lookup_data.query, 100).strip()

    if not query:
        return UserLookupResponse(found=False, message="Query cannot be empty")

    # Determine search type
    search_type = lookup_data.search_type or detect_search_type(query)

    user = None

    try:
        if search_type == "phone":
            # Phone search using UserPhone table
            phone_validation = validate_phone(query)
            if not phone_validation["is_valid"]:
                return UserLookupResponse(
                    found=False,
                    message=f"Invalid phone number format: {', '.join(phone_validation['issues'])}",
                )

            formatted_phone = format_phone(query)
            # Search in UserPhone table
            user_phone = (
                db.query(UserPhone)
                .filter(UserPhone.phone_number == formatted_phone)
                .filter(UserPhone.is_active.is_(True))
                .first()
            )
            if user_phone:
                user = db.query(User).filter(User.id == user_phone.user_id).first()
            else:
                user = None

        elif search_type == "lid":
            # LID search via UserPhone table
            clean_lid = query.lstrip("@")
            user_phone = user_phone_crud.get_by_lid(db, lid=clean_lid)
            if user_phone:
                user = db.query(User).filter(User.id == user_phone.user_id).first()
            else:
                user = None

        elif search_type == "name":
            # Name search - partial match, case-insensitive
            search_pattern = f"%{query.lower()}%"
            user = (
                db.query(User)
                .filter(func.lower(User.nome).like(search_pattern))
                .first()
            )

        else:
            return UserLookupResponse(
                found=False, message=f"Invalid search type: {search_type}"
            )

        if user:
            # User found
            # Get primary phone with lid
            primary_phone_obj = None
            for phone in user.phones:
                if phone.is_primary and phone.is_active:
                    primary_phone_obj = phone
                    break

            user_data = UserLookupData(
                id=user.id,
                telefone=user.primary_phone,  # Usa primary_phone da tabela user_phones
                nome=user.nome,
                email=user.email,
                lid=(
                    primary_phone_obj.lid if primary_phone_obj else None
                ),  # LID do telefone principal
                is_active=user.is_active,
                is_verified=user.is_verified,
                data_inicio=user.data_inicio,
            )

            return UserLookupResponse(
                found=True, user=user_data, message=f"User found by {search_type}"
            )
        else:
            # User not found
            return UserLookupResponse(
                found=False, message=f"No user found with {search_type}: {query}"
            )

    except Exception as e:
        # Handle any unexpected errors
        return UserLookupResponse(found=False, message=f"Error during lookup: {str(e)}")


@router.get(
    "/user/lookup/{query}",
    response_model=UserLookupResponse,
    status_code=status.HTTP_200_OK,
)
@auth_rate_limit()
async def lookup_user_get(
    request: Request, query: str, search_type: str = None, db: Session = Depends(get_db)
):
    """
    GET version of user lookup endpoint for simple queries.

    Args:
        query: Search term (phone, name, or lid)
        search_type: Optional search type (phone, name, lid). Auto-detected if not provided.
    """

    # Convert to POST request format
    lookup_request = UserLookupRequest(query=query, search_type=search_type)

    return await lookup_user(request, lookup_request, db)


@router.post(
    "/categorias/filter",
    response_model=CategoryFilterResponse,
    status_code=status.HTTP_200_OK,
)
@auth_rate_limit()
async def filter_categories(
    request: Request, filter_data: CategoryFilterRequest, db: Session = Depends(get_db)
):
    """
    Filter categories based on message content to optimize AI token usage.

    Analyzes the message content and returns only relevant categories,
    significantly reducing the number of tokens needed for AI processing.

    Args:
        filter_data: Message content and filtering parameters
        db: Database session

    Returns:
        Filtered categories with confidence scores and optimization metrics
    """

    # Sanitize message input
    message = sanitize_input(filter_data.mensagem, 500).strip()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty"
        )

    try:
        # Use the category filter service
        result = category_filter_service.filter_categories(
            db=db,
            message=message,
            max_categories=filter_data.max_categories,
            min_score=filter_data.min_score,
            remove_emojis=filter_data.remove_emojis,
        )

        # Convert to response format
        response = CategoryFilterResponse(**result)

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing category filter: {str(e)}",
        )


@router.post(
    "/categorias/filter/compact",
    response_model=CompactCategoryResponse,
    status_code=status.HTTP_200_OK,
)
@auth_rate_limit()
async def filter_categories_compact(
    request: Request, filter_data: CategoryFilterRequest, db: Session = Depends(get_db)
):
    """
    Ultra-compact category filtering for maximum token efficiency.

    Returns minimal data structure optimized for AI consumption,
    removing emojis and unnecessary formatting.

    Args:
        filter_data: Message content and filtering parameters
        db: Database session

    Returns:
        Ultra-compact category list for AI processing
    """

    # Sanitize message input
    message = sanitize_input(filter_data.mensagem, 500).strip()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty"
        )

    try:
        # Use the category filter service
        result = category_filter_service.filter_categories(
            db=db,
            message=message,
            max_categories=filter_data.max_categories,
            min_score=filter_data.min_score,
            remove_emojis=filter_data.remove_emojis,
        )

        # Get compact format
        compact_result = category_filter_service.get_compact_format_for_ai(result)

        return CompactCategoryResponse(**compact_result)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing compact category filter: {str(e)}",
        )


@router.get("/categorias/all", status_code=status.HTTP_200_OK)
async def get_all_categories_structured(db: Session = Depends(get_db)):
    """
    Get all categories structured by type for N8N workflows.

    Returns all available categories organized by despesa/receita
    for workflows that need the complete category list.
    """
    try:
        from app.crud.category import category

        despesas = category.get_by_tipo(db, tipo="despesa")
        receitas = category.get_by_tipo(db, tipo="receita")

        return {
            "despesas": [{"id": cat.id, "nome": cat.nome} for cat in despesas],
            "receitas": [{"id": cat.id, "nome": cat.nome} for cat in receitas],
            "total_count": len(despesas) + len(receitas),
            "despesas_count": len(despesas),
            "receitas_count": len(receitas),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving categories: {str(e)}",
        )


@router.post(
    "/transaction/create",
    response_model=N8NTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
@auth_rate_limit()
async def create_transaction(
    request: Request,
    transaction_data: N8NTransactionCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new transaction for N8N integration.

    Supports user lookup by ID, phone, or lid and automatic category suggestion.

    Args:
        transaction_data: Transaction data including user identification
        db: Database session

    Returns:
        Created transaction with suggested category if none provided
    """

    try:
        # Step 1: Identify the user
        user = None
        user_identification_method = None

        if transaction_data.usuario_id:
            # Direct user ID lookup
            user = db.query(User).filter(User.id == transaction_data.usuario_id).first()
            user_identification_method = "user_id"

        elif transaction_data.telefone:
            # Phone lookup using UserPhone table
            phone_validation = validate_phone(transaction_data.telefone)
            if not phone_validation["is_valid"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error_code": "INVALID_PHONE",
                        "message": f"Invalid phone format: {', '.join(phone_validation['issues'])}",
                    },
                )

            formatted_phone = format_phone(transaction_data.telefone)
            user_phone = (
                db.query(UserPhone)
                .filter(UserPhone.phone_number == formatted_phone)
                .filter(UserPhone.is_active.is_(True))
                .first()
            )
            if user_phone:
                user = db.query(User).filter(User.id == user_phone.user_id).first()
            else:
                user = None
            user_identification_method = "phone"

        elif transaction_data.lid:
            # LID lookup via UserPhone table
            clean_lid = transaction_data.lid.lstrip("@")
            user_phone = user_phone_crud.get_by_lid(db, lid=clean_lid)
            if user_phone:
                user = db.query(User).filter(User.id == user_phone.user_id).first()
            else:
                user = None
            user_identification_method = "lid"

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error_code": "USER_NOT_FOUND",
                    "message": f"User not found by {user_identification_method}",
                    "identification_method": user_identification_method,
                    "provided_value": transaction_data.usuario_id
                    or transaction_data.telefone
                    or transaction_data.lid,
                },
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "USER_INACTIVE",
                    "message": "User account is not active",
                },
            )

        # Validate user has permission for transactions feature
        if not user.plano:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "NO_PLAN",
                    "message": "User has no active plan",
                },
            )

        if not user.plano.has_feature("transactions"):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error_code": "FEATURE_NOT_AVAILABLE",
                    "message": "User plan does not support transactions feature",
                    "required_feature": "transactions",
                },
            )

        # Step 2: Handle category suggestion if not provided
        categoria_sugerida = None
        final_categoria_id = transaction_data.categoria_id

        if not transaction_data.categoria_id and transaction_data.mensagem_original:
            # Use our category filter service to suggest a category
            filter_result = category_filter_service.filter_categories(
                db=db,
                message=transaction_data.mensagem_original,
                max_categories=1,
                min_score=0.5,  # Higher threshold for auto-assignment
            )

            if filter_result["categorias_filtradas"]:
                suggested_category = filter_result["categorias_filtradas"][0]
                final_categoria_id = suggested_category["id"]
                categoria_sugerida = {
                    "id": suggested_category["id"],
                    "nome": suggested_category["nome"],
                    "confidence": suggested_category["confidence"],
                    "auto_assigned": True,
                }

        # Step 3: Find category by ID or name, then validate
        cat = None
        if final_categoria_id:
            from app.crud.category import category

            cat = category.get(db, id=final_categoria_id)
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error_code": "CATEGORY_NOT_FOUND",
                        "message": f"Category ID {final_categoria_id} not found",
                    },
                )
        elif transaction_data.categoria_nome:
            # Search by name using flexible search with type filter
            cat = find_category_by_name_flexible(
                db, transaction_data.categoria_nome, transaction_data.tipo
            )
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error_code": "CATEGORY_NOT_FOUND_BY_NAME",
                        "message": f"Category with name '{transaction_data.categoria_nome}' not found for type '{transaction_data.tipo}'",
                    },
                )
            # Update final_categoria_id for later use
            final_categoria_id = cat.id

        # Validate category type matches transaction type (if category was found)
        if cat and cat.tipo != transaction_data.tipo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "CATEGORY_TYPE_MISMATCH",
                    "message": f"Category '{cat.nome}' is for {cat.tipo}, but transaction is {transaction_data.tipo}",
                },
            )

        # Step 4: Process transaction date
        data_transacao = None
        if transaction_data.data_transacao:
            try:
                from datetime import datetime

                data_transacao = datetime.strptime(
                    transaction_data.data_transacao, "%Y-%m-%d"
                ).date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error_code": "INVALID_DATE",
                        "message": "Invalid date format. Use YYYY-MM-DD",
                    },
                )

        # Step 5: Create the transaction
        from decimal import Decimal

        from app.models.transaction import Transaction

        new_transaction = Transaction(
            usuario_id=user.id,
            mensagem_original=sanitize_input(transaction_data.mensagem_original, 500),
            valor=Decimal(str(transaction_data.valor)),
            descricao=sanitize_input(transaction_data.descricao, 200),
            tipo=transaction_data.tipo,
            categoria_id=final_categoria_id,
            canal=transaction_data.canal,
            data_transacao=data_transacao,
        )

        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)

        # Step 6: Prepare response with related data
        transaction_dict = {
            "id": str(new_transaction.id),
            "usuario_id": str(new_transaction.usuario_id),
            "mensagem_original": new_transaction.mensagem_original,
            "valor": float(new_transaction.valor),
            "descricao": new_transaction.descricao,
            "tipo": new_transaction.tipo,
            "categoria_id": new_transaction.categoria_id,
            "canal": new_transaction.canal,
            "data_transacao": (
                new_transaction.data_transacao.isoformat()
                if new_transaction.data_transacao
                else None
            ),
            "data_registro": new_transaction.data_registro.isoformat(),
        }

        # Add category info if available
        if final_categoria_id:
            from app.crud.category import category

            cat = category.get(db, id=final_categoria_id)
            if cat:
                transaction_dict["categoria"] = {
                    "id": cat.id,
                    "nome": cat.nome,
                    "tipo": cat.tipo,
                }

        success_message = f"Transaction created successfully for user {user.nome or user.primary_phone or 'Unknown'}"
        if categoria_sugerida:
            success_message += (
                f" with auto-suggested category '{categoria_sugerida['nome']}'"
            )

        return N8NTransactionResponse(
            success=True,
            transaction_id=new_transaction.id,
            transaction=transaction_dict,
            categoria_sugerida=categoria_sugerida,
            message=success_message,
        )

    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": f"Error creating transaction: {str(e)}",
            },
        )


@router.post(
    "/budget/create",
    response_model=N8NBudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
@auth_rate_limit()
async def create_budget(
    request: Request, budget_data: N8NBudgetCreate, db: Session = Depends(get_db)
):
    """
    Create a new budget for N8N integration.

    Supports user lookup by ID, phone, or lid and category validation.

    Args:
        budget_data: Budget data including user identification
        db: Database session

    Returns:
        Created budget with initial period
    """

    try:
        # Step 1: Identify the user
        user = None
        user_identification_method = None

        if budget_data.usuario_id:
            # Direct user ID lookup
            user = db.query(User).filter(User.id == budget_data.usuario_id).first()
            user_identification_method = "user_id"

        elif budget_data.telefone:
            # Phone lookup using UserPhone table
            phone_validation = validate_phone(budget_data.telefone)
            if not phone_validation["is_valid"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error_code": "INVALID_PHONE",
                        "message": f"Invalid phone format: {', '.join(phone_validation['issues'])}",
                    },
                )

            formatted_phone = format_phone(budget_data.telefone)
            user_phone = (
                db.query(UserPhone)
                .filter(UserPhone.phone_number == formatted_phone)
                .filter(UserPhone.is_active.is_(True))
                .first()
            )
            if user_phone:
                user = db.query(User).filter(User.id == user_phone.user_id).first()
            else:
                user = None
            user_identification_method = "phone"

        elif budget_data.lid:
            # LID lookup via UserPhone table
            clean_lid = budget_data.lid.lstrip("@")
            user_phone = user_phone_crud.get_by_lid(db, lid=clean_lid)
            if user_phone:
                user = db.query(User).filter(User.id == user_phone.user_id).first()
            else:
                user = None
            user_identification_method = "lid"

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error_code": "USER_NOT_FOUND",
                    "message": f"User not found by {user_identification_method}",
                    "identification_method": user_identification_method,
                    "provided_value": budget_data.usuario_id
                    or budget_data.telefone
                    or budget_data.lid,
                },
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "USER_INACTIVE",
                    "message": "User account is not active",
                },
            )

        # Validate user has permission for budgets feature
        if not user.plano:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "NO_PLAN",
                    "message": "User has no active plan",
                },
            )

        if not user.plano.has_feature("budgets"):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error_code": "FEATURE_NOT_AVAILABLE",
                    "message": "User plan does not support budgets feature",
                    "required_feature": "budgets",
                },
            )

        # Step 2: Find and validate category
        cat = None

        # Validate that at least one category identification method is provided
        if not budget_data.categoria_id and not budget_data.categoria_nome:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "CATEGORY_REQUIRED",
                    "message": "Either categoria_id or categoria_nome must be provided",
                },
            )

        # Try to find category by ID first, then by name
        if budget_data.categoria_id:
            from app.crud.category import category

            cat = category.get(db, id=budget_data.categoria_id)
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error_code": "CATEGORY_NOT_FOUND",
                        "message": f"Category ID {budget_data.categoria_id} not found",
                    },
                )
        elif budget_data.categoria_nome:
            # Search by name using flexible search
            cat = find_category_by_name_flexible(db, budget_data.categoria_nome)
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error_code": "CATEGORY_NOT_FOUND_BY_NAME",
                        "message": f"Category with name '{budget_data.categoria_nome}' not found",
                    },
                )

        # Step 3: Check for existing active budget for this category
        from app.crud.budget import budget

        existing_budget = budget.get_by_user_and_category(
            db, usuario_id=user.id, categoria_id=cat.id
        )

        if existing_budget:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error_code": "BUDGET_ALREADY_EXISTS",
                    "message": f"Active budget already exists for category '{cat.nome}'",
                    "existing_budget_id": str(existing_budget.id),
                },
            )

        # Step 4: Create the budget
        from decimal import Decimal

        from app.schemas.budget import BudgetCreate

        budget_create_data = BudgetCreate(
            usuario_id=user.id,
            categoria_id=cat.id,
            nome=sanitize_input(budget_data.nome, 100),
            valor_limite=Decimal(str(budget_data.valor_limite)),
            periodicidade=budget_data.periodicidade,
            notificar_em=(
                Decimal(str(budget_data.notificar_em))
                if budget_data.notificar_em
                else Decimal("80.0")
            ),
        )

        new_budget = budget.create(db, obj_in=budget_create_data)

        # Step 5: Create initial period automatically
        from app.crud.budget import budget_period

        initial_period = budget_period.create_period_for_budget(db, budget=new_budget)

        # Step 6: Prepare response with related data
        budget_dict = {
            "id": str(new_budget.id),
            "usuario_id": str(new_budget.usuario_id),
            "categoria_id": new_budget.categoria_id,
            "nome": new_budget.nome,
            "valor_limite": float(new_budget.valor_limite),
            "periodicidade": new_budget.periodicidade,
            "notificar_em": float(new_budget.notificar_em),
            "ativo": new_budget.ativo,
            "criado_em": new_budget.criado_em.isoformat(),
            "categoria": {"id": cat.id, "nome": cat.nome, "tipo": cat.tipo},
        }

        period_dict = None
        if initial_period:
            period_dict = {
                "id": str(initial_period.id),
                "ano": initial_period.ano,
                "mes": initial_period.mes,
                "valor_limite": float(initial_period.valor_limite),
                "valor_gasto": float(initial_period.valor_gasto),
                "status": initial_period.status,
                "data_inicio": initial_period.data_inicio.isoformat(),
                "data_fim": initial_period.data_fim.isoformat(),
            }

        success_message = f"Budget '{new_budget.nome}' created successfully for user {user.nome or user.primary_phone or 'Unknown'}"
        if initial_period:
            success_message += f" with {new_budget.periodicidade} period for {initial_period.mes}/{initial_period.ano}"

        return N8NBudgetResponse(
            success=True,
            budget_id=new_budget.id,
            budget=budget_dict,
            period=period_dict,
            message=success_message,
        )

    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": f"Error creating budget: {str(e)}",
            },
        )


@router.post(
    "/compromisso/create",
    response_model=N8NCommitmentResponse,
    status_code=status.HTTP_201_CREATED,
)
@auth_rate_limit()
async def create_commitment_for_n8n(
    request: Request,
    commitment_data: N8NCommitmentCreate,
    db: Session = Depends(get_db),
):
    """
    Create a commitment/appointment for N8N integration.

    This endpoint creates a commitment in the local database and automatically
    syncs it with Google Calendar if the user has Google integration enabled.

    Features:
    - User lookup by phone, lid, or user_id
    - All-day events (no time specified) or timed events
    - Automatic Google Calendar sync if user is connected
    - Recurrence support (daily, weekly, monthly, yearly)
    - WhatsApp reminder configuration
    """
    try:
        # Step 1: Resolve the user
        user = None

        if commitment_data.usuario_id:
            # Direct user lookup by ID with plan
            user = (
                db.query(User)
                .options(joinedload(User.plano))
                .filter(User.id == commitment_data.usuario_id)
                .first()
            )
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error_code": "USER_NOT_FOUND_BY_ID",
                        "message": f"User with ID {commitment_data.usuario_id} not found",
                    },
                )
        else:
            # User lookup by phone or lid with plan
            if commitment_data.telefone:
                phone = format_phone(commitment_data.telefone)
                # Search in UserPhone table
                user_phone = (
                    db.query(UserPhone)
                    .filter(UserPhone.phone_number == phone)
                    .filter(UserPhone.is_active.is_(True))
                    .first()
                )
                if user_phone:
                    user = (
                        db.query(User)
                        .options(joinedload(User.plano))
                        .filter(User.id == user_phone.user_id)
                        .first()
                    )
                else:
                    user = None

                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail={
                            "error_code": "USER_NOT_FOUND_BY_PHONE",
                            "message": f"User with phone {phone} not found",
                        },
                    )
            elif commitment_data.lid:
                lid = commitment_data.lid.lstrip("@")  # Remove @ if present
                # LID lookup via UserPhone table
                user_phone = user_phone_crud.get_by_lid(db, lid=lid)
                if user_phone:
                    user = (
                        db.query(User)
                        .options(joinedload(User.plano))
                        .filter(User.id == user_phone.user_id)
                        .first()
                    )
                else:
                    user = None

                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail={
                            "error_code": "USER_NOT_FOUND_BY_LID",
                            "message": f"User with lid {lid} not found",
                        },
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error_code": "NO_USER_IDENTIFIER",
                        "message": "Either usuario_id, telefone, or lid must be provided",
                    },
                )

        # Validate user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "USER_INACTIVE",
                    "message": "User account is not active",
                },
            )

        # Validate user has permission for commitments feature
        if not user.plano:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "NO_PLAN",
                    "message": "User has no active plan",
                },
            )

        if not user.plano.has_feature("commitments"):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error_code": "FEATURE_NOT_AVAILABLE",
                    "message": "User plan does not support commitments feature",
                    "required_feature": "commitments",
                },
            )

        # Step 2: Parse and validate date/time
        try:
            event_date = datetime.strptime(commitment_data.data, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "INVALID_DATE",
                    "message": "Invalid date format. Use YYYY-MM-DD",
                },
            )

        # Parse times if provided
        data_inicio = None
        data_fim = None

        if commitment_data.hora_inicio:
            try:
                hora_inicio = datetime.strptime(
                    commitment_data.hora_inicio, "%H:%M"
                ).time()
                data_inicio = datetime.combine(event_date, hora_inicio)

                if commitment_data.hora_fim:
                    hora_fim = datetime.strptime(
                        commitment_data.hora_fim, "%H:%M"
                    ).time()
                    data_fim = datetime.combine(event_date, hora_fim)
                else:
                    # Default to 1 hour duration
                    data_fim = data_inicio + timedelta(hours=1)

            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error_code": "INVALID_TIME",
                        "message": "Invalid time format. Use HH:MM (24-hour format)",
                    },
                )
        else:
            # All-day event (00:00 to 23:59)
            data_inicio = datetime.combine(event_date, datetime.min.time())
            data_fim = datetime.combine(
                event_date, datetime.max.time().replace(microsecond=0)
            )

        # Validate end time is after start time
        if data_fim <= data_inicio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "INVALID_TIME_RANGE",
                    "message": "End time must be after start time",
                },
            )

        # Step 3: Parse recurrence end date if provided
        recorrencia_ate_date = None
        if commitment_data.recorrencia_ate:
            try:
                recorrencia_ate_date = datetime.strptime(
                    commitment_data.recorrencia_ate, "%Y-%m-%d"
                ).date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error_code": "INVALID_RECURRENCE_DATE",
                        "message": "Invalid recurrence end date format. Use YYYY-MM-DD",
                    },
                )

        # Step 4: Create the commitment
        from app.crud.commitment import commitment as commitment_crud
        from app.schemas.commitment import CommitmentCreate

        commitment_create_data = CommitmentCreate(
            usuario_id=user.id,
            titulo=sanitize_input(commitment_data.titulo, 200),
            descricao=(
                sanitize_input(commitment_data.descricao, 1000)
                if commitment_data.descricao
                else None
            ),
            data_inicio=data_inicio,
            data_fim=data_fim,
            tipo=commitment_data.tipo,
            recorrencia=commitment_data.recorrencia,
            recorrencia_ate=recorrencia_ate_date,
            lembrete_whatsapp=commitment_data.lembrete_whatsapp,
            minutos_antes_lembrete=commitment_data.minutos_antes_lembrete,
        )

        # Create commitment with sync flag
        new_commitment = commitment_crud.create_with_sync_flag(
            db, obj_in=commitment_create_data
        )

        # Step 5: Handle recurrence if specified
        recurrence_created = False
        recurrence_count = 0
        if new_commitment.recorrencia != "nenhuma":
            recurrence_instances = commitment_crud.create_recurrence_instances(
                db, commitment=new_commitment
            )
            recurrence_created = len(recurrence_instances) > 0
            recurrence_count = len(recurrence_instances)

        # Step 6: Google Calendar sync if enabled and user is connected
        google_synced = False
        google_event_id = None

        if commitment_data.sincronizar_google:
            # Check if user has Google Calendar sync feature
            if not user.plano or not user.plano.google_calendar_sync:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "error_code": "FEATURE_NOT_AVAILABLE",
                        "message": "Google Calendar sync requires upgrade to a plan with this feature",
                        "required_feature": "google_calendar_sync",
                    },
                )

            from app.crud.commitment import user_google_auth
            from app.services.google_calendar_service import google_calendar_service

            google_auth = user_google_auth.get_by_user(db, usuario_id=user.id)
            if google_auth and google_auth.ativo:
                success = google_calendar_service.sync_commitment_to_google(
                    db, new_commitment
                )
                google_synced = success
                google_event_id = new_commitment.google_event_id if success else None

        # Step 7: Prepare response
        commitment_dict = {
            "id": str(new_commitment.id),
            "usuario_id": str(new_commitment.usuario_id),
            "titulo": new_commitment.titulo,
            "descricao": new_commitment.descricao,
            "data_inicio": new_commitment.data_inicio.isoformat(),
            "data_fim": new_commitment.data_fim.isoformat(),
            "tipo": new_commitment.tipo,
            "status": new_commitment.status,
            "recorrencia": new_commitment.recorrencia,
            "recorrencia_ate": (
                new_commitment.recorrencia_ate.isoformat()
                if new_commitment.recorrencia_ate
                else None
            ),
            "lembrete_whatsapp": new_commitment.lembrete_whatsapp,
            "minutos_antes_lembrete": new_commitment.minutos_antes_lembrete,
            "sincronizado_google": new_commitment.sincronizado_google,
            "google_event_id": new_commitment.google_event_id,
            "criado_em": new_commitment.criado_em.isoformat(),
        }

        success_message = f"Commitment '{new_commitment.titulo}' created successfully for user {user.nome or user.primary_phone or 'Unknown'}"
        if google_synced:
            success_message += " and synced to Google Calendar"
        if recurrence_created:
            success_message += f" with {recurrence_count} recurrence instances"

        return N8NCommitmentResponse(
            success=True,
            commitment_id=new_commitment.id,
            commitment=commitment_dict,
            google_synced=google_synced,
            google_event_id=google_event_id,
            recurrence_created=recurrence_created,
            recurrence_count=recurrence_count,
            message=success_message,
        )

    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": f"Error creating commitment: {str(e)}",
            },
        )


@router.post(
    "/relatorio/generate",
    response_model=N8NReportResponse,
    status_code=status.HTTP_200_OK,
)
@auth_rate_limit()
async def generate_report_for_n8n(
    request: Request, report_data: N8NReportCreate, db: Session = Depends(get_db)
):
    """
    Generate financial report for N8N integration.

    This endpoint generates real-time reports from transaction data without storing the report.
    Supports filtering by categories, period, and transaction type.

    Features:
    - User lookup by phone, lid, or user_id
    - Flexible category filtering by name
    - Period-based filtering
    - Summary and detailed report formats
    - Real-time data aggregation
    """
    try:
        # Step 1: Resolve the user
        user = None

        if report_data.usuario_id:
            # Direct user lookup by ID
            user = db.query(User).filter(User.id == report_data.usuario_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error_code": "USER_NOT_FOUND_BY_ID",
                        "message": f"User with ID {report_data.usuario_id} not found",
                    },
                )
        else:
            # User lookup by phone or lid
            if report_data.telefone:
                phone = format_phone(report_data.telefone)
                # Search in UserPhone table
                user_phone = (
                    db.query(UserPhone)
                    .filter(UserPhone.phone_number == phone)
                    .filter(UserPhone.is_active.is_(True))
                    .first()
                )
                if user_phone:
                    user = db.query(User).filter(User.id == user_phone.user_id).first()
                else:
                    user = None

                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail={
                            "error_code": "USER_NOT_FOUND_BY_PHONE",
                            "message": f"User with phone {phone} not found",
                        },
                    )
            elif report_data.lid:
                lid = report_data.lid.lstrip("@")  # Remove @ if present
                # LID lookup via UserPhone table
                user_phone = user_phone_crud.get_by_lid(db, lid=lid)
                if user_phone:
                    user = db.query(User).filter(User.id == user_phone.user_id).first()
                else:
                    user = None

                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail={
                            "error_code": "USER_NOT_FOUND_BY_LID",
                            "message": f"User with lid {lid} not found",
                        },
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error_code": "NO_USER_IDENTIFIER",
                        "message": "Either usuario_id, telefone, or lid must be provided",
                    },
                )

        # Validate user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "USER_INACTIVE",
                    "message": "User account is not active",
                },
            )

        # Validate user has permission for reports feature
        if not user.plano:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "NO_PLAN",
                    "message": "User has no active plan",
                },
            )

        if not user.plano.has_feature("reports"):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error_code": "FEATURE_NOT_AVAILABLE",
                    "message": "User plan does not support reports feature",
                    "required_feature": "reports",
                },
            )

        # Step 2: Parse and validate dates
        try:
            data_inicio = datetime.strptime(report_data.data_inicio, "%Y-%m-%d").date()
            data_fim = datetime.strptime(report_data.data_fim, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "INVALID_DATE",
                    "message": "Invalid date format. Use YYYY-MM-DD",
                },
            )

        if data_fim < data_inicio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "INVALID_DATE_RANGE",
                    "message": "End date must be after or equal to start date",
                },
            )

        # Step 3: Build base query
        from app.models.category import Category
        from app.models.transaction import Transaction

        base_query = db.query(Transaction).filter(
            Transaction.usuario_id == user.id,
            Transaction.data_transacao >= data_inicio,
            Transaction.data_transacao <= data_fim,
        )

        # Step 4: Apply type filter
        if report_data.tipo != "ambos":
            base_query = base_query.filter(Transaction.tipo == report_data.tipo)

        # Step 5: Apply category filters
        filtered_category_ids = []
        if report_data.categorias_nomes:
            for categoria_nome in report_data.categorias_nomes:
                # Use flexible category search
                cat = find_category_by_name_flexible(db, categoria_nome)
                if cat:
                    filtered_category_ids.append(cat.id)

            if filtered_category_ids:
                base_query = base_query.filter(
                    Transaction.categoria_id.in_(filtered_category_ids)
                )
            else:
                # If categories were specified but none found, return empty result
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error_code": "CATEGORIES_NOT_FOUND",
                        "message": f"None of the specified categories were found: {report_data.categorias_nomes}",
                    },
                )

        # Step 6: Get transactions with category info
        transactions_query = base_query.join(
            Category, Transaction.categoria_id == Category.id, isouter=True
        )

        transactions = transactions_query.all()

        # Step 7: Calculate summary data
        total_receitas = 0.0
        total_despesas = 0.0
        category_data = {}

        for transaction in transactions:
            valor = float(transaction.valor)
            categoria_nome = (
                transaction.categoria.nome if transaction.categoria else "Sem categoria"
            )

            if transaction.tipo == "receita":
                total_receitas += valor
            else:
                total_despesas += valor

            # Group by category
            if categoria_nome not in category_data:
                category_data[categoria_nome] = {
                    "valor": 0.0,
                    "quantidade": 0,
                    "tipo": transaction.tipo,
                }
            category_data[categoria_nome]["valor"] += valor
            category_data[categoria_nome]["quantidade"] += 1

        saldo = total_receitas - total_despesas

        # Step 8: Prepare category breakdown
        por_categoria = []
        for categoria, data in category_data.items():
            por_categoria.append(
                {
                    "categoria": categoria,
                    "valor": data["valor"],
                    "quantidade": data["quantidade"],
                    "tipo": data["tipo"],
                }
            )

        # Sort by value (descending)
        por_categoria.sort(key=lambda x: x["valor"], reverse=True)

        # Step 9: Prepare transaction details (if detailed format)
        transaction_details = None
        if report_data.formato_saida == "detalhado":
            transaction_details = []
            for transaction in transactions:
                transaction_details.append(
                    {
                        "id": str(transaction.id),
                        "valor": float(transaction.valor),
                        "tipo": transaction.tipo,
                        "categoria": (
                            transaction.categoria.nome
                            if transaction.categoria
                            else "Sem categoria"
                        ),
                        "descricao": transaction.descricao,
                        "data_transacao": transaction.data_transacao.isoformat(),
                        "data_registro": transaction.data_registro.isoformat(),
                    }
                )

        # Step 10: Build response
        from app.schemas.n8n import (
            ReportCategoryData,
            ReportData,
            ReportSummary,
            ReportTransactionData,
        )

        resumo = ReportSummary(
            total_receitas=total_receitas,
            total_despesas=total_despesas,
            saldo=saldo,
            quantidade_transacoes=len(transactions),
        )

        categorias_response = [
            ReportCategoryData(
                categoria=cat["categoria"],
                valor=cat["valor"],
                quantidade=cat["quantidade"],
                tipo=cat["tipo"],
            )
            for cat in por_categoria
        ]

        transacoes_response = None
        if transaction_details:
            transacoes_response = [
                ReportTransactionData(**trans) for trans in transaction_details
            ]

        relatorio = ReportData(
            periodo={
                "inicio": data_inicio.isoformat(),
                "fim": data_fim.isoformat(),
                "dias": str((data_fim - data_inicio).days + 1),
            },
            filtros={
                "categorias": report_data.categorias_nomes or [],
                "tipo": report_data.tipo,
                "formato": report_data.formato_saida,
            },
            resumo=resumo,
            por_categoria=categorias_response,
            transacoes=transacoes_response,
        )

        dias = (data_fim - data_inicio).days + 1
        success_message = f"Relatório gerado com sucesso para período de {dias} dia{'s' if dias > 1 else ''}"
        if report_data.categorias_nomes:
            success_message += (
                f" com filtro de categorias: {', '.join(report_data.categorias_nomes)}"
            )

        return N8NReportResponse(
            success=True, relatorio=relatorio, message=success_message
        )

    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": f"Error generating report: {str(e)}",
            },
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def n8n_health_check():
    """Health check endpoint for N8N integration"""
    return {
        "status": "healthy",
        "service": "n8n_integration",
        "endpoints": [
            "POST /n8n/user/lookup",
            "GET /n8n/user/lookup/{query}",
            "POST /n8n/categorias/filter",
            "POST /n8n/categorias/filter/compact",
            "GET /n8n/categorias/all",
            "POST /n8n/transaction/create",
            "POST /n8n/budget/create",
            "POST /n8n/compromisso/create",
            "POST /n8n/relatorio/generate",
            "GET /n8n/health",
        ],
    }

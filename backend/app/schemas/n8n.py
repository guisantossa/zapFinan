from datetime import datetime
from typing import Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserLookupRequest(BaseModel):
    """Request schema for user lookup endpoint"""

    query: str = Field(
        ..., description="Search term: phone, name, or lid (with or without @)"
    )
    search_type: Optional[Literal["phone", "name", "lid"]] = Field(
        None,
        description="Type of search to perform. If not provided, will auto-detect based on query format",
    )


class UserLookupData(BaseModel):
    """User data returned in lookup response"""

    id: UUID
    telefone: str
    nome: Optional[str] = None
    email: Optional[str] = None
    lid: Optional[str] = None
    is_active: bool
    is_verified: bool
    data_inicio: datetime

    class Config:
        from_attributes = True


class UserLookupResponse(BaseModel):
    """Response schema for user lookup endpoint"""

    found: bool
    user: Optional[UserLookupData] = None
    message: str = Field(
        default="", description="Additional information about the lookup result"
    )


class UserLookupError(BaseModel):
    """Error response schema"""

    found: bool = False
    user: Optional[UserLookupData] = None
    message: str
    error_code: Optional[str] = None


# Category Filter Schemas
class CategoryFilterRequest(BaseModel):
    """Request schema for category filtering endpoint"""

    mensagem: str = Field(
        ..., description="Message content to analyze for category filtering"
    )
    usuario_id: Optional[UUID] = Field(
        None, description="User ID for future personalization"
    )
    max_categories: Optional[int] = Field(
        3, description="Maximum number of categories to return", ge=1, le=10
    )
    min_score: Optional[float] = Field(
        0.1,
        description="Minimum confidence score for category inclusion",
        ge=0.0,
        le=1.0,
    )
    compact_format: Optional[bool] = Field(
        False, description="Return ultra-compact format for AI"
    )
    remove_emojis: Optional[bool] = Field(
        False, description="Remove emojis from category names"
    )


class FilteredCategory(BaseModel):
    """Individual filtered category with confidence score"""

    id: int
    nome: str
    tipo: Literal["despesa", "receita"]
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")


class CategorySummary(BaseModel):
    """Simplified category for complete lists"""

    id: int
    nome: str


class MessageAnalysis(BaseModel):
    """Analysis details of the message processing"""

    detected_type: Literal["despesa", "receita"]
    total_categories_available: int
    categories_filtered: int
    confidence_threshold: float


class CategoryFilterResponse(BaseModel):
    """Response schema for category filtering endpoint"""

    tipo_sugerido: Literal["despesa", "receita"]
    categorias_filtradas: List[FilteredCategory]
    categorias_completas: Dict[str, List[CategorySummary]]
    tokens_saved_percent: float = Field(
        ..., description="Percentage of tokens saved by filtering"
    )
    ai_prompt_suggestion: str = Field(
        ..., description="Optimized prompt suggestion for AI"
    )
    message_analysis: MessageAnalysis


class CompactCategoryResponse(BaseModel):
    """Ultra-compact response format for AI consumption"""

    msg_type: Literal["despesa", "receita"]
    categories: List[str]
    full_list: bool = Field(
        ..., description="Whether this is the full category list or filtered"
    )


# Transaction Creation Schemas for N8N
class N8NTransactionCreate(BaseModel):
    """Request schema for N8N transaction creation"""

    usuario_id: Optional[UUID] = Field(
        None, description="User ID - can be looked up by phone/lid if not provided"
    )
    telefone: Optional[str] = Field(
        None, description="User phone for lookup if usuario_id not provided"
    )
    lid: Optional[str] = Field(
        None, description="User lid for lookup if usuario_id not provided"
    )

    mensagem_original: str = Field(..., description="Original message from WhatsApp")
    valor: float = Field(..., description="Transaction amount", gt=0)
    descricao: str = Field(..., description="Transaction description")
    tipo: Literal["despesa", "receita"] = Field(..., description="Transaction type")
    categoria_id: Optional[int] = Field(
        None, description="Category ID - if not provided, will be suggested"
    )
    categoria_nome: Optional[str] = Field(
        None, description="Category name for lookup (alternative to categoria_id)"
    )
    canal: Optional[
        Literal["audioMessage", "conversation", "imageMessage", "webApp"]
    ] = Field("webApp", description="Source channel")
    data_transacao: Optional[str] = Field(
        None, description="Transaction date in YYYY-MM-DD format"
    )


class N8NTransactionResponse(BaseModel):
    """Response schema for N8N transaction creation"""

    success: bool
    transaction_id: UUID
    transaction: Dict
    categoria_sugerida: Optional[Dict] = Field(
        None, description="Suggested category if none provided"
    )
    message: str


class N8NTransactionError(BaseModel):
    """Error response for N8N transaction creation"""

    success: bool = False
    error_code: str
    message: str
    details: Optional[Dict] = None


# Budget Creation Schemas for N8N
class N8NBudgetCreate(BaseModel):
    """Request schema for N8N budget creation"""

    usuario_id: Optional[UUID] = Field(
        None, description="User ID - can be looked up by phone/lid if not provided"
    )
    telefone: Optional[str] = Field(
        None, description="User phone for lookup if usuario_id not provided"
    )
    lid: Optional[str] = Field(
        None, description="User lid for lookup if usuario_id not provided"
    )

    categoria_id: Optional[int] = Field(None, description="Category ID for the budget")
    categoria_nome: Optional[str] = Field(
        None, description="Category name for lookup (alternative to categoria_id)"
    )
    nome: str = Field(..., description="Budget name", min_length=1, max_length=100)
    valor_limite: float = Field(..., description="Budget limit amount", gt=0)
    periodicidade: Optional[Literal["mensal", "quinzenal", "semanal"]] = Field(
        "mensal", description="Budget period type"
    )
    notificar_em: Optional[float] = Field(
        80.0, description="Alert percentage threshold", ge=0, le=100
    )


class N8NBudgetResponse(BaseModel):
    """Response schema for N8N budget creation"""

    success: bool
    budget_id: UUID
    budget: Dict
    period: Optional[Dict] = Field(None, description="Created initial period")
    message: str


class N8NBudgetError(BaseModel):
    """Error response for N8N budget creation"""

    success: bool = False
    error_code: str
    message: str
    details: Optional[Dict] = None


# Commitment Creation Schemas for N8N
class N8NCommitmentCreate(BaseModel):
    """Request schema for N8N commitment creation"""

    usuario_id: Optional[UUID] = Field(
        None, description="User ID - can be looked up by phone/lid if not provided"
    )
    telefone: Optional[str] = Field(
        None, description="User phone for lookup if usuario_id not provided"
    )
    lid: Optional[str] = Field(
        None, description="User lid for lookup if usuario_id not provided"
    )

    titulo: str = Field(
        ..., description="Commitment title", min_length=1, max_length=200
    )
    descricao: Optional[str] = Field(None, description="Commitment description")

    # Date and time handling
    data: str = Field(..., description="Date in YYYY-MM-DD format")
    hora_inicio: Optional[str] = Field(
        None,
        description="Start time in HH:MM format (24h). If not provided, creates all-day event",
    )
    hora_fim: Optional[str] = Field(
        None,
        description="End time in HH:MM format (24h). If not provided, uses hora_inicio + 1 hour",
    )

    # Commitment settings
    tipo: Optional[
        Literal["reuniao", "pagamento", "evento", "lembrete", "aniversario"]
    ] = Field("evento", description="Commitment type")
    recorrencia: Optional[
        Literal["nenhuma", "diaria", "semanal", "mensal", "anual"]
    ] = Field("nenhuma", description="Recurrence type")
    recorrencia_ate: Optional[str] = Field(
        None, description="Recurrence end date in YYYY-MM-DD format"
    )

    # Reminders
    lembrete_whatsapp: Optional[bool] = Field(
        True, description="Send WhatsApp reminder"
    )
    minutos_antes_lembrete: Optional[int] = Field(
        30, description="Minutes before event for reminder", ge=0, le=1440
    )

    # Google Calendar sync
    sincronizar_google: Optional[bool] = Field(
        True, description="Sync with Google Calendar if connected"
    )


class N8NCommitmentResponse(BaseModel):
    """Response schema for N8N commitment creation"""

    success: bool
    commitment_id: UUID
    commitment: Dict
    google_synced: bool = Field(
        False, description="Whether the event was synced to Google Calendar"
    )
    google_event_id: Optional[str] = Field(
        None, description="Google Calendar event ID if synced"
    )
    recurrence_created: bool = Field(
        False, description="Whether recurrence instances were created"
    )
    recurrence_count: int = Field(
        0, description="Number of recurrence instances created"
    )
    message: str


class N8NCommitmentError(BaseModel):
    """Error response for N8N commitment creation"""

    success: bool = False
    error_code: str
    message: str
    details: Optional[Dict] = None


# Report Generation Schemas for N8N
class N8NReportCreate(BaseModel):
    """Request schema for N8N report generation"""

    usuario_id: Optional[UUID] = Field(
        None, description="User ID - can be looked up by phone/lid if not provided"
    )
    telefone: Optional[str] = Field(
        None, description="User phone for lookup if usuario_id not provided"
    )
    lid: Optional[str] = Field(
        None, description="User lid for lookup if usuario_id not provided"
    )

    data_inicio: str = Field(..., description="Start date in YYYY-MM-DD format")
    data_fim: str = Field(..., description="End date in YYYY-MM-DD format")

    categorias_nomes: Optional[List[str]] = Field(
        None, description="List of category names to filter by"
    )
    tipo: Optional[Literal["despesa", "receita", "ambos"]] = Field(
        "ambos", description="Transaction type filter"
    )
    formato_saida: Optional[Literal["resumo", "detalhado"]] = Field(
        "resumo", description="Report format"
    )


class ReportSummary(BaseModel):
    """Summary data for report"""

    total_receitas: float = Field(0.0, description="Total income amount")
    total_despesas: float = Field(0.0, description="Total expense amount")
    saldo: float = Field(0.0, description="Balance (income - expenses)")
    quantidade_transacoes: int = Field(0, description="Total number of transactions")


class ReportCategoryData(BaseModel):
    """Category breakdown data"""

    categoria: str = Field(..., description="Category name")
    valor: float = Field(..., description="Total amount for category")
    quantidade: int = Field(..., description="Number of transactions in category")
    tipo: str = Field(..., description="Transaction type (despesa/receita)")


class ReportTransactionData(BaseModel):
    """Individual transaction data for detailed reports"""

    id: str
    valor: float
    tipo: str
    categoria: str
    descricao: str
    data_transacao: str
    data_registro: str


class ReportData(BaseModel):
    """Main report data structure"""

    periodo: Dict[str, str] = Field(..., description="Report period info")
    filtros: Dict = Field(..., description="Applied filters")
    resumo: ReportSummary
    por_categoria: List[ReportCategoryData]
    transacoes: Optional[List[ReportTransactionData]] = Field(
        None, description="Detailed transactions (only in detailed format)"
    )


class N8NReportResponse(BaseModel):
    """Response schema for N8N report generation"""

    success: bool
    relatorio: ReportData
    message: str


class N8NReportError(BaseModel):
    """Error response for N8N report generation"""

    success: bool = False
    error_code: str
    message: str
    details: Optional[Dict] = None


# Update/Delete Schemas for N8N
class N8NResourceIdentifier(BaseModel):
    """Base schema for identifying resources and users in update/delete operations"""

    # User identification (at least one required)
    usuario_id: Optional[UUID] = Field(
        None, description="User ID - can be looked up by phone/lid if not provided"
    )
    telefone: Optional[str] = Field(
        None, description="User phone for lookup if usuario_id not provided"
    )
    lid: Optional[str] = Field(
        None, description="User lid for lookup if usuario_id not provided"
    )

    # Resource identification
    resource_id: UUID = Field(..., description="ID of the resource to update/delete")


# Commitment Update Schemas
class N8NCommitmentUpdate(N8NResourceIdentifier):
    """Request schema for N8N commitment update"""

    titulo: Optional[str] = Field(
        None, description="New commitment title", min_length=1, max_length=200
    )
    descricao: Optional[str] = Field(None, description="New commitment description")
    data: Optional[str] = Field(None, description="New date in YYYY-MM-DD format")
    hora_inicio: Optional[str] = Field(
        None, description="New start time in HH:MM format"
    )
    hora_fim: Optional[str] = Field(None, description="New end time in HH:MM format")
    tipo: Optional[
        Literal["reuniao", "pagamento", "evento", "lembrete", "aniversario"]
    ] = Field(None, description="New commitment type")
    status: Optional[Literal["agendado", "concluido", "cancelado", "adiado"]] = Field(
        None, description="New status"
    )


class N8NCommitmentMarkDone(N8NResourceIdentifier):
    """Request schema for marking commitment as done (shortcut)"""

    pass  # Only needs resource_id and user identification


class N8NCommitmentDelete(N8NResourceIdentifier):
    """Request schema for N8N commitment deletion"""

    pass  # Only needs resource_id and user identification


# Budget Update Schemas
class N8NBudgetUpdate(N8NResourceIdentifier):
    """Request schema for N8N budget update"""

    nome: Optional[str] = Field(
        None, description="New budget name", min_length=1, max_length=100
    )
    valor_limite: Optional[float] = Field(
        None, description="New budget limit amount", gt=0
    )
    categoria_id: Optional[int] = Field(None, description="New category ID")
    categoria_nome: Optional[str] = Field(
        None, description="New category name for lookup"
    )
    notificar_em: Optional[float] = Field(
        None, description="New alert percentage threshold", ge=0, le=100
    )


class N8NBudgetDelete(N8NResourceIdentifier):
    """Request schema for N8N budget deletion"""

    pass  # Only needs resource_id and user identification


# Transaction Update Schemas
class N8NTransactionUpdate(N8NResourceIdentifier):
    """Request schema for N8N transaction update"""

    valor: Optional[float] = Field(None, description="New transaction amount", gt=0)
    descricao: Optional[str] = Field(None, description="New transaction description")
    tipo: Optional[Literal["despesa", "receita"]] = Field(
        None, description="New transaction type"
    )
    categoria_id: Optional[int] = Field(None, description="New category ID")
    categoria_nome: Optional[str] = Field(
        None, description="New category name for lookup"
    )
    data_transacao: Optional[str] = Field(
        None, description="New transaction date in YYYY-MM-DD format"
    )


class N8NTransactionDelete(N8NResourceIdentifier):
    """Request schema for N8N transaction deletion"""

    pass  # Only needs resource_id and user identification


# Generic Success Response
class N8NUpdateResponse(BaseModel):
    """Generic response for update/delete operations"""

    success: bool
    message: str
    resource: Optional[Dict] = Field(None, description="Updated resource data")

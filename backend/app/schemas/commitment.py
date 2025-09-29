from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


class CommitmentBase(BaseModel):
    titulo: str = Field(
        ..., min_length=1, max_length=200, description="Título do compromisso"
    )
    descricao: Optional[str] = Field(None, description="Descrição detalhada")
    data_inicio: datetime = Field(..., description="Data e hora de início")
    data_fim: datetime = Field(..., description="Data e hora de fim")
    tipo: Literal["reuniao", "pagamento", "evento", "lembrete", "aniversario"] = Field(
        default="evento", description="Tipo do compromisso"
    )
    status: Literal["agendado", "concluido", "cancelado", "adiado"] = Field(
        default="agendado", description="Status do compromisso"
    )
    recorrencia: Literal["nenhuma", "diaria", "semanal", "mensal", "anual"] = Field(
        default="nenhuma", description="Tipo de recorrência"
    )
    recorrencia_ate: Optional[date] = Field(
        None, description="Data limite para recorrência"
    )
    lembrete_whatsapp: Optional[bool] = Field(
        default=True, description="Enviar lembrete via WhatsApp"
    )
    minutos_antes_lembrete: Optional[int] = Field(
        default=30, ge=0, le=1440, description="Minutos antes para lembrete"
    )

    @validator("data_fim")
    def validate_dates(cls, v, values):
        if "data_inicio" in values and v <= values["data_inicio"]:
            raise ValueError("Data fim deve ser posterior à data início")
        return v

    @validator("recorrencia_ate")
    def validate_recurrence_end(cls, v, values):
        if v and "recorrencia" in values and values["recorrencia"] == "nenhuma":
            raise ValueError("Data limite só é válida para compromissos recorrentes")
        return v


class CommitmentCreate(CommitmentBase):
    usuario_id: UUID


class CommitmentUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=200)
    descricao: Optional[str] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    tipo: Optional[
        Literal["reuniao", "pagamento", "evento", "lembrete", "aniversario"]
    ] = None
    status: Optional[Literal["agendado", "concluido", "cancelado", "adiado"]] = None
    recorrencia: Optional[
        Literal["nenhuma", "diaria", "semanal", "mensal", "anual"]
    ] = None
    recorrencia_ate: Optional[date] = None
    lembrete_whatsapp: Optional[bool] = None
    minutos_antes_lembrete: Optional[int] = Field(None, ge=0, le=1440)


class CommitmentInDB(CommitmentBase):
    id: UUID
    usuario_id: UUID
    compromisso_pai_id: Optional[UUID]
    google_event_id: Optional[str]
    sincronizado_google: bool
    ultima_sincronizacao: Optional[datetime]
    precisa_sincronizar: bool
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True


class Commitment(CommitmentInDB):
    pass


class CommitmentWithRecurrence(Commitment):
    """Compromisso com informações de recorrência."""

    filhos_recorrencia: List[Commitment] = []
    pai_recorrencia: Optional[Commitment] = None

    class Config:
        from_attributes = True


# Google Auth Schemas
class UserGoogleAuthBase(BaseModel):
    google_calendar_id: Optional[str] = None
    google_email: Optional[str] = None
    ativo: bool = True


class UserGoogleAuthCreate(UserGoogleAuthBase):
    usuario_id: UUID
    google_access_token: str
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[datetime] = None


class UserGoogleAuthUpdate(BaseModel):
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[datetime] = None
    google_calendar_id: Optional[str] = None
    google_email: Optional[str] = None
    ativo: Optional[bool] = None


class UserGoogleAuthInDB(UserGoogleAuthBase):
    id: UUID
    usuario_id: UUID
    google_access_token: str
    google_refresh_token: Optional[str]
    google_token_expiry: Optional[datetime]
    ultima_sincronizacao: Optional[datetime]
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True


class UserGoogleAuth(UserGoogleAuthInDB):
    pass


# Response Schemas for API
class CommitmentResponse(BaseModel):
    """Schema de resposta simplificado para APIs públicas."""

    id: UUID
    titulo: str
    descricao: Optional[str]
    data_inicio: datetime
    data_fim: datetime
    tipo: str
    status: str
    recorrencia: str
    sincronizado_google: bool


class CommitmentSummary(BaseModel):
    """Resumo de compromisso para dashboard."""

    id: UUID
    titulo: str
    data_inicio: datetime
    data_fim: datetime
    tipo: str
    status: str
    google_sincronizado: bool
    minutos_para_inicio: Optional[int] = None

    class Config:
        from_attributes = True


class AgendaResponse(BaseModel):
    """Response para endpoint de agenda."""

    data_inicio: date
    data_fim: date
    total_compromissos: int
    compromissos_por_dia: dict
    compromissos: List[CommitmentResponse]


class GoogleAuthStatus(BaseModel):
    """Status da autenticação Google."""

    conectado: bool
    google_email: Optional[str] = None
    ultima_sincronizacao: Optional[datetime] = None
    precisa_reautenticar: bool = False

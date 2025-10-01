from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.deps import get_database
from app.core.plan_validation import HTTP_402_PAYMENT_REQUIRED, require_feature
from app.crud.commitment import commitment, user_google_auth
from app.crud.user import user
from app.schemas.commitment import (
    AgendaResponse,
    Commitment,
    CommitmentCreate,
    CommitmentResponse,
    CommitmentSummary,
    CommitmentUpdate,
    GoogleAuthStatus,
)
from app.services.google_calendar_service import google_calendar_service
from app.services.usage_service import usage_service

router = APIRouter()


@router.post(
    "/compromissos/",
    response_model=Commitment,
    dependencies=[Depends(require_feature("commitments_enabled"))],
)
def criar_compromisso(
    *, db: Session = Depends(get_database), commitment_in: CommitmentCreate
):
    """
    Cria um novo compromisso.

    Requer: Feature 'commitments_enabled' no plano
    Limite: max_commitments
    """
    # Verificar se usuário existe
    db_user = user.get(db, id=commitment_in.usuario_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Verificar limite de compromissos do plano
    can_create, error_msg = usage_service.check_can_create(db, db_user, "commitment")
    if not can_create:
        raise HTTPException(status_code=HTTP_402_PAYMENT_REQUIRED, detail=error_msg)

    # Criar compromisso
    db_commitment = commitment.create_with_sync_flag(db, obj_in=commitment_in)

    # Se tem recorrência, criar instâncias
    if db_commitment.recorrencia != "nenhuma":
        commitment.create_recurrence_instances(db, commitment=db_commitment)

    return db_commitment


@router.get("/compromissos/", response_model=List[Commitment])
def listar_compromissos(
    *,
    db: Session = Depends(get_database),
    usuario_id: UUID,
    status: Optional[str] = Query(None, description="Filtrar por status"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """Lista compromissos do usuário."""
    return commitment.get_by_user(
        db,
        usuario_id=usuario_id,
        status_filter=status,
        tipo_filter=tipo,
        skip=skip,
        limit=limit,
    )


@router.get("/compromissos/{commitment_id}", response_model=Commitment)
def obter_compromisso(*, db: Session = Depends(get_database), commitment_id: UUID):
    """Obtém detalhes de um compromisso específico."""
    db_commitment = commitment.get(db, id=commitment_id)
    if not db_commitment:
        raise HTTPException(status_code=404, detail="Compromisso não encontrado")

    return db_commitment


@router.put("/compromissos/{commitment_id}", response_model=Commitment)
def atualizar_compromisso(
    *,
    db: Session = Depends(get_database),
    commitment_id: UUID,
    commitment_in: CommitmentUpdate,
):
    """Atualiza um compromisso existente."""
    db_commitment = commitment.get(db, id=commitment_id)
    if not db_commitment:
        raise HTTPException(status_code=404, detail="Compromisso não encontrado")

    # Atualizar compromisso
    updated_commitment = commitment.update(
        db, db_obj=db_commitment, obj_in=commitment_in
    )

    # Marcar para sincronização se conectado ao Google
    google_auth = user_google_auth.get_by_user(
        db, usuario_id=updated_commitment.usuario_id
    )
    if google_auth and google_auth.ativo:
        updated_commitment.precisa_sincronizar = True
        db.add(updated_commitment)
        db.commit()

    return updated_commitment


@router.delete("/compromissos/{commitment_id}")
def excluir_compromisso(*, db: Session = Depends(get_database), commitment_id: UUID):
    """Exclui um compromisso."""
    db_commitment = commitment.get(db, id=commitment_id)
    if not db_commitment:
        raise HTTPException(status_code=404, detail="Compromisso não encontrado")

    # Se tem evento no Google, tentar remover
    if db_commitment.google_event_id:
        google_calendar_service.delete_google_event(db, db_commitment)

    # Remover do banco
    commitment.remove(db, id=commitment_id)

    return {"message": "Compromisso excluído com sucesso"}


@router.get("/compromissos/usuario/{usuario_id}/agenda", response_model=AgendaResponse)
def agenda_usuario(
    *,
    db: Session = Depends(get_database),
    usuario_id: UUID,
    data_inicio: date = Query(..., description="Data de início (YYYY-MM-DD)"),
    data_fim: date = Query(..., description="Data de fim (YYYY-MM-DD)"),
):
    """Retorna agenda do usuário para um período."""
    # Converter dates para datetime
    dt_inicio = datetime.combine(data_inicio, datetime.min.time())
    dt_fim = datetime.combine(data_fim, datetime.max.time())

    # Buscar compromissos do período
    compromissos = commitment.get_by_period(
        db, usuario_id=usuario_id, data_inicio=dt_inicio, data_fim=dt_fim
    )

    # Agrupar por dia
    compromissos_por_dia = {}
    for comp in compromissos:
        dia = comp.data_inicio.date().isoformat()
        if dia not in compromissos_por_dia:
            compromissos_por_dia[dia] = 0
        compromissos_por_dia[dia] += 1

    # Converter para resposta
    compromissos_response = [
        CommitmentResponse(
            id=comp.id,
            titulo=comp.titulo,
            descricao=comp.descricao,
            data_inicio=comp.data_inicio,
            data_fim=comp.data_fim,
            tipo=comp.tipo,
            status=comp.status,
            recorrencia=comp.recorrencia,
            sincronizado_google=comp.sincronizado_google,
        )
        for comp in compromissos
    ]

    return AgendaResponse(
        data_inicio=data_inicio,
        data_fim=data_fim,
        total_compromissos=len(compromissos),
        compromissos_por_dia=compromissos_por_dia,
        compromissos=compromissos_response,
    )


@router.get(
    "/compromissos/usuario/{usuario_id}/proximos",
    response_model=List[CommitmentSummary],
)
def proximos_compromissos(
    *,
    db: Session = Depends(get_database),
    usuario_id: UUID,
    horas: int = Query(24, ge=1, le=168, description="Próximas X horas"),
    limit: int = Query(10, ge=1, le=50),
):
    """Retorna próximos compromissos do usuário."""
    compromissos = commitment.get_proximos_compromissos(
        db, usuario_id=usuario_id, limite_horas=horas, limit=limit
    )

    now = datetime.now()
    summaries = []

    for comp in compromissos:
        minutos_para_inicio = int((comp.data_inicio - now).total_seconds() / 60)

        summaries.append(
            CommitmentSummary(
                id=comp.id,
                titulo=comp.titulo,
                data_inicio=comp.data_inicio,
                data_fim=comp.data_fim,
                tipo=comp.tipo,
                status=comp.status,
                google_sincronizado=comp.sincronizado_google,
                minutos_para_inicio=max(0, minutos_para_inicio),
            )
        )

    return summaries


# Google Calendar Integration Endpoints


@router.get("/compromissos/google/status")
def status_google_calendar(
    *, db: Session = Depends(get_database), usuario_id: UUID
) -> GoogleAuthStatus:
    """Verifica status da integração Google Calendar."""
    google_auth = user_google_auth.get_by_user(db, usuario_id=usuario_id)

    if not google_auth or not google_auth.ativo:
        return GoogleAuthStatus(conectado=False)

    precisa_reautenticar = user_google_auth.is_token_expired(google_auth)

    return GoogleAuthStatus(
        conectado=True,
        google_email=google_auth.google_email,
        ultima_sincronizacao=google_auth.ultima_sincronizacao,
        precisa_reautenticar=precisa_reautenticar,
    )


@router.post(
    "/compromissos/google/conectar",
    dependencies=[Depends(require_feature("google_calendar_sync"))],
)
def conectar_google_calendar(*, db: Session = Depends(get_database), usuario_id: UUID):
    """
    Inicia processo de conexão com Google Calendar.

    Requer: Feature 'google_calendar_sync' no plano
    """
    # Verificar se usuário existe
    db_user = user.get(db, id=usuario_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Gerar URL de autorização
    auth_url = google_calendar_service.get_authorization_url(str(usuario_id))

    return {
        "authorization_url": auth_url,
        "message": "Acesse a URL para autorizar acesso ao Google Calendar",
    }


@router.get("/compromissos/google/callback")
def callback_google_calendar(
    *,
    db: Session = Depends(get_database),
    code: str = Query(..., description="Código de autorização"),
    state: str = Query(..., description="ID do usuário"),
):
    """Callback do OAuth2 Google."""
    try:
        auth = google_calendar_service.handle_oauth_callback(db, code, state)

        if not auth:
            raise HTTPException(
                status_code=400, detail="Erro ao processar autorização Google"
            )

        # Redirecionar para frontend com sucesso
        return RedirectResponse(
            url="http://localhost:5173/dashboard?google_connected=true", status_code=302
        )
    except Exception as e:
        import traceback

        print(f"Erro no callback Google: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400, detail=f"Erro ao processar autorização: {str(e)}"
        )


@router.post(
    "/compromissos/google/sincronizar",
    dependencies=[Depends(require_feature("google_calendar_sync"))],
)
def sincronizar_google_calendar(
    *, db: Session = Depends(get_database), usuario_id: UUID
):
    """
    Força sincronização com Google Calendar.

    Requer: Feature 'google_calendar_sync' no plano
    """
    # Verificar se usuário tem Google conectado
    google_auth = user_google_auth.get_by_user(db, usuario_id=usuario_id)
    if not google_auth or not google_auth.ativo:
        raise HTTPException(status_code=400, detail="Google Calendar não conectado")

    # Marcar compromissos para sincronização
    user_commitments = commitment.get_by_user(db, usuario_id=usuario_id)
    for comp in user_commitments:
        comp.precisa_sincronizar = True
        db.add(comp)

    db.commit()

    # Executar sincronização
    results = google_calendar_service.sync_pending_commitments(db)

    return {"message": "Sincronização iniciada", "results": results}


@router.delete("/compromissos/google/desconectar")
def desconectar_google_calendar(
    *, db: Session = Depends(get_database), usuario_id: UUID
):
    """Desconecta Google Calendar."""
    success = google_calendar_service.disconnect_google_account(db, str(usuario_id))

    if not success:
        raise HTTPException(
            status_code=500, detail="Erro ao desconectar Google Calendar"
        )

    return {"message": "Google Calendar desconectado com sucesso"}


# Jobs e utilitários


@router.post("/sistema/compromissos/sincronizar-pendentes")
def job_sincronizar_pendentes(*, db: Session = Depends(get_database)):
    """Job para sincronizar compromissos pendentes."""
    results = google_calendar_service.sync_pending_commitments(db)

    return {"message": "Job de sincronização executado", "results": results}


@router.get("/compromissos/lembretes-pendentes")
def compromissos_para_lembrete(
    *,
    db: Session = Depends(get_database),
    minutos_antecedencia: int = Query(30, ge=1, le=1440),
):
    """Busca compromissos que precisam de lembrete."""
    compromissos_lembrete = commitment.get_compromissos_para_lembrete(
        db, minutos_antecedencia=minutos_antecedencia
    )

    return {
        "total": len(compromissos_lembrete),
        "compromissos": [
            {
                "id": comp.id,
                "usuario_id": comp.usuario_id,
                "titulo": comp.titulo,
                "data_inicio": comp.data_inicio,
                "minutos_para_inicio": int(
                    (comp.data_inicio - datetime.now()).total_seconds() / 60
                ),
            }
            for comp in compromissos_lembrete
        ],
    }

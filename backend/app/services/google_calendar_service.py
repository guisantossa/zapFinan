from datetime import datetime
from typing import Any, Dict, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.commitment import commitment as commitment_crud
from app.crud.commitment import user_google_auth
from app.models.commitment import Commitment, UserGoogleAuth
from app.schemas.commitment import UserGoogleAuthCreate, UserGoogleAuthUpdate


class GoogleCalendarService:
    """Serviço de integração com Google Calendar."""

    SCOPES = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/calendar",
    ]

    def __init__(self):
        self.client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
            }
        }

    def get_authorization_url(self, usuario_id: str) -> str:
        """Gera URL de autorização OAuth2."""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
        )

        # Adicionar estado para identificar o usuário
        authorization_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            state=usuario_id,  # Passa o ID do usuário no state
        )

        return authorization_url

    def handle_oauth_callback(
        self, db: Session, authorization_code: str, state: str
    ) -> Optional[UserGoogleAuth]:
        """Processa callback do OAuth2 e salva credenciais."""
        try:
            usuario_id = state  # O state contém o ID do usuário

            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.SCOPES,
                redirect_uri=settings.GOOGLE_REDIRECT_URI,
            )

            # Trocar código por tokens
            flow.fetch_token(code=authorization_code)

            credentials = flow.credentials

            # Obter informações do usuário
            service = build("oauth2", "v2", credentials=credentials)
            user_info = service.userinfo().get().execute()

            # Obter lista de calendários
            calendar_service = build("calendar", "v3", credentials=credentials)
            calendar_list = calendar_service.calendarList().list().execute()

            # Pegar o calendário primário
            primary_calendar = None
            for calendar in calendar_list.get("items", []):
                if calendar.get("primary", False):
                    primary_calendar = calendar["id"]
                    break

            # Verificar se já existe auth para este usuário
            existing_auth = user_google_auth.get_by_user(db, usuario_id=usuario_id)

            if existing_auth:
                # Atualizar credenciais existentes
                auth_data = UserGoogleAuthUpdate(
                    google_access_token=credentials.token,
                    google_refresh_token=credentials.refresh_token,
                    google_token_expiry=credentials.expiry,
                    google_calendar_id=primary_calendar,
                    google_email=user_info.get("email"),
                    ativo=True,
                )
                return user_google_auth.update(
                    db, db_obj=existing_auth, obj_in=auth_data
                )
            else:
                # Criar nova autenticação
                auth_data = UserGoogleAuthCreate(
                    usuario_id=usuario_id,
                    google_access_token=credentials.token,
                    google_refresh_token=credentials.refresh_token,
                    google_token_expiry=credentials.expiry,
                    google_calendar_id=primary_calendar,
                    google_email=user_info.get("email"),
                )
                return user_google_auth.create(db, obj_in=auth_data)

        except Exception as e:
            print(f"Erro no callback OAuth2: {e}")
            return None

    def refresh_token_if_needed(self, db: Session, auth: UserGoogleAuth) -> bool:
        """Atualiza token se necessário."""
        if not user_google_auth.is_token_expired(auth):
            return True

        if not auth.google_refresh_token:
            return False

        try:
            credentials = Credentials(
                token=auth.google_access_token,
                refresh_token=auth.google_refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )

            credentials.refresh(Request())

            # Atualizar no banco
            user_google_auth.update_tokens(
                db,
                auth=auth,
                access_token=credentials.token,
                token_expiry=credentials.expiry,
            )

            return True

        except Exception as e:
            print(f"Erro ao renovar token: {e}")
            return False

    def get_google_service(self, db: Session, usuario_id: str) -> Optional[Any]:
        """Obtém serviço autenticado do Google Calendar."""
        auth = user_google_auth.get_by_user(db, usuario_id=usuario_id)

        if not auth or not auth.ativo:
            return None

        if not self.refresh_token_if_needed(db, auth):
            return None

        try:
            credentials = Credentials(
                token=auth.google_access_token,
                refresh_token=auth.google_refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
            )

            return build("calendar", "v3", credentials=credentials)

        except Exception as e:
            print(f"Erro ao criar serviço Google: {e}")
            return None

    def create_google_event(self, db: Session, commitment: Commitment) -> Optional[str]:
        """Cria evento no Google Calendar."""
        service = self.get_google_service(db, str(commitment.usuario_id))

        if not service:
            return None

        auth = user_google_auth.get_by_user(db, usuario_id=commitment.usuario_id)
        if not auth or not auth.google_calendar_id:
            return None

        try:
            event = {
                "summary": commitment.titulo,
                "description": commitment.descricao or "",
                "start": {
                    "dateTime": commitment.data_inicio.isoformat(),
                    "timeZone": "America/Sao_Paulo",
                },
                "end": {
                    "dateTime": commitment.data_fim.isoformat(),
                    "timeZone": "America/Sao_Paulo",
                },
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {
                            "method": "popup",
                            "minutes": commitment.minutos_antes_lembrete,
                        },
                    ],
                },
            }

            created_event = (
                service.events()
                .insert(calendarId=auth.google_calendar_id, body=event)
                .execute()
            )

            return created_event.get("id")

        except HttpError as e:
            print(f"Erro ao criar evento Google: {e}")
            return None

    def update_google_event(self, db: Session, commitment: Commitment) -> bool:
        """Atualiza evento no Google Calendar."""
        if not commitment.google_event_id:
            return False

        service = self.get_google_service(db, str(commitment.usuario_id))
        if not service:
            return False

        auth = user_google_auth.get_by_user(db, usuario_id=commitment.usuario_id)
        if not auth or not auth.google_calendar_id:
            return False

        try:
            event = {
                "summary": commitment.titulo,
                "description": commitment.descricao or "",
                "start": {
                    "dateTime": commitment.data_inicio.isoformat(),
                    "timeZone": "America/Sao_Paulo",
                },
                "end": {
                    "dateTime": commitment.data_fim.isoformat(),
                    "timeZone": "America/Sao_Paulo",
                },
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {
                            "method": "popup",
                            "minutes": commitment.minutos_antes_lembrete,
                        },
                    ],
                },
            }

            service.events().update(
                calendarId=auth.google_calendar_id,
                eventId=commitment.google_event_id,
                body=event,
            ).execute()

            return True

        except HttpError as e:
            print(f"Erro ao atualizar evento Google: {e}")
            return False

    def delete_google_event(self, db: Session, commitment: Commitment) -> bool:
        """Remove evento do Google Calendar."""
        if not commitment.google_event_id:
            return True

        service = self.get_google_service(db, str(commitment.usuario_id))
        if not service:
            return False

        auth = user_google_auth.get_by_user(db, usuario_id=commitment.usuario_id)
        if not auth or not auth.google_calendar_id:
            return False

        try:
            service.events().delete(
                calendarId=auth.google_calendar_id, eventId=commitment.google_event_id
            ).execute()

            return True

        except HttpError as e:
            print(f"Erro ao deletar evento Google: {e}")
            return False

    def sync_commitment_to_google(self, db: Session, commitment: Commitment) -> bool:
        """Sincroniza compromisso específico com Google."""
        if commitment.google_event_id:
            # Atualizar evento existente
            success = self.update_google_event(db, commitment)
        else:
            # Criar novo evento
            google_event_id = self.create_google_event(db, commitment)
            if google_event_id:
                commitment.google_event_id = google_event_id
                success = True
            else:
                success = False

        if success:
            commitment.sincronizado_google = True
            commitment.precisa_sincronizar = False
            commitment.ultima_sincronizacao = datetime.now()
            db.add(commitment)
            db.commit()

        return success

    def sync_pending_commitments(self, db: Session) -> Dict[str, Any]:
        """Job para sincronizar compromissos pendentes."""
        pending_commitments = commitment_crud.get_pendentes_sincronizacao(db)

        results = {
            "total_pendentes": len(pending_commitments),
            "sincronizados": 0,
            "erros": 0,
            "detalhes": [],
        }

        for commitment in pending_commitments:
            try:
                if self.sync_commitment_to_google(db, commitment):
                    results["sincronizados"] += 1
                    results["detalhes"].append(
                        {"commitment_id": str(commitment.id), "status": "sincronizado"}
                    )
                else:
                    results["erros"] += 1
                    results["detalhes"].append(
                        {
                            "commitment_id": str(commitment.id),
                            "status": "erro_sincronizacao",
                        }
                    )
            except Exception as e:
                results["erros"] += 1
                results["detalhes"].append(
                    {
                        "commitment_id": str(commitment.id),
                        "status": "erro",
                        "erro": str(e),
                    }
                )

        return results

    def disconnect_google_account(self, db: Session, usuario_id: str) -> bool:
        """Desconecta conta Google do usuário."""
        auth = user_google_auth.get_by_user(db, usuario_id=usuario_id)

        if not auth:
            return True

        # Marcar como inativo
        user_google_auth.update(db, db_obj=auth, obj_in={"ativo": False})

        # Marcar todos os compromissos como não sincronizados
        user_commitments = commitment_crud.get_by_user(db, usuario_id=usuario_id)

        for commitment in user_commitments:
            commitment.sincronizado_google = False
            commitment.google_event_id = None
            db.add(commitment)

        db.commit()
        return True


# Instância única do serviço
google_calendar_service = GoogleCalendarService()

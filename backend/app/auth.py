# app/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
import psycopg2
import os
import requests
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")

class SendTokenRequest(BaseModel):
    telefone: str

@router.post("/auth/send-token/")
def send_token(req: SendTokenRequest):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE telefone = %s", (req.telefone,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Telefone não encontrado")

    token = str(uuid.uuid4())

    cursor.execute("UPDATE users SET token = %s WHERE telefone = %s", (token, req.telefone))
    conn.commit()

    payload = {
        "link": f"https://zapgastos.com.br/login?token={token}"
    }

    

    return payload

class LoginRequest(BaseModel):
    telefone: str
    token: str

@router.post("/auth/login/")
def login(req: LoginRequest):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Valida telefone e token
    cursor.execute("SELECT id, nome FROM users WHERE telefone = %s AND token = %s", (req.telefone, req.token))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido")

    # Limpa o token após login (opcional)
    cursor.execute("UPDATE users SET token = NULL WHERE telefone = %s", (req.telefone,))
    conn.commit()

    # Retorna ID do usuário (ou você pode gerar um JWT se preferir)
    return {"id": user[0], "telefone": req.telefone, "nome": user[1]}
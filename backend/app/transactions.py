from fastapi import Query
from fastapi import APIRouter, HTTPException
import psycopg2
import os
from dotenv import load_dotenv

DATABASE_URL = os.getenv("DATABASE_URL")

router = APIRouter()



@router.get("/usuarios/{usuario_id}/transacoes/")
def listar_transacoes(usuario_id: str, limite: int = Query(10)):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT valor, tipo, nome, data_transacao, mensagem_original
        FROM transactions inner join categories on transactions.categoria_id = categories.id
        WHERE usuario_id = %s
        ORDER BY data_transacao DESC
        LIMIT %s
    """, (usuario_id, limite))

    rows = cursor.fetchall()
    conn.close()

    resultado = [
        {"valor": float(r[0]), "tipo": r[1], "categoria": r[2], "data": r[3].isoformat(), "mensagem_original": r[4]}
        for r in rows
    ]

    return resultado

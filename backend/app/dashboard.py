# app/dashboard.py

from fastapi import APIRouter
from datetime import date, timedelta
import psycopg2
import os

router = APIRouter()
DATABASE_URL = os.getenv("DATABASE_URL")


@router.get("/dashboard/resumo/{usuario_id}")
def resumo_mensal(usuario_id: str):
    hoje = date.today()
    inicio_mes = hoje.replace(day=1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT tipo, SUM(valor) 
        FROM transactions 
        WHERE usuario_id = %s AND data_transacao >= %s 
        GROUP BY tipo
    """, (usuario_id, inicio_mes))
    rows = cur.fetchall()

    receitas = sum(v for t, v in rows if t == 'receita')
    despesas = sum(v for t, v in rows if t == 'despesa')

    cur.execute("""
        SELECT COUNT(*) 
        FROM transactions 
        WHERE usuario_id = %s AND data_transacao >= %s
    """, (usuario_id, inicio_mes))
    total = cur.fetchone()[0]

    conn.close()
    return {
        "receitas": float(receitas),
        "despesas": float(despesas),
        "saldo": float(receitas - despesas),
        "total_transacoes": total
    }


@router.get("/dashboard/por-categoria/{usuario_id}")
def por_categoria(usuario_id: str):
    hoje = date.today()
    inicio_mes = hoje.replace(day=1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT nome, SUM(valor)
        FROM transactions inner join categories on transactions.categoria_id = categories.id
        WHERE usuario_id = %s AND data_transacao >= %s
        GROUP BY nome
        ORDER BY SUM(valor) DESC
    """, (usuario_id, inicio_mes))
    dados = cur.fetchall()
    conn.close()

    return [{"nome": c or "sem categoria", "valor": float(v)} for c, v in dados]


@router.get("/dashboard/ultimos-meses/{usuario_id}")
def ultimos_meses(usuario_id: str):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT
            TO_CHAR(data_transacao, 'YYYY-MM') AS mes,
            tipo,
            SUM(valor)
        FROM transactions
        WHERE usuario_id = %s AND data_transacao >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY mes, tipo
        ORDER BY mes ASC
    """, (usuario_id,))
    rows = cur.fetchall()
    conn.close()

    resultado = {}
    for mes, tipo, valor in rows:
        if mes not in resultado:
            resultado[mes] = {"receita": 0, "despesa": 0}
        resultado[mes][tipo] = float(valor)

    # formatar em lista ordenada
    return [{"mes": m, **v} for m, v in sorted(resultado.items())]


@router.get("/dashboard/ultimas-transacoes/{usuario_id}")
def ultimas_transacoes(usuario_id: str):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT valor, tipo, nome, data_transacao, mensagem_original
        FROM transactions inner join categories on transactions.categoria_id = categories.id
        WHERE usuario_id = %s
        ORDER BY data_transacao DESC
        LIMIT 5
    """, (usuario_id,))
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "valor": float(r[0]),
            "tipo": r[1],
            "nome": r[2],
            "data": r[3].isoformat(),
            "mensagem_original": r[4]
        }
        for r in rows
    ]


@router.get("/dashboard/ranking/{usuario_id}")
def ranking_categoria(usuario_id: str):
    hoje = date.today()
    inicio_mes = hoje.replace(day=1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT nome, SUM(valor)
        FROM transactions inner join categories on transactions.categoria_id = categories.id
        WHERE usuario_id = %s AND tipo = 'despesa' AND data_transacao >= %s
        GROUP BY nome
        ORDER BY SUM(valor) DESC
        LIMIT 5
    """, (usuario_id, inicio_mes))
    rows = cur.fetchall()
    conn.close()

    return [{"nome": c or "sem categoria", "valor": float(v)} for c, v in rows]

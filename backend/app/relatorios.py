# app/relatorios.py

from fastapi import APIRouter, Query
import psycopg2
import os
from datetime import date

router = APIRouter()
DATABASE_URL = os.getenv("DATABASE_URL")

@router.get("/relatorios/mensal/{usuario_id}")
def relatorio_mensal(usuario_id: str, mes: int = Query(...), ano: int = Query(...)):
    inicio = date(ano, mes, 1)
    if mes == 12:
        fim = date(ano + 1, 1, 1)
    else:
        fim = date(ano, mes + 1, 1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Resumo
    cur.execute("""
        SELECT tipo, SUM(valor)
        FROM transactions
        WHERE usuario_id = %s AND data_transacao >= %s AND data_transacao < %s
        GROUP BY tipo
    """, (usuario_id, inicio, fim))
    resumo = {tipo: float(valor) for tipo, valor in cur.fetchall()}

    # Por categoria
    cur.execute("""
        SELECT c.nome, SUM(valor)
        FROM transactions inner join categories c on transactions.categoria_id = c.id
        WHERE usuario_id = %s AND data_transacao >= %s AND data_transacao < %s
        GROUP BY c.nome
        ORDER BY SUM(valor) DESC
    """, (usuario_id, inicio, fim))
    por_categoria = [{"nome": c or "sem categoria", "valor": float(v)} for c, v in cur.fetchall()]

    # Nº de transações por categoria
    cur.execute("""
        SELECT c.nome, COUNT(*)
        FROM transactions inner join categories c on transactions.categoria_id = c.id
        WHERE usuario_id = %s AND data_transacao >= %s AND data_transacao < %s
        GROUP BY c.nome
    """, (usuario_id, inicio, fim))
    qtd_por_categoria = {c or "sem categoria": int(qtd) for c, qtd in cur.fetchall()}

    # Transações detalhadas
    cur.execute("""
        SELECT transactions.id, valor, tipo, descricao, data_transacao, c.nome as categoria, mensagem_original
        FROM transactions
        LEFT JOIN categories c ON transactions.categoria_id = c.id
        WHERE usuario_id = %s AND data_transacao >= %s AND data_transacao < %s
        ORDER BY data_transacao DESC
    """, (usuario_id, inicio, fim))

    detalhes = [
        {
            "id": str(id),
            "valor": float(valor),
            "tipo": tipo,
            "descricao": descricao,
            "data": data_transacao.isoformat(),
            "categoria": categoria or "sem categoria",
            "mensagem_original": mensagem_original
        }
        for id, valor, tipo, descricao, data_transacao, categoria, mensagem_original in cur.fetchall()
    ]
    
    conn.close()
    
    
    return {
        "resumo": {
            "receitas": resumo.get("receita", 0),
            "despesas": resumo.get("despesa", 0),
            "saldo": resumo.get("receita", 0) - resumo.get("despesa", 0)
        },
        "por_categoria": por_categoria or [],
        "qtd_por_categoria": qtd_por_categoria or [],
        "detalhes": detalhes 
    }

@router.get("/relatorios/anual/{usuario_id}")
def relatorio_anual(usuario_id: str, ano: int = Query(...)):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Resumo total do ano
    inicio_ano = date(ano, 1, 1)
    fim_ano = date(ano + 1, 1, 1)

    cur.execute("""
        SELECT tipo, SUM(valor)
        FROM transactions
        WHERE usuario_id = %s AND data_transacao >= %s AND data_transacao < %s
        GROUP BY tipo
    """, (usuario_id, inicio_ano, fim_ano))
    resumo_raw = {tipo: float(valor) for tipo, valor in cur.fetchall()}
    resumo = {
        "receitas": resumo_raw.get("receita", 0),
        "despesas": resumo_raw.get("despesa", 0),
        "saldo": resumo_raw.get("receita", 0) - resumo_raw.get("despesa", 0)
    }

    # Por mês
    meses = []
    for mes in range(1, 13):
        inicio = date(ano, mes, 1)
        fim = date(ano + 1, 1, 1) if mes == 12 else date(ano, mes + 1, 1)

        # Resumo do mês
        cur.execute("""
            SELECT tipo, SUM(valor)
            FROM transactions
            WHERE usuario_id = %s AND data_transacao >= %s AND data_transacao < %s
            GROUP BY tipo
        """, (usuario_id, inicio, fim))
        resumo_mes_raw = {tipo: float(valor) for tipo, valor in cur.fetchall()}
        resumo_mes = {
            "receitas": resumo_mes_raw.get("receita", 0),
            "despesas": resumo_mes_raw.get("despesa", 0),
            "saldo": resumo_mes_raw.get("receita", 0) - resumo_mes_raw.get("despesa", 0)
        }

        # Por categoria no mês
        cur.execute("""
            SELECT c.nome, SUM(valor)
            FROM transactions INNER JOIN categories c ON transactions.categoria_id = c.id
            WHERE usuario_id = %s AND data_transacao >= %s AND data_transacao < %s
            GROUP BY c.nome
            ORDER BY SUM(valor) DESC
        """, (usuario_id, inicio, fim))
        por_categoria = [{"nome": c or "sem categoria", "valor": float(v)} for c, v in cur.fetchall()]

        # Quantidade por categoria no mês
        cur.execute("""
            SELECT c.nome, COUNT(*)
            FROM transactions INNER JOIN categories c ON transactions.categoria_id = c.id
            WHERE usuario_id = %s AND data_transacao >= %s AND data_transacao < %s
            GROUP BY c.nome
        """, (usuario_id, inicio, fim))
        qtd_por_categoria = {c or "sem categoria": int(qtd) for c, qtd in cur.fetchall()}

        meses.append({
            "mes": mes,
            "resumo": resumo_mes,
            "por_categoria": por_categoria,
            "qtd_por_categoria": qtd_por_categoria
        })

    conn.close()
    return {
        "resumo": resumo,
        "meses": meses
    }


# app/categorias.py
from fastapi import APIRouter
import psycopg2
import os

router = APIRouter()
DATABASE_URL = os.getenv("DATABASE_URL")

@router.get("/categorias/")
def listar_categorias():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("SELECT nome from categories order by nome ASC")
    categorias = [row[0] for row in cur.fetchall()]

    conn.close()
    return categorias

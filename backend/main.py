from fastapi import FastAPI
from app.auth import router as auth_router
from app.transactions import router as transactions_router
from app.categoria import router as categoria_router
from app.dashboard import router as dashboard_router
from app.relatorios import router as relatorios_router
from fastapi.middleware.cors import CORSMiddleware
import os
cors_origins = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
app = FastAPI()

app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(categoria_router)
app.include_router(dashboard_router)
app.include_router(relatorios_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # porta do Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

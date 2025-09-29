from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.api.budget import router as budget_router
from app.api.categoria import router as categoria_router
from app.api.commitment import router as commitment_router
from app.api.dashboard import router as dashboard_router
from app.api.n8n_integration import router as n8n_router
from app.api.plans import router as plans_router
from app.api.transactions import router as transactions_router
from app.api.user_settings import router as user_settings_router
from app.api.users import router as users_router
from app.core.config import settings
from app.core.rate_limiter import custom_rate_limit_handler, limiter

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "ZapGastos API is running"}


# Include routers
app.include_router(categoria_router, tags=["categorias"])
app.include_router(budget_router, tags=["orçamentos"])
app.include_router(commitment_router, tags=["Compromissos"])
app.include_router(users_router, prefix="/user", tags=["users"])
app.include_router(
    user_settings_router, prefix="/user/settings", tags=["user-settings"]
)
app.include_router(dashboard_router, tags=["dashboard"])
app.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
app.include_router(plans_router, prefix="/plans", tags=["plans"])
app.include_router(n8n_router, prefix="/n8n", tags=["n8n-integration"])

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

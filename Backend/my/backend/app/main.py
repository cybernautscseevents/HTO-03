from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine
from app.routers.api import api_router
from app.utils.exceptions import KaamConnectException

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="KaamConnect: Workforce Coordination, Attendance, Wage Records & Accountability Platform for Construction",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Custom Exception Handler for Domain Exceptions
@app.exception_handler(KaamConnectException)
async def kaamconnect_exception_handler(request: Request, exc: KaamConnectException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "ERROR", "message": str(exc.detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": detail.get("code", "ERROR"),
                "message": detail.get("message", "An error occurred")
            }
        }
    )

# Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    msg = first_error.get("msg", "Validation error")
    loc = " -> ".join([str(x) for x in first_error.get("loc", [])])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"{loc}: {msg}" if loc else msg
            }
        }
    )

# Health Checks
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "env": settings.APP_ENV}

@app.get("/health/db", tags=["Health"])
def database_health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": "disconnected"}
        )

# Mount API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

"""FastAPI application entry point."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.errors import NotFoundError, ConflictError, PermissionError as AppPermissionError, ValidationError
from .db.session import init_db
from .routers import auth, users, assets, allocations, bookings, maintenance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - runs on startup and shutdown."""
    # Startup: Initialize database
    print("Initializing database...")
    init_db()
    print("Database initialized successfully")
    yield
    # Shutdown: cleanup if needed
    print("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Asset Management System API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(NotFoundError)
async def not_found_exception_handler(request: Request, exc: NotFoundError):
    """Handle NotFoundError exceptions with 404 response."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.message}
    )


@app.exception_handler(ConflictError)
async def conflict_exception_handler(request: Request, exc: ConflictError):
    """Handle ConflictError exceptions with 409 response."""
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.message}
    )


@app.exception_handler(AppPermissionError)
async def permission_exception_handler(request: Request, exc: AppPermissionError):
    """Handle PermissionError exceptions with 403 response."""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.message}
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle ValidationError exceptions with 422 response."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.message}
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify API is running."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": "/health"
    }


# Register routers with API prefix
app.include_router(auth.router, prefix=settings.API_V1_PREFIX, tags=["Authentication"])
app.include_router(users.router, prefix=settings.API_V1_PREFIX, tags=["Users"])
app.include_router(assets.router, prefix=settings.API_V1_PREFIX, tags=["Assets"])
app.include_router(allocations.router, prefix=settings.API_V1_PREFIX, tags=["Allocations"])
app.include_router(bookings.router, prefix=settings.API_V1_PREFIX, tags=["Bookings"])
app.include_router(maintenance.router, prefix=settings.API_V1_PREFIX, tags=["Maintenance"])

# Import org router
from .routers import org
app.include_router(org.router, prefix=settings.API_V1_PREFIX, tags=["Organization"])

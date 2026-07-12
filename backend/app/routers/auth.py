"""Authentication router - login, registration, and password reset endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.deps import get_db, get_current_user
from ..db import models
from ..schemas.user import (
    UserLogin, UserLoginResponse, UserCreate, UserResponse,
    ForgotPasswordRequest, ForgotPasswordResponse,
    ResetPasswordRequest, ResetPasswordResponse
)
from ..services.auth_service import AuthService
from ..core.errors import AuthenticationError

router = APIRouter(prefix="/auth")


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account via signup.
    
    IMPORTANT SECURITY RULE:
    - Role is ALWAYS set to "Employee" server-side
    - Even if 'role' is sent in request body, it is stripped/ignored
    - This prevents privilege escalation during signup
    - Only Admins can promote users via PATCH /employees/{id}/role
    
    Request body:
    - **name**: Full name (required)
    - **email**: Email address (required, must be unique)
    - **password**: Password (required, min 6 characters)
    - **department_id**: Optional department ID
    
    NOTE: Do NOT send 'role' field - it will be ignored for security.
    """
    # Register user with Employee role (AuthService enforces this)
    user = AuthService.register_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        name=user_data.name,
        department_id=user_data.department_id
    )
    
    return user


@router.post("/login", response_model=UserLoginResponse)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    
    Request body:
    - **email**: User email address
    - **password**: User password
    
    Returns:
    - **access_token**: JWT token for authentication
    - **token_type**: Token type (bearer)
    - **user**: User profile (id, name, email, role, department_id)
    """
    try:
        # Authenticate user
        user = AuthService.authenticate_user(db, credentials.email, credentials.password)
        
        # Create access token
        access_token = AuthService.create_token_for_user(user)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e.message)
        )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset token.
    
    For hackathon/demo:
    - Token is logged to server console (no real email sent)
    - Always returns generic success message
    - Does NOT leak whether email exists (security best practice)
    
    Request body:
    - **email**: Email address
    
    Response:
    - Generic success message (doesn't reveal if email exists)
    
    Check server console/logs for the actual reset token.
    """
    # Generate reset token (logged to console)
    AuthService.request_password_reset(db, request.email)
    
    # Always return generic message (security: don't leak email existence)
    return ForgotPasswordResponse()


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using token from forgot-password endpoint.
    
    Request body:
    - **token**: Reset token (from console/logs in demo)
    - **new_password**: New password (min 6 characters)
    
    Returns:
    - Success message if password was reset
    
    Errors:
    - 401: Invalid or expired token
    - 404: User not found
    """
    try:
        AuthService.reset_password(db, request.token, request.new_password)
        return ResetPasswordResponse()
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e.message)
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: models.User = Depends(get_current_user)
):
    """
    Get current user's profile.
    
    Requires valid JWT token in Authorization header:
    - Authorization: Bearer <token>
    
    Returns:
    - Current user's profile information
    """
    return current_user

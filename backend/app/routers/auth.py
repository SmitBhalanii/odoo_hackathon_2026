"""Authentication router - login and registration endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.deps import get_db
from ..schemas.user import UserLogin, UserLoginResponse, UserCreate, UserResponse
from ..services.auth_service import AuthService
from ..core.errors import AuthenticationError

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=UserLoginResponse)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    
    - **email**: User email address
    - **password**: User password
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


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    - **email**: User email address
    - **password**: User password (min 6 characters)
    - **name**: Full name
    - **role**: User role
    - **department_id**: Optional department ID
    """
    user = AuthService.register_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        name=user_data.name,
        role=user_data.role,
        department_id=user_data.department_id
    )
    
    return user

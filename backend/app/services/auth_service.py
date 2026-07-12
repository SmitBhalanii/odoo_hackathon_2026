"""Authentication service - handles login and user authentication."""

from sqlalchemy.orm import Session
from typing import Optional

from ..db import models
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.errors import AuthenticationError, NotFoundError


class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> models.User:
        """
        Authenticate a user by email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            User model if authentication successful
            
        Raises:
            AuthenticationError: If authentication fails
        """
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            raise AuthenticationError("Invalid email or password")
        
        if not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")
        
        if user.status != "Active":
            raise AuthenticationError("User account is not active")
        
        return user
    
    @staticmethod
    def create_token_for_user(user: models.User) -> str:
        """
        Create access token for authenticated user.
        
        Args:
            user: User model instance
            
        Returns:
            JWT access token string
        """
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role
        }
        
        return create_access_token(token_data)
    
    @staticmethod
    def register_user(
        db: Session,
        email: str,
        password: str,
        name: str,
        role: str = "Employee",
        department_id: Optional[int] = None
    ) -> models.User:
        """
        Register a new user.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            name: User full name
            role: User role (default: Employee)
            department_id: Optional department ID
            
        Returns:
            Newly created User model
            
        Raises:
            ConflictError: If email already exists
        """
        from ..core.errors import ConflictError
        
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            raise ConflictError(f"User with email {email} already exists")
        
        # Create new user
        hashed_password = get_password_hash(password)
        
        user = models.User(
            email=email,
            hashed_password=hashed_password,
            name=name,
            role=role,
            status="Active",
            department_id=department_id
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user

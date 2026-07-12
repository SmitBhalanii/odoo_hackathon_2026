"""Authentication service - handles login and user authentication."""

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import secrets
from datetime import datetime, timedelta

from ..db import models
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.errors import AuthenticationError, NotFoundError, ConflictError


# In-memory storage for password reset tokens (for hackathon/demo purposes)
# In production, use Redis or database with expiration
_reset_tokens: Dict[str, Dict[str, Any]] = {}


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
        department_id: Optional[int] = None
    ) -> models.User:
        """
        Register a new user via signup.
        
        IMPORTANT: Role is ALWAYS set to Employee, never accepted from request.
        This is a hard business rule - only admins can promote users via
        PATCH /employees/{id}/role endpoint.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            name: User full name
            department_id: Optional department ID
            
        Returns:
            Newly created User model with Employee role
            
        Raises:
            ConflictError: If email already exists
        """
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            raise ConflictError(f"User with email {email} already exists")
        
        # Validate department exists if provided
        if department_id:
            department = db.query(models.Department).filter(
                models.Department.id == department_id
            ).first()
            if not department:
                raise NotFoundError(f"Department with ID {department_id} not found")
        
        # Create new user with EMPLOYEE role (hard-coded, never from request)
        hashed_password = get_password_hash(password)
        
        user = models.User(
            email=email,
            hashed_password=hashed_password,
            name=name,
            role="Employee",  # ALWAYS Employee - this is a security requirement
            status="Active",
            department_id=department_id
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def request_password_reset(db: Session, email: str) -> str:
        """
        Generate password reset token for user.
        
        For hackathon: Token is logged to console, no real email sent.
        Always returns generic success message (doesn't leak if email exists).
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            Reset token (for logging/testing only)
        """
        user = db.query(models.User).filter(models.User.email == email).first()
        
        # Generate token regardless of whether user exists (security best practice)
        token = secrets.token_urlsafe(32)
        
        if user:
            # Store token with expiration (1 hour)
            _reset_tokens[token] = {
                "user_id": user.id,
                "email": user.email,
                "expires_at": datetime.utcnow() + timedelta(hours=1)
            }
            
            # Log to console for hackathon demo
            print(f"\n{'='*60}")
            print(f"PASSWORD RESET TOKEN GENERATED")
            print(f"{'='*60}")
            print(f"Email: {email}")
            print(f"Token: {token}")
            print(f"Expires: {_reset_tokens[token]['expires_at']}")
            print(f"{'='*60}\n")
        
        return token
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> bool:
        """
        Reset user password using token.
        
        Args:
            db: Database session
            token: Reset token
            new_password: New plain text password
            
        Returns:
            True if password was reset
            
        Raises:
            AuthenticationError: If token is invalid or expired
        """
        # Check if token exists
        if token not in _reset_tokens:
            raise AuthenticationError("Invalid or expired reset token")
        
        token_data = _reset_tokens[token]
        
        # Check if token is expired
        if datetime.utcnow() > token_data["expires_at"]:
            del _reset_tokens[token]
            raise AuthenticationError("Reset token has expired")
        
        # Get user
        user = db.query(models.User).filter(
            models.User.id == token_data["user_id"]
        ).first()
        
        if not user:
            del _reset_tokens[token]
            raise NotFoundError("User not found")
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        
        # Remove used token
        del _reset_tokens[token]
        
        print(f"\n{'='*60}")
        print(f"PASSWORD RESET SUCCESSFUL")
        print(f"{'='*60}")
        print(f"Email: {user.email}")
        print(f"User can now login with new password")
        print(f"{'='*60}\n")
        
        return True

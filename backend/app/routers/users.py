"""Users router - user management endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from ..core.deps import get_db, get_current_user, require_admin
from ..db import models
from ..schemas.user import UserResponse, UserUpdate
from ..schemas.common import PaginatedResponse
from ..core.errors import NotFoundError

router = APIRouter(prefix="/users")


@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List all users with pagination.
    Requires authentication.
    """
    total = db.query(models.User).count()
    users = db.query(models.User).offset(skip).limit(limit).all()
    
    return {
        "items": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get user by ID."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise NotFoundError(f"User with ID {user_id} not found")
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Update user (Admin only)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise NotFoundError(f"User with ID {user_id} not found")
    
    # Update fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user

"""Allocations router - asset allocation and transfer endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.deps import get_db, get_current_user
from ..db import models

router = APIRouter(prefix="/allocations")


@router.get("")
def list_allocations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List allocations with pagination."""
    query = db.query(models.Allocation)
    
    if status:
        query = query.filter(models.Allocation.status == status)
    
    total = query.count()
    allocations = query.offset(skip).limit(limit).all()
    
    return {
        "data": {
            "items": allocations,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }

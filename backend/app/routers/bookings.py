"""Bookings router - resource booking endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.deps import get_db, get_current_user
from ..db import models

router = APIRouter(prefix="/bookings")


@router.get("")
def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List bookings with pagination."""
    total = db.query(models.Booking).count()
    bookings = db.query(models.Booking).offset(skip).limit(limit).all()
    
    return {
        "data": {
            "items": bookings,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }

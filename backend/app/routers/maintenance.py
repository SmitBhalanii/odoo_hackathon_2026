"""Maintenance router - maintenance request endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.deps import get_db, get_current_user
from ..db import models

router = APIRouter(prefix="/maintenance-requests")


@router.get("")
def list_maintenance_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List maintenance requests with pagination."""
    total = db.query(models.MaintenanceRequest).count()
    requests = db.query(models.MaintenanceRequest).offset(skip).limit(limit).all()
    
    return {
        "data": {
            "items": requests,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }

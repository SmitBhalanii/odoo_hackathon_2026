"""Allocations router - asset allocation and transfer endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

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
    query = db.query(models.Allocation).filter(models.Allocation.is_transfer == 0)
    
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


# Create separate transfers router for RESTful structure
transfers_router = APIRouter(prefix="/transfers")


@transfers_router.get("")
def list_transfers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all transfers."""
    query = db.query(models.Allocation).filter(models.Allocation.is_transfer == 1)
    
    total = query.count()
    transfers = query.offset(skip).limit(limit).all()
    
    return {
        "data": {
            "items": transfers,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }


@transfers_router.get("/pending")
def list_pending_transfers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List pending transfers."""
    query = db.query(models.Allocation).filter(
        models.Allocation.is_transfer == 1,
        models.Allocation.transfer_status == "Pending"
    )
    
    total = query.count()
    transfers = query.offset(skip).limit(limit).all()
    
    return {
        "data": {
            "items": transfers,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }

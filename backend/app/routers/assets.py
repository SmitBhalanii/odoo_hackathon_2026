"""Assets router - asset management endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.deps import get_db, get_current_user
from ..db import models

router = APIRouter(prefix="/assets")


@router.get("")
def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: str = Query(None),
    category_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List assets with pagination and filtering.
    """
    query = db.query(models.Asset)
    
    if status:
        query = query.filter(models.Asset.status == status)
    if category_id:
        query = query.filter(models.Asset.category_id == category_id)
    
    total = query.count()
    assets = query.offset(skip).limit(limit).all()
    
    return {
        "data": {
            "items": [
                {
                    "id": asset.id,
                    "tag": asset.tag,
                    "name": asset.name,
                    "status": asset.status.value if hasattr(asset.status, 'value') else asset.status,
                    "category": asset.category.name if asset.category else None,
                    "location": asset.location.name if asset.location else None,
                    "department": asset.department.name if asset.department else None
                }
                for asset in assets
            ],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }


@router.get("/{asset_id}")
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get asset details by ID."""
    from ..core.errors import NotFoundError
    
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise NotFoundError(f"Asset with ID {asset_id} not found")
    
    return {"data": asset}

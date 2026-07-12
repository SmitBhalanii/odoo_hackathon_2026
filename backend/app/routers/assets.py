"""Assets router - asset management endpoints."""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.deps import get_db, get_current_user, require_role
from ..db import models
from ..schemas.asset import (
    AssetCreate, AssetUpdate, AssetResponse, AssetWithRelations,
    AssetListItem, AssetStatusTransition, ValidTransitionsResponse,
    AllocationHistoryItem, MaintenanceHistoryItem
)
from ..schemas.common import PaginatedResponse
from ..services.asset_service import AssetService
from ..core.errors import NotFoundError

router = APIRouter(prefix="/assets")


# ============================================================================
# ASSET CRUD ENDPOINTS
# ============================================================================

@router.post(
    "",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["Admin", "Asset Manager"]))]
)
def create_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin", "Asset Manager"]))
):
    """
    Register a new asset (Admin or Asset Manager only).
    
    Asset tag is auto-generated server-side with format AF-XXXX.
    If 'tag' is sent in request body, it will be ignored.
    
    Initial status is always "Available".
    
    Request body:
    - **name**: Asset name (required)
    - **category_id**: Asset category ID (required)
    - **acquisition_date**: Date acquired (required)
    - **acquisition_cost**: Purchase cost (required, > 0)
    - **condition**: Physical condition (New/Good/Fair/Poor, required)
    - **serial_number**: Optional serial number (must be unique)
    - **description**: Optional description
    - **location_id**: Optional location ID
    - **department_id**: Optional department ID
    - **photo_url**: Optional photo URL
    - **is_bookable**: Whether asset can be reserved (default: false)
    - **extra_field_values**: Optional category-specific field values
    """
    asset = AssetService.create_asset(
        db=db,
        name=asset_data.name,
        category_id=asset_data.category_id,
        acquisition_date=asset_data.acquisition_date,
        acquisition_cost=asset_data.acquisition_cost,
        condition=asset_data.condition,
        location_id=asset_data.location_id,
        serial_number=asset_data.serial_number,
        description=asset_data.description,
        photo_url=asset_data.photo_url,
        is_bookable=asset_data.is_bookable,
        department_id=asset_data.department_id,
        extra_field_values=asset_data.extra_field_values
    )
    
    return asset


@router.get("", response_model=PaginatedResponse[AssetListItem])
def list_assets(
    search: Optional[str] = Query(None, description="Search by tag, serial, or name"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    location_id: Optional[int] = Query(None, description="Filter by location"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List assets with search and filters.
    
    All filters are combined with AND logic.
    
    Query parameters:
    - **search**: Search term (matches tag, serial number, or name)
    - **category_id**: Filter by asset category
    - **status**: Filter by status (Available, Allocated, etc.)
    - **department_id**: Filter by department
    - **location_id**: Filter by location
    - **skip**: Pagination offset (default: 0)
    - **limit**: Items per page (default: 50, max: 100)
    """
    assets, total = AssetService.search_assets(
        db=db,
        search=search,
        category_id=category_id,
        status=status,
        department_id=department_id,
        location_id=location_id,
        skip=skip,
        limit=limit
    )
    
    # Transform to list items with related data
    items = []
    for asset in assets:
        item_dict = {
            "id": asset.id,
            "tag": asset.tag,
            "name": asset.name,
            "category_id": asset.category_id,
            "category_name": asset.category.name if asset.category else None,
            "status": asset.status.value if hasattr(asset.status, 'value') else asset.status,
            "condition": asset.condition.value if hasattr(asset.condition, 'value') else asset.condition,
            "location_id": asset.location_id,
            "location_name": asset.location.name if asset.location else None,
            "department_id": asset.department_id,
            "department_name": asset.department.name if asset.department else None,
            "is_bookable": asset.is_bookable
        }
        items.append(item_dict)
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/available", response_model=List[AssetListItem])
def list_available_assets(
    category_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    is_bookable: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get assets available for allocation or booking.
    
    Returns only assets with status "Available".
    Used by Allocation and Booking modules for dropdown population.
    
    Query parameters:
    - **category_id**: Filter by category
    - **location_id**: Filter by location
    - **department_id**: Filter by department
    - **is_bookable**: Filter by bookable flag
    """
    assets = AssetService.get_available_assets(
        db=db,
        category_id=category_id,
        location_id=location_id,
        department_id=department_id,
        is_bookable=is_bookable
    )
    
    # Transform to list items
    items = []
    for asset in assets:
        item_dict = {
            "id": asset.id,
            "tag": asset.tag,
            "name": asset.name,
            "category_id": asset.category_id,
            "category_name": asset.category.name if asset.category else None,
            "status": asset.status.value if hasattr(asset.status, 'value') else asset.status,
            "condition": asset.condition.value if hasattr(asset.condition, 'value') else asset.condition,
            "location_id": asset.location_id,
            "location_name": asset.location.name if asset.location else None,
            "department_id": asset.department_id,
            "department_name": asset.department.name if asset.department else None,
            "is_bookable": asset.is_bookable
        }
        items.append(item_dict)
    
    return items


@router.get("/{asset_id}", response_model=AssetWithRelations)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get asset details by ID.
    
    Returns full asset information with related objects (category, location, department).
    """
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    
    if not asset:
        raise NotFoundError(f"Asset with ID {asset_id} not found")
    
    # Build response with relations
    response = AssetWithRelations.model_validate(asset)
    
    if asset.category:
        response.category = {
            "id": asset.category.id,
            "name": asset.category.name,
            "extra_fields": asset.category.extra_fields
        }
    
    if asset.location:
        response.location = {
            "id": asset.location.id,
            "name": asset.location.name
        }
    
    if asset.department:
        response.department = {
            "id": asset.department.id,
            "name": asset.department.name
        }
    
    return response


@router.put(
    "/{asset_id}",
    response_model=AssetResponse,
    dependencies=[Depends(require_role(["Admin", "Asset Manager"]))]
)
def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin", "Asset Manager"]))
):
    """
    Update asset details (Admin or Asset Manager only).
    
    NOTE: Status cannot be updated through this endpoint.
    Use POST /assets/{id}/transition-status for status changes.
    
    Asset tag is immutable and cannot be changed.
    """
    # Convert Pydantic model to dict, excluding unset fields
    updates = asset_data.model_dump(exclude_unset=True)
    
    asset = AssetService.update_asset(db, asset_id, **updates)
    
    return asset


# ============================================================================
# STATUS TRANSITION ENDPOINT
# ============================================================================

@router.post(
    "/{asset_id}/transition-status",
    response_model=AssetResponse,
    dependencies=[Depends(require_role(["Admin", "Asset Manager"]))]
)
def transition_asset_status(
    asset_id: int,
    transition: AssetStatusTransition,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin", "Asset Manager"]))
):
    """
    Transition asset to new status using state machine (Admin or Asset Manager only).
    
    ⚠️  IMPORTANT: This is the only way to change asset status!
    
    Valid transitions are enforced by the state machine:
    - Available → Allocated, Reserved, Under Maintenance, Retired, Lost
    - Allocated → Available, Lost
    - Reserved → Available, Lost
    - Under Maintenance → Available, Retired, Lost
    - Lost → Available, Retired
    - Retired → Disposed
    - Disposed → (no transitions - terminal state)
    
    Request body:
    - **new_status**: Target status
    - **notes**: Optional notes about the transition
    
    The transition is logged for audit trail.
    """
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    
    if not asset:
        raise NotFoundError(f"Asset with ID {asset_id} not found")
    
    asset = AssetService.transition_asset_status(
        db=db,
        asset=asset,
        new_status=transition.new_status,
        actor=current_user,
        notes=transition.notes
    )
    
    return asset


@router.get("/{asset_id}/valid-transitions", response_model=ValidTransitionsResponse)
def get_valid_transitions(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get valid status transitions for an asset.
    
    Returns list of statuses the asset can transition to from its current status.
    Useful for UI to show available actions.
    """
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    
    if not asset:
        raise NotFoundError(f"Asset with ID {asset_id} not found")
    
    current_status = asset.status.value if hasattr(asset.status, 'value') else asset.status
    valid_transitions = AssetService.get_valid_transitions(current_status)
    
    return {
        "current_status": current_status,
        "valid_transitions": valid_transitions
    }


# ============================================================================
# HISTORY ENDPOINTS
# ============================================================================

@router.get("/{asset_id}/allocation-history", response_model=List[AllocationHistoryItem])
def get_allocation_history(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get allocation history for an asset.
    
    Returns all allocations for this asset, newest first.
    Shows who has used the asset and when.
    """
    # Verify asset exists
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise NotFoundError(f"Asset with ID {asset_id} not found")
    
    allocations = AssetService.get_allocation_history(db, asset_id)
    
    # Transform to response format
    items = []
    for alloc in allocations:
        item = {
            "id": alloc.id,
            "user_id": alloc.user_id,
            "user_name": alloc.user.name if alloc.user else "Unknown",
            "allocated_date": alloc.allocated_date,
            "expected_return_date": alloc.expected_return_date,
            "actual_return_date": alloc.actual_return_date,
            "status": alloc.status.value if hasattr(alloc.status, 'value') else alloc.status,
            "allocation_notes": alloc.allocation_notes,
            "return_notes": alloc.return_notes
        }
        items.append(item)
    
    return items


@router.get("/{asset_id}/maintenance-history", response_model=List[MaintenanceHistoryItem])
def get_maintenance_history(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get maintenance history for an asset.
    
    Returns all maintenance requests for this asset, newest first.
    Shows maintenance issues and resolutions.
    """
    # Verify asset exists
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise NotFoundError(f"Asset with ID {asset_id} not found")
    
    requests = AssetService.get_maintenance_history(db, asset_id)
    
    # Transform to response format
    items = []
    for req in requests:
        item = {
            "id": req.id,
            "requester_id": req.requester_id,
            "requester_name": req.requester.name if req.requester else "Unknown",
            "issue_description": req.issue_description,
            "priority": req.priority.value if hasattr(req.priority, 'value') else req.priority,
            "status": req.status.value if hasattr(req.status, 'value') else req.status,
            "scheduled_date": req.scheduled_date,
            "completed_date": req.completed_date,
            "cost": req.cost,
            "resolution_notes": req.resolution_notes,
            "created_at": req.created_at
        }
        items.append(item)
    
    return items

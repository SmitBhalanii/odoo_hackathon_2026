"""Maintenance router - maintenance request endpoints."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.deps import get_db, get_current_user, require_role
from ..db import models
from ..schemas.maintenance import (
    MaintenanceRequestCreate, MaintenanceRequestResponse,
    MaintenanceRequestWithRelations, MaintenanceRequestListItem,
    AssignTechnicianRequest, RejectMaintenanceRequest, ResolveMaintenanceRequest
)
from ..services.maintenance_service import MaintenanceService
from ..core.errors import NotFoundError

router = APIRouter(prefix="/maintenance")


# ============================================================================
# MAINTENANCE REQUEST ENDPOINTS
# ============================================================================

@router.post(
    "",
    response_model=MaintenanceRequestResponse,
    status_code=status.HTTP_201_CREATED
)
def create_maintenance_request(
    request_data: MaintenanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new maintenance request (any authenticated user).
    
    Request body:
    - **asset_id**: Asset ID (required)
    - **issue_description**: Description of the issue (required)
    - **priority**: Priority level (Low/Medium/High/Critical, required)
    - **photo_url**: Optional photo URL
    
    Initial status is "Pending" until approved by Asset Manager.
    """
    request = MaintenanceService.create_maintenance_request(
        db=db,
        asset_id=request_data.asset_id,
        raised_by=current_user.id,
        issue_description=request_data.issue_description,
        priority=request_data.priority,
        photo_url=request_data.photo_url
    )
    
    return request


@router.get("", response_model=List[MaintenanceRequestListItem])
def list_maintenance_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    asset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List maintenance requests with filters.
    
    Returns flat list for Kanban board - grouping by status is done client-side.
    
    Query parameters:
    - **status**: Filter by status (Pending/Approved/Rejected/etc.)
    - **asset_id**: Filter by asset ID
    """
    query = db.query(models.MaintenanceRequest)
    
    # Apply filters
    if status_filter:
        query = query.filter(models.MaintenanceRequest.status == status_filter)
    
    if asset_id:
        query = query.filter(models.MaintenanceRequest.asset_id == asset_id)
    
    # Order by priority and creation date
    requests = query.order_by(
        models.MaintenanceRequest.created_at.desc()
    ).all()
    
    # Transform to list items
    items = []
    for req in requests:
        item = {
            "id": req.id,
            "asset_id": req.asset_id,
            "asset_tag": req.asset.tag if req.asset else None,
            "asset_name": req.asset.name if req.asset else None,
            "raised_by": req.raised_by,
            "requester_name": req.requester.name if req.requester else None,
            "issue_description": req.issue_description,
            "priority": req.priority.value if hasattr(req.priority, 'value') else req.priority,
            "status": req.status.value if hasattr(req.status, 'value') else req.status,
            "technician_name": req.technician_name,
            "created_at": req.created_at
        }
        items.append(item)
    
    return items


@router.get("/{request_id}", response_model=MaintenanceRequestWithRelations)
def get_maintenance_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get maintenance request details by ID.
    
    Returns full request information with related objects (asset, requester, approver).
    """
    request = db.query(models.MaintenanceRequest).filter(
        models.MaintenanceRequest.id == request_id
    ).first()
    
    if not request:
        raise NotFoundError(f"Maintenance request with ID {request_id} not found")
    
    # Build response with relations
    response = MaintenanceRequestWithRelations.model_validate(request)
    
    if request.asset:
        response.asset = {
            "id": request.asset.id,
            "tag": request.asset.tag,
            "name": request.asset.name,
            "status": request.asset.status.value if hasattr(request.asset.status, 'value') else request.asset.status
        }
    
    if request.requester:
        response.requester = {
            "id": request.requester.id,
            "name": request.requester.name,
            "email": request.requester.email
        }
    
    if request.approver:
        response.approver = {
            "id": request.approver.id,
            "name": request.approver.name,
            "email": request.approver.email
        }
    
    return response


# ============================================================================
# WORKFLOW ENDPOINTS
# ============================================================================

@router.post(
    "/{request_id}/approve",
    response_model=MaintenanceRequestResponse,
    dependencies=[Depends(require_role(["Admin", "Asset Manager"]))]
)
def approve_maintenance_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin", "Asset Manager"]))
):
    """
    Approve maintenance request (Asset Manager or Admin only).
    
    Actions performed:
    - Sets status to "Approved"
    - Records approver
    - Transitions asset to "Under Maintenance"
    - Creates notification for requester
    """
    request = MaintenanceService.approve_maintenance(
        db=db,
        request_id=request_id,
        actor=current_user
    )
    
    return request


@router.post(
    "/{request_id}/reject",
    response_model=MaintenanceRequestResponse,
    dependencies=[Depends(require_role(["Admin", "Asset Manager"]))]
)
def reject_maintenance_request(
    request_id: int,
    rejection_data: RejectMaintenanceRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin", "Asset Manager"]))
):
    """
    Reject maintenance request (Asset Manager or Admin only).
    
    Request body:
    - **rejection_reason**: Optional reason for rejection
    
    Actions performed:
    - Sets status to "Rejected"
    - Creates notification for requester
    - Asset status remains unchanged
    """
    request = MaintenanceService.reject_maintenance(
        db=db,
        request_id=request_id,
        actor=current_user,
        rejection_reason=rejection_data.rejection_reason
    )
    
    return request


@router.post(
    "/{request_id}/assign-technician",
    response_model=MaintenanceRequestResponse,
    dependencies=[Depends(require_role(["Admin", "Asset Manager"]))]
)
def assign_technician(
    request_id: int,
    assignment_data: AssignTechnicianRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin", "Asset Manager"]))
):
    """
    Assign technician to maintenance request (Asset Manager or Admin only).
    
    Request body:
    - **technician_name**: Name of technician (required)
    
    Actions performed:
    - Sets status to "TechnicianAssigned"
    - Records technician name
    """
    request = MaintenanceService.assign_technician(
        db=db,
        request_id=request_id,
        technician_name=assignment_data.technician_name,
        actor=current_user
    )
    
    return request


@router.post(
    "/{request_id}/start",
    response_model=MaintenanceRequestResponse
)
def start_maintenance(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark maintenance as in progress (any authenticated user).
    
    Actions performed:
    - Sets status to "InProgress"
    """
    request = MaintenanceService.start_progress(
        db=db,
        request_id=request_id,
        actor=current_user
    )
    
    return request


@router.post(
    "/{request_id}/resolve",
    response_model=MaintenanceRequestResponse
)
def resolve_maintenance(
    request_id: int,
    resolution_data: ResolveMaintenanceRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Resolve maintenance request (any authenticated user).
    
    Request body:
    - **resolution_notes**: Optional resolution notes
    - **cost**: Optional maintenance cost
    
    Actions performed:
    - Sets status to "Resolved"
    - Records resolution time
    - Transitions asset back to "Available"
    - Creates notification for requester
    """
    request = MaintenanceService.resolve_maintenance(
        db=db,
        request_id=request_id,
        actor=current_user,
        resolution_notes=resolution_data.resolution_notes,
        cost=resolution_data.cost
    )
    
    return request

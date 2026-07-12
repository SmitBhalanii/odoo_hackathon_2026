"""Audit router - audit cycle and result endpoints."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.deps import get_db, get_current_user, require_role
from ..db import models
from ..schemas.audit import (
    AuditCycleCreate, AuditCycleResponse, AuditCycleWithDetails,
    AuditCycleListItem, AuditResultUpdate, AuditResultResponse,
    AuditResultWithAsset, AuditDiscrepancyItem
)
from ..services.audit_service import AuditService
from ..core.errors import NotFoundError

router = APIRouter(prefix="/audit-cycles")


# ============================================================================
# AUDIT CYCLE ENDPOINTS
# ============================================================================

@router.post(
    "",
    response_model=AuditCycleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["Admin"]))]
)
def create_audit_cycle(
    cycle_data: AuditCycleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin"]))
):
    """
    Create a new audit cycle (Admin only).
    
    Auto-populates AuditResult rows for all assets matching the scope.
    Each asset starts with result=None until an auditor marks it.
    
    Request body:
    - **title**: Audit cycle title (required)
    - **start_date**: Start date (required)
    - **end_date**: End date (required, must be after start_date)
    - **auditor_ids**: List of user IDs to assign as auditors (required)
    - **scope_department_id**: Optional department filter (null = all departments)
    - **scope_location**: Optional location filter (null = all locations)
    """
    cycle = AuditService.create_audit_cycle(
        db=db,
        title=cycle_data.title,
        start_date=cycle_data.start_date,
        end_date=cycle_data.end_date,
        auditor_ids=cycle_data.auditor_ids,
        actor=current_user,
        scope_department_id=cycle_data.scope_department_id,
        scope_location=cycle_data.scope_location
    )
    
    return cycle


@router.get("", response_model=List[AuditCycleListItem])
def list_audit_cycles(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List audit cycles with optional status filter.
    
    Query parameters:
    - **status**: Filter by status (Open/Closed)
    
    Returns list with summary statistics.
    """
    query = db.query(models.AuditCycle)
    
    # Apply status filter
    if status_filter:
        query = query.filter(models.AuditCycle.status == status_filter)
    
    # Order by creation date (newest first)
    cycles = query.order_by(models.AuditCycle.created_at.desc()).all()
    
    # Transform to list items with stats
    items = []
    for cycle in cycles:
        # Calculate statistics
        total_assets = len(cycle.results)
        verified_count = sum(1 for r in cycle.results if r.result == "Verified")
        missing_count = sum(1 for r in cycle.results if r.result == "Missing")
        damaged_count = sum(1 for r in cycle.results if r.result == "Damaged")
        
        item = {
            "id": cycle.id,
            "title": cycle.title,
            "start_date": cycle.start_date,
            "end_date": cycle.end_date,
            "status": cycle.status.value if hasattr(cycle.status, 'value') else cycle.status,
            "created_by": cycle.created_by,
            "creator_name": cycle.creator.name if cycle.creator else None,
            "auditor_count": len(cycle.assignments),
            "total_assets": total_assets,
            "verified_count": verified_count,
            "missing_count": missing_count,
            "damaged_count": damaged_count
        }
        items.append(item)
    
    return items


@router.get("/{cycle_id}", response_model=AuditCycleWithDetails)
def get_audit_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get audit cycle details by ID.
    
    Returns full cycle information with:
    - Nested auditor list
    - All audit results with asset details
    - Summary statistics
    """
    cycle = db.query(models.AuditCycle).filter(
        models.AuditCycle.id == cycle_id
    ).first()
    
    if not cycle:
        raise NotFoundError(f"Audit cycle with ID {cycle_id} not found")
    
    # Build response with nested data
    response = AuditCycleWithDetails.model_validate(cycle)
    
    # Add creator
    if cycle.creator:
        response.creator = {
            "id": cycle.creator.id,
            "name": cycle.creator.name,
            "email": cycle.creator.email
        }
    
    # Add scope department
    if cycle.scope_department:
        response.scope_department = {
            "id": cycle.scope_department.id,
            "name": cycle.scope_department.name
        }
    
    # Add auditors
    response.auditors = [
        {
            "id": assignment.auditor.id,
            "name": assignment.auditor.name,
            "email": assignment.auditor.email
        }
        for assignment in cycle.assignments
    ]
    
    # Add results with asset details
    response.results = [
        {
            "id": result.id,
            "asset_id": result.asset_id,
            "asset_tag": result.asset.tag if result.asset else None,
            "asset_name": result.asset.name if result.asset else None,
            "expected_location": result.expected_location,
            "result": result.result.value if hasattr(result.result, 'value') and result.result else None,
            "notes": result.notes,
            "marked_by": result.marked_by,
            "marker_name": result.marker.name if result.marker else None,
            "marked_at": result.marked_at
        }
        for result in cycle.results
    ]
    
    # Add statistics
    total_assets = len(cycle.results)
    verified_count = sum(1 for r in cycle.results if r.result == "Verified")
    missing_count = sum(1 for r in cycle.results if r.result == "Missing")
    damaged_count = sum(1 for r in cycle.results if r.result == "Damaged")
    pending_count = total_assets - verified_count - missing_count - damaged_count
    
    response.stats = {
        "total_assets": total_assets,
        "verified": verified_count,
        "missing": missing_count,
        "damaged": damaged_count,
        "pending": pending_count,
        "completion_percentage": round((verified_count + missing_count + damaged_count) / total_assets * 100, 2) if total_assets > 0 else 0
    }
    
    return response


@router.post(
    "/{cycle_id}/close",
    response_model=AuditCycleResponse,
    dependencies=[Depends(require_role(["Admin", "Asset Manager"]))]
)
def close_audit_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin", "Asset Manager"]))
):
    """
    Close an audit cycle (Admin or Asset Manager only).
    
    Actions performed:
    - Sets cycle status to "Closed"
    - Transitions all "Missing" assets to "Lost" status
    - Creates notifications for discrepancies
    """
    cycle = AuditService.close_audit_cycle(
        db=db,
        cycle_id=cycle_id,
        actor=current_user
    )
    
    return cycle


# ============================================================================
# AUDIT RESULT ENDPOINTS
# ============================================================================

@router.patch("/results/{result_id}", response_model=AuditResultResponse)
def mark_audit_result(
    result_id: int,
    result_data: AuditResultUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark audit result for an asset (auditor assigned to cycle only).
    
    Request body:
    - **result**: Result status (Verified/Missing/Damaged, required)
    - **notes**: Optional notes
    
    Only auditors assigned to the cycle can mark results.
    Cannot mark results for closed cycles.
    """
    result = AuditService.mark_result(
        db=db,
        result_id=result_id,
        result=result_data.result,
        notes=result_data.notes,
        actor=current_user
    )
    
    return result


@router.get("/{cycle_id}/discrepancies", response_model=List[AuditDiscrepancyItem])
def get_audit_discrepancies(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get discrepancies for an audit cycle.
    
    Returns all assets marked as non-Verified (Missing or Damaged).
    Useful for reviewing issues before closing the cycle.
    """
    # Verify cycle exists
    cycle = db.query(models.AuditCycle).filter(
        models.AuditCycle.id == cycle_id
    ).first()
    
    if not cycle:
        raise NotFoundError(f"Audit cycle with ID {cycle_id} not found")
    
    discrepancies = AuditService.get_discrepancies(db, cycle_id)
    
    # Transform to response format
    items = []
    for result in discrepancies:
        item = {
            "id": result.id,
            "asset_id": result.asset_id,
            "asset_tag": result.asset.tag if result.asset else None,
            "asset_name": result.asset.name if result.asset else None,
            "expected_location": result.expected_location,
            "result": result.result.value if hasattr(result.result, 'value') else result.result,
            "notes": result.notes,
            "marked_by": result.marked_by,
            "marker_name": result.marker.name if result.marker else None,
            "marked_at": result.marked_at
        }
        items.append(item)
    
    return items
    - **scope_department_id**: Optional department filter (null = all departments)
    - **scope_location**: Optional location filter (null = all locations)
    """
    cycle = AuditService.create_audit_cycle(
        db=db,
        title=cycle_data.title,
        start_date=cycle_data.start_date,
        end_date=cycle_data.end_date,
        auditor_ids=cycle_data.auditor_ids,
        actor=current_user,
        scope_department_id=cycle_data.scope_department_id,
        scope_location=cycle_data.scope_location
    )
    
    return cycle


@router.get("", response_model=List[AuditCycleListItem])
def list_audit_cycles(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List audit cycles with optional status filter.
    
    Query parameters:
    - **status**: Filter by status (Open/Closed)
    
    Returns list with summary statistics.
    """
    query = db.query(models.AuditCycle)
    
    # Apply status filter
    if status_filter:
        query = query.filter(models.AuditCycle.status == status_filter)
    
    # Order by creation date (newest first)
    cycles = query.order_by(models.AuditCycle.created_at.desc()).all()
    
    # Transform to list items with stats
    items = []
    for cycle in cycles:
        # Calculate statistics
        total_assets = len(cycle.results)
        verified_count = sum(1 for r in cycle.results if r.result == "Verified")
        missing_count = sum(1 for r in cycle.results if r.result == "Missing")
        damaged_count = sum(1 for r in cycle.results if r.result == "Damaged")
        
        item = {
            "id": cycle.id,
            "title": cycle.title,
            "start_date": cycle.start_date,
            "end_date": cycle.end_date,
            "status": cycle.status.value if hasattr(cycle.status, 'value') else cycle.status,
            "created_by": cycle.created_by,
            "creator_name": cycle.creator.name if cycle.creator else None,
            "auditor_count": len(cycle.assignments),
            "total_assets": total_assets,
            "verified_count": verified_count,
            "missing_count": missing_count,
            "damaged_count": damaged_count
        }
        items.append(item)
    
    return items


@router.get("/{cycle_id}", response_model=AuditCycleWithDetails)
def get_audit_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get audit cycle details by ID.
    
    Returns full cycle information with:
    - Nested auditor list
    - All audit results with asset details
    - Summary statistics
    """
    cycle = db.query(models.AuditCycle).filter(
        models.AuditCycle.id == cycle_id
    ).first()
    
    if not cycle:
        raise NotFoundError(f"Audit cycle with ID {cycle_id} not found")
    
    # Build response with nested data
    response = AuditCycleWithDetails.model_validate(cycle)
    
    # Add creator
    if cycle.creator:
        response.creator = {
            "id": cycle.creator.id,
            "name": cycle.creator.name,
            "email": cycle.creator.email
        }
    
    # Add scope department
    if cycle.scope_department:
        response.scope_department = {
            "id": cycle.scope_department.id,
            "name": cycle.scope_department.name
        }
    
    # Add auditors
    response.auditors = [
        {
            "id": assignment.auditor.id,
            "name": assignment.auditor.name,
            "email": assignment.auditor.email
        }
        for assignment in cycle.assignments
    ]
    
    # Add results with asset details
    response.results = [
        {
            "id": result.id,
            "asset_id": result.asset_id,
            "asset_tag": result.asset.tag if result.asset else None,
            "asset_name": result.asset.name if result.asset else None,
            "expected_location": result.expected_location,
            "result": result.result.value if hasattr(result.result, 'value') and result.result else None,
            "notes": result.notes,
            "marked_by": result.marked_by,
            "marker_name": result.marker.name if result.marker else None,
            "marked_at": result.marked_at
        }
        for result in cycle.results
    ]
    
    # Add statistics
    total_assets = len(cycle.results)
    verified_count = sum(1 for r in cycle.results if r.result == "Verified")
    missing_count = sum(1 for r in cycle.results if r.result == "Missing")
    damaged_count = sum(1 for r in cycle.results if r.result == "Damaged")
    pending_count = total_assets - verified_count - missing_count - damaged_count
    
    response.stats = {
        "total_assets": total_assets,
        "verified": verified_count,
        "missing": missing_count,
        "damaged": damaged_count,
        "pending": pending_count,
        "completion_percentage": round((verified_count + missing_count + damaged_count) / total_assets * 100, 2) if total_assets > 0 else 0
    }
    
    return response


@router.post(
    "/{cycle_id}/close",
    response_model=AuditCycleResponse,
    dependencies=[Depends(require_role(["Admin", "Asset Manager"]))]
)
def close_audit_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin", "Asset Manager"]))
):
    """
    Close an audit cycle (Admin or Asset Manager only).
    
    Actions performed:
    - Sets cycle status to "Closed"
    - Transitions all "Missing" assets to "Lost" status
    - Creates notifications for discrepancies
    """
    cycle = AuditService.close_audit_cycle(
        db=db,
        cycle_id=cycle_id,
        actor=current_user
    )
    
    return cycle


# ============================================================================
# AUDIT RESULT ENDPOINTS
# ============================================================================

@router.patch("/results/{result_id}", response_model=AuditResultResponse)
def mark_audit_result(
    result_id: int,
    result_data: AuditResultUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark audit result for an asset (auditor assigned to cycle only).
    
    Request body:
    - **result**: Result status (Verified/Missing/Damaged, required)
    - **notes**: Optional notes
    
    Only auditors assigned to the cycle can mark results.
    Cannot mark results for closed cycles.
    """
    result = AuditService.mark_result(
        db=db,
        result_id=result_id,
        result=result_data.result,
        notes=result_data.notes,
        actor=current_user
    )
    
    return result


@router.get("/{cycle_id}/discrepancies", response_model=List[AuditDiscrepancyItem])
def get_audit_discrepancies(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get discrepancies for an audit cycle.
    
    Returns all assets marked as non-Verified (Missing or Damaged).
    Useful for reviewing issues before closing the cycle.
    """
    # Verify cycle exists
    cycle = db.query(models.AuditCycle).filter(
        models.AuditCycle.id == cycle_id
    ).first()
    
    if not cycle:
        raise NotFoundError(f"Audit cycle with ID {cycle_id} not found")
    
    discrepancies = AuditService.get_discrepancies(db, cycle_id)
    
    # Transform to response format
    items = []
    for result in discrepancies:
        item = {
            "id": result.id,
            "asset_id": result.asset_id,
            "asset_tag": result.asset.tag if result.asset else None,
            "asset_name": result.asset.name if result.asset else None,
            "expected_location": result.expected_location,
            "result": result.result.value if hasattr(result.result, 'value') else result.result,
            "notes": result.notes,
            "marked_by": result.marked_by,
            "marker_name": result.marker.name if result.marker else None,
            "marked_at": result.marked_at
        }
        items.append(item)
    
    return items

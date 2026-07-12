"""Audit router - audit cycle and result endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..core.deps import get_db, get_current_user, require_role
from ..core.errors import NotFoundError
from ..db import models
from ..schemas.audit import (
    AuditCycleCreate,
    AuditCycleResponse,
    AuditCycleWithDetails,
    AuditCycleListItem,
    AuditResultUpdate,
    AuditResultResponse,
    AuditDiscrepancyItem,
)
from ..services.audit_service import AuditService


router = APIRouter(prefix="/audit-cycles")


# ============================================================================
# AUDIT CYCLE ENDPOINTS
# ============================================================================


@router.post(
    "",
    response_model=AuditCycleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_audit_cycle(
    cycle_data: AuditCycleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["Admin"])),
):
    """
    Create a new audit cycle (Admin only).

    Auto-populates AuditResult rows for all assets matching the scope.
    Each asset starts with result=None until an auditor marks it.

    Request body:
    - title: Audit cycle title (required)
    - start_date: Start date (required)
    - end_date: End date (required, must be after start_date)
    - auditor_ids: List of user IDs to assign as auditors (required)
    - scope_department_id: Optional department filter
    - scope_location: Optional location filter
    """

    cycle = AuditService.create_audit_cycle(
        db=db,
        title=cycle_data.title,
        start_date=cycle_data.start_date,
        end_date=cycle_data.end_date,
        auditor_ids=cycle_data.auditor_ids,
        actor=current_user,
        scope_department_id=cycle_data.scope_department_id,
        scope_location=cycle_data.scope_location,
    )

    return cycle


@router.get(
    "",
    response_model=List[AuditCycleListItem],
)
def list_audit_cycles(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    List audit cycles with an optional status filter.

    Query parameters:
    - status: Filter by status, such as Open or Closed.

    Returns audit cycles with summary statistics.
    """

    query = db.query(models.AuditCycle)

    # Apply optional status filter.
    if status_filter:
        query = query.filter(
            models.AuditCycle.status == status_filter
        )

    # Newest audit cycles first.
    cycles = query.order_by(
        models.AuditCycle.created_at.desc()
    ).all()

    items = []

    for cycle in cycles:
        total_assets = len(cycle.results)

        verified_count = sum(
            1
            for result in cycle.results
            if (
                result.result.value
                if hasattr(result.result, "value") and result.result
                else result.result
            )
            == "Verified"
        )

        missing_count = sum(
            1
            for result in cycle.results
            if (
                result.result.value
                if hasattr(result.result, "value") and result.result
                else result.result
            )
            == "Missing"
        )

        damaged_count = sum(
            1
            for result in cycle.results
            if (
                result.result.value
                if hasattr(result.result, "value") and result.result
                else result.result
            )
            == "Damaged"
        )

        item = {
            "id": cycle.id,
            "title": cycle.title,
            "start_date": cycle.start_date,
            "end_date": cycle.end_date,
            "status": (
                cycle.status.value
                if hasattr(cycle.status, "value")
                else cycle.status
            ),
            "created_by": cycle.created_by,
            "creator_name": (
                cycle.creator.name
                if cycle.creator
                else None
            ),
            "auditor_count": len(cycle.assignments),
            "total_assets": total_assets,
            "verified_count": verified_count,
            "missing_count": missing_count,
            "damaged_count": damaged_count,
        }

        items.append(item)

    return items


@router.get(
    "/{cycle_id}",
    response_model=AuditCycleWithDetails,
)
def get_audit_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Get an audit cycle by ID.

    Returns:
    - Complete audit cycle information
    - Creator information
    - Scope department
    - Assigned auditors
    - Audit results with asset details
    - Summary statistics
    """

    cycle = (
        db.query(models.AuditCycle)
        .filter(models.AuditCycle.id == cycle_id)
        .first()
    )

    if not cycle:
        raise NotFoundError(
            f"Audit cycle with ID {cycle_id} not found"
        )

    # Build the base Pydantic response.
    response = AuditCycleWithDetails.model_validate(cycle)

    # Add creator information.
    if cycle.creator:
        response.creator = {
            "id": cycle.creator.id,
            "name": cycle.creator.name,
            "email": cycle.creator.email,
        }

    # Add department scope information.
    if cycle.scope_department:
        response.scope_department = {
            "id": cycle.scope_department.id,
            "name": cycle.scope_department.name,
        }

    # Add assigned auditors.
    response.auditors = [
        {
            "id": assignment.auditor.id,
            "name": assignment.auditor.name,
            "email": assignment.auditor.email,
        }
        for assignment in cycle.assignments
        if assignment.auditor
    ]

    # Add audit results with related asset information.
    response.results = [
        {
            "id": result.id,
            "asset_id": result.asset_id,
            "asset_tag": (
                result.asset.tag
                if result.asset
                else None
            ),
            "asset_name": (
                result.asset.name
                if result.asset
                else None
            ),
            "expected_location": result.expected_location,
            "result": (
                result.result.value
                if hasattr(result.result, "value") and result.result
                else result.result
            ),
            "notes": result.notes,
            "marked_by": result.marked_by,
            "marker_name": (
                result.marker.name
                if result.marker
                else None
            ),
            "marked_at": result.marked_at,
        }
        for result in cycle.results
    ]

    # Calculate audit statistics.
    total_assets = len(cycle.results)

    verified_count = sum(
        1
        for result in cycle.results
        if (
            result.result.value
            if hasattr(result.result, "value") and result.result
            else result.result
        )
        == "Verified"
    )

    missing_count = sum(
        1
        for result in cycle.results
        if (
            result.result.value
            if hasattr(result.result, "value") and result.result
            else result.result
        )
        == "Missing"
    )

    damaged_count = sum(
        1
        for result in cycle.results
        if (
            result.result.value
            if hasattr(result.result, "value") and result.result
            else result.result
        )
        == "Damaged"
    )

    completed_count = (
        verified_count
        + missing_count
        + damaged_count
    )

    pending_count = total_assets - completed_count

    completion_percentage = (
        round(
            completed_count / total_assets * 100,
            2,
        )
        if total_assets > 0
        else 0
    )

    response.stats = {
        "total_assets": total_assets,
        "verified": verified_count,
        "missing": missing_count,
        "damaged": damaged_count,
        "pending": pending_count,
        "completion_percentage": completion_percentage,
    }

    return response


@router.post(
    "/{cycle_id}/close",
    response_model=AuditCycleResponse,
)
def close_audit_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        require_role(["Admin", "Asset Manager"])
    ),
):
    """
    Close an audit cycle.

    Allowed roles:
    - Admin
    - Asset Manager

    Actions performed:
    - Sets the audit cycle status to Closed.
    - Transitions confirmed Missing assets to Lost.
    - Creates notifications for discrepancies.

    AuditService is responsible for enforcing the business rules.
    """

    cycle = AuditService.close_audit_cycle(
        db=db,
        cycle_id=cycle_id,
        actor=current_user,
    )

    return cycle


# ============================================================================
# AUDIT RESULT ENDPOINTS
# ============================================================================


@router.patch(
    "/results/{result_id}",
    response_model=AuditResultResponse,
)
def mark_audit_result(
    result_id: int,
    result_data: AuditResultUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Mark the audit result for an individual asset.

    Request body:
    - result: Verified, Missing, or Damaged
    - notes: Optional auditor notes

    Business rules:
    - Only an auditor assigned to the audit cycle may mark results.
    - Results cannot be changed after the audit cycle is closed.

    AuditService is responsible for enforcing these rules.
    """

    result = AuditService.mark_result(
        db=db,
        result_id=result_id,
        result=result_data.result,
        notes=result_data.notes,
        actor=current_user,
    )

    return result


@router.get(
    "/{cycle_id}/discrepancies",
    response_model=List[AuditDiscrepancyItem],
)
def get_audit_discrepancies(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Get all discrepancies for an audit cycle.

    A discrepancy is an asset marked as:
    - Missing
    - Damaged

    Verified assets are not included.
    """

    # Verify that the audit cycle exists.
    cycle = (
        db.query(models.AuditCycle)
        .filter(models.AuditCycle.id == cycle_id)
        .first()
    )

    if not cycle:
        raise NotFoundError(
            f"Audit cycle with ID {cycle_id} not found"
        )

    discrepancies = AuditService.get_discrepancies(
        db=db,
        cycle_id=cycle_id,
    )

    items = []

    for result in discrepancies:
        item = {
            "id": result.id,
            "asset_id": result.asset_id,
            "asset_tag": (
                result.asset.tag
                if result.asset
                else None
            ),
            "asset_name": (
                result.asset.name
                if result.asset
                else None
            ),
            "expected_location": result.expected_location,
            "result": (
                result.result.value
                if hasattr(result.result, "value")
                else result.result
            ),
            "notes": result.notes,
            "marked_by": result.marked_by,
            "marker_name": (
                result.marker.name
                if result.marker
                else None
            ),
            "marked_at": result.marked_at,
        }

        items.append(item)

    return items
"""Audit service - handles audit cycle workflows."""

from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from ..db import models
from ..core.errors import NotFoundError, ConflictError, ValidationError, PermissionError as AppPermissionError
from .asset_service import AssetService
from .notification_service import NotificationService, ActivityLogService


class AuditService:
    """Service for audit cycle operations and workflows."""
    
    @staticmethod
    def create_audit_cycle(
        db: Session,
        title: str,
        start_date,
        end_date,
        auditor_ids: List[int],
        actor: models.User,
        scope_department_id: Optional[int] = None,
        scope_location: Optional[str] = None
    ) -> models.AuditCycle:
        """
        Create a new audit cycle.
        
        Auto-populates AuditResult rows for all assets matching the scope.
        Each result starts with result=None until an auditor marks it.
        
        Args:
            db: Database session
            title: Audit cycle title
            start_date: Start date
            end_date: End date
            auditor_ids: List of user IDs to assign as auditors
            actor: User creating the cycle
            scope_department_id: Optional department filter
            scope_location: Optional location filter
            
        Returns:
            Created audit cycle
            
        Raises:
            NotFoundError: If auditor or scope department doesn't exist
            ValidationError: If end_date is before start_date
        """
        # Validate dates
        if end_date < start_date:
            raise ValidationError("end_date must be after start_date")
        
        # Validate scope department if provided
        if scope_department_id:
            department = db.query(models.Department).filter(
                models.Department.id == scope_department_id
            ).first()
            if not department:
                raise NotFoundError(f"Department with ID {scope_department_id} not found")
        
        # Validate auditors exist
        for auditor_id in auditor_ids:
            auditor = db.query(models.User).filter(models.User.id == auditor_id).first()
            if not auditor:
                raise NotFoundError(f"User with ID {auditor_id} not found")
        
        # Create audit cycle
        cycle = models.AuditCycle(
            title=title,
            scope_department_id=scope_department_id,
            scope_location=scope_location,
            start_date=start_date,
            end_date=end_date,
            status="Open",
            created_by=actor.id
        )
        
        db.add(cycle)
        db.flush()  # Get cycle.id for assignments and results
        
        # Create audit assignments
        for auditor_id in auditor_ids:
            assignment = models.AuditAssignment(
                audit_cycle_id=cycle.id,
                auditor_id=auditor_id
            )
            db.add(assignment)
        
        # Auto-populate AuditResult rows for assets in scope
        matching_assets = AuditService._get_assets_in_scope(
            db, scope_department_id, scope_location
        )
        
        for asset in matching_assets:
            result = models.AuditResult(
                audit_cycle_id=cycle.id,
                asset_id=asset.id,
                expected_location=asset.location.name if asset.location else None,
                result=None  # Null until auditor marks it
            )
            db.add(result)
        
        db.commit()
        db.refresh(cycle)
        
        print(f"\n{'='*60}")
        print(f"AUDIT CYCLE CREATED")
        print(f"{'='*60}")
        print(f"Cycle ID: {cycle.id}")
        print(f"Title: {title}")
        print(f"Scope: Dept={scope_department_id or 'All'}, Location={scope_location or 'All'}")
        print(f"Assets in scope: {len(matching_assets)}")
        print(f"Auditors assigned: {len(auditor_ids)}")
        print(f"Period: {start_date} to {end_date}")
        print(f"Created by: {actor.name}")
        print(f"{'='*60}\n")
        
        return cycle
    
    @staticmethod
    def _get_assets_in_scope(
        db: Session,
        scope_department_id: Optional[int],
        scope_location: Optional[str]
    ) -> List[models.Asset]:
        """
        Get assets matching the audit scope.
        
        Args:
            db: Database session
            scope_department_id: Optional department filter
            scope_location: Optional location filter
            
        Returns:
            List of assets in scope
        """
        query = db.query(models.Asset)
        
        # Apply department filter
        if scope_department_id:
            query = query.filter(models.Asset.department_id == scope_department_id)
        
        # Apply location filter
        if scope_location:
            # Match by location name
            query = query.join(models.Location).filter(
                models.Location.name == scope_location
            )
        
        return query.all()
    
    @staticmethod
    def mark_result(
        db: Session,
        result_id: int,
        result: str,
        notes: Optional[str],
        actor: models.User
    ) -> models.AuditResult:
        """
        Mark audit result for an asset.
        
        Only auditors assigned to the cycle can mark results.
        
        Args:
            db: Database session
            result_id: Audit result ID
            result: Result status (Verified/Missing/Damaged)
            notes: Optional notes
            actor: User marking the result
            
        Returns:
            Updated audit result
            
        Raises:
            NotFoundError: If result doesn't exist
            PermissionError: If actor is not an assigned auditor
            ConflictError: If audit cycle is closed
        """
        audit_result = db.query(models.AuditResult).filter(
            models.AuditResult.id == result_id
        ).first()
        
        if not audit_result:
            raise NotFoundError(f"Audit result with ID {result_id} not found")
        
        # Check if cycle is open
        cycle = audit_result.audit_cycle
        if cycle.status != "Open":
            raise ConflictError(
                f"Cannot mark result for closed audit cycle (Cycle ID: {cycle.id})"
            )
        
        # Check if actor is an assigned auditor
        is_auditor = db.query(models.AuditAssignment).filter(
            models.AuditAssignment.audit_cycle_id == cycle.id,
            models.AuditAssignment.auditor_id == actor.id
        ).first()
        
        if not is_auditor:
            raise AppPermissionError(
                f"Only auditors assigned to this cycle can mark results"
            )
        
        # Update result
        audit_result.result = result
        audit_result.notes = notes
        audit_result.marked_by = actor.id
        audit_result.marked_at = datetime.utcnow()
        
        db.commit()
        db.refresh(audit_result)
        
        print(f"\n{'='*60}")
        print(f"AUDIT RESULT MARKED")
        print(f"{'='*60}")
        print(f"Cycle: {cycle.title}")
        print(f"Asset: {audit_result.asset.tag} - {audit_result.asset.name}")
        print(f"Result: {result}")
        if notes:
            print(f"Notes: {notes}")
        print(f"Marked by: {actor.name}")
        print(f"{'='*60}\n")
        
        return audit_result
    
    @staticmethod
    def get_discrepancies(
        db: Session,
        audit_cycle_id: int
    ) -> List[models.AuditResult]:
        """
        Get discrepancies for an audit cycle.
        
        Returns all audit results that have been marked as non-Verified
        (Missing or Damaged).
        
        Args:
            db: Database session
            audit_cycle_id: Audit cycle ID
            
        Returns:
            List of audit results with discrepancies
        """
        return db.query(models.AuditResult).filter(
            models.AuditResult.audit_cycle_id == audit_cycle_id,
            models.AuditResult.result.isnot(None),
            models.AuditResult.result != "Verified"
        ).all()
    
    @staticmethod
    def close_audit_cycle(
        db: Session,
        cycle_id: int,
        actor: models.User
    ) -> models.AuditCycle:
        """
        Close an audit cycle.
        
        - Sets cycle status to "Closed"
        - Transitions Missing assets to "Lost" status
        - Creates notifications for discrepancies
        
        Args:
            db: Database session
            cycle_id: Audit cycle ID
            actor: User closing the cycle
            
        Returns:
            Updated audit cycle
            
        Raises:
            NotFoundError: If cycle doesn't exist
            ConflictError: If cycle is already closed
        """
        cycle = db.query(models.AuditCycle).filter(
            models.AuditCycle.id == cycle_id
        ).first()
        
        if not cycle:
            raise NotFoundError(f"Audit cycle with ID {cycle_id} not found")
        
        if cycle.status == "Closed":
            raise ConflictError(f"Audit cycle is already closed")
        
        # Close the cycle
        cycle.status = "Closed"
        
        # Get discrepancies
        discrepancies = AuditService.get_discrepancies(db, cycle_id)
        
        missing_count = 0
        damaged_count = 0
        
        for result in discrepancies:
            if result.result == "Missing":
                # Transition asset to Lost status
                AssetService.transition_asset_status(
                    db=db,
                    asset=result.asset,
                    new_status="Lost",
                    actor=actor,
                    notes=f"Marked as Missing in audit cycle: {cycle.title}"
                )
                missing_count += 1
                
                # Create notification for asset owner or department head
                if result.asset.department_id:
                    # Notify department head if exists
                    dept = result.asset.department
                    if dept and dept.head_user_id:
                        NotificationService.create_notification(
                            db=db,
                            user_id=dept.head_user_id,
                            type="audit_discrepancy",
                            title="Asset Missing in Audit",
                            message=f"Asset {result.asset.tag} was marked as Missing in audit '{cycle.title}'.",
                            resource_type="audit_cycle",
                            resource_id=cycle.id
                        )
            
            elif result.result == "Damaged":
                damaged_count += 1
                # Damaged assets remain in current status but flagged
                # Could create maintenance request here if desired
        
        db.commit()
        db.refresh(cycle)
        
        print(f"\n{'='*60}")
        print(f"AUDIT CYCLE CLOSED")
        print(f"{'='*60}")
        print(f"Cycle ID: {cycle.id}")
        print(f"Title: {cycle.title}")
        print(f"Total discrepancies: {len(discrepancies)}")
        print(f"Missing (transitioned to Lost): {missing_count}")
        print(f"Damaged: {damaged_count}")
        print(f"Closed by: {actor.name}")
        print(f"{'='*60}\n")
        
        return cycle

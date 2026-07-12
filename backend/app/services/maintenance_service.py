"""Maintenance service - handles maintenance request workflows."""

from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

from ..db import models
from ..core.errors import NotFoundError, ConflictError, ValidationError, PermissionError as AppPermissionError
from .asset_service import AssetService


class MaintenanceService:
    """Service for maintenance request operations and workflows."""
    
    @staticmethod
    def create_maintenance_request(
        db: Session,
        asset_id: int,
        raised_by: int,
        issue_description: str,
        priority: str,
        photo_url: Optional[str] = None
    ) -> models.MaintenanceRequest:
        """
        Create a new maintenance request.
        
        Args:
            db: Database session
            asset_id: Asset ID
            raised_by: User ID who raised the request
            issue_description: Description of the issue
            priority: Priority level
            photo_url: Optional photo URL
            
        Returns:
            Created maintenance request
            
        Raises:
            NotFoundError: If asset or user doesn't exist
        """
        # Validate asset exists
        asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
        if not asset:
            raise NotFoundError(f"Asset with ID {asset_id} not found")
        
        # Validate user exists
        user = db.query(models.User).filter(models.User.id == raised_by).first()
        if not user:
            raise NotFoundError(f"User with ID {raised_by} not found")
        
        # Create request
        request = models.MaintenanceRequest(
            asset_id=asset_id,
            raised_by=raised_by,
            issue_description=issue_description,
            priority=priority,
            photo_url=photo_url,
            status="Pending"
        )
        
        db.add(request)
        db.commit()
        db.refresh(request)
        
        print(f"\n{'='*60}")
        print(f"MAINTENANCE REQUEST CREATED")
        print(f"{'='*60}")
        print(f"Request ID: {request.id}")
        print(f"Asset: {asset.tag} - {asset.name}")
        print(f"Raised by: {user.name}")
        print(f"Priority: {priority}")
        print(f"Status: Pending")
        print(f"{'='*60}\n")
        
        return request
    
    @staticmethod
    def approve_maintenance(
        db: Session,
        request_id: int,
        actor: models.User
    ) -> models.MaintenanceRequest:
        """
        Approve maintenance request.
        
        - Sets status to Approved
        - Records approver
        - Transitions asset to "Under Maintenance"
        - Creates notification for requester
        
        Args:
            db: Database session
            request_id: Maintenance request ID
            actor: User approving the request (must be Asset Manager or Admin)
            
        Returns:
            Updated maintenance request
            
        Raises:
            NotFoundError: If request doesn't exist
            ConflictError: If request not in Pending status
        """
        request = db.query(models.MaintenanceRequest).filter(
            models.MaintenanceRequest.id == request_id
        ).first()
        
        if not request:
            raise NotFoundError(f"Maintenance request with ID {request_id} not found")
        
        if request.status != "Pending":
            raise ConflictError(
                f"Cannot approve request in status '{request.status}'. Must be 'Pending'."
            )
        
        # Update request
        request.status = "Approved"
        request.approved_by = actor.id
        
        # Transition asset to "Under Maintenance"
        AssetService.transition_asset_status(
            db=db,
            asset=request.asset,
            new_status="Under Maintenance",
            actor=actor,
            notes=f"Maintenance request #{request.id}: {request.issue_description[:50]}"
        )
        
        # Create notification for requester
        notification = models.Notification(
            user_id=request.raised_by,
            type="maintenance_approved",
            title="Maintenance Request Approved",
            message=f"Your maintenance request for {request.asset.tag} has been approved.",
            resource_type="maintenance_request",
            resource_id=request.id,
            read=False
        )
        db.add(notification)
        
        db.commit()
        db.refresh(request)
        
        print(f"\n{'='*60}")
        print(f"MAINTENANCE REQUEST APPROVED")
        print(f"{'='*60}")
        print(f"Request ID: {request.id}")
        print(f"Asset: {request.asset.tag}")
        print(f"Approved by: {actor.name}")
        print(f"Asset Status: Under Maintenance")
        print(f"{'='*60}\n")
        
        return request
    
    @staticmethod
    def reject_maintenance(
        db: Session,
        request_id: int,
        actor: models.User,
        rejection_reason: Optional[str] = None
    ) -> models.MaintenanceRequest:
        """
        Reject maintenance request.
        
        - Sets status to Rejected
        - Creates notification for requester
        - Asset status remains unchanged
        
        Args:
            db: Database session
            request_id: Maintenance request ID
            actor: User rejecting the request
            rejection_reason: Optional reason for rejection
            
        Returns:
            Updated maintenance request
        """
        request = db.query(models.MaintenanceRequest).filter(
            models.MaintenanceRequest.id == request_id
        ).first()
        
        if not request:
            raise NotFoundError(f"Maintenance request with ID {request_id} not found")
        
        if request.status != "Pending":
            raise ConflictError(
                f"Cannot reject request in status '{request.status}'. Must be 'Pending'."
            )
        
        # Update request
        request.status = "Rejected"
        if rejection_reason:
            request.maintenance_notes = rejection_reason
        
        # Create notification for requester
        message = f"Your maintenance request for {request.asset.tag} has been rejected."
        if rejection_reason:
            message += f" Reason: {rejection_reason}"
        
        notification = models.Notification(
            user_id=request.raised_by,
            type="maintenance_approved",  # Using same type for simplicity
            title="Maintenance Request Rejected",
            message=message,
            resource_type="maintenance_request",
            resource_id=request.id,
            read=False
        )
        db.add(notification)
        
        db.commit()
        db.refresh(request)
        
        print(f"\n{'='*60}")
        print(f"MAINTENANCE REQUEST REJECTED")
        print(f"{'='*60}")
        print(f"Request ID: {request.id}")
        print(f"Asset: {request.asset.tag}")
        print(f"Rejected by: {actor.name}")
        if rejection_reason:
            print(f"Reason: {rejection_reason}")
        print(f"{'='*60}\n")
        
        return request
    
    @staticmethod
    def assign_technician(
        db: Session,
        request_id: int,
        technician_name: str,
        actor: models.User
    ) -> models.MaintenanceRequest:
        """
        Assign technician to maintenance request.
        
        Args:
            db: Database session
            request_id: Maintenance request ID
            technician_name: Name of technician
            actor: User assigning the technician
            
        Returns:
            Updated maintenance request
        """
        request = db.query(models.MaintenanceRequest).filter(
            models.MaintenanceRequest.id == request_id
        ).first()
        
        if not request:
            raise NotFoundError(f"Maintenance request with ID {request_id} not found")
        
        if request.status not in ["Approved", "TechnicianAssigned"]:
            raise ConflictError(
                f"Cannot assign technician to request in status '{request.status}'. "
                f"Must be 'Approved' or 'TechnicianAssigned'."
            )
        
        # Update request
        request.status = "TechnicianAssigned"
        request.technician_name = technician_name
        
        db.commit()
        db.refresh(request)
        
        print(f"\n{'='*60}")
        print(f"TECHNICIAN ASSIGNED")
        print(f"{'='*60}")
        print(f"Request ID: {request.id}")
        print(f"Asset: {request.asset.tag}")
        print(f"Technician: {technician_name}")
        print(f"Assigned by: {actor.name}")
        print(f"{'='*60}\n")
        
        return request
    
    @staticmethod
    def start_progress(
        db: Session,
        request_id: int,
        actor: models.User
    ) -> models.MaintenanceRequest:
        """
        Mark maintenance as in progress.
        
        Args:
            db: Database session
            request_id: Maintenance request ID
            actor: User starting the work
            
        Returns:
            Updated maintenance request
        """
        request = db.query(models.MaintenanceRequest).filter(
            models.MaintenanceRequest.id == request_id
        ).first()
        
        if not request:
            raise NotFoundError(f"Maintenance request with ID {request_id} not found")
        
        if request.status not in ["Approved", "TechnicianAssigned"]:
            raise ConflictError(
                f"Cannot start work on request in status '{request.status}'."
            )
        
        # Update status
        request.status = "InProgress"
        
        db.commit()
        db.refresh(request)
        
        print(f"\n{'='*60}")
        print(f"MAINTENANCE IN PROGRESS")
        print(f"{'='*60}")
        print(f"Request ID: {request.id}")
        print(f"Asset: {request.asset.tag}")
        print(f"Started by: {actor.name}")
        print(f"{'='*60}\n")
        
        return request
    
    @staticmethod
    def resolve_maintenance(
        db: Session,
        request_id: int,
        actor: models.User,
        resolution_notes: Optional[str] = None,
        cost: Optional[float] = None
    ) -> models.MaintenanceRequest:
        """
        Resolve maintenance request.
        
        - Sets status to Resolved
        - Records resolution time
        - Transitions asset back to "Available"
        - Creates notification for requester
        
        Args:
            db: Database session
            request_id: Maintenance request ID
            actor: User resolving the request
            resolution_notes: Optional resolution notes
            cost: Optional maintenance cost
            
        Returns:
            Updated maintenance request
        """
        request = db.query(models.MaintenanceRequest).filter(
            models.MaintenanceRequest.id == request_id
        ).first()
        
        if not request:
            raise NotFoundError(f"Maintenance request with ID {request_id} not found")
        
        if request.status not in ["InProgress", "TechnicianAssigned"]:
            raise ConflictError(
                f"Cannot resolve request in status '{request.status}'. "
                f"Must be 'InProgress' or 'TechnicianAssigned'."
            )
        
        # Update request
        request.status = "Resolved"
        request.resolved_at = datetime.utcnow()
        if resolution_notes:
            request.resolution_notes = resolution_notes
        if cost is not None:
            request.cost = cost
        
        # Transition asset back to "Available"
        AssetService.transition_asset_status(
            db=db,
            asset=request.asset,
            new_status="Available",
            actor=actor,
            notes=f"Maintenance completed (Request #{request.id})"
        )
        
        # Create notification for requester
        notification = models.Notification(
            user_id=request.raised_by,
            type="maintenance_completed",
            title="Maintenance Completed",
            message=f"Maintenance for {request.asset.tag} has been completed.",
            resource_type="maintenance_request",
            resource_id=request.id,
            read=False
        )
        db.add(notification)
        
        db.commit()
        db.refresh(request)
        
        print(f"\n{'='*60}")
        print(f"MAINTENANCE RESOLVED")
        print(f"{'='*60}")
        print(f"Request ID: {request.id}")
        print(f"Asset: {request.asset.tag}")
        print(f"Resolved by: {actor.name}")
        print(f"Asset Status: Available")
        if cost:
            print(f"Cost: ${cost:.2f}")
        print(f"{'='*60}\n")
        
        return request

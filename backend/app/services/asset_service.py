"""
Asset service - handles asset business logic and state machine.

⚠️  CRITICAL: This module owns the asset status state machine.
ALL asset status changes MUST go through transition_asset_status().
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import date

from ..db import models
from ..core.errors import NotFoundError, ConflictError, ValidationError


# Asset tag configuration
ASSET_TAG_PREFIX = "AF"


# ============================================================================
# ASSET STATUS STATE MACHINE
# ============================================================================
# This is the SINGLE SOURCE OF TRUTH for valid asset status transitions.
# Do NOT modify without careful consideration of all dependent modules.
# ============================================================================

VALID_TRANSITIONS = {
    "Available": {
        "Allocated",           # When assigned to a user
        "Reserved",            # When booked for future use
        "Under Maintenance",   # When maintenance needed
        "Retired",            # When taken out of service
        "Lost"                # When asset goes missing
    },
    "Allocated": {
        "Available",          # When returned from user
        "Lost"                # When asset goes missing while allocated
    },
    "Reserved": {
        "Available",          # When booking cancelled or completed
        "Lost"                # When asset goes missing while reserved
    },
    "Under Maintenance": {
        "Available",          # When maintenance completed
        "Retired",            # When beyond repair
        "Lost"                # When asset goes missing during maintenance
    },
    "Lost": {
        "Available",          # When found
        "Retired"             # When given up as permanently lost
    },
    "Retired": {
        "Disposed"            # When physically disposed/scrapped
    },
    "Disposed": set()         # Terminal state - no transitions allowed
}


class AssetService:
    """Service for asset operations and state machine."""
    
    # ========================================================================
    # ASSET TAG GENERATION
    # ========================================================================
    
    @staticmethod
    def generate_asset_tag(db: Session) -> str:
        """
        Generate unique asset tag with format AF-XXXX.
        
        Finds the current maximum numeric suffix and increments it.
        Zero-pads to 4 digits (e.g., AF-0001, AF-0203).
        
        Args:
            db: Database session
            
        Returns:
            New unique asset tag (e.g., "AF-0203")
        """
        # Get all existing tags with the prefix
        max_tag = db.query(
            func.max(models.Asset.tag)
        ).filter(
            models.Asset.tag.like(f"{ASSET_TAG_PREFIX}-%")
        ).scalar()
        
        if max_tag:
            try:
                # Extract numeric part (e.g., "AF-0123" -> 123)
                current_num = int(max_tag.split("-")[1])
                next_num = current_num + 1
            except (IndexError, ValueError):
                # Fallback if tag format is unexpected
                next_num = 1
        else:
            # First asset
            next_num = 1
        
        # Format with zero-padding to 4 digits
        return f"{ASSET_TAG_PREFIX}-{next_num:04d}"
    
    # ========================================================================
    # STATE MACHINE - CRITICAL BUSINESS LOGIC
    # ========================================================================
    
    @staticmethod
    def transition_asset_status(
        db: Session,
        asset: models.Asset,
        new_status: str,
        actor: models.User,
        notes: Optional[str] = None
    ) -> models.Asset:
        """
        Transition asset to new status with validation.
        
        ⚠️  CRITICAL: This is the ONLY way to change asset status!
        
        Validates the transition is allowed by the state machine,
        updates the asset, and logs the activity for audit trail.
        
        Args:
            db: Database session
            asset: Asset to transition
            new_status: Target status
            actor: User performing the transition
            notes: Optional notes about the transition
            
        Returns:
            Updated asset
            
        Raises:
            ConflictError: If transition is not allowed
            
        Example:
            asset_service.transition_asset_status(
                db, asset, "Allocated", current_user, "Assigned to John"
            )
        """
        old_status = asset.status.value if hasattr(asset.status, 'value') else asset.status
        
        # Validate transition is allowed
        valid_targets = VALID_TRANSITIONS.get(old_status, set())
        
        if new_status not in valid_targets:
            raise ConflictError(
                f"Invalid status transition: Cannot move asset from "
                f"'{old_status}' to '{new_status}'. "
                f"Valid transitions from '{old_status}': {', '.join(valid_targets) if valid_targets else 'none (terminal state)'}"
            )
        
        # Perform transition
        asset.status = new_status
        db.commit()
        db.refresh(asset)
        
        # Log activity for audit trail
        ActivityLogService.log_activity(
            db=db,
            actor=actor,
            action="asset_status_change",
            entity_type="Asset",
            entity_id=asset.id,
            detail=f"Asset {asset.tag} status changed: {old_status} → {new_status}" + (f" | {notes}" if notes else "")
        )
        db.commit()
        
        print(f"\n{'='*60}")
        print(f"ASSET STATUS CHANGE")
        print(f"{'='*60}")
        print(f"Asset: {asset.tag} - {asset.name}")
        print(f"Transition: {old_status} → {new_status}")
        print(f"Actor: {actor.name} ({actor.email})")
        if notes:
            print(f"Notes: {notes}")
        print(f"{'='*60}\n")
        
        return asset
    
    @staticmethod
    def get_valid_transitions(current_status: str) -> List[str]:
        """
        Get list of valid target statuses from current status.
        
        Useful for UI to show allowed status changes.
        
        Args:
            current_status: Current asset status
            
        Returns:
            List of valid target statuses
        """
        return list(VALID_TRANSITIONS.get(current_status, set()))
    
    # ========================================================================
    # ASSET CRUD OPERATIONS
    # ========================================================================
    
    @staticmethod
    def create_asset(
        db: Session,
        name: str,
        category_id: int,
        acquisition_date: date,
        acquisition_cost: float,
        condition: str,
        location_id: Optional[int] = None,
        serial_number: Optional[str] = None,
        description: Optional[str] = None,
        photo_url: Optional[str] = None,
        is_bookable: bool = False,
        department_id: Optional[int] = None,
        extra_field_values: Optional[Dict[str, Any]] = None
    ) -> models.Asset:
        """
        Create a new asset with auto-generated tag.
        
        Asset tag is ALWAYS generated server-side, never from request.
        Initial status is always "Available".
        
        Args:
            db: Database session
            name: Asset name
            category_id: Asset category ID
            acquisition_date: Date acquired
            acquisition_cost: Purchase cost
            condition: Physical condition
            location_id: Optional location ID
            serial_number: Optional serial number
            description: Optional description
            photo_url: Optional photo URL
            is_bookable: Whether asset can be booked
            department_id: Optional department ID
            extra_field_values: Optional category-specific field values
            
        Returns:
            Created asset
            
        Raises:
            NotFoundError: If category or location doesn't exist
            ConflictError: If serial number already exists
        """
        # Validate category exists
        category = db.query(models.AssetCategory).filter(
            models.AssetCategory.id == category_id
        ).first()
        if not category:
            raise NotFoundError(f"Category with ID {category_id} not found")
        
        # Validate location if provided
        if location_id:
            location = db.query(models.Location).filter(
                models.Location.id == location_id
            ).first()
            if not location:
                raise NotFoundError(f"Location with ID {location_id} not found")
        
        # Validate department if provided
        if department_id:
            department = db.query(models.Department).filter(
                models.Department.id == department_id
            ).first()
            if not department:
                raise NotFoundError(f"Department with ID {department_id} not found")
        
        # Check for duplicate serial number
        if serial_number:
            existing = db.query(models.Asset).filter(
                models.Asset.serial_number == serial_number
            ).first()
            if existing:
                raise ConflictError(
                    f"Asset with serial number '{serial_number}' already exists (Tag: {existing.tag})"
                )
        
        # Generate unique asset tag
        asset_tag = AssetService.generate_asset_tag(db)
        
        # Create asset
        asset = models.Asset(
            tag=asset_tag,
            name=name,
            description=description,
            serial_number=serial_number,
            category_id=category_id,
            status="Available",  # Always starts as Available
            condition=condition,
            acquisition_date=acquisition_date,
            acquisition_cost=acquisition_cost,
            location_id=location_id,
            department_id=department_id,
            photo_url=photo_url,
            is_bookable=is_bookable,
            extra_field_values=extra_field_values or {}
        )
        
        db.add(asset)
        db.commit()
        db.refresh(asset)
        
        print(f"\n{'='*60}")
        print(f"NEW ASSET REGISTERED")
        print(f"{'='*60}")
        print(f"Tag: {asset.tag}")
        print(f"Name: {asset.name}")
        print(f"Category: {category.name}")
        print(f"Status: {asset.status}")
        print(f"{'='*60}\n")
        
        return asset
    
    @staticmethod
    def update_asset(
        db: Session,
        asset_id: int,
        **updates
    ) -> models.Asset:
        """
        Update asset details.
        
        Note: Status cannot be updated through this method.
        Use transition_asset_status() for status changes.
        
        Args:
            db: Database session
            asset_id: Asset ID
            **updates: Fields to update
            
        Returns:
            Updated asset
            
        Raises:
            NotFoundError: If asset doesn't exist
            ValidationError: If trying to update status or tag
        """
        asset = db.query(models.Asset).filter(
            models.Asset.id == asset_id
        ).first()
        
        if not asset:
            raise NotFoundError(f"Asset with ID {asset_id} not found")
        
        # Prevent status change through update
        if 'status' in updates:
            raise ValidationError(
                "Cannot update status directly. "
                "Use asset_service.transition_asset_status() instead."
            )
        
        # Prevent tag change
        if 'tag' in updates:
            raise ValidationError(
                "Asset tag cannot be changed after creation."
            )
        
        # Validate category if being updated
        if 'category_id' in updates:
            category = db.query(models.AssetCategory).filter(
                models.AssetCategory.id == updates['category_id']
            ).first()
            if not category:
                raise NotFoundError(f"Category with ID {updates['category_id']} not found")
        
        # Validate location if being updated
        if 'location_id' in updates and updates['location_id']:
            location = db.query(models.Location).filter(
                models.Location.id == updates['location_id']
            ).first()
            if not location:
                raise NotFoundError(f"Location with ID {updates['location_id']} not found")
        
        # Check for duplicate serial number if being updated
        if 'serial_number' in updates and updates['serial_number']:
            existing = db.query(models.Asset).filter(
                models.Asset.serial_number == updates['serial_number'],
                models.Asset.id != asset_id
            ).first()
            if existing:
                raise ConflictError(
                    f"Asset with serial number '{updates['serial_number']}' already exists"
                )
        
        # Update fields
        for key, value in updates.items():
            if hasattr(asset, key):
                setattr(asset, key, value)
        
        db.commit()
        db.refresh(asset)
        
        return asset
    
    # ========================================================================
    # QUERY HELPERS
    # ========================================================================
    
    @staticmethod
    def get_available_assets(
        db: Session,
        category_id: Optional[int] = None,
        location_id: Optional[int] = None,
        department_id: Optional[int] = None,
        is_bookable: Optional[bool] = None
    ) -> List[models.Asset]:
        """
        Get assets available for allocation or booking.
        
        This is used by Allocation and Booking modules for dropdown population.
        Only returns assets in "Available" status.
        
        Args:
            db: Database session
            category_id: Optional category filter
            location_id: Optional location filter
            department_id: Optional department filter
            is_bookable: Optional bookable filter
            
        Returns:
            List of available assets
        """
        query = db.query(models.Asset).filter(
            models.Asset.status == "Available"
        )
        
        if category_id:
            query = query.filter(models.Asset.category_id == category_id)
        
        if location_id:
            query = query.filter(models.Asset.location_id == location_id)
        
        if department_id:
            query = query.filter(models.Asset.department_id == department_id)
        
        if is_bookable is not None:
            query = query.filter(models.Asset.is_bookable == is_bookable)
        
        return query.all()
    
    @staticmethod
    def search_assets(
        db: Session,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        status: Optional[str] = None,
        department_id: Optional[int] = None,
        location_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[models.Asset], int]:
        """
        Search and filter assets with pagination.
        
        All filters are combined with AND logic.
        
        Args:
            db: Database session
            search: Search term (matches tag, serial, name)
            category_id: Filter by category
            status: Filter by status
            department_id: Filter by department
            location_id: Filter by location
            skip: Pagination offset
            limit: Pagination limit
            
        Returns:
            Tuple of (assets list, total count)
        """
        query = db.query(models.Asset)
        
        # Search filter (matches tag, serial, name)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (models.Asset.tag.ilike(search_term)) |
                (models.Asset.serial_number.ilike(search_term)) |
                (models.Asset.name.ilike(search_term))
            )
        
        # Category filter
        if category_id:
            query = query.filter(models.Asset.category_id == category_id)
        
        # Status filter
        if status:
            query = query.filter(models.Asset.status == status)
        
        # Department filter
        if department_id:
            query = query.filter(models.Asset.department_id == department_id)
        
        # Location filter
        if location_id:
            query = query.filter(models.Asset.location_id == location_id)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        assets = query.offset(skip).limit(limit).all()
        
        return assets, total
    
    # ========================================================================
    # HISTORY QUERIES
    # ========================================================================
    
    @staticmethod
    def get_allocation_history(
        db: Session,
        asset_id: int
    ) -> List[models.Allocation]:
        """
        Get allocation history for an asset.
        
        Returns all allocations, newest first.
        Useful for tracking who has used the asset.
        
        Args:
            db: Database session
            asset_id: Asset ID
            
        Returns:
            List of allocations
        """
        return db.query(models.Allocation).filter(
            models.Allocation.asset_id == asset_id
        ).order_by(desc(models.Allocation.allocated_date)).all()
    
    @staticmethod
    def get_maintenance_history(
        db: Session,
        asset_id: int
    ) -> List[models.MaintenanceRequest]:
        """
        Get maintenance history for an asset.
        
        Returns all maintenance requests, newest first.
        Useful for tracking asset maintenance and issues.
        
        Args:
            db: Database session
            asset_id: Asset ID
            
        Returns:
            List of maintenance requests
        """
        return db.query(models.MaintenanceRequest).filter(
            models.MaintenanceRequest.asset_id == asset_id
        ).order_by(desc(models.MaintenanceRequest.created_at)).all()

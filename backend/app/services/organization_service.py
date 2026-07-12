"""Organization service - handles departments and categories business logic."""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from ..db import models
from ..core.errors import NotFoundError, ConflictError, ValidationError


class OrganizationService:
    """Service for organization, department, and category operations."""
    
    # ========================================================================
    # DEPARTMENT OPERATIONS
    # ========================================================================
    
    @staticmethod
    def create_department(
        db: Session,
        name: str,
        organization_id: int,
        description: Optional[str] = None,
        head_user_id: Optional[int] = None,
        parent_department_id: Optional[int] = None
    ) -> models.Department:
        """
        Create a new department.
        
        Validates:
        - Organization exists
        - Head user exists (if provided)
        - Parent department exists (if provided)
        - No circular reference
        """
        # Validate organization
        org = db.query(models.Organization).filter(
            models.Organization.id == organization_id
        ).first()
        if not org:
            raise NotFoundError(f"Organization with ID {organization_id} not found")
        
        # Validate head user if provided
        if head_user_id:
            head_user = db.query(models.User).filter(
                models.User.id == head_user_id
            ).first()
            if not head_user:
                raise NotFoundError(f"User with ID {head_user_id} not found")
        
        # Validate parent department if provided
        if parent_department_id:
            parent = db.query(models.Department).filter(
                models.Department.id == parent_department_id
            ).first()
            if not parent:
                raise NotFoundError(f"Parent department with ID {parent_department_id} not found")
        
        # Create department
        department = models.Department(
            name=name,
            description=description,
            organization_id=organization_id,
            head_user_id=head_user_id,
            parent_department_id=parent_department_id,
            status="Active"
        )
        
        db.add(department)
        db.commit()
        db.refresh(department)
        
        return department
    
    @staticmethod
    def update_department(
        db: Session,
        department_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        head_user_id: Optional[int] = None,
        parent_department_id: Optional[int] = None
    ) -> models.Department:
        """
        Update department details.
        
        Validates:
        - Department cannot be its own parent
        - No circular parent chains
        """
        department = db.query(models.Department).filter(
            models.Department.id == department_id
        ).first()
        
        if not department:
            raise NotFoundError(f"Department with ID {department_id} not found")
        
        # Validate parent department
        if parent_department_id is not None:
            # Cannot be its own parent
            if parent_department_id == department_id:
                raise ValidationError("Department cannot be its own parent")
            
            # Check if parent exists
            if parent_department_id != 0:  # 0 means remove parent
                parent = db.query(models.Department).filter(
                    models.Department.id == parent_department_id
                ).first()
                if not parent:
                    raise NotFoundError(f"Parent department with ID {parent_department_id} not found")
                
                # Check for circular reference
                if OrganizationService._would_create_circular_reference(
                    db, department_id, parent_department_id
                ):
                    raise ValidationError("Cannot set parent: would create circular reference")
        
        # Validate head user if provided
        if head_user_id is not None and head_user_id != 0:
            head_user = db.query(models.User).filter(
                models.User.id == head_user_id
            ).first()
            if not head_user:
                raise NotFoundError(f"User with ID {head_user_id} not found")
        
        # Update fields
        if name is not None:
            department.name = name
        if description is not None:
            department.description = description
        if head_user_id is not None:
            department.head_user_id = head_user_id if head_user_id != 0 else None
        if parent_department_id is not None:
            department.parent_department_id = parent_department_id if parent_department_id != 0 else None
        
        db.commit()
        db.refresh(department)
        
        return department
    
    @staticmethod
    def toggle_department_status(
        db: Session,
        department_id: int,
        status: str
    ) -> models.Department:
        """Toggle department status between Active/Inactive."""
        department = db.query(models.Department).filter(
            models.Department.id == department_id
        ).first()
        
        if not department:
            raise NotFoundError(f"Department with ID {department_id} not found")
        
        department.status = status
        db.commit()
        db.refresh(department)
        
        return department
    
    @staticmethod
    def _would_create_circular_reference(
        db: Session,
        department_id: int,
        parent_id: int,
        visited: Optional[set] = None
    ) -> bool:
        """
        Check if setting parent_id as parent would create a circular reference.
        Uses depth-first search to detect cycles.
        """
        if visited is None:
            visited = set()
        
        if parent_id in visited:
            return True  # Circular reference detected
        
        visited.add(parent_id)
        
        # Get parent's parent
        parent = db.query(models.Department).filter(
            models.Department.id == parent_id
        ).first()
        
        if not parent or not parent.parent_department_id:
            return False  # No more parents, no cycle
        
        # Check if any ancestor is the original department
        if parent.parent_department_id == department_id:
            return True
        
        # Recursively check up the chain
        return OrganizationService._would_create_circular_reference(
            db, department_id, parent.parent_department_id, visited
        )
    
    # ========================================================================
    # ASSET CATEGORY OPERATIONS
    # ========================================================================
    
    @staticmethod
    def create_category(
        db: Session,
        name: str,
        description: Optional[str] = None,
        extra_fields: Optional[List[Dict[str, Any]]] = None
    ) -> models.AssetCategory:
        """Create a new asset category with optional extra fields."""
        # Check if category with same name exists
        existing = db.query(models.AssetCategory).filter(
            models.AssetCategory.name == name
        ).first()
        
        if existing:
            raise ConflictError(f"Category with name '{name}' already exists")
        
        category = models.AssetCategory(
            name=name,
            description=description,
            extra_fields=extra_fields or [],
            status="Active"
        )
        
        db.add(category)
        db.commit()
        db.refresh(category)
        
        return category
    
    @staticmethod
    def update_category(
        db: Session,
        category_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        extra_fields: Optional[List[Dict[str, Any]]] = None
    ) -> models.AssetCategory:
        """Update asset category details."""
        category = db.query(models.AssetCategory).filter(
            models.AssetCategory.id == category_id
        ).first()
        
        if not category:
            raise NotFoundError(f"Category with ID {category_id} not found")
        
        # Check for name conflict if changing name
        if name and name != category.name:
            existing = db.query(models.AssetCategory).filter(
                models.AssetCategory.name == name,
                models.AssetCategory.id != category_id
            ).first()
            
            if existing:
                raise ConflictError(f"Category with name '{name}' already exists")
        
        # Update fields
        if name is not None:
            category.name = name
        if description is not None:
            category.description = description
        if extra_fields is not None:
            category.extra_fields = extra_fields
        
        db.commit()
        db.refresh(category)
        
        return category
    
    # ========================================================================
    # EMPLOYEE MANAGEMENT OPERATIONS
    # ========================================================================
    
    @staticmethod
    def update_user_role(
        db: Session,
        user_id: int,
        new_role: str,
        admin_user_id: int
    ) -> models.User:
        """
        Update user role.
        
        NOTE: This is the ONLY endpoint in the entire backend allowed to change
        a user's role. This is enforced by requiring Admin authentication at
        the router level and having no other service method that modifies role.
        
        Creates an activity log entry for audit trail.
        """
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not user:
            raise NotFoundError(f"User with ID {user_id} not found")
        
        old_role = user.role.value if hasattr(user.role, 'value') else user.role
        user.role = new_role
        
        db.commit()
        db.refresh(user)
        
        # Log activity (TODO: implement full activity logging system)
        # For now, create a simple activity log entry
        activity = models.Activity(
            user_id=admin_user_id,
            action="role_change",
            description=f"Changed role of {user.name} from {old_role} to {new_role}",
            resource_type="user",
            resource_id=user_id
        )
        db.add(activity)
        db.commit()
        
        print(f"\n{'='*60}")
        print(f"ROLE CHANGE LOGGED")
        print(f"{'='*60}")
        print(f"User: {user.name} ({user.email})")
        print(f"Role Change: {old_role} → {new_role}")
        print(f"Changed By: Admin User ID {admin_user_id}")
        print(f"{'='*60}\n")
        
        return user
    
    @staticmethod
    def update_user_status(
        db: Session,
        user_id: int,
        new_status: str
    ) -> models.User:
        """Update user account status (Active/Inactive)."""
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not user:
            raise NotFoundError(f"User with ID {user_id} not found")
        
        user.status = new_status
        db.commit()
        db.refresh(user)
        
        return user

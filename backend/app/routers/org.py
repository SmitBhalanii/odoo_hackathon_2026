"""Organization router - departments, categories, and employee management."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from ..core.deps import get_db, get_current_user, require_admin
from ..db import models
from ..schemas.organization import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse, DepartmentStatusUpdate,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    EmployeeListItem
)
from ..schemas.user import UserRoleUpdate, UserStatusUpdate, UserResponse
from ..schemas.common import PaginatedResponse
from ..services.organization_service import OrganizationService
from ..core.errors import NotFoundError

router = APIRouter(prefix="/org")


# ============================================================================
# DEPARTMENT ENDPOINTS
# ============================================================================

@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List all departments.
    
    Available to any authenticated user (needed for dropdowns in other screens).
    Returns departments with nested head object for display.
    """
    departments = db.query(models.Department).all()
    
    # Transform to include nested head object
    result = []
    for dept in departments:
        dept_dict = {
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "organization_id": dept.organization_id,
            "head_user_id": dept.head_user_id,
            "head": None,
            "parent_department_id": dept.parent_department_id,
            "status": dept.status,
            "created_at": dept.created_at,
            "updated_at": dept.updated_at
        }
        
        # Add nested head object if head exists
        if dept.head:
            dept_dict["head"] = {
                "id": dept.head.id,
                "name": dept.head.name,
                "email": dept.head.email
            }
        
        result.append(dept_dict)
    
    return result


@router.post("/departments", response_model=DepartmentResponse, dependencies=[Depends(require_admin)])
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Create a new department (Admin only).
    
    Request body:
    - **name**: Department name (required)
    - **organization_id**: Organization ID (required)
    - **description**: Optional description
    - **head_user_id**: Optional department head user ID
    - **parent_department_id**: Optional parent department ID
    
    Validations:
    - Organization must exist
    - Head user must exist (if provided)
    - Parent department must exist (if provided)
    - Cannot create circular parent references
    """
    dept = OrganizationService.create_department(
        db=db,
        name=department.name,
        organization_id=department.organization_id,
        description=department.description,
        head_user_id=department.head_user_id,
        parent_department_id=department.parent_department_id
    )
    
    # Format response with nested head
    response = DepartmentResponse.model_validate(dept)
    if dept.head:
        response.head = {
            "id": dept.head.id,
            "name": dept.head.name,
            "email": dept.head.email
        }
    
    return response


@router.put("/departments/{department_id}", response_model=DepartmentResponse, dependencies=[Depends(require_admin)])
def update_department(
    department_id: int,
    department: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Update department details (Admin only).
    
    Validations:
    - Department cannot be its own parent
    - No circular parent chains allowed
    - Head user must exist (if provided)
    """
    dept = OrganizationService.update_department(
        db=db,
        department_id=department_id,
        name=department.name,
        description=department.description,
        head_user_id=department.head_user_id,
        parent_department_id=department.parent_department_id
    )
    
    # Format response with nested head
    response = DepartmentResponse.model_validate(dept)
    if dept.head:
        response.head = {
            "id": dept.head.id,
            "name": dept.head.name,
            "email": dept.head.email
        }
    
    return response


@router.patch("/departments/{department_id}/status", response_model=DepartmentResponse, dependencies=[Depends(require_admin)])
def toggle_department_status(
    department_id: int,
    status_update: DepartmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Toggle department status between Active/Inactive (Admin only).
    
    Request body:
    - **status**: "Active" or "Inactive"
    """
    dept = OrganizationService.toggle_department_status(
        db=db,
        department_id=department_id,
        status=status_update.status
    )
    
    # Format response with nested head
    response = DepartmentResponse.model_validate(dept)
    if dept.head:
        response.head = {
            "id": dept.head.id,
            "name": dept.head.name,
            "email": dept.head.email
        }
    
    return response


# ============================================================================
# ASSET CATEGORY ENDPOINTS
# ============================================================================

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List all asset categories.
    
    Available to any authenticated user (needed for dropdowns in Asset screens).
    """
    categories = db.query(models.AssetCategory).all()
    return categories


@router.post("/categories", response_model=CategoryResponse, dependencies=[Depends(require_admin)])
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Create a new asset category (Admin only).
    
    Request body:
    - **name**: Category name (required, must be unique)
    - **description**: Optional description
    - **extra_fields**: Optional list of extra field definitions
    
    Extra field format:
    ```json
    {
      "field_name": "warranty_period",
      "field_type": "text",
      "required": false
    }
    ```
    
    Supported field types: text, number, date, boolean, select
    """
    # Convert Pydantic models to dicts for storage
    extra_fields = None
    if category.extra_fields:
        extra_fields = [field.model_dump() for field in category.extra_fields]
    
    cat = OrganizationService.create_category(
        db=db,
        name=category.name,
        description=category.description,
        extra_fields=extra_fields
    )
    
    return cat


@router.put("/categories/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_admin)])
def update_category(
    category_id: int,
    category: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Update asset category details (Admin only).
    
    Can update name, description, and extra_fields.
    Name must remain unique.
    """
    # Convert Pydantic models to dicts for storage
    extra_fields = None
    if category.extra_fields is not None:
        extra_fields = [field.model_dump() for field in category.extra_fields]
    
    cat = OrganizationService.update_category(
        db=db,
        category_id=category_id,
        name=category.name,
        description=category.description,
        extra_fields=extra_fields
    )
    
    return cat


# ============================================================================
# EMPLOYEE MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/employees", response_model=List[EmployeeListItem], dependencies=[Depends(require_admin)])
def list_employees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Get full employee directory with role and status (Admin only).
    
    Returns all users with their department information.
    Used for employee management screen.
    """
    users = db.query(models.User).all()
    
    result = []
    for user in users:
        user_dict = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "status": user.status.value if hasattr(user.status, 'value') else user.status,
            "department_id": user.department_id,
            "department_name": user.department.name if user.department else None,
            "created_at": user.created_at
        }
        result.append(user_dict)
    
    return result


@router.patch("/employees/{user_id}/role", response_model=UserResponse, dependencies=[Depends(require_admin)])
def update_employee_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Update employee role (Admin only).
    
    ⚠️ CRITICAL: This is the ONLY endpoint in the entire backend that is
    allowed to change a user's role. This restriction is enforced by:
    1. Admin-only access (require_admin dependency)
    2. No other service/endpoint modifies the role field
    3. Signup always creates users as "Employee"
    
    Request body:
    - **role**: New role ("Admin" | "Asset Manager" | "Department Head" | "Employee")
    
    An activity log entry is created every time this is called for audit trail.
    """
    user = OrganizationService.update_user_role(
        db=db,
        user_id=user_id,
        new_role=role_update.role,
        admin_user_id=current_user.id
    )
    
    return user


@router.patch("/employees/{user_id}/status", response_model=UserResponse, dependencies=[Depends(require_admin)])
def update_employee_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Update employee account status (Admin only).
    
    Request body:
    - **status**: "Active" or "Inactive"
    
    Inactive users cannot login.
    """
    user = OrganizationService.update_user_status(
        db=db,
        user_id=user_id,
        new_status=status_update.status
    )
    
    return user

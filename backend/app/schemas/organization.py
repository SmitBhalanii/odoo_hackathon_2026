"""Organization, Department, and Category schemas."""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============================================================================
# DEPARTMENT SCHEMAS
# ============================================================================

class DepartmentBase(BaseModel):
    """Base department schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    """Schema for creating a department."""
    organization_id: int
    head_user_id: Optional[int] = None
    parent_department_id: Optional[int] = None
    
    @field_validator('parent_department_id')
    @classmethod
    def validate_parent(cls, v):
        """Ensure parent_department_id is not the same as the department being created."""
        # Note: The check for self-reference is done in the service layer
        # where we have access to the department's ID
        return v


class DepartmentUpdate(BaseModel):
    """Schema for updating a department."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    head_user_id: Optional[int] = None
    parent_department_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class DepartmentStatusUpdate(BaseModel):
    """Schema for updating department status."""
    status: str = Field(..., pattern="^(Active|Inactive)$")


class DepartmentHead(BaseModel):
    """Schema for department head user info."""
    id: int
    name: str
    email: str
    
    model_config = ConfigDict(from_attributes=True)


class DepartmentResponse(DepartmentBase):
    """Schema for department response with nested head object."""
    id: int
    organization_id: int
    head_user_id: Optional[int] = None
    head: Optional[DepartmentHead] = None  # Nested head object instead of just ID
    parent_department_id: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# ASSET CATEGORY SCHEMAS
# ============================================================================

class ExtraField(BaseModel):
    """Schema for extra field definition."""
    field_name: str = Field(..., min_length=1)
    field_type: str = Field(..., pattern="^(text|number|date|boolean|select)$")
    options: Optional[List[str]] = None  # For select type
    required: Optional[bool] = False


class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    extra_fields: Optional[List[ExtraField]] = []


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    extra_fields: Optional[List[ExtraField]] = None
    
    model_config = ConfigDict(from_attributes=True)


class CategoryResponse(CategoryBase):
    """Schema for category response."""
    id: int
    extra_fields: List[Dict[str, Any]]
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# EMPLOYEE MANAGEMENT SCHEMAS
# ============================================================================

class EmployeeListItem(BaseModel):
    """Schema for employee in the full directory listing."""
    id: int
    name: str
    email: str
    role: str
    status: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

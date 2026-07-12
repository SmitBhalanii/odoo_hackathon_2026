"""Asset schemas for request/response validation."""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Dict, Any, List
from datetime import date, datetime
from decimal import Decimal


# ============================================================================
# ASSET SCHEMAS
# ============================================================================

class AssetBase(BaseModel):
    """Base asset schema with common fields."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: int
    condition: str = Field(..., pattern="^(New|Good|Fair|Poor)$")


class AssetCreate(AssetBase):
    """
    Schema for creating a new asset.
    
    NOTE: asset_tag is auto-generated server-side and should NOT be sent.
    If sent, it will be ignored. This is a business rule.
    """
    serial_number: Optional[str] = None
    acquisition_date: date
    acquisition_cost: float = Field(..., gt=0)
    location_id: Optional[int] = None
    department_id: Optional[int] = None
    photo_url: Optional[str] = None
    is_bookable: bool = False
    extra_field_values: Optional[Dict[str, Any]] = {}
    
    model_config = ConfigDict(extra="forbid")  # Reject unknown fields like 'tag'


class AssetUpdate(BaseModel):
    """
    Schema for updating an asset.
    
    NOTE: status and tag cannot be updated through this endpoint.
    - Status changes via state machine only
    - Tag is immutable after creation
    """
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    serial_number: Optional[str] = None
    condition: Optional[str] = Field(None, pattern="^(New|Good|Fair|Poor)$")
    acquisition_date: Optional[date] = None
    acquisition_cost: Optional[float] = Field(None, gt=0)
    location_id: Optional[int] = None
    department_id: Optional[int] = None
    photo_url: Optional[str] = None
    is_bookable: Optional[bool] = None
    extra_field_values: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class AssetStatusTransition(BaseModel):
    """
    Schema for transitioning asset status.
    
    Uses the state machine for validation.
    """
    new_status: str = Field(
        ...,
        pattern="^(Available|Allocated|Reserved|Under Maintenance|Lost|Retired|Disposed)$"
    )
    notes: Optional[str] = Field(None, max_length=500)


class AssetResponse(AssetBase):
    """Schema for asset response with all fields."""
    id: int
    tag: str
    serial_number: Optional[str] = None
    status: str
    acquisition_date: date
    acquisition_cost: float
    location_id: Optional[int] = None
    department_id: Optional[int] = None
    photo_url: Optional[str] = None
    is_bookable: bool
    extra_field_values: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AssetWithRelations(AssetResponse):
    """Asset response with related objects included."""
    category: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, Any]] = None
    department: Optional[Dict[str, Any]] = None


class AssetListItem(BaseModel):
    """Lightweight asset schema for list views."""
    id: int
    tag: str
    name: str
    category_id: int
    category_name: Optional[str] = None
    status: str
    condition: str
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    is_bookable: bool
    
    model_config = ConfigDict(from_attributes=True)


class ValidTransitionsResponse(BaseModel):
    """Response showing valid status transitions."""
    current_status: str
    valid_transitions: List[str]


# ============================================================================
# ALLOCATION HISTORY SCHEMA
# ============================================================================

class AllocationHistoryItem(BaseModel):
    """Schema for allocation history entry."""
    id: int
    user_id: int
    user_name: str
    allocated_date: date
    expected_return_date: Optional[date] = None
    actual_return_date: Optional[date] = None
    status: str
    allocation_notes: Optional[str] = None
    return_notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# MAINTENANCE HISTORY SCHEMA
# ============================================================================

class MaintenanceHistoryItem(BaseModel):
    """Schema for maintenance history entry."""
    id: int
    requester_id: int
    requester_name: str
    issue_description: str
    priority: str
    status: str
    scheduled_date: Optional[date] = None
    completed_date: Optional[date] = None
    cost: Optional[float] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

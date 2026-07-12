"""Audit schemas for request/response validation."""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import date, datetime


# ============================================================================
# AUDIT CYCLE SCHEMAS
# ============================================================================

class AuditCycleCreate(BaseModel):
    """Schema for creating an audit cycle."""
    title: str = Field(..., min_length=1, max_length=255)
    scope_department_id: Optional[int] = None
    scope_location: Optional[str] = Field(None, max_length=255)
    start_date: date
    end_date: date
    auditor_ids: List[int] = Field(..., min_items=1)
    
    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        """Validate end_date is after start_date."""
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v
    
    model_config = ConfigDict(extra="forbid")


class AuditCycleResponse(BaseModel):
    """Schema for audit cycle response."""
    id: int
    title: str
    scope_department_id: Optional[int] = None
    scope_location: Optional[str] = None
    start_date: date
    end_date: date
    status: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AuditCycleWithDetails(AuditCycleResponse):
    """Audit cycle with nested auditors and results."""
    creator: Optional[dict] = None
    scope_department: Optional[dict] = None
    auditors: List[dict] = []
    results: List[dict] = []
    stats: Optional[dict] = None  # Summary statistics


class AuditCycleListItem(BaseModel):
    """Lightweight audit cycle schema for list views."""
    id: int
    title: str
    start_date: date
    end_date: date
    status: str
    created_by: int
    creator_name: Optional[str] = None
    auditor_count: int = 0
    total_assets: int = 0
    verified_count: int = 0
    missing_count: int = 0
    damaged_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# AUDIT ASSIGNMENT SCHEMAS
# ============================================================================

class AuditAssignmentResponse(BaseModel):
    """Schema for audit assignment response."""
    id: int
    audit_cycle_id: int
    auditor_id: int
    auditor: Optional[dict] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# AUDIT RESULT SCHEMAS
# ============================================================================

class AuditResultUpdate(BaseModel):
    """Schema for updating audit result (marking asset)."""
    result: str = Field(..., pattern="^(Verified|Missing|Damaged)$")
    notes: Optional[str] = Field(None, max_length=1000)
    
    model_config = ConfigDict(extra="forbid")


class AuditResultResponse(BaseModel):
    """Schema for audit result response."""
    id: int
    audit_cycle_id: int
    asset_id: int
    expected_location: Optional[str] = None
    result: Optional[str] = None
    notes: Optional[str] = None
    marked_by: Optional[int] = None
    marked_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AuditResultWithAsset(AuditResultResponse):
    """Audit result with asset details."""
    asset: Optional[dict] = None
    marker: Optional[dict] = None


class AuditDiscrepancyItem(BaseModel):
    """Schema for audit discrepancy (non-verified assets)."""
    id: int
    asset_id: int
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    expected_location: Optional[str] = None
    result: str
    notes: Optional[str] = None
    marked_by: Optional[int] = None
    marker_name: Optional[str] = None
    marked_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

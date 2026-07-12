"""Maintenance schemas for request/response validation."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime


class MaintenanceRequestCreate(BaseModel):
    """Schema for creating a maintenance request."""
    asset_id: int
    issue_description: str = Field(..., min_length=1, max_length=2000)
    priority: str = Field(..., pattern="^(Low|Medium|High|Critical)$")
    photo_url: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(extra="forbid")


class MaintenanceRequestResponse(BaseModel):
    """Schema for maintenance request response."""
    id: int
    asset_id: int
    raised_by: int
    issue_description: str
    priority: str
    photo_url: Optional[str] = None
    status: str
    technician_name: Optional[str] = None
    approved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    scheduled_date: Optional[date] = None
    completed_date: Optional[date] = None
    service_provider: Optional[str] = None
    cost: Optional[float] = None
    maintenance_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class MaintenanceRequestWithRelations(MaintenanceRequestResponse):
    """Maintenance request with related objects."""
    asset: Optional[dict] = None
    requester: Optional[dict] = None
    approver: Optional[dict] = None


class MaintenanceRequestListItem(BaseModel):
    """Lightweight maintenance request schema for list views (Kanban)."""
    id: int
    asset_id: int
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    raised_by: int
    requester_name: Optional[str] = None
    issue_description: str
    priority: str
    status: str
    technician_name: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AssignTechnicianRequest(BaseModel):
    """Schema for assigning technician to maintenance request."""
    technician_name: str = Field(..., min_length=1, max_length=255)


class RejectMaintenanceRequest(BaseModel):
    """Schema for rejecting maintenance request."""
    rejection_reason: Optional[str] = Field(None, max_length=500)


class ResolveMaintenanceRequest(BaseModel):
    """Schema for resolving maintenance request."""
    resolution_notes: Optional[str] = Field(None, max_length=2000)
    cost: Optional[float] = Field(None, ge=0)

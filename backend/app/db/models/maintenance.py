"""Maintenance Request model - asset maintenance tracking."""

from sqlalchemy import Column, Integer, String, Text, Date, Float, Enum as SQLEnum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class MaintenanceStatus(str, enum.Enum):
    """Maintenance request status enumeration."""
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    TECHNICIAN_ASSIGNED = "TechnicianAssigned"
    IN_PROGRESS = "InProgress"
    RESOLVED = "Resolved"


class MaintenancePriority(str, enum.Enum):
    """Maintenance priority enumeration."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class MaintenanceRequest(Base, TimestampMixin):
    """
    Maintenance Request model for tracking asset maintenance and repairs.
    """
    __tablename__ = "maintenance_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Asset and requester
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    raised_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Request details
    issue_description = Column(Text, nullable=False)
    priority = Column(SQLEnum(MaintenancePriority), nullable=False, default=MaintenancePriority.MEDIUM)
    photo_url = Column(String(500), nullable=True)
    
    # Status and workflow
    status = Column(SQLEnum(MaintenanceStatus), nullable=False, default=MaintenanceStatus.PENDING, index=True)
    
    # Technician assignment
    technician_name = Column(String(255), nullable=True)
    
    # Approval tracking
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Resolution
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Scheduling (kept from original)
    scheduled_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    
    # Service details (kept from original)
    service_provider = Column(String(255), nullable=True)
    cost = Column(Float, nullable=True)
    maintenance_notes = Column(Text, nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="maintenance_requests")
    requester = relationship("User", back_populates="maintenance_requests", foreign_keys=[raised_by])
    approver = relationship("User", foreign_keys=[approved_by])
    
    def __repr__(self):
        return f"<MaintenanceRequest(id={self.id}, asset_id={self.asset_id}, status={self.status})>"

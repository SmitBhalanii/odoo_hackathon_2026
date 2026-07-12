"""Maintenance Request model - asset maintenance tracking."""

from sqlalchemy import Column, Integer, String, Text, Date, Float, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class MaintenanceStatus(str, enum.Enum):
    """Maintenance request status enumeration."""
    PENDING = "Pending"
    APPROVED = "Approved"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


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
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Request details
    issue_description = Column(Text, nullable=False)
    priority = Column(SQLEnum(MaintenancePriority), nullable=False, default=MaintenancePriority.MEDIUM)
    status = Column(SQLEnum(MaintenanceStatus), nullable=False, default=MaintenanceStatus.PENDING, index=True)
    
    # Scheduling
    scheduled_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    
    # Service details
    service_provider = Column(String(255), nullable=True)
    cost = Column(Float, nullable=True)
    
    # Notes and resolution
    maintenance_notes = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Approval tracking
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="maintenance_requests")
    requester = relationship("User", back_populates="maintenance_requests", foreign_keys=[requester_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    
    def __repr__(self):
        return f"<MaintenanceRequest(id={self.id}, asset_id={self.asset_id}, status={self.status})>"

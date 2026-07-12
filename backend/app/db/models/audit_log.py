"""Audit Log model - security and compliance tracking."""

from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship

from ..base import Base, TimestampMixin


class AuditLog(Base, TimestampMixin):
    """
    Audit Log model for tracking all system actions for security and compliance.
    Records who did what, when, and on which resource.
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who performed the action
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # What action was performed
    action = Column(String(100), nullable=False, index=True)  # e.g., "create_asset", "update_allocation"
    
    # Which resource was affected
    resource_type = Column(String(50), nullable=False, index=True)  # e.g., "asset", "user", "booking"
    resource_id = Column(Integer, nullable=True, index=True)
    
    # Details about the action
    description = Column(Text, nullable=True)
    
    # Before/after snapshot (for updates)
    changes = Column(JSON, nullable=True)  # {"old": {...}, "new": {...}}
    
    # Request metadata
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User")
    
    # Composite index for common queries
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
    )
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action={self.action}, resource={self.resource_type}:{self.resource_id})>"

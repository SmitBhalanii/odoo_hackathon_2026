"""Notification model - user notifications system."""

from sqlalchemy import Column, Integer, String, Text, Boolean, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class NotificationType(str, enum.Enum):
    """Notification type enumeration."""
    ASSET_ASSIGNED = "asset_assigned"
    ASSET_RETURNED = "asset_returned"
    TRANSFER_PENDING = "transfer_pending"
    TRANSFER_APPROVED = "transfer_approved"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_REMINDER = "booking_reminder"
    MAINTENANCE_APPROVED = "maintenance_approved"
    MAINTENANCE_COMPLETED = "maintenance_completed"
    RETURN_REMINDER = "return_reminder"
    OVERDUE_ALERT = "overdue_alert"
    SYSTEM_ALERT = "system_alert"


class Notification(Base, TimestampMixin):
    """
    Notification model for in-app user notifications.
    Supports different notification types and read/unread tracking.
    """
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Recipient
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Notification details
    type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Read status
    read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(Integer, nullable=True)  # Timestamp when read (using created_at for now)
    
    # Optional: Link to related resource
    resource_type = Column(String(50), nullable=True)  # "asset", "booking", "allocation", etc.
    resource_id = Column(Integer, nullable=True)
    
    # Optional: Action URL to navigate to
    action_url = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    # Composite index for common queries
    __table_args__ = (
        Index('idx_notification_user_read', 'user_id', 'read'),
    )
    
    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, read={self.read})>"

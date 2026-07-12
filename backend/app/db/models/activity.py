"""Activity model - recent activity feed."""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index
from sqlalchemy.orm import relationship

from ..base import Base, TimestampMixin


class Activity(Base, TimestampMixin):
    """
    Activity model for tracking recent activities in the system.
    Used for activity feeds and timeline displays.
    """
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who performed the activity
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Activity type/action
    action = Column(String(100), nullable=False, index=True)  # "allocated", "transfer", "booking", etc.
    
    # Human-readable description
    description = Column(Text, nullable=False)
    
    # Related resource
    resource_type = Column(String(50), nullable=True)  # "asset", "booking", etc.
    resource_id = Column(Integer, nullable=True)
    
    # Relationships
    user = relationship("User")
    
    # Index for recent activity queries (ordered by created_at DESC)
    __table_args__ = (
        Index('idx_activity_created', 'created_at'),
    )
    
    def __repr__(self):
        return f"<Activity(id={self.id}, action={self.action}, user_id={self.user_id})>"

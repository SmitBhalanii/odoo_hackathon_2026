"""Booking model - resource reservation system."""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class BookingStatus(str, enum.Enum):
    """Booking status enumeration."""
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    ACTIVE = "Active"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Booking(Base, TimestampMixin):
    """
    Booking model for reserving bookable assets/resources.
    Supports time-slot based reservations.
    """
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Asset and user
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Booking time slot
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    
    # Purpose and details
    purpose = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    status = Column(SQLEnum(BookingStatus), nullable=False, default=BookingStatus.PENDING, index=True)
    
    # Approval tracking
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_notes = Column(Text, nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    
    def __repr__(self):
        return f"<Booking(id={self.id}, asset_id={self.asset_id}, user_id={self.user_id}, status={self.status})>"

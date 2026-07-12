"""Allocation model - tracks asset assignments to users."""

from sqlalchemy import Column, Integer, String, Text, Date, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class AllocationStatus(str, enum.Enum):
    """Allocation status enumeration."""
    PENDING = "Pending"
    ACTIVE = "Active"
    RETURNED = "Returned"
    OVERDUE = "Overdue"
    CANCELLED = "Cancelled"


class TransferStatus(str, enum.Enum):
    """Transfer status enumeration."""
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    COMPLETED = "Completed"


class Allocation(Base, TimestampMixin):
    """
    Allocation model tracking asset assignments to users.
    Supports transfers between users and return tracking.
    """
    __tablename__ = "allocations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Asset and user
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Allocation details
    allocated_date = Column(Date, nullable=False)
    expected_return_date = Column(Date, nullable=True)
    actual_return_date = Column(Date, nullable=True)
    
    status = Column(SQLEnum(AllocationStatus), nullable=False, default=AllocationStatus.PENDING, index=True)
    
    # Notes and remarks
    allocation_notes = Column(Text, nullable=True)
    return_notes = Column(Text, nullable=True)
    
    # Who allocated and who approved
    allocated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Transfer tracking (if this is a transfer from another user)
    is_transfer = Column(Integer, default=0, nullable=False)  # SQLite doesn't have Boolean, use 0/1
    transfer_from_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    transfer_status = Column(SQLEnum(TransferStatus), nullable=True)
    transfer_notes = Column(Text, nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="allocations")
    user = relationship("User", back_populates="allocations", foreign_keys=[user_id])
    allocated_by = relationship("User", foreign_keys=[allocated_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    transfer_from_user = relationship("User", foreign_keys=[transfer_from_user_id])
    
    def __repr__(self):
        return f"<Allocation(id={self.id}, asset_id={self.asset_id}, user_id={self.user_id}, status={self.status})>"

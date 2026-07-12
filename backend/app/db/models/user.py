"""User model - system users with authentication and authorization."""

from sqlalchemy import Column, Integer, String, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    """User role enumeration."""
    ADMIN = "Admin"
    ASSET_MANAGER = "Asset Manager"
    DEPARTMENT_HEAD = "Department Head"
    EMPLOYEE = "Employee"


class UserStatus(str, enum.Enum):
    """User account status enumeration."""
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    SUSPENDED = "Suspended"


class User(Base, TimestampMixin):
    """
    User model representing system users.
    Handles authentication, authorization, and user profile information.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    status = Column(SQLEnum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    
    # Optional: Link user to department
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    # Relationships
    department = relationship("Department", back_populates="users", foreign_keys=[department_id])
    allocations = relationship("Allocation", back_populates="user", foreign_keys="Allocation.user_id")
    bookings = relationship("Booking", back_populates="user")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="requester")
    notifications = relationship("Notification", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

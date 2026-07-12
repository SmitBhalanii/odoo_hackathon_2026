"""Organization, Department, and Location models."""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class Organization(Base, TimestampMixin):
    """
    Organization model representing the company/organization.
    Typically only one record exists per installation.
    """
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    
    # Relationships
    departments = relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="organization", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Organization(id={self.id}, name={self.name})>"


class DepartmentStatus(str, enum.Enum):
    """Department status enumeration."""
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class Department(Base, TimestampMixin):
    """
    Department model representing organizational departments.
    Supports hierarchical structure with parent departments.
    """
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    
    # Department head
    head_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Hierarchical structure - parent department
    parent_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    # Status
    status = Column(String(50), nullable=False, default="Active")
    
    # Relationships
    organization = relationship("Organization", back_populates="departments")
    head = relationship("User", foreign_keys=[head_user_id], backref="headed_department")
    users = relationship("User", back_populates="department", foreign_keys="[User.department_id]")
    assets = relationship("Asset", back_populates="department")
    
    # Self-referential relationship for parent department
    parent = relationship("Department", remote_side=[id], foreign_keys=[parent_department_id])
    
    def __repr__(self):
        return f"<Department(id={self.id}, name={self.name}, status={self.status})>"


class Location(Base, TimestampMixin):
    """
    Location model representing physical locations within the organization.
    """
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(Text, nullable=True)
    building = Column(String(100), nullable=True)
    floor = Column(String(50), nullable=True)
    room = Column(String(50), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="locations")
    assets = relationship("Asset", back_populates="location")
    
    def __repr__(self):
        return f"<Location(id={self.id}, name={self.name})>"

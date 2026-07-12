"""Asset model - core asset tracking entity."""

from sqlalchemy import Column, Integer, String, Text, Float, Date, Boolean, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class AssetStatus(str, enum.Enum):
    """Asset status enumeration."""
    AVAILABLE = "Available"
    ALLOCATED = "Allocated"
    RESERVED = "Reserved"
    UNDER_MAINTENANCE = "Under Maintenance"
    LOST = "Lost"
    RETIRED = "Retired"
    DISPOSED = "Disposed"


class AssetCondition(str, enum.Enum):
    """Asset condition enumeration."""
    NEW = "New"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"


class Asset(Base, TimestampMixin):
    """
    Asset model representing physical or digital assets.
    Core entity for asset management system.
    """
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Unique asset tag (e.g., AF-0001)
    tag = Column(String(50), unique=True, nullable=False, index=True)
    
    # Basic information
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    serial_number = Column(String(255), nullable=True, index=True)
    
    # Category and classification
    category_id = Column(Integer, ForeignKey("asset_categories.id"), nullable=False)
    
    # Status and condition
    status = Column(SQLEnum(AssetStatus), nullable=False, default=AssetStatus.AVAILABLE, index=True)
    condition = Column(SQLEnum(AssetCondition), nullable=False, default=AssetCondition.GOOD)
    
    # Financial information
    acquisition_date = Column(Date, nullable=True)
    acquisition_cost = Column(Float, nullable=True)
    
    # Location tracking
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    # Photo/image URL
    photo_url = Column(String(500), nullable=True)
    
    # QR code data (can store encoded tag or additional info)
    qr_code_data = Column(String(500), nullable=True)
    
    # Bookable flag - can this asset be reserved/booked?
    bookable = Column(Boolean, default=False, nullable=False)
    
    # Category-specific extra field values
    # Stored as JSON object: {"warranty_period": "2 years", "processor_type": "Intel i7"}
    extra_field_values = Column(JSON, nullable=True, default=dict)
    
    # Relationships
    category = relationship("AssetCategory", back_populates="assets")
    location = relationship("Location", back_populates="assets")
    department = relationship("Department", back_populates="assets")
    allocations = relationship("Allocation", back_populates="asset", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="asset", cascade="all, delete-orphan")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="asset", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Asset(id={self.id}, tag={self.tag}, name={self.name}, status={self.status})>"

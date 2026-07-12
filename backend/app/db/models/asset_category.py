"""Asset Category model - defines types of assets with custom fields."""

from sqlalchemy import Column, Integer, String, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class CategoryStatus(str, enum.Enum):
    """Category status enumeration."""
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class AssetCategory(Base, TimestampMixin):
    """
    Asset Category model defining types of assets.
    Supports custom extra_fields for category-specific attributes.
    extra_fields format: [{"field_name": "warranty_period", "field_type": "text"}, ...]
    """
    __tablename__ = "asset_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # Custom fields specific to this category
    # Stored as JSON array: [{"field_name": "warranty_period", "field_type": "text"}, ...]
    extra_fields = Column(JSON, nullable=True, default=list)
    
    status = Column(SQLEnum(CategoryStatus), nullable=False, default=CategoryStatus.ACTIVE)
    
    # Relationships
    assets = relationship("Asset", back_populates="category")
    
    def __repr__(self):
        return f"<AssetCategory(id={self.id}, name={self.name}, status={self.status})>"

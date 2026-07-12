"""SQLAlchemy declarative base and timestamp mixin."""

from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlalchemy.orm import declarative_base, declared_attr

# Create declarative base
Base = declarative_base()


class TimestampMixin:
    """
    Mixin class that adds created_at and updated_at timestamp columns.
    All models should inherit from this to track record creation and modification times.
    """
    
    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.utcnow, nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

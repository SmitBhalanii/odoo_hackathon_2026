"""Common schema utilities and base classes."""

from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, ConfigDict


# Generic type for paginated responses
T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    items: List[T]
    total: int
    skip: int
    limit: int
    
    model_config = ConfigDict(from_attributes=True)


class SuccessResponse(BaseModel):
    """Standard success response."""
    success: bool = True
    message: str
    
    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    
    model_config = ConfigDict(from_attributes=True)

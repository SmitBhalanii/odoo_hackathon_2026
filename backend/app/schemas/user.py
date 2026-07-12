"""User schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., pattern="^(Admin|Asset Manager|Department Head|Employee)$")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=6)
    department_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[str] = Field(None, pattern="^(Admin|Asset Manager|Department Head|Employee)$")
    status: Optional[str] = Field(None, pattern="^(Active|Inactive|Suspended)$")
    department_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    status: str
    department_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str


class UserLoginResponse(BaseModel):
    """Schema for login response with token."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    
    model_config = ConfigDict(from_attributes=True)

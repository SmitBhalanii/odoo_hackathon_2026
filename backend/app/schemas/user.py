"""User schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """
    Schema for creating a new user via signup.
    NOTE: role is NOT accepted here - it's always set to Employee server-side.
    This is a hard business rule for security.
    """
    password: str = Field(..., min_length=6)
    department_id: Optional[int] = None
    
    # Explicitly exclude role from being set during signup
    model_config = ConfigDict(extra="forbid")


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = Field(None, pattern="^(Active|Inactive|Suspended)$")
    department_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserRoleUpdate(BaseModel):
    """
    Schema for updating user role.
    This is the ONLY way to change a user's role in the system.
    """
    role: str = Field(..., pattern="^(Admin|Asset Manager|Department Head|Employee)$")
    
    model_config = ConfigDict(from_attributes=True)


class UserStatusUpdate(BaseModel):
    """Schema for updating user status."""
    status: str = Field(..., pattern="^(Active|Inactive|Suspended)$")
    
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    role: str
    status: str
    department_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserWithDepartment(UserResponse):
    """User response with department details."""
    department: Optional[dict] = None


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


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Schema for forgot password response."""
    message: str = "If that email exists, a reset link was sent."


class ResetPasswordRequest(BaseModel):
    """Schema for reset password request."""
    token: str
    new_password: str = Field(..., min_length=6)


class ResetPasswordResponse(BaseModel):
    """Schema for reset password response."""
    message: str = "Password has been reset successfully."

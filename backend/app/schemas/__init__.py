"""Schemas package initialization."""

from .user import (
    UserCreate, UserUpdate, UserResponse, UserLogin, UserLoginResponse,
    ForgotPasswordRequest, ForgotPasswordResponse,
    ResetPasswordRequest, ResetPasswordResponse
)
from .organization import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse
)
from .asset import (
    AssetCreate, AssetUpdate, AssetResponse, AssetListItem
)
from .maintenance import (
    MaintenanceRequestCreate, MaintenanceRequestResponse,
    MaintenanceRequestListItem
)
from .audit import (
    AuditCycleCreate, AuditCycleResponse, AuditCycleListItem,
    AuditResultUpdate, AuditResultResponse
)
from .common import PaginatedResponse

__all__ = [
    # User schemas
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "UserLoginResponse",
    "ForgotPasswordRequest",
    "ForgotPasswordResponse",
    "ResetPasswordRequest",
    "ResetPasswordResponse",
    
    # Organization schemas
    "DepartmentCreate",
    "DepartmentUpdate",
    "DepartmentResponse",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    
    # Asset schemas
    "AssetCreate",
    "AssetUpdate",
    "AssetResponse",
    "AssetListItem",
    
    # Maintenance schemas
    "MaintenanceRequestCreate",
    "MaintenanceRequestResponse",
    "MaintenanceRequestListItem",
    
    # Audit schemas
    "AuditCycleCreate",
    "AuditCycleResponse",
    "AuditCycleListItem",
    "AuditResultUpdate",
    "AuditResultResponse",
    
    # Common schemas
    "PaginatedResponse",
]
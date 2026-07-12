"""Custom exception classes for the application."""


class AssetFlowError(Exception):
    """Base exception for all AssetFlow errors."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class NotFoundError(AssetFlowError):
    """Raised when a requested resource is not found."""
    pass


class ConflictError(AssetFlowError):
    """Raised when an operation conflicts with current state."""
    pass


class PermissionError(AssetFlowError):
    """Raised when a user lacks permission for an operation."""
    pass


class ValidationError(AssetFlowError):
    """Raised when input validation fails."""
    pass


class AuthenticationError(AssetFlowError):
    """Raised when authentication fails."""
    pass
